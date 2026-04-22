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
  Plus,
  Trash2,
  X,
} from "lucide-react";

interface Component {
  id: string;
  key: string;
  name: string;
  unit: string;
  category: string;
  defaultPrice: number;
}

type Category = "component" | "glass" | "service" | "shotlan";

interface NewForm {
  name: string;
  key: string;
  unit: string;
  category: Category;
  defaultPrice: number;
}

const emptyNewForm: NewForm = {
  name: "",
  key: "",
  unit: "шт",
  category: "component",
  defaultPrice: 0,
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/ё/g, "e")
    .replace(/[а-я]/g, (c) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",
        л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",
        ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
      };
      return map[c] || "";
    })
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function PricesPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<NewForm>(emptyNewForm);
  const [keyEdited, setKeyEdited] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  function openAdd(category: Category) {
    setNewForm({ ...emptyNewForm, category });
    setKeyEdited(false);
    setCreateError("");
    setAdding(true);
  }

  function closeAdd() {
    setAdding(false);
    setCreateError("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    if (!newForm.name.trim()) {
      setCreateError("Укажите название");
      return;
    }
    const key = (keyEdited ? newForm.key : slugify(newForm.name)).trim();
    if (!key) {
      setCreateError("Не удалось сгенерировать ключ — заполните вручную");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          name: newForm.name.trim(),
          unit: newForm.unit.trim() || "шт",
          category: newForm.category,
          defaultPrice: Number(newForm.defaultPrice) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || "Не удалось создать компонент");
        return;
      }
      await fetchComponents();
      closeAdd();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(c: Component) {
    if (!confirm(`Удалить компонент «${c.name}»? Это действие нельзя отменить.`)) return;
    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/components?id=${c.id}`, { method: "DELETE" });
      if (res.ok) {
        setComponents((prev) => prev.filter((x) => x.id !== c.id));
        const next = { ...editedPrices };
        delete next[c.id];
        setEditedPrices(next);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Не удалось удалить компонент");
      }
    } finally {
      setDeletingId(null);
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
          <Button variant="outline" size="sm" className="gap-2" onClick={() => openAdd("component")}>
            <Plus className="w-4 h-4" />
            Добавить
          </Button>
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

        {/* Create form */}
        {adding && (
          <Card className="mb-6 border-brand-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Новый компонент</h3>
                <Button variant="ghost" size="sm" className="gap-1 h-8" onClick={closeAdd}>
                  <X className="w-3.5 h-3.5" /> Отмена
                </Button>
              </div>
              <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Название *</label>
                  <Input
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    placeholder="Рельса верхняя 47мм (6м)"
                    autoFocus
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Ключ (латиницей)
                  </label>
                  <Input
                    value={keyEdited ? newForm.key : slugify(newForm.name)}
                    onChange={(e) => { setKeyEdited(true); setNewForm({ ...newForm, key: e.target.value }); }}
                    placeholder="auto_generated"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Категория</label>
                  <select
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value as Category })}
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  >
                    <option value="component">Комплектующие</option>
                    <option value="glass">Стекло</option>
                    <option value="service">Услуги</option>
                    <option value="shotlan">Шотланки</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Ед.</label>
                  <Input
                    value={newForm.unit}
                    onChange={(e) => setNewForm({ ...newForm, unit: e.target.value })}
                    placeholder="шт"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Цена (у.е.)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newForm.defaultPrice || ""}
                    onChange={(e) => setNewForm({ ...newForm, defaultPrice: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="sm:col-span-3 flex items-end">
                  <Button
                    type="submit"
                    variant="premium"
                    className="w-full gap-2"
                    disabled={creating}
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Создать
                  </Button>
                </div>
                {createError && (
                  <p className="sm:col-span-12 text-sm text-destructive font-medium">{createError}</p>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(categories).map(([cat, comps]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {catLabels[cat] || cat} ({comps.length})
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground hover:text-brand-700"
                    onClick={() => openAdd(cat as Category)}
                  >
                    <Plus className="w-3 h-3" />
                    Добавить в «{(catLabels[cat] || cat).toLowerCase()}»
                  </Button>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Компонент</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5 w-20">Ед.</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5 w-36">Цена (у.е.)</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5 w-12"></th>
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
                              <p className="text-[10px] font-mono text-muted-foreground/70">{c.key}</p>
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
                            <td className="px-4 py-2.5 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                disabled={deletingId === c.id}
                                onClick={() => handleDelete(c)}
                                title="Удалить компонент"
                              >
                                {deletingId === c.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
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
