import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const systems = await prisma.doorSystem.findMany({
    orderBy: { sortOrder: "asc" },
    include: { subsystems: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(systems);
}

export async function POST(req: Request) {
  const body = await req.json();
  const count = await prisma.doorSystem.count();
  const system = await prisma.doorSystem.create({
    data: {
      slug: body.slug,
      name: body.name,
      minWidth: body.minWidth ?? 600,
      maxWidth: body.maxWidth ?? 6000,
      maxFullWidth: body.maxFullWidth ?? null,
      hasExtraField: body.hasExtraField ?? false,
      minHeight: body.minHeight ?? 1800,
      maxHeight: body.maxHeight ?? 3500,
      sortOrder: count,
    },
  });
  return NextResponse.json(system, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const system = await prisma.doorSystem.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      minWidth: data.minWidth,
      maxWidth: data.maxWidth,
      maxFullWidth: data.maxFullWidth ?? null,
      hasExtraField: data.hasExtraField ?? false,
      minHeight: data.minHeight ?? 1800,
      maxHeight: data.maxHeight ?? 3500,
    },
  });
  return NextResponse.json(system);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.doorSystem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
