// Coefficients and config for advanced calculator mode
// All values are stored in DB via AdditionalService and Component models
// This module provides the default structure and types

export interface CalculationCoefficients {
  regionCoefficient: number;      // Regional price multiplier
  urgencyCoefficient: number;     // Urgency surcharge multiplier
  complexityCoefficient: number;  // Installation complexity multiplier
}

export interface AdvancedCalculationParams {
  wallMaterial: "brick" | "concrete" | "drywall" | "wood" | "other";
  installationComplexity: "simple" | "standard" | "complex";
  urgency: "standard" | "urgent" | "veryUrgent";
  needDemontage: boolean;
  needDelivery: boolean;
  needReinforcement: boolean;
  needCleanup: boolean;
  needLift: boolean;
  floor: number;
}

export const wallMaterialLabels: Record<string, string> = {
  brick: "Кирпич",
  concrete: "Бетон",
  drywall: "Гипсокартон",
  wood: "Дерево",
  other: "Другое",
};

export const complexityLabels: Record<string, string> = {
  simple: "Простая",
  standard: "Стандартная",
  complex: "Сложная",
};

export const urgencyLabels: Record<string, string> = {
  standard: "Стандартная",
  urgent: "Срочная (x1.3)",
  veryUrgent: "Очень срочная (x1.6)",
};

export const defaultCoefficients: Record<string, CalculationCoefficients> = {
  simple: { regionCoefficient: 1, urgencyCoefficient: 1, complexityCoefficient: 0.9 },
  standard: { regionCoefficient: 1, urgencyCoefficient: 1, complexityCoefficient: 1 },
  complex: { regionCoefficient: 1, urgencyCoefficient: 1, complexityCoefficient: 1.2 },
};

export const urgencyMultipliers: Record<string, number> = {
  standard: 1,
  urgent: 1.3,
  veryUrgent: 1.6,
};

export const wallMaterialComplexity: Record<string, number> = {
  brick: 1.0,
  concrete: 1.1,
  drywall: 0.85,
  wood: 0.9,
  other: 1.0,
};

export function calculateAdvancedTotal(
  baseTotal: number,
  params: AdvancedCalculationParams,
  servicePrices: Record<string, number>
): { adjustedTotal: number; breakdown: { label: string; amount: number }[] } {
  const breakdown: { label: string; amount: number }[] = [];

  // Base price
  breakdown.push({ label: "Базовая стоимость", amount: baseTotal });
  let total = baseTotal;

  // Complexity coefficient
  const complexityMult = defaultCoefficients[params.installationComplexity]?.complexityCoefficient ?? 1;
  if (complexityMult !== 1) {
    const diff = baseTotal * (complexityMult - 1);
    breakdown.push({ label: `Сложность монтажа (${complexityLabels[params.installationComplexity]})`, amount: diff });
    total += diff;
  }

  // Wall material adjustment
  const wallMult = wallMaterialComplexity[params.wallMaterial] ?? 1;
  if (wallMult !== 1) {
    const diff = baseTotal * (wallMult - 1);
    breakdown.push({ label: `Материал стены (${wallMaterialLabels[params.wallMaterial]})`, amount: diff });
    total += diff;
  }

  // Urgency
  const urgencyMult = urgencyMultipliers[params.urgency] ?? 1;
  if (urgencyMult !== 1) {
    const diff = total * (urgencyMult - 1);
    breakdown.push({ label: `Срочность (${urgencyLabels[params.urgency]})`, amount: diff });
    total += diff;
  }

  // Additional services
  if (params.needDemontage && servicePrices.demontage) {
    breakdown.push({ label: "Демонтаж старой двери", amount: servicePrices.demontage });
    total += servicePrices.demontage;
  }
  if (params.needDelivery && servicePrices.delivery) {
    breakdown.push({ label: "Доставка", amount: servicePrices.delivery });
    total += servicePrices.delivery;
  }
  if (params.needReinforcement && servicePrices.reinforcement) {
    breakdown.push({ label: "Армирование проёма", amount: servicePrices.reinforcement });
    total += servicePrices.reinforcement;
  }
  if (params.needCleanup && servicePrices.cleanup) {
    breakdown.push({ label: "Уборка после монтажа", amount: servicePrices.cleanup });
    total += servicePrices.cleanup;
  }
  if (params.needLift && servicePrices.lift) {
    const liftTotal = servicePrices.lift * Math.max(0, params.floor - 1);
    if (liftTotal > 0) {
      breakdown.push({ label: `Подъём на ${params.floor} этаж`, amount: liftTotal });
      total += liftTotal;
    }
  }

  return { adjustedTotal: Math.round(total * 100) / 100, breakdown };
}
