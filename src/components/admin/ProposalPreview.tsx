"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import { type CalcComponent } from "@/lib/calculations/engine";
import PDFDownloadBtn from "@/components/pdf/PDFDownloadBtn";
import { extractSystemGroup, scaleSystemGroup, computeBBox, findDoorCenters, getSvgViewBox, setSvgViewBox } from "@/lib/svgGroup";
// Процедурная генерация (`tryGenerateSystemScheme` / `tryGenerateTopScheme` /
// `tryGenerateDoorScheme`) больше НЕ используется — теперь SVG загружаются
// заранее в /admin/variants (по 9 категорий размера) и /admin/doors.
// Файл `generateScheme.ts` оставлен в исходниках как backup.
import { systemsData } from "@/lib/calculations/systemsData";
import { pickSizeCategoryR, parseSizeRanges, DEFAULT_SIZE_RANGES, type SizeRanges } from "@/lib/calculations/sizeCategory";
import { glassOptions, shotlanOptions, hideWithRiffled } from "@/lib/calculations/constants";
import { Pencil, Check, X, FileText } from "lucide-react";

/**
 * Convert SVG string to PNG data URL via Canvas.
 * Uses base64 data URI to avoid blob/encoding issues with cyrillic text.
 */
/**
 * Convert SVG to PNG via server (sharp) and return base64 data URL + dimensions.
 */
async function svgToPngViaServer(svgContent: string): Promise<{ dataUrl: string; w: number; h: number }> {
  // Плейсхолдеры из buildDisplaySchemes идут с пустым svgContent — нет смысла
  // дёргать API ради 400 «Пустой SVG» (только спам в консоли). Возвращаем
  // пустой результат сразу.
  if (!svgContent || !svgContent.trim()) return { dataUrl: "", w: 0, h: 0 };
  const res = await fetch("/api/svg-to-png", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ svgContent }),
  });
  if (!res.ok) return { dataUrl: "", w: 0, h: 0 };
  const data = await res.json();
  return { dataUrl: data.dataUrl || "", w: data.width || 0, h: data.height || 0 };
}

/**
 * Преобразует URL картинки в формат, который сможет отрендерить react-pdf.
 *   • PNG/JPEG — возвращаются как есть (react-pdf их понимает).
 *   • SVG, WebP, GIF, BMP, TIFF — конвертируются в PNG через /api/image-to-png
 *     (sharp на сервере). React-pdf не умеет .svg/.webp через <Image>, поэтому
 *     без конвертации иконки «Преимуществ» и фото рельсы пропадают из PDF.
 */
async function imageUrlForPdf(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const isPngJpg = /\.(png|jpe?g)(\?|$)/i.test(url);
  if (isPngJpg) return url;
  try {
    const res = await fetch("/api/image-to-png", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.dataUrl || null;
  } catch {
    return null;
  }
}

/**
 * Inject dimension labels into SVG.
 * Replaces {{WIDTH}}, {{HEIGHT}}, {{DOOR_WIDTH}}, {{DOORS}} placeholders.
 * Also appends dimension lines with arrows below and to the right of the SVG.
 */
/**
 * «Вид системы» рисуется в ФИКСИРОВАННОМ КВАДРАТНОМ «слоте» SYSTEM_SLOT_SIDE.
 * viewBox схемы всегда этого размера (+ поля под размерные линии), поэтому место
 * под «Вид системы» в PDF/превью не меняется — меняется только сама система
 * внутри:
 *   • система рисуется в фактических пропорциях W:H (квадрат → квадрат,
 *     2000×2999 → вертикальный прямоугольник; для процедурных схем — ровно в мм);
 *   • «выигравшая» (бо́льшая) ось занимает 100% слота, когда она ⩾
 *     SYSTEM_FULL_THRESHOLD (3000 мм) — например, H = 3000+ → высота 100%;
 *   • при меньших габаритах бо́льшая ось линейно уменьшается до
 *     SYSTEM_MIN_FRACTION (60%) при бо́льшей оси = 0;
 *   • система прижата к ЛЕВОМУ-НИЖНЕМУ углу слота.
 * Размерные линии — на всю ширину/высоту слота (фиксированные): ширина снизу,
 * высота слева; меняются только цифры.
 */
const SYSTEM_SLOT_SIDE = 10000;        // сторона квадратного слота (любые единицы)
const SYSTEM_FULL_THRESHOLD = 3000;    // мм: при max(W, H) ⩾ этого бо́льшая ось = 100% слота
const SYSTEM_MIN_FRACTION = 0.6;       // нижняя граница доли слота (защита от слишком маленькой системы)

/**
 * Масштаб габаритов проёма (W × H мм) в координаты квадратного слота:
 *   • аспект сохраняется (реальные пропорции W:H);
 *   • при max(W, H) ⩾ SYSTEM_FULL_THRESHOLD бо́льшая ось = 100% слота
 *     (например, H = 3000+ → высота заполняет весь слот);
 *   • иначе fill линейно: max/THRESHOLD от SYSTEM_MIN_FRACTION до 1.
 */
function systemSlotScale(openingW: number, openingH: number): number {
  if (!(openingW > 0) || !(openingH > 0)) return 1;
  const maxDim = Math.max(openingW, openingH);
  const fit = SYSTEM_SLOT_SIDE / maxDim; // бо́льшая ось → 100%
  const fillFactor = Math.min(maxDim / SYSTEM_FULL_THRESHOLD, 1);
  const fill = SYSTEM_MIN_FRACTION + (1 - SYSTEM_MIN_FRACTION) * fillFactor;
  return fit * fill;
}

/**
 * Прямоугольник «стекла» ОДНОЙ двери внутри ИТОГОВОГО «вида системы», в
 * координатах его viewBox. Содержимое <g id="system"> отрендерено с масштабом
 * bbox(refW×refH) → W·s × H·s (s = systemSlotScale); computeBBox/findDoorCenters
 * читают координаты ДО transform → умножаем на масштаб.
 * null, если в «виде системы» не распознано «стекло».
 */
function systemDoorGlassRect(
  renderedSysSvg: string,
  openingW: number,
  openingH: number,
  doorWidthMm: number,
): { w: number; h: number } | null {
  const sysGroup = extractSystemGroup(renderedSysSvg);
  const sysInner = sysGroup?.inner ?? renderedSysSvg;
  const sysBBox = computeBBox(sysInner);
  if (!sysBBox || sysBBox.w <= 0 || sysBBox.h <= 0) return null;
  const numDoors = Math.max(1, Math.round(openingW / Math.max(1, doorWidthMm)));
  const s = sysGroup ? systemSlotScale(openingW, openingH) : 1;
  const scaleX = sysGroup ? (openingW * s) / sysBBox.w : 1;
  const scaleY = sysGroup ? (openingH * s) / sysBBox.h : 1;
  const rects = findDoorCenters(sysInner);
  // Высота двери надёжна даже если все двери одним <path> (bbox по Y = высота двери).
  const rectH = rects[0]?.h ?? sysBBox.h;
  let rectW: number;
  if (rects.length >= 2) {
    rectW = rects[0].w;
  } else if (rects.length === 1) {
    const r = rects[0];
    // один rect шире ~70% bbox + дверей больше одной → это все двери одним path → делим
    rectW = numDoors > 1 && r.w >= sysBBox.w * 0.7 ? r.w / numDoors : r.w;
  } else {
    rectW = sysBBox.w / numDoors;
  }
  const w = rectW * scaleX;
  const h = rectH * scaleY;
  if (!(w > 0) || !(h > 0)) return null;
  return { w, h };
}


/**
 * Доли «дверного» прямоугольника в ИТОГОВЫХ (после renderSvgWithDimensions)
 * картинках «вида системы» и «вида двери»:
 *   sys  — доля {w,h} от viewBox «вида системы» (одна дверь внутри неё);
 *   door — доля {w,h} от viewBox «вида двери».
 *   sysPadBFrac / doorPadBFrac — доля padBottom (свободное место СНИЗУ под
 *   стеклом, до низа SVG). Нужны для точного выравнивания нижней кромки
 *   стекла двери и стекла системы: стекло системы прижато к низу слота,
 *   стекло двери — к низу содержимого, поэтому в обоих случаях расстояние
 *   от низа SVG до низа стекла = padBottom. Сравниваем доли, чтобы найти
 *   сдвиг дверной картинки.
 * null, если в одной из картинок нет «двери» (`fill="#D5FFFF"`) или нет «вида двери».
 */
/**
 * Извлекает позиции и тексты подписей из top-view SVG (после template-replace).
 * Парсит каждый <text>...</text>: достаёт tspan x, y и transform=matrix(...)
 * (если есть), вычисляет визуальную позицию в viewBox и нормализует.
 *
 * Возвращает массив { xNorm, yNorm, text } — раскладка рисует overlay-span с тем
 * же стилем, что у «Вид системы»/«Вид двери», на нужных позициях.
 */
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ""; }
    })
    .replace(/&#(\d+);/g, (_, d) => {
      try { return String.fromCodePoint(parseInt(d, 10)); } catch { return ""; }
    });
}

function applyTransformToPoint(transform: string, x: number, y: number): { x: number; y: number } {
  let nx = x, ny = y;
  // translate(tx, ty) | translate(tx,ty) | translate(tx) — ty=0.
  const tr = transform.match(/translate\(\s*([-\d.]+)(?:\s*[,\s]\s*([-\d.]+))?\s*\)/i);
  if (tr) {
    nx += parseFloat(tr[1]);
    if (tr[2]) ny += parseFloat(tr[2]);
  }
  // matrix(a,b,c,d,e,f) — без поворота поддерживаем строго.
  const mat = transform.match(/matrix\(\s*([-\d.,\s]+)\s*\)/i);
  if (mat) {
    const nums = mat[1].split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length >= 6 && nums.every(Number.isFinite)) {
      const [a, , , d, e, f] = nums;
      nx = a * nx + e;
      ny = d * ny + f;
    }
  }
  return { x: nx, y: ny };
}

