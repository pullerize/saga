import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types";

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Не авторизован" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireRole(...roles: UserRole[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Не авторизован" }, { status: 401 }), session: null };
  }
  if (!roles.includes(session.user.role as UserRole)) {
    return { error: NextResponse.json({ error: "Недостаточно прав" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
