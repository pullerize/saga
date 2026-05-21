import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

// Категория характеристики → категория компонента в «Ценах».
function paramCategoryToComponent(cat: string): string {
  return cat === "shotlan" ? "shotlan" : "component";
}

// Создаёт компонент в «Ценах» под новую характеристику, если такого ещё нет
// (по ключу ИЛИ по имени). Цена в расчёте подтягивается по имени компонента,
// поэтому name = label характеристики. Не падаем, если создать не удалось —
// характеристика всё равно сохраняется.
async function ensureComponentForParam(key: string, label: string, category: string, price: unknown) {
  try {
    const exists = await prisma.component.findFirst({
      where: { OR: [{ key }, { name: label }] },
    });
    if (exists) return;
    await prisma.component.create({
      data: {
        key,
        name: label,
        unit: "шт",
        category: paramCategoryToComponent(category),
        defaultPrice: typeof price === "number" && Number.isFinite(price) ? price : 0,
      },
    });
  } catch {
    // ignore — компонент опционален, характеристика уже создана
  }
}

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const items = await prisma.paramDefinition.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const key = String(body.key || "").trim();
  const label = String(body.label || "").trim();
  if (!key || !label) {
    return NextResponse.json({ error: "key и label обязательны" }, { status: 400 });
  }
  const existing = await prisma.paramDefinition.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({ error: `Характеристика с ключом "${key}" уже существует` }, { status: 409 });
  }
  try {
    const item = await prisma.paramDefinition.create({
      data: {
        key,
        label,
        category: body.category ?? "general",
        price: body.price ?? null,
        formula: body.formula ?? null,
      },
    });
    // Авто-создание компонента в «Ценах», чтобы новую характеристику можно было
    // сразу оценить (цена 0 по умолчанию).
    await ensureComponentForParam(key, label, item.category, body.price);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const item = await prisma.paramDefinition.update({
      where: { id },
      data: {
        key: data.key,
        label: data.label,
        category: data.category,
        price: data.price ?? null,
        formula: data.formula ?? null,
      },
    });
    // Если есть связанный компонент (по ключу) — синхронизируем имя, чтобы цена
    // продолжала находиться по имени в расчёте. Цену компонента НЕ трогаем.
    if (data.key && data.label) {
      try {
        await prisma.component.updateMany({
          where: { key: data.key },
          data: { name: data.label },
        });
      } catch { /* ignore */ }
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Не удалось обновить" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.paramDefinition.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}
