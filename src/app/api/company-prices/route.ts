import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// Резолвит companyId текущего пользователя: по companyId, иначе по companyName.
async function resolveCompanyId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true, companyName: true },
  });
  if (!user) return null;
  if (user.companyId) return user.companyId;
  if (user.companyName) {
    const byName = await prisma.company.findUnique({
      where: { name: user.companyName },
      select: { id: true },
    });
    return byName?.id ?? null;
  }
  return null;
}

function noStore(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Нормализация имени для сопоставления (как в /api/calculate): убираем единицы
// в скобках, спецсимволы, регистр, ё→е.
function normalizeName(s: string): string {
  return s
    .replace(/\([^)]*\)/g, "")
    .replace(/[^а-яА-Яa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

// Имена формул, которые НЕ являются ценовыми компонентами (служебные/интермедиаты).
const NON_PRICED_FORMULA_NAMES = new Set(["Ширина двери", "Стекло (м²)"]);

// GET — компоненты из формул, сгруппированные по системе, с эффективной ценой
// для компании текущего пользователя. Цена по умолчанию = как у админа
// (Component.defaultPrice); переопределение компании показывается, если задано.
export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const companyId = await resolveCompanyId(session!.user.id);

  // Переопределения компании.
  const overrides: Record<string, number> = {};
  if (companyId) {
    const rows = await prisma.companyPrice.findMany({ where: { companyId } });
    rows.forEach((r) => { overrides[r.componentId] = r.price; });
  }

  // Все компоненты + индекс по нормализованному имени для сопоставления.
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

  const toItem = (c: (typeof components)[number]) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    unit: c.unit,
    category: c.category,
    defaultPrice: c.defaultPrice,
    price: overrides[c.id] ?? c.defaultPrice,
    isOverride: overrides[c.id] !== undefined,
  });

  // Формулы → имена компонентов по системам.
  const formulas = await prisma.systemFormula.findMany({
    select: { systemName: true, componentName: true },
  });

  // systemName → упорядоченный уникальный список компонентов (резолв в Component).
  const bySystem = new Map<string, Map<string, ReturnType<typeof toItem>>>();
  for (const f of formulas) {
    if (NON_PRICED_FORMULA_NAMES.has(f.componentName)) continue;
    const comp = findComp(f.componentName);
    if (!comp) continue; // нет ценового компонента — пропускаем
    if (!bySystem.has(f.systemName)) bySystem.set(f.systemName, new Map());
    const m = bySystem.get(f.systemName)!;
    if (!m.has(comp.id)) m.set(comp.id, toItem(comp));
  }

  const systems = Array.from(bySystem.entries())
    .map(([name, m]) => ({
      name,
      components: Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name, "ru")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return noStore({ companyId, systems });
}

// PUT — задать/обновить цену компонента для компании текущего пользователя.
// Body: { componentId, price }. Если price === defaultPrice — переопределение
// удаляется (возврат к базовой цене).
export async function PUT(req: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const companyId = await resolveCompanyId(session!.user.id);
  if (!companyId) {
    return noStore({ error: "У пользователя нет компании" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const componentId = String(body?.componentId ?? "");
  const price = Number(body?.price);
  if (!componentId) return noStore({ error: "componentId обязателен" }, { status: 400 });
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
    return noStore({ error: "Некорректная цена" }, { status: 400 });
  }

  const component = await prisma.component.findUnique({ where: { id: componentId } });
  if (!component) return noStore({ error: "Компонент не найден" }, { status: 404 });

  try {
    // Если цена совпадает с базовой — удаляем переопределение (чистота данных).
    if (price === component.defaultPrice) {
      await prisma.companyPrice.deleteMany({ where: { companyId, componentId } });
      return noStore({ ok: true, price, isOverride: false });
    }
    await prisma.companyPrice.upsert({
      where: { companyId_componentId: { companyId, componentId } },
      create: { companyId, componentId, price },
      update: { price },
    });
    return noStore({ ok: true, price, isOverride: true });
  } catch {
    return noStore({ error: "Не удалось сохранить цену" }, { status: 500 });
  }
}

// DELETE — сбросить цену компонента к базовой (?componentId=...).
export async function DELETE(req: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const companyId = await resolveCompanyId(session!.user.id);
  if (!companyId) return noStore({ error: "У пользователя нет компании" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const componentId = searchParams.get("componentId");
  if (!componentId) return noStore({ error: "componentId обязателен" }, { status: 400 });

  await prisma.companyPrice.deleteMany({ where: { companyId, componentId } });
  return noStore({ ok: true });
}
