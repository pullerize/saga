import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const items = await prisma.systemFormula.findMany({
    orderBy: [{ systemName: "asc" }, { subsystemName: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(items);
}

export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { id, formula, componentName } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: { formula?: string; componentName?: string } = {};
  if (formula !== undefined) data.formula = String(formula);
  if (componentName !== undefined) {
    const trimmed = String(componentName).trim();
    if (!trimmed) return NextResponse.json({ error: "componentName cannot be empty" }, { status: 400 });
    data.componentName = trimmed;
  }
  try {
    const item = await prisma.systemFormula.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Не удалось обновить" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const systemName = String(body.systemName || "").trim();
  const subsystemName = String(body.subsystemName || "").trim();
  const componentName = String(body.componentName || "").trim();
  const formula = String(body.formula || "").trim();
  if (!systemName || !subsystemName || !componentName || !formula) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }
  try {
    const count = await prisma.systemFormula.count({
      where: { systemName, subsystemName },
    });
    const item = await prisma.systemFormula.create({
      data: { systemName, subsystemName, componentName, formula, sortOrder: count },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать формулу" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.systemFormula.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}
