import type { UserRole } from "@/types";

export const INTERNAL_COMPANY_NAME = "Saga Group";

export function resolveCompanyName(
  role: UserRole | string | undefined,
  userCompanyName: string | null | undefined
): string {
  if (role === "PARTNER") {
    const trimmed = userCompanyName?.trim();
    return trimmed || "Без компании";
  }
  return INTERNAL_COMPANY_NAME;
}