function extractTopLabels(svgContent: string): Array<{ xNorm: number; yNorm: number; text: string }> {
  const vb = getSvgViewBox(svgContent);
  // Парсим SVG через DOMParser — так корректно учитываем СУММУ transform'ов
  // от <text> и всех родительских <g> (Figma-экспорт оборачивает группы в
  // <g transform="translate(...)"> для смещений, наш ручной разнос
  // bot_object/middle_object тоже так делает).
  type Pos = { x: number; y: number; text: string; value: number };
  const positions: Pos[] = [];
  if (typeof window === "undefined" || !svgContent) return [];
  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(svgContent, "image/svg+xml");
  } catch {
    return [];
  }
  const svgRoot = doc.documentElement;
  if (!svgRoot || svgRoot.nodeName.toLowerCase() !== "svg") return [];

  const texts = Array.from(doc.getElementsByTagName("text"));
  for (const text of texts) {
    const tspan = text.querySelector("tspan");
    const target = tspan ?? text;
    const xAttr = target.getAttribute("x");
    const yAttr = target.getAttribute("y");
    let x = parseFloat(xAttr ?? "");
    let y = parseFloat(yAttr ?? "");
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    // Поднимаемся вверх по дереву и аккумулируем все transform'ы.
    let node: Element | null = text;
    while (node && node !== svgRoot) {
      const tr = node.getAttribute("transform");
      if (tr) {
        const next = applyTransformToPoint(tr, x, y);
        x = next.x;
        y = next.y;
      }
      node = node.parentElement;
    }

    const rawInner = decodeXmlEntities(text.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!rawInner) continue;
    const numMatch = rawInner.match(/(\d+(?:[.,]\d+)?)/);
    const value = numMatch ? parseFloat(numMatch[1].replace(",", ".")) : 0;
    positions.push({ x, y, text: rawInner, value });
  }
  if (positions.length === 0) return [];

  // Если viewBox есть И у всех подписей координаты валидны и попадают в viewBox —
  // используем РЕАЛЬНЫЕ позиции (как в figma-SVG: WIDTH_text сверху по центру,
  // DOOR_WIDTH_text слева чуть выше середины и т.п.). Иначе — фолбэк на
  // фиксированные позиции (старые SVG с координатами за viewBox).
  const insideVB =
    vb &&
    positions.every(
      (p) =>
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        p.x >= vb.x - vb.w * 0.05 &&
        p.x <= vb.x + vb.w * 1.05 &&
        p.y >= vb.y - vb.h * 0.05 &&
        p.y <= vb.y + vb.h * 1.05,
    );

  if (insideVB && vb) {
    return positions.map((p) => ({
      xNorm: (p.x - vb.x) / vb.w,
      yNorm: (p.y - vb.y) / vb.h,
      text: p.text,
    }));
  }

  // Фолбэк: фикс-позиции по убыванию числа в тексте.
  const sortedLabels = [...positions].sort((a, b) => b.value - a.value);
  const fb: number[] = (() => {
    const n = sortedLabels.length;
    if (n === 1) return [0.08];
    if (n === 2) return [0.06, 0.78];
    if (n === 3) return [0.06, 0.46, 0.92];
    return Array.from({ length: n }, (_, i) => 0.06 + (0.86 * i) / (n - 1));
  })();
  return sortedLabels.map((lbl, i) => ({
    xNorm: 0.5,
    yNorm: fb[i] ?? 0.5,
    text: lbl.text,
  }));
}

function computeDoorBox(
  renderedSysSvg: string,
  renderedDoorSvg: string | null,
  openingW: number,
  openingH: number,
  doorWidthMm: number,
): {
  sys: { w: number; h: number };
  door: { w: number; h: number };
  sysPadBFrac: number;
  doorPadBFrac: number;
} | null {
  if (!renderedDoorSvg) return null;
  const sysVB = getSvgViewBox(renderedSysSvg);
  const dVB = getSvgViewBox(renderedDoorSvg);
  if (!sysVB || !dVB || sysVB.w <= 0 || sysVB.h <= 0 || dVB.w <= 0 || dVB.h <= 0) return null;
  const dGroup = extractSystemGroup(renderedDoorSvg);
  const dRect = findDoorCenters(dGroup?.inner ?? renderedDoorSvg)[0];
  if (!dRect || dRect.w <= 0 || dRect.h <= 0) return null;
  const sysRect = systemDoorGlassRect(renderedSysSvg, openingW, openingH, doorWidthMm);
  if (!sysRect) return null;
  const sysPadBFrac = parseFloat(renderedSysSvg.match(/data-pad-bottom-frac="([\d.]+)"/)?.[1] ?? "0") || 0;
  const doorPadBFrac = parseFloat(renderedDoorSvg.match(/data-pad-bottom-frac="([\d.]+)"/)?.[1] ?? "0") || 0;
  return {
    sys: { w: sysRect.w / sysVB.w, h: sysRect.h / sysVB.h },
    door: { w: dRect.w / dVB.w, h: dRect.h / dVB.h },
    sysPadBFrac,
    doorPadBFrac,
  };
}

/**
 * Add dimension lines and labels to SVG.
 * schemeIndex 0 = system (width + height of opening)
 * schemeIndex 1 = door (doorWidth + height)
 */
