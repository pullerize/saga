/**
 * Wrapper that tries formula-based calculation via API first,
 * then falls back to the legacy hardcoded engine.
 */

import { calculateTotal as legacyCalculate, type CalcResult } from "./engine";
import type { SubsystemParams } from "./systemsData";

export async function calculateWithDB(
  systemSlug: string,
  subsystem: string,
  params: SubsystemParams,
  fullWidth: number,
  openWidth: number,
  height: number,
  glass: string,
  shotlan: string
): Promise<CalcResult> {
  try {
    const res = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemSlug,
        subsystemName: subsystem,
        fullWidth,
        openWidth,
        height,
        glass,
        shotlan,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.source === "formula" && data.components?.length > 0) {
        return {
          components: data.components,
          total: data.total,
          doorWidth: data.doorWidth,
        };
      }
    }
  } catch {
    // API not available, use legacy
  }

  // Fallback to legacy engine
  return legacyCalculate(
    systemSlug, subsystem, params,
    fullWidth, openWidth, height, glass, shotlan
  );
}
