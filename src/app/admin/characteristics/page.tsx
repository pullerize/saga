"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Search,
  Tag,
  Layers,
  Grid3X3,
  Settings2,
} from "lucide-react";

interface ParamDef {
  id: string;
  key: string;
  label: string;
  category: string;
  price?: number | null;
  formula?: string | null;
}

type Tab = "general" | "subsystem" | "shotlan";

const TABS: { key: Tab; label: string; icon: typeof Tag }[] = [
  { key: "subsystem", label: "Подсистемы", icon: Layers },
  { key: "general", label: "Общие", icon: Settings2 },
  { key: "shotlan", label: "Шотланки", icon: Grid3X3 },
];

/* ─── Transliterate Russian → snake_case key ─── */
const TRANSLIT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
  х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
};

function toSnakeKey(label: string): string {
  return label
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/* ─── Param form ─── */
/* ─── Formula functions list ─── */
const FORMULA_FUNCTIONS = [
  { name: "ЕСЛИ", insert: "ЕСЛИ(", desc: "ЕСЛИ(условие; да; нет)" },
  { name: "ОКРУГЛВВЕРХ", insert: "ОКРУГЛВВЕРХ(", desc: "ОКРУГЛВВЕРХ(число; разрядов)" },
  { name: "ОКРУГЛВНИЗ", insert: "ОКРУГЛВНИЗ(", desc: "ОКРУГЛВНИЗ(число; разрядов)" },
  { name: "ОКРУГЛ", insert: "ОКРУГЛ(", desc: "ОКРУГЛ(число; разрядов)" },
  { name: "МАКС", insert: "МАКС(", desc: "МАКС(а; б)" },
  { name: "МИН", insert: "МИН(", desc: "МИН(а; б)" },
  { name: "ЦЕЛ", insert: "ЦЕЛ(", desc: "ЦЕЛ(число)" },
  { name: "ABS", insert: "ABS(", desc: "ABS(число)" },
];

/* ─── Formula editor with @ params and # functions ─── */
function MiniFormulaEditor({
  formula,
  onChange,
  allItems,
}: {
  formula: string;
  onChange: (f: string) => void;
  allItems: ParamDef[];
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

  const filteredParams = allItems.filter((d) =>
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
          placeholder={"Введите формулу...\n@ — вставить параметр\n# — вставить функцию (ЕСЛИ, ОКРУГЛВВЕРХ...)"}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          autoComplete="off"
        />
        {pickerType === "param" && filteredParams.length > 0 && (
          <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto py-1">
            {filteredParams.map((d) => (
              <button key={d.key} className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 cursor-pointer" onMouseDown={(e) => { e.preventDefault(); insertAt(d.label + " ", "@"); }}>
                {d.label}
              </button>
            ))}
          </div>
        )}
        {pickerType === "func" && filteredFuncs.length > 0 && (
          <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto py-1">
            {filteredFuncs.map((f) => (
              <button key={f.name} className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 cursor-pointer" onMouseDown={(e) => { e.preventDefault(); insertAt(f.insert, "#"); }}>
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

/* ─── Param form ─── */
function ParamForm({
  initial,
  category,
  allItems,
  onSave,
  onCancel,
}: {
  initial?: ParamDef;
  category: Tab;
  allItems: ParamDef[];
  onSave: (data: { key: string; label: string; category: string; price?: number | null; formula?: string | null }) => void;
  onCancel: () => void;
}) {
  const [key, setKey] = useState(initial?.key ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [keyTouched, setKeyTouched] = useState(false);
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [formula, setFormula] = useState(initial?.formula ?? "");
  const [showFormula, setShowFormula] = useState(!!initial?.formula);
  const isEdit = !!initial;
  const isShotlan = category === "shotlan";

  function handleLabelChange(val: string) {
    setLabel(val);
    if (!isEdit && !keyTouched) {
      setKey(toSnakeKey(val));
    }
  }

  return (
    <Card className="border-brand-200 bg-brand-50/30">
      <CardContent className="p-4 space-y-3">
        {/* Name + Key */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Название</label>
            <Input value={label} onChange={(e) => handleLabelChange(e.target.value)} placeholder="Профиль-разделитель" autoComplete="one-time-code" />
          </div>
          <div className="w-48">
            <label className="text-xs text-muted-foreground">Ключ</label>
            <Input
              value={key}
              onChange={(e) => { setKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, "")); setKeyTouched(true); }}
              placeholder="divider_profile"
              disabled={isEdit}
              autoComplete="one-time-code"
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* Price + Formula (only for shotlan) */}
        {isShotlan && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-32">
                <label className="text-xs text-muted-foreground">Цена (у.е.)</label>
                <Input type="number" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} step="0.01" className="h-8 text-xs" />
              </div>
              <Button
                type="button"
                variant={showFormula ? "default" : "outline"}
                size="sm"
                className={cn("h-8 text-xs px-3 mt-5", showFormula && "bg-brand-600 text-white hover:bg-brand-700")}
                onClick={() => setShowFormula(!showFormula)}
              >
                ƒx Формула
              </Button>
            </div>
            {showFormula && (
              <MiniFormulaEditor formula={formula} onChange={setFormula} allItems={allItems} />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="premium" onClick={() => onSave({
            key, label, category,
            price: isShotlan ? price || null : null,
            formula: isShotlan && formula ? formula : null,
          })} disabled={!key.trim() || !label.trim()} className="gap-1">
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

/* ─── Shotlan option type ─── */
interface ShotlanOpt {
  id: string;
  name: string;
  calcMethod: string;
  components?: Record<string, number> | null;
  formulas?: Record<string, string> | null;
}

/* ─── Shotlan option form ─── */
function ShotlanOptionForm({
  initial,
  allItems,
  onSave,
  onCancel,
}: {
  initial?: ShotlanOpt;
  allItems: ParamDef[];
  onSave: (data: { name: string; calcMethod: string; components: Record<string, number>; formulas: Record<string, string> }) => void;
  onCancel: () => void;
}) {
  const shotlanDefs = allItems.filter((d) => d.category === "shotlan");
  const paramLabels: Record<string, string> = {};
  shotlanDefs.forEach((d) => { paramLabels[d.key] = d.label; });

  const [name, setName] = useState(initial?.name ?? "");
  const [method, setMethod] = useState(initial?.calcMethod ?? "none");

  const initialComps = initial?.components
    ? Object.entries(initial.components).map(([k, v]) => ({ key: k, price: Number(v) || 0 }))
    : [];
  const [comps, setComps] = useState(initialComps);

  const [formulas, setFormulas] = useState<Record<string, string>>(
    (initial?.formulas as Record<string, string>) ?? {}
  );
  const [formulaOpenKey, setFormulaOpenKey] = useState<string | null>(null);

  function updatePrice(i: number, price: number) {
    setComps(comps.map((c, idx) => idx === i ? { ...c, price } : c));
  }
  function addComp(key: string) {
    if (comps.some((c) => c.key === key)) return;
    setComps([...comps, { key, price: 0 }]);
  }
  function removeComp(i: number) {
    const key = comps[i].key;
    setComps(comps.filter((_, idx) => idx !== i));
    const f = { ...formulas }; delete f[key]; setFormulas(f);
    if (formulaOpenKey === key) setFormulaOpenKey(null);
  }
  function updateFormula(key: string, formula: string) {
    if (formula) { setFormulas({ ...formulas, [key]: formula }); }
    else { const f = { ...formulas }; delete f[key]; setFormulas(f); }
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
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Название</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="1шт по горизонтали" autoComplete="one-time-code" />
          </div>
          <div className="w-36">
            <label className="text-xs text-muted-foreground">Метод расчёта</label>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="none" autoComplete="one-time-code" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Компоненты</p>
          {comps.length > 0 && (
            <div className="space-y-2 mb-3">
              {comps.map((c, i) => (
                <div key={c.key} className="rounded-lg border border-border/60 bg-background p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium flex-1 truncate">{paramLabels[c.key] || c.key}</span>
                    <div className="flex items-center gap-1">
                      <Input type="number" value={c.price || ""} onChange={(e) => updatePrice(i, Number(e.target.value))} className="w-20 h-7 text-xs" step="0.01" />
                      <span className="text-[10px] text-muted-foreground">у.е.</span>
                    </div>
                    <Button
                      variant={formulas[c.key] ? "default" : "outline"} size="sm"
                      className={cn("h-7 text-[10px] px-2 shrink-0", formulas[c.key] && "bg-brand-600 text-white hover:bg-brand-700")}
                      onClick={() => setFormulaOpenKey(formulaOpenKey === c.key ? null : c.key)}
                    >ƒx</Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeComp(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {formulas[c.key] && formulaOpenKey !== c.key && (
                    <p className="mt-1.5 px-1 text-[10px] font-mono text-brand-600 truncate">ƒ {formulas[c.key]}</p>
                  )}
                  {formulaOpenKey === c.key && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <MiniFormulaEditor formula={formulas[c.key] || ""} onChange={(f) => updateFormula(c.key, f)} allItems={allItems} />
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
              {unusedDefs.map((d) => (<option key={d.key} value={d.key}>{d.label}</option>))}
            </select>
          )}
        </div>

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
export default function CharacteristicsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as Tab) || "subsystem";

  const [items, setItems] = useState<ParamDef[]>([]);
  const [shotlanOpts, setShotlanOpts] = useState<ShotlanOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>(initialTab);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/param-definitions");
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchShotlanOpts = useCallback(async () => {
    try {
      const res = await fetch("/api/shotlan-options");
      if (res.ok) setShotlanOpts(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchItems(); fetchShotlanOpts(); }, [fetchItems, fetchShotlanOpts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((p) => p.category === tab)
      .filter((p) => !q || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q));
  }, [items, tab, search]);

  const countByTab = useMemo(() => {
    const counts: Record<Tab, number> = { general: 0, subsystem: 0, shotlan: shotlanOpts.length };
    items.forEach((p) => { if (p.category in counts && p.category !== "shotlan") counts[p.category as Tab]++; });
    return counts;
  }, [items, shotlanOpts]);

  async function handleCreate(data: { key: string; label: string; category: string; price?: number | null; formula?: string | null }) {
    setError(null);
    const res = await fetch("/api/param-definitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Ошибка при создании");
      return;
    }
    setAdding(false);
    await fetchItems();
  }

  async function handleUpdate(id: string, data: { key: string; label: string; category: string; price?: number | null; formula?: string | null }) {
    await fetch("/api/param-definitions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    setEditingId(null);
    await fetchItems();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/param-definitions?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    await fetchItems();
  }

  /* ── Shotlan option handlers ── */
  async function handleCreateShotlan(data: { name: string; calcMethod: string; components: Record<string, number>; formulas: Record<string, string> }) {
    await fetch("/api/shotlan-options", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setAdding(false);
    await fetchShotlanOpts();
  }
  async function handleUpdateShotlan(id: string, data: { name: string; calcMethod: string; components: Record<string, number>; formulas: Record<string, string> }) {
    await fetch("/api/shotlan-options", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    setEditingId(null);
    await fetchShotlanOpts();
  }
  async function handleDeleteShotlan(id: string) {
    setDeletingId(id);
    await fetch(`/api/shotlan-options?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    await fetchShotlanOpts();
  }

  function switchTab(t: Tab) {
    setTab(t);
    setAdding(false);
    setEditingId(null);
    setError(null);
    setSearch("");
    router.replace(`/admin/characteristics?tab=${t}`, { scroll: false });
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

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Характеристики</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Справочник параметров &middot; {items.length} записей
            </p>
          </div>
          <Button variant="premium" size="sm" onClick={() => { setAdding(true); setEditingId(null); setError(null); }} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Добавить
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors -mb-px border-b-2 cursor-pointer",
                tab === t.key
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={cn(
                "ml-1 text-[10px] rounded-full px-1.5 py-0.5",
                tab === t.key ? "bg-brand-100 text-brand-700" : "bg-muted text-muted-foreground"
              )}>
                {countByTab[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        {countByTab[tab] > 5 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск по названию или ключу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          </div>
        )}

        {/* ── Content for general / subsystem tabs ── */}
        {tab !== "shotlan" && (
          <div className="space-y-2">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>
            )}
            {adding && (
              <ParamForm category={tab} allItems={items} onSave={handleCreate} onCancel={() => { setAdding(false); setError(null); }} />
            )}
            {!loading && filtered.map((p) =>
              editingId === p.id ? (
                <ParamForm key={p.id} initial={p} category={tab} allItems={items} onSave={(data) => handleUpdate(p.id, data)} onCancel={() => setEditingId(null)} />
              ) : (
                <Card key={p.id} className="hover:border-brand-200 transition-colors">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Tag className="w-4 h-4 text-brand-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{p.label}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{p.key}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingId(p.id); setAdding(false); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" disabled={deletingId === p.id} onClick={() => handleDelete(p.id)}>
                        {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
            {!loading && filtered.length === 0 && !adding && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-3">{search ? "Ничего не найдено" : "В этой категории пока нет характеристик"}</p>
                {!search && <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1"><Plus className="w-3.5 h-3.5" /> Добавить первую</Button>}
              </div>
            )}
          </div>
        )}

        {/* ── Content for shotlan tab: types of shotlan ── */}
        {tab === "shotlan" && (
          <div className="space-y-2">
            {adding && (
              <ShotlanOptionForm allItems={items} onSave={handleCreateShotlan} onCancel={() => setAdding(false)} />
            )}
            {!loading && shotlanOpts.map((sh) =>
              editingId === sh.id ? (
                <ShotlanOptionForm key={sh.id} initial={sh} allItems={items} onSave={(data) => handleUpdateShotlan(sh.id, data)} onCancel={() => setEditingId(null)} />
              ) : (
                <Card key={sh.id} className="hover:border-brand-200 transition-colors">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{sh.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{sh.calcMethod}</span>
                        {sh.components && Object.keys(sh.components).length > 0 && (
                          <span>&middot; {Object.keys(sh.components).length} компонентов</span>
                        )}
                        {sh.formulas && Object.keys(sh.formulas).length > 0 && (
                          <span className="text-brand-600">&middot; {Object.keys(sh.formulas).length} формул</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingId(sh.id); setAdding(false); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" disabled={deletingId === sh.id} onClick={() => handleDeleteShotlan(sh.id)}>
                        {deletingId === sh.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
            {!loading && shotlanOpts.length === 0 && !adding && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-3">Видов шотланок пока нет</p>
                <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1"><Plus className="w-3.5 h-3.5" /> Добавить первый</Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
