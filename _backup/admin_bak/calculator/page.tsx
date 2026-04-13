"use client";

import { QuickCalculator } from "@/components/calculator/QuickCalculator";

export default function AdminCalculatorPage() {
  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Калькулятор</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Быстрый расчёт стоимости дверной системы
        </p>
      </div>
      <QuickCalculator />
    </div>
  );
}
