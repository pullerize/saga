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

  const sub = await prisma.subsystem.findUnique({
    where: { id },
    include: { system: { select: { name: true, slug: true } } },
  });
  if (!sub) return NextResponse.json({ error: "Subsystem not found" }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    // Linked formulas (matched by string name)
    const deletedFormulas = await tx.systemFormula.deleteMany({
      where: { systemName: sub.system.name, subsystemName: sub.name },
    });

    // Visual variants (cascades to schemes + variant items via Prisma onDelete: Cascade)
    const deletedVariants = await tx.subsystemVariant.deleteMany({
      where: { systemSlug: sub.system.slug, subsystemName: sub.name },
    });

    await tx.subsystem.delete({ where: { id } });

    return {
      formulas: deletedFormulas.count,
      variants: deletedVariants.count,
    };
  });

  return NextResponse.json({ ok: true, deleted: result });
}
