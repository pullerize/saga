"use client";

import { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Ruler, ArrowLeftRight, ArrowUpDown, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DimensionInputsProps {
  fullWidth: number;
  openWidth: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  hasExtraField: boolean;
  openWidthMin?: number;
  openWidthMax?: number;
  onChange: (dims: Partial<{ fullWidth: number; openWidth: number; height: number }>) => void;
}

export function DimensionInputs({
  fullWidth,
  openWidth,
  height,
  minWidth,
  maxWidth,
  hasExtraField,
  openWidthMin,
  openWidthMax,
  onChange,
}: DimensionInputsProps) {
  const handleChange = useCallback(
    (key: "fullWidth" | "openWidth" | "height", value: string) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) || value === "") {
        onChange({ [key]: isNaN(num) ? 0 : num });
      }
    },
    [onChange]
  );

  const heightMin = 1800;
  const heightMax = 3500;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-brand-300" />
        <h3 className="font-display text-xl font-semibold">Размеры проёма</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <DimensionField
          icon={<ArrowLeftRight className="w-5 h-5" />}
          label={hasExtraField ? "Полная ширина стены" : "Ширина проёма"}
          hint={`${minWidth} – ${maxWidth} мм`}
          value={fullWidth || ""}
          min={minWidth}
          max={maxWidth}
          onChange={(v) => handleChange("fullWidth", v)}
        />

        {hasExtraField && (
          <DimensionField
            icon={<Ruler className="w-5 h-5" />}
            label="Ширина открытия"
            hint={`${openWidthMin || minWidth} – ${openWidthMax || maxWidth} мм`}
            value={openWidth || ""}
            min={openWidthMin || minWidth}
            max={openWidthMax || maxWidth}
            onChange={(v) => handleChange("openWidth", v)}
          />
        )}

        <DimensionField
          icon={<ArrowUpDown className="w-5 h-5" />}
          label="Высота"
          hint={`${heightMin} – ${heightMax} мм`}
          value={height || ""}
          min={heightMin}
          max={heightMax}
          onChange={(v) => handleChange("height", v)}
        />
      </div>
    </motion.div>
  );
}

/* ── Parse subsystem notation into panel layout ── */
interface PanelInfo {
  count: number;
  fixed: boolean;
}

function parseSubsystem(subsystemId: string | null | undefined): PanelInfo[] | null {
  if (!subsystemId) return null;

  // "Система 1W", "Система 1W+1W", etc.
  if (subsystemId.startsWith("Система")) {
    const parts = subsystemId.replace(/Система\s*/g, "").split("+").filter(Boolean);
    return parts.map(() => ({ count: 1, fixed: false }));
  }

  const panels: PanelInfo[] = [];

  // Treat | same as + — "3+0|3+0" = all panels in one row
  const normalized = subsystemId.replace(/\|/g, "+");
  const tokens = normalized.split("+").map((t) => t.trim()).filter(Boolean);

  for (const token of tokens) {
    const isFixed = token.startsWith("(") && token.endsWith(")");
    const cleaned = token.replace(/[()]/g, "");

    // Extract the number — handle "1C", "2C", "1W", "1WPUSH", "2WPUSH", etc.
    const numMatch = cleaned.match(/^(\d+)/);
    const count = numMatch ? parseInt(numMatch[1], 10) : 1;

    if (count === 0) continue; // "3+0" — the 0 part means no doors on that side

    panels.push({ count, fixed: isFixed });
  }

  return panels.length > 0 ? panels : null;
}

/* ── Door preview wrapper (for external use) ── */
export function DoorPreviewWrapper({
  fullWidth,
  height,
  minWidth,
  maxWidth,
  subsystemId,
}: {
  fullWidth: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  subsystemId?: string | null;
}) {
  const heightMin = 1800;
  const heightMax = 3500;
  const w = fullWidth || minWidth;
  const h = height || heightMin;
  const normalizedWidth = Math.max(0, Math.min(1, (w - minWidth) / (maxWidth - minWidth)));
  const normalizedHeight = Math.max(0, Math.min(1, (h - heightMin) / (heightMax - heightMin)));

  return (
    <DoorPreview
      normalizedWidth={normalizedWidth}
      normalizedHeight={normalizedHeight}
      widthMm={w}
      heightMm={h}
      subsystemId={subsystemId}
    />
  );
}

