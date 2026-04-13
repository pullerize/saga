"use client";

import { use } from "react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { CalculatorWizard } from "@/components/calculator/CalculatorWizard";

export default function CalculatorPage({
  params,
}: {
  params: Promise<{ systemType: string }>;
}) {
  const { systemType } = use(params);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <CalculatorWizard systemType={systemType} />
      </main>
      <Footer />
    </div>
  );
}
