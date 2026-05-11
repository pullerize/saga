"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CompanyBrand } from "@/components/shared/CompanyBrand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      if (res.ok) setCompanies(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  function openCreate() {
    setEditingId(null);
    setName("");
    setLogoUrl(null);
    setError("");
    setView("form");
  }

  function openEdit(c: Company) {
    setEditingId(c.id);
    setName(c.name);
    setLogoUrl(c.logoUrl);
    setError("");
    setView("form");
  }

  function closeForm() {
    setView("list");
    setEditingId(null);
    setError("");
  }

  async function handleUploadLogo(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Не удалось загрузить логотип");
        return;
      }
      const data = await res.json();
      setLogoUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Введите название компании"); return; }
    setSaving(true);
    try {
      const url = "/api/companies";
      const isEdit = !!editingId;
      const body = isEdit
        ? { id: editingId, name: name.trim(), logoUrl }
        : { name: name.trim(), logoUrl };
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Не удалось сохранить компанию");
        return;
      }
      await fetchCompanies();
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Company) {
    if (!confirm(`Удалить компанию «${c.name}»?`)) return;
    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/companies?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Не удалось удалить компанию");
        return;
      }
      await fetchCompanies();
    } finally {
      setDeletingId(null);
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
          <span className="text-sm font-semibold text-brand-600">Компании</span>
        </div>
        {view === "list" && (
          <Button variant="premium" size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Добавить компанию
          </Button>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {view === "list" && (
          <>
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold tracking-tight">Партнёрские компании</h1>
              <p className="text-muted-foreground mt-1">
                Сначала создаётся компания, затем в неё добавляются пользователи (партнёры или менеджеры).
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Загрузка...
              </div>
            ) : companies.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
                    <Building2 className="w-7 h-7 text-brand-600" />
                  </div>
                  <h3 className="font-semibold">Компаний пока нет</h3>
                  <p className="text-sm text-muted-foreground mt-1">Создайте первую компанию</p>
                  <Button variant="premium" size="sm" className="gap-2 mt-5" onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Добавить компанию
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {companies.map((c) => {
                  const isDefault = c.name === "Saga Group";
                  return (
                    <Card key={c.id} className="transition-colors hover:border-brand-300">
                      <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-lg bg-muted/40 border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {c.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {isDefault ? "Компания по умолчанию (Saga Group)" : `ID: ${c.id.slice(0, 8)}…`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(c)}>
                            <Pencil className="w-3.5 h-3.5" />
                            Изменить
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(c)}
                            disabled={isDefault || deletingId === c.id}
                            title={isDefault ? "Нельзя удалить компанию по умолчанию" : undefined}
                          >
                            {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Удалить
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === "form" && (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {editingId ? "Редактирование компании" : "Новая компания"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Название и логотип. После сохранения вы сможете добавлять в неё пользователей.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="gap-2" onClick={closeForm}>
                <X className="w-4 h-4" />
                Отмена
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Название <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ООО «Партнёр»"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1.5">Логотип</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-lg bg-muted/40 border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="inline-flex items-center gap-2 text-xs cursor-pointer rounded-md border border-input bg-background hover:bg-muted px-3 py-2 transition-colors">
                          {uploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{logoUrl ? "Заменить" : "Загрузить"}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadLogo(f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {logoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setLogoUrl(null)}
                          >
                            Убрать
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, WebP, SVG или GIF
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={closeForm}>Отмена</Button>
                    <Button type="submit" variant="premium" className="gap-2" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingId ? "Сохранить" : "Создать"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
