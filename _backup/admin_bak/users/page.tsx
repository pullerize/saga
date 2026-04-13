"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Search,
  Loader2,
  AlertCircle,
  Users,
  Check,
  ChevronDown,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  role: "ADMIN" | "MANAGER" | "PARTNER";
  status: "ACTIVE" | "BLOCKED" | "PENDING";
  _count?: { calculations: number };
  calculationsCount?: number;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  ACTIVE: { label: "Активен", className: "bg-emerald-100 text-emerald-700" },
  BLOCKED: { label: "Заблокирован", className: "bg-red-100 text-red-700" },
  PENDING: { label: "Ожидание", className: "bg-amber-100 text-amber-700" },
};

const roleConfig: Record<
  string,
  { label: string; className: string }
> = {
  ADMIN: { label: "Админ", className: "bg-brand-100 text-brand-700" },
  MANAGER: { label: "Менеджер", className: "bg-blue-100 text-blue-700" },
  PARTNER: { label: "Партнёр", className: "bg-gray-100 text-gray-700" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Track which dropdowns are open
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Не удалось загрузить пользователей");
      const data = await res.json();
      setUsers(data);
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

  async function updateUser(id: string, updates: Partial<Pick<UserItem, "role" | "status">>) {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error("Не удалось обновить пользователя");
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
      );
      showToast("Пользователь обновлён");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления");
    } finally {
      setSaving(null);
      setOpenRoleDropdown(null);
      setOpenStatusDropdown(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-muted-foreground text-sm">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  if (error && !users.length) {
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

      <div>
        <h1 className="font-display text-3xl font-bold">Пользователи</h1>
        <p className="text-muted-foreground mt-1">
          Управление ролями и статусами пользователей
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, email или компании..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            Все пользователи
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                    Имя
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Компания
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Роль
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Статус
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Расчёты
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const calcCount = user._count?.calculations ?? user.calculationsCount ?? 0;
                  return (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium">
                        {user.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.company || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenRoleDropdown(
                                openRoleDropdown === user.id ? null : user.id
                              )
                            }
                            disabled={saving === user.id}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer",
                              roleConfig[user.role].className
                            )}
                          >
                            {saving === user.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : null}
                            {roleConfig[user.role].label}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {openRoleDropdown === user.id && (
                            <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                              {(["ADMIN", "MANAGER", "PARTNER"] as const).map((role) => (
                                <button
                                  key={role}
                                  onClick={() => updateUser(user.id, { role })}
                                  className={cn(
                                    "w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                                    user.role === role && "font-bold"
                                  )}
                                >
                                  {roleConfig[role].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenStatusDropdown(
                                openStatusDropdown === user.id ? null : user.id
                              )
                            }
                            disabled={saving === user.id}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer",
                              statusConfig[user.status].className
                            )}
                          >
                            {statusConfig[user.status].label}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {openStatusDropdown === user.id && (
                            <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                              {(["ACTIVE", "BLOCKED", "PENDING"] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateUser(user.id, { status })}
                                  className={cn(
                                    "w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                                    user.status === status && "font-bold"
                                  )}
                                >
                                  {statusConfig[status].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {calcCount}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Error banner */}
      {error && users.length > 0 && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
