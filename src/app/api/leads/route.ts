import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

// POST — публичный. Гость с калькулятора оставляет имя+телефон, чтобы увидеть КП.
// Принимает контекст калькулятора (система, размеры, выбранные опции, цена) —
// всё опционально, чтобы можно было сохранить лид даже на ранних шагах при
// добавлении расширения в будущем.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Имя обязательно" }, { status: 400 });
  }
  if (!phone || phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Введите корректный телефон" }, { status: 400 });
  }

  const toOptString = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;
  const toOptInt = (v: unknown) => {
    const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? Math.round(n) : null;
  };
  const toOptFloat = (v: unknown) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
    return Number.isFinite(n) ? n : null;
  };

  try {
    const lead = await prisma.guestLead.create({
      data: {
        name,
        phone,
        systemSlug: String(body.systemSlug ?? "").trim(),
        systemName: String(body.systemName ?? "").trim(),
        subsystemName: toOptString(body.subsystemName),
        fullWidth: toOptInt(body.fullWidth),
        openWidth: toOptInt(body.openWidth),
        height: toOptInt(body.height),
        doorWidth: toOptInt(body.doorWidth),
        glassType: toOptString(body.glassType),
        shotlanType: toOptString(body.shotlanType),
        totalPrice: toOptFloat(body.totalPrice),
        status: "new",
      },
    });
    return NextResponse.json({ id: lead.id, ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить заявку" }, { status: 500 });
  }
}

// GET — только ADMIN. Список заявок для админ-панели.
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const leads = await prisma.guestLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json(leads);
}
