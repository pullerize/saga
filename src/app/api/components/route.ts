import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

// Не кэшируем: список компонентов меняется (новые из формул, правки цен) и должен
// сразу отражаться в /admin/prices.
export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const items = await prisma.component.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { id, defaultPrice } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (defaultPrice !== undefined && (typeof defaultPrice !== "number" || defaultPrice < 0)) {
    return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
  }
  try {
    const item = await prisma.component.update({ where: { id }, data: { defaultPrice } });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Не удалось обновить" }, { status: 500 });
  }
}

const ALLOWED_CATEGORIES = ["component", "glass", "service", "shotlan"];

export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const key = String(body.key || "").trim();
  const name = String(body.name || "").trim();
  if (!key || !name) {
    return NextResponse.json({ error: "key и name обязательны" }, { status: 400 });
  }
  const category = ALLOWED_CATEGORIES.includes(body.category) ? body.category : "component";
  const price = Number(body.defaultPrice);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
  }
  const existing = await prisma.component.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({ error: "Компонент с таким ключом уже существует" }, { status: 409 });
  }
  try {
    const count = await prisma.component.count();
    const item = await prisma.component.create({
      data: {
        key,
        name,
        unit: String(body.unit || "").trim() || "шт",
        category,
        defaultPrice: price,
        sortOrder: count,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.component.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}
