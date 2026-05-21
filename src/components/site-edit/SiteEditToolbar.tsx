"use client";

import { useState } from "react";
import { useSiteEdit } from "./SiteEditProvider";
import { Pencil, Check, Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Кнопки «Редактировать» / «Готово» / «Выйти» в правом нижнем углу страницы.
 * Видны только админам в CMS-режиме (после входа через /aaddmmiinn).
 */
export function SiteEditToolbar() {
  const { editing, isAdmin, toggleEditing, exitAdmin, saving } = useSiteEdit();
  const [exiting, setExiting] = useState(false);

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
      {editing && saving && (
        <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-border shadow-md text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Сохранение…
        </div>
      )}

      {/* Выйти из режима админа */}
      <button
        type="button"
        onClick={async () => {
          if (!confirm("Выйти из режима администратора?")) return;
          setExiting(true);
          await exitAdmin();
        }}
        disabled={exiting}
        className="inline-flex items-center gap-2 px-3 py-2.5 rounded-full shadow-lg font-medium text-sm bg-white text-destructive border border-destructive/30 hover:bg-destructive/5 transition-all disabled:opacity-60"
        title="Выйти из режима редактирования"
      >
        {exiting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        <span className="hidden sm:inline">Выйти</span>
      </button>

      {/* Редактировать / Готово */}
      <button
        type="button"
        onClick={toggleEditing}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg font-medium text-sm transition-all",
          editing
            ? "bg-brand-700 text-white hover:bg-brand-800"
            : "bg-white text-brand-700 border border-brand-300 hover:bg-brand-50",
        )}
      >
        {editing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
        {editing ? "Готово" : "Редактировать"}
      </button>
    </div>
  );
}
