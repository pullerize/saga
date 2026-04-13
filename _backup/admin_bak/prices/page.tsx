"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Save,
  Search,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";

const tabs = [
  { id: "components", label: "Комплектующие" },
  { id: "glass", label: "Стекло" },
  { id: "services", label: "Доп. расходы" },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface ComponentItem {
  id: string;
  key: string;
  name: string;
  defaultPrice: number;
  unit: string;
}

interface GlassItem {
  id: string;
  name: string;
  pricePerSqm: number;
  description: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string | null;
}

export default function PricesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("components");
  const [search, setSearch] = useState("");

  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [glass, setGlass] = useState<GlassItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Track edited prices
  const [editedComponents, setEditedComponents] = useState<Record<string, number>>({});
  const [editedGlass, setEditedGlass] = useState<Record<string, number>>({});
  const [editedServices, setEditedServices] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, glassRes, svcRes] = await Promise.all([
        fetch("/api/admin/components"),
        fetch("/api/admin/glass"),
        fetch("/api/admin/services"),
      ]);
      if (!compRes.ok || !glassRes.ok || !svcRes.ok) {
        throw new Error("Не удалось загрузить данные");
      }
      const [compData, glassData, svcData] = await Promise.all([
        compRes.json(),
        glassRes.json(),
        svcRes.json(),
      ]);
      setComponents(compData);
      setGlass(glassData);
      setServices(svcData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show toast for 3 seconds
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Promise<Response>[] = [];

      // Save edited component prices
      for (const [id, price] of Object.entries(editedComponents)) {
        updates.push(
          fetch("/api/admin/components", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, defaultPrice: price }),
          })
        );
      }

      // Save edited glass prices
      for (const [id, price] of Object.entries(editedGlass)) {
        updates.push(
          fetch("/api/admin/glass", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, pricePerSqm: price }),
          })
        );
      }

      // Save edited service prices
      for (const [id, price] of Object.entries(editedServices)) {
        updates.push(
          fetch("/api/admin/services", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, price }),
          })
        );
      }

      const results = await Promise.all(updates);
      const allOk = results.every((r) => r.ok);
      if (!allOk) throw new Error("Некоторые цены не удалось сохранить");

      setEditedComponents({});
      setEditedGlass({});
      setEditedServices({});
      showToast("Цены успешно сохранены");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    Object.keys(editedComponents).length > 0 ||
    Object.keys(editedGlass).length > 0 ||
    Object.keys(editedServices).length > 0;

  const filteredComponents = components.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.key.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGlass = glass.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-muted-foreground text-sm">Загрузка цен...</p>
        </div>
      </div>
    );
  }

  if (error && !components.length) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Управление ценами</h1>
          <p className="text-muted-foreground mt-1">
            Редактирование цен на комплектующие и услуги
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="premium"
            size="sm"
            className="gap-2"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearch("");
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              activeTab === tab.id
                ? "bg-card text-foreground premium-shadow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Components tab */}
      {activeTab === "components" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Комплектующие
              <Badge variant="secondary">{filteredComponents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Ключ
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Наименование
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Ед.
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Цена (у.е.)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComponents.map((comp) => (
                    <tr
                      key={comp.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-xs font-mono text-muted-foreground">
                        {comp.key}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {comp.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {comp.unit}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Input
                          type="number"
                          step="0.1"
                          defaultValue={editedComponents[comp.id] ?? comp.defaultPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setEditedComponents((prev) => ({
                                ...prev,
                                [comp.id]: val,
                              }));
                            }
                          }}
                          className={cn(
                            "w-28 ml-auto text-right h-9",
                            editedComponents[comp.id] !== undefined &&
                              "border-amber-400 bg-amber-50"
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredComponents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        Ничего не найдено
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Glass tab */}
      {activeTab === "glass" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Стекло
              <Badge variant="secondary">{filteredGlass.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Наименование
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Описание
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Цена за м2 (у.е.)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGlass.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium">
                        {g.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {g.description || "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Input
                          type="number"
                          step="0.1"
                          defaultValue={editedGlass[g.id] ?? g.pricePerSqm}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setEditedGlass((prev) => ({
                                ...prev,
                                [g.id]: val,
                              }));
                            }
                          }}
                          className={cn(
                            "w-28 ml-auto text-right h-9",
                            editedGlass[g.id] !== undefined &&
                              "border-amber-400 bg-amber-50"
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredGlass.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                        Ничего не найдено
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services tab */}
      {activeTab === "services" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Доп. расходы
              <Badge variant="secondary">{filteredServices.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Наименование
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Описание
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Ед.
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Цена (у.е.)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((svc) => (
                    <tr
                      key={svc.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium">
                        {svc.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {svc.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {svc.unit}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Input
                          type="number"
                          step="0.1"
                          defaultValue={editedServices[svc.id] ?? svc.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setEditedServices((prev) => ({
                                ...prev,
                                [svc.id]: val,
                              }));
                            }
                          }}
                          className={cn(
                            "w-28 ml-auto text-right h-9",
                            editedServices[svc.id] !== undefined &&
                              "border-amber-400 bg-amber-50"
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredServices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        Ничего не найдено
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
