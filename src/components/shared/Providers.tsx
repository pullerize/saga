"use client";

import { SessionProvider } from "next-auth/react";
import { SiteEditProvider } from "@/components/site-edit/SiteEditProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SiteEditProvider>{children}</SiteEditProvider>
    </SessionProvider>
  );
}
