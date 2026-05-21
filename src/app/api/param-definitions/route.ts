import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

// Характеристики (ParamDefinition) — это переменные/параметры для формул,
// а НЕ ценовые позиции. Компоненты («Цены») создаются отдельно в /admin/prices.
// Поэтому при создании/изменении характеристики компонент НЕ создаётся.

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
