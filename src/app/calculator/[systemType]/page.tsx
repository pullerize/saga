import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Загрузка...</p></div>}>
      <CalculatorWizard systemType={systemType} />
    </Suspense>
  );
}
