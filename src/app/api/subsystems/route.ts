import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

// Валидация полос [min, t1, t2, max]: 4 числа по возрастанию.
function validBands(v: unknown): v is [number, number, number, number] {
  if (!Array.isArray(v) || v.length !== 4) return false;
  const n = v.map(Number);
  if (n.some((x) => !Number.isFinite(x) || x < 0 || x > 50000)) return false;
  return n[0] <= n[1] && n[1] <= n[2] && n[2] <= n[3];
}

export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  if (!body?.systemId || !body?.name) {
    return NextResponse.json({ error: "systemId и name обязательны" }, { status: 400 });
  }
  try {
    const count = await prisma.subsystem.count({ where: { systemId: body.systemId } });
    const sub = await prisma.subsystem.create({
      data: {
        systemId: body.systemId,
        name: String(body.name).trim(),
        minWidth: Number.isFinite(body.minWidth) ? body.minWidth : 600,
        maxWidth: Number.isFinite(body.maxWidth) ? body.maxWidth : 6000,
        sortOrder: count,
        params: body.params ?? {},
        formulas: body.formulas ?? null,
        videoUrl: typeof body.videoUrl === "string" && body.videoUrl.trim() ? body.videoUrl.trim() : null,
        posterUrl: typeof body.posterUrl === "string" && body.posterUrl.trim() ? body.posterUrl.trim() : null,
      },
    });
    return NextResponse.json(sub, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать подсистему" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const sub = await prisma.subsystem.update({
      where: { id },
      data: {
        name: data.name,
        minWidth: data.minWidth,
        maxWidth: data.maxWidth,
        params: data.params ?? {},
        formulas: data.formulas ?? null,
        ...(data.videoUrl !== undefined
          ? { videoUrl: typeof data.videoUrl === "string" && data.videoUrl.trim() ? data.videoUrl.trim() : null }
          : {}),
        ...(data.posterUrl !== undefined
          ? { posterUrl: typeof data.posterUrl === "string" && data.posterUrl.trim() ? data.posterUrl.trim() : null }
          : {}),
      },
    });
    return NextResponse.json(sub);
  } catch {
    return NextResponse.json({ error: "Не удалось обновить" }, { status: 500 });
  }
}

// PATCH — точечное обновление только sizeRanges (диапазоны схем «вид системы» /
// «вид сверху»). Отдельный метод, чтобы не затирать params/formulas как PUT.
export async function PATCH(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { id, sizeRanges } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  let value: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;
  if (sizeRanges) {
    if (!validBands(sizeRanges.heightBands) || !validBands(sizeRanges.widthBands)) {
      return NextResponse.json(
        { error: "Диапазоны должны быть 4 числами по возрастанию (мин ≤ порог1 ≤ порог2 ≤ макс)" },
        { status: 400 },
      );
    }
    value = {
      heightBands: sizeRanges.heightBands.map(Number),
      widthBands: sizeRanges.widthBands.map(Number),
    } as Prisma.InputJsonValue;
  }

  try {
    const sub = await prisma.subsystem.update({
      where: { id },
      data: { sizeRanges: value },
    });
    return NextResponse.json(sub);
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить диапазоны" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sub = await prisma.subsystem.findUnique({
    where: { id },
    include: { system: { select: { name: true, slug: true } } },
  });
  if (!sub) return NextResponse.json({ error: "Subsystem not found" }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    // Linked formulas (matched by string name)
    const deletedFormulas = await tx.systemFormula.deleteMany({
      where: { systemName: sub.system.name, subsystemName: sub.name },
    });

    // Visual variants (cascades to schemes + variant items via Prisma onDelete: Cascade)
    const deletedVariants = await tx.subsystemVariant.deleteMany({
      where: { systemSlug: sub.system.slug, subsystemName: sub.name },
    });

    await tx.subsystem.delete({ where: { id } });

    return {
      formulas: deletedFormulas.count,
      variants: deletedVariants.count,
    };
  });

  return NextResponse.json({ ok: true, deleted: result });
}
