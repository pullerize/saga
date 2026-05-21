import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

const DEFAULT_COMPANY_NAME = "Saga Group";

interface Showroom {
  name: string;
  address: string;
}

// Нормализует входящий список шоурумов: оставляет только записи, где есть
// название или адрес, обрезает пробелы и ограничивает количество/длину.
function normalizeShowrooms(input: unknown): Showroom[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      const r = raw as Record<string, unknown>;
      return {
        name: String(r?.name ?? "").trim().slice(0, 200),
        address: String(r?.address ?? "").trim().slice(0, 500),
      };
    })
    .filter((s) => s.name || s.address)
    .slice(0, 50);
}

/**
 * Возвращает список компаний. Если в таблице нет ни одной — создаёт
 * компанию по умолчанию «Saga Group» (без логотипа), чтобы куда-то добавлять
 * внутренних менеджеров/админов.
 */
async function listCompanies() {
  const count = await prisma.company.count();
  if (count === 0) {
    await prisma.company.create({ data: { name: DEFAULT_COMPANY_NAME } });
  }
  return prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, logoUrl: true, showrooms: true, createdAt: true },
  });
}

// GET — список всех компаний (доступно любому залогиненному).
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const companies = await listCompanies();
  return NextResponse.json(companies);
}

// POST — создать компанию (только ADMIN).
export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const name = (body?.name ?? "").trim();
  const logoUrl = body?.logoUrl?.trim() || null;
  const showrooms = normalizeShowrooms(body?.showrooms);
  if (!name) return NextResponse.json({ error: "Имя компании обязательно" }, { status: 400 });

  const exists = await prisma.company.findUnique({ where: { name } });
  if (exists) return NextResponse.json({ error: "Компания с таким именем уже существует" }, { status: 409 });

  const company = await prisma.company.create({
    data: { name, logoUrl, showrooms: showrooms as unknown as Prisma.InputJsonValue },
  });
  return NextResponse.json(company, { status: 201 });
}

// PUT — обновить компанию (только ADMIN). Body: { id, name?, logoUrl? }
export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });

  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Компания не найдена" }, { status: 404 });

  const data: { name?: string; logoUrl?: string | null; showrooms?: Prisma.InputJsonValue } = {};
  if (typeof body.name === "string") {
    const newName = body.name.trim();
    if (!newName) return NextResponse.json({ error: "Имя не может быть пустым" }, { status: 400 });
    if (newName !== existing.name) {
      const dup = await prisma.company.findUnique({ where: { name: newName } });
      if (dup) return NextResponse.json({ error: "Компания с таким именем уже существует" }, { status: 409 });
    }
    data.name = newName;
  }
  if (Object.prototype.hasOwnProperty.call(body, "logoUrl")) {
    data.logoUrl = body.logoUrl?.trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(body, "showrooms")) {
    data.showrooms = normalizeShowrooms(body.showrooms) as unknown as Prisma.InputJsonValue;
  }

  const company = await prisma.company.update({ where: { id }, data });

  // Если имя поменялось — синхронизируем User.companyName и ClientCard.companyName
  if (data.name && data.name !== existing.name) {
    await prisma.user.updateMany({
      where: { companyId: id },
      data: { companyName: data.name },
    });
    await prisma.clientCard.updateMany({
      where: { companyName: existing.name },
      data: { companyName: data.name },
    });
  }

  return NextResponse.json(company);
}

// DELETE — удалить компанию (только ADMIN). ?id=...
export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });

  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Компания не найдена" }, { status: 404 });

  if (existing.name === DEFAULT_COMPANY_NAME) {
    return NextResponse.json({ error: "Нельзя удалить компанию по умолчанию" }, { status: 400 });
  }

  const usersInCompany = await prisma.user.count({ where: { companyId: id } });
  if (usersInCompany > 0) {
    return NextResponse.json(
      { error: `В компании ${usersInCompany} пользователей — сначала удалите или переведите их` },
      { status: 400 },
    );
  }

  await prisma.company.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
