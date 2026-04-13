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

export async function POST(req: Request) {
  const body = await req.json();
  const count = await prisma.component.count();
  const item = await prisma.component.create({
    data: {
      key: body.key,
      name: body.name,
      unit: body.unit ?? "шт",
      defaultPrice: body.defaultPrice ?? 0,
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
