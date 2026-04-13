import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.paramDefinition.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const existing = await prisma.paramDefinition.findUnique({ where: { key: body.key } });
  if (existing) {
    return NextResponse.json({ error: `Характеристика с ключом "${body.key}" уже существует` }, { status: 409 });
  }
  const item = await prisma.paramDefinition.create({
    data: { key: body.key, label: body.label, category: body.category ?? "general", price: body.price ?? null, formula: body.formula ?? null },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const item = await prisma.paramDefinition.update({
    where: { id },
    data: { key: data.key, label: data.label, category: data.category, price: data.price ?? null, formula: data.formula ?? null },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.paramDefinition.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
