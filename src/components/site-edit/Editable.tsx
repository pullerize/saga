"use client";

import { useEffect, useRef } from "react";
import { useSiteEdit } from "./SiteEditProvider";
import { cn } from "@/lib/utils";

interface EditableProps {
  /** Уникальный ключ контента, например "home.hero.title". */
  contentKey: string;
  /** Значение по умолчанию — показывается если в БД пусто. */
  defaultValue: string;
  /** Какой тег рендерить (h1, h2, p, span). По умолчанию span. */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  /** Разрешить перенос строки внутри (для абзацев). */
  multiline?: boolean;
}

/**
 * Inline-редактируемый текст. У админа в режиме редактирования становится
 * `contentEditable` — клик/набор/blur → сохранение через site-edit context.
 */
export function Editable({
  contentKey,
  defaultValue,
  as: Tag = "span",
  className,
  multiline = false,
}: EditableProps) {
  const { editing, get, set } = useSiteEdit();
  const ref = useRef<HTMLElement | null>(null);
  const value = get(contentKey, defaultValue);

  // При смене значения из БД, синхронизируем DOM (но НЕ в момент редактирования).
  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  // React.JSX.IntrinsicElements индексируется через keyof, но createElement требует литералы.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;

  return (
    <Component
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        if (!editing) return;
        const next = (e.currentTarget.textContent || "").trim();
        if (next !== value) set(contentKey, next, "text");
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        // Enter без Shift — выход из режима (blur), сохранение.
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          // Отменяем правки — возвращаем DOM на сохранённое значение.
          (e.currentTarget as HTMLElement).textContent = value;
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      className={cn(
        className,
        editing && "outline-2 outline-dashed outline-brand-400 outline-offset-2 rounded-sm cursor-text",
        editing && "hover:outline-brand-600 focus:outline-solid focus:outline-brand-600",
      )}
    >
      {value}
    </Component>
  );
}
