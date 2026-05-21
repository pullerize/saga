"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Скрытый вход для активации режима inline-редактирования контента (мини-CMS).
 *
 * После успешного входа админом:
 *   1) NextAuth ставит сессию (тот же механизм что /auth/login).
 *   2) Дополнительно — localStorage.cms_edit_enabled = "1".
 *      SiteEditToolbar показывается ТОЛЬКО при наличии этого флага. Это значит:
 *      обычный логин через /auth/login не даёт доступа к редактированию сайта,
 *      даже если пользователь — ADMIN. Включается только через эту страницу.
 *
 * Минимальный UX — без декораций, чтобы не светить URL в сети.
 */
export default function HiddenCmsLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Неверный логин или пароль");
      setLoading(false);
      return;
    }

    // Проверяем что пользователь действительно админ — иначе режим редактирования
    // не нужен (партнёры/менеджеры заходят через /auth/login).
    const session = await getSession();
    const role = (session?.user as { role?: string })?.role;
    if (role !== "ADMIN") {
      setError("Только администратор может включать режим редактирования");
      setLoading(false);
      return;
    }

    // Активируем CMS-режим: флаг в localStorage.
    try {
      localStorage.setItem("cms_edit_enabled", "1");
    } catch { /* приватный режим — игнор */ }

    // ПОЛНЫЙ reload — иначе SiteEditProvider, уже смонтированный в корне,
    // не пересчитает флаг (useEffect на mount). window.location.assign даёт
    // browser navigation, провайдер перестартует и подхватит localStorage.
    window.location.assign("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 bg-card border border-border rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 text-brand-700">
          <Lock className="w-5 h-5" />
          <h1 className="font-display text-lg font-semibold">Режим редактирования</h1>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Логин администратора</label>
          <Input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Пароль</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" variant="premium" size="lg" className="w-full gap-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loading ? "Проверка..." : "Включить редактирование"}
        </Button>

        <p className="text-[10px] text-muted-foreground leading-snug">
          После входа на главной странице появится кнопка «Редактировать» внизу справа.
        </p>
      </form>
    </div>
  );
}
