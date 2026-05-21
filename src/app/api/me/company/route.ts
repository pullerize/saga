import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

// Никогда не кэшируем: данные компании (в т.ч. шоурумы) меняются в админке и
// должны сразу подхватываться формой карточки/шапкой/превью.
export const dynamic = "force-dynamic";

// Хелпер: ответ без кэширования (иначе браузер может отдать устаревшие шоурумы).
function noStore(data: unknown) {
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Возвращает компанию текущего залогиненного пользователя:
 * { id, name, logoUrl, showrooms } — или null, если пользователь без компании.
 * Используется для рендера лого в PDF и UI («лого партнёра × SAGA»),
 * а также для списка филиалов (шоурумов) при создании карточки клиента.
 */
export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { companyId: true, companyName: true },
  });
  if (!user) return noStore(null);

  if (user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, name: true, logoUrl: true, showrooms: true },
    });
    if (company) return noStore(company);
  }

  // Fallback: совместимость со старыми пользователями без companyId.
  if (user.companyName) {
    const byName = await prisma.company.findUnique({
      where: { name: user.companyName },
      select: { id: true, name: true, logoUrl: true, showrooms: true },
    });
    if (byName) return noStore(byName);
    return noStore({ id: null, name: user.companyName, logoUrl: null, showrooms: [] });
  }

  return noStore(null);
}
