"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { CompanyBrand } from "@/components/shared/CompanyBrand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Layers,
  Image as ImageIcon,
  GripVertical,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

interface VariantItem {
  id?: string;
  title: string;
  description: string;
  iconUrl: string | null;
}

interface Scheme {
  id?: string;
  label: string;
  svgContent: string;
  // Scheme type:
  //   "wide" | "square" | "tall" — system view (one of three based on opening ratio)
  //   "door" — door scheme (always shown)
  //   "side" — side view (always shown)
  //   "top"  — top view (always shown)
  //   null   — legacy door (kept for backward compat)
  ratioType?: string | null;
}

interface Variant {
  id: string;
  systemSlug: string;
  subsystemName: string;
  variantName: string;
  railImageUrl: string | null;
  items: VariantItem[];
  schemes: Scheme[];
}

interface DBSubsystem {
  id: string;
  name: string;
  sortOrder: number;
}

interface DBSystem {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  subsystems: DBSubsystem[];
}

/* ─── Item editor row ─── */
function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: VariantItem;
  onChange: (updated: VariantItem) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        onChange({ ...item, iconUrl: data.url });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-background">
      {/* Icon preview / upload */}
      <div className="shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-14 h-14 rounded-lg border border-dashed border-border hover:border-brand-300 transition-colors cursor-pointer overflow-hidden group"
          disabled={uploading}
        >
          {item.iconUrl ? (
            <>
              <img src={item.iconUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </div>
            </>
          ) : uploading ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 group-hover:bg-brand-50/50">
              <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-brand-500" />
              <span className="text-[8px] text-muted-foreground mt-0.5">Загрузить</span>
            </div>
          )}
        </button>
        {item.iconUrl && (
          <button
            type="button"
            onClick={() => onChange({ ...item, iconUrl: null })}
            className="text-[9px] text-muted-foreground hover:text-destructive mt-1 block mx-auto cursor-pointer"
          >
            Удалить
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 space-y-2">
        <Input
          value={item.title}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
          placeholder="Заголовок"
          className="h-8 text-sm"
          autoComplete="one-time-code"
        />
        <Input
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          placeholder="Описание"
          className="h-8 text-xs"
          autoComplete="one-time-code"
        />
      </div>

      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={onRemove}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

/* ─── Подсказка по подготовке SVG-схем ─── */
function SchemesHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-brand-700">
          <HelpCircle className="w-4 h-4" />
          Как правильно подготовить SVG-схемы?
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-brand-700 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[12px] leading-relaxed text-foreground/80 space-y-3">
          <p>
            На карточке клиента в превью КП и в PDF используется до трёх схем:
            <span className="font-semibold"> «Вид системы»</span>,
            <span className="font-semibold"> «Вид двери»</span> и
            <span className="font-semibold"> «Вид сверху»</span>. Их рисует дизайнер
            в любом векторном редакторе (Figma, Illustrator) и сохраняет как .svg.
            Чтобы система автоматически подставила нужные размеры, перерисовала
            двери под фактическую ширину/высоту проёма и не сломала ручки —
            нужно соблюсти несколько простых правил.
          </p>

          <div>
            <p className="font-semibold text-brand-700 mb-1">1. Размер чертежа = размер двери в миллиметрах</p>
            <p>
              В редакторе ставьте холст (artboard) ровно по габаритам типичного
              проёма системы. Например для каскада 3+0 — 3000 × 2000 мм.
              Все остальные элементы (стекло, рамки, штанга) рисуйте в этом же
              масштабе. Это позволяет системе автоматически менять пропорции
              схемы под реальные размеры из калькуляции.
            </p>
          </div>

          <div>
            <p className="font-semibold text-brand-700 mb-1">2. Стекло двери — обязательно цвет #D5FFFF</p>
            <p>
              Залейте каждую дверь (стеклянное полотно) этим конкретным
              светло-голубым цветом. По нему движок понимает «вот это —
              стекло двери», находит его центр и привязывает к нему ручки.
              Если использовать другой оттенок — ручки лягут не туда.
            </p>
          </div>

          <div>
            <p className="font-semibold text-brand-700 mb-1">3. Слой «system» — всё, что должно тянуться</p>
            <p>
              В Figma/Illustrator сгруппируйте всё, что меняется при смене
              размеров проёма (двери, рамки, стёкла, штангу, профили), в одну
              группу и назовите её именно <code className="text-[11px] bg-muted px-1 py-0.5 rounded">system</code>{" "}
              (латиницей, без пробелов). При экспорте в SVG эта группа станет
              <code className="text-[11px] bg-muted px-1 py-0.5 rounded">{`<g id="system">`}</code> — система найдёт
              её и будет масштабировать только её содержимое, не трогая
              фон и подписи.
            </p>
          </div>

          <div>
            <p className="font-semibold text-brand-700 mb-1">4. Слой «handles» — для ручек</p>
            <p>
              Ручки сгруппируйте отдельно и назовите группу{" "}
              <code className="text-[11px] bg-muted px-1 py-0.5 rounded">handles</code>. Эта группа должна лежать
              <span className="font-semibold"> рядом</span> со слоем system, а не
              внутри него — иначе ручки будут сжиматься/растягиваться вместе с
              дверьми, и при больших проёмах станут уродливыми. Когда они в
              отдельной группе — система автоматически переносит их к крайним
              дверям, сохраняя их физический размер.
            </p>
          </div>

          <div>
            <p className="font-semibold text-brand-700 mb-1">5. Размеры в подписях — динамические</p>
            <p>
              Для <span className="font-semibold">вида системы</span> и{" "}
              <span className="font-semibold">вида двери</span> подписи общей
              ширины и высоты движок рисует поверх схемы сам — поэтому в SVG
              их вписывать не нужно, иначе будет дубль.
            </p>
            <p className="mt-2">
              Если в схеме всё же есть свои размерные полоски с цифрами
              (например в виде сверху между верхней / средней / нижней
              частью), линии и текст рисует дизайнер прямо в SVG. Чтобы числа
              не были «жёстко зашиты» под один размер, а менялись под
              фактический расчёт, в местах с числом напишите вместо самой
              цифры один из плейсхолдеров:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{"{{WIDTH}}"}</code> — общая ширина
                проёма (мм). В виде двери подставляется ширина одной двери.
              </li>
              <li>
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{"{{DOOR_WIDTH}}"}</code> — ширина
                одной двери (мм).
              </li>
              <li>
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{"{{GAP_MINUS_DOOR}}"}</code> —
                свободный проём, когда все двери сдвинуты в один край
                (= ширина проёма − ширина двери).
              </li>
              <li>
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{"{{HEIGHT}}"}</code> — высота
                проёма (мм).
              </li>
            </ul>
            <p className="mt-1">
              Например текстовый элемент{" "}
              <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{"<text>{{DOOR_WIDTH}} мм</text>"}</code>{" "}
              превратится при отрисовке в «1010 мм», если по расчёту дверь
              получилась 1010 мм.
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Примечание: для подсистемы «каскад 3+0» вид сверху рисуется
              автоматически — там вообще не нужен SVG-файл. Если вы видите в
              превью КП размерные полоски, которые вы не загружали — скорее
              всего это процедурная схема из встроенного движка, а не ваш SVG.
            </p>
          </div>

          <div>
            <p className="font-semibold text-brand-700 mb-1">6. Белая подложка</p>
            <p>
              Под все элементы положите большой белый прямоугольник. Иначе
              в зоне, где система дорисовывает размерные подписи, фон будет
              прозрачный и подсветится цветом страницы (часто серый).
            </p>
          </div>

          <div>
            <p className="font-semibold text-brand-700 mb-1">7. Тип каждой схемы</p>
            <p>
              Для каждой загруженной схемы выберите её тип:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>
                <span className="font-semibold">«Вид системы»</span> (system) —
                целая система во всю ширину проёма. Размер холста в редакторе
                задаётся как W × H проёма. <span className="text-muted-foreground">Здесь
                обязательно нужны слои <code className="text-[10px] bg-muted px-1 py-0.5 rounded">system</code> и{" "}
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">handles</code>.</span>
              </li>
              <li>
                <span className="font-semibold">«Вид двери»</span> (door) — одна
                дверь. Размер холста — ширина одной двери × высота проёма.{" "}
                <span className="text-muted-foreground">Здесь тоже нужны слои{" "}
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">system</code> и{" "}
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">handles</code>{" "}
                (одна ручка).</span>
              </li>
              <li>
                <span className="font-semibold">«Вид сверху»</span> (top) —
                разрез сверху, как доводчик и двери выглядят с потолка. Обычно
                широкое и невысокое изображение (соотношение 4:1 или 6:1).{" "}
                <span className="text-muted-foreground">Никаких специальных
                слоёв не требует — внутренние секции (верхняя/средняя/нижняя)
                рисуются просто как часть картинки.</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-brand-700 mb-1">8. Кратко про названия слоёв</p>
            <p>
              Системе важны только два названия слоёв:{" "}
              <code className="text-[10px] bg-muted px-1 py-0.5 rounded">system</code> (всё, что
              тянется под размер) и{" "}
              <code className="text-[10px] bg-muted px-1 py-0.5 rounded">handles</code> (ручки,
              которые сохраняют физический размер). Все остальные слои/группы
              можно называть как угодно или вообще не группировать —
              «верхняя/средняя/нижняя часть» в виде сверху, разные подгруппы
              профилей, фон, тени и т.д. движок не различает и просто
              отрисовывает как картинку.
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
            Подробная техническая инструкция со всеми тонкостями — в файле{" "}
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">docs/SVG_SCHEMES.md</code>{" "}
            проекта.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Variant editor ─── */
/* ─── Scheme editor row ─── */
function SchemeRow({
  scheme,
  onChange,
  onRemove,
}: {
  scheme: Scheme;
  onChange: (updated: Scheme) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onChange({ ...scheme, svgContent: text });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="p-3 rounded-lg border border-border/60 bg-background space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={scheme.label}
          onChange={(e) => onChange({ ...scheme, label: e.target.value })}
          placeholder="Вид спереди"
          className="h-8 text-sm flex-1"
          autoComplete="one-time-code"
        />
        <select
          value={scheme.ratioType || ""}
          onChange={(e) => onChange({ ...scheme, ratioType: e.target.value || null })}
          className="h-8 text-xs rounded-md border border-border bg-background px-2 w-44"
        >
          <optgroup label="Виды для PDF">
            <option value="system">Вид системы (адаптивный)</option>
            <option value="door">Дверь</option>
            <option value="side">Вид сбоку</option>
            <option value="top">Вид сверху</option>
          </optgroup>
          <option value="">— не указано —</option>
        </select>
        <input ref={fileRef} type="file" accept=".svg" className="hidden" onChange={handleFile} />
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="w-3.5 h-3.5" />
          {scheme.svgContent ? "Заменить" : "Загрузить"}
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={onRemove}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* SVG preview */}
      {scheme.svgContent && (
        <div className="bg-white border border-border/40 rounded-lg p-3 flex items-center justify-center">
          <div
            className="max-w-full max-h-32 [&>svg]:max-w-full [&>svg]:max-h-32 [&>svg]:w-auto [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: scheme.svgContent }}
          />
        </div>
      )}

      {/* Placeholders info */}
      <p className="text-[9px] text-muted-foreground">
        Плейсхолдеры в SVG: <code className="bg-muted px-1 rounded">{"{{WIDTH}}"}</code> ширина,
        <code className="bg-muted px-1 rounded ml-1">{"{{HEIGHT}}"}</code> высота,
        <code className="bg-muted px-1 rounded ml-1">{"{{DOOR_WIDTH}}"}</code> ширина двери,
        <code className="bg-muted px-1 rounded ml-1">{"{{DOORS}}"}</code> кол-во дверей
      </p>
    </div>
  );
}

function VariantEditor({
  initial,
  systemSlug,
  subsystemName,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Variant;
  systemSlug: string;
  subsystemName: string;
  onSave: (data: { variantName: string; railImageUrl: string | null; items: VariantItem[]; schemes: Scheme[] }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [variantName, setVariantName] = useState(initial?.variantName ?? "Вариант 1");
  const [railImageUrl, setRailImageUrl] = useState<string | null>(initial?.railImageUrl ?? null);
  const [uploadingRail, setUploadingRail] = useState(false);
  const railFileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<VariantItem[]>(
    initial?.items?.length ? initial.items : [
      { title: "", description: "", iconUrl: null },
      { title: "", description: "", iconUrl: null },
      { title: "", description: "", iconUrl: null },
    ]
  );
  const [schemes, setSchemes] = useState<Scheme[]>(initial?.schemes || []);

  async function handleRailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRail(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setRailImageUrl(data.url);
      }
    } finally {
      setUploadingRail(false);
      if (railFileRef.current) railFileRef.current.value = "";
    }
  }

  function updateItem(index: number, updated: VariantItem) {
    setItems(items.map((it, i) => i === index ? updated : it));
  }
  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }
  function addItem() {
    setItems([...items, { title: "", description: "", iconUrl: null }]);
  }

  function updateScheme(index: number, updated: Scheme) {
    setSchemes(schemes.map((s, i) => i === index ? updated : s));
  }
  function removeScheme(index: number) {
    setSchemes(schemes.filter((_, i) => i !== index));
  }
  function addScheme() {
    setSchemes([...schemes, { label: "", svgContent: "" }]);
  }

  return (
    <Card className="border-brand-200 bg-brand-50/30">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Название варианта</label>
            <Input value={variantName} onChange={(e) => setVariantName(e.target.value)} autoComplete="one-time-code" />
          </div>
          <div className="pt-5">
            <span className="text-xs text-muted-foreground">{systemSlug} → {subsystemName}</span>
          </div>
        </div>

        {/* Rail image */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Фото рельсы</p>
          <div className="flex items-start gap-3">
            <input ref={railFileRef} type="file" accept="image/*" className="hidden" onChange={handleRailUpload} />
            {railImageUrl ? (
              <img
                src={railImageUrl}
                alt="Рельса"
                className="w-28 h-20 rounded-lg object-contain bg-muted/40 border border-border"
              />
            ) : (
              <div className="w-28 h-20 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-1.5 flex-1">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => railFileRef.current?.click()} disabled={uploadingRail}>
                {uploadingRail ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                {railImageUrl ? "Заменить" : "Загрузить"}
              </Button>
              {railImageUrl && (
                <button onClick={() => setRailImageUrl(null)} className="text-[9px] text-muted-foreground hover:text-destructive cursor-pointer block">Удалить</button>
              )}
              <p className="text-[10px] text-muted-foreground leading-snug max-w-[260px]">
                Рекомендуемый формат: <span className="font-semibold">3:2</span> (например 600×400 px), фон
                — прозрачный или белый. В PDF картинка вписывается без обрезки, поэтому если стороны другие —
                по краям появятся поля. Поддерживаются PNG, JPG, WebP, SVG.
              </p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Карточки ({items.length})</p>
            <Button variant="outline" size="sm" onClick={addItem} className="h-7 gap-1 text-xs">
              <Plus className="w-3 h-3" /> Добавить
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <ItemRow
                key={i}
                item={item}
                onChange={(updated) => updateItem(i, updated)}
                onRemove={() => removeItem(i)}
              />
            ))}
          </div>
        </div>

        {/* SVG Schemes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SVG-схемы ({schemes.length})</p>
            <Button variant="outline" size="sm" onClick={addScheme} className="h-7 gap-1 text-xs">
              <Plus className="w-3 h-3" /> Добавить схему
            </Button>
          </div>
          <div className="mb-3">
            <SchemesHelp />
          </div>
          <div className="space-y-2">
            {schemes.map((scheme, i) => (
              <SchemeRow
                key={i}
                scheme={scheme}
                onChange={(updated) => updateScheme(i, updated)}
                onRemove={() => removeScheme(i)}
              />
            ))}
            {schemes.length === 0 && (
              <p className="text-[11px] text-muted-foreground py-2">Нет SVG-схем. Добавьте схемы видов системы.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="premium" onClick={() => onSave({ variantName, railImageUrl, items, schemes })} disabled={saving || !variantName.trim()} className="gap-1">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Сохранить
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1">
            <X className="w-3.5 h-3.5" /> Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main page ─── */
export default function VariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [systems, setSystems] = useState<DBSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null); // subsystemName
  const [saving, setSaving] = useState(false);

  const fetchVariants = useCallback(async () => {
    try {
      const res = await fetch("/api/variants");
      if (res.ok) setVariants(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/systems");
      if (res.ok) setSystems(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchVariants(), fetchSystems()]).finally(() => setLoading(false));
  }, [fetchVariants, fetchSystems]);

  const systemEntries = useMemo(
    () => systems.map((s) => [s.slug, s] as const),
    [systems]
  );

  const selectedSystemData = useMemo(
    () => systems.find((s) => s.slug === selectedSystem) ?? null,
    [systems, selectedSystem]
  );
  const subsystems = useMemo(
    () => (selectedSystemData ? selectedSystemData.subsystems.map((s) => s.name) : []),
    [selectedSystemData]
  );

  // Variants for selected system
  const systemVariants = useMemo(() => {
    if (!selectedSystem) return [];
    return variants.filter((v) => v.systemSlug === selectedSystem);
  }, [variants, selectedSystem]);

  async function handleCreate(subsystemName: string, data: { variantName: string; railImageUrl: string | null; items: VariantItem[]; schemes: Scheme[] }) {
    setSaving(true);
    await fetch("/api/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemSlug: selectedSystem, subsystemName, ...data }),
    });
    setAddingFor(null);
    await fetchVariants();
    setSaving(false);
  }

  async function handleUpdate(id: string, data: { variantName: string; railImageUrl: string | null; items: VariantItem[]; schemes: Scheme[] }) {
    setSaving(true);
    await fetch("/api/variants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    setEditingId(null);
    await fetchVariants();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/variants?id=${id}`, { method: "DELETE" });
    await fetchVariants();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <CompanyBrand size="sm" />
          <span className="text-sm font-semibold text-brand-600">Админ-панель</span>
        </div>
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl font-bold mb-1">Варианты подсистем</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Иконки, заголовки и описания для каждой подсистемы
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* Systems */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Системы</p>
              <div className="space-y-1.5">
                {systemEntries.map(([slug, sys]) => {
                  const count = variants.filter((v) => v.systemSlug === slug).length;
                  return (
                    <button
                      key={slug}
                      onClick={() => { setSelectedSystem(slug); setEditingId(null); setAddingFor(null); }}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all cursor-pointer flex items-center justify-between",
                        selectedSystem === slug ? "bg-brand-600 text-white shadow-sm" : "hover:bg-brand-50 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{sys.name}</span>
                      </div>
                      {count > 0 && (
                        <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", selectedSystem === slug ? "bg-white/20" : "bg-brand-100 text-brand-700")}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subsystems + Variants */}
            <div>
              {selectedSystem && selectedSystemData ? (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {selectedSystemData.name} — подсистемы
                  </p>

                  {subsystems.map((sub) => {
                    const variant = systemVariants.find((v) => v.subsystemName === sub);
                    const isEditing = variant && editingId === variant.id;
                    const isAdding = addingFor === sub && !variant;

                    return (
                      <div key={sub}>
                        {/* Subsystem header */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold">{sub}</h3>
                          {variant ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-brand-600 font-medium">{variant.variantName}</span>
                              <span className="text-[10px] text-muted-foreground">{variant.items.length} карточек</span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-brand-600" onClick={() => { setEditingId(variant.id); setAddingFor(null); }}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(variant.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => { setAddingFor(sub); setEditingId(null); }}>
                              <Plus className="w-3 h-3" /> Настроить вариант
                            </Button>
                          )}
                        </div>

                        {/* Editor or preview */}
                        {isEditing && variant && (
                          <VariantEditor
                            initial={variant}
                            systemSlug={selectedSystem}
                            subsystemName={sub}
                            onSave={(data) => handleUpdate(variant.id, data)}
                            onCancel={() => setEditingId(null)}
                            saving={saving}
                          />
                        )}

                        {isAdding && (
                          <VariantEditor
                            systemSlug={selectedSystem}
                            subsystemName={sub}
                            onSave={(data) => handleCreate(sub, data)}
                            onCancel={() => setAddingFor(null)}
                            saving={saving}
                          />
                        )}

                        {/* Preview cards */}
                        {variant && !isEditing && (variant.items.length > 0 || variant.schemes.length > 0) && (
                          <div className="space-y-3 mb-2">
                            {/* Cards preview */}
                            {variant.items.length > 0 && (
                              <div className="grid grid-cols-3 gap-3">
                                {variant.items.map((item, i) => (
                                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-card">
                                    {item.iconUrl ? (
                                      <img src={item.iconUrl} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-md bg-brand-50 flex items-center justify-center shrink-0">
                                        <ImageIcon className="w-4 h-4 text-brand-400" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold truncate">{item.title || "—"}</p>
                                      <p className="text-[10px] text-muted-foreground line-clamp-2">{item.description || "—"}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Schemes preview */}
                            {variant.schemes.length > 0 && (
                              <div className="grid grid-cols-3 gap-3">
                                {variant.schemes.map((scheme, i) => (
                                  <div key={i} className="p-2 rounded-lg border border-border/60 bg-white">
                                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">{scheme.label}</p>
                                    <div
                                      className="[&>svg]:max-w-full [&>svg]:h-auto [&>svg]:max-h-20"
                                      dangerouslySetInnerHTML={{ __html: scheme.svgContent.substring(0, 5000) }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* No variant yet */}
                        {!variant && !isAdding && (
                          <p className="text-[11px] text-muted-foreground mb-3">Вариант не настроен</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Layers className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Выберите систему</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
