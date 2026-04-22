"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  ChevronRight,
  Layers,
  GlassWater,
  Grid3X3,
} from "lucide-react";

/* ─── Types ─── */
interface Subsystem {
  id: string;
  name: string;
  minWidth: number;
  maxWidth: number;
  params: Record<string, unknown>;
  formulas?: Record<string, string> | null;
}

interface DoorSystem {
  id: string;
  slug: string;
  name: string;
  minWidth: number;
  maxWidth: number;
  maxFullWidth: number | null;
  hasExtraField: boolean;
  minHeight: number;
  maxHeight: number;
  subsystems: Subsystem[];
}

interface GlassType {
  id: string;
  name: string;
  defaultPrice: number;
  imageUrl?: string | null;
}

interface ShotlanOption {
  id: string;
  name: string;
  calcMethod: string;
  components?: Record<string, number> | null;
  formulas?: Record<string, string> | null;
}

type RightTab = "subsystems" | "glass";

/* ─── System data type for form ─── */
interface SystemFormData {
  name: string;
  slug: string;
  minWidth: number;
  maxWidth: number;
  maxFullWidth: number | null;
  hasExtraField: boolean;
  minHeight: number;
  maxHeight: number;
}

/* ─── Inline edit row for system ─── */
function SystemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: SystemFormData;
  onSave: (data: SystemFormData) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [hasExtra, setHasExtra] = useState(initial?.hasExtraField ?? false);
  const [minW, setMinW] = useState(initial?.minWidth ?? 600);
  const [maxW, setMaxW] = useState(initial?.maxWidth ?? 6000);
  const [maxFull, setMaxFull] = useState(initial?.maxFullWidth ?? 0);
  const [minH, setMinH] = useState(initial?.minHeight ?? 1800);
  const [maxH, setMaxH] = useState(initial?.maxHeight ?? 3500);

  return (
    <Card className="border-brand-200 bg-brand-50/30">
      <CardContent className="p-4 space-y-4">
        {/* Name + slug */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Название</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Каскадные двери" autoComplete="one-time-code" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Slug (URL)</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="cascade" autoComplete="one-time-code" />
          </div>
        </div>

        {/* Ширина проёма (открытая часть) */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Ширина проёма (открытая часть)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground">Мин. (мм)</label>
              <Input type="number" value={minW || ""} onChange={(e) => setMinW(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Макс. (мм)</label>
              <Input type="number" value={maxW || ""} onChange={(e) => setMaxW(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Ширина проёма (полностью) */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Ширина проёма (полностью)</p>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={hasExtra} onChange={(e) => setHasExtra(e.target.checked)} className="rounded border-border" />
              <span className="text-[11px] text-muted-foreground">Отдельное поле</span>
            </label>
          </div>
          {hasExtra && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground">Макс. полная ширина (мм)</label>
                <Input type="number" value={maxFull || ""} onChange={(e) => setMaxFull(Number(e.target.value))} />
              </div>
            </div>
          )}
          {!hasExtra && (
            <p className="text-[11px] text-muted-foreground">Совпадает с шириной открытой части</p>
          )}
        </div>

        {/* Высота проёма */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Высота проёма</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground">Мин. (мм)</label>
              <Input type="number" value={minH || ""} onChange={(e) => setMinH(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Макс. (мм)</label>
              <Input type="number" value={maxH || ""} onChange={(e) => setMaxH(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="premium" onClick={() => onSave({
            name, slug, minWidth: minW, maxWidth: maxW,
            maxFullWidth: hasExtra && maxFull > 0 ? maxFull : null,
            hasExtraField: hasExtra, minHeight: minH, maxHeight: maxH,
          })} disabled={!name.trim() || !slug.trim()} className="gap-1">
            <Check className="w-3.5 h-3.5" /> Сохранить
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1">
            <X className="w-3.5 h-3.5" /> Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Param definition type ─── */
interface ParamDef {
  id: string;
  key: string;
  label: string;
  category: string;
}

/* ─── Formula functions list ─── */
const FORMULA_FUNCTIONS = [
  { name: "ЕСЛИ", insert: "ЕСЛИ(", desc: "Условие: ЕСЛИ(условие; да; нет)" },
  { name: "ОКРУГЛВВЕРХ", insert: "ОКРУГЛВВЕРХ(", desc: "Округление вверх: ОКРУГЛВВЕРХ(число; разрядов)" },
  { name: "ОКРУГЛВНИЗ", insert: "ОКРУГЛВНИЗ(", desc: "Округление вниз: ОКРУГЛВНИЗ(число; разрядов)" },
  { name: "ОКРУГЛ", insert: "ОКРУГЛ(", desc: "Округление: ОКРУГЛ(число; разрядов)" },
  { name: "МАКС", insert: "МАКС(", desc: "Максимум: МАКС(а; б)" },
  { name: "МИН", insert: "МИН(", desc: "Минимум: МИН(а; б)" },
  { name: "ЦЕЛ", insert: "ЦЕЛ(", desc: "Целая часть: ЦЕЛ(число)" },
  { name: "ABS", insert: "ABS(", desc: "Модуль: ABS(число)" },
];

/* ─── Formula editor with @ params and # functions ─── */
function FormulaEditor({
  formula,
  onChange,
  allDefs,
}: {
  formula: string;
  onChange: (f: string) => void;
  allDefs: ParamDef[];
}) {
  const [pickerType, setPickerType] = useState<"param" | "func" | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPickerType(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function getTriggerQuery(value: string, cursor: number, char: string): string | null {
    const before = value.slice(0, cursor);
    const idx = before.lastIndexOf(char);
    if (idx === -1) return null;
    const between = before.slice(idx + 1);
    if (between.includes(" ") && between.includes(")")) return null;
    return between;
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    const cursor = e.target.selectionStart ?? val.length;
    const atQ = getTriggerQuery(val, cursor, "@");
    const hashQ = getTriggerQuery(val, cursor, "#");
    if (atQ !== null) { setPickerSearch(atQ); setPickerType("param"); }
    else if (hashQ !== null) { setPickerSearch(hashQ); setPickerType("func"); }
    else { setPickerType(null); }
  }

  function insertAt(text: string, triggerChar: string) {
    const el = inputRef.current;
    if (!el) { onChange(formula + text); setPickerType(null); return; }
    const cursor = el.selectionStart ?? formula.length;
    const idx = formula.lastIndexOf(triggerChar, cursor - 1);
    if (idx === -1) { onChange(formula + text); setPickerType(null); return; }
    const before = formula.slice(0, idx);
    const after = formula.slice(cursor);
    const next = before + text + after;
    onChange(next);
    setPickerType(null);
    setTimeout(() => { const pos = before.length + text.length; el.setSelectionRange(pos, pos); el.focus(); }, 0);
  }

  const filteredParams = allDefs.filter((d) =>
    !pickerSearch || d.label.toLowerCase().includes(pickerSearch.toLowerCase())
  );
  const filteredFuncs = FORMULA_FUNCTIONS.filter((f) =>
    !pickerSearch || f.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div ref={wrapRef} className="space-y-2">
      <div className="relative">
        <textarea
          ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
          value={formula}
          onChange={handleInput as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
          onKeyDown={(e) => { if (e.key === "Escape") setPickerType(null); }}
          placeholder="Введите формулу...&#10;@ — вставить параметр&#10;# — вставить функцию (ЕСЛИ, ОКРУГЛВВЕРХ...)"
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          autoComplete="off"
        />
        {pickerType === "param" && filteredParams.length > 0 && (
          <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto py-1">
            {filteredParams.map((d) => (
              <button key={d.key} className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors cursor-pointer" onMouseDown={(e) => { e.preventDefault(); insertAt(d.label + " ", "@"); }}>
                {d.label}
              </button>
            ))}
          </div>
        )}
        {pickerType === "func" && filteredFuncs.length > 0 && (
          <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto py-1">
            {filteredFuncs.map((f) => (
              <button key={f.name} className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors cursor-pointer" onMouseDown={(e) => { e.preventDefault(); insertAt(f.insert, "#"); }}>
                <span className="font-semibold text-foreground">{f.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">{f.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span><kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">@</kbd> вставить параметр</span>
        <span><kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">#</kbd> вставить функцию</span>
        <span>Операторы: <code className="font-mono">+ - * / ( ) {"<="} {">="} = ;</code></span>
      </div>
    </div>
  );
}

/* ─── Inline edit row for subsystem ─── */
function SubsystemForm({
  initial,
  onSave,
  onCancel,
  paramDefs,
}: {
  initial?: { name: string; minWidth: number; maxWidth: number; params: Record<string, unknown>; formulas?: Record<string, string> | null };
  onSave: (data: { name: string; minWidth: number; maxWidth: number; params: Record<string, number>; formulas: Record<string, string> }) => void;
  onCancel: () => void;
  paramDefs: ParamDef[];
}) {
  const paramLabels: Record<string, string> = {};
  paramDefs.forEach((d) => { paramLabels[d.key] = d.label; });
  const paramLabel = (key: string) => paramLabels[key] || key;

  const allDefs = paramDefs; // all definitions for formula picker

  const [name, setName] = useState(initial?.name ?? "");
  const [minW, setMinW] = useState(initial?.minWidth ?? 600);
  const [maxW, setMaxW] = useState(initial?.maxWidth ?? 6000);

  // Params as array of {key, value}
  const initialParams = initial?.params
    ? Object.entries(initial.params).map(([k, v]) => ({ key: k, value: Number(v) || 0 }))
    : [];
  const [params, setParams] = useState(initialParams);

  // Formulas as Record<string, string>
  const [formulas, setFormulas] = useState<Record<string, string>>(
    (initial?.formulas as Record<string, string>) ?? {}
  );

  // Which param is showing formula editor
  const [formulaOpenKey, setFormulaOpenKey] = useState<string | null>(null);

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState<number | "">("");
  const [paramSearch, setParamSearch] = useState("");
  const [paramDropdownOpen, setParamDropdownOpen] = useState(false);
  const paramDropdownRef = useRef<HTMLDivElement>(null);
  const newValueRef = useRef<HTMLInputElement>(null);

  const availableParams = paramDefs
    .filter((d) => d.category === "subsystem" && !params.some((p) => p.key === d.key))
    .filter((d) => !paramSearch || d.label.toLowerCase().includes(paramSearch.toLowerCase()));

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (paramDropdownRef.current && !paramDropdownRef.current.contains(e.target as Node)) setParamDropdownOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function addParam() {
    const trimmed = newKey.trim();
    if (!trimmed || params.some((p) => p.key === trimmed)) return;
    setParams([...params, { key: trimmed, value: Number(newValue) || 0 }]);
    setNewKey("");
    setNewValue("");
    setParamSearch("");
    setParamDropdownOpen(false);
  }

  function updateParamValue(index: number, value: number) {
    setParams(params.map((p, i) => i === index ? { ...p, value } : p));
  }

  function removeParam(index: number) {
    const key = params[index].key;
    setParams(params.filter((_, i) => i !== index));
    const f = { ...formulas };
    delete f[key];
    setFormulas(f);
    if (formulaOpenKey === key) setFormulaOpenKey(null);
  }

  function updateFormula(key: string, formula: string) {
    if (formula) {
      setFormulas({ ...formulas, [key]: formula });
    } else {
      const f = { ...formulas };
      delete f[key];
      setFormulas(f);
    }
  }

  function handleSave() {
    const paramsObj: Record<string, number> = {};
    params.forEach((p) => { paramsObj[p.key] = p.value; });
    onSave({ name, minWidth: minW, maxWidth: maxW, params: paramsObj, formulas });
  }

  return (
    <Card className="border-brand-200 bg-brand-50/30">
      <CardContent className="p-4 space-y-4">
        {/* Basic fields */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Название</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="1W+1W" autoComplete="one-time-code" />
          </div>
          <div className="w-28">
            <label className="text-xs text-muted-foreground">Мин. (мм)</label>
            <Input type="number" value={minW || ""} onChange={(e) => setMinW(Number(e.target.value))} />
          </div>
          <div className="w-28">
            <label className="text-xs text-muted-foreground">Макс. (мм)</label>
            <Input type="number" value={maxW || ""} onChange={(e) => setMaxW(Number(e.target.value))} />
          </div>
        </div>

        {/* Params editor */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Характеристики</p>

          {params.length > 0 && (
            <div className="space-y-2 mb-3">
              {params.map((p, i) => (
                <div key={p.key} className="rounded-lg border border-border/60 bg-background p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium flex-1 truncate" title={`${paramLabel(p.key)} (${p.key})`}>{paramLabel(p.key)}</span>
                    <Input
                      type="number"
                      value={p.value || ""}
                      onChange={(e) => updateParamValue(i, Number(e.target.value))}
                      className="w-20 h-7 text-xs"
                    />
                    <Button
                      variant={formulas[p.key] ? "default" : "outline"}
                      size="sm"
                      className={cn("h-7 text-[10px] px-2 shrink-0", formulas[p.key] && "bg-brand-600 text-white hover:bg-brand-700")}
                      onClick={() => setFormulaOpenKey(formulaOpenKey === p.key ? null : p.key)}
                    >
                      ƒx
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeParam(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Formula preview (collapsed) */}
                  {formulas[p.key] && formulaOpenKey !== p.key && (
                    <div className="mt-1.5 px-1">
                      <p className="text-[10px] font-mono text-brand-600 truncate">ƒ {formulas[p.key]}</p>
                    </div>
                  )}

                  {/* Formula editor (expanded) */}
                  {formulaOpenKey === p.key && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <FormulaEditor
                        formula={formulas[p.key] || ""}
                        onChange={(f) => updateFormula(p.key, f)}
                        allDefs={allDefs}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new param with search + value */}
          <div ref={paramDropdownRef} className="relative">
            <div className="flex items-center gap-2">
              <Input
                value={paramSearch}
                onChange={(e) => { setParamSearch(e.target.value); setParamDropdownOpen(true); setNewKey(""); }}
                onFocus={() => setParamDropdownOpen(true)}
                placeholder="Поиск характеристики..."
                className="h-8 text-xs flex-1"
                autoComplete="one-time-code"
              />
              <Input
                ref={newValueRef}
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value === "" ? "" : Number(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Enter" && newKey.trim()) { e.preventDefault(); addParam(); } }}
                placeholder="Кол-во"
                className="w-20 h-8 text-xs shrink-0"
                disabled={!newKey.trim()}
              />
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs shrink-0" onClick={addParam} disabled={!newKey.trim()}>
                <Plus className="w-3 h-3" /> Добавить
              </Button>
            </div>
            {paramDropdownOpen && availableParams.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-32 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto py-1">
                {availableParams.map((d) => (
                  <button
                    key={d.key}
                    className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-brand-50 transition-colors cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setNewKey(d.key);
                      setParamSearch(d.label);
                      setParamDropdownOpen(false);
                      setTimeout(() => newValueRef.current?.focus(), 0);
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            {paramDropdownOpen && availableParams.length === 0 && paramSearch && (
              <div className="absolute z-50 top-full left-0 right-32 mt-1 bg-card border border-border rounded-xl shadow-xl px-4 py-3">
                <p className="text-xs text-muted-foreground">Не найдено</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="premium" onClick={handleSave} disabled={!name.trim()} className="gap-1">
            <Check className="w-3.5 h-3.5" /> Сохранить
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1">
            <X className="w-3.5 h-3.5" /> Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Inline form for glass ─── */
function GlassForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; defaultPrice: number; imageUrl?: string | null };
  onSave: (data: { name: string; defaultPrice: number; imageUrl?: string | null }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.defaultPrice ?? 0);
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) { const d = await res.json(); setImageUrl(d.url); }
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (
    <div className="p-3 rounded-lg bg-brand-50/40 border border-brand-200 space-y-2">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Название</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Обычное" autoComplete="one-time-code" />
        </div>
        <div className="w-32">
          <label className="text-xs text-muted-foreground">Цена (у.е.)</label>
          <Input type="number" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover border border-border" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border text-[9px] text-muted-foreground">Фото</div>
        )}
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : imageUrl ? "Заменить" : "Загрузить фото"}
        </Button>
        {imageUrl && <button onClick={() => setImageUrl(null)} className="text-[9px] text-muted-foreground hover:text-destructive cursor-pointer">Удалить</button>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="premium" onClick={() => onSave({ name, defaultPrice: price, imageUrl })} disabled={!name.trim()} className="gap-1 shrink-0">
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="shrink-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Inline form for shotlan ─── */
function ShotlanForm({
  initial,
  onSave,
  onCancel,
  paramDefs,
}: {
  initial?: { name: string; calcMethod: string; components?: Record<string, number> | null; formulas?: Record<string, string> | null };
  onSave: (data: { name: string; calcMethod: string; components: Record<string, number>; formulas: Record<string, string> }) => void;
  onCancel: () => void;
  paramDefs: ParamDef[];
}) {
  const shotlanDefs = paramDefs.filter((d) => d.category === "shotlan");
  const paramLabels: Record<string, string> = {};
  shotlanDefs.forEach((d) => { paramLabels[d.key] = d.label; });

  const [name, setName] = useState(initial?.name ?? "");
  const [method, setMethod] = useState(initial?.calcMethod ?? "none");

  const initialComps = initial?.components
    ? Object.entries(initial.components).map(([k, v]) => ({ key: k, price: Number(v) || 0 }))
    : shotlanDefs.map((d) => ({ key: d.key, price: 0 }));
  const [comps, setComps] = useState(initialComps);

  const [formulas, setFormulas] = useState<Record<string, string>>(
    (initial?.formulas as Record<string, string>) ?? {}
  );
  const [formulaOpenKey, setFormulaOpenKey] = useState<string | null>(null);

  function updatePrice(index: number, price: number) {
    setComps(comps.map((c, i) => i === index ? { ...c, price } : c));
  }

  function addComp(key: string) {
    if (comps.some((c) => c.key === key)) return;
    setComps([...comps, { key, price: 0 }]);
  }

  function removeComp(index: number) {
    const key = comps[index].key;
    setComps(comps.filter((_, i) => i !== index));
    const f = { ...formulas };
    delete f[key];
    setFormulas(f);
    if (formulaOpenKey === key) setFormulaOpenKey(null);
  }

  function updateFormula(key: string, formula: string) {
    if (formula) {
      setFormulas({ ...formulas, [key]: formula });
    } else {
      const f = { ...formulas };
      delete f[key];
      setFormulas(f);
    }
  }

  function handleSave() {
    const obj: Record<string, number> = {};
    comps.forEach((c) => { obj[c.key] = c.price; });
    onSave({ name, calcMethod: method, components: obj, formulas });
  }

  const unusedDefs = shotlanDefs.filter((d) => !comps.some((c) => c.key === d.key));

  return (
    <Card className="border-brand-200 bg-brand-50/30">
      <CardContent className="p-4 space-y-4">
        {/* Basic fields */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Название</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Без шотланок" autoComplete="one-time-code" />
          </div>
          <div className="w-36">
            <label className="text-xs text-muted-foreground">Метод расчёта</label>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="none" autoComplete="one-time-code" />
          </div>
        </div>

        {/* Components with prices + formulas */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Компоненты и цены</p>
          {comps.length > 0 && (
            <div className="space-y-2 mb-3">
              {comps.map((c, i) => (
                <div key={c.key} className="rounded-lg border border-border/60 bg-background p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium flex-1 truncate">{paramLabels[c.key] || c.key}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={c.price || ""}
                        onChange={(e) => updatePrice(i, Number(e.target.value))}
                        className="w-20 h-7 text-xs"
                        step="0.01"
                      />
                      <span className="text-[10px] text-muted-foreground">у.е.</span>
                    </div>
                    <Button
                      variant={formulas[c.key] ? "default" : "outline"}
                      size="sm"
                      className={cn("h-7 text-[10px] px-2 shrink-0", formulas[c.key] && "bg-brand-600 text-white hover:bg-brand-700")}
                      onClick={() => setFormulaOpenKey(formulaOpenKey === c.key ? null : c.key)}
                    >
                      ƒx
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeComp(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {formulas[c.key] && formulaOpenKey !== c.key && (
                    <div className="mt-1.5 px-1">
                      <p className="text-[10px] font-mono text-brand-600 truncate">ƒ {formulas[c.key]}</p>
                    </div>
                  )}

                  {formulaOpenKey === c.key && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <FormulaEditor
                        formula={formulas[c.key] || ""}
                        onChange={(f) => updateFormula(c.key, f)}
                        allDefs={paramDefs}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {unusedDefs.length > 0 && (
            <select
              onChange={(e) => { if (e.target.value) { addComp(e.target.value); e.target.value = ""; } }}
              className="h-8 text-xs w-full rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">Добавить компонент...</option>
              {unusedDefs.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="premium" onClick={handleSave} disabled={!name.trim()} className="gap-1">
            <Check className="w-3.5 h-3.5" /> Сохранить
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1">
            <X className="w-3.5 h-3.5" /> Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main page ─── */
export default function SystemsPage() {
  const [systems, setSystems] = useState<DoorSystem[]>([]);
  const [paramDefs, setParamDefs] = useState<ParamDef[]>([]);
  const [glassTypes, setGlassTypes] = useState<GlassType[]>([]);
  const [shotlanOptions, setShotlanOptions] = useState<ShotlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("subsystems");

  // System CRUD state
  const [addingSystem, setAddingSystem] = useState(false);
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Subsystem CRUD state
  const [addingSub, setAddingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  // Glass CRUD state
  const [addingGlass, setAddingGlass] = useState(false);
  const [editingGlassId, setEditingGlassId] = useState<string | null>(null);
  const [deletingGlassId, setDeletingGlassId] = useState<string | null>(null);

  // Shotlan CRUD state
  const [addingShotlan, setAddingShotlan] = useState(false);
  const [editingShotlanId, setEditingShotlanId] = useState<string | null>(null);
  const [deletingShotlanId, setDeletingShotlanId] = useState<string | null>(null);

  const selectedSystem = systems.find((s) => s.id === selectedId);

  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/systems");
      if (res.ok) setSystems(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchParamDefs = useCallback(async () => {
    try {
      const res = await fetch("/api/param-definitions");
      if (res.ok) setParamDefs(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchGlass = useCallback(async () => {
    try {
      const res = await fetch("/api/glass-types");
      if (res.ok) setGlassTypes(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchShotlan = useCallback(async () => {
    try {
      const res = await fetch("/api/shotlan-options");
      if (res.ok) setShotlanOptions(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSystems(); fetchParamDefs(); fetchGlass(); fetchShotlan(); }, [fetchSystems, fetchParamDefs, fetchGlass, fetchShotlan]);

  /* ── System handlers ── */
  async function handleCreateSystem(data: SystemFormData) {
    await fetch("/api/systems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setAddingSystem(false);
    await fetchSystems();
  }

  async function handleUpdateSystem(id: string, data: SystemFormData) {
    await fetch("/api/systems", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    setEditingSystemId(null);
    await fetchSystems();
  }

  async function handleDeleteSystem(id: string) {
    setDeletingId(id);
    await fetch(`/api/systems?id=${id}`, { method: "DELETE" });
    if (selectedId === id) setSelectedId(null);
    setDeletingId(null);
    await fetchSystems();
  }

  /* ── Subsystem handlers ── */
  async function handleCreateSub(data: { name: string; minWidth: number; maxWidth: number; params: Record<string, number>; formulas: Record<string, string> }) {
    if (!selectedId) return;
    await fetch("/api/subsystems", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemId: selectedId, ...data }) });
    setAddingSub(false);
    await fetchSystems();
  }

  async function handleUpdateSub(id: string, data: { name: string; minWidth: number; maxWidth: number; params: Record<string, number>; formulas: Record<string, string> }) {
    await fetch("/api/subsystems", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    setEditingSubId(null);
    await fetchSystems();
  }

  async function handleDeleteSub(id: string) {
    if (!confirm("Удалить подсистему? Будут также удалены все её формулы расчёта и визуальные варианты.")) return;
    setDeletingSubId(id);
    await fetch(`/api/subsystems?id=${id}`, { method: "DELETE" });
    setDeletingSubId(null);
    await fetchSystems();
  }

  /* ── Glass handlers ── */
  async function handleCreateGlass(data: { name: string; defaultPrice: number; imageUrl?: string | null }) {
    await fetch("/api/glass-types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setAddingGlass(false);
    await fetchGlass();
  }
  async function handleUpdateGlass(id: string, data: { name: string; defaultPrice: number; imageUrl?: string | null }) {
    await fetch("/api/glass-types", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    setEditingGlassId(null);
    await fetchGlass();
  }
  async function handleDeleteGlass(id: string) {
    setDeletingGlassId(id);
    await fetch(`/api/glass-types?id=${id}`, { method: "DELETE" });
    setDeletingGlassId(null);
    await fetchGlass();
  }

  /* ── Shotlan handlers ── */
  async function handleCreateShotlan(data: { name: string; calcMethod: string; components: Record<string, number>; formulas: Record<string, string> }) {
    await fetch("/api/shotlan-options", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setAddingShotlan(false);
    await fetchShotlan();
  }
  async function handleUpdateShotlan(id: string, data: { name: string; calcMethod: string; components: Record<string, number>; formulas: Record<string, string> }) {
    await fetch("/api/shotlan-options", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    setEditingShotlanId(null);
    await fetchShotlan();
  }
  async function handleDeleteShotlan(id: string) {
    setDeletingShotlanId(id);
    await fetch(`/api/shotlan-options?id=${id}`, { method: "DELETE" });
    setDeletingShotlanId(null);
    await fetchShotlan();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-brand-600">Админ-панель</span>
        </div>
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">

          {/* ── Left: Systems list ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-display text-xl font-bold">Системы</h1>
              <Button size="sm" variant="premium" onClick={() => { setAddingSystem(true); setEditingSystemId(null); }} className="gap-1">
                <Plus className="w-3.5 h-3.5" /> Добавить
              </Button>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              </div>
            )}

            <div className="space-y-2">
              {addingSystem && (
                <SystemForm onSave={handleCreateSystem} onCancel={() => setAddingSystem(false)} />
              )}

              {systems.map((sys) =>
                editingSystemId === sys.id ? (
                  <SystemForm
                    key={sys.id}
                    initial={sys}
                    onSave={(data) => handleUpdateSystem(sys.id, data)}
                    onCancel={() => setEditingSystemId(null)}
                  />
                ) : (
                  <Card
                    key={sys.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedId === sys.id
                        ? "border-brand-400 bg-brand-50/40 shadow-sm"
                        : "hover:border-brand-200"
                    )}
                    onClick={() => { setSelectedId(sys.id); setAddingSub(false); setEditingSubId(null); }}
                  >
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                          selectedId === sys.id ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600"
                        )}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{sys.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {sys.subsystems.length} подсистем
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-600"
                          onClick={(e) => { e.stopPropagation(); setEditingSystemId(sys.id); setAddingSystem(false); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === sys.id}
                          onClick={(e) => { e.stopPropagation(); handleDeleteSystem(sys.id); }}
                        >
                          {deletingId === sys.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                        <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", selectedId === sys.id && "rotate-90")} />
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              {!loading && systems.length === 0 && !addingSystem && (
                <p className="text-sm text-muted-foreground text-center py-8">Нет систем</p>
              )}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div>
            {selectedSystem ? (
              <>
                <h2 className="font-display text-lg font-bold mb-1">{selectedSystem.name}</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Ширина: {selectedSystem.minWidth}–{selectedSystem.maxWidth} мм
                  {selectedSystem.maxFullWidth ? ` (полная до ${selectedSystem.maxFullWidth})` : ""}
                  {" "}&middot; Высота: {selectedSystem.minHeight}–{selectedSystem.maxHeight} мм
                </p>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 border-b border-border">
                  {([
                    { key: "subsystems" as RightTab, label: "Подсистемы", icon: Layers },
                    { key: "glass" as RightTab, label: "Стекла", icon: GlassWater },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => { setRightTab(tab.key); setAddingSub(false); setAddingGlass(false); setAddingShotlan(false); }}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors -mb-px border-b-2 cursor-pointer",
                        rightTab === tab.key
                          ? "border-brand-600 text-brand-700"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab: Подсистемы ── */}
                {rightTab === "subsystems" && (
                  <div className="space-y-2">
                    <div className="flex justify-end mb-2">
                      <Button size="sm" variant="premium" onClick={() => { setAddingSub(true); setEditingSubId(null); }} className="gap-1">
                        <Plus className="w-3.5 h-3.5" /> Добавить
                      </Button>
                    </div>
                    {addingSub && <SubsystemForm paramDefs={paramDefs} onSave={handleCreateSub} onCancel={() => setAddingSub(false)} />}
                    {selectedSystem.subsystems.map((sub) =>
                      editingSubId === sub.id ? (
                        <SubsystemForm key={sub.id} paramDefs={paramDefs} initial={sub} onSave={(data) => handleUpdateSub(sub.id, data)} onCancel={() => setEditingSubId(null)} />
                      ) : (
                        <Card key={sub.id} className="hover:border-brand-200 transition-colors">
                          <CardContent className="p-3.5 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold">{sub.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {sub.minWidth}–{sub.maxWidth} мм &middot; {Object.keys(sub.params || {}).length} характеристик
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingSubId(sub.id); setAddingSub(false); }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" disabled={deletingSubId === sub.id} onClick={() => handleDeleteSub(sub.id)}>
                                {deletingSubId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                    {selectedSystem.subsystems.length === 0 && !addingSub && (
                      <p className="text-sm text-muted-foreground text-center py-8">Подсистем пока нет</p>
                    )}
                  </div>
                )}

                {/* ── Tab: Стекла ── */}
                {rightTab === "glass" && (
                  <div className="space-y-2">
                    <div className="flex justify-end mb-2">
                      <Button size="sm" variant="premium" onClick={() => { setAddingGlass(true); setEditingGlassId(null); }} className="gap-1">
                        <Plus className="w-3.5 h-3.5" /> Добавить
                      </Button>
                    </div>
                    {addingGlass && <GlassForm onSave={handleCreateGlass} onCancel={() => setAddingGlass(false)} />}
                    {glassTypes.map((g) =>
                      editingGlassId === g.id ? (
                        <GlassForm key={g.id} initial={g} onSave={(data) => handleUpdateGlass(g.id, data)} onCancel={() => setEditingGlassId(null)} />
                      ) : (
                        <Card key={g.id} className="hover:border-brand-200 transition-colors">
                          <CardContent className="p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {g.imageUrl ? (
                                <img src={g.imageUrl} alt="" className="w-10 h-10 rounded object-cover border border-border shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted border border-dashed border-border shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-semibold">{g.name}</p>
                                <p className="text-[11px] text-muted-foreground">{g.defaultPrice} у.е.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingGlassId(g.id); setAddingGlass(false); }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" disabled={deletingGlassId === g.id} onClick={() => handleDeleteGlass(g.id)}>
                                {deletingGlassId === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                    {glassTypes.length === 0 && !addingGlass && (
                      <p className="text-sm text-muted-foreground text-center py-8">Стёкол пока нет</p>
                    )}
                  </div>
                )}

              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Выберите систему слева</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
