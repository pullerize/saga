import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

// GET — unique company names from existing users (ADMIN only)
export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const users = await prisma.user.findMany({
    where: {
      role: "PARTNER",
      companyName: { not: null },
    },
    select: { companyName: true },
  });

  const companies = Array.from(
    new Set(
      users
        .map((u) => u.companyName?.trim())
        .filter((n): n is string => !!n && n.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, "ru"));

  return NextResponse.json(companies);
}
