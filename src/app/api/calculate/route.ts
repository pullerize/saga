import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateFormula } from "@/lib/calculations/formulaParser";

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
  const body = await req.json();
  const { systemSlug, subsystemName, fullWidth, openWidth, height, glass, shotlan } = body;

  const systemName = SLUG_TO_NAME[systemSlug];
  if (!systemName) {
    return NextResponse.json({ source: "legacy" });
  }

  // Load formulas from SystemFormula table
  const dbFormulas = await prisma.systemFormula.findMany({
    where: { systemName, subsystemName },
    orderBy: { sortOrder: "asc" },
  });

  // Also load "Общие" formulas
  const commonFormulas = await prisma.systemFormula.findMany({
    where: { systemName: "Общие" },
  });

  if (dbFormulas.length === 0) {
    return NextResponse.json({ source: "legacy" });
  }

  // Load subsystem params from DoorSystem
  const system = await prisma.doorSystem.findUnique({
    where: { slug: systemSlug },
    include: { subsystems: true },
  });
  const sub = system?.subsystems.find((s) => s.name === subsystemName);
  const params = (sub?.params as Record<string, number>) ?? {};

  // Load param definitions for label mapping
  const paramDefs = await prisma.paramDefinition.findMany();
  const paramLabels: Record<string, string> = {};
  paramDefs.forEach((d) => { paramLabels[d.key] = d.label.trim(); });

  // Load component prices
  const dbComponents = await prisma.component.findMany();
  const componentPrices: Record<string, number> = {};
  const componentNames: Record<string, string> = {};
  dbComponents.forEach((c) => {
    componentPrices[c.key] = c.defaultPrice;
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

  // Step 1: Calculate door width first
  let doorWidth = 0;
  const dwFormula = formulaMap["Ширина двери"];
  if (dwFormula) {
    doorWidth = evaluateFormula(dwFormula, vars);
    // Round: floor, then +1 if remainder > 0.4
    const floored = Math.floor(doorWidth);
    doorWidth = (doorWidth - floored > 0.4) ? floored + 1 : floored;
  } else {
    const numDoors = params.num_doors || params.doors || 1;
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
      price = matchedComp.defaultPrice;
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
        const price = compMatch?.defaultPrice ?? (shotlanComps[key] || 0);
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
