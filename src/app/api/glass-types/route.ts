import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.glassType.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const count = await prisma.glassType.count();
  const item = await prisma.glassType.create({
    data: {
      name: body.name,
      defaultPrice: body.defaultPrice ?? 0,
      sortOrder: count,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const item = await prisma.glassType.update({
    where: { id },
    data: { name: data.name, defaultPrice: data.defaultPrice, imageUrl: data.imageUrl ?? undefined },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.glassType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
