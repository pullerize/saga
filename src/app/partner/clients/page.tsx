"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientCardForm, type KnownClient, type ClientCardData } from "@/components/admin/ClientCardForm";
import {
  ArrowLeft,
  UserPlus,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Building2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ClientCard extends ClientCardData {
  id: string;
  createdAt: string;
  companyName: string;
}

export default function PartnerClientsPage() {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [cards, setCards] = useState<ClientCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const editingCard = editingId ? cards.find((c) => c.id === editingId) : null;

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch("/api/client-cards");
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const uniqueClients: KnownClient[] = useMemo(() => {
    const seen = new Set<string>();
    return cards.reduce<KnownClient[]>((acc, c) => {
      const key = c.clientName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        acc.push({ name: c.clientName, phone: c.clientPhone, address: c.clientAddress });
      }
      return acc;
    }, []);
  }, [cards]);

  const filteredCards = cards.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.clientName.toLowerCase().includes(q) ||
      c.clientPhone.includes(q) ||
      c.systemName.toLowerCase().includes(q)
    );
  });

  async function handleCardCreated(card: ClientCardData) {
    const res = await fetch("/api/client-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    if (res.ok) {
      await fetchCards();
    }
    setView("list");
  }

  async function handleCardUpdated(card: ClientCardData) {
    if (!editingId) return;
    const res = await fetch("/api/client-cards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...card }),
    });
    if (res.ok) {
      await fetchCards();
    }
    setEditingId(null);
    setView("list");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/client-cards?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCards((prev) => prev.filter((c) => c.id !== id));
    }
    setDeletingId(null);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setView("edit");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-brand-600">Кабинет</span>
        </div>
        <Link href="/partner">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {view === "list" ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Карточки клиентов</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {cards.length > 0
                    ? `Всего: ${cards.length}`
                    : loading ? "Загрузка..." : "Создайте первую карточку клиента"}
                </p>
              </div>
              <Button
                variant="premium"
                size="lg"
                onClick={() => setView("create")}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Создать карточку
              </Button>
            </div>

            {cards.length > 0 && (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по имени, телефону или системе..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            )}

            {!loading && filteredCards.length > 0 ? (
              <div className="space-y-3">
                {filteredCards.map((card) => (
                  <Card
                    key={card.id}
                    className="hover:border-brand-200 transition-colors"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-display text-base font-semibold truncate">
                              {card.clientName}
                            </h3>
                            <span className="shrink-0 text-xs font-medium text-brand-600 bg-brand-50 rounded-full px-2.5 py-0.5">
                              {card.systemName}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                              {card.subsystem}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              {card.clientPhone}
                            </span>
                            {card.clientAddress && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {card.clientAddress}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(card.createdAt).toLocaleDateString("ru-RU", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="inline-flex items-center gap-1 font-medium text-brand-700">
                              <Building2 className="w-3 h-3" />
                              {card.companyName}
                            </span>
                            <span>Менеджер: {card.managerName} &middot; {card.branch}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="text-right">
                            <p className="font-display text-lg font-bold text-brand-700 tabular-nums">
                              {formatPrice(card.totalPrice)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">у.е.</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(card.id)}
                              className="shrink-0 text-muted-foreground hover:text-brand-600 h-8 w-8 p-0"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(card.id)}
                              disabled={deletingId === card.id}
                              className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                            >
                              {deletingId === card.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !loading && cards.length > 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p>Ничего не найдено по запросу &laquo;{search}&raquo;</p>
              </div>
            ) : !loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Карточек пока нет</p>
                <Button
                  variant="premium"
                  onClick={() => setView("create")}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Создать первую карточку
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {view === "edit" ? "Редактирование карточки" : "Новая карточка клиента"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {view === "edit"
                  ? "Измените данные клиента или комплектацию"
                  : "Заполните данные клиента и выберите комплектацию"}
              </p>
            </div>
            <ClientCardForm
              key={view === "edit" ? editingId : "new"}
              knownClients={uniqueClients}
              initialData={view === "edit" ? editingCard ?? undefined : undefined}
              onCreated={view === "edit" ? handleCardUpdated : handleCardCreated}
              onCancel={() => { setEditingId(null); setView("list"); }}
            />
          </>
        )}
      </main>
    </div>
  );
}
