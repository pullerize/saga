import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const items = await prisma.glassType.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name обязателен" }, { status: 400 });
  const price = Number(body.defaultPrice ?? 0);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
  }
  try {
    const count = await prisma.glassType.count();
    const item = await prisma.glassType.create({
      data: { name, defaultPrice: price, sortOrder: count },
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
  if (data.defaultPrice !== undefined && (!Number.isFinite(data.defaultPrice) || data.defaultPrice < 0)) {
    return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
  }
  try {
    const item = await prisma.glassType.update({
      where: { id },
      data: {
        name: data.name,
        defaultPrice: data.defaultPrice,
        imageUrl: data.imageUrl ?? undefined,
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
    await prisma.glassType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}
