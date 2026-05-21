import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";
import { Logo } from "@/components/shared/Logo";
import { systemsData } from "@/lib/calculations/systemsData";
import { prisma } from "@/lib/db";

interface Props {
  params: Promise<{ systemType: string }>;
}

export async function generateStaticParams() {
  const systems = await prisma.doorSystem.findMany({ select: { slug: true } });
  return systems
    .filter((s) => systemsData[s.slug])
    .map((s) => ({ systemType: s.slug }));
}

export default async function CalculatorPage({ params }: Props) {
  const { systemType } = await params;

  if (!systemsData[systemType]) {
    notFound();
  }

  const exists = await prisma.doorSystem.findUnique({
    where: { slug: systemType },
    select: { id: true },
  });
  if (!exists) {
    notFound();
  }

  return (
    <>
      {/* Гостевая шапка: лого + «Назад к выбору системы» + «На сайт». */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/calculator"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">К выбору системы</span>
            <span className="sm:hidden">Назад</span>
          </Link>
        </div>
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
      <div className="pt-16">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Загрузка...</p></div>}>
          <CalculatorWizard systemType={systemType} />
        </Suspense>
      </div>
    </>
  );
}
