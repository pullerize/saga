"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus,
  Save,
  X,
  Loader2,
  AlertCircle,
  Check,
  Wrench,
  Pencil,
} from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  showInPdf: boolean;
}

interface NewService {
  name: string;
  description: string;
  price: string;
  unit: string;
  showInPdf: boolean;
}

const emptyNewService: NewService = {
  name: "",
  description: "",
  price: "",
  unit: "шт",
  showInPdf: true,
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceItem>>({});

  // Add new service
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState<NewService>(emptyNewService);
  const [addingService, setAddingService] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/services");
      if (!res.ok) throw new Error("Не удалось загрузить услуги");
      const data = await res.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  function startEdit(service: ServiceItem) {
    setEditingId(service.id);
    setEditForm({ ...service });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (!editingId || !editForm) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editForm.name,
          description: editForm.description,
          price: editForm.price,
          unit: editForm.unit,
          showInPdf: editForm.showInPdf,
        }),
      });
      if (!res.ok) throw new Error("Не удалось сохранить изменения");
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, ...editForm } as ServiceItem : s
        )
      );
      setEditingId(null);
      setEditForm({});
      showToast("Услуга обновлена");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePdf(service: ServiceItem) {
    try {
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: service.id,
          showInPdf: !service.showInPdf,
        }),
      });
      if (!res.ok) throw new Error("Не удалось обновить");
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, showInPdf: !s.showInPdf } : s
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления");
    }
  }

  async function handleAddService() {
    if (!newService.name || !newService.price) return;
    setAddingService(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newService.name,
          description: newService.description || null,
          price: parseFloat(newService.price),
          unit: newService.unit,
          showInPdf: newService.showInPdf,
        }),
      });
      if (!res.ok) throw new Error("Не удалось добавить услугу");
      setShowAddForm(false);
      setNewService(emptyNewService);
      showToast("Услуга добавлена");
      await fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка добавления");
    } finally {
      setAddingService(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-muted-foreground text-sm">Загрузка услуг...</p>
        </div>
      </div>
    );
  }

  if (error && !services.length) {
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
          <h1 className="font-display text-3xl font-bold">Дополнительные услуги</h1>
          <p className="text-muted-foreground mt-1">
            Управление дополнительными услугами и расходами
          </p>
        </div>
        <Button
          variant="premium"
          size="sm"
          className="gap-2"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-4 h-4" />
          Добавить услугу
        </Button>
      </div>

      {/* Add service form */}
      {showAddForm && (
        <Card className="border-brand-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-500" />
              Новая услуга
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Наименование *</label>
                <Input
                  placeholder="Название услуги"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Input
                  placeholder="Краткое описание"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цена (у.е.) *</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.00"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService((prev) => ({ ...prev, price: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Единица измерения</label>
                <Input
                  placeholder="шт, м2, м.п."
                  value={newService.unit}
                  onChange={(e) =>
                    setNewService((prev) => ({ ...prev, unit: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-2 col-span-full">
                <input
                  type="checkbox"
                  id="new-show-pdf"
                  checked={newService.showInPdf}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      showInPdf: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="new-show-pdf" className="text-sm">
                  Показывать в PDF
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="premium"
                size="sm"
                className="gap-2"
                onClick={handleAddService}
                disabled={addingService || !newService.name || !newService.price}
              >
                {addingService ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Сохранить
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewService(emptyNewService);
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5 text-brand-500" />
            Все услуги
            <Badge variant="secondary">{services.length}</Badge>
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
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Цена (у.е.)
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Ед.
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    PDF
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => {
                  const isEditing = editingId === svc.id;
                  return (
                    <tr
                      key={svc.id}
                      className={cn(
                        "border-b last:border-0 hover:bg-muted/30 transition-colors",
                        isEditing && "bg-brand-50/50"
                      )}
                    >
                      <td className="px-6 py-3">
                        {isEditing ? (
                          <Input
                            value={editForm.name ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="h-9"
                          />
                        ) : (
                          <span className="text-sm font-medium">{svc.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={editForm.description ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            className="h-9"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {svc.description || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.1"
                            value={editForm.price ?? 0}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                price: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-28 ml-auto text-right h-9"
                          />
                        ) : (
                          <span className="text-sm font-semibold">{svc.price}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={editForm.unit ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                unit: e.target.value,
                              }))
                            }
                            className="w-20 h-9"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{svc.unit}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isEditing ? (editForm.showInPdf ?? false) : svc.showInPdf}
                          onChange={() => {
                            if (isEditing) {
                              setEditForm((prev) => ({
                                ...prev,
                                showInPdf: !prev.showInPdf,
                              }));
                            } else {
                              handleTogglePdf(svc);
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="premium"
                              size="sm"
                              onClick={saveEdit}
                              disabled={saving}
                              className="gap-1 h-8 text-xs"
                            >
                              {saving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Сохранить
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              className="h-8 text-xs"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(svc)}
                            className="h-8 text-xs gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            Изменить
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {services.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Услуги не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Error banner */}
      {error && services.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
