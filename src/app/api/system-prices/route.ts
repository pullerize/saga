import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, requireAuth } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

function noStore(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Имена, которые НЕ являются ценовыми позициями (служебные интермедиаты).
const NON_COMPONENT_FORMULA_NAMES = new Set(["Ширина двери", "Стекло (м²)"]);

function normalizeName(s: string): string {
  return s
    .replace(/\([^)]*\)/g, "")
    .replace(/[^а-яА-Яa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

// GET — компоненты из формул, сгруппированные по системе, с эффективной ценой.
// Цена = SystemPrice (если есть) либо Component.defaultPrice.
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const components = await prisma.component.findMany({ where: { isActive: true } });
  const byExactName = new Map<string, (typeof components)[number]>();
  const byNormName = new Map<string, (typeof components)[number]>();
  for (const c of components) {
    byExactName.set(c.name, c);
    const n = normalizeName(c.name);
    if (!byNormName.has(n)) byNormName.set(n, c);
  }
  const findComp = (name: string) =>
    byExactName.get(name) ?? byNormName.get(normalizeName(name)) ?? null;

  const formulas = await prisma.systemFormula.findMany({
    select: { systemName: true, componentName: true },
  });

  const systemPrices = await prisma.systemPrice.findMany();
  // (systemName, componentName) → price
  const overrides = new Map<string, number>();
  systemPrices.forEach((p) => overrides.set(`${p.systemName}::${p.componentName}`, p.price));

  type Item = {
    componentId: string;
    componentName: string; // имя из формулы (ключ переопределения)
    name: string; // имя компонента
    unit: string;
    category: string;
    defaultPrice: number;
    price: number;
    isOverride: boolean;
  };

  const bySystem = new Map<string, Map<string, Item>>();
  for (const f of formulas) {
    if (NON_COMPONENT_FORMULA_NAMES.has(f.componentName)) continue;
    const comp = findComp(f.componentName);
    if (!comp) continue;
    if (!bySystem.has(f.systemName)) bySystem.set(f.systemName, new Map());
    const m = bySystem.get(f.systemName)!;
    // Уникальность — по имени из формулы (это и есть ключ SystemPrice).
    if (m.has(f.componentName)) continue;
    const override = overrides.get(`${f.systemName}::${f.componentName}`);
    m.set(f.componentName, {
      componentId: comp.id,
      componentName: f.componentName,
      name: comp.name,
      unit: comp.unit,
      category: comp.category,
      defaultPrice: comp.defaultPrice,
      price: override ?? comp.defaultPrice,
      isOverride: override !== undefined,
    });
  }

  const systems = Array.from(bySystem.entries())
    .map(([name, m]) => ({
      name,
      components: Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name, "ru")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return noStore({ systems });
}

// PUT — задать/обновить цену компонента в конкретной системе. ADMIN only.
// Body: { systemName, componentName, price }. Если price === Component.defaultPrice
// — переопределение удаляется (используется базовая).
export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const systemName = String(body?.systemName ?? "").trim();
  const componentName = String(body?.componentName ?? "").trim();
  const price = Number(body?.price);
  if (!systemName || !componentName) {
    return noStore({ error: "systemName и componentName обязательны" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
    return noStore({ error: "Некорректная цена" }, { status: 400 });
  }

  // Резолвим компонент, чтобы знать defaultPrice (для очистки совпадающих).
  const components = await prisma.component.findMany({ where: { isActive: true }, select: { name: true, defaultPrice: true } });
  const exact = components.find((c) => c.name === componentName);
  const norm = exact
    ? exact
    : components.find((c) => normalizeName(c.name) === normalizeName(componentName));
  const defaultPrice = norm?.defaultPrice;

  try {
    if (defaultPrice !== undefined && price === defaultPrice) {
      await prisma.systemPrice.deleteMany({ where: { systemName, componentName } });
      return noStore({ ok: true, price, isOverride: false });
    }
    await prisma.systemPrice.upsert({
      where: { systemName_componentName: { systemName, componentName } },
      create: { systemName, componentName, price },
      update: { price },
    });
    return noStore({ ok: true, price, isOverride: true });
  } catch {
    return noStore({ error: "Не удалось сохранить цену" }, { status: 500 });
  }
}

// DELETE — сбросить цену системы к базовой (?systemName=...&componentName=...).
export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const systemName = searchParams.get("systemName");
  const componentName = searchParams.get("componentName");
  if (!systemName || !componentName) {
    return noStore({ error: "systemName и componentName обязательны" }, { status: 400 });
  }
  await prisma.systemPrice.deleteMany({ where: { systemName, componentName } });
  return noStore({ ok: true });
}
