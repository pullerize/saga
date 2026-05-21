/**
 * 9 категорий габаритов (3 высоты × 3 ширины) для подбора SVG-схем
 * «Вид системы» (`SubsystemScheme`) и «Вид двери» (`DoorScheme`).
 *
 * Номинальные диапазоны (согласованы с пользователем 2026-05-13):
 *   Высота:  низкая  1800–2400 | средняя  2400–2900 | высокая  2900–3300
 *   Ширина:  узкая   1615–2100 | средняя  2100–3000 | широкая  3000–4500
 *
 * Пороги (нижняя граница включена, верхняя — нет; кроме последней):
 *   H < 2400 → low;  2400 ≤ H < 2900 → mid;  H ≥ 2900 → high
 *   W < 2100 → narrow; 2100 ≤ W < 3000 → mid; W ≥ 3000 → long
 *
 * За пределами номинальных диапазонов (H < 1800 / > 3300, W < 1615 / > 4500)
 * берётся ближайшая категория (clamp): значения подпадают под ту же логику
 * порогов. В UI/превью пользователь увидит, что выбрана крайняя категория.
 */

export type HeightCategory = "low" | "mid" | "high";
export type WidthCategory = "narrow" | "mid" | "long";

/** Пороги высоты, мм. Граница включается в ВЕРХНЮЮ категорию. */
const HEIGHT_LOW_MAX = 2400;  // h < 2400 → low; h ≥ 2400 → mid
const HEIGHT_MID_MAX = 2900;  // h < 2900 → mid; h ≥ 2900 → high

/** Пороги ширины, мм. Граница включается в ВЕРХНЮЮ категорию. */
const WIDTH_NARROW_MAX = 2100; // w < 2100 → narrow; w ≥ 2100 → mid
const WIDTH_MID_MAX = 3000;    // w < 3000 → mid;    w ≥ 3000 → long

export function pickHeightCategory(heightMm: number): HeightCategory {
  if (!Number.isFinite(heightMm) || heightMm < HEIGHT_LOW_MAX) return "low";
  if (heightMm < HEIGHT_MID_MAX) return "mid";
  return "high";
}

export function pickWidthCategory(widthMm: number): WidthCategory {
  if (!Number.isFinite(widthMm) || widthMm < WIDTH_NARROW_MAX) return "narrow";
  if (widthMm < WIDTH_MID_MAX) return "mid";
  return "long";
}

export function pickSizeCategory(widthMm: number, heightMm: number): {
  height: HeightCategory;
  width: WidthCategory;
} {
  return { height: pickHeightCategory(heightMm), width: pickWidthCategory(widthMm) };
}

export const HEIGHT_CATEGORIES: HeightCategory[] = ["low", "mid", "high"];
export const WIDTH_CATEGORIES: WidthCategory[] = ["narrow", "mid", "long"];

export const HEIGHT_CATEGORY_LABELS: Record<HeightCategory, string> = {
  low: "Низкая (1800–2400 мм)",
  mid: "Средняя (2400–2900 мм)",
  high: "Высокая (2900–3300 мм)",
};

export const WIDTH_CATEGORY_LABELS: Record<WidthCategory, string> = {
  narrow: "Узкая (1615–2100 мм)",
  mid: "Средняя (2100–3000 мм)",
  long: "Широкая (3000–4500 мм)",
};

export const SIZE_CATEGORY_LABEL_SHORT: Record<HeightCategory, string> & Record<WidthCategory, string> = {
  low: "Низкая",
  mid: "Средняя",
  high: "Высокая",
  narrow: "Узкая",
  long: "Широкая",
};

// ───────────────────────────────────────────────────────────────────────────
// Кастомные диапазоны на уровне подсистемы.
// Полосы задаются 4 числами (рёбра): [min, t1, t2, max].
//   высота: low=[min,t1), mid=[t1,t2), high=[t2,max]
//   ширина: narrow=[min,t1), mid=[t1,t2), long=[t2,max]
// Пороги для выбора категории — t1 и t2 (нижняя граница включена в верхнюю).
// ───────────────────────────────────────────────────────────────────────────

export type Bands = [number, number, number, number];

export interface SizeRanges {
  heightBands: Bands;
  widthBands: Bands;
}

export const DEFAULT_SIZE_RANGES: SizeRanges = {
  heightBands: [1800, 2400, 2900, 3300],
  widthBands: [1615, 2100, 3000, 4500],
};

/** Безопасно приводит произвольный JSON к SizeRanges, иначе — дефолт. */
export function parseSizeRanges(raw: unknown): SizeRanges {
  const def = DEFAULT_SIZE_RANGES;
  if (!raw || typeof raw !== "object") return def;
  const r = raw as Record<string, unknown>;
  const toBands = (v: unknown, fallback: Bands): Bands => {
    if (!Array.isArray(v) || v.length !== 4) return fallback;
    const nums = v.map((x) => Number(x));
    if (nums.some((n) => !Number.isFinite(n))) return fallback;
    return [nums[0], nums[1], nums[2], nums[3]] as Bands;
  };
  return {
    heightBands: toBands(r.heightBands, def.heightBands),
    widthBands: toBands(r.widthBands, def.widthBands),
  };
}

export function pickHeightCategoryR(heightMm: number, ranges: SizeRanges): HeightCategory {
  const [, t1, t2] = ranges.heightBands;
  if (!Number.isFinite(heightMm) || heightMm < t1) return "low";
  if (heightMm < t2) return "mid";
  return "high";
}

export function pickWidthCategoryR(widthMm: number, ranges: SizeRanges): WidthCategory {
  const [, t1, t2] = ranges.widthBands;
  if (!Number.isFinite(widthMm) || widthMm < t1) return "narrow";
  if (widthMm < t2) return "mid";
  return "long";
}

export function pickSizeCategoryR(widthMm: number, heightMm: number, ranges: SizeRanges): {
  height: HeightCategory;
  width: WidthCategory;
} {
  return {
    height: pickHeightCategoryR(heightMm, ranges),
    width: pickWidthCategoryR(widthMm, ranges),
  };
}

/** Метки категорий высоты на основе кастомных диапазонов. */
export function heightLabelsFromRanges(ranges: SizeRanges): Record<HeightCategory, string> {
  const [a, b, c, d] = ranges.heightBands;
  return {
    low: `Низкая (${a}–${b} мм)`,
    mid: `Средняя (${b}–${c} мм)`,
    high: `Высокая (${c}–${d} мм)`,
  };
}

/** Метки категорий ширины на основе кастомных диапазонов. */
export function widthLabelsFromRanges(ranges: SizeRanges): Record<WidthCategory, string> {
  const [a, b, c, d] = ranges.widthBands;
  return {
    narrow: `Узкая (${a}–${b} мм)`,
    mid: `Средняя (${b}–${c} мм)`,
    long: `Широкая (${c}–${d} мм)`,
  };
}
