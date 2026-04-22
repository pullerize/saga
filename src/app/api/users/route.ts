import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

const ALLOWED_CREATE_ROLES = ["PARTNER", "MANAGER", "ADMIN"];
const ALLOWED_STATUSES = ["ACTIVE", "BLOCKED", "PENDING"];

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { email, password, name, phone, role, status, companyName } = body;

  if (!email || !password || !name || !role) {
    return NextResponse.json(
      { error: "email, password, name, role обязательны" },
      { status: 400 }
    );
  }
  if (!ALLOWED_CREATE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Недопустимая роль" }, { status: 400 });
  }
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phone: phone || null,
      role,
      status: status || "ACTIVE",
      companyName: companyName || null,
    },
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

  return NextResponse.json(user, { status: 201 });
}
