"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { systemsData } from "@/lib/calculations/systemsData";
import { type CalcComponent } from "@/lib/calculations/engine";
import { calculateWithDB } from "@/lib/calculations/calculateWithDB";
import { glassOptions, shotlanOptions, hideWithRiffled } from "@/lib/calculations/constants";
import PDFDownloadBtn from "@/components/pdf/PDFDownloadBtn";

/* ─── Section wrapper ──────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Chip selector ────────────────────────── */
function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer",
            value === opt
              ? "bg-brand-700 text-white border-brand-700 shadow-sm"
              : "bg-card border-border text-foreground hover:border-brand-300 hover:bg-brand-50/50"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ─── Number input ─────────────────────────── */
function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  suffix = "мм",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div className="flex-1 min-w-[140px]">
      <label className="text-[11px] text-muted-foreground block mb-1">
        {label} ({min}–{max} {suffix})
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        placeholder={String(min)}
      />
    </div>
  );
}

/* ─── Main component ───────────────────────── */
export function QuickCalculator() {
  const [systemSlug, setSystemSlug] = useState<string | null>(null);
  const [subsystemId, setSubsystemId] = useState<string | null>(null);
  const [glass, setGlass] = useState<string | null>(null);
  const [shotlan, setShotlan] = useState<string>("Без шотланок");
  const [fullWidth, setFullWidth] = useState(0);
  const [openWidth, setOpenWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [result, setResult] = useState<{
    components: CalcComponent[];
    total: number;
    doorWidth: number;
  } | null>(null);

  const system = systemSlug ? systemsData[systemSlug] : null;

  // Filter subsystems by width
  const availableSubsystems = useMemo(() => {
    if (!system) return [];
    const w = system.extraField ? openWidth : fullWidth;
    return Object.entries(system.subsystems)
      .filter(([, sub]) => w >= sub.min && w <= sub.max)
      .map(([key]) => key);
  }, [system, fullWidth, openWidth]);

  // Reset subsystem if no longer available
  const effectiveSubsystem = useMemo(() => {
    if (subsystemId && availableSubsystems.includes(subsystemId)) return subsystemId;
    return null;
  }, [subsystemId, availableSubsystems]);

  // Shotlan options filtered for riffled glass
  const filteredShotlanOptions = useMemo(() => {
    if (glass === "Рифленое") {
      return shotlanOptions.filter((o) => !hideWithRiffled.includes(o));
    }
    return [...shotlanOptions];
  }, [glass]);

  const canCalculate = !!(
    system &&
    systemSlug &&
    effectiveSubsystem &&
    glass &&
    shotlan &&
    fullWidth > 0 &&
    height >= 1800 &&
    height <= 3500
  );

  const handleCalculate = useCallback(async () => {
    if (!canCalculate || !systemSlug || !effectiveSubsystem || !system || !glass || !shotlan) return;
    const subsystemDef = system.subsystems[effectiveSubsystem];
    if (!subsystemDef) return;

    const res = await calculateWithDB(
      systemSlug,
      effectiveSubsystem,
      subsystemDef.params,
      fullWidth,
      openWidth,
      height,
      glass,
      shotlan
    );
    setResult(res);
  }, [canCalculate, systemSlug, effectiveSubsystem, system, glass, shotlan, fullWidth, openWidth, height]);

  // Filter systems by what's actually present in DB
  const [activeSlugs, setActiveSlugs] = useState<Set<string> | null>(null);
  useEffect(() => {
    fetch("/api/systems")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ slug: string }>) =>
        setActiveSlugs(new Set(rows.map((r) => r.slug)))
      )
      .catch(() => setActiveSlugs(new Set()));
  }, []);

  const systemEntries = useMemo(
    () =>
      Object.entries(systemsData).filter(
        ([slug]) => !activeSlugs || activeSlugs.has(slug)
      ),
    [activeSlugs]
  );

  return (
    <div className="space-y-6">
      {/* System selection */}
      <Section title="Система">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {systemEntries.map(([slug, sys]) => (
            <button
              key={slug}
              onClick={() => {
                setSystemSlug(slug);
                setSubsystemId(null);
                setResult(null);
                setFullWidth(0);
                setOpenWidth(0);
                setHeight(0);
              }}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left cursor-pointer",
                systemSlug === slug
                  ? "bg-brand-700 text-white border-brand-700 shadow-sm"
                  : "bg-card border-border hover:border-brand-300 hover:bg-brand-50/50"
              )}
            >
              {sys.name}
            </button>
          ))}
        </div>
      </Section>

      {system && (
        <>
          {/* Dimensions */}
          <Section title="Размеры">
            <div className="flex flex-wrap gap-3">
              <NumInput
                label={system.extraField ? "Полная ширина" : "Ширина проёма"}
                value={fullWidth}
                onChange={(v) => { setFullWidth(v); setResult(null); }}
                min={system.minWidth}
                max={system.extraField ? (system.maxFullWidth || system.maxWidth) : system.maxWidth}
              />
              {system.extraField && (
                <NumInput
                  label="Ширина проёма"
                  value={openWidth}
                  onChange={(v) => { setOpenWidth(v); setResult(null); }}
                  min={system.minWidth}
                  max={system.maxWidth}
                />
              )}
              <NumInput
                label="Высота"
                value={height}
                onChange={(v) => { setHeight(v); setResult(null); }}
                min={1800}
                max={3500}
              />
            </div>
          </Section>

          {/* Subsystem */}
          {availableSubsystems.length > 0 && (
            <Section title="Подсистема">
              <ChipGroup
                options={availableSubsystems}
                value={effectiveSubsystem}
                onChange={(v) => { setSubsystemId(v); setResult(null); }}
              />
            </Section>
          )}
          {fullWidth > 0 && availableSubsystems.length === 0 && (
            <p className="text-xs text-destructive">
              Нет подсистем для указанной ширины.
            </p>
          )}

          {/* Glass */}
          <Section title="Стекло">
            <ChipGroup
              options={[...glassOptions]}
              value={glass}
              onChange={(v) => { setGlass(v); setResult(null); }}
            />
          </Section>

          {/* Shotlan */}
          <Section title="Шотланки">
            <ChipGroup
              options={filteredShotlanOptions}
              value={shotlan}
              onChange={(v) => { setShotlan(v); setResult(null); }}
            />
          </Section>

          {/* Calculate button */}
          <Button
            variant="premium"
            size="lg"
            onClick={handleCalculate}
            disabled={!canCalculate}
            className="gap-2 w-full sm:w-auto"
          >
            <Calculator className="w-4 h-4" />
            Рассчитать
          </Button>
        </>
      )}

      {/* Results */}
      {result && system && (
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Header */}
          <div className="brand-gradient px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-brand-200/60 text-[10px] uppercase tracking-widest">Результат</p>
              <h3 className="text-white font-display font-bold text-base">
                {system.name}
                <span className="ml-2 text-sm font-normal text-brand-200/70">
                  {effectiveSubsystem}
                </span>
              </h3>
            </div>
            <p className="font-display text-xl font-bold text-white tabular-nums">
              {formatPrice(result.total)}
              <span className="text-[10px] text-brand-200/50 ml-1">у.е.</span>
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-4 pr-2 py-2 w-8">
                    №
                  </th>
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
                    Наименование
                  </th>
                  <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 w-20">
                    Кол-во
                  </th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 w-20">
                    Цена
                  </th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-2 pr-4 py-2 w-24">
                    Сумма
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.components.map((comp, i) => (
                  <tr
                    key={`${comp.key}-${i}`}
                    className={cn(
                      "border-b border-border/20 last:border-0 hover:bg-brand-50/30 transition-colors",
                      i % 2 === 1 && "bg-muted/5"
                    )}
                  >
                    <td className="pl-4 pr-2 py-1.5 text-[11px] text-muted-foreground/50 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-2 py-1.5 text-[13px] font-medium">{comp.name}</td>
                    <td className="px-2 py-1.5 text-[13px] text-center tabular-nums">
                      {typeof comp.qty === "number" && comp.qty % 1 !== 0
                        ? comp.qty.toFixed(2)
                        : comp.qty}
                      {comp.unit && (
                        <span className="text-[10px] text-muted-foreground ml-0.5">{comp.unit}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-[13px] text-right text-muted-foreground tabular-nums">
                      {formatPrice(comp.price)}
                    </td>
                    <td className="pl-2 pr-4 py-1.5 text-[13px] text-right font-semibold tabular-nums">
                      {formatPrice(comp.sum)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3 flex items-center justify-between bg-muted/20">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Итого:</span>
              <span className="ml-2 text-base font-bold text-brand-700 tabular-nums">
                {formatPrice(result.total)} у.е.
              </span>
            </div>
            <PDFDownloadBtn
              customerName=""
              systemName={system.name}
              subsystemName={effectiveSubsystem || ""}
              fullWidth={fullWidth}
              openWidth={system.extraField ? openWidth : undefined}
              height={height}
              doorWidth={result.doorWidth}
              glassType={glass || ""}
              shotlanType={shotlan}
              components={result.components}
              totalPrice={result.total}
            />
          </div>
        </div>
      )}
    </div>
  );
}
