"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import { type CalcComponent } from "@/lib/calculations/engine";
import PDFDownloadBtn from "@/components/pdf/PDFDownloadBtn";
import { extractSystemGroup, scaleSystemGroup, computeBBox, positionHandlesOnDoors, findDoorCenters, getSvgViewBox, setSvgViewBox } from "@/lib/svgGroup";
import { tryGenerateSystemScheme, tryGenerateDoorScheme, tryGenerateTopScheme } from "@/lib/calculations/generateScheme";
import { systemsData } from "@/lib/calculations/systemsData";
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
 * Inject dimension labels into SVG.
 * Replaces {{WIDTH}}, {{HEIGHT}}, {{DOOR_WIDTH}}, {{DOORS}} placeholders.
 * Also appends dimension lines with arrows below and to the right of the SVG.
 */
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
    .replace(/\{\{WIDTH\}\}/g, String(schemeIndex === 0 ? width : doorWidth))
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

  // Адаптивная система: <g id="system"> масштабируется по обеим осям так, чтобы
  // её пропорции совпали с пропорциями проёма. "Fit inside" исходного bbox —
  // система не выходит за нарисованную область.
  // Профили, рамки и stroke-width масштабируются вместе с системой (это даёт
  // пропорциональный вид). Ручки имеют counter-scale внутри scaleSystemGroup,
  // их физический размер сохраняется.
  if (schemeIndex === 0 && height > 0 && width > 0) {
    const group = extractSystemGroup(svg);
    if (group) {
      const bbox = computeBBox(group.inner);
      if (bbox && bbox.w > 0 && bbox.h > 0) {
        const origAspect = bbox.w / bbox.h;
        const targetAspect = width / height;
        let scaleX: number;
        let scaleY: number;
        if (targetAspect >= origAspect) {
          // проём шире нарисованного — оставляем полную ширину, высоту уменьшаем
          scaleX = 1;
          scaleY = origAspect / targetAspect;
        } else {
          // проём уже нарисованного — оставляем полную высоту, ширину уменьшаем
          scaleY = 1;
          scaleX = targetAspect / origAspect;
        }
        // scaleSystemGroup теперь сам применяет тот же transform к группе
        // <g id="handles">, поэтому отдельный вызов positionHandlesOnDoors
        // больше не нужен (он бы давал двойную коррекцию).
        svg = scaleSystemGroup(svg, scaleX, scaleY);
      }
    }
  }

  // Parse viewBox
  const vbMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (!vbMatch) return svg;
  const parts = vbMatch[1].split(/[\s,]+/).map(Number);
  const vbX = parts[0], vbY = parts[1], svgW = parts[2], svgH = parts[3];

  // Подпись ширины снизу: door view (idx 1) показывает ширину двери, остальные — полную ширину проёма.
  const dimW = schemeIndex === 1 ? doorWidth : width;
  const dimH = height;

  // Подписи размеров по индексу схемы (после удаления side-view):
  //   0 — вид системы: ширина снизу + высота справа
  //   1 — вид двери:   ширина двери снизу + высота справа
  //   2 — вид сверху:  свои внутренние размерные линии (общая, средняя, нижняя),
  //                    автоматические подписи не нужны
  const showBottom = schemeIndex !== 2;
  const showRight = schemeIndex !== 2;

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
  if (useRealScale) {
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

  // Bottom dimension line (width)
  const bLineY = vbY + svgH + gap;
  const bLeft = vbX;
  const bRight = vbX + svgW;
  const bMidX = vbX + svgW / 2;
  const bTextY = bLineY + gap + fontSize;

  // Right dimension line (height)
  const rLineX = vbX + svgW + gap;
  const rTop = vbY;
  const rBottom = vbY + svgH;
  const rMidY = vbY + svgH / 2;
  const rTextX = rLineX + gap + fontSize;

  const labelPad = Math.max(fontSize * 0.5, 6);

  const bits: string[] = [];
  bits.push(`<g fill="none" stroke="#333" stroke-width="${lineW}">`);
  if (showBottom) {
    bits.push(
      `<line x1="${bLeft}" y1="${bLineY}" x2="${bRight}" y2="${bLineY}"/>`,
      `<line x1="${bLeft}" y1="${bLineY - tickL}" x2="${bLeft}" y2="${bLineY + tickL}"/>`,
      `<line x1="${bRight}" y1="${bLineY - tickL}" x2="${bRight}" y2="${bLineY + tickL}"/>`,
    );
  }
  if (showRight) {
    bits.push(
      `<line x1="${rLineX}" y1="${rTop}" x2="${rLineX}" y2="${rBottom}"/>`,
      `<line x1="${rLineX - tickL}" y1="${rTop}" x2="${rLineX + tickL}" y2="${rTop}"/>`,
      `<line x1="${rLineX - tickL}" y1="${rBottom}" x2="${rLineX + tickL}" y2="${rBottom}"/>`,
    );
  }
  bits.push(`</g>`);
  bits.push(`<g font-family="Arial, Helvetica, sans-serif" fill="#0A3C46" font-weight="700" font-size="${fontSize}">`);
  if (showBottom) {
    bits.push(`<text x="${bMidX}" y="${bTextY}" text-anchor="middle">${dimW} мм</text>`);
  }
  if (showRight) {
    bits.push(`<text x="${rTextX}" y="${rMidY}" text-anchor="middle" transform="rotate(90,${rTextX},${rMidY})">${dimH} мм</text>`);
  }
  bits.push(`</g>`);
  const dimLines = bits.join("\n");

  // Always reserve the same padding on all four sides so every scheme in a row renders
  // with the same visual proportions, even when a particular view doesn't carry a label
  // on a given side (e.g. side-view has no bottom label). Without this, side-view's
  // drawing extends the full picture height while system/door lose ~10% of their height
  // to the bottom label area, making them look shorter in the row.
  const extraRight = gap * 2 + labelPad + fontSize * 2;
  const extraBottom = gap * 2 + labelPad + fontSize;
  // Маленький буфер слева/сверху под stroke геометрии, который частично
  // выходит за границы viewBox (например, левый край двери с центрированным
  // штрихом). Без буфера sharp обрезает stroke и левый край двери выглядит
  // тоньше остальных.
  const strokeBuf = Math.max(lineW * 4, 6);
  const newOriginX = vbX - strokeBuf;
  const newOriginY = vbY - strokeBuf;
  const newW = Math.round(svgW + extraRight + strokeBuf);
  const newH = Math.round(svgH + extraBottom + strokeBuf);
  svg = svg.replace(vbMatch[0], `viewBox="${newOriginX} ${newOriginY} ${newW} ${newH}"`);

  // Also update width/height attributes on <svg>
  svg = svg.replace(/(<svg[^>]*)\bwidth="[\d.]+"/, `$1 width="${newW}"`);
  svg = svg.replace(/(<svg[^>]*)\bheight="[\d.]+"/, `$1 height="${newH}"`);

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
}

