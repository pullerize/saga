"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CompanyBrand } from "@/components/shared/CompanyBrand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Search, RotateCcw, Check } from "lucide-react";

interface PriceItem {
  componentId: string;
  componentName: string; // имя из формулы (ключ переопределения)
  name: string;          // имя реального компонента
  unit: string;
  category: string;
  defaultPrice: number;
  price: number;
  isOverride: boolean;
}

interface SystemGroup {
  name: string;
  components: PriceItem[];
}

export default function AdminPricesPage() {
  const [systems, setSystems] = useState<SystemGroup[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // key = `${system}::${componentName}`
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/system-prices", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const sys: SystemGroup[] = Array.isArray(data.systems) ? data.systems : [];
        setSystems(sys);
        setSelectedSystem((prev) => prev || sys[0]?.name || "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const currentItems = useMemo(() => {
    const sys = systems.find((s) => s.name === selectedSystem);
    if (!sys) return [];
    const q = search.trim().toLowerCase();
    return q
      ? sys.components.filter((i) => i.name.toLowerCase().includes(q) || i.componentName.toLowerCase().includes(q))
      : sys.components;
  }, [systems, selectedSystem, search]);

  const overrideCount = useMemo(() => {
    let n = 0;
    systems.forEach((s) => s.components.forEach((c) => { if (c.isOverride) n++; }));
    return n;
  }, [systems]);

  const patchItem = useCallback(
    (systemName: string, componentName: string, patch: Partial<PriceItem>) => {
      setSystems((prev) =>
        prev.map((s) =>
          s.name === systemName
            ? {
                ...s,
                components: s.components.map((c) =>
                  c.componentName === componentName ? { ...c, ...patch } : c,
                ),
              }
            : s,
        ),
      );
    },
    [],
  );

  async function save(systemName: string, item: PriceItem) {
    const key = `${systemName}::${item.componentName}`;
    const raw = drafts[key];
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) {
      setError(`Некорректная цена для «${item.name}»`);
      return;
    }
    setSavingKey(key);
    setError("");
    try {
      const res = await fetch("/api/system-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemName, componentName: item.componentName, price }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Не удалось сохранить");
        return;
      }
      const d = await res.json();
      patchItem(systemName, item.componentName, { price: d.price, isOverride: d.isOverride });
      setDrafts((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setSavedKey(key);
      setTimeout(() => setSavedKey((cur) => (cur === key ? null : cur)), 1500);
    } finally {
      setSavingKey(null);
    }
  }

  async function reset(systemName: string, item: PriceItem) {
    const key = `${systemName}::${item.componentName}`;
    setSavingKey(key);
    setError("");
    try {
      const res = await fetch(
        `/api/system-prices?systemName=${encodeURIComponent(systemName)}&componentName=${encodeURIComponent(item.componentName)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Не удалось сбросить");
        return;
      }
      patchItem(systemName, item.componentName, { price: item.defaultPrice, isOverride: false });
      setDrafts((prev) => { const n = { ...prev }; delete n[key]; return n; });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              К панели
            </Button>
          </Link>
          <CompanyBrand size="sm" />
          <span className="text-sm font-semibold text-brand-600">Цены</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Цены по системам</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Один и тот же компонент может стоить разные деньги в разных системах. Если своя цена
            не задана — используется базовая (Component.defaultPrice).
            {overrideCount > 0 && <span className="text-brand-600 ml-2">Переопределено: {overrideCount}.</span>}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-64">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Система</label>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 cursor-pointer"
            >
              {systems.map((s) => (
                <option key={s.name} value={s.name}>{s.name} ({s.components.length})</option>
              ))}
              {systems.length === 0 && <option value="">Нет компонентов в формулах</option>}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию компонента…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Загрузка...
          </div>
        ) : currentItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            {systems.length === 0
              ? "Нет компонентов из формул. Сначала задайте формулы систем в /admin/formulas."
              : "Ничего не найдено."}
          </p>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border/40">
              {currentItems.map((item) => {
                const key = `${selectedSystem}::${item.componentName}`;
                const draft = drafts[key];
                const value = draft ?? String(item.price);
                const changed = draft !== undefined && Number(draft) !== item.price;
                return (
                  <div key={item.componentName} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        базовая: {item.defaultPrice} у.е.{item.unit ? ` / ${item.unit}` : ""}
                        {item.isOverride && <span className="text-brand-600 ml-2">цена этой системы</span>}
                      </p>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setDrafts((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-28 h-9 text-right tabular-nums"
                    />
                    <Button
                      variant="premium"
                      size="sm"
                      className="h-9 gap-1.5 shrink-0"
                      disabled={savingKey === key || !changed}
                      onClick={() => save(selectedSystem, item)}
                    >
                      {savingKey === key ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : savedKey === key ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : null}
                      Сохранить
                    </Button>
                    {item.isOverride && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2 shrink-0 text-muted-foreground"
                        title="Сбросить к базовой"
                        disabled={savingKey === key}
                        onClick={() => reset(selectedSystem, item)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
