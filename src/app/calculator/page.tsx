"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SystemsGrid } from "@/components/home/SystemsGrid";

export default function CalculatorSelectPage() {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-4 sm:px-8">
        <Link href="/" aria-label="На главную">
          <Logo size="sm" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">На сайт</span>
        </Link>
      </header>
      <main className="pt-20">
        <SystemsGrid targetPath="calculator" />
      </main>
    </>
  );
}
