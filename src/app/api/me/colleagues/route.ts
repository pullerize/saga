import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * Возвращает список пользователей из той же компании, что и текущий
 * залогиненный пользователь — для выбора «менеджера, ведущего карточку».
 * Только активные сотрудники.
 *
 * Видимость администратора: МЕНЕДЖЕР не видит ADMIN в списке (он не должен
 * мочь «закрепить» КП на админа). ADMIN видит всех.
 */
export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const me = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { companyId: true, companyName: true, role: true },
  });
  if (!me) return NextResponse.json([]);

  // Пытаемся фильтровать по companyId; если не задан — fallback по имени.
  const where: {
    status: string;
    companyId?: string;
    companyName?: string;
    role?: { not: "ADMIN" };
  } = { status: "ACTIVE" };
  if (me.companyId) where.companyId = me.companyId;
  else if (me.companyName) where.companyName = me.companyName;
  else return NextResponse.json([]);

  // Менеджеру не показываем администраторов компании.
  if (me.role !== "ADMIN") where.role = { not: "ADMIN" };

  const colleagues = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, role: true },
  });
  return NextResponse.json(colleagues);
}
