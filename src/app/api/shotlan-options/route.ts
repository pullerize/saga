import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.shotlanOption.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const count = await prisma.shotlanOption.count();
  const item = await prisma.shotlanOption.create({
    data: {
      name: body.name,
      calcMethod: body.calcMethod ?? "none",
      components: body.components ?? null,
      formulas: body.formulas ?? null,
      sortOrder: count,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const item = await prisma.shotlanOption.update({
    where: { id },
    data: { name: data.name, calcMethod: data.calcMethod, components: data.components ?? null, formulas: data.formulas ?? null },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.shotlanOption.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