const SYSTEM_RATIO_TYPES = new Set(["system", "wide", "square", "tall"]);

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

/**
 * Build the ordered list of schemes to display in preview/PDF:
 *   1. System view — приоритет загруженного SVG, fallback на процедурный.
 *   2. Door view — приоритет загруженного, иначе берётся ТА ЖЕ схема, что и
 *      «Вид системы» (по требованию: дверь визуально должна совпадать с
 *      видом системы). Процедурная door-генерация сейчас отключена.
 *   3. Top view — приоритет загруженного, fallback на процедурный.
 *
 * Side view убран намеренно.
 */
function buildDisplaySchemes(
  schemes: SchemeData[],
  width: number,
  height: number,
  doorWidth: number,
  systemName: string,
  subsystem: string,
  doorSvgFromShotlan?: string | null,
): SchemeData[] {
  const out: SchemeData[] = [];

  // System view: загруженный → процедурный.
  const uploadedSystem = pickSystemScheme(schemes, width, height);
  let systemScheme: SchemeData | null = null;
  if (uploadedSystem) {
    systemScheme = uploadedSystem;
  } else {
    const generatedSystem = tryGenerateSystemScheme(systemName, subsystem, width, height);
    if (generatedSystem) {
      systemScheme = { label: "Вид системы", svgContent: generatedSystem, ratioType: "system" };
    }
  }
  if (systemScheme) out.push(systemScheme);

  // Door view: приоритет — SVG, привязанный к выбранной шотланке (из /admin/doors).
  // Иначе — загруженный door через variants. Иначе — тот же SVG, что и система.
  if (doorSvgFromShotlan) {
    out.push({ label: "Вид двери", svgContent: doorSvgFromShotlan, ratioType: "door" });
  } else {
    const uploadedDoor = getSchemeByType(schemes, "door");
    if (uploadedDoor) {
      out.push(uploadedDoor);
    } else if (systemScheme) {
      out.push({
        ...systemScheme,
        label: "Вид двери",
        ratioType: "door",
      });
    }
  }

  const uploadedTop = getSchemeByType(schemes, "top");
  if (uploadedTop) {
    out.push(uploadedTop);
  } else {
    const generatedTop = tryGenerateTopScheme(systemName, subsystem, width, doorWidth);
    if (generatedTop) {
      out.push({ label: "Вид сверху", svgContent: generatedTop, ratioType: "top" });
    }
  }
  return out;
}

