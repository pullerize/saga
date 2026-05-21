"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * Контекст inline-редактирования контента публичных страниц («мини-CMS»).
 *   • Загружает все значения SiteContent с сервера один раз при монтировании.
 *   • Даёт `get(key)`, `set(key, value)`, `editing`, `toggleEditing`.
 *   • `editing` доступен только администратору (роль ADMIN из NextAuth-сессии).
 */

type ContentItem = { key: string; type: string; value: string };
type ContentMap = Record<string, ContentItem>;

interface SiteEditCtx {
  editing: boolean;
  isAdmin: boolean;
  toggleEditing: () => void;
  /** Выйти из CMS-режима: убрать localStorage флаг + signOut из NextAuth. */
  exitAdmin: () => Promise<void>;
  get: (key: string, fallback?: string) => string;
  set: (key: string, value: string, type?: "text" | "image" | "video") => Promise<void>;
  saving: boolean;
}

const Ctx = createContext<SiteEditCtx | null>(null);

export function SiteEditProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  // CMS-режим включается только через скрытую страницу /aaddmmiinn (ставит
  // localStorage.cms_edit_enabled = "1"). Обычный логин через /auth/login
  // НЕ даёт доступа к режиму редактирования, даже если пользователь — ADMIN.
  const [cmsEnabled, setCmsEnabled] = useState(false);
  useEffect(() => {
    try {
      setCmsEnabled(localStorage.getItem("cms_edit_enabled") === "1");
    } catch { /* SSR / приватный режим */ }
  }, []);
  const isAdmin = role === "ADMIN" && cmsEnabled;

  const [content, setContent] = useState<ContentMap>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Первая загрузка контента — публичный GET (доступен и гостям).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-content")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ContentItem[]) => {
        if (cancelled) return;
        const map: ContentMap = {};
        for (const r of rows) map[r.key] = r;
        setContent(map);
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, []);

  const get = useCallback(
    (key: string, fallback = "") => content[key]?.value ?? fallback,
    [content],
  );

  const set = useCallback(
    async (key: string, value: string, type: "text" | "image" | "video" = "text") => {
      // Оптимистично обновляем локальное состояние.
      setContent((prev) => ({ ...prev, [key]: { key, type, value } }));
      setSaving(true);
      try {
        await fetch("/api/site-content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, type, value }),
        });
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const toggleEditing = useCallback(() => {
    if (!isAdmin) return; // не-админам не даём режим редактирования
    setEditing((v) => !v);
  }, [isAdmin]);

  const exitAdmin = useCallback(async () => {
    // 1) Сбрасываем CMS-флаг — без него toolbar исчезнет даже при активной сессии.
    try {
      localStorage.removeItem("cms_edit_enabled");
    } catch { /* ignore */ }
    // 2) Полностью выходим из NextAuth и редиректим на главную.
    await signOut({ callbackUrl: "/", redirect: true });
  }, []);

  const value = useMemo<SiteEditCtx>(
    () => ({ editing: editing && isAdmin, isAdmin, toggleEditing, exitAdmin, get, set, saving }),
    [editing, isAdmin, toggleEditing, exitAdmin, get, set, saving],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteEdit() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSiteEdit вне SiteEditProvider");
  return ctx;
}
