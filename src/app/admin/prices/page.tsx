"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  Search,
  Save,
  Loader2,
  DollarSign,
} from "lucide-react";

interface Component {
  id: string;
  key: string;
  name: string;
  unit: string;
  category: string;
  defaultPrice: number;
}

export default function PricesPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const fetchComponents = useCallback(async () => {
    try {
      const res = await fetch("/api/components");
      if (res.ok) setComponents(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchComponents(); }, [fetchComponents]);

  const filtered = useMemo(() => {
    if (!search) return components;
    const q = search.toLowerCase();
    return components.filter((c) =>
      c.name.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    );
  }, [components, search]);

  const hasChanges = Object.keys(editedPrices).length > 0;

  function handlePriceChange(id: string, price: number) {
    const original = components.find((c) => c.id === id);
    if (original && original.defaultPrice === price) {
      const next = { ...editedPrices };
      delete next[id];
      setEditedPrices(next);
    } else {
      setEditedPrices({ ...editedPrices, [id]: price });
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    setSavedMessage("");
    try {
      const entries = Object.entries(editedPrices);
      await Promise.all(
        entries.map(([id, defaultPrice]) =>
          fetch("/api/components", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, defaultPrice }),
          })
        )
      );
      setEditedPrices({});
      await fetchComponents();
      setSavedMessage(`Сохранено ${entries.length} цен`);
      setTimeout(() => setSavedMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  // Group by category
  const categories = useMemo(() => {
    const cats: Record<string, Component[]> = {};
    filtered.forEach((c) => {
      const cat = c.category || "component";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(c);
    });
    return cats;
  }, [filtered]);

  const catLabels: Record<string, string> = {
    component: "Комплектующие",
    glass: "Стекло",
    service: "Услуги",
    shotlan: "Шотланки",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-brand-600">Админ-панель</span>
        </div>
        <div className="flex items-center gap-3">
          {savedMessage && (
            <span className="text-xs text-green-600 font-medium">{savedMessage}</span>
          )}
          {hasChanges && (
            <Button variant="premium" size="sm" onClick={handleSaveAll} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Сохранить ({Object.keys(editedPrices).length})
            </Button>
          )}
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Цены компонентов</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {components.length} компонентов &middot; цены в у.е.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(categories).map(([cat, comps]) => (
              <div key={cat}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {catLabels[cat] || cat} ({comps.length})
                </h2>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Компонент</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5 w-20">Ед.</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5 w-36">Цена (у.е.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comps.map((c, i) => {
                        const isEdited = editedPrices[c.id] !== undefined;
                        const currentPrice = isEdited ? editedPrices[c.id] : c.defaultPrice;
                        return (
                          <tr key={c.id} className={cn("border-b last:border-0 transition-colors", i % 2 === 1 && "bg-muted/20", isEdited && "bg-amber-50")}>
                            <td className="px-4 py-2.5">
                              <p className="text-sm font-medium">{c.name}</p>
                            </td>
                            <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">{c.unit}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  value={currentPrice}
                                  onChange={(e) => handlePriceChange(c.id, Number(e.target.value))}
                                  step="0.01"
                                  className={cn(
                                    "w-28 h-8 px-3 text-right rounded-md border text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30",
                                    isEdited ? "border-amber-400 bg-amber-50" : "border-border bg-background"
                                  )}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
