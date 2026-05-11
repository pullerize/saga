import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

// GET — список систем. Доступен залогиненным (нужен в калькуляторе/админке).
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const systems = await prisma.doorSystem.findMany({
    orderBy: { sortOrder: "asc" },
    include: { subsystems: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(systems);
}

export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  if (!body?.slug || typeof body.slug !== "string") {
    return NextResponse.json({ error: "slug обязателен" }, { status: 400 });
  }
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name обязателен" }, { status: 400 });
  }
  const minWidth = Number.isFinite(body.minWidth) ? body.minWidth : 600;
  const maxWidth = Number.isFinite(body.maxWidth) ? body.maxWidth : 6000;
  if (minWidth >= maxWidth) {
    return NextResponse.json({ error: "minWidth должен быть меньше maxWidth" }, { status: 400 });
  }
  try {
    const count = await prisma.doorSystem.count();
    const system = await prisma.doorSystem.create({
      data: {
        slug: body.slug,
        name: body.name,
        minWidth,
        maxWidth,
        maxFullWidth: Number.isFinite(body.maxFullWidth) ? body.maxFullWidth : null,
        hasExtraField: !!body.hasExtraField,
        minHeight: Number.isFinite(body.minHeight) ? body.minHeight : 1800,
        maxHeight: Number.isFinite(body.maxHeight) ? body.maxHeight : 3500,
        sortOrder: count,
      },
    });
    return NextResponse.json(system, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать систему" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (Number.isFinite(data.minWidth) && Number.isFinite(data.maxWidth) && data.minWidth >= data.maxWidth) {
    return NextResponse.json({ error: "minWidth должен быть меньше maxWidth" }, { status: 400 });
  }
  try {
    const system = await prisma.doorSystem.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        minWidth: data.minWidth,
        maxWidth: data.maxWidth,
        maxFullWidth: data.maxFullWidth ?? null,
        hasExtraField: !!data.hasExtraField,
        minHeight: data.minHeight ?? 1800,
        maxHeight: data.maxHeight ?? 3500,
      },
    });
    return NextResponse.json(system);
  } catch {
    return NextResponse.json({ error: "Не удалось обновить систему" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.doorSystem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить систему" }, { status: 500 });
  }
}
