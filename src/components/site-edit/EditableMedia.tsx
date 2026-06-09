"use client";

import { useRef, useState } from "react";
import { useSiteEdit } from "./SiteEditProvider";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

interface EditableMediaProps {
  contentKey: string;
  defaultValue: string;
  /** "image" — рендерит <img>, "video" — рендерит <video autoPlay muted loop>. */
  mediaType: "image" | "video";
  /** className применяется к самому <img>/<video>. */
  className?: string;
  /** className для внешней обёртки. По умолчанию inline-block; для absolute-карточек
   *  передавайте "absolute inset-0 w-full h-full". */
  wrapperClassName?: string;
  alt?: string;
  /** Дополнительные props пробрасываются на <img>/<video>. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mediaProps?: any;
}

/**
 * Редактируемая картинка/видео. В режиме редактирования показывает overlay
 * «Заменить» — клик открывает диалог выбора файла, файл уходит в /api/upload,
 * полученный URL сохраняется в SiteContent.
 */
export function EditableMedia({
  contentKey,
  defaultValue,
  mediaType,
  className,
  wrapperClassName,
  alt = "",
  mediaProps = {},
}: EditableMediaProps) {
  const { editing, get, set } = useSiteEdit();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const url = get(contentKey, defaultValue);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        await set(contentKey, data.url, mediaType);
      } else {
        setError(data.error || "Не удалось загрузить");
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!url) return;
    if (!window.confirm("Удалить эту картинку?")) return;
    setError("");
    try {
      await set(contentKey, "", mediaType);
    } catch {
      setError("Не удалось удалить");
    }
  }

  return (
    <div className={cn(
      "relative",
      wrapperClassName ?? "inline-block",
      editing && "outline-2 outline-dashed outline-brand-400 outline-offset-2 rounded-sm",
    )}>
      {/* Если url пустой — не рендерим <img>/<video> вообще: пустой src ломает
          React (warning «empty string was passed to the src attribute»). */}
      {url && mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className={className} {...mediaProps} />
      )}
      {url && mediaType === "video" && (
        <video
          key={url}
          src={url}
          className={className}
          muted
          loop
          autoPlay
          playsInline
          {...mediaProps}
        />
      )}
      {editing && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept={mediaType === "image" ? "image/*" : "video/webm,video/mp4"}
            className="hidden"
            onChange={handleFile}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-700 text-white text-xs font-medium shadow-md hover:bg-brand-800 disabled:opacity-60"
              aria-label="Заменить медиа"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {uploading ? "Загрузка…" : "Заменить"}
            </button>
            {url && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium shadow-md hover:bg-red-700 disabled:opacity-60"
                aria-label="Удалить медиа"
                title="Удалить"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {error && (
            <p className="absolute top-12 right-2 text-[10px] text-destructive bg-white px-2 py-1 rounded shadow">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