/* ── Visual door preview (blueprint style) ── */
function DoorPreview({
  normalizedWidth,
  normalizedHeight,
  widthMm,
  heightMm,
  subsystemId,
}: {
  normalizedWidth: number;
  normalizedHeight: number;
  widthMm: number;
  heightMm: number;
  subsystemId?: string | null;
}) {
  const visualW = 80 + normalizedWidth * 100;
  const visualH = 100 + normalizedHeight * 80;

  const panels = useMemo(() => parseSubsystem(subsystemId), [subsystemId]);
  const totalDoors = panels ? panels.reduce((sum, p) => sum + p.count, 0) : 0;

  return (
    <div className="hidden lg:flex flex-col items-center select-none gap-4">
      <div className="relative rounded-2xl border border-[#8a8079] premium-shadow p-3" style={{ width: 310, height: 330, backgroundColor: "#c4bbb5" }}>
        {/* Blueprint grid overlay */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(hsl(190 60% 40%) 1px, transparent 1px),
                linear-gradient(90deg, hsl(190 60% 40%) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Centered content */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ padding: "20px 40px 40px 60px" }}>
          <div className="relative">
            <motion.div
              animate={{ width: visualW, height: visualH }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative"
            >
              {/* Wall sides */}
              <div className="absolute -left-3 top-0 bottom-0 w-3 bg-gradient-to-r from-muted to-muted/70 border-y border-l border-border/60 rounded-l-sm" />
              <div className="absolute -right-3 top-0 bottom-0 w-3 bg-gradient-to-l from-muted to-muted/70 border-y border-r border-border/60 rounded-r-sm" />
              {/* Wall top */}
              <div className="absolute -left-3 -right-3 -top-3 h-3 bg-muted/80 border border-border/60 rounded-t-sm" />

              {/* Opening with panels */}
              <div className="absolute inset-0 border-2 border-brand-500/50 bg-gradient-to-b from-sky-50/50 to-brand-50/30 overflow-hidden">
                <AnimatePresence mode="wait">
                  {panels ? (
                    <motion.div
                      key={subsystemId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-stretch"
                    >
                      {(() => {
                        let doorCounter = 0;
                        return panels.map((panel, panelIdx) =>
                          Array.from({ length: panel.count }).map((_, doorIdx) => {
                            const idx = doorCounter++;
                            return (
                              <motion.div
                                key={`${panelIdx}-${doorIdx}`}
                                initial={{ opacity: 0, scaleX: 0.5 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.3, delay: idx * 0.04 }}
                                className={cn(
                                  "relative border-r last:border-r-0",
                                  panel.fixed
                                    ? "border-brand-600/40 bg-brand-200/20"
                                    : "border-brand-400/30 bg-white/10"
                                )}
                                style={{ width: `${100 / totalDoors}%` }}
                              >
                                {/* Glass reflection */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />

                                {/* Fixed indicator: hatching */}
                                {panel.fixed && (
                                  <div
                                    className="absolute inset-0 opacity-[0.06]"
                                    style={{
                                      backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, currentColor 3px, currentColor 4px)",
                                    }}
                                  />
                                )}

                                {/* Panel icon */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                                  {panel.fixed ? (
                                    <Lock className="w-2.5 h-2.5 text-brand-600/40" />
                                  ) : (
                                    <Unlock className="w-2.5 h-2.5 text-brand-400/50" />
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        );
                      })()}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <div className="absolute top-0 bottom-0 left-1/3 w-px bg-brand-300/25" />
                      <div className="absolute top-0 bottom-0 left-2/3 w-px bg-brand-300/25" />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Floor */}
              <div className="absolute -left-3 -right-3 -bottom-[2px] h-[3px] bg-brand-600/40 rounded-full" />

              {/* ── Width dimension (below) ── */}
              <div className="absolute left-0 right-0" style={{ top: "calc(100% + 16px)" }}>
                <div className="absolute left-0 w-px bg-brand-400/40" style={{ top: "-8px", height: "12px" }} />
                <div className="absolute right-0 w-px bg-brand-400/40" style={{ top: "-8px", height: "12px" }} />
                <div className="flex items-center h-0">
                  <svg width="6" height="8" viewBox="0 0 6 8" className="shrink-0 text-brand-500"><path d="M6 0L0 4L6 8Z" fill="currentColor" /></svg>
                  <div className="flex-1 h-px bg-brand-500" />
                  <svg width="6" height="8" viewBox="0 0 6 8" className="shrink-0 text-brand-500"><path d="M0 0L6 4L0 8Z" fill="currentColor" /></svg>
                </div>
                <div className="flex justify-center mt-2.5">
                  <span className="px-3 py-1 rounded bg-white text-[11px] font-semibold text-brand-700 whitespace-nowrap border border-brand-200/60 shadow-sm tracking-wide">
                    {widthMm} мм
                  </span>
                </div>
              </div>

              {/* ── Height dimension (left) ── */}
              <div className="absolute top-0 bottom-0" style={{ right: "calc(100% + 20px)" }}>
                <div className="absolute top-0 h-px bg-brand-400/40" style={{ right: "-10px", width: "14px" }} />
                <div className="absolute bottom-0 h-px bg-brand-400/40" style={{ right: "-10px", width: "14px" }} />
                <div className="absolute top-0 bottom-0 right-0 flex flex-col items-center w-0">
                  <svg width="8" height="6" viewBox="0 0 8 6" className="shrink-0 text-brand-500"><path d="M0 6L4 0L8 6Z" fill="currentColor" /></svg>
                  <div className="flex-1 w-px bg-brand-500" />
                  <svg width="8" height="6" viewBox="0 0 8 6" className="shrink-0 text-brand-500"><path d="M0 0L4 6L8 0Z" fill="currentColor" /></svg>
                </div>
                <div className="absolute top-0 bottom-0 flex items-center" style={{ right: "-4px" }}>
                  <span
                    className="px-3 py-1 rounded bg-white text-[11px] font-semibold text-brand-700 whitespace-nowrap border border-brand-200/60 shadow-sm tracking-wide"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    {heightMm} мм
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Subsystem label */}
        <AnimatePresence>
          {subsystemId && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-3 z-10"
            >
              <span className="px-2 py-0.5 rounded-md bg-brand-700/80 text-[10px] font-semibold text-white tracking-wide">
                {subsystemId}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <AnimatePresence>
          {panels && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 right-3 flex gap-3 z-10"
            >
              {panels.some((p) => !p.fixed) && (
                <span className="flex items-center gap-1 text-[9px] text-brand-800/60">
                  <span className="w-2.5 h-2.5 rounded-sm bg-white/40 border border-brand-400/40" />
                  подв.
                </span>
              )}
              {panels.some((p) => p.fixed) && (
                <span className="flex items-center gap-1 text-[9px] text-brand-800/60">
                  <span className="w-2.5 h-2.5 rounded-sm bg-brand-200/40 border border-brand-600/40" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0.05) 2px)" }} />
                  фикс.
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
        Схема проёма
      </span>
    </div>
  );
}

/* ── Dimension field with slider ── */
function DimensionField({
  icon,
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: number | string;
  min: number;
  max: number;
  onChange: (val: string) => void;
}) {
  const numVal = typeof value === "number" ? value : parseInt(String(value), 10);
  const isValid = isNaN(numVal) || numVal === 0 || (numVal >= min && numVal <= max);
  const sliderVal = isNaN(numVal) || numVal === 0 ? min : Math.max(min, Math.min(max, numVal));
  const progress = ((sliderVal - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="text-brand-500">{icon}</span>
        {label}
      </label>
      <Input
        type="number"
        placeholder={hint}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "text-lg font-medium h-12",
          !isValid && "border-destructive focus-visible:ring-destructive"
        )}
      />

      {/* Slider */}
      <div className="relative group/slider">
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={sliderVal}
          onChange={(e) => onChange(e.target.value)}
          className="dimension-slider w-full"
        />
        {/* Custom track fill */}
        <div className="pointer-events-none absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className={cn("text-xs", isValid ? "text-muted-foreground" : "text-destructive")}>
          {isValid ? hint : `Допустимый диапазон: ${min} – ${max} мм`}
        </p>
        {!isNaN(numVal) && numVal > 0 && (
          <span className="text-xs font-mono text-brand-500">
            {(numVal / 1000).toFixed(2)} м
          </span>
        )}
      </div>
    </div>
  );
}
