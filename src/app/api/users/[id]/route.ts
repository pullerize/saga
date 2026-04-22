import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

const ALLOWED_ROLES = ["PARTNER", "MANAGER", "ADMIN"];
const ALLOWED_STATUSES = ["ACTIVE", "BLOCKED", "PENDING"];

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { email, password, name, phone, role, status, companyName } = body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  if (role && !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
  }
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
  }

  // Prevent admin from demoting/blocking themselves accidentally
  if (session?.user?.id === id) {
    if (role && role !== existing.role) {
      return NextResponse.json(
        { error: "Нельзя изменить собственную роль" },
        { status: 400 }
      );
    }
    if (status && status !== existing.status) {
      return NextResponse.json(
        { error: "Нельзя изменить собственный статус" },
        { status: 400 }
      );
    }
  }

  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return NextResponse.json(
        { error: "Email уже используется" },
        { status: 409 }
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (email !== undefined) data.email = email;
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone || null;
  if (role !== undefined) data.role = role;
  if (status !== undefined) data.status = status;
  if (companyName !== undefined) data.companyName = companyName || null;
  if (password) data.passwordHash = await hash(password, 10);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      companyName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;

  if (session?.user?.id === id) {
    return NextResponse.json(
      { error: "Нельзя удалить собственный аккаунт" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
