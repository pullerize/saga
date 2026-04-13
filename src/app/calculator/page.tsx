"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { SystemsGrid } from "@/components/home/SystemsGrid";

export default function CalculatorSelectPage() {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center px-4 sm:px-8">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>
      <main className="pt-20">
        <SystemsGrid targetPath="calculator" />
      </main>
    </>
  );
}
