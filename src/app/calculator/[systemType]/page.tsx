import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";
import { systemsData } from "@/lib/calculations/systemsData";

interface Props {
  params: Promise<{ systemType: string }>;
}

export function generateStaticParams() {
  return Object.keys(systemsData).map((systemType) => ({ systemType }));
}

export default async function CalculatorPage({ params }: Props) {
  const { systemType } = await params;

  if (!systemsData[systemType]) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Загрузка...</p></div>}>
      <CalculatorWizard systemType={systemType} />
    </Suspense>
  );
}
