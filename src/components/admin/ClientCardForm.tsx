"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import { systemsData, type SystemDef, type SubsystemParams } from "@/lib/calculations/systemsData";
import { type CalcComponent } from "@/lib/calculations/engine";
import { calculateWithDB } from "@/lib/calculations/calculateWithDB";
import { glassOptions, shotlanOptions, hideWithRiffled } from "@/lib/calculations/constants";
import {
  systemMedia,
  subsystemPosters,
  glassImages,
  shotlanImages,
} from "@/lib/calculations/media";
import PDFDownloadBtn from "@/components/pdf/PDFDownloadBtn";
import { ProposalPreview, type ProposalData } from "@/components/admin/ProposalPreview";
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Calculator,
  User,
  Phone,
  MapPin,
  UserCheck,
  X,
} from "lucide-react";

/* ─── Known client type ─── */
export interface KnownClient {
  name: string;
  phone: string;
  address: string;
}

/* ─── Demo data (replace with DB fetch when API is ready) ─── */

interface Manager {
  id: string;
  name: string;
  phone: string | null;
  role?: string;
}

/* Шоурум (филиал) компании — подгружается из /api/me/company. */
interface Showroom {
  name: string;
  address: string;
}

/* Источники «Откуда узнали о нас». needsDetail — нужно ли уточнить, кто
   порекомендовал (компания/человек). */
const REFERRAL_SOURCES: Array<{ value: string; needsDetail: boolean }> = [
  { value: "Instagram", needsDetail: false },
  { value: "По рекомендации другого клиента", needsDetail: true },
  { value: "Google ads", needsDetail: false },
  { value: "По рекомендации мебельщика", needsDetail: true },
  { value: "По рекомендации дизайнера", needsDetail: true },
  { value: "По рекомендации", needsDetail: true },
  { value: "Другое", needsDetail: true },
];

/* Тип элемента для VisualChipGroup. */
type VisualChipOption = {
  value: string;
  label: string;
  imageUrl?: string | null;
  /** Видео для инлайн-проигрывания в миниатюре (приоритетнее imageUrl). */
  videoUrl?: string | null;
};

