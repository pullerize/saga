"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CompanyBrand } from "@/components/shared/CompanyBrand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Search, RotateCcw, Check } from "lucide-react";

interface PriceItem {
  id: string;
  key: string;
  name: string;
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

export default function PartnerPricingPage() {
  const [systems, setSystems] = useState<SystemGroup[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [noCompany, setNoCompany] = useState(false);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/company-prices", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const sys: SystemGroup[] = Array.isArray(data.systems) ? data.systems : [];
        setSystems(sys);
        setNoCompany(!data.companyId);
        setSelectedSystem((prev) => prev || sys[0]?.name || "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  // Сколько компонентов с переопределённой ценой во всей компании (по всем системам, без дублей).
  const overrideCount = useMemo(() => {
    const ids = new Set<string>();
    systems.forEach((s) => s.components.forEach((c) => { if (c.isOverride) ids.add(c.id); }));
    return ids.size;
  }, [systems]);

  const currentItems = useMemo(() => {
    const sys = systems.find((s) => s.name === selectedSystem);
    if (!sys) return [];
    const q = search.trim().toLowerCase();
    return q
      ? sys.components.filter((i) => i.name.toLowerCase().includes(q))
      : sys.components;
  }, [systems, selectedSystem, search]);

  // Обновляет компонент во всех системах (одна и та же запись Component).
  const patchItemEverywhere = useCallback(
    (id: string, patch: Partial<PriceItem>) => {
      setSystems((prev) =>
        prev.map((s) => ({
          ...s,
          components: s.components.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      );
    },
    [],
  );

  async function save(item: PriceItem) {
    const raw = drafts[item.id];
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) {
      setError(`Некорректная цена для «${item.name}»`);
      return;
    }
    setSavingId(item.id);
    setError("");
    try {
      const res = await fetch("/api/company-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: item.id, price }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Не удалось сохранить");
        return;
      }
      const d = await res.json();
      patchItemEverywhere(item.id, { price: d.price, isOverride: d.isOverride });
      setDrafts((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      setSavedId(item.id);
      setTimeout(() => setSavedId((cur) => (cur === item.id ? null : cur)), 1500);
    } finally {
      setSavingId(null);
    }
  }

  async function reset(item: PriceItem) {
    setSavingId(item.id);
    setError("");
    try {
      const res = await fetch(`/api/company-prices?componentId=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Не удалось сбросить");
        return;
      }
      patchItemEverywhere(item.id, { price: item.defaultPrice, isOverride: false });
      setDrafts((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/partner">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              В кабинет
            </Button>
          </Link>
          <CompanyBrand size="sm" />
          <span className="text-sm font-semibold text-brand-600">Мои цены</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Цены вашей компании</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Здесь вы задаёте цены на компоненты для своей компании. Они применяются{" "}
            <strong>только к вашим расчётам</strong> и не влияют на других. Если цена не задана —
            используется базовая. {overrideCount > 0 && <span className="text-brand-600">Изменено: {overrideCount}.</span>}
          </p>
        </div>

        {noCompany && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Ваш аккаунт не привязан к компании — цены сохранить нельзя. Обратитесь к администратору.
          </div>
        )}

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
              ? "Нет компонентов из формул. Сначала задайте формулы систем в админке."
              : "Ничего не найдено."}
          </p>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border/40">
              {currentItems.map((item) => {
                const draft = drafts[item.id];
                const value = draft ?? String(item.price);
                const changed = draft !== undefined && Number(draft) !== item.price;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        базовая (как у админа): {item.defaultPrice} у.е.{item.unit ? ` / ${item.unit}` : ""}
                        {item.isOverride && <span className="text-brand-600 ml-2">своя цена</span>}
                      </p>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setDrafts((p) => ({ ...p, [item.id]: e.target.value }))}
                      className="w-28 h-9 text-right tabular-nums"
                      disabled={noCompany}
                    />
                    <Button
                      variant="premium"
                      size="sm"
                      className="h-9 gap-1.5 shrink-0"
                      disabled={noCompany || savingId === item.id || !changed}
                      onClick={() => save(item)}
                    >
                      {savingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : savedId === item.id ? (
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
                        disabled={savingId === item.id}
                        onClick={() => reset(item)}
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
