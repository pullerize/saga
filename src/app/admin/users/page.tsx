"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Mail,
  Phone,
  Building2,
  X,
  Save,
  Eye,
  EyeOff,
  Users as UsersIcon,
} from "lucide-react";

type UserRole = "ADMIN" | "MANAGER" | "PARTNER";
type UserStatus = "ACTIVE" | "BLOCKED" | "PENDING";

interface AppUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  companyName: string | null;
  createdAt: string;
}

type TabRole = "PARTNER" | "MANAGER";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  PARTNER: "Партнёр",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Активен",
  BLOCKED: "Заблокирован",
  PENDING: "Ожидает",
};

interface FormState {
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  companyName: string;
  password: string;
}

const emptyForm: FormState = {
  email: "",
  name: "",
  phone: "",
  role: "PARTNER",
  status: "ACTIVE",
  companyName: "",
  password: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabRole>("PARTNER");
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [fetchUsers, fetchCompanies]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== activeTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q) ||
        (u.companyName ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search, activeTab]);

  const counts = useMemo(() => {
    return users.reduce(
      (acc, u) => {
        acc[u.role] = (acc[u.role] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [users]);

  function openCreate() {
    setForm({ ...emptyForm, role: activeTab });
    setFormError("");
    setShowPassword(false);
    setEditingId(null);
    setView("create");
  }

  function openEdit(u: AppUser) {
    setForm({
      email: u.email,
      name: u.name,
      phone: u.phone ?? "",
      role: u.role,
      status: u.status,
      companyName: u.companyName ?? "",
      password: "",
    });
    setFormError("");
    setShowPassword(false);
    setEditingId(u.id);
    setView("edit");
  }

  function closeForm() {
    setView("list");
    setEditingId(null);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.email || !form.name) {
      setFormError("Имя и email обязательны");
      return;
    }
    if (view === "create" && !form.password) {
      setFormError("Укажите пароль");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<FormState> = {
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        status: form.status,
        companyName: form.companyName.trim(),
      };
      if (form.password) payload.password = form.password;

      const url = view === "create" ? "/api/users" : `/api/users/${editingId}`;
      const method = view === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Не удалось сохранить пользователя");
        return;
      }
      await fetchUsers();
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить пользователя? Это действие нельзя отменить.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Не удалось удалить пользователя");
      }
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
          <Logo size="sm" />
          <span className="text-sm font-semibold text-brand-600">Пользователи</span>
        </div>
        {view === "list" && (
          <Button variant="premium" size="sm" className="gap-2" onClick={openCreate}>
            <UserPlus className="w-4 h-4" />
            {activeTab === "PARTNER" ? "Добавить партнёра" : "Добавить менеджера"}
          </Button>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {view === "list" && (
          <>
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold tracking-tight">Пользователи</h1>
              <p className="text-muted-foreground mt-1">
                Управление партнёрами и внутренними менеджерами
              </p>
            </div>

            <div className="flex border-b border-border mb-6">
              {(["PARTNER", "MANAGER"] as TabRole[]).map((tab) => {
                const isActive = activeTab === tab;
                const count = counts[tab] ?? 0;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-brand-700"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {tab === "PARTNER" ? "Партнёры" : "Менеджеры"}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isActive ? "bg-brand-100 text-brand-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700 rounded-t" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  activeTab === "PARTNER"
                    ? "Поиск по имени, email, телефону, компании"
                    : "Поиск по имени, email, телефону"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Загрузка...
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
                    <UsersIcon className="w-7 h-7 text-brand-600" />
                  </div>
                  <h3 className="font-semibold">
                    {activeTab === "PARTNER"
                      ? "Партнёров пока нет"
                      : "Менеджеров пока нет"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search
                      ? "Измените поисковый запрос"
                      : activeTab === "PARTNER"
                        ? "Добавьте первого партнёра"
                        : "Добавьте первого менеджера"}
                  </p>
                  {!search && (
                    <Button variant="premium" size="sm" className="gap-2 mt-5" onClick={openCreate}>
                      <UserPlus className="w-4 h-4" />
                      {activeTab === "PARTNER" ? "Добавить партнёра" : "Добавить менеджера"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filtered.map((u) => (
                  <Card key={u.id} className="transition-colors hover:border-brand-300">
                    <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                          <span className="font-semibold text-brand-700">
                            {u.name.slice(0, 1).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate">{u.name}</p>
                            <Badge variant={roleBadgeVariant(u.role)}>{ROLE_LABELS[u.role]}</Badge>
                            <Badge variant={statusBadgeVariant(u.status)}>
                              {STATUS_LABELS[u.status]}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 min-w-0">
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </span>
                            {u.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                {u.phone}
                              </span>
                            )}
                            {u.companyName && (
                              <span className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" />
                                {u.companyName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Изменить
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
                        >
                          {deletingId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Удалить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {(view === "create" || view === "edit") && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {view === "create"
                    ? form.role === "PARTNER"
                      ? "Новый партнёр"
                      : "Новый менеджер"
                    : "Редактирование"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {view === "create"
                    ? form.role === "PARTNER"
                      ? "Внешний партнёр с собственной компанией"
                      : "Внутренний сотрудник Saga Group"
                    : "Измените данные пользователя"}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Имя / ФИО" required>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Иван Петров"
                        required
                      />
                    </Field>
                    <Field label="Email (логин)" required>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="user@example.com"
                        required
                      />
                    </Field>
                    <Field label="Телефон">
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+998 00 000 00 00"
                      />
                    </Field>
                    {form.role === "PARTNER" && (
                      <Field label="Компания">
                        <Input
                          value={form.companyName}
                          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                          placeholder="Название компании"
                          list="company-suggestions"
                        />
                        <datalist id="company-suggestions">
                          {companies.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Партнёры из одной компании видят карточки друг друга.
                        </p>
                      </Field>
                    )}
                    <Field label="Статус">
                      <div className="grid grid-cols-3 gap-2">
                        {(["ACTIVE", "PENDING", "BLOCKED"] as UserStatus[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setForm({ ...form, status: s })}
                            className={`h-11 rounded-lg text-xs font-medium border transition-colors ${
                              form.status === s
                                ? "bg-brand-700 text-white border-brand-700"
                                : "bg-background text-foreground border-input hover:bg-muted"
                            }`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  <Field
                    label={view === "create" ? "Пароль" : "Новый пароль"}
                    required={view === "create"}
                  >
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder={
                          view === "create" ? "Минимум 6 символов" : "Оставьте пустым, чтобы не менять"
                        }
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  {formError && (
                    <p className="text-sm text-destructive font-medium">{formError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={closeForm}>
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      variant="premium"
                      className="gap-2"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {view === "create" ? "Создать" : "Сохранить"}
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function roleBadgeVariant(
  role: UserRole
): "default" | "secondary" | "destructive" | "outline" | "success" | "gold" {
  switch (role) {
    case "ADMIN":
      return "gold";
    case "MANAGER":
      return "success";
    case "PARTNER":
      return "secondary";
  }
}

function statusBadgeVariant(
  status: UserStatus
): "default" | "secondary" | "destructive" | "outline" | "success" | "gold" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "BLOCKED":
      return "destructive";
    case "PENDING":
      return "outline";
  }
}
