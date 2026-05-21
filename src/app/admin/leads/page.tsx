"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CompanyBrand } from "@/components/shared/CompanyBrand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Inbox,
  Loader2,
  Phone,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  systemSlug: string;
  systemName: string;
  subsystemName: string | null;
  fullWidth: number | null;
  openWidth: number | null;
  height: number | null;
  doorWidth: number | null;
  glassType: string | null;
  shotlanType: string | null;
  totalPrice: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = "all" | "new" | "contacted" | "closed";

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: "Новая", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  contacted: { label: "В работе", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Phone },
  closed: { label: "Закрыта", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

function formatPrice(value: number | null) {
  if (value == null) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} сум`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Не удалось загрузить заявки");
      setLeads(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  const counts = useMemo(() => {
    return {
      all: leads.length,
      new: leads.filter((l) => l.status === "new").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      closed: leads.filter((l) => l.status === "closed").length,
    };
  }, [leads]);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Не удалось обновить статус");
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("Удалить заявку безвозвратно?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Не удалось удалить");
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <CompanyBrand size="sm" />
          <span className="text-sm font-semibold text-brand-600">Заявки гостей</span>
        </div>
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            В админ-панель
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Inbox className="w-7 h-7 text-brand-600" />
              Заявки с калькулятора
            </h1>
            <p className="text-muted-foreground mt-1">
              Гости, которые оставили имя и телефон, чтобы увидеть КП.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "new", "contacted", "closed"] as StatusFilter[]).map((f) => {
              const labels: Record<StatusFilter, string> = {
                all: "Все",
                new: "Новые",
                contacted: "В работе",
                closed: "Закрытые",
              };
              return (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {labels[f]} <span className="ml-1.5 opacity-70">({counts[f]})</span>
                </Button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Загрузка…
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {filter === "all" ? "Пока нет заявок." : "Нет заявок в этой категории."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => {
              const meta = STATUS_META[lead.status] ?? STATUS_META.new;
              const StatusIcon = meta.icon;
              return (
                <Card key={lead.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(lead.createdAt)}
                          </span>
                        </div>
                        <a
                          href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900 font-medium text-sm"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {lead.phone}
                        </a>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
                          <Field label="Система" value={lead.systemName || "—"} />
                          <Field label="Подсистема" value={lead.subsystemName || "—"} />
                          <Field
                            label="Размер"
                            value={
                              lead.fullWidth || lead.height
                                ? `${lead.fullWidth ?? "?"} × ${lead.height ?? "?"} мм`
                                : "—"
                            }
                          />
                          <Field label="Дверь" value={lead.doorWidth ? `${lead.doorWidth} мм` : "—"} />
                          <Field label="Стекло" value={lead.glassType || "—"} />
                          <Field label="Шотланка" value={lead.shotlanType || "—"} />
                          <Field label="Цена" value={formatPrice(lead.totalPrice)} bold />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:items-end shrink-0">
                        <div className="flex gap-2 flex-wrap">
                          {lead.status !== "new" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === lead.id}
                              onClick={() => updateStatus(lead.id, "new")}
                            >
                              Новая
                            </Button>
                          )}
                          {lead.status !== "contacted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === lead.id}
                              onClick={() => updateStatus(lead.id, "contacted")}
                            >
                              В работу
                            </Button>
                          )}
                          {lead.status !== "closed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyId === lead.id}
                              onClick={() => updateStatus(lead.id, "closed")}
                            >
                              Закрыть
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 gap-2"
                          disabled={busyId === lead.id}
                          onClick={() => deleteLead(lead.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-muted-foreground uppercase tracking-wide text-[10px]">{label}</div>
      <div className={`truncate ${bold ? "font-semibold text-foreground" : ""}`}>{value}</div>
    </div>
  );
}