interface Variant {
  variantName: string;
  railImageUrl?: string | null;
  items: VariantItem[];
  schemes?: SchemeData[];
}

interface ProposalData {
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
}: {
  data: ProposalData;
  onDataChange?: (data: ProposalData) => void;
  /** Вызывается до генерации PDF — например, для авто-сохранения карточки. */
  onBeforePdfDownload?: () => Promise<void> | void;
}) {
  const [data, setData] = useState(initialData);

  // Sync with parent when initialData changes (e.g. variant loaded async, sizes updated).
  // Include fullWidth/height/doorWidth so that resizing the opening upstream triggers a
  // new scheme selection (wide/square/tall) inside this preview.
  useEffect(() => {
    setData(initialData);
  }, [
    initialData.variant,
    initialData.glassImageUrl,
    initialData.customServices,
    initialData.fullWidth,
    initialData.height,
    initialData.doorWidth,
    initialData.subsystem,
    initialData.systemName,
  ]);
  const [schemeSvgUrls, setSchemeSvgUrls] = useState<string[]>([]);
  const [schemeSizes, setSchemeSizes] = useState<Array<{ w: number; h: number }>>([]);
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

  // Системы, реально настроенные в БД. Фильтруем хардкоженый systemsData по этому списку.
  const [activeSystemSlugs, setActiveSystemSlugs] = useState<Set<string> | null>(null);
  useEffect(() => {
    fetch("/api/systems")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ slug: string }>) =>
        setActiveSystemSlugs(new Set(rows.map((r) => r.slug)))
      )
      .catch(() => setActiveSystemSlugs(new Set()));
  }, []);

  // Компания текущего залогиненного пользователя — для лого «партнёр × SAGA» в PDF.
  const [myCompany, setMyCompany] = useState<{ id: string | null; name: string; logoUrl: string | null } | null>(null);
  useEffect(() => {
    fetch("/api/me/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setMyCompany(c))
      .catch(() => setMyCompany(null));
  }, []);

  // SVG двери под выбранную шотланку (загружается из /admin/doors).
  const [doorSvg, setDoorSvg] = useState<string | null>(null);
  useEffect(() => {
    const slug = (initialData.systemName || "")
      .trim()
      .toLowerCase()
      .includes("каскад") ? "cascade" : null;
    // Резолвим slug по systemName: пока поддерживаем явные мапы для известных
    // систем. Для расширяемости можно завести обратную мапу name→slug.
    const sub = initialData.subsystem;
    const sh = initialData.shotlan || "Без шотланок";
    if (!slug || !sub) { setDoorSvg(null); return; }
    let cancelled = false;
    fetch(
      `/api/doors?systemSlug=${encodeURIComponent(slug)}&subsystemName=${encodeURIComponent(sub)}&shotlanType=${encodeURIComponent(sh)}`,
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ svgContent: string }>) => {
        if (cancelled) return;
        setDoorSvg(rows[0]?.svgContent ?? null);
      })
      .catch(() => setDoorSvg(null));
    return () => { cancelled = true; };
  }, [initialData.systemName, initialData.subsystem, initialData.shotlan]);

  // Convert all display schemes (system + door + side + top) to PNG for PDF.
  // Source sizes from `initialData` (not local `data`) so that when the parent form
  // recalculates with a new full width, the matching system scheme (wide/square/tall)
  // is picked immediately, without waiting for the editable-fields state to sync.
  useEffect(() => {
    const schemes = initialData.variant?.schemes;
    if (!schemes?.length) { setSchemeSvgUrls([]); return; }
    let cancelled = false;

    const toConvert = buildDisplaySchemes(
      schemes,
      initialData.fullWidth,
      initialData.height,
      initialData.doorWidth,
      initialData.systemName,
      initialData.subsystem,
      doorSvg,
    );

    const sysSvg = toConvert[0]?.svgContent;

    // Сначала собираем готовые SVG-строки (с подписями размеров для слотов
    // системы и двери — `renderSvgWithDimensions` расширяет viewBox под
    // подписи). Потом по этим ИТОГОВЫМ строкам считаем доли двери — это
    // важно: иначе ratio считается по голому viewBox без подписей и не
    // совпадает с реальной долей двери в выходной PNG-картинке.
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

    if (renderedSys) {
      const sysGroup = extractSystemGroup(renderedSys);
      const sysInner = sysGroup?.inner ?? renderedSys;
      const sysBBox = computeBBox(sysInner);
      const sysVB = getSvgViewBox(renderedSys);
      // Считаем системную дверь через bbox системы и количество дверей
      // (а не через findDoorCenters[0]) — это надёжнее, потому что некоторые
      // SVG'и рисуют все двери одним <path> с несколькими M..L подпутями,
      // и findDoorCenters в этом случае возвращает один общий bbox по всем
      // дверям, что завышает sysDoor.w в N раз.
      const numDoors = Math.max(
        1,
        Math.round(initialData.fullWidth / Math.max(1, initialData.doorWidth)),
      );
      const sysDoorW = sysBBox ? sysBBox.w / numDoors : 0;
      const sysDoorH = sysBBox ? sysBBox.h : 0;

      let doorRatio: { w: number; h: number } = { w: 1, h: 1 };
      if (renderedDoor) {
        const dGroup = extractSystemGroup(renderedDoor);
        const dInner = dGroup?.inner ?? renderedDoor;
        const dRect = findDoorCenters(dInner)[0];
        const dVB = getSvgViewBox(renderedDoor);
        if (dRect && dVB) {
          doorRatio = { w: dRect.w / dVB.w, h: dRect.h / dVB.h };
        }
      }

      if (sysBBox && sysVB && sysDoorW > 0 && sysDoorH > 0) {
        if (!cancelled) {
          setDoorBoxRatio({
            sys: { w: sysDoorW / sysVB.w, h: sysDoorH / sysVB.h },
            door: doorRatio,
          });
        }
      } else if (!cancelled) {
        setDoorBoxRatio(null);
      }
    } else if (!cancelled) {
      setDoorBoxRatio(null);
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
    initialData.fullWidth,
    initialData.height,
    initialData.doorWidth,
    initialData.systemName,
    initialData.subsystem,
    doorSvg,
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
                options={systemNameOptions}
                onChange={(v) => update({ systemName: v })}
              />
              <EditableSelect
                label="Подсистема"
                value={data.subsystem}
                options={subsystemOptions}
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
                options={glassOptions as unknown as string[]}
                onChange={(v) => update({ glass: v })}
              />
              <EditableSelect
                label="Шотланки"
                value={data.shotlan}
                options={shotlanFiltered as unknown as string[]}
                onChange={(v) => update({ shotlan: v })}
                display={data.shotlan && data.shotlan !== "Без шотланок" ? data.shotlan : "отсутствуют"}
              />
              {/* Доп. услуги (Боковая обшивка / Закладные / прочее) показываем
                  только в таблице «Спецификация» ниже — здесь не дублируем. */}
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

      {/* SVG Schemes — system (60%) + door (40%) в первой строке, top на второй строке. */}
      {initialData.variant?.schemes && initialData.variant.schemes.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-3">Схемы</p>
          <div className="grid grid-cols-5 gap-4">
            {(() => {
              const h = 200;
              const toShow = buildDisplaySchemes(
                initialData.variant!.schemes!,
                initialData.fullWidth,
                initialData.height,
                initialData.doorWidth,
                initialData.systemName,
                initialData.subsystem,
                doorSvg,
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
              // Считаем РЕНДЕР-пиксели одной двери в системном SVG.
              // Системный SVG рендерится с фиксированной высотой `h`, ширина
              // пропорциональна (w-auto). Скейл = h / sysViewBox.h. Дверной SVG
              // тоже скейлится по своему viewBox; внутри него реальная дверь
              // занимает только доля dRect/vbDoor. Контейнер двери выбираем
              // так, чтобы при scale_d = sysDoorPxH / dRect.h дверь по высоте
              // совпала, а контейнер сохранил аспект viewBox дверного SVG —
              // тогда meet-рендер не letterbox-ит и контуры не обрезаются.
              const sysVB = sysSvg ? getSvgViewBox(sysSvg) : null;
              const sysGroup = sysSvg ? extractSystemGroup(sysSvg) : null;
              const sysInner = sysGroup?.inner ?? sysSvg ?? null;
              const sysDoor = sysInner ? findDoorCenters(sysInner)[0] : null;
              const dSvg = toShow[1]?.svgContent;
              const dVB = dSvg && dSvg !== sysSvg ? getSvgViewBox(dSvg) : null;
              const dGroup = dSvg && dSvg !== sysSvg ? extractSystemGroup(dSvg) : null;
              const dInner = dGroup?.inner ?? (dSvg && dSvg !== sysSvg ? dSvg : null);
              const dRect = dInner ? findDoorCenters(dInner)[0] : null;
              let containerPxW = 0;
              let containerPxH = 0;
              if (sysDoor && sysVB && dVB && dRect && dRect.h > 0 && sysVB.h > 0) {
                const scaleSys = h / sysVB.h;
                const sysDoorPxH = sysDoor.h * scaleSys;
                const scaleD = sysDoorPxH / dRect.h;
                containerPxW = dVB.w * scaleD;
                containerPxH = dVB.h * scaleD;
              }

              return toShow.map((scheme, idx) => {
                const reusedFromSystem = idx > 0 && scheme.svgContent === sysSvg;
                const effIdx = reusedFromSystem ? 0 : idx;
                const rendered = renderSvgWithDimensions(scheme.svgContent, initialData.fullWidth, initialData.height, initialData.doorWidth, 1, effIdx);
                const displayLabel =
                  scheme.label?.trim() ||
                  (scheme.ratioType ? labelFallbacks[scheme.ratioType] : undefined) ||
                  "Схема";

                // Слот «Вид двери» с отдельным дверным SVG — рендерим в боксе
                // ровно того же пиксельного размера, что одна дверь в системе.
                // Свободное пространство по высоте слота — это отступы (padding).
                const isDoorSlot = idx === 1 && !reusedFromSystem && containerPxW > 0 && containerPxH > 0;

                return (
                  <div
                    key={idx}
                    className={`cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center ${colSpanByIndex(idx)}`}
                    onClick={() => setSchemeModal(rendered)}
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground text-center mb-2">{displayLabel}</p>
                    {isDoorSlot ? (
                      <div className="flex items-center justify-center w-full" style={{ height: h }}>
                        <div
                          dangerouslySetInnerHTML={{ __html: rendered }}
                          style={{ width: containerPxW, height: containerPxH }}
                          className="[&>svg]:w-full [&>svg]:h-full"
                        />
                      </div>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{ __html: rendered }}
                        style={{ height: h }}
                        className="[&>svg]:h-full [&>svg]:w-auto"
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
          variant={data.variant}
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
          doorBoxRatio={doorBoxRatio ?? undefined}
          glassImageUrl={data.glassImageUrl}
          railImageUrl={data.variant?.railImageUrl ? (data.variant.railImageUrl.startsWith("http") ? data.variant.railImageUrl : `${window.location.origin}${data.variant.railImageUrl}`) : undefined}
        />
      </div>
    </div>
  );
}