/* ─── Visual chip selector — кнопка с миниатюрой + подписью ─── */
function VisualChipGroup({
  options,
  value,
  onChange,
  thumbClassName = "w-20 h-20",
  thumbObjectFit = "cover",
}: {
  options: VisualChipOption[];
  value: string | null;
  onChange: (v: string) => void;
  thumbClassName?: string;
  thumbObjectFit?: "cover" | "contain";
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "group relative flex flex-col items-center rounded-xl border-2 overflow-hidden transition-all cursor-pointer bg-card w-36 select-none",
              active
                ? "border-brand-700 ring-2 ring-brand-500/20 shadow-md"
                : "border-border hover:border-brand-400 hover:shadow-sm"
            )}
          >
            <div
              className={cn(
                "overflow-hidden bg-muted/30 flex items-center justify-center",
                thumbClassName
              )}
            >
              {opt.videoUrl ? (
                <video
                  src={opt.videoUrl}
                  poster={opt.imageUrl ?? undefined}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={cn(
                    "w-full h-full",
                    thumbObjectFit === "cover" ? "object-cover" : "object-contain p-1.5"
                  )}
                />
              ) : opt.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.imageUrl}
                  alt={opt.label}
                  className={cn(
                    "w-full h-full transition-transform",
                    thumbObjectFit === "cover" ? "object-cover" : "object-contain p-1.5",
                    !active && "group-hover:scale-105"
                  )}
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">нет превью</span>
              )}
            </div>
            <div
              className={cn(
                "w-full px-2.5 py-1.5 text-[11px] font-semibold leading-tight text-left break-words",
                active ? "bg-brand-700 text-white" : "bg-card text-foreground"
              )}
            >
              {opt.label}
            </div>
            {active && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-700 flex items-center justify-center text-white shadow-sm">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

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

/* ─── Number input WITH slider ─── */
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
  const sliderVal = value > 0 ? value : min;
  const progress = ((sliderVal - min) / Math.max(1, max - min)) * 100;
  return (
    <div className="flex-1 min-w-[200px] space-y-2">
      <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-muted-foreground/70 tabular-nums">
          {min}–{max} {suffix}
        </span>
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
      <div className="relative group/slider pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={sliderVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className="dimension-slider w-full"
        />
        <div className="pointer-events-none absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
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
// Раньше тут жили хелперы автоматического форматирования телефона с
// захардкоженным префиксом «+998». Теперь поле свободное — пользователь сам
// набирает код страны и номер в любом формате, который ему удобен.

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
  /** Телефон менеджера на момент создания карточки. */
  managerPhone?: string | null;
  branch: string;
  /** Откуда клиент узнал о нас (обязательное поле). */
  referralSource?: string;
  /** Кто порекомендовал — компания/человек (для вариантов «по рекомендации …» / «Другое»). */
  referralDetail?: string;
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
  customServices?: Array<{ name: string; description: string; price: number }>;
  /** Компания, к которой привязана карточка (заполняется бэкэндом по сессии создателя). */
  companyName?: string | null;
}

interface ClientCardFormProps {
  knownClients?: KnownClient[];
  initialData?: ClientCardData;
  onCreated?: (card: ClientCardData) => void;
  /**
   * «Тихое» сохранение карточки без навигации (отличается от onCreated тем,
   * что не закрывает форму). Используется при автосохранении на момент
   * скачивания PDF.
   */
  onSilentSave?: (card: ClientCardData) => Promise<void> | void;
  onCancel?: () => void;
}

export function ClientCardForm({ knownClients = [], initialData, onCreated, onSilentSave, onCancel }: ClientCardFormProps) {
  const isEditing = !!initialData;

  // Роль пользователя. Партнёр (PARTNER) может менять только доп. услуги —
  // комплектацию (систему/подсистему/стекло/шотланку) и цены компонентов в
  // превью КП ему редактировать нельзя. Админ/менеджер — могут.
  const { data: session } = useSession();
  const isPartner = session?.user?.role === "PARTNER";

  // Менеджеры: динамический список пользователей, привязанных к компании текущего
  // залогиненного юзера (через /api/me/colleagues). До завершения загрузки список
  // пуст; managerId сопоставляется с initialData.managerName ниже, в useEffect.
  const [managers, setManagers] = useState<Manager[]>([]);
  useEffect(() => {
    fetch("/api/me/colleagues")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Manager[]) => setManagers(rows))
      .catch(() => setManagers([]));
  }, []);

  // Филиалы (шоурумы) компании текущего пользователя. Показываются только
  // существующие и привязанные к его компании — список приходит из /api/me/company.
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  useEffect(() => {
    // no-store — иначе браузер может отдать устаревший ответ /api/me/company
    // (его же дёргают шапка и превью), и недавно добавленные филиалы не появятся.
    fetch("/api/me/company", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((company: { showrooms?: Showroom[] | null } | null) => {
        const list = Array.isArray(company?.showrooms) ? company!.showrooms : [];
        setShowrooms(list.filter((s) => s && (s.name || s.address)));
      })
      .catch(() => setShowrooms([]));
  }, []);

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
  // Телефон клиента — СВОБОДНОЕ поле. Раньше код страны был жёстко зашит
  // +998 и форматировался автоматически, но клиенты могут быть из других стран
  // (РФ +7, Казахстан +7, Кыргызстан +996 и т.д.) — поэтому пользователь сам
  // вбивает в формате, который ему нужен. В БД сохраняем как ввели.
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone ?? "");
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress ?? "");

  // «Откуда узнали о нас» (обязательное) + уточнение, кто порекомендовал.
  const [referralSource, setReferralSource] = useState(initialData?.referralSource ?? "");
  const [referralDetail, setReferralDetail] = useState(initialData?.referralDetail ?? "");
  const referralNeedsDetail = REFERRAL_SOURCES.find((s) => s.value === referralSource)?.needsDetail ?? false;

  // Кол-во цифр в телефоне для валидации (минимум 7 для международных).
  const phoneDigitsCount = clientPhone.replace(/\D/g, "").length;

  // Manager info: managerId синхронизируется с managers (фетч) + initialData.
  const [managerId, setManagerId] = useState<string | null>(null);
  const [branchAddress, setBranchAddress] = useState<string | null>(initialData?.branch ?? null);

  // Сопоставление managerId после загрузки списка менеджеров.
  // Если в initialData указано имя — пытаемся подобрать пользователя из компании
  // по совпадению имени. Если такого нет — оставляем managerId = null
  // (admin/partner выберет вручную из текущего списка).
  useEffect(() => {
    if (managers.length === 0) return;
    setManagerId((prev) => {
      if (prev && managers.some((m) => m.id === prev)) return prev;
      if (initialData?.managerName) {
        const match = managers.find((m) => m.name === initialData.managerName);
        if (match) return match.id;
      }
      return null;
    });
  }, [managers, initialData?.managerName]);

  // Configuration
  const [systemSlug, setSystemSlug] = useState<string | null>(initSystemSlug);
  const [subsystemId, setSubsystemId] = useState<string | null>(initialData?.subsystem ?? null);
  const [glass, setGlass] = useState<string | null>(initialData?.glass ?? null);
  const [shotlan, setShotlan] = useState<string>(initialData?.shotlan ?? "Без шотланок");
  const [fullWidth, setFullWidth] = useState(initialData?.fullWidth ?? 0);
  const [openWidth, setOpenWidth] = useState(initialData?.openWidth ?? 0);
  const [height, setHeight] = useState(initialData?.height ?? 0);

  // Custom services
  interface CustomService { name: string; description: string; price: number }
  const [customServices, setCustomServices] = useState<CustomService[]>(
    initialData?.customServices ?? [
      { name: "Боковая обшивка", description: "", price: 0 },
      { name: "Закладные", description: "", price: 0 },
    ]
  );

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

  // Определения систем, добавленных в БД, но отсутствующих в захардкоженном
  // systemsData (новые системы из /admin/systems). Заполняется fetch-эффектом
  // ниже. Без этого новые системы не появлялись в выборе при создании карточки.
  const [dbSystemDefs, setDbSystemDefs] = useState<Record<string, SystemDef>>({});
  // Активные имена подсистем по системе из БД. Нужно, чтобы в калькуляторе
  // не показывались легаси-подсистемы из захардкоженого systemsData, которых
  // в БД нет (админ удалил/не создавал). Ключ — slug системы.
  const [dbSubsystemNames, setDbSubsystemNames] = useState<Record<string, Set<string>> | null>(null);

  // Захардкоженные системы + новые из БД (DB-only). systemsData имеет приоритет
  // для известных систем (точные params для legacy-движка).
  const allSystemDefs = useMemo<Record<string, SystemDef>>(
    () => ({ ...systemsData, ...dbSystemDefs }),
    [dbSystemDefs],
  );

  const selectedManager = managers.find((m) => m.id === managerId);
  const system = systemSlug ? (allSystemDefs[systemSlug] ?? null) : null;

  const canProceedToConfig =
    clientName.trim() &&
    phoneDigitsCount >= 7 &&
    managerId &&
    branchAddress &&
    referralSource &&
    (!referralNeedsDetail || referralDetail.trim());

  // Filter subsystems.
  // 1) по ширине: подсистема показывается, только если ширина проёма попадает
  //    в её диапазон [min, max];
  // 2) по БД: если для системы пришёл список подсистем из БД — оставляем только
  //    те, что есть в БД (легаси-подсистемы из захардкоженого systemsData,
  //    которых админ не создавал, не должны попадать в выбор).
  //    Если список ещё не загружен (null) — показываем как раньше.
  const availableSubsystems = useMemo(() => {
    if (!system) return [];
    const w = system.extraField ? openWidth : fullWidth;
    const dbAllowed = systemSlug ? dbSubsystemNames?.[systemSlug] : undefined;
    return Object.entries(system.subsystems)
      .filter(([, sub]) => w >= sub.min && w <= sub.max)
      .filter(([key]) => (dbAllowed ? dbAllowed.has(key) : true))
      .map(([key]) => key);
  }, [system, fullWidth, openWidth, systemSlug, dbSubsystemNames]);

  const effectiveSubsystem = useMemo(() => {
    if (subsystemId && availableSubsystems.includes(subsystemId)) return subsystemId;
    return null;
  }, [subsystemId, availableSubsystems]);

  // Load variant when subsystem changes. If no variant exists for the chosen subsystem,
  // fall back to any variant of the same system (so admin can define visuals once and
  // they apply to every subsystem until individual ones are configured).
  useEffect(() => {
    const sub = effectiveSubsystem || subsystemId || initialData?.subsystem;
    const slug = systemSlug || initialData?.systemSlug;
    if (!slug || !sub) { setVariantData(null); return; }
    fetch("/api/variants")
      .then((r) => r.ok ? r.json() : [])
      .then((variants: Array<{ systemSlug: string; subsystemName: string; variantName: string; railImageUrl?: string | null; items: { title: string; description: string; iconUrl: string | null }[]; schemes?: { label: string; svgContent: string; ratioType?: string | null }[] }>) => {
        const exact = variants.find((x) => x.systemSlug === slug && x.subsystemName === sub);
        const fallback = exact || variants.find((x) => x.systemSlug === slug) || null;
        setVariantData(fallback ? { variantName: fallback.variantName, railImageUrl: fallback.railImageUrl, items: fallback.items, schemes: fallback.schemes } : null);
      })
      .catch(() => setVariantData(null));
  }, [systemSlug, effectiveSubsystem, subsystemId, initialData?.subsystem, initialData?.systemSlug]);

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

  // Авто-пересчёт на шаге «Результат». Когда из превью КП меняют
  // стекло/шотланку/подсистему/систему/размеры — пересчитываем цену и компоненты,
  // а зависимые эффекты подтягивают новую картинку стекла, вариант и чертежи.
  // Без этого правки в превью меняли бы только текст, не трогая формулы/цену.
  useEffect(() => {
    if (step !== "result" || !canCalculate) return;
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, glass, shotlan, effectiveSubsystem, systemSlug, fullWidth, openWidth, height]);

  // Применение правок из превью КП обратно в состояние формы. Пробрасываем только
  // калькуляционные поля (система/подсистема/стекло/шотланка) — текстовые поля
  // (клиент/менеджер/филиал) остаются локальными правками внутри превью.
  const handlePreviewChange = useCallback((d: ProposalData) => {
    if (d.glass !== glass) setGlass(d.glass);
    if (d.shotlan !== shotlan) setShotlan(d.shotlan);

    const newSlug = Object.entries(allSystemDefs).find(([, s]) => s.name === d.systemName)?.[0] ?? null;
    if (newSlug && newSlug !== systemSlug) {
      setSystemSlug(newSlug);
      // подсистема валидна только в рамках своей системы — сбрасываем чужую
      setSubsystemId(
        d.subsystem && allSystemDefs[newSlug]?.subsystems?.[d.subsystem] ? d.subsystem : null,
      );
    } else if (d.subsystem && d.subsystem !== (effectiveSubsystem || subsystemId)) {
      setSubsystemId(d.subsystem);
    }
  }, [glass, shotlan, systemSlug, effectiveSubsystem, subsystemId, allSystemDefs]);

  // Filter systems by what's actually present in DB + забираем видео/постер
  // систем И подсистем из БД (захардкоженные systemMedia/subsystemVideos пустые,
  // реальные URL — в DoorSystem и Subsystem).
  const [activeSlugs, setActiveSlugs] = useState<Set<string> | null>(null);
  const [dbSystemMedia, setDbSystemMedia] = useState<
    Record<string, { video: string | null; poster: string | null }>
  >({});
  // Карта медиа подсистем: dbSubsystemMedia[systemSlug][subsystemName] = { video, poster }
  const [dbSubsystemMedia, setDbSubsystemMedia] = useState<
    Record<string, Record<string, { video: string | null; poster: string | null }>>
  >({});
  useEffect(() => {
    fetch("/api/systems")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{
        slug: string;
        name: string;
        minWidth: number;
        maxWidth: number;
        maxFullWidth?: number | null;
        hasExtraField?: boolean;
        videoUrl?: string | null;
        posterUrl?: string | null;
        subsystems?: Array<{
          name: string;
          minWidth: number;
          maxWidth: number;
          params?: unknown;
          videoUrl?: string | null;
          posterUrl?: string | null;
        }>;
      }>) => {
        setActiveSlugs(new Set(rows.map((r) => r.slug)));
        const sysMap: Record<string, { video: string | null; poster: string | null }> = {};
        const subMap: Record<string, Record<string, { video: string | null; poster: string | null }>> = {};
        const subNames: Record<string, Set<string>> = {};
        const defs: Record<string, SystemDef> = {};
        rows.forEach((r) => {
          sysMap[r.slug] = { video: r.videoUrl ?? null, poster: r.posterUrl ?? null };
          subMap[r.slug] = {};
          subNames[r.slug] = new Set((r.subsystems ?? []).map((s) => s.name));
          (r.subsystems ?? []).forEach((sub) => {
            subMap[r.slug][sub.name] = { video: sub.videoUrl ?? null, poster: sub.posterUrl ?? null };
          });
          // Для систем, которых нет в захардкоженном systemsData, строим SystemDef
          // из данных БД, чтобы они появились в выборе и корректно фильтровались
          // по ширине. Расчёт идёт через /api/calculate (формулы из БД).
          if (!systemsData[r.slug]) {
            defs[r.slug] = {
              name: r.name,
              minWidth: r.minWidth,
              maxWidth: r.maxWidth,
              maxFullWidth: r.maxFullWidth ?? undefined,
              extraField: !!r.hasExtraField,
              subsystems: Object.fromEntries(
                (r.subsystems ?? []).map((sub) => [
                  sub.name,
                  {
                    min: sub.minWidth,
                    max: sub.maxWidth,
                    params: (sub.params && typeof sub.params === "object" ? sub.params : {}) as SubsystemParams,
                  },
                ]),
              ),
            };
          }
        });
        setDbSystemMedia(sysMap);
        setDbSubsystemMedia(subMap);
        setDbSubsystemNames(subNames);
        setDbSystemDefs(defs);
      })
      .catch(() => {
        setActiveSlugs(new Set());
        setDbSystemMedia({});
        setDbSubsystemMedia({});
        setDbSubsystemNames({});
        setDbSystemDefs({});
      });
  }, []);

  const systemEntries = useMemo(
    () =>
      Object.entries(allSystemDefs).filter(
        ([slug]) => !activeSlugs || activeSlugs.has(slug)
      ),
    [allSystemDefs, activeSlugs]
  );

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
                    setClientPhone(c.phone);
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
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+998 90 123-45-67"
                    className="pl-10"
                    name="client-phone-nofill"
                    autoComplete="one-time-code"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    data-protonpass-ignore
                  />
                </div>
                {phoneDigitsCount > 0 && phoneDigitsCount < 7 && (
                  <p className="text-[11px] text-muted-foreground">
                    Минимум 7 цифр (включая код страны)
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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Откуда узнали о нас <span className="text-destructive">*</span>
                </label>
                <select
                  value={referralSource}
                  onChange={(e) => {
                    setReferralSource(e.target.value);
                    // при смене источника на тот, что не требует уточнения — чистим деталь
                    const needs = REFERRAL_SOURCES.find((s) => s.value === e.target.value)?.needsDetail ?? false;
                    if (!needs) setReferralDetail("");
                  }}
                  className={cn(
                    "h-10 w-full rounded-md border bg-background px-3 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
                    referralSource ? "border-border" : "border-border text-muted-foreground",
                  )}
                >
                  <option value="" disabled>Выберите вариант…</option>
                  {REFERRAL_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.value}</option>
                  ))}
                </select>
                {referralNeedsDetail && (
                  <Input
                    placeholder="Кто порекомендовал (компания / человек)"
                    value={referralDetail}
                    onChange={(e) => setReferralDetail(e.target.value)}
                    autoComplete="one-time-code"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    data-protonpass-ignore
                  />
                )}
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
                {managers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3">
                    В вашей компании пока нет активных пользователей. Добавьте их в разделе{" "}
                    <Link href="/admin/users" className="underline hover:text-brand-600">«Пользователи»</Link>.
                  </p>
                ) : (
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
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Филиал / шоурум</label>
                {showrooms.length === 0 ? (
                  <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border px-4 py-3">
                    У компании пока нет филиалов. Добавьте их в разделе{" "}
                    <Link href="/admin/companies" className="text-brand-600 underline underline-offset-2">
                      Компании
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {showrooms.map((s, i) => {
                      const value = s.name && s.address
                        ? `${s.name} — ${s.address}`
                        : (s.name || s.address);
                      return (
                        <button
                          key={`${value}-${i}`}
                          onClick={() => setBranchAddress(value)}
                          className={cn(
                            "flex items-start gap-2 px-4 py-2.5 rounded-lg border text-left text-sm transition-all cursor-pointer",
                            branchAddress === value
                              ? "bg-brand-50 border-brand-300 ring-1 ring-brand-200"
                              : "bg-card border-border hover:border-brand-200"
                          )}
                        >
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="min-w-0">
                            {s.name && <span className="font-medium block">{s.name}</span>}
                            {s.address && <span className="text-muted-foreground block">{s.address}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {systemEntries.map(([slug, sys]) => {
                // Сначала медиа из БД (DoorSystem.videoUrl/posterUrl), затем
                // fallback на захардкоженный systemMedia.
                const dbMedia = dbSystemMedia[slug];
                const media = systemMedia[slug];
                const poster = dbMedia?.poster || media?.poster || "";
                const video = dbMedia?.video || media?.video || "";
                const active = systemSlug === slug;
                return (
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
                      "group flex flex-col rounded-lg border overflow-hidden transition-all cursor-pointer text-left select-none",
                      active
                        ? "border-brand-700 ring-2 ring-brand-500/30 shadow-sm"
                        : "border-border hover:border-brand-300 hover:shadow-sm"
                    )}
                  >
                    <div className="aspect-[4/3] bg-muted/40 overflow-hidden border-b border-border/50">
                      {video ? (
                        <video
                          src={video}
                          poster={poster ?? undefined}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={poster}
                          alt={sys.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          нет видео
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        "px-2.5 py-2 text-sm font-medium text-left leading-tight break-words",
                        active ? "bg-brand-700 text-white" : "bg-card text-foreground"
                      )}
                    >
                      {sys.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {system && (
            <>
              <Section title="Размеры">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <VisualChipGroup
                    options={availableSubsystems.map((sub) => {
                      const dbMedia = systemSlug ? dbSubsystemMedia[systemSlug]?.[sub] : null;
                      const poster = dbMedia?.poster || (systemSlug ? subsystemPosters[systemSlug]?.[sub] : null);
                      const video = dbMedia?.video || null;
                      return {
                        value: sub,
                        label: sub,
                        imageUrl: poster,
                        videoUrl: video,
                      };
                    })}
                    value={effectiveSubsystem}
                    onChange={(v) => { setSubsystemId(v); setResult(null); }}
                    thumbClassName="w-28 h-20"
                    thumbObjectFit="cover"
                  />
                </Section>
              )}
              {fullWidth > 0 && availableSubsystems.length === 0 && (
                <p className="text-xs text-destructive">Нет подсистем для указанной ширины.</p>
              )}

              <Section title="Стекло">
                <VisualChipGroup
                  options={glassOptions.map((g) => ({
                    value: g,
                    label: g,
                    imageUrl: glassImages[g],
                  }))}
                  value={glass}
                  onChange={(v) => { setGlass(v); setResult(null); }}
                  thumbClassName="w-24 h-24"
                  thumbObjectFit="cover"
                />
              </Section>

              <Section title="Шотланки">
                <VisualChipGroup
                  options={filteredShotlanOptions.map((s) => ({
                    value: s,
                    label: s,
                    imageUrl: shotlanImages[s],
                  }))}
                  value={shotlan}
                  onChange={(v) => { setShotlan(v); setResult(null); }}
                  thumbClassName="w-28 h-20"
                  thumbObjectFit="contain"
                />
              </Section>

              {/* Custom services */}
              <Section title="Дополнительные услуги">
                <div className="space-y-2">
                  {customServices.map((svc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={svc.name}
                        onChange={(e) => { const arr = [...customServices]; arr[i] = { ...arr[i], name: e.target.value }; setCustomServices(arr); }}
                        placeholder="Название"
                        className="h-8 px-2 text-xs rounded-md border border-border bg-background w-36 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                        autoComplete="one-time-code"
                      />
                      <input
                        value={svc.description}
                        onChange={(e) => { const arr = [...customServices]; arr[i] = { ...arr[i], description: e.target.value }; setCustomServices(arr); }}
                        placeholder="Описание"
                        className="h-8 px-2 text-xs rounded-md border border-border bg-background flex-1 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                        autoComplete="one-time-code"
                      />
                      <input
                        type="number"
                        value={svc.price || ""}
                        onChange={(e) => { const arr = [...customServices]; arr[i] = { ...arr[i], price: Number(e.target.value) }; setCustomServices(arr); }}
                        placeholder="Цена"
                        className="h-8 px-2 text-xs rounded-md border border-border bg-background w-20 text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                        step="0.01"
                      />
                      <span className="text-[10px] text-muted-foreground">у.е.</span>
                      <button
                        onClick={() => setCustomServices(customServices.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setCustomServices([...customServices, { name: "", description: "", price: 0 }])}
                    className="text-xs text-brand-600 hover:text-brand-700 cursor-pointer flex items-center gap-1"
                  >
                    <span>+</span> Добавить услугу
                  </button>
                </div>
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
      {step === "result" && result && system && (() => {
        // Сборщик payload-а карточки. Используется и при ручном сохранении, и при
        // автосохранении при скачивании PDF.
        // Имя/телефон менеджера: если в текущей компании выбран — берём оттуда,
        // иначе сохраняем то, что было сохранено в карточке (важно когда админ
        // открывает партнёрскую карточку и партнёрский менеджер отсутствует
        // в списке коллег админа).
        const effectiveManagerName = selectedManager?.name || initialData?.managerName || "";
        const effectiveManagerPhone =
          selectedManager?.phone ?? initialData?.managerPhone ?? null;

        const buildCardData = (): ClientCardData | null => {
          if (!system || !effectiveSubsystem || !result) return null;
          return {
            clientName,
            clientPhone,
            clientAddress,
            managerName: effectiveManagerName,
            managerPhone: effectiveManagerPhone,
            branch: branchAddress || "",
            referralSource,
            referralDetail: referralNeedsDetail ? referralDetail.trim() : "",
            systemSlug: systemSlug || initialData?.systemSlug || undefined,
            systemName: system.name,
            subsystem: effectiveSubsystem || subsystemId || initialData?.subsystem || "",
            glass: glass || initialData?.glass || "",
            shotlan: shotlan || initialData?.shotlan || "Без шотланок",
            fullWidth: fullWidth || initialData?.fullWidth || 0,
            openWidth: openWidth || initialData?.openWidth || 0,
            height: height || initialData?.height || 0,
            doorWidth: result.doorWidth,
            totalPrice: result.total,
            components: result.components,
            customServices: customServices.filter(s => s.name.trim() && (s.price > 0 || s.description?.trim())),
            companyName: initialData?.companyName ?? null,
          };
        };

        const handleBeforePdfDownload = async () => {
          const card = buildCardData();
          if (card && onSilentSave) {
            await onSilentSave(card);
          }
        };

        return (
        <div className="space-y-6">
          <ProposalPreview
            data={{
              clientName,
              clientPhone,
              clientAddress,
              managerName: effectiveManagerName,
              managerPhone: effectiveManagerPhone ?? undefined,
              branchAddress: branchAddress || "",
              systemName: system.name,
              subsystem: effectiveSubsystem || subsystemId || initialData?.subsystem || "",
              fullWidth,
              openWidth: system.extraField ? openWidth : undefined,
              height,
              doorWidth: result.doorWidth,
              glass: glass || initialData?.glass || "",
              shotlan,
              glassImageUrl,
              components: result.components,
              totalPrice: result.total,
              customServices: customServices.filter(s => s.name.trim() && (s.price > 0 || s.description?.trim())),
              variant: variantData,
              partnerCompanyName: initialData?.companyName ?? null,
            }}
            onDataChange={handlePreviewChange}
            canEditConfig={!isPartner}
            onBeforePdfDownload={handleBeforePdfDownload}
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
                    referralSource,
                    referralDetail: referralNeedsDetail ? referralDetail.trim() : "",
                    systemSlug: systemSlug || initialData?.systemSlug || undefined,
                    systemName: system.name,
                    subsystem: effectiveSubsystem || subsystemId || initialData?.subsystem || "",
                    glass: glass || initialData?.glass || "",
                    shotlan: shotlan || initialData?.shotlan || "Без шотланок",
                    fullWidth: fullWidth || initialData?.fullWidth || 0,
                    openWidth: openWidth || initialData?.openWidth || 0,
                    height: height || initialData?.height || 0,
                    doorWidth: result.doorWidth,
                    totalPrice: result.total,
                    components: result.components,
                    customServices: customServices.filter(s => s.name.trim() && (s.price > 0 || s.description?.trim())),
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
        );
      })()}

    </div>
  );
}
