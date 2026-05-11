import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

const ALLOWED_CREATE_ROLES = ["PARTNER", "MANAGER", "ADMIN"];
const ALLOWED_STATUSES = ["ACTIVE", "BLOCKED", "PENDING"];
const DEFAULT_COMPANY_NAME = "Saga Group";

/** Найти компанию «Saga Group», создать если не существует. Используется как
 *  компания по умолчанию для администраторов и внутренних менеджеров. */
async function ensureDefaultCompany() {
  const existing = await prisma.company.findUnique({
    where: { name: DEFAULT_COMPANY_NAME },
  });
  if (existing) return existing;
  return prisma.company.create({ data: { name: DEFAULT_COMPANY_NAME } });
}

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
      companyId: true,
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
  const { email, password, name, phone, role, status, companyId } = body;

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

  // Админ по умолчанию относится к компании «Saga Group»: если companyId не
  // передан или не существует — берём (или создаём) дефолтную компанию.
  // Для прочих ролей companyId обязателен.
  let company;
  if (role === "ADMIN") {
    if (companyId) {
      company = await prisma.company.findUnique({ where: { id: companyId } });
    }
    if (!company) {
      company = await ensureDefaultCompany();
    }
  } else {
    if (!companyId) {
      return NextResponse.json({ error: "Выберите компанию" }, { status: 400 });
    }
    company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Компания не найдена" }, { status: 400 });
    }
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
      companyId: company.id,
      companyName: company.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      companyName: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