function renderSvgWithDimensions(
  svgContent: string,
  width: number,
  height: number,
  doorWidth: number,
  _doors: number,
  schemeIndex: number = 0,
): string {
  let svg = svgContent
    // {{WIDTH}} — общая ширина проёма для «Вид системы» (idx 0) и «Вид
    // сверху» (idx 2). Для «Вид двери» (idx 1) — ширина одной двери.
    .replace(/\{\{WIDTH\}\}/g, String(schemeIndex === 1 ? doorWidth : width))
    .replace(/\{\{HEIGHT\}\}/g, String(height))
    .replace(/\{\{DOOR_WIDTH\}\}/g, String(doorWidth))
    // Свободный проём, когда все двери сдвинуты в один край
    // (для каскада ≈ 2 × ширина двери). Используется в виде сверху.
    .replace(/\{\{GAP_MINUS_DOOR\}\}/g, String(Math.max(0, width - doorWidth)))
    .replace(/\{\{DOORS\}\}/g, "");

  // Force a consistent font family for any <text> elements already baked into the SVG,
  // so embedded size labels don't look out of place next to the ones we add below.
  svg = svg.replace(/<text\b([^>]*)>/gi, (_, attrs) => {
    const cleaned = attrs
      .replace(/\sfont-family\s*=\s*["'][^"']*["']/gi, "")
      .replace(/\sfont-weight\s*=\s*["'][^"']*["']/gi, "");
    return `<text${cleaned} font-family="Arial, Helvetica, sans-serif" font-weight="700">`;
  });

  // Авто-разнос группового SVG для «Вид сверху»: если файл содержит
  // <g id="middle_object"> и <g id="bot_object"> (наша figma-конвенция),
  // движок сам сдвигает их вниз и расширяет viewBox — пользователю достаточно
  // просто экспортнуть из Figma как есть, без ручной правки координат.
  if (schemeIndex === 2 && /id="middle_object"/.test(svg) && /id="bot_object"/.test(svg)) {
    const MIDDLE_DELTA = 400;
    const BOT_DELTA = 800;
    // Добавляем translate, только если на группе ещё нет transform.
    svg = svg.replace(/<g(\s+[^>]*?)id="middle_object"([^>]*)>/i, (m, before, after) => {
      if (/transform=/.test(before) || /transform=/.test(after)) return m;
      return `<g${before}id="middle_object" transform="translate(0, ${MIDDLE_DELTA})"${after}>`;
    });
    svg = svg.replace(/<g(\s+[^>]*?)id="bot_object"([^>]*)>/i, (m, before, after) => {
      if (/transform=/.test(before) || /transform=/.test(after)) return m;
      return `<g${before}id="bot_object" transform="translate(0, ${BOT_DELTA})"${after}>`;
    });
    // Расширяем viewBox по высоте на BOT_DELTA — чтобы сдвинутый bot_object
    // не обрезался.
    svg = svg.replace(/viewBox\s*=\s*["']([^"']+)["']/i, (m, vb) => {
      const parts = vb.split(/[\s,]+/).filter(Boolean).map(Number);
      if (parts.length !== 4 || !parts.every(Number.isFinite)) return m;
      return `viewBox="${parts[0]} ${parts[1]} ${parts[2]} ${parts[3] + BOT_DELTA}"`;
    });
    // Атрибуты width/height на <svg> и clipPath rect — тоже подкрутим.
    svg = svg.replace(/(<svg\b[^>]*\s)height\s*=\s*["']([\d.]+)["']/i, (m, pre, h) => {
      return `${pre}height="${parseFloat(h) + BOT_DELTA}"`;
    });
    svg = svg.replace(
      /(<rect\b[^>]*\s)height\s*=\s*["']([\d.]+)["']([^>]*\/?>)/i,
      (m, pre, h, post) => {
        // Расширяем только rect внутри clipPath (он один и совпадает с viewBox).
        const newH = parseFloat(h) + BOT_DELTA;
        return `${pre}height="${newH}"${post}`;
      },
    );
  }


  // ──────────────────────────────────────────────────────────────────────
  // «Вид системы» (schemeIndex 0): фиксированный квадратный «слот»
  //   SYSTEM_SLOT_SIDE × SYSTEM_SLOT_SIDE. viewBox схемы всегда такого размера.
  //   1) содержимое <g id="system"> масштабируем так, чтобы его bbox стал
  //      W·s × H·s в координатах слота (s = systemSlotScale). Аспект W:H
  //      сохраняется; «выигравшая» ось = 100% слота при |W−H| ⩾ 1000 мм,
  //      при W = H — 60% слота. Origin масштаба = левый-верхний угол bbox.
  //   2) viewBox = слот; левый край = левый край системы, нижний = нижний →
  //      система прижата к ЛЕВОМУ-НИЖНЕМУ углу слота, свободное место —
  //      справа и сверху.
  // Для процедурных схем bbox группы = W × H, так что content-scale = s, s.
  // ──────────────────────────────────────────────────────────────────────
  let systemSlot = false;
  if (schemeIndex === 0 && width > 0 && height > 0) {
    const group = extractSystemGroup(svg);
    if (group) {
      const bbox = computeBBox(group.inner);
      if (bbox && bbox.w > 0 && bbox.h > 0) {
        const s = systemSlotScale(width, height);
        const sysW = width * s;   // ширина системы в координатах слота
        const sysH = height * s;  // высота системы в координатах слота
        const sx = sysW / bbox.w;
        const sy = sysH / bbox.h;
        if (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001) {
          svg = scaleSystemGroup(svg, sx, sy, "left-top"); // origin = (bbox.x, bbox.y)
        }
        // После масштаба система занимает [bbox.x .. bbox.x+sysW] × [bbox.y .. bbox.y+sysH].
        // viewBox-слот: левый край = bbox.x; нижний = bbox.y + sysH.
        const slotX = bbox.x;
        const slotY = bbox.y + sysH - SYSTEM_SLOT_SIDE;
        svg = setSvgViewBox(svg, { x: slotX, y: slotY, w: SYSTEM_SLOT_SIDE, h: SYSTEM_SLOT_SIDE });
        svg = svg.replace(/(<svg\b[^>]*?)\bwidth\s*=\s*["'][\d.]+["']/i, `$1width="${SYSTEM_SLOT_SIDE}"`);
        svg = svg.replace(/(<svg\b[^>]*?)\bheight\s*=\s*["'][\d.]+["']/i, `$1height="${SYSTEM_SLOT_SIDE}"`);
        // Белая подложка под весь слот (исходная могла быть меньше или сдвинута).
        const pad = SYSTEM_SLOT_SIDE;
        svg = svg.replace(
          /(<svg\b[^>]*?>)/i,
          `$1<rect x="${Math.round(slotX - pad)}" y="${Math.round(slotY - pad)}" width="${SYSTEM_SLOT_SIDE + pad * 3}" height="${SYSTEM_SLOT_SIDE + pad * 3}" fill="#ffffff"/>`,
        );
        systemSlot = true;
      }
    }
  }

  // Parse viewBox
  const vbMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (!vbMatch) return svg;
  const parts = vbMatch[1].split(/[\s,]+/).map(Number);
  const vbX = parts[0], vbY = parts[1], svgW = parts[2], svgH = parts[3];

  // Для «Вида сверху» (schemeIndex 2): удаляем все <text> из SVG.
  // Подписи «X мм» рисуются ВНЕ SVG как HTML-overlay (см. topLabels), с тем
  // же шрифтом и размером, что и у «Вид системы»/«Вид двери».
  if (schemeIndex === 2) {
    svg = svg.replace(/<text\b[^>]*>[\s\S]*?<\/text>/gi, "");
  }

  // Опорный прямоугольник для размерных линий = весь viewBox (для «вида системы»
  // — весь слот; линии не зависят от размера системы, меняются только цифры).
  const dimRefX = vbX;
  const dimRefY = vbY;
  const dimRefW = svgW;
  const dimRefH = svgH;

  // Подпись ширины: door view (idx 1) показывает ширину двери, остальные — полную ширину проёма.
  const dimW = schemeIndex === 1 ? doorWidth : width;
  const dimH = height;

  // Размещение авто-подписей размеров по индексу схемы (side-view удалён):
  //   0 — вид системы: рисуем ТОЛЬКО размерные линии; числа «… мм» выводит
  //       раскладка СНАРУЖИ (PDF: <Text>, превью: <span>) — фиксированный
  //       размер шрифта, одинаковый с «видом двери»;
  //   1 — вид двери:   так же — линии внутри SVG, числа снаружи;
  //   2 — вид сверху:  свои внутренние размерные линии, авто-подписи не нужны.
  const showWidthDim = schemeIndex !== 2;   // линии ширины
  const showHeightDim = schemeIndex !== 2;  // линии высоты
  const showDimNumbers = false;             // числа «… мм» больше НЕ рисуются внутри SVG
  const heightDimOnLeft = systemSlot;       // у «вида системы» высота слева, иначе справа

  // Шкала подписей размеров.
  //   • Процедурные SVG (data-procedural) — шкала по реальным размерам проёма.
  //   • Загруженные SVG с <g id="system"> — тоже по реальным размерам, иначе
  //     при огромном viewBox (14901, например) подписи становятся слишком
  //     толстыми относительно реально маленькой системы 2000×2000.
  //   • Прочие — по viewBox (legacy).
  const isProcedural = /<svg\b[^>]*\bdata-procedural\b/i.test(svg);
  const hasSystemGroup = /<g\b[^>]*\bid\s*=\s*["']system["']/i.test(svg)
    || /<g\b[^>]*\binkscape:label\s*=\s*["']system["']/i.test(svg);
  const useRealScale = isProcedural || hasSystemGroup;
  // Для нормального шрифта на больших viewBox нужно учитывать масштаб системы
  // в координатах SVG. Берём bbox системы (если есть) и переводим реальный
  // размер в эти единицы.
  let sc: number;
  if (systemSlot) {
    // «Вид системы»: шкалу подписей/линий считаем по СЛОТУ (svgW × svgH = 12000×3500),
    // а не по самой системе — иначе при маленькой системе подписи получаются
    // нечитаемо мелкими относительно картинки в целом.
    sc = Math.max(svgW, svgH) / 200;
  } else if (useRealScale) {
    // Базовая шкала от реальных габаритов проёма
    const realScale = Math.max(width, height) / 200;
    // Коэффициент пересчёта в единицы viewBox: bbox системы → viewBox
    const sysGroup = extractSystemGroup(svg);
    const sysBBox = sysGroup ? computeBBox(sysGroup.inner) : null;
    const sysSpan = sysBBox ? Math.max(sysBBox.w, sysBBox.h) : Math.max(svgW, svgH);
    const realSpan = Math.max(width, height) || 1;
    const ratio = sysSpan / realSpan; // сколько viewBox-единиц приходится на 1мм реальных
    sc = realScale * ratio;
  } else {
    sc = Math.max(svgW, svgH) / 200;
  }
  const lineW = Math.max(sc * 0.3, 0.5);
  const tickL = Math.round(sc * 2);
  // Множитель шрифта: для дверного слота повышенный — дверная картинка
  // в PDF рендерится в более узкой области, чем системная, и при тех же
  // SVG-единицах текст после стретча получается мельче. Поэтому на этапе
  // SVG увеличиваем размер шрифта, чтобы итог на странице совпадал с
  // системными подписями.
  const fontMul = schemeIndex === 1 ? 9 : 6;
  const fontSize = Math.max(Math.round(sc * fontMul), 22);
  const gap = Math.round(sc * 3);

  const labelPad = Math.max(fontSize * 0.5, 6);

  // Bottom dimension line (width) — на всю ширину опорного прямоугольника, ниже него.
  const bLineY = dimRefY + dimRefH + gap;
  const bLeft = dimRefX;
  const bRight = dimRefX + dimRefW;
  const bMidX = dimRefX + dimRefW / 2;
  const bTextY = bLineY + gap + fontSize;

  // Height dimension line — на всю высоту опорного прямоугольника. Для «вида
  // системы» — слева от него, для остальных — справа.
  const hLineX = heightDimOnLeft ? dimRefX - gap : dimRefX + dimRefW + gap;
  const hTop = dimRefY;
  const hBottom = dimRefY + dimRefH;
  const hMidY = dimRefY + dimRefH / 2;
  const hTextX = heightDimOnLeft ? hLineX - gap - fontSize : hLineX + gap + fontSize;
  // Поворот текста: слева читается снизу-вверх (−90°), справа — сверху-вниз (+90°).
  const hTextRot = heightDimOnLeft ? -90 : 90;

  const bits: string[] = [];
  bits.push(`<g fill="none" stroke="#333" stroke-width="${lineW}">`);
  if (showWidthDim) {
    bits.push(
      `<line x1="${bLeft}" y1="${bLineY}" x2="${bRight}" y2="${bLineY}"/>`,
      `<line x1="${bLeft}" y1="${bLineY - tickL}" x2="${bLeft}" y2="${bLineY + tickL}"/>`,
      `<line x1="${bRight}" y1="${bLineY - tickL}" x2="${bRight}" y2="${bLineY + tickL}"/>`,
    );
  }
  if (showHeightDim) {
    bits.push(
      `<line x1="${hLineX}" y1="${hTop}" x2="${hLineX}" y2="${hBottom}"/>`,
      `<line x1="${hLineX - tickL}" y1="${hTop}" x2="${hLineX + tickL}" y2="${hTop}"/>`,
      `<line x1="${hLineX - tickL}" y1="${hBottom}" x2="${hLineX + tickL}" y2="${hBottom}"/>`,
    );
  }
  bits.push(`</g>`);
  // Числа «… мм» внутри SVG — только у «вида системы» (он не растягивается).
  // У «вида двери» числа выводит раскладка снаружи контейнера.
  if (showDimNumbers) {
    bits.push(`<g font-family="Arial, Helvetica, sans-serif" fill="#0A3C46" font-weight="700" font-size="${fontSize}">`);
    if (showWidthDim) {
      bits.push(`<text x="${bMidX}" y="${bTextY}" text-anchor="middle">${dimW} мм</text>`);
    }
    if (showHeightDim) {
      bits.push(`<text x="${hTextX}" y="${hMidY}" text-anchor="middle" transform="rotate(${hTextRot},${hTextX},${hMidY})">${dimH} мм</text>`);
    }
    bits.push(`</g>`);
  }
  // «Вид сверху» (schemeIndex 2): автоматическая подпись «… мм» над каждой
  // ПОЛОСОЙ (горизонтальный <line> с толстым stroke). Работает и для
  // процедурного SVG (buildCascade3plus0Top), и для любого загруженного
  // top-view. Длина считается в единицах viewBox SVG — для процедурного
  // (data-procedural) viewBox в мм, число совпадает с реальной шириной полосы.
  // Для «Вида сверху» (schemeIndex 2) подписи «… мм» внутри SVG БОЛЬШЕ не
  // рисуем — их выводит раскладка снаружи (HTML <span> / PDF <Text>) с тем же
  // стилем dimNumStyle, что и у «Вида системы»/«Вида двери». Это даёт одинаковый
  // шрифт и размер. Позиции полос извлекаются отдельно через extractTopStripes
  // и оверлеятся поверх картинки.
  if (schemeIndex === 2) {
    // intentionally no bits — labels rendered outside SVG
  }
  const dimLines = bits.join("\n");

  // Маленький буфер под stroke геометрии, который частично выходит за границы
  // viewBox. Без буфера sharp обрезает stroke и кромка выглядит тоньше.
  const strokeBuf = Math.max(lineW * 4, 6);
  const dimLabelPad = gap * 2 + labelPad + fontSize;       // под линию + число «… мм» (вид системы)
  const dimLabelPadH = gap * 2 + labelPad + fontSize * 2;  // то же для повёрнутого числа высоты
  const dimLineOnly = gap + tickL + strokeBuf;             // только линия + засечки
  // Места под подписи: числа «… мм» сейчас выводит раскладка СНАРУЖИ SVG
  // (PDF/превью), но место под них ВНУТРИ SVG всё равно резервируем —
  // система и дверь должны иметь одинаковые доли стекла внутри своего
  // viewBox, иначе при выравнивании по нижней кромке стёкла визуально
  // съезжают. Резервируем для всех схем, где есть размерные линии.
  const reserveDimSpace = schemeIndex === 0 || schemeIndex === 1;
  const widthPad = showWidthDim ? (reserveDimSpace ? dimLabelPad : dimLineOnly) : strokeBuf;
  const heightPad = showHeightDim ? (reserveDimSpace ? dimLabelPadH : dimLineOnly) : strokeBuf;
  // Поля холста вокруг опорного прямоугольника: со стороны линии ширины (снизу),
  // со стороны линии высоты (слева у «вида системы», справа у «вида двери»),
  // остальное — тонкий буфер.
  const padLeft = heightDimOnLeft ? heightPad : strokeBuf;
  const padRight = heightDimOnLeft ? strokeBuf : heightPad;
  const padBottom = widthPad;
  const padTop = strokeBuf;
  const newOriginX = vbX - padLeft;
  const newOriginY = vbY - padTop;
  const newW = Math.round(padLeft + svgW + padRight);
  const newH = Math.round(padTop + svgH + padBottom);
  svg = svg.replace(vbMatch[0], `viewBox="${newOriginX} ${newOriginY} ${newW} ${newH}"`);

  // Also update width/height attributes on <svg>
  svg = svg.replace(/(<svg[^>]*)\bwidth="[\d.]+"/, `$1 width="${newW}"`);
  svg = svg.replace(/(<svg[^>]*)\bheight="[\d.]+"/, `$1 height="${newH}"`);

  // Доли padding'ов на итоговый holst — нужны для точного выравнивания
  // нижней кромки СТЕКЛА в «виде двери» с нижней кромкой стекла «вида
  // системы». Сохраняем в data-атрибутах корневого <svg>, чтобы потом
  // прочитать в computeDoorBox.
  const padBottomFrac = newH > 0 ? padBottom / newH : 0;
  const padTopFrac = newH > 0 ? padTop / newH : 0;
  svg = svg.replace(/<svg\b/i, `<svg data-pad-bottom-frac="${padBottomFrac.toFixed(6)}" data-pad-top-frac="${padTopFrac.toFixed(6)}"`);

  // «Вид двери» в раскладке выводится в боксе другого аспекта (его «стекло»
  // подгоняют под одну дверь «вида системы»), поэтому растягиваем содержимое
  // (а не letterbox-им): preserveAspectRatio="none". Сами числа «… мм» рисует
  // раскладка снаружи, так что они не растягиваются. (Для остальных видов бокс =
  // аспекту viewBox, так что эффекта нет.)
  if (schemeIndex === 1 && !/\bpreserveAspectRatio\s*=/i.test(svg.slice(0, svg.indexOf(">") + 1))) {
    svg = svg.replace(/<svg\b/i, '<svg preserveAspectRatio="none"');
  }

  // Insert before </svg>
  svg = svg.replace(/<\/svg>/i, dimLines + "\n</svg>");

  return svg;
}

interface VariantItem {
  title: string;
  description: string;
  iconUrl: string | null;
}

interface SchemeData {
  label: string;
  svgContent: string;
  ratioType?: string | null;
  /** «low» | «mid» | «high». Только для ratioType=system|top. */
  heightCategory?: string | null;
  /** «narrow» | «mid» | «long». */
  widthCategory?: string | null;
}

const SYSTEM_RATIO_TYPES = new Set(["system", "wide", "square", "tall"]);

/**
 * Подобрать схему по (ratioType, heightCategory, widthCategory).
 * Приоритет:
 *   1) точное совпадение по обеим категориям;
 *   2) legacy без категорий (h=null, w=null) того же ratioType;
 *   3) null — раскладка покажет заглушку «не загружено».
 */
function pickByCategory(
  schemes: SchemeData[],
  ratioType: string,
  hCat: string,
  wCat: string,
): SchemeData | null {
  const ofType = schemes.filter((s) => s.ratioType === ratioType);
  const exact = ofType.find((s) => s.heightCategory === hCat && s.widthCategory === wCat);
  if (exact) return exact;
  const legacy = ofType.find((s) => s.heightCategory == null && s.widthCategory == null);
  if (legacy) return legacy;
  return null;
}

/**
 * Pick the right system scheme based on width/height ratio.
 *
 * Новый режим: если среди схем есть хоть одна с обёрткой <g id="system">,
 *              используем её для любых пропорций — система внутри неё
 *              масштабируется через transform (см. renderSvgWithDimensions).
 * Старый режим: ищем схему по ratioType (wide/square/tall) как раньше.
 */
function pickSystemScheme(schemes: SchemeData[], width: number, height: number): SchemeData | null {
  // 1. Adaptive по ratioType + наличию <g id="system">
  const adaptiveByType = schemes.find(
    (s) =>
      s.ratioType &&
      SYSTEM_RATIO_TYPES.has(s.ratioType) &&
      extractSystemGroup(s.svgContent) !== null
  );
  if (adaptiveByType) return adaptiveByType;

  // 1b. Любая схема с <g id="system"> внутри (без проверки ratioType) —
  // полезно когда дизайнер забыл проставить тип, но схема правильно
  // структурирована.
  const adaptiveAny = schemes.find((s) => extractSystemGroup(s.svgContent) !== null);
  if (adaptiveAny) return adaptiveAny;

  // 2. Legacy fallback по соотношению
  const ratio = width / height;
  let type: string;
  if (ratio > 1.15) type = "wide";
  else if (ratio < 0.87) type = "tall";
  else type = "square";

  const match = schemes.find((s) => s.ratioType === type);
  if (match) return match;
  return schemes.find((s) => s.ratioType && SYSTEM_RATIO_TYPES.has(s.ratioType)) || null;
}

/**
 * Get a scheme by its explicit type. For "door" also falls back to legacy
 * schemes stored with `ratioType = null` (before types were introduced).
 */
function getSchemeByType(schemes: SchemeData[], type: "door" | "side" | "top"): SchemeData | null {
  const byType = schemes.find((s) => s.ratioType === type);
  if (byType) return byType;
  if (type === "door") {
    // Legacy: null ratioType used to mean "door"
    return schemes.find((s) => !s.ratioType) || null;
  }
  return null;
}

interface DoorSchemeRowLite {
  svgContent: string;
  viewType: "system" | "top" | "door";
  shotlanType: string | null;
  heightCategory: string | null;
  widthCategory: string | null;
}

/**
 * Подобрать SVG из DoorScheme[] по viewType и категории.
 * Для viewType="top" учитываем ТОЛЬКО widthCategory (вид сверху не зависит
 * от высоты), и записи в БД для top имеют heightCategory=null.
 * Для viewType="system" — точное совпадение (h, w); fallback на legacy без
 * категорий; иначе null.
 */
function pickDoorSchemeByCategory(
  rows: DoorSchemeRowLite[],
  viewType: "system" | "top",
  hCat: string,
  wCat: string,
): DoorSchemeRowLite | null {
  const ofType = rows.filter((r) => r.viewType === viewType);
  if (viewType === "top") {
    const exact = ofType.find((r) => r.widthCategory === wCat);
    if (exact) return exact;
    const legacy = ofType.find((r) => r.widthCategory == null);
    if (legacy) return legacy;
    return null;
  }
  const exact = ofType.find((r) => r.heightCategory === hCat && r.widthCategory === wCat);
  if (exact) return exact;
  const legacy = ofType.find((r) => r.heightCategory == null && r.widthCategory == null);
  if (legacy) return legacy;
  return null;
}

/**
 * Build the ordered list of schemes to display in preview/PDF.
 *
 * Источник SVG — `doorSchemes` (DoorScheme из БД, загружается из /admin/doors).
 * Внутри:
 *   1) «Вид системы» — viewType="system" + (h, w);
 *   2) «Вид двери»   — doorSvgFromShotlan (уже подобран по шотланке);
 *   3) «Вид сверху»  — viewType="top" + (h, w).
 *
 * `schemes` (SubsystemScheme[]) ещё передаётся для совместимости — это legacy
 * SVG, прикреплённые к SubsystemVariant. Используются ТОЛЬКО как последний
 * fallback, если в DoorScheme нет ничего для этой подсистемы.
 *
 * Процедурная генерация (`tryGenerateSystemScheme` / `tryGenerateTopScheme`)
 * больше НЕ используется — оставлена в исходниках как backup.
 */
function buildDisplaySchemes(
  schemes: SchemeData[],
  doorSchemes: DoorSchemeRowLite[],
  width: number,
  height: number,
  _doorWidth: number,
  _systemName: string,
  _subsystem: string,
  doorSvgFromShotlan?: string | null,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES,
): SchemeData[] {
  const out: SchemeData[] = [];
  const { height: hCat, width: wCat } = pickSizeCategoryR(width, height, ranges);

  // System view: новый источник → legacy → placeholder.
  const sysFromDoors = pickDoorSchemeByCategory(doorSchemes, "system", hCat, wCat);
  if (sysFromDoors) {
    out.push({ label: "Вид системы", svgContent: sysFromDoors.svgContent, ratioType: "system" });
  } else {
    const sysLegacy = pickByCategory(schemes, "system", hCat, wCat) ?? pickSystemScheme(schemes, width, height);
    if (sysLegacy) out.push(sysLegacy);
    else out.push({ label: "Вид системы", svgContent: "", ratioType: "system" });
  }

  // Door view: SVG от шотланки (подобран снаружи) → placeholder.
  if (doorSvgFromShotlan) {
    out.push({ label: "Вид двери", svgContent: doorSvgFromShotlan, ratioType: "door" });
  } else {
    out.push({ label: "Вид двери", svgContent: "", ratioType: "door" });
  }

  // Top view: новый источник → legacy → placeholder.
  const topFromDoors = pickDoorSchemeByCategory(doorSchemes, "top", hCat, wCat);
  if (topFromDoors) {
    out.push({ label: "Вид сверху", svgContent: topFromDoors.svgContent, ratioType: "top" });
  } else {
    const topLegacy = pickByCategory(schemes, "top", hCat, wCat) ?? getSchemeByType(schemes, "top");
    if (topLegacy) out.push(topLegacy);
    else out.push({ label: "Вид сверху", svgContent: "", ratioType: "top" });
  }
  return out;
}

interface Variant {
  variantName: string;
  railImageUrl?: string | null;
  items: VariantItem[];
  schemes?: SchemeData[];
}

export interface ProposalData {
  // Client
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  // Manager
  managerName: string;
  managerPhone?: string;
  branchAddress: string;
  // System
  systemName: string;
  subsystem: string;
  fullWidth: number;
  openWidth?: number;
  height: number;
  doorWidth: number;
  glass: string;
  shotlan: string;
  glassImageUrl?: string;
  // Components
  components: CalcComponent[];
  totalPrice: number;
  customServices?: Array<{ name: string; description: string; price: number }>;
  // 3 свободные строки на странице итогов в PDF (могут быть пустыми)
  notes?: string[];
  // Имя партнёрской компании, к которой привязана карточка. Если задано —
  // в шапке PDF и брендинге используется именно эта компания (а не та, в
  // которой залогинен текущий пользователь). Важно, когда админ Saga Group
  // открывает карточку из партнёрской компании.
  partnerCompanyName?: string | null;
  // Variant (optional)
  variant?: Variant | null;
}

/* ─── Editable field ─── */
function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
        <Input value={temp} onChange={(e) => setTemp(e.target.value)} className="h-7 text-sm flex-1" autoFocus autoComplete="one-time-code" />
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { onChange(temp); setEditing(false); }}>
          <Check className="w-3 h-3 text-brand-600" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setTemp(value); setEditing(false); }}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 cursor-pointer">
        <Pencil className="w-3 h-3 text-muted-foreground hover:text-brand-600" />
      </button>
    </div>
  );
}

/* ─── Editable select — выпадающий список значений для блока «Параметры системы».
   Подпись сверху, значение снизу; иконка-карандаш или двойной клик открывает
   нативный <select> с заданными опциями. Если options пустой — поле read-only. */
function EditableSelect({
  label,
  value,
  options,
  onChange,
  display,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  /** Кастомный рендер в режиме просмотра. */
  display?: string;
}) {
  const [editing, setEditing] = useState(false);
  const canEdit = options.length > 0;

  if (editing && canEdit) {
    return (
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-1">
          <select
            autoFocus
            value={value}
            onChange={(e) => { onChange(e.target.value); setEditing(false); }}
            onBlur={() => setEditing(false)}
            className="h-7 text-sm rounded-md border border-border bg-background px-2 flex-1 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 cursor-pointer"
          >
            {!options.includes(value) && value && (
              <option value={value} disabled>{value} (текущее)</option>
            )}
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => setEditing(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <p
          className={cn("text-sm font-semibold", canEdit && "cursor-pointer")}
          onDoubleClick={() => { if (canEdit) setEditing(true); }}
        >
          {display ?? (value || "—")}
        </p>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Изменить"
          >
            <Pencil className="w-3 h-3 text-muted-foreground hover:text-brand-600" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export function ProposalPreview({
  data: initialData,
  onDataChange,
  onBeforePdfDownload,
  canEditConfig = true,
}: {
  data: ProposalData;
  onDataChange?: (data: ProposalData) => void;
  /** Вызывается до генерации PDF — например, для авто-сохранения карточки. */
  onBeforePdfDownload?: () => Promise<void> | void;
  /**
   * Можно ли менять параметры системы (система/подсистема/стекло/шотланка) прямо
   * в превью КП. Для партнёров = false: они меняют только доп. услуги, а
   * комплектацию/цены компонентов не трогают. По умолчанию true (админ/менеджер).
   */
  canEditConfig?: boolean;
}) {
  const [data, setData] = useState(initialData);

  // Sync with parent when initialData changes (variant загружен асинхронно,
  // размеры/стекло/шотланка/цена пересчитаны родителем). MERGE, а не replace:
  // пользовательские правки текстовых полей (клиент/менеджер/филиал) хранятся
  // локально в превью и НЕ должны затираться пересчётом — поэтому из родителя
  // подтягиваются только вычисляемые поля (стекло, шотланка, система, размеры,
  // картинка стекла, компоненты, цена, вариант), а текст сохраняется из prev.
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      systemName: initialData.systemName,
      subsystem: initialData.subsystem,
      fullWidth: initialData.fullWidth,
      openWidth: initialData.openWidth,
      height: initialData.height,
      doorWidth: initialData.doorWidth,
      glass: initialData.glass,
      shotlan: initialData.shotlan,
      glassImageUrl: initialData.glassImageUrl,
      components: initialData.components,
      totalPrice: initialData.totalPrice,
      customServices: initialData.customServices,
      variant: initialData.variant,
      partnerCompanyName: initialData.partnerCompanyName,
    }));
  }, [
    initialData.variant,
    initialData.glassImageUrl,
    initialData.customServices,
    initialData.fullWidth,
    initialData.height,
    initialData.doorWidth,
    initialData.subsystem,
    initialData.systemName,
    initialData.glass,
    initialData.shotlan,
    initialData.totalPrice,
    initialData.components,
  ]);
  const [schemeSvgUrls, setSchemeSvgUrls] = useState<string[]>([]);
  const [schemeSizes, setSchemeSizes] = useState<Array<{ w: number; h: number }>>([]);
  // Подписи «Вида сверху» в нормализованных (0..1) координатах viewBox —
  // рисуем overlay-span'ы поверх картинки тем же стилем (text-[10px] font-bold
  // text-brand-700), что и подписи у «Вид системы»/«Вид двери».
  const [topLabels, setTopLabels] = useState<Array<{ xNorm: number; yNorm: number; text: string }>>([]);
  // Соотношения «одна дверь / весь viewBox» в системном и дверном SVG.
  // Нужны, чтобы в PDF и в превью слот «Вид двери» вышел ровно того же
  // визуального размера, что одна дверь в «Вид системы». Учитываем подписи
  // вокруг двери в дверном SVG: его door занимает ratio.door < 1 от выходной
  // картинки, поэтому выходной размер = sysSize × sys / door.
  const [doorBoxRatio, setDoorBoxRatio] = useState<{
    sys: { w: number; h: number };
    door: { w: number; h: number };
  } | null>(null);
  const [schemeModal, setSchemeModal] = useState<string | null>(null);

  // Заранее сконвертированные SVG → PNG (data-URL) для «Преимуществ» и «Рельсы»
  // в PDF. react-pdf не рендерит SVG через <Image>, поэтому SVG надо превратить
  // в PNG до передачи в CalculationPDF. Для не-SVG URL значение совпадает с
  // оригиналом.
  const [pdfRailUrl, setPdfRailUrl] = useState<string | null>(null);
  const [pdfItemIconUrls, setPdfItemIconUrls] = useState<Array<string | null>>([]);
  // Готовые QR-коды (PNG data-URL) для блока «Гарантийные условия» и «Договор
  // оферты» в PDF. Исходные ссылки берутся из SiteContent: pdf.qr_warranty_url
  // и pdf.qr_offer_url (редактируются в CMS-режиме).
  const [qrWarrantyDataUrl, setQrWarrantyDataUrl] = useState<string | null>(null);
  const [qrOfferDataUrl, setQrOfferDataUrl] = useState<string | null>(null);

  // Системы, реально настроенные в БД. Фильтруем хардкоженый systemsData по этому списку.
  const [activeSystemSlugs, setActiveSystemSlugs] = useState<Set<string> | null>(null);
  // Кастомные диапазоны размеров по (systemName, subsystemName) → SizeRanges.
  // Нужны, чтобы подбор схемы «вид системы/сверху» совпадал с настройками /admin/doors.
  const [subsystemRanges, setSubsystemRanges] = useState<Record<string, Record<string, SizeRanges>>>({});
  useEffect(() => {
    fetch("/api/systems", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ slug: string; name: string; subsystems?: Array<{ name: string; sizeRanges?: unknown }> }>) => {
        setActiveSystemSlugs(new Set(rows.map((r) => r.slug)));
        const map: Record<string, Record<string, SizeRanges>> = {};
        rows.forEach((r) => {
          map[r.name] = {};
          (r.subsystems ?? []).forEach((sub) => {
            map[r.name][sub.name] = parseSizeRanges(sub.sizeRanges);
          });
        });
        setSubsystemRanges(map);
      })
      .catch(() => { setActiveSystemSlugs(new Set()); setSubsystemRanges({}); });
  }, []);

  // Диапазоны текущей подсистемы (по имени системы + подсистемы из initialData).
  const currentRanges = useMemo<SizeRanges>(
    () => subsystemRanges[initialData.systemName]?.[initialData.subsystem] ?? DEFAULT_SIZE_RANGES,
    [subsystemRanges, initialData.systemName, initialData.subsystem],
  );

  // Компания текущего залогиненного пользователя — для лого «партнёр × SAGA» в PDF.
  const [myCompany, setMyCompany] = useState<{ id: string | null; name: string; logoUrl: string | null } | null>(null);
  useEffect(() => {
    fetch("/api/me/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setMyCompany(c))
      .catch(() => setMyCompany(null));
  }, []);

  // SVG → PNG для иконок «Преимуществ» и фото «Рельсы» в PDF. react-pdf не
  // умеет рендерить SVG через <Image>, поэтому конвертируем заранее. Растровые
  // URL пробрасываются «как есть» (с дописанным origin).
  useEffect(() => {
    let cancelled = false;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const toAbs = (u: string | null | undefined) =>
      !u ? null : u.startsWith("http") ? u : `${origin}${u}`;

    const railSrc = toAbs(initialData.variant?.railImageUrl);
    const itemSrcs = (initialData.variant?.items ?? []).map((it) => toAbs(it.iconUrl));

    Promise.all([
      imageUrlForPdf(railSrc),
      ...itemSrcs.map((u) => imageUrlForPdf(u)),
    ]).then(([rail, ...items]) => {
      if (cancelled) return;
      setPdfRailUrl(rail);
      setPdfItemIconUrls(items);
    });

    return () => { cancelled = true; };
  }, [initialData.variant?.railImageUrl, initialData.variant?.items]);

  // Генерация QR-кодов для блока «Гарантия + оферта» в PDF.
  //   • Ссылки берутся из SiteContent (ключи pdf.qr_warranty_url, pdf.qr_offer_url).
  //   • QRCode.toDataURL(url) даёт PNG data-URL, который react-pdf рендерит через <Image>.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: QRCode } = await import("qrcode");
        const [warrantyRes, offerRes] = await Promise.all([
          fetch("/api/site-content?key=pdf.qr_warranty_url").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/site-content?key=pdf.qr_offer_url").then((r) => (r.ok ? r.json() : null)),
        ]);
        const warrantyUrl = warrantyRes?.value?.trim() || "";
        const offerUrl = offerRes?.value?.trim() || "";
        const [warrantyDataUrl, offerDataUrl] = await Promise.all([
          warrantyUrl ? QRCode.toDataURL(warrantyUrl, { margin: 1, width: 256 }).catch(() => "") : "",
          offerUrl ? QRCode.toDataURL(offerUrl, { margin: 1, width: 256 }).catch(() => "") : "",
        ]);
        if (cancelled) return;
        setQrWarrantyDataUrl(warrantyDataUrl || null);
        setQrOfferDataUrl(offerDataUrl || null);
      } catch {
        if (!cancelled) {
          setQrWarrantyDataUrl(null);
          setQrOfferDataUrl(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Все SVG-схемы подсистемы из /admin/doors: «Вид системы», «Вид сверху» и
  // «Вид двери» (по каждой шотланке). Один fetch на смене (system, subsystem),
  // дальше выбираем нужную локально по (viewType, shotlanType?, hCat, wCat).
  interface DoorSchemeRow {
    svgContent: string;
    viewType: "system" | "top" | "door";
    shotlanType: string | null;
    heightCategory: string | null;
    widthCategory: string | null;
  }
  const [doorSchemes, setDoorSchemes] = useState<DoorSchemeRow[]>([]);
  useEffect(() => {
    // Универсальный resolver системного slug: ищем в systemsData по человеко-читаемому
    // имени системы. Раньше работало только для каскада — это был баг.
    const slug = Object.entries(systemsData)
      .find(([, sys]) => sys.name === initialData.systemName)?.[0] ?? null;
    const sub = initialData.subsystem;
    if (!slug || !sub) { setDoorSchemes([]); return; }
    let cancelled = false;
    fetch(
      `/api/doors?systemSlug=${encodeURIComponent(slug)}&subsystemName=${encodeURIComponent(sub)}`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: DoorSchemeRow[]) => {
        if (!cancelled) setDoorSchemes(Array.isArray(rows) ? rows : []);
      })
      .catch(() => setDoorSchemes([]));
    return () => { cancelled = true; };
  }, [initialData.systemName, initialData.subsystem]);

  // Подбор «Вида двери» под выбранную шотланку и фактический размер проёма:
  // точное совпадение (h, w) → fallback на legacy (h=null, w=null) → null.
  const doorSvg = useMemo(() => {
    const sh = initialData.shotlan || "Без шотланок";
    const { height: hCat, width: wCat } = pickSizeCategoryR(initialData.fullWidth, initialData.height, currentRanges);
    const ofShotlan = doorSchemes.filter((r) => r.viewType === "door" && r.shotlanType === sh);
    const exact = ofShotlan.find((r) => r.heightCategory === hCat && r.widthCategory === wCat);
    const legacy = ofShotlan.find((r) => r.heightCategory == null && r.widthCategory == null);
    const result = exact?.svgContent ?? legacy?.svgContent ?? null;
    if (!result && doorSchemes.length > 0) {
      // Диагностика: помогает понять, почему «Вид двери» не подтянулся.
      const doorRows = doorSchemes.filter((r) => r.viewType === "door");
      const shotlans = [...new Set(doorRows.map((r) => r.shotlanType))];
      console.warn("[ProposalPreview] doorSvg=null:", {
        искалось: { shotlan: sh, heightCategory: hCat, widthCategory: wCat },
        размер: `${initialData.fullWidth}×${initialData.height}`,
        currentRanges,
        всегоDoorЗаписей: doorRows.length,
        доступныеШотланки: shotlans,
        записиТойЖеШотланки: ofShotlan.map((r) => ({ h: r.heightCategory, w: r.widthCategory })),
      });
    }
    return result;
  }, [doorSchemes, initialData.shotlan, initialData.fullWidth, initialData.height, currentRanges]);

  // Convert all display schemes (system + door + side + top) to PNG for PDF.
  // Source sizes from `initialData` (not local `data`) so that when the parent form
  // recalculates with a new full width, the matching system scheme (wide/square/tall)
  // is picked immediately, without waiting for the editable-fields state to sync.
  useEffect(() => {
    const schemes = initialData.variant?.schemes ?? [];
    // Если ни в DoorScheme, ни в legacy SubsystemScheme ничего нет — нет смысла
    // рендерить пустые placeholder'ы в PNG для PDF.
    if (doorSchemes.length === 0 && schemes.length === 0 && !doorSvg) {
      setSchemeSvgUrls([]);
      setTopLabels([]);
      return;
    }
    let cancelled = false;

    const toConvert = buildDisplaySchemes(
      schemes,
      doorSchemes,
      initialData.fullWidth,
      initialData.height,
      initialData.doorWidth,
      initialData.systemName,
      initialData.subsystem,
      doorSvg,
      currentRanges,
    );

    const sysSvg = toConvert[0]?.svgContent;

    // Готовые SVG-строки (с размерными линиями; числа «… мм» у «вида двери» —
    // снаружи, см. CalculationPDF). По ИТОГОВЫМ строкам считаем доли двери.
    const renderedScheme = toConvert.map((scheme, idx) => {
      const reusedFromSystem = idx > 0 && scheme.svgContent === sysSvg;
      const effIdx = reusedFromSystem ? 0 : idx;
      const rendered = renderSvgWithDimensions(
        scheme.svgContent,
        initialData.fullWidth,
        initialData.height,
        initialData.doorWidth,
        1,
        effIdx,
      );
      return { svg: rendered, reusedFromSystem };
    });

    const renderedSys = renderedScheme[0]?.svg;
    const renderedDoor = renderedScheme[1] && !renderedScheme[1].reusedFromSystem
      ? renderedScheme[1].svg
      : null;

    if (!cancelled) {
      setDoorBoxRatio(
        renderedSys
          ? computeDoorBox(renderedSys, renderedDoor, initialData.fullWidth, initialData.height, initialData.doorWidth)
          : null,
      );
      // Подписи для overlay берём ПОСЛЕ template-replace (но до удаления
      // <text>), чтобы у нас уже были реальные «X мм», а позиции — те, что
      // нарисовал автор SVG. Применяем тот же template-replace, что и
      // renderSvgWithDimensions, к ИСХОДНОМУ top-view SVG.
      const topRawSvg = toConvert[2]?.svgContent ?? "";
      const topWithVals = topRawSvg
        .replace(/\{\{WIDTH\}\}/g, String(initialData.fullWidth))
        .replace(/\{\{HEIGHT\}\}/g, String(initialData.height))
        .replace(/\{\{DOOR_WIDTH\}\}/g, String(initialData.doorWidth));
      setTopLabels(topWithVals ? extractTopLabels(topWithVals) : []);
    }

    Promise.all(
      renderedScheme.map(({ svg }) =>
        svgToPngViaServer(svg).catch(() => ({ dataUrl: "", w: 0, h: 0 })),
      ),
    ).then((results) => {
      if (!cancelled) {
        setSchemeSvgUrls(results.map(r => r.dataUrl));
        setSchemeSizes(results.map(r => ({ w: r.w, h: r.h })));
      }
    });
    return () => { cancelled = true; };
  }, [
    initialData.variant?.schemes,
    doorSchemes,
    initialData.fullWidth,
    initialData.height,
    initialData.doorWidth,
    initialData.systemName,
    initialData.subsystem,
    doorSvg,
    currentRanges,
  ]);

  function update(partial: Partial<ProposalData>) {
    const next = { ...data, ...partial };
    setData(next);
    onDataChange?.(next);
  }

  // Group components
  const groups = [
    { key: "component", label: "Комплектующие" },
    { key: "shotlan", label: "Шотланки" },
    { key: "glass", label: "Стекло" },
    { key: "extra", label: "Дополнительные расходы" },
  ];

  const hasGroups = data.components.some((c) => c.group);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-5 h-5 text-brand-600" />
        <h3 className="font-display text-lg font-bold">Предварительный просмотр КП</h3>
        <span className="text-xs text-muted-foreground">Нажмите на поле для редактирования</span>
      </div>

      {/* Client + Manager */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-2">Клиент</p>
          <EditableField label="Имя" value={data.clientName} onChange={(v) => update({ clientName: v })} />
          <EditableField label="Телефон" value={data.clientPhone} onChange={(v) => update({ clientPhone: v })} />
          <EditableField label="Адрес" value={data.clientAddress} onChange={(v) => update({ clientAddress: v })} />
        </div>

        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-2">Менеджер</p>
          <EditableField label="Имя" value={data.managerName} onChange={(v) => update({ managerName: v })} />
          {data.managerPhone && (
            <EditableField label="Телефон" value={data.managerPhone} onChange={(v) => update({ managerPhone: v })} />
          )}
          <EditableField label="Филиал" value={data.branchAddress} onChange={(v) => update({ branchAddress: v })} />
        </div>
      </div>

      {/* System params */}
      {(() => {
        const allSystemEntries = Object.entries(systemsData);
        // Если уже пришёл список активных слагов — фильтруем; иначе пока показываем всё.
        const systemEntries = activeSystemSlugs
          ? allSystemEntries.filter(([slug]) => activeSystemSlugs.has(slug))
          : allSystemEntries;
        const systemNameOptions = systemEntries.map(([, sys]) => sys.name);
        const currentSystemEntry = allSystemEntries.find(([, sys]) => sys.name === data.systemName);
        const subsystemOptions = currentSystemEntry
          ? Object.keys(currentSystemEntry[1].subsystems)
          : [];
        const isRiffled = data.glass === "Рифленое";
        const shotlanFiltered = shotlanOptions.filter((o) => !(isRiffled && hideWithRiffled.includes(o)));
        return (
          <div className="rounded-xl border border-border p-4">
            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-3">Параметры системы</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <EditableSelect
                label="Система"
                value={data.systemName}
                options={canEditConfig ? systemNameOptions : []}
                onChange={(v) => update({ systemName: v })}
              />
              <EditableSelect
                label="Подсистема"
                value={data.subsystem}
                options={canEditConfig ? subsystemOptions : []}
                onChange={(v) => update({ subsystem: v })}
              />
              <div>
                <p className="text-[10px] text-muted-foreground">Размеры (Ш × В)</p>
                <p className="text-sm font-semibold">{data.fullWidth} × {data.height} мм</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Ширина двери</p>
                <p className="text-sm font-semibold">{data.doorWidth} мм</p>
              </div>
              {data.openWidth ? (
                <div>
                  <p className="text-[10px] text-muted-foreground">Ширина проёма</p>
                  <p className="text-sm font-semibold">{data.openWidth} мм</p>
                </div>
              ) : null}
              <EditableSelect
                label="Стекло"
                value={data.glass}
                options={canEditConfig ? (glassOptions as unknown as string[]) : []}
                onChange={(v) => update({ glass: v })}
              />
              <EditableSelect
                label="Шотланки"
                value={data.shotlan}
                options={canEditConfig ? (shotlanFiltered as unknown as string[]) : []}
                onChange={(v) => update({ shotlan: v })}
                display={data.shotlan && data.shotlan !== "Без шотланок" ? data.shotlan : "отсутствуют"}
              />
              {/* Боковая обшивка и Закладные — важные параметры, показываем их
                  прямо здесь (значение — описание из доп. услуг, иначе «Да»/«—»).
                  Остальные доп. услуги остаются только в таблице «Спецификация». */}
              {(() => {
                const svc = (name: string) =>
                  data.customServices?.find(
                    (s) => s.name.trim().toLowerCase() === name.toLowerCase(),
                  );
                const svcValue = (s?: { description: string; price: number }) =>
                  !s ? "—" : s.description?.trim() ? s.description.trim() : s.price > 0 ? "Да" : "—";
                return (["Боковая обшивка", "Закладные"] as const).map((name) => (
                  <div key={name}>
                    <p className="text-[10px] text-muted-foreground">{name}</p>
                    <p className="text-sm font-semibold">{svcValue(svc(name))}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        );
      })()}

      {/* Variant cards — premium style */}
      {data.variant && data.variant.items.length > 0 && (
        <div>
          {/* Section header with gold rule */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-5 bg-gold" />
            <p className="text-[10px] font-bold text-gold uppercase tracking-[0.25em]">
              {data.variant.variantName}
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {data.variant.items.map((item, i) => {
              const num = String(i + 1).padStart(2, "0");
              return (
                <div
                  key={i}
                  className="relative flex flex-col items-center rounded-lg border border-border bg-white px-4 pt-5 pb-4 overflow-hidden"
                >
                  {/* Top gold accent */}
                  <div className="absolute left-1/4 right-1/4 top-0 h-0.5 bg-gold" />

                  {/* Card number */}
                  <span className="absolute right-2.5 top-1.5 text-[10px] font-bold text-gold tracking-widest">
                    {num}
                  </span>

                  {/* Icon in circular gold-tinted holder */}
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-gold-light bg-brand-50/40">
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt="" className="h-10 w-10 object-contain" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-border" />
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-sm font-bold text-center text-foreground mb-1.5 tracking-wide">
                    {item.title}
                  </p>

                  {/* Gold divider */}
                  <div className="h-px w-5 bg-gold/60 mb-2" />

                  {/* Description */}
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground text-center leading-snug">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SVG Schemes — system (60%) + door (40%) в первой строке, top на второй строке.
          Источник SVG — DoorScheme из /admin/doors (новая логика). Старые
          SubsystemScheme передаются как legacy fallback. */}
      {(doorSchemes.length > 0 || (initialData.variant?.schemes && initialData.variant.schemes.length > 0)) && (
        <div className="rounded-xl border border-border p-4">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-3">Схемы</p>
          <div className="grid grid-cols-5 gap-4">
            {(() => {
              const h = 200;
              const toShow = buildDisplaySchemes(
                initialData.variant?.schemes ?? [],
                doorSchemes,
                initialData.fullWidth,
                initialData.height,
                initialData.doorWidth,
                initialData.systemName,
                initialData.subsystem,
                doorSvg,
                currentRanges,
              );
              const labelFallbacks: Record<string, string> = {
                wide: "Широкий проём",
                square: "Квадратный проём",
                tall: "Высокий проём",
                door: "Дверь",
                top: "Вид сверху",
              };
              // Первая строка: вид системы (col-span 3 = 60%) + вид двери (col-span 2 = 40%).
              // Всё остальное (вид сверху и т.д.) — на следующей строке полной шириной.
              const colSpanByIndex = (i: number) =>
                i === 0 ? "col-span-5 md:col-span-3" : i === 1 ? "col-span-5 md:col-span-2" : "col-span-5";

              const sysSvg = toShow[0]?.svgContent;
              // Готовые SVG-строки (числа «… мм» у «вида двери» рисуются ниже,
              // снаружи контейнера). По ним считаем доли двери (computeDoorBox).
              const renderedSchemes = toShow.map((scheme, idx) => {
                const reusedFromSystem = idx > 0 && scheme.svgContent === sysSvg;
                const effIdx = reusedFromSystem ? 0 : idx;
                return {
                  rendered: renderSvgWithDimensions(scheme.svgContent, initialData.fullWidth, initialData.height, initialData.doorWidth, 1, effIdx),
                  reusedFromSystem,
                };
              });

              // Дверной слот: ширина И высота = ровно одной двери внутри «вида системы»
              // (картинку при этом может слегка стретчить — подписи/ручка масштабируются вместе с ней).
              const sysRenderedVB = renderedSchemes[0] ? getSvgViewBox(renderedSchemes[0].rendered) : null;
              const dbox = renderedSchemes[0]
                ? computeDoorBox(
                    renderedSchemes[0].rendered,
                    renderedSchemes[1] && !renderedSchemes[1].reusedFromSystem ? renderedSchemes[1].rendered : null,
                    initialData.fullWidth, initialData.height, initialData.doorWidth,
                  )
                : null;
              // «Вид системы» рендерится высотой h, ширина = h · аспект слота.
              const sysImgW = sysRenderedVB && sysRenderedVB.h > 0
                ? h * (sysRenderedVB.w / sysRenderedVB.h)
                : 0;
              // Контейнер «Вид двери» подогнан так, что СТЕКЛО двери точно
              // совпадает по ширине И ВЫСОТЕ с одной дверью внутри «Вид
              // системы»: containerPxH = h · (sys.h / door.h), и аналогично
              // по ширине. Картинка двери при этом КОРОЧЕ картинки системы
              // (когда H системы < SLOT) — это нормально, у неё пустого
              // места сверху нет.
              let containerPxW = 0;
              let containerPxH = 0;
              if (dbox && sysImgW > 0
                  && dbox.sys.w > 0 && dbox.sys.h > 0 && dbox.door.w > 0 && dbox.door.h > 0) {
                containerPxW = sysImgW * (dbox.sys.w / dbox.door.w);
                containerPxH = h * (dbox.sys.h / dbox.door.h);
              }

              return toShow.map((scheme, idx) => {
                const reusedFromSystem = renderedSchemes[idx].reusedFromSystem;
                const rendered = renderedSchemes[idx].rendered;
                const displayLabel =
                  scheme.label?.trim() ||
                  (scheme.ratioType ? labelFallbacks[scheme.ratioType] : undefined) ||
                  "Схема";

                // Слот «Вид двери» с отдельным дверным SVG — рендерим в боксе ровно
                // того же пиксельного размера, что ОДНА дверь внутри «вида системы».
                const isDoorSlot = idx === 1 && !reusedFromSystem && containerPxW > 0 && containerPxH > 0;
                // Слот «Вид системы» — обёртка с absolute-подписями (числа размеров
                // ОДНИМ размером шрифта, общим со всеми остальными видами).
                const isSystemSlot = idx === 0 && sysImgW > 0;
                // Пустой svgContent (placeholder из buildDisplaySchemes) →
                // плашка «SVG не загружен для этого размера».
                const isEmpty = !scheme.svgContent || scheme.svgContent.trim() === "";

                if (isEmpty) {
                  // Диагностика прямо в плашке — без F12. Покажет, какую категорию
                  // искали и что реально лежит в БД, чтобы сразу понять источник проблемы.
                  const { height: dHCat, width: dWCat } = pickSizeCategoryR(
                    initialData.fullWidth,
                    initialData.height,
                    currentRanges,
                  );
                  const wantedShotlan = initialData.shotlan || "Без шотланок";
                  const allByView = doorSchemes.filter((r) => r.viewType === scheme.ratioType);
                  const allByViewAndShotlan = scheme.ratioType === "door"
                    ? allByView.filter((r) => r.shotlanType === wantedShotlan)
                    : allByView;
                  const availableShotlans = scheme.ratioType === "door"
                    ? [...new Set(allByView.map((r) => r.shotlanType))]
                    : [];
                  const availableCategories = allByViewAndShotlan.map((r) => `${r.heightCategory ?? "·"}×${r.widthCategory ?? "·"}`);
                  const hBands = currentRanges.heightBands;
                  const wBands = currentRanges.widthBands;
                  const resolvedSlug = Object.entries(systemsData).find(([, sys]) => sys.name === initialData.systemName)?.[0] ?? null;
                  const knownSystemNamesInRanges = Object.keys(subsystemRanges);
                  const knownSubsInThisSystem = subsystemRanges[initialData.systemName] ? Object.keys(subsystemRanges[initialData.systemName]) : [];
                  return (
                    <div key={idx} className={`flex flex-col items-center ${colSpanByIndex(idx)}`}>
                      <p className="text-[10px] font-semibold text-muted-foreground text-center mb-2">{displayLabel}</p>
                      <div
                        className="w-full flex flex-col items-center justify-center rounded-lg border border-dashed border-amber-400/60 bg-amber-50/40 text-amber-700 text-[10px] text-left px-3 py-2 gap-1 overflow-auto"
                        style={{ height: h }}
                      >
                        <p className="font-semibold text-center w-full">SVG не загружен</p>
                        <p className="text-center w-full opacity-80">для размера {initialData.fullWidth}×{initialData.height} мм</p>
                        <div className="mt-1 w-full text-[9px] font-mono leading-tight opacity-90 break-words">
                          <div><b>systemName:</b> {JSON.stringify(initialData.systemName)}</div>
                          <div><b>subsystem:</b> {JSON.stringify(initialData.subsystem)}</div>
                          <div><b>resolvedSlug:</b> {JSON.stringify(resolvedSlug)}</div>
                          <div><b>искали:</b> {scheme.ratioType}/{wantedShotlan}/{dHCat}×{dWCat}</div>
                          <div><b>H bands:</b> [{hBands.join(", ")}]</div>
                          <div><b>W bands:</b> [{wBands.join(", ")}]</div>
                          <div><b>в БД ({scheme.ratioType}):</b> {allByView.length} зап.</div>
                          {scheme.ratioType === "door" && (
                            <div><b>шотланки в БД:</b> {availableShotlans.length ? availableShotlans.join(" | ") : "—"}</div>
                          )}
                          <div><b>категории той же шотланки:</b> {availableCategories.length ? availableCategories.join(" | ") : "—"}</div>
                          <div><b>системы в subsystemRanges:</b> {knownSystemNamesInRanges.length ? knownSystemNamesInRanges.join(" | ") : "—"}</div>
                          <div><b>подсистемы для этой системы:</b> {knownSubsInThisSystem.length ? knownSubsInThisSystem.join(" | ") : "—"}</div>
                          <div className="opacity-60 mt-1">{scheme.ratioType === "system" ? "/admin/doors → Вид системы" : scheme.ratioType === "top" ? "/admin/doors → Вид сверху" : "/admin/doors → Вид двери"}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={`cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center ${colSpanByIndex(idx)}`}
                    onClick={() => setSchemeModal(rendered)}
                  >
                    {/* Для «Вид сверху» — увеличенный отступ между подписью
                        и картинкой (mb-8), у остальных — стандартный mb-2. */}
                    <p
                      className={`text-[10px] font-semibold text-muted-foreground text-center ${
                        scheme.ratioType === "top" ? "mb-8" : "mb-2"
                      }`}
                    >
                      {displayLabel}
                    </p>
                    {isDoorSlot ? (
                      // «Вид двери» прижат к НИЗУ ячейки точно так же, как SVG
                      // системы → их нижние кромки совпадают (горизонтальное
                      // выравнивание). Числа «… мм» — на ABSOLUTE позициях вне
                      // самого SVG, чтобы не сдвигать его вверх и не мяться при
                      // растягивании (preserveAspectRatio="none").
                      <div className="flex items-end justify-center w-full" style={{ height: h }}>
                        <div className="relative" style={{ width: containerPxW, height: containerPxH }}>
                          <div
                            dangerouslySetInnerHTML={{ __html: rendered }}
                            style={{ width: containerPxW, height: containerPxH }}
                            className="[&>svg]:w-full [&>svg]:h-full"
                          />
                          {/* ширина — под нижней кромкой картинки, по центру */}
                          <span
                            className="text-[10px] font-bold text-brand-700 whitespace-nowrap"
                            style={{ position: "absolute", left: 0, right: 0, top: "100%", textAlign: "center", marginTop: 2 }}
                          >
                            {Math.round(initialData.doorWidth)} мм
                          </span>
                          {/* высота — справа от картинки, ОДНОЙ строкой, повёрнута на 90° */}
                          <div
                            style={{
                              position: "absolute",
                              left: "100%",
                              top: 0,
                              bottom: 0,
                              width: 16,
                              marginLeft: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              className="text-[10px] font-bold text-brand-700 whitespace-nowrap"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                            >
                              {Math.round(initialData.height)} мм
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : isSystemSlot ? (
                      // «Вид системы»: SVG натуральной ширины (sysImgW × h),
                      // центрирован в колонке (раньше был прижат вправо — из-за
                      // этого схемы кучковались справа, не как в PDF). Числа
                      // размеров — ABSOLUTE СНАРУЖИ (тот же 10px шрифт, что и
                      // у «вида двери»).
                      <div className="w-full flex items-end justify-center" style={{ height: h }}>
                        <div className="relative" style={{ width: sysImgW, height: h }}>
                          <div
                            dangerouslySetInnerHTML={{ __html: rendered }}
                            style={{ width: sysImgW, height: h }}
                            className="[&>svg]:w-full [&>svg]:h-full"
                          />
                          {/* ширина — под нижней кромкой картинки, по центру */}
                          <span
                            className="text-[10px] font-bold text-brand-700 whitespace-nowrap"
                            style={{ position: "absolute", left: 0, right: 0, top: "100%", textAlign: "center", marginTop: 2 }}
                          >
                            {Math.round(initialData.fullWidth)} мм
                          </span>
                          {/* высота — СЛЕВА от картинки, ОДНОЙ строкой, повёрнута на -90° */}
                          <div
                            style={{
                              position: "absolute",
                              right: "100%",
                              top: 0,
                              bottom: 0,
                              width: 16,
                              marginRight: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              className="text-[10px] font-bold text-brand-700 whitespace-nowrap"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                            >
                              {Math.round(initialData.height)} мм
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : scheme.ratioType === "top" ? (
                      // «Вид сверху»: контейнер по аспекту SVG. Подписи рисуются
                      // overlay-span'ами тем же классом что у системы/двери.
                      (() => {
                        const vb = getSvgViewBox(rendered);
                        const aspect = vb && vb.h > 0 ? vb.w / vb.h : 4;
                        const imgH = h;
                        const imgW = Math.round(imgH * aspect);
                        const stretchedSvg = rendered;
                        return (
                          <div className="w-full flex items-end justify-center" style={{ height: imgH }}>
                            <div className="relative" style={{ width: imgW, height: imgH }}>
                              <div
                                dangerouslySetInnerHTML={{ __html: stretchedSvg }}
                                style={{ width: imgW, height: imgH }}
                                className="[&>svg]:w-full [&>svg]:h-full"
                              />
                              {topLabels.map((lbl, k) => (
                                <span
                                  key={k}
                                  className="text-[10px] font-bold text-brand-700 whitespace-nowrap"
                                  style={{
                                    position: "absolute",
                                    left: lbl.xNorm * imgW,
                                    top: lbl.yNorm * imgH,
                                    transform: "translate(-50%, -50%)",
                                  }}
                                >
                                  {lbl.text}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      // Фолбэк (на всякий случай): SVG натуральной ширины, прижат к низу.
                      <div
                        dangerouslySetInnerHTML={{ __html: rendered }}
                        style={{ height: h }}
                        className="w-full flex items-end justify-center [&>svg]:max-h-full [&>svg]:max-w-full"
                      />
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Scheme modal */}
      {schemeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-8"
          onClick={() => setSchemeModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-[90vw] max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="[&>svg]:max-w-full [&>svg]:h-auto [&>svg]:max-h-[80vh] flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: schemeModal }}
            />
          </div>
        </div>
      )}

      {/* Components table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="brand-gradient px-4 py-3 flex items-center justify-between">
          <p className="text-white font-display font-bold text-sm">Спецификация</p>
          <p className="font-display text-lg font-bold text-white tabular-nums">
            {formatPrice(data.totalPrice)}
            <span className="text-[10px] text-brand-200/50 ml-1">у.е.</span>
          </p>
        </div>

        {hasGroups ? (
          <div className="divide-y divide-border/30">
            {groups.map((g) => {
              const items = data.components.filter((c) => (c.group || "component") === g.key);
              if (items.length === 0) return null;
              const groupTotal = items.reduce((acc, c) => acc + c.sum, 0);
              return (
                <div key={g.key}>
                  <div className="flex items-center justify-between px-4 py-2 bg-brand-50/60">
                    <span className="text-[11px] font-bold text-brand-800 uppercase tracking-wider">{g.label}</span>
                    <span className="text-[11px] font-bold text-brand-700 tabular-nums">{formatPrice(groupTotal)} у.е.</span>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {items.map((comp, i) => (
                        <tr key={`${comp.key}-${i}`} className={cn("border-b border-border/10 hover:bg-brand-50/20", i % 2 === 0 && "bg-muted/4")}>
                          <td className="pl-4 pr-2 py-2 text-[13px]">{comp.name}</td>
                          <td className="px-3 py-2 text-[13px] text-center tabular-nums w-20">
                            {typeof comp.qty === "number" && comp.qty % 1 !== 0 ? comp.qty.toFixed(2) : comp.qty}
                            {comp.unit && <span className="text-[10px] text-muted-foreground ml-0.5">{comp.unit}</span>}
                          </td>
                          <td className="px-3 py-2 text-[13px] text-right text-muted-foreground tabular-nums w-24">{formatPrice(comp.price)}</td>
                          <td className="pl-3 pr-4 py-2 text-[13px] text-right font-semibold tabular-nums w-28">{formatPrice(comp.sum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {data.components.map((comp, i) => (
                <tr key={`${comp.key}-${i}`} className={cn("border-b border-border/10", i % 2 === 1 && "bg-muted/5")}>
                  <td className="pl-4 pr-2 py-2 text-[13px]">{comp.name}</td>
                  <td className="px-3 py-2 text-[13px] text-center tabular-nums w-20">{comp.qty}</td>
                  <td className="px-3 py-2 text-[13px] text-right text-muted-foreground tabular-nums w-24">{formatPrice(comp.price)}</td>
                  <td className="pl-3 pr-4 py-2 text-[13px] text-right font-semibold tabular-nums w-28">{formatPrice(comp.sum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Custom services */}
        {data.customServices && data.customServices.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-4 py-2 bg-brand-50/60">
              <span className="text-[11px] font-bold text-brand-800 uppercase tracking-wider">Доп. услуги</span>
              <span className="text-[11px] font-bold text-brand-700 tabular-nums">
                {formatPrice(data.customServices.reduce((a, s) => a + s.price, 0))} у.е.
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {data.customServices.map((svc, i) => (
                  <tr key={i} className="border-b border-border/10 hover:bg-brand-50/20">
                    <td className="pl-4 pr-2 py-2 text-[13px]">
                      {svc.name}
                      {svc.description && <span className="text-muted-foreground ml-1 text-xs">({svc.description})</span>}
                    </td>
                    <td className="pl-3 pr-4 py-2 text-[13px] text-right font-semibold tabular-nums w-28">{formatPrice(svc.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total */}
        <div className="border-t px-4 py-3 flex items-center justify-between bg-muted/20">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Итого:</span>
          <span className="text-lg font-bold text-brand-700 tabular-nums">
            {formatPrice(data.totalPrice + (data.customServices?.reduce((a, s) => a + s.price, 0) ?? 0))} у.е.
          </span>
        </div>
      </div>

      {/* Свободные заметки — 3 поля. Пустые поля в PDF превращаются в пустые
          линии под рукописный текст после печати. */}
      <div className="rounded-xl border border-border p-4">
        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-3">
          Заметки на КП (3 строки)
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          Можно вписать сейчас или оставить пустым — в PDF на их месте появятся пустые
          линии для рукописной заметки.
        </p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Input
              key={i}
              placeholder={`Строка ${i + 1}`}
              value={data.notes?.[i] ?? ""}
              onChange={(e) => {
                const next = [...(data.notes ?? ["", "", ""])];
                while (next.length < 3) next.push("");
                next[i] = e.target.value;
                update({ notes: next });
              }}
              className="h-8 text-sm"
              autoComplete="one-time-code"
            />
          ))}
        </div>
      </div>

      {/* Download button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <PDFDownloadBtn
          customerName={data.clientName}
          customerPhone={data.clientPhone}
          customerAddress={data.clientAddress}
          managerName={data.managerName}
          managerPhone={data.managerPhone}
          branchAddress={data.branchAddress}
          systemName={data.systemName}
          subsystemName={data.subsystem}
          fullWidth={data.fullWidth}
          openWidth={data.openWidth}
          height={data.height}
          doorWidth={data.doorWidth}
          glassType={data.glass}
          shotlanType={data.shotlan}
          components={data.components}
          totalPrice={data.totalPrice}
          customServices={data.customServices}
          notes={data.notes}
          variant={data.variant ? {
            ...data.variant,
            // iconUrl: используем заранее сконвертированные (SVG → PNG dataUrl),
            // иначе react-pdf не отрендерит SVG-иконку Преимущества.
            items: data.variant.items.map((it, i) => ({
              ...it,
              iconUrl: pdfItemIconUrls[i] ?? null,
            })),
          } : null}
          partnerCompanyName={data.partnerCompanyName ?? myCompany?.name ?? null}
          partnerLogoUrl={
            data.partnerCompanyName
              ? null /* при редактировании партнёрской карточки логотип не нужен — в PDF и так текст */
              : myCompany?.logoUrl
              ? (myCompany.logoUrl.startsWith("http")
                  ? myCompany.logoUrl
                  : `${typeof window !== "undefined" ? window.location.origin : ""}${myCompany.logoUrl}`)
              : null
          }
          onBeforeDownload={onBeforePdfDownload}
          schemeSvgs={schemeSvgUrls}
          schemeSizes={schemeSizes}
          topLabels={topLabels}
          doorBoxRatio={doorBoxRatio ?? undefined}
          glassImageUrl={data.glassImageUrl}
          railImageUrl={pdfRailUrl ?? undefined}
          qrWarrantyDataUrl={qrWarrantyDataUrl ?? undefined}
          qrOfferDataUrl={qrOfferDataUrl ?? undefined}
        />
      </div>
    </div>
  );
}
