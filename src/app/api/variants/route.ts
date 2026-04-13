import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — all variants with items
export async function GET() {
  const variants = await prisma.subsystemVariant.findMany({
    include: { items: { orderBy: { sortOrder: "asc" } }, schemes: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ systemSlug: "asc" }, { subsystemName: "asc" }],
  });
  return NextResponse.json(variants);
}

// POST — create variant
export async function POST(req: Request) {
  const body = await req.json();
  const variant = await prisma.subsystemVariant.create({
    data: {
      systemSlug: body.systemSlug,
      subsystemName: body.subsystemName,
      variantName: body.variantName,
      sortOrder: body.sortOrder ?? 0,
      items: {
        create: (body.items || []).map((item: { title: string; description?: string; iconUrl?: string }, i: number) => ({
          title: item.title,
          description: item.description ?? "",
          iconUrl: item.iconUrl ?? null,
          sortOrder: i,
        })),
      },
    },
    include: { items: true },
  });
  return NextResponse.json(variant, { status: 201 });
}

// PUT — update variant + items
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Update variant
  await prisma.subsystemVariant.update({
    where: { id },
    data: {
      variantName: data.variantName,
      railImageUrl: data.railImageUrl ?? null,
    },
  });

  // Replace items
  await prisma.subsystemVariantItem.deleteMany({ where: { variantId: id } });
  if (data.items?.length > 0) {
    await prisma.subsystemVariantItem.createMany({
      data: data.items.map((item: { title: string; description?: string; iconUrl?: string }, i: number) => ({
        variantId: id,
        title: item.title,
        description: item.description ?? "",
        iconUrl: item.iconUrl ?? null,
        sortOrder: i,
      })),
    });
  }

  // Replace schemes
  if (data.schemes !== undefined) {
    await prisma.subsystemScheme.deleteMany({ where: { variantId: id } });
    if (data.schemes?.length > 0) {
      await prisma.subsystemScheme.createMany({
        data: data.schemes.map((s: { label: string; svgContent: string; ratioType?: string | null }, i: number) => ({
          variantId: id,
          label: s.label,
          svgContent: s.svgContent,
          ratioType: s.ratioType ?? null,
          sortOrder: i,
        })),
      });
    }
  }

  const updated = await prisma.subsystemVariant.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } }, schemes: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json(updated);
}

// DELETE
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.subsystemVariant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
