import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.component.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, defaultPrice } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const item = await prisma.component.update({
    where: { id },
    data: { defaultPrice },
  });
  return NextResponse.json(item);
}

const ALLOWED_CATEGORIES = ["component", "glass", "service", "shotlan"];

export async function POST(req: Request) {
  const body = await req.json();
  const key = String(body.key || "").trim();
  const name = String(body.name || "").trim();
  if (!key || !name) {
    return NextResponse.json({ error: "key и name обязательны" }, { status: 400 });
  }
  const category = ALLOWED_CATEGORIES.includes(body.category) ? body.category : "component";
  const existing = await prisma.component.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({ error: "Компонент с таким ключом уже существует" }, { status: 409 });
  }
  const count = await prisma.component.count();
  const item = await prisma.component.create({
    data: {
      key,
      name,
      unit: body.unit?.trim() || "шт",
      category,
      defaultPrice: Number(body.defaultPrice) || 0,
      sortOrder: count,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.component.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
