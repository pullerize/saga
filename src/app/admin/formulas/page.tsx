"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  FunctionSquare,
  Save,
  Search,
} from "lucide-react";

interface Formula {
  id: string;
  systemName: string;
  subsystemName: string;
  componentName: string;
  formula: string;
  sortOrder: number;
}

interface ParamDef {
  id: string;
  key: string;
  label: string;
  category: string;
}

/* ─── Formula functions ─── */
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

/* ─── Inline formula editor with @ and # ─── */
function FormulaInput({
  value,
  onChange,
  paramDefs,
  onSave,
  onCancel,
  saving,
}: {
  value: string;
  onChange: (v: string) => void;
  paramDefs: ParamDef[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [pickerType, setPickerType] = useState<"param" | "func" | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPickerType(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function getTrigger(val: string, cursor: number, char: string): string | null {
    const before = val.slice(0, cursor);
    const idx = before.lastIndexOf(char);
    if (idx === -1) return null;
    const between = before.slice(idx + 1);
    if (between.includes(" ") && between.includes(")")) return null;
    return between;
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    onChange(val);
    const cursor = e.target.selectionStart ?? val.length;
    const atQ = getTrigger(val, cursor, "@");
    const hashQ = getTrigger(val, cursor, "#");
    if (atQ !== null) { setPickerSearch(atQ); setPickerType("param"); }
    else if (hashQ !== null) { setPickerSearch(hashQ); setPickerType("func"); }
    else { setPickerType(null); }
  }

  function insertAt(text: string, triggerChar: string) {
    const el = inputRef.current;
    if (!el) { onChange(value + text); setPickerType(null); return; }
    const cursor = el.selectionStart ?? value.length;
    const idx = value.lastIndexOf(triggerChar, cursor - 1);
    if (idx === -1) { onChange(value + text); setPickerType(null); return; }
    const before = value.slice(0, idx);
    const after = value.slice(cursor);
    const next = before + text + after;
    onChange(next);
    setPickerType(null);
    setTimeout(() => { const pos = before.length + text.length; el.setSelectionRange(pos, pos); el.focus(); }, 0);
  }

  const filteredParams = paramDefs.filter((d) =>
    !pickerSearch || d.label.toLowerCase().includes(pickerSearch.toLowerCase())
  );
  const filteredFuncs = FORMULA_FUNCTIONS.filter((f) =>
    !pickerSearch || f.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div ref={wrapRef} className="space-y-2">
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPickerType(null);
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSave(); }
          }}
          placeholder="Формула... @ параметр, # функция"
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-brand-300 bg-background font-mono text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          autoComplete="off"
          autoFocus
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
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">@</kbd> параметр</span>
          <span><kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">#</kbd> функция</span>
          <span>Операторы: <code className="font-mono">+ - * / ( ) {"<="} {">="} = ;</code></span>
          <span><kbd className="bg-muted px-1 py-0.5 rounded text-[10px]">Ctrl+Enter</kbd> сохранить</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" variant="premium" disabled={saving} onClick={onSave} className="gap-1 h-8">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Сохранить
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-8">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function FormulasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [paramDefs, setParamDefs] = useState<ParamDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchFormulas = useCallback(async () => {
    try {
      const res = await fetch("/api/system-formulas");
      if (res.ok) setFormulas(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const fetchParamDefs = useCallback(async () => {
    try {
      const res = await fetch("/api/param-definitions");
      if (res.ok) setParamDefs(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchFormulas(); fetchParamDefs(); }, [fetchFormulas, fetchParamDefs]);

  // Group by system
  const systems = useMemo(() => {
    const map = new Map<string, Set<string>>();
    formulas.forEach((f) => {
      if (!map.has(f.systemName)) map.set(f.systemName, new Set());
      map.get(f.systemName)!.add(f.subsystemName);
    });
    return Array.from(map.entries()).map(([name, subs]) => ({
      name,
      subsystems: Array.from(subs),
    }));
  }, [formulas]);

  // Door width formulas per subsystem (unique per subsystem)
  const doorWidthFormulas = useMemo(() => {
    if (!selectedSystem) return [];
    return formulas
      .filter((f) => f.systemName === selectedSystem && f.componentName === "Ширина двери")
      .sort((a, b) => a.subsystemName.localeCompare(b.subsystemName));
  }, [formulas, selectedSystem]);

  // Component formulas for selected system (deduplicated — take first subsystem's copy)
  const currentFormulas = useMemo(() => {
    if (!selectedSystem) return [];
    const q = search.toLowerCase();
    const sys = systems.find((s) => s.name === selectedSystem);
    const firstSub = sys?.subsystems[0];
    if (!firstSub) return [];
    return formulas
      .filter((f) => f.systemName === selectedSystem && f.subsystemName === firstSub && f.componentName !== "Ширина двери")
      .filter((f) => !q || f.componentName.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [formulas, selectedSystem, search, systems]);

  const totalForSystem = useMemo(() => {
    if (!selectedSystem) return 0;
    const sys = systems.find((s) => s.name === selectedSystem);
    const firstSub = sys?.subsystems[0];
    if (!firstSub) return 0;
    return formulas.filter((f) => f.systemName === selectedSystem && f.subsystemName === firstSub).length;
  }, [formulas, selectedSystem, systems]);

  async function handleSave(id: string, formula: string) {
    setSaving(true);
    // Find the formula being edited to get componentName
    const edited = formulas.find((f) => f.id === id);

    // Update this formula
    await fetch("/api/system-formulas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, formula }),
    });

    // Also update all copies of this formula in other subsystems of the same system
    if (edited && edited.componentName !== "Ширина двери") {
      const copies = formulas.filter(
        (f) => f.systemName === edited.systemName && f.componentName === edited.componentName && f.id !== id
      );
      await Promise.all(
        copies.map((c) =>
          fetch("/api/system-formulas", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: c.id, formula }),
          })
        )
      );
    }

    setEditingId(null);
    await fetchFormulas();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    // Delete this formula and all copies in other subsystems
    const deleted = formulas.find((f) => f.id === id);
    await fetch(`/api/system-formulas?id=${id}`, { method: "DELETE" });

    if (deleted && deleted.componentName !== "Ширина двери") {
      const copies = formulas.filter(
        (f) => f.systemName === deleted.systemName && f.componentName === deleted.componentName && f.id !== id
      );
      await Promise.all(
        copies.map((c) => fetch(`/api/system-formulas?id=${c.id}`, { method: "DELETE" }))
      );
    }

    await fetchFormulas();
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

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl font-bold mb-1">Формулы расчёта</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {formulas.length} формул в {systems.length} системах
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Column 1: Systems */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Системы</p>
              <div className="space-y-1.5">
                {systems.map((sys) => (
                  <button
                    key={sys.name}
                    onClick={() => { setSelectedSystem(sys.name); setEditingId(null); setSearch(""); }}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer flex items-center justify-between",
                      selectedSystem === sys.name
                        ? "bg-brand-600 text-white shadow-sm"
                        : "hover:bg-brand-50 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{sys.name}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] rounded-full px-1.5 py-0.5",
                      selectedSystem === sys.name ? "bg-white/20" : "bg-muted text-muted-foreground"
                    )}>
                      {sys.subsystems.length} подс.
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Formulas */}
            <div>
              {selectedSystem ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {selectedSystem}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {search ? `${currentFormulas.length} из ${totalForSystem}` : `${totalForSystem} формул`}
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Поиск по названию или формуле..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>

                  {/* Door width formulas — per subsystem */}
                  {!search && doorWidthFormulas.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ширина двери (по подсистемам)</p>
                      <div className="rounded-xl border border-border overflow-hidden">
                        {doorWidthFormulas.map((f, i) => (
                          <div
                            key={f.id}
                            className={cn("flex items-center justify-between px-4 py-2.5 text-sm", i > 0 && "border-t border-border/30", i % 2 === 1 && "bg-muted/5")}
                          >
                            <span className="font-medium text-xs w-32 shrink-0">{f.subsystemName}</span>
                            {editingId === f.id ? (
                              <div className="flex-1 ml-3">
                                <FormulaInput
                                  value={editValue}
                                  onChange={setEditValue}
                                  paramDefs={paramDefs}
                                  saving={saving}
                                  onSave={() => handleSave(f.id, editValue)}
                                  onCancel={() => setEditingId(null)}
                                />
                              </div>
                            ) : (
                              <>
                                <p className="flex-1 font-mono text-xs text-brand-700 bg-brand-50/50 rounded px-2 py-1 mx-3 break-all cursor-pointer" onClick={() => { setEditingId(f.id); setEditValue(f.formula); }}>
                                  {f.formula}
                                </p>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-brand-600 shrink-0" onClick={() => { setEditingId(f.id); setEditValue(f.formula); }}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Component formulas — shared across subsystems */}
                  {currentFormulas.length > 0 ? (
                    <div className="space-y-2">
                      {!search && <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Формулы компонентов</p>}
                      {currentFormulas.map((f) => (
                        <Card key={f.id} className={cn("transition-colors", editingId === f.id ? "border-brand-400 shadow-sm" : "hover:border-brand-200")}>
                          <CardContent className="p-4">
                            {editingId === f.id ? (
                              <div className="space-y-3">
                                <p className="text-sm font-semibold">{f.componentName}</p>
                                <FormulaInput
                                  value={editValue}
                                  onChange={setEditValue}
                                  paramDefs={paramDefs}
                                  saving={saving}
                                  onSave={() => handleSave(f.id, editValue)}
                                  onCancel={() => setEditingId(null)}
                                />
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingId(f.id); setEditValue(f.formula); }}>
                                  <p className="text-sm font-semibold mb-1.5">{f.componentName}</p>
                                  <p className="font-mono text-xs text-brand-700 bg-brand-50/50 rounded-md px-3 py-2 leading-relaxed break-all">
                                    {f.formula}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingId(f.id); setEditValue(f.formula); }}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(f.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : search ? (
                    <p className="text-sm text-muted-foreground text-center py-12">Ничего не найдено</p>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FunctionSquare className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Выберите систему</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
