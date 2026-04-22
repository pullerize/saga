"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import { type CalcComponent } from "@/lib/calculations/engine";
import PDFDownloadBtn from "@/components/pdf/PDFDownloadBtn";
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
    .replace(/\{\{DOORS\}\}/g, "");

  // Force a consistent font family for any <text> elements already baked into the SVG,
  // so embedded size labels don't look out of place next to the ones we add below.
  svg = svg.replace(/<text\b([^>]*)>/gi, (_, attrs) => {
    const cleaned = attrs
      .replace(/\sfont-family\s*=\s*["'][^"']*["']/gi, "")
      .replace(/\sfont-weight\s*=\s*["'][^"']*["']/gi, "");
    return `<text${cleaned} font-family="Arial, Helvetica, sans-serif" font-weight="700">`;
  });

  // Parse viewBox
  const vbMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (!vbMatch) return svg;
  const parts = vbMatch[1].split(/[\s,]+/).map(Number);
  const vbX = parts[0], vbY = parts[1], svgW = parts[2], svgH = parts[3];

  const dimW = schemeIndex === 0 ? width : doorWidth;
  const dimH = height;

  // Which labels to draw per scheme type:
  //   0 — system: width (bottom) + height (right)
  //   1 — door:   doorWidth (bottom) + height (right)
  //   2 — side:   height (right) only. The bottom is a thin slice.
  //   3 — top:    width (bottom) only.
  const showBottom = schemeIndex !== 2;
  const showRight = schemeIndex !== 3;

  // Always scale from the LONGEST side — this keeps the font size proportional
  // to the drawing regardless of whether it's narrow (side) or wide (top).
  const sc = Math.max(svgW, svgH) / 200;
  const lineW = Math.max(sc * 0.3, 0.5);
  const tickL = Math.round(sc * 2);
  const fontSize = Math.max(Math.round(sc * 6), 22);
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
  const newW = Math.round(svgW + extraRight);
  const newH = Math.round(svgH + extraBottom);
  svg = svg.replace(vbMatch[0], `viewBox="${vbX} ${vbY} ${newW} ${newH}"`);

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

const SYSTEM_RATIO_TYPES = new Set(["wide", "square", "tall"]);

/**
 * Pick the right system scheme based on width/height ratio.
 * "wide" = width > height * 1.15
 * "square" = roughly equal
 * "tall" = height > width * 1.15
 */
function pickSystemScheme(schemes: SchemeData[], width: number, height: number): SchemeData | null {
  const ratio = width / height;
  let type: string;
  if (ratio > 1.15) type = "wide";
  else if (ratio < 0.87) type = "tall";
  else type = "square";

  const match = schemes.find((s) => s.ratioType === type);
  if (match) return match;
  // Fallback: any ratio-typed system scheme
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
 *   1. System view (one of wide/square/tall, picked by ratio)
 *   2. Door (always)
 *   3. Side view (always)
 *   4. Top view (always)
 */
function buildDisplaySchemes(schemes: SchemeData[], width: number, height: number): SchemeData[] {
  const out: SchemeData[] = [];
  const system = pickSystemScheme(schemes, width, height);
  if (system) out.push(system);
  const door = getSchemeByType(schemes, "door");
  if (door) out.push(door);
  const side = getSchemeByType(schemes, "side");
  if (side) out.push(side);
  const top = getSchemeByType(schemes, "top");
  if (top) out.push(top);
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

/* ─── Main component ─── */
export function ProposalPreview({
  data: initialData,
  onDataChange,
}: {
  data: ProposalData;
  onDataChange?: (data: ProposalData) => void;
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
  const [schemeModal, setSchemeModal] = useState<string | null>(null);

  // Convert all display schemes (system + door + side + top) to PNG for PDF.
  // Source sizes from `initialData` (not local `data`) so that when the parent form
  // recalculates with a new full width, the matching system scheme (wide/square/tall)
  // is picked immediately, without waiting for the editable-fields state to sync.
  useEffect(() => {
    const schemes = initialData.variant?.schemes;
    if (!schemes?.length) { setSchemeSvgUrls([]); return; }
    let cancelled = false;

    const toConvert = buildDisplaySchemes(schemes, initialData.fullWidth, initialData.height);

    Promise.all(
      toConvert.map((scheme, idx) => {
        const rendered = renderSvgWithDimensions(scheme.svgContent, initialData.fullWidth, initialData.height, initialData.doorWidth, 1, idx);
        return svgToPngViaServer(rendered).catch(() => ({ dataUrl: "", w: 0, h: 0 }));
      })
    ).then((results) => {
      if (!cancelled) {
        setSchemeSvgUrls(results.map(r => r.dataUrl));
        setSchemeSizes(results.map(r => ({ w: r.w, h: r.h })));
      }
    });
    return () => { cancelled = true; };
  }, [initialData.variant?.schemes, initialData.fullWidth, initialData.height, initialData.doorWidth]);

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
      <div className="rounded-xl border border-border p-4">
        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-3">Параметры системы</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Система</p>
            <p className="text-sm font-semibold">{data.systemName}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Подсистема</p>
            <p className="text-sm font-semibold">{data.subsystem}</p>
          </div>
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
          <div>
            <p className="text-[10px] text-muted-foreground">Стекло</p>
            <p className="text-sm font-semibold">{data.glass}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Шотланки</p>
            <p className="text-sm font-semibold">{data.shotlan}</p>
          </div>
        </div>
      </div>

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

      {/* SVG Schemes — 4 schemes: system (ratio-based) + door + side + top.
          Pull sizes from initialData so the ratio-based picker always sees the
          latest values from the parent form. */}
      {initialData.variant?.schemes && initialData.variant.schemes.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-3">Схемы</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const h = 200;
              const toShow = buildDisplaySchemes(initialData.variant!.schemes!, initialData.fullWidth, initialData.height);
              const labelFallbacks: Record<string, string> = {
                wide: "Широкий проём",
                square: "Квадратный проём",
                tall: "Высокий проём",
                door: "Дверь",
                side: "Вид сбоку",
                top: "Вид сверху",
              };

              return toShow.map((scheme, idx) => {
                const rendered = renderSvgWithDimensions(scheme.svgContent, initialData.fullWidth, initialData.height, initialData.doorWidth, 1, idx);
                const displayLabel =
                  scheme.label?.trim() ||
                  (scheme.ratioType ? labelFallbacks[scheme.ratioType] : undefined) ||
                  "Схема";
                return (
                  <div
                    key={idx}
                    className="cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center"
                    onClick={() => setSchemeModal(rendered)}
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground text-center mb-2">{displayLabel}</p>
                    <div
                      dangerouslySetInnerHTML={{ __html: rendered }}
                      style={{ height: h }}
                      className="[&>svg]:h-full [&>svg]:w-auto"
                    />
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
          variant={data.variant}
          schemeSvgs={schemeSvgUrls}
          schemeSizes={schemeSizes}
          glassImageUrl={data.glassImageUrl}
          railImageUrl={data.variant?.railImageUrl ? (data.variant.railImageUrl.startsWith("http") ? data.variant.railImageUrl : `${window.location.origin}${data.variant.railImageUrl}`) : undefined}
        />
      </div>
    </div>
  );
}
