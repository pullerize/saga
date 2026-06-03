import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateFormula } from "@/lib/calculations/formulaParser";
import { requireAuth } from "@/lib/auth-helpers";
import { rateLimit } from "@/lib/rate-limit";

// Map slugs to system names in SystemFormula table
const SLUG_TO_NAME: Record<string, string> = {
  cascade: "Каскадные двери",
  sync: "Синхронные двери",
  unlinked: "Не связанные между собой двери",
  "embedded-wall": "Пуш двери",
  angle: "Двери с угловым примыканием",
  "wall-mounted": "Настенные двери",
  partition: "Стена перегородка",
  harmoshka: "Гармошки",
  pivot: "Pivot",
};

export async function POST(req: Request) {
  const limited = rateLimit("calculate", req, { limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const { error, session } = await requireAuth();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { systemSlug, subsystemName, fullWidth, openWidth, height, glass, shotlan } = body;
  // Базовая валидация входов: всё, что должно быть числом — должно быть числом и в разумных пределах.
  for (const [k, v] of Object.entries({ fullWidth, openWidth, height })) {
    if (v !== undefined && v !== null && (!Number.isFinite(v) || v < 0 || v > 50000)) {
      return NextResponse.json({ error: `Некорректное значение поля ${k}` }, { status: 400 });
    }
  }
  if (typeof systemSlug !== "string" || !systemSlug) {
    return NextResponse.json({ error: "systemSlug обязателен" }, { status: 400 });
  }
  if (subsystemName !== undefined && typeof subsystemName !== "string") {
    return NextResponse.json({ error: "subsystemName должен быть строкой" }, { status: 400 });
  }

  // Имя системы для поиска формул. Для встроенных систем берём из SLUG_TO_NAME
  // (там имя в таблице формул может отличаться от DoorSystem.name), для новых —
  // из БД по slug. Раньше использовался только хардкод, поэтому новые системы
  // (которых нет в SLUG_TO_NAME) всегда уходили в legacy и не считались.
  const system = await prisma.doorSystem.findUnique({
    where: { slug: systemSlug },
    include: { subsystems: true },
  });
  const systemName = SLUG_TO_NAME[systemSlug] ?? system?.name;
  if (!systemName) {
    return NextResponse.json({ source: "legacy" });
  }

  // Load formulas from SystemFormula table.
  // Формулы концептуально работают для ВСЕХ подсистем системы (свои params у
  // каждой подсистемы дают свой результат). Если для конкретной подсистемы
  // формул нет (например, добавили только на одну) — берём набор любой
  // подсистемы этой системы, дедуплицируем по componentName.
  let dbFormulas = await prisma.systemFormula.findMany({
    where: { systemName, subsystemName },
    orderBy: { sortOrder: "asc" },
  });
  if (dbFormulas.length === 0) {
    const anySub = await prisma.systemFormula.findMany({
      where: { systemName },
      orderBy: { sortOrder: "asc" },
    });
    const seen = new Set<string>();
    dbFormulas = anySub.filter((f) => {
      if (seen.has(f.componentName)) return false;
      seen.add(f.componentName);
      return true;
    });
  }

  // Also load "Общие" formulas
  const commonFormulas = await prisma.systemFormula.findMany({
    where: { systemName: "Общие" },
  });

  if (dbFormulas.length === 0) {
    return NextResponse.json({ source: "legacy" });
  }

  const sub = system?.subsystems.find((s) => s.name === subsystemName);
  const params = (sub?.params as Record<string, number>) ?? {};

  // Load param definitions for label mapping
  const paramDefs = await prisma.paramDefinition.findMany();
  const paramLabels: Record<string, string> = {};
  paramDefs.forEach((d) => { paramLabels[d.key] = d.label.trim(); });

  // Переопределения цен компании текущего пользователя. Если у его компании
  // задана своя цена компонента — используется она, иначе Component.defaultPrice.
  // Так партнёрские цены применяются только к карточкам их компании.
  let companyId: string | null = null;
  if (session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, companyName: true },
    });
    companyId = u?.companyId ?? null;
    if (!companyId && u?.companyName) {
      const byName = await prisma.company.findUnique({ where: { name: u.companyName }, select: { id: true } });
      companyId = byName?.id ?? null;
    }
  }
  const priceOverride: Record<string, number> = {}; // componentId → price
  if (companyId) {
    const rows = await prisma.companyPrice.findMany({ where: { companyId } });
    rows.forEach((r) => { priceOverride[r.componentId] = r.price; });
  }
  // Системные цены: один и тот же компонент в разных системах может стоить
  // разные деньги. Ключ — имя компонента из формулы.
  const systemPriceMap: Record<string, number> = {}; // componentName → price
  const systemPrices = await prisma.systemPrice.findMany({ where: { systemName } });
  systemPrices.forEach((p) => { systemPriceMap[p.componentName] = p.price; });
  // Эффективная цена: CompanyPrice (партнёр) → SystemPrice (этой системы) →
  // Component.defaultPrice (глобальная база). formulaName — имя из формулы,
  // нужно для системного оверрайда.
  const effectivePrice = (c: { id: string; defaultPrice: number }, formulaName?: string) =>
    priceOverride[c.id] ?? (formulaName ? systemPriceMap[formulaName] : undefined) ?? c.defaultPrice;

  // Load component prices
  const dbComponents = await prisma.component.findMany();
  const componentPrices: Record<string, number> = {};
  const componentNames: Record<string, string> = {};
  dbComponents.forEach((c) => {
    componentPrices[c.key] = effectivePrice(c);
    componentNames[c.key] = c.name;
  });

  // Normalize string for comparison: strip units, lowercase, normalize chars
  function normalize(s: string): string {
    return s
      .replace(/\([^)]*\)/g, "") // remove (6м), (1м), (1шт) etc.
      .replace(/[^а-яА-Яa-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/клеющ/g, "клеящ"); // normalize spelling variants
  }

  // Build fuzzy name→component lookup
  function findComponent(name: string) {
    // Exact match
    let match = dbComponents.find((c) => c.name === name);
    if (match) return match;
    // Normalized match (ignoring units in parentheses)
    const norm = normalize(name);
    match = dbComponents.find((c) => normalize(c.name) === norm);
    if (match) return match;
    // Starts-with on normalized (use longer prefix to avoid false matches)
    match = dbComponents.find((c) => {
      const cn = normalize(c.name);
      return norm.startsWith(cn.substring(0, 30)) || cn.startsWith(norm.substring(0, 30));
    });
    if (match) return match;
    // Key words match (first 3 significant words)
    const words = norm.split(" ").filter(w => w.length > 2).slice(0, 3);
    if (words.length >= 2) {
      match = dbComponents.find((c) => {
        const cn = normalize(c.name);
        return words.every(w => cn.includes(w));
      });
    }
    return match || null;
  }

  // Build variable context
  const vars: Record<string, number> = {
    "Ширина проёма (открытая часть)": openWidth || fullWidth,
    "Ширина проёма (полностью)": fullWidth,
    "Высота проёма": height,
  };

  // Add all subsystem params by label AND key
  for (const [key, value] of Object.entries(params)) {
    const label = paramLabels[key]?.trim();
    if (label) vars[label] = Number(value);
    vars[key] = Number(value);
  }

  // Also map component names from DB to param values
  // (formulas reference full component names like "Механизм для двигающейся двери, доводчик (комплект на 1 дверь)")
  for (const comp of dbComponents) {
    // Check if there's a subsystem param matching this component
    for (const [key, value] of Object.entries(params)) {
      const label = paramLabels[key]?.trim();
      if (label && comp.name.startsWith(label.substring(0, 30))) {
        vars[comp.name] = Number(value);
      }
    }
  }

  // Build formula map: componentName → formula
  const formulaMap: Record<string, string> = {};
  for (const f of dbFormulas) {
    formulaMap[f.componentName] = f.formula;
  }

  // Resolve "number of doors" — handle multiple key conventions (engine code uses
  // num_doors / doors, but DB params are transliterated like kol_vo_dverey)
  function resolveNumDoors(): number {
    const candidates = [
      params.num_doors,
      params.doors,
      params.kol_vo_dverey,
      vars["Кол-во дверей"],
    ];
    for (const c of candidates) {
      const n = Number(c);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 1;
  }
  const numDoors = resolveNumDoors();

  // Step 1: Calculate door width first
  let doorWidth = 0;
  const dwFormula = formulaMap["Ширина двери"];
  if (dwFormula) {
    doorWidth = evaluateFormula(dwFormula, vars);
    // Round: floor, then +1 if remainder > 0.4
    const floored = Math.floor(doorWidth);
    doorWidth = (doorWidth - floored > 0.4) ? floored + 1 : floored;
  } else {
    // Fallback when no door-width formula is defined for the subsystem
    doorWidth = Math.floor(fullWidth / numDoors);
  }
  vars["Ширина двери"] = doorWidth;

  // Step 2: Evaluate all component formulas
  const components: Array<{
    key: string;
    name: string;
    qty: number;
    price: number;
    sum: number;
    unit: string;
    group: string;
  }> = [];

  // Shotlan-related component names (these come from ShotlanOption, skip in subsystem formulas)
  const SHOTLAN_COMP_MARKERS = ["Разделительный профиль", "Дополнительный уплотнитель", "Дополнительные болты для креплений", "Специальный скотч"];

  for (const f of dbFormulas) {
    if (f.componentName === "Ширина двери") continue;

    // Skip shotlan components — they are calculated from ShotlanOption below
    const isShotlanComp = SHOTLAN_COMP_MARKERS.some((s) => f.componentName.includes(s));
    if (isShotlanComp) continue;

    let qty = evaluateFormula(f.formula, vars);

    // Store result in vars (for formulas that reference other results)
    vars[f.componentName] = qty;

    if (qty <= 0) continue;

    // Find price by matching component name to DB components
    let price = 0;
    let unit = "шт";
    const matchedComp = findComponent(f.componentName);
    if (matchedComp) {
      price = effectivePrice(matchedComp, f.componentName);
    }

    const sum = Math.round(qty * price * 100) / 100;
    qty = Math.round(qty * 100) / 100;

    components.push({
      key: matchedComp?.key || f.componentName,
      name: f.componentName,
      qty,
      price,
      sum,
      unit,
      group: "component",
    });
  }

  // Step 3: Common formulas (Glass, Installation, Logistics)
  for (const cf of commonFormulas) {
    let qty = evaluateFormula(cf.formula, vars);
    if (qty <= 0) continue;

    let price = 0;
    let unit = "шт";

    if (cf.componentName === "Стекло (м²)") {
      let glassType = await prisma.glassType.findUnique({ where: { name: glass } });
      if (!glassType) glassType = await prisma.glassType.findFirst({ where: { name: { contains: glass.substring(0, 5) } } });
      price = glassType?.defaultPrice ?? 0;
      unit = "м²";
    } else if (cf.componentName === "Сборка/установка") {
      price = componentPrices["installation"] ?? 80;
      unit = "м²";
    } else if (cf.componentName.includes("логистик") || cf.componentName.includes("Доп расходы")) {
      price = componentPrices["logistics"] ?? 50;
    }

    qty = Math.round(qty * 100) / 100;
    const sum = Math.round(qty * price * 100) / 100;

    const group = cf.componentName === "Стекло (м²)" ? "glass" : "extra";

    components.push({
      key: cf.componentName,
      name: cf.componentName === "Стекло (м²)" ? `Стекло (${glass})` : cf.componentName,
      qty,
      price,
      sum,
      unit,
      group,
    });
  }

  // Step 4: Shotlan components
  let shotlanOpt = await prisma.shotlanOption.findUnique({ where: { name: shotlan } });
  // Fallback: try partial match if exact fails (encoding issues)
  if (!shotlanOpt && shotlan && shotlan !== "Без шотланок") {
    shotlanOpt = await prisma.shotlanOption.findFirst({
      where: { name: { contains: shotlan.substring(0, 10) } },
    });
  }
  if (shotlanOpt?.components) {
    const shotlanComps = shotlanOpt.components as Record<string, number>;
    const shotlanFormulas = (shotlanOpt.formulas as Record<string, string>) ?? {};
    const shotlanResults: Record<string, number> = {};

    // First pass
    for (const [key] of Object.entries(shotlanComps)) {
      const formula = shotlanFormulas[key];
      if (formula) {
        const qty = evaluateFormula(formula, vars);
        shotlanResults[key] = qty;
        const label = paramLabels[key] || componentNames[key] || key;
        vars[label] = qty;
        vars[key] = qty;
      }
    }

    // Second pass (for cross-references)
    for (const [key] of Object.entries(shotlanComps)) {
      const formula = shotlanFormulas[key];
      if (formula) {
        shotlanResults[key] = evaluateFormula(formula, vars);
      }
    }

    for (const [key] of Object.entries(shotlanComps)) {
      const qty = shotlanResults[key] ?? 0;
      if (qty > 0) {
        // Get price from Component table — match by key, or by name via paramLabels
        let compMatch = dbComponents.find((c) => c.key === key);
        if (!compMatch) {
          const label = paramLabels[key]?.trim();
          if (label) compMatch = findComponent(label) ?? undefined;
        }
        const price = (compMatch ? effectivePrice(compMatch) : undefined) ?? (shotlanComps[key] || 0);
        const sum = Math.round(qty * price * 100) / 100;
        // Use paramLabels for display name (more accurate than fuzzy-matched component name)
        const displayName = paramLabels[key]?.trim() || compMatch?.name || componentNames[key] || key;
        components.push({
          key,
          name: displayName,
          qty: Math.round(qty * 100) / 100,
          price,
          sum,
          unit: "шт",
          group: "shotlan",
        });
      }
    }
  }

  const total = components.reduce((acc, c) => acc + c.sum, 0);

  return NextResponse.json({
    source: "formula",
    components,
    total: Math.round(total * 100) / 100,
    doorWidth,
  });
}
