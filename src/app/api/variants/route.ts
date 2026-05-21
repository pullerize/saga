import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

// GET — all variants with items. Доступно залогиненным.
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const variants = await prisma.subsystemVariant.findMany({
    include: { items: { orderBy: { sortOrder: "asc" } }, schemes: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ systemSlug: "asc" }, { subsystemName: "asc" }],
  });
  return NextResponse.json(variants);
}

// POST — create variant (только ADMIN)
export async function POST(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  if (!body?.systemSlug || !body?.subsystemName || !body?.variantName) {
    return NextResponse.json({ error: "systemSlug, subsystemName, variantName обязательны" }, { status: 400 });
  }
  try {
    const variant = await prisma.subsystemVariant.create({
      data: {
        systemSlug: String(body.systemSlug),
        subsystemName: String(body.subsystemName),
        variantName: String(body.variantName),
        sortOrder: body.sortOrder ?? 0,
        items: {
          create: (body.items || []).map(
            (item: { title: string; description?: string; iconUrl?: string }, i: number) => ({
              title: String(item.title || ""),
              description: String(item.description ?? ""),
              iconUrl: item.iconUrl ?? null,
              sortOrder: i,
            }),
          ),
        },
      },
      include: { items: true },
    });
    return NextResponse.json(variant, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать вариант" }, { status: 500 });
  }
}

// PUT — update variant + items (только ADMIN)
export async function PUT(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await prisma.subsystemVariant.update({
      where: { id },
      data: {
        variantName: data.variantName,
        railImageUrl: data.railImageUrl ?? null,
      },
    });

    await prisma.subsystemVariantItem.deleteMany({ where: { variantId: id } });
    if (data.items?.length > 0) {
      await prisma.subsystemVariantItem.createMany({
        data: data.items.map(
          (item: { title: string; description?: string; iconUrl?: string }, i: number) => ({
            variantId: id,
            title: String(item.title || ""),
            description: String(item.description ?? ""),
            iconUrl: item.iconUrl ?? null,
            sortOrder: i,
          }),
        ),
      });
    }

    if (data.schemes !== undefined) {
      await prisma.subsystemScheme.deleteMany({ where: { variantId: id } });
      if (data.schemes?.length > 0) {
        await prisma.subsystemScheme.createMany({
          data: data.schemes.map(
            (
              s: {
                label: string;
                svgContent: string;
                ratioType?: string | null;
                heightCategory?: string | null;
                widthCategory?: string | null;
              },
              i: number,
            ) => ({
              variantId: id,
              label: String(s.label || ""),
              svgContent: String(s.svgContent || ""),
              ratioType: s.ratioType ?? null,
              heightCategory: s.heightCategory ?? null,
              widthCategory: s.widthCategory ?? null,
              sortOrder: i,
            }),
          ),
        });
      }
    }

    const updated = await prisma.subsystemVariant.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } }, schemes: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Не удалось обновить вариант" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await prisma.subsystemVariant.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить" }, { status: 500 });
  }
}
