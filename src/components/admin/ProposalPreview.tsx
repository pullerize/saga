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

  // Parse viewBox
  const vbMatch = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (!vbMatch) return svg;
  const parts = vbMatch[1].split(/[\s,]+/).map(Number);
  const vbX = parts[0], vbY = parts[1], svgW = parts[2], svgH = parts[3];

  // Find the grey rect to get actual content bounds
  const greyRect = svg.match(/<rect[^>]*fill="#D9D9D9"[^>]*/);
  let contentX = 0, contentY = 0, contentW = svgW * 0.9, contentH = svgH * 0.95;
  if (greyRect) {
    const xM = greyRect[0].match(/x="([\d.]+)"/);
    const yM = greyRect[0].match(/y="([\d.]+)"/);
    const wM = greyRect[0].match(/width="([\d.]+)"/);
    const hM = greyRect[0].match(/height="([\d.]+)"/);
    if (xM) contentX = parseFloat(xM[1]);
    if (yM) contentY = parseFloat(yM[1]);
    if (wM) contentW = parseFloat(wM[1]);
    if (hM) contentH = parseFloat(hM[1]);
  }

  const dimW = schemeIndex === 0 ? width : doorWidth;
  const dimH = height;

  // Scale dimensions relative to SVG size
  const sc = Math.max(svgW, svgH) / 200;
  const lineW = Math.max(sc * 0.3, 0.5);
  const tickL = Math.round(sc * 2);
  const fontSize = Math.max(Math.round(sc * 6), 22);
  const gap = Math.round(sc * 3);

  // Bottom dimension line (width)
  const bLineY = contentY + contentH + gap;
  const bLeft = contentX;
  const bRight = contentX + contentW;
  const bMidX = contentX + contentW / 2;
  const bTextY = bLineY + gap + fontSize;

  // Right dimension line (height)
  const rLineX = contentX + contentW + gap;
  const rTop = contentY;
  const rBottom = contentY + contentH;
  const rMidY = contentY + contentH / 2;
  const rTextX = rLineX + gap + fontSize;

  const dimLines = [
    `<g fill="none" stroke="#333" stroke-width="${lineW}">`,
    // Bottom: horizontal line + ticks
    `<line x1="${bLeft}" y1="${bLineY}" x2="${bRight}" y2="${bLineY}"/>`,
    `<line x1="${bLeft}" y1="${bLineY - tickL}" x2="${bLeft}" y2="${bLineY + tickL}"/>`,
    `<line x1="${bRight}" y1="${bLineY - tickL}" x2="${bRight}" y2="${bLineY + tickL}"/>`,
    // Right: vertical line + ticks
    `<line x1="${rLineX}" y1="${rTop}" x2="${rLineX}" y2="${rBottom}"/>`,
    `<line x1="${rLineX - tickL}" y1="${rTop}" x2="${rLineX + tickL}" y2="${rTop}"/>`,
    `<line x1="${rLineX - tickL}" y1="${rBottom}" x2="${rLineX + tickL}" y2="${rBottom}"/>`,
    `</g>`,
    // Labels
    `<g font-family="Arial,sans-serif" fill="#0A3C46" font-weight="bold" font-size="${fontSize}">`,
    `<text x="${bMidX}" y="${bTextY}" text-anchor="middle">${dimW} мм</text>`,
    `<text x="${rTextX}" y="${rMidY}" text-anchor="middle" transform="rotate(90,${rTextX},${rMidY})">${dimH} мм</text>`,
    `</g>`,
  ].join("\n");

  // Expand viewBox to fit dimension lines and text
  const newW = Math.round(rTextX + fontSize * 3 - vbX);
  const newH = Math.round(bTextY + fontSize - vbY);
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

  // Find matching scheme
  const match = schemes.find(s => s.ratioType === type);
  if (match) return match;

  // Fallback: first scheme with any ratioType, or first scheme
  return schemes.find(s => s.ratioType) || schemes[0] || null;
}

function getDoorScheme(schemes: SchemeData[]): SchemeData | null {
  return schemes.find(s => !s.ratioType) || null;
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
  const [schemeSvgUrls, setSchemeSvgUrls] = useState<string[]>([]);
  const [schemeSizes, setSchemeSizes] = useState<Array<{ w: number; h: number }>>([]);
  const [schemeModal, setSchemeModal] = useState<string | null>(null);

  // Upload SVG schemes to server for PDF rendering
  // Convert selected schemes (system + door) to PNG for PDF
  useEffect(() => {
    if (!data.variant?.schemes?.length) { setSchemeSvgUrls([]); return; }
    let cancelled = false;

    const sysScheme = pickSystemScheme(data.variant.schemes, data.fullWidth, data.height);
    const doorScheme = getDoorScheme(data.variant.schemes);
    const toConvert: { scheme: SchemeData; idx: number }[] = [];
    if (sysScheme) toConvert.push({ scheme: sysScheme, idx: 0 });
    if (doorScheme) toConvert.push({ scheme: doorScheme, idx: 1 });

    Promise.all(
      toConvert.map(({ scheme, idx }) => {
        const rendered = renderSvgWithDimensions(scheme.svgContent, data.fullWidth, data.height, data.doorWidth, 1, idx);
        return svgToPngViaServer(rendered).catch(() => ({ dataUrl: "", w: 0, h: 0 }));
      })
    ).then((results) => {
      if (!cancelled) {
        setSchemeSvgUrls(results.map(r => r.dataUrl));
        setSchemeSizes(results.map(r => ({ w: r.w, h: r.h })));
      }
    });
    return () => { cancelled = true; };
  }, [data.variant?.schemes, data.fullWidth, data.height, data.doorWidth]);

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

      {/* Variant cards */}
      {data.variant && data.variant.items.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-3">{data.variant.variantName}</p>
          <div className="grid grid-cols-3 gap-4">
            {data.variant.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-brand-50 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SVG Schemes */}
      {data.variant?.schemes && data.variant.schemes.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-3">Схемы</p>
          <div className="flex items-end gap-4">
            {(() => {
              const h = 260;
              const sysScheme = pickSystemScheme(data.variant!.schemes!, data.fullWidth, data.height);
              const doorScheme = getDoorScheme(data.variant!.schemes!);
              const toShow: { scheme: SchemeData; idx: number }[] = [];
              if (sysScheme) toShow.push({ scheme: sysScheme, idx: 0 });
              if (doorScheme) toShow.push({ scheme: doorScheme, idx: 1 });

              return toShow.map(({ scheme, idx }) => {
                const rendered = renderSvgWithDimensions(scheme.svgContent, data.fullWidth, data.height, data.doorWidth, 1, idx);
                return (
                  <div
                    key={idx}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSchemeModal(rendered)}
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground text-center mb-2">{scheme.label}</p>
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

        {/* Total */}
        <div className="border-t px-4 py-3 flex items-center justify-between bg-muted/20">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Итого:</span>
          <span className="text-lg font-bold text-brand-700 tabular-nums">
            {formatPrice(data.totalPrice)} у.е.
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
