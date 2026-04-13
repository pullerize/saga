import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

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
      _count: { select: { calculations: true } },
    },
  });
  return NextResponse.json(users);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json();
  const { id, role, status } = body;

  const user = await prisma.user.update({
    where: { id },
    data: { ...(role && { role }), ...(status && { status }) },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  return NextResponse.json(user);
}
