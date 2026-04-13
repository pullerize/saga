import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const count = await prisma.subsystem.count({ where: { systemId: body.systemId } });
  const sub = await prisma.subsystem.create({
    data: {
      systemId: body.systemId,
      name: body.name,
      minWidth: body.minWidth ?? 600,
      maxWidth: body.maxWidth ?? 6000,
      sortOrder: count,
      params: body.params ?? {},
      formulas: body.formulas ?? null,
    },
  });
  return NextResponse.json(sub, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sub = await prisma.subsystem.update({
    where: { id },
    data: {
      name: data.name,
      minWidth: data.minWidth,
      maxWidth: data.maxWidth,
      params: data.params ?? {},
      formulas: data.formulas ?? null,
    },
  });
  return NextResponse.json(sub);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.subsystem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
