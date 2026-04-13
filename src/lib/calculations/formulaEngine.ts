/**
 * Formula-based calculation engine.
 * Uses admin-defined formulas from the database instead of hardcoded logic.
 * Falls back to the legacy engine.ts if no formulas are defined.
 */

import { evaluateFormula } from "./formulaParser";
import type { CalcComponent } from "./engine";

export interface FormulaSubsystem {
  name: string;
  params: Record<string, number>;
  formulas?: Record<string, string> | null;
}

export interface FormulaShotlanOption {
  name: string;
  components?: Record<string, number> | null; // key → price
  formulas?: Record<string, string> | null;    // key → formula
}

export interface ParamDefRecord {
  key: string;
  label: string;
  category: string;
  price?: number | null;
}

/**
 * Build the variable context for formula evaluation.
 * Maps param labels → numeric values so formulas can reference them by name.
 */
export function buildFormulaContext(
  params: Record<string, number>,
  paramDefs: ParamDefRecord[],
  extra: {
    fullWidth: number;
    openWidth: number;
    height: number;
    doorWidth: number;
  }
): Record<string, number> {
  const vars: Record<string, number> = {};

  // Add general dimensions by label
  vars["Ширина проёма (открытая часть)"] = extra.fullWidth;
  vars["Ширина проёма (полностью)"] = extra.openWidth || extra.fullWidth;
  vars["Высота проёма"] = extra.height;
  vars["Ширина двери"] = extra.doorWidth;

  // Add all subsystem params by their labels
  for (const [key, value] of Object.entries(params)) {
    const def = paramDefs.find((d) => d.key === key);
    if (def) {
      vars[def.label] = value;
    }
    // Also keep raw key accessible
    vars[key] = value;
  }

  return vars;
}

/**
 * Calculate subsystem components using formulas.
 * For each param that has a formula, evaluate it.
 * For params without formulas, use the static numeric value.
 */
export function calculateWithFormulas(
  subsystem: FormulaSubsystem,
  paramDefs: ParamDefRecord[],
  componentPrices: Record<string, number>,
  componentNames: Record<string, string>,
  fullWidth: number,
  openWidth: number,
  height: number,
  doorWidth: number,
): CalcComponent[] {
  const components: CalcComponent[] = [];
  const vars = buildFormulaContext(subsystem.params, paramDefs, {
    fullWidth, openWidth, height, doorWidth,
  });

  // Evaluate formulas to get final quantities
  const quantities: Record<string, number> = {};

  for (const [key, staticValue] of Object.entries(subsystem.params)) {
    const formula = subsystem.formulas?.[key];
    if (formula) {
      quantities[key] = evaluateFormula(formula, vars);
    } else {
      quantities[key] = staticValue;
    }
  }

  // Build components list
  for (const [key, qty] of Object.entries(quantities)) {
    if (qty > 0) {
      const price = componentPrices[key] ?? 0;
      const sum = Math.round(qty * price * 100) / 100;
      components.push({
        key,
        name: componentNames[key] || paramDefs.find((d) => d.key === key)?.label || key,
        qty,
        price,
        sum,
        unit: "шт",
      });
    }
  }

  return components;
}

/**
 * Calculate shotlan components using formulas.
 */
export function calculateShotlanWithFormulas(
  shotlan: FormulaShotlanOption,
  paramDefs: ParamDefRecord[],
  vars: Record<string, number>,
): CalcComponent[] {
  if (!shotlan.components) return [];

  const components: CalcComponent[] = [];

  for (const [key, price] of Object.entries(shotlan.components)) {
    const formula = shotlan.formulas?.[key];
    let qty = 0;

    if (formula) {
      qty = evaluateFormula(formula, vars);
    }

    if (qty > 0) {
      const sum = Math.round(qty * price * 100) / 100;
      components.push({
        key,
        name: paramDefs.find((d) => d.key === key)?.label || key,
        qty,
        price,
        sum,
        unit: "шт",
      });
    }
  }

  return components;
}
