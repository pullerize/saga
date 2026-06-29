import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

// Служебные имена формул, которые НЕ являются ценовыми компонентами:
// «Ширина двери» — промежуточный расчёт; «Стекло (м²)» — цена из GlassType.
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

function slugifyKey(s: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",
    л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",
    ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `comp_${Date.now()}`;
}

// Гарантирует наличие ценового компонента под имя из формулы. Компонент = строка
// спецификации с ценой за единицу; количество считает формула. Если компонент
// уже есть (точное/нормализованное совпадение по имени) или имя служебное —
// ничего не делаем. Новый создаётся с ценой 0 (задаётся в /admin/prices).
async function ensureComponentForFormula(componentName: string) {
  const name = componentName.trim();
  if (!name || NON_COMPONENT_FORMULA_NAMES.has(name)) return;
  try {
    const comps = await prisma.component.findMany({ select: { name: true } });
    const target = normalizeName(name);
    const exists = comps.some((c) => c.name === name || normalizeName(c.name) === target);
    if (exists) return;
    let key = slugifyKey(name);
    if (await prisma.component.findUnique({ where: { key } })) key = `${key}_${Date.now().toString(36).slice(-4)}`;
    await prisma.component.create({
      data: { key, name, unit: "шт", category: "component", defaultPrice: 0 },
    });
  } catch {
    // ignore — компонент опционален, формула уже сохранена
  }
}

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const items = await prisma.systemFormula.findMany({
    orderBy: [{ systemName: "asc" }, { subsystemName: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(items);
}

export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { id, formula, componentName, useOpenWidth } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: { formula?: string; componentName?: string; useOpenWidth?: boolean } = {};
  if (formula !== undefined) data.formula = String(formula);
  if (componentName !== undefined) {
    const trimmed = String(componentName).trim();
    if (!trimmed) return NextResponse.json({ error: "componentName cannot be empty" }, { status: 400 });
    data.componentName = trimmed;
  }
  if (useOpenWidth !== undefined) data.useOpenWidth = !!useOpenWidth;
  // Авто-определение из текста формулы — если флаг не задан явно, но в тексте
  // упомянута «(открытая часть)» — считаем формулу open-width вариантом.
  // Аналогично «(полностью)» → false. Тогда галочку не надо ставить вручную.
  if (data.useOpenWidth === undefined && data.formula !== undefined) {
    const t = data.formula;
    if (/\(открытая\s+часть\)/i.test(t)) data.useOpenWidth = true;
    else if (/\(полностью\)/i.test(t)) data.useOpenWidth = false;
  }

  // Узнаём текущее имя — нужно для миграции SystemPrice при переименовании.
  const current = await prisma.systemFormula.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Формула не найдена" }, { status: 404 });
  const oldName = current.componentName;
  const newName = data.componentName;
  const willRename = newName !== undefined && newName !== oldName;

  try {
    const item = await prisma.systemFormula.update({ where: { id }, data });
    if (data.componentName) await ensureComponentForFormula(data.componentName);

    // Переносим SystemPrice со старого имени на новое — иначе цена,
    // которую админ выставил для этой формулы, остаётся осиротевшей,
    // а под новым именем создаётся компонент с defaultPrice=0 и в КП
    // его цена становится 0.
    if (willRename && newName) {
      // На всякий случай чистим возможный конфликтующий ряд под новым именем
      // (например, если такой SystemPrice уже создавали вручную).
      await prisma.systemPrice.deleteMany({
        where: { systemName: current.systemName, componentName: newName },
      });
      await prisma.systemPrice.updateMany({
        where: { systemName: current.systemName, componentName: oldName },
        data: { componentName: newName },
      });
    }
    return NextResponse.json(item);
  } catch (err) {
    // Prisma P2002 — нарушение уникального индекса (formulaName уже занят
    // в этой системе+подсистеме). Возвращаем конкретное сообщение, чтобы
    // пользователь видел причину, а не молчаливое «не сохранилось».
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Формула с таким именем уже есть в этой системе. Возьмите другое имя." },
        { status: 409 },
      );
    }
    console.error("[system-formulas] PUT error:", err);
    return NextResponse.json({ error: "Не удалось обновить формулу" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const systemName = String(body.systemName || "").trim();
  const subsystemName = String(body.subsystemName || "").trim();
  const componentName = String(body.componentName || "").trim();
  const formula = String(body.formula || "").trim();
  // Авто-определение useOpenWidth из текста формулы при создании.
  let useOpenWidth = !!body.useOpenWidth;
  if (body.useOpenWidth === undefined && /\(открытая\s+часть\)/i.test(formula)) {
    useOpenWidth = true;
  }
  if (!systemName || !subsystemName || !componentName || !formula) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }
  try {
    const count = await prisma.systemFormula.count({
      where: { systemName, subsystemName },
    });
    const item = await prisma.systemFormula.create({
      data: { systemName, subsystemName, componentName, formula, sortOrder: count, useOpenWidth },
    });
    // Компонент из формулы должен попадать в «Цены» (цена за единицу).
    await ensureComponentForFormula(componentName);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать формулу" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.systemFormula.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}
