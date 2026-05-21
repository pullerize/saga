import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

const VALID_STATUS = new Set(["new", "contacted", "closed"]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: { status?: string; notes?: string } = {};
  if (typeof body.status === "string") {
    if (!VALID_STATUS.has(body.status)) {
      return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (typeof body.notes === "string") {
    data.notes = body.notes;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
  }

  try {
    const lead = await prisma.guestLead.update({ where: { id }, data });
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.guestLead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }
}
