"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import { systemsData } from "@/lib/calculations/systemsData";
import { type CalcComponent } from "@/lib/calculations/engine";
import { calculateWithDB } from "@/lib/calculations/calculateWithDB";
import { glassOptions, shotlanOptions, hideWithRiffled } from "@/lib/calculations/constants";
import PDFDownloadBtn from "@/components/pdf/PDFDownloadBtn";
import { ProposalPreview } from "@/components/admin/ProposalPreview";
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Calculator,
  User,
  Phone,
  MapPin,
  UserCheck,
} from "lucide-react";

/* ─── Known client type ─── */
export interface KnownClient {
  name: string;
  phone: string;
  address: string;
}

/* ─── Demo data (replace with DB fetch when API is ready) ─── */

const managers = [
  { id: "1", name: "Алексей Иванов", phone: "+998 90 123-45-67" },
  { id: "2", name: "Дмитрий Петров", phone: "+998 91 234-56-78" },
  { id: "3", name: "Сергей Сидоров", phone: "+998 93 345-67-89" },
];

const branches = [
  "г. Ташкент, ул. Навои 100",
  "г. Ташкент, ул. Амира Темура 55",
  "г. Самарканд, ул. Регистан 12",
];

/* ─── Chip selector ─── */
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

/* ─── Number input ─── */
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

/* ─── Section wrapper ─── */
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

/* ─── Main component ─── */
/* ─── Phone formatting helpers ─── */
const PHONE_PREFIX = "+998 ";

