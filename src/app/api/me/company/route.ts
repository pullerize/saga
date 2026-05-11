import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * Возвращает компанию текущего залогиненного пользователя:
 * { id, name, logoUrl } — или null, если пользователь без компании.
 * Используется для рендера лого в PDF и UI («лого партнёра × SAGA»).
 */
export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { companyId: true, companyName: true },
  });
  if (!user) return NextResponse.json(null);

  if (user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, name: true, logoUrl: true },
    });
    if (company) return NextResponse.json(company);
  }

  // Fallback: совместимость со старыми пользователями без companyId.
  if (user.companyName) {
    const byName = await prisma.company.findUnique({
      where: { name: user.companyName },
      select: { id: true, name: true, logoUrl: true },
    });
    if (byName) return NextResponse.json(byName);
    return NextResponse.json({ id: null, name: user.companyName, logoUrl: null });
  }

  return NextResponse.json(null);
}