function formatPhoneDigits(digits: string): string {
  // digits = only the part after 998, max 9 digits
  const d = digits.slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7)}`;
}

function formatPhone(digits: string): string {
  if (!digits) return PHONE_PREFIX;
  return PHONE_PREFIX + formatPhoneDigits(digits);
}

function extractPhoneDigits(formatted: string): string {
  // Extract only digits after +998
  const all = formatted.replace(/\D/g, "");
  if (all.startsWith("998")) return all.slice(3, 12);
  return all.slice(0, 9);
}

/* ─── Name input with dropdown ─── */
function NameCombobox({
  value,
  onChange,
  onSelect,
  knownClients,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (client: KnownClient) => void;
  knownClients: KnownClient[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = useMemo(() => {
    if (!value.trim()) return knownClients;
    const q = value.toLowerCase();
    return knownClients.filter((c) => c.name.toLowerCase().includes(q));
  }, [value, knownClients]);

  // Only allow letters, spaces, hyphens, apostrophes (no digits)
  function handleChange(raw: string) {
    const cleaned = raw.replace(/[0-9]/g, "");
    onChange(cleaned);
    setOpen(true);
  }

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder="Введите имя"
        name="client-name-nofill"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        autoComplete="one-time-code"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        data-protonpass-ignore
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((c, i) => (
            <button
              key={`${c.name}-${i}`}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors cursor-pointer flex items-center justify-between"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(c);
                setOpen(false);
              }}
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface ClientCardData {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  managerName: string;
  branch: string;
  systemSlug?: string;
  systemName: string;
  subsystem: string;
  glass: string;
  shotlan: string;
  fullWidth: number;
  openWidth: number;
  height: number;
  doorWidth: number;
  totalPrice: number;
  components: CalcComponent[];
}

interface ClientCardFormProps {
  knownClients?: KnownClient[];
  initialData?: ClientCardData;
  onCreated?: (card: ClientCardData) => void;
  onCancel?: () => void;
}

export function ClientCardForm({ knownClients = [], initialData, onCreated, onCancel }: ClientCardFormProps) {
  const isEditing = !!initialData;

  // Resolve initial manager/system from initialData
  const initManagerId = initialData
    ? managers.find((m) => m.name === initialData.managerName)?.id ?? null
    : null;
  const initSystemSlug = initialData
    ? initialData.systemSlug
      ?? Object.entries(systemsData).find(([, s]) => s.name === initialData.systemName)?.[0]
      ?? null
    : null;

  // Step — if editing with result, start at result
  const [step, setStep] = useState<"info" | "config" | "result">(
    initialData?.components ? "result" : "info"
  );

  // Client info
  const [clientName, setClientName] = useState(initialData?.clientName ?? "");
  const [phoneDigits, setPhoneDigits] = useState(
    initialData ? extractPhoneDigits(initialData.clientPhone) : ""
  );
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress ?? "");

  const clientPhone = formatPhone(phoneDigits);

  // Manager info
  const [managerId, setManagerId] = useState<string | null>(initManagerId);
  const [branchAddress, setBranchAddress] = useState<string | null>(initialData?.branch ?? null);

  // Configuration
  const [systemSlug, setSystemSlug] = useState<string | null>(initSystemSlug);
  const [subsystemId, setSubsystemId] = useState<string | null>(initialData?.subsystem ?? null);
  const [glass, setGlass] = useState<string | null>(initialData?.glass ?? null);
  const [shotlan, setShotlan] = useState<string>(initialData?.shotlan ?? "Без шотланок");
  const [fullWidth, setFullWidth] = useState(initialData?.fullWidth ?? 0);
  const [openWidth, setOpenWidth] = useState(initialData?.openWidth ?? 0);
  const [height, setHeight] = useState(initialData?.height ?? 0);

  // Result
  const [result, setResult] = useState<{
    components: CalcComponent[];
    total: number;
    doorWidth: number;
  } | null>(
    initialData?.components
      ? { components: initialData.components, total: initialData.totalPrice, doorWidth: initialData.doorWidth }
      : null
  );

  // Variant data
  const [variantData, setVariantData] = useState<{ variantName: string; railImageUrl?: string | null; items: { title: string; description: string; iconUrl: string | null }[]; schemes?: { label: string; svgContent: string; ratioType?: string | null }[] } | null>(null);
  const [glassImageUrl, setGlassImageUrl] = useState<string | undefined>(undefined);

  // Load glass image when glass changes — convert to PNG for PDF compatibility
  useEffect(() => {
    if (!glass) { setGlassImageUrl(undefined); return; }
    fetch("/api/glass-types")
      .then((r) => r.ok ? r.json() : [])
      .then(async (types: Array<{ name: string; imageUrl?: string | null }>) => {
        const t = types.find((g) => g.name === glass);
        if (t?.imageUrl) {
          // Convert webp to PNG via canvas for @react-pdf compatibility
          try {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = t.imageUrl!;
            });
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              setGlassImageUrl(canvas.toDataURL("image/png"));
            }
          } catch {
            setGlassImageUrl(undefined);
          }
        } else {
          setGlassImageUrl(undefined);
        }
      })
      .catch(() => setGlassImageUrl(undefined));
  }, [glass]);

  const selectedManager = managers.find((m) => m.id === managerId);
  const system = systemSlug ? systemsData[systemSlug] : null;

  const canProceedToConfig = clientName.trim() && phoneDigits.length >= 9 && managerId && branchAddress;

  // Filter subsystems
  const availableSubsystems = useMemo(() => {
    if (!system) return [];
    const w = system.extraField ? openWidth : fullWidth;
    return Object.entries(system.subsystems)
      .filter(([, sub]) => w >= sub.min && w <= sub.max)
      .map(([key]) => key);
  }, [system, fullWidth, openWidth]);

  const effectiveSubsystem = useMemo(() => {
    if (subsystemId && availableSubsystems.includes(subsystemId)) return subsystemId;
    return null;
  }, [subsystemId, availableSubsystems]);

  // Load variant when subsystem changes
  useEffect(() => {
    const sub = effectiveSubsystem || subsystemId;
    if (!systemSlug || !sub) { setVariantData(null); return; }
    fetch("/api/variants")
      .then((r) => r.ok ? r.json() : [])
      .then((variants: Array<{ systemSlug: string; subsystemName: string; variantName: string; railImageUrl?: string | null; items: { title: string; description: string; iconUrl: string | null }[]; schemes?: { label: string; svgContent: string; ratioType?: string | null }[] }>) => {
        const v = variants.find((x) => x.systemSlug === systemSlug && x.subsystemName === sub);
        setVariantData(v ? { variantName: v.variantName, railImageUrl: v.railImageUrl, items: v.items, schemes: v.schemes } : null);
      })
      .catch(() => setVariantData(null));
  }, [systemSlug, effectiveSubsystem, subsystemId]);

  const filteredShotlanOptions = useMemo(() => {
    if (glass === "Рифленое") {
      return shotlanOptions.filter((o) => !hideWithRiffled.includes(o));
    }
    return [...shotlanOptions];
  }, [glass]);

  const canCalculate = !!(
    system && systemSlug && effectiveSubsystem && glass && shotlan &&
    fullWidth > 0 && height >= 1800 && height <= 3500
  );

  const [calculating, setCalculating] = useState(false);

  const handleCalculate = useCallback(async () => {
    if (!canCalculate || !systemSlug || !effectiveSubsystem || !system || !glass || !shotlan) return;
    const subsystemDef = system.subsystems[effectiveSubsystem];
    if (!subsystemDef) return;

    setCalculating(true);
    try {
      const res = await calculateWithDB(
        systemSlug, effectiveSubsystem, subsystemDef.params,
        fullWidth, openWidth, height, glass, shotlan
      );
      setResult(res);
      setStep("result");
    } finally {
      setCalculating(false);
    }
  }, [canCalculate, systemSlug, effectiveSubsystem, system, glass, shotlan, fullWidth, openWidth, height]);

  const systemEntries = Object.entries(systemsData);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { key: "info", label: "Данные клиента" },
          { key: "config", label: "Комплектация" },
          { key: "result", label: "Результат" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-border" />}
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                step === s.key
                  ? "bg-brand-700 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span>{i + 1}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Client & Manager info */}
      {step === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-brand-600" />
                <h3 className="font-display text-base font-semibold">Клиент</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Имя клиента</label>
                <NameCombobox
                  value={clientName}
                  onChange={setClientName}
                  knownClients={knownClients}
                  onSelect={(c) => {
                    setClientName(c.name);
                    setPhoneDigits(extractPhoneDigits(c.phone));
                    setClientAddress(c.address);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Телефон</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={clientPhone}
                    onChange={(e) => {
                      const digits = extractPhoneDigits(e.target.value);
                      setPhoneDigits(digits);
                    }}
                    onKeyDown={(e) => {
                      // Allow backspace to erase digits
                      if (e.key === "Backspace" && phoneDigits.length > 0) {
                        e.preventDefault();
                        setPhoneDigits(phoneDigits.slice(0, -1));
                      }
                    }}
                    className="pl-10"
                    name="client-phone-nofill"
                    autoComplete="one-time-code"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    data-protonpass-ignore
                  />
                </div>
                {phoneDigits.length > 0 && phoneDigits.length < 9 && (
                  <p className="text-[11px] text-muted-foreground">
                    {9 - phoneDigits.length} цифр осталось
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Адрес</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Адрес клиента"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="pl-10"
                    name="client-addr-nofill"
                    autoComplete="one-time-code"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    data-protonpass-ignore
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manager */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-brand-600" />
                <h3 className="font-display text-base font-semibold">Менеджер</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Выберите менеджера</label>
                <div className="grid gap-2">
                  {managers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setManagerId(m.id)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all cursor-pointer",
                        managerId === m.id
                          ? "bg-brand-50 border-brand-300 ring-1 ring-brand-200"
                          : "bg-card border-border hover:border-brand-200"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.phone}</p>
                      </div>
                      {managerId === m.id && (
                        <div className="w-5 h-5 rounded-full bg-brand-700 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Адрес филиала</label>
                <div className="grid gap-2">
                  {branches.map((addr) => (
                    <button
                      key={addr}
                      onClick={() => setBranchAddress(addr)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-left text-sm transition-all cursor-pointer",
                        branchAddress === addr
                          ? "bg-brand-50 border-brand-300 ring-1 ring-brand-200"
                          : "bg-card border-border hover:border-brand-200"
                      )}
                    >
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {addr}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="lg:col-span-2 flex items-center gap-3">
            {onCancel ? (
              <Button variant="ghost" size="lg" onClick={onCancel} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                К списку клиентов
              </Button>
            ) : (
              <Link href="/admin">
                <Button variant="ghost" size="lg" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Админ-панель
                </Button>
              </Link>
            )}
            <Button
              variant="premium"
              size="lg"
              disabled={!canProceedToConfig}
              onClick={() => setStep("config")}
              className="gap-2"
            >
              Далее — Комплектация
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Configuration */}
      {step === "config" && (
        <div className="space-y-6">
          {/* Client summary */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
              <span className="font-medium">{clientName}</span>
              <span className="text-muted-foreground">{clientPhone}</span>
              {clientAddress && <span className="text-muted-foreground">{clientAddress}</span>}
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">Менеджер: {selectedManager?.name}</span>
              <span className="text-muted-foreground">{branchAddress}</span>
            </CardContent>
          </Card>

          {/* System selection */}
          <Section title="Система">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {systemEntries.map(([slug, sys]) => (
                <button
                  key={slug}
                  onClick={() => {
                    if (systemSlug === slug) return;
                    setSystemSlug(slug);
                    setSubsystemId(null);
                    setGlass(null);
                    setShotlan("Без шотланок");
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
                <p className="text-xs text-destructive">Нет подсистем для указанной ширины.</p>
              )}

              <Section title="Стекло">
                <ChipGroup
                  options={[...glassOptions]}
                  value={glass}
                  onChange={(v) => { setGlass(v); setResult(null); }}
                />
              </Section>

              <Section title="Шотланки">
                <ChipGroup
                  options={filteredShotlanOptions}
                  value={shotlan}
                  onChange={(v) => { setShotlan(v); setResult(null); }}
                />
              </Section>
            </>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="lg" onClick={() => setStep("info")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
            <Button
              variant="premium"
              size="lg"
              onClick={handleCalculate}
              disabled={!canCalculate}
              className="gap-2"
            >
              <Calculator className="w-4 h-4" />
              Рассчитать
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result — Proposal Preview */}
      {step === "result" && result && system && (
        <div className="space-y-6">
          <ProposalPreview
            data={{
              clientName,
              clientPhone,
              clientAddress,
              managerName: selectedManager?.name || "",
              managerPhone: selectedManager?.phone,
              branchAddress: branchAddress || "",
              systemName: system.name,
              subsystem: effectiveSubsystem || "",
              fullWidth,
              openWidth: system.extraField ? openWidth : undefined,
              height,
              doorWidth: result.doorWidth,
              glass: glass || "",
              shotlan,
              glassImageUrl,
              components: result.components,
              totalPrice: result.total,
              variant: variantData,
            }}
          />

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="lg" onClick={() => setStep("config")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Изменить комплектацию
            </Button>
            <Button
              variant="premium"
              size="lg"
              onClick={() => {
                if (onCreated && system && effectiveSubsystem && result) {
                  onCreated({
                    clientName,
                    clientPhone,
                    clientAddress,
                    managerName: selectedManager?.name || "",
                    branch: branchAddress || "",
                    systemSlug: systemSlug || undefined,
                    systemName: system.name,
                    subsystem: effectiveSubsystem,
                    glass: glass || "",
                    shotlan,
                    fullWidth,
                    openWidth,
                    height,
                    doorWidth: result.doorWidth,
                    totalPrice: result.total,
                    components: result.components,
                  });
                }
              }}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Сохранить карточку
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
