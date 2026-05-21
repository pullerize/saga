"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import Link from "next/link";
import { CompanyBrand } from "@/components/shared/CompanyBrand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Upload,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { shotlanOptions } from "@/lib/calculations/constants";
import {
  HEIGHT_CATEGORIES,
  WIDTH_CATEGORIES,
  SIZE_CATEGORY_LABEL_SHORT,
  DEFAULT_SIZE_RANGES,
  parseSizeRanges,
  heightLabelsFromRanges,
  widthLabelsFromRanges,
  type HeightCategory,
  type WidthCategory,
  type SizeRanges,
  type Bands,
} from "@/lib/calculations/sizeCategory";

interface DoorScheme {
  id: string;
  systemSlug: string;
  subsystemName: string;
  viewType: "system" | "top" | "door";
  shotlanType: string | null;
  svgContent: string;
  heightCategory: HeightCategory | null;
  widthCategory: WidthCategory | null;
}

interface DBSubsystem {
  id: string;
  name: string;
  sortOrder: number;
  sizeRanges?: unknown;
}
interface DBSystem {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  subsystems: DBSubsystem[];
}

// Уникальный ключ для UI-состояния «эта ячейка сейчас загружается».
// Для top viewType heightCategory всегда null — кодируется как "_".
type CellKey = string;
function makeKey(viewType: string, shotlanType: string | null, h: HeightCategory | null, w: WidthCategory): CellKey {
  return `${viewType}::${shotlanType ?? ""}::${h ?? "_"}::${w}`;
}

export default function AdminDoorsPage() {
  // Список систем и их подсистем — из БД (только реально настроенные в
  // /admin/systems). Раньше брался из хардкода systemsData со всеми 7
  // системами; пользователь видел в селекторе много неиспользуемых.
  const [systems, setSystems] = useState<DBSystem[]>([]);
  const [doors, setDoors] = useState<DoorScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("");
  const [uploadingFor, setUploadingFor] = useState<CellKey | "">("");
  const [error, setError] = useState("");

  // Грузим системы один раз; ставим первую выбранной.
  useEffect(() => {
    fetch("/api/systems")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: DBSystem[]) => {
        const list = Array.isArray(rows) ? rows : [];
        setSystems(list);
        if (list.length > 0) setSelectedSystem((prev) => prev || list[0].slug);
      })
      .catch(() => setSystems([]));
  }, []);

  const subsystemObjs = useMemo(() => {
    const sys = systems.find((s) => s.slug === selectedSystem);
    return sys ? sys.subsystems : [];
  }, [systems, selectedSystem]);
  const subsystems = useMemo(() => subsystemObjs.map((s) => s.name), [subsystemObjs]);

  useEffect(() => {
    if (subsystems.length > 0 && !subsystems.includes(selectedSubsystem)) {
      setSelectedSubsystem(subsystems[0]);
    }
  }, [subsystems, selectedSubsystem]);

  // Текущая подсистема и её диапазоны размеров (кастомные или дефолтные).
  const currentSub = useMemo(
    () => subsystemObjs.find((s) => s.name === selectedSubsystem) ?? null,
    [subsystemObjs, selectedSubsystem],
  );
  const ranges = useMemo(() => parseSizeRanges(currentSub?.sizeRanges), [currentSub]);
  const heightLabels = useMemo(() => heightLabelsFromRanges(ranges), [ranges]);
  const widthLabels = useMemo(() => widthLabelsFromRanges(ranges), [ranges]);

  // Локальное состояние редактора диапазонов (синхронизируется при смене подсистемы).
  const [draftRanges, setDraftRanges] = useState<SizeRanges>(DEFAULT_SIZE_RANGES);
  const [savingRanges, setSavingRanges] = useState(false);
  useEffect(() => { setDraftRanges(ranges); }, [ranges]);

  const setBand = (axis: "heightBands" | "widthBands", idx: number, value: string) => {
    setDraftRanges((prev) => {
      const next: Bands = [...prev[axis]] as Bands;
      next[idx] = Number(value);
      return { ...prev, [axis]: next };
    });
  };

  async function saveRanges() {
    if (!currentSub) return;
    setSavingRanges(true);
    setError("");
    try {
      const res = await fetch("/api/subsystems", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentSub.id, sizeRanges: draftRanges }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Не удалось сохранить диапазоны");
        return;
      }
      // Обновляем системы, чтобы метки/подбор подхватили новые диапазоны.
      const sysRes = await fetch("/api/systems");
      if (sysRes.ok) setSystems(await sysRes.json());
    } finally {
      setSavingRanges(false);
    }
  }

  // initialLoad — для первого fetch'a при загрузке страницы. Последующие
  // refetch'ы (после upload/delete) не должны сворачивать всю сетку в
  // спиннер — иначе React перемонтирует поддерево и страница «улетает вверх».
  const initialLoadRef = useRef(true);
  const fetchDoors = useCallback(async () => {
    if (!selectedSystem || !selectedSubsystem) return;
    if (initialLoadRef.current) setLoading(true);
    try {
      const res = await fetch(
        `/api/doors?systemSlug=${encodeURIComponent(selectedSystem)}&subsystemName=${encodeURIComponent(selectedSubsystem)}`,
      );
      if (res.ok) setDoors(await res.json());
    } finally {
      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
    }
  }, [selectedSystem, selectedSubsystem]);

  // При смене системы/подсистемы заново показываем спиннер при первой загрузке.
  useEffect(() => { initialLoadRef.current = true; }, [selectedSystem, selectedSubsystem]);

  useEffect(() => { fetchDoors(); }, [fetchDoors]);

  // Карта поиска SVG по (viewType, shotlanType, h, w) → DoorScheme.
  // У top viewType heightCategory = null (вид сверху не зависит от высоты).
  const byCell = useMemo(() => {
    const map: Record<string, DoorScheme> = {};
    for (const d of doors) {
      if (d.systemSlug !== selectedSystem || d.subsystemName !== selectedSubsystem) continue;
      if (!d.widthCategory) continue;
      // Для top допускаем heightCategory=null; для остальных требуем оба.
      if (d.viewType !== "top" && !d.heightCategory) continue;
      const key = makeKey(d.viewType, d.shotlanType, d.viewType === "top" ? null : d.heightCategory, d.widthCategory);
      map[key] = d;
    }
    return map;
  }, [doors, selectedSystem, selectedSubsystem]);

  function loadedCount(viewType: "system" | "top" | "door", shotlanType: string | null) {
    let n = 0;
    if (viewType === "top") {
      // 1×3: только ширина.
      for (const w of WIDTH_CATEGORIES) {
        if (byCell[makeKey("top", shotlanType, null, w)]) n++;
      }
      return n;
    }
    for (const h of HEIGHT_CATEGORIES) {
      for (const w of WIDTH_CATEGORIES) {
        if (byCell[makeKey(viewType, shotlanType, h, w)]) n++;
      }
    }
    return n;
  }

  async function handleUpload(
    viewType: "system" | "top" | "door",
    shotlanType: string | null,
    heightCategory: HeightCategory | null,
    widthCategory: WidthCategory,
    file: File,
  ) {
    const key = makeKey(viewType, shotlanType, heightCategory, widthCategory);
    setUploadingFor(key);
    setError("");
    try {
      const text = await file.text();
      const res = await fetch("/api/doors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemSlug: selectedSystem,
          subsystemName: selectedSubsystem,
          viewType,
          shotlanType,
          heightCategory,
          widthCategory,
          svgContent: text,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Не удалось загрузить SVG");
        return;
      }
      await fetchDoors();
    } finally {
      setUploadingFor("");
    }
  }

  async function handleDelete(door: DoorScheme) {
    const labelH = door.heightCategory ? SIZE_CATEGORY_LABEL_SHORT[door.heightCategory] : "?";
    const labelW = door.widthCategory ? SIZE_CATEGORY_LABEL_SHORT[door.widthCategory] : "?";
    const titlePrefix = door.viewType === "door"
      ? `«${door.shotlanType}»`
      : door.viewType === "system" ? "«Вид системы»" : "«Вид сверху»";
    if (!confirm(`Удалить SVG ${titlePrefix} (${labelH} × ${labelW})?`)) return;
    setError("");
    const res = await fetch(`/api/doors?id=${encodeURIComponent(door.id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не удалось удалить");
      return;
    }
    await fetchDoors();
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
          <span className="text-sm font-semibold text-brand-600">Схемы (вид системы, вид сверху, двери)</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Схемы подсистемы</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Для каждой подсистемы загружаются SVG-схемы трёх типов:{" "}
            <strong>«Вид системы»</strong>, <strong>«Вид сверху»</strong> и{" "}
            <strong>«Вид двери»</strong> (отдельно на каждую шотланку). У каждого
            типа — <strong>9 категорий размеров</strong> (3 высоты × 3 ширины).
            При создании карточки клиента нужный SVG выбирается по фактическим
            размерам проёма.
          </p>
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Категории</strong> задаются для каждой подсистемы отдельно
            (ниже, в блоке «Диапазоны размеров»). По умолчанию: высота — низкая 1800–2400, средняя 2400–2900,
            высокая 2900–3300 мм; ширина — узкая 1615–2100, средняя 2100–3000, широкая 3000–4500 мм.
            <span className="block mt-1 opacity-75">За пределами диапазонов берётся ближайшая категория.</span>
          </div>
        </div>

        {/* System / Subsystem selectors */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Система</label>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 cursor-pointer"
            >
              {systems.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name} ({s.slug})</option>
              ))}
              {systems.length === 0 && (
                <option value="" disabled>Нет настроенных систем в /admin/systems</option>
              )}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Подсистема</label>
            <select
              value={selectedSubsystem}
              onChange={(e) => setSelectedSubsystem(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 cursor-pointer"
            >
              {subsystems.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Загрузка...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Редактор диапазонов размеров для выбранной подсистемы */}
            <SizeRangesEditor
              draft={draftRanges}
              defaultRanges={DEFAULT_SIZE_RANGES}
              setBand={setBand}
              onSave={saveRanges}
              saving={savingRanges}
              onReset={() => setDraftRanges(DEFAULT_SIZE_RANGES)}
              disabled={!currentSub}
            />

            {/* Вид системы */}
            <SchemeMatrix
              title="Вид системы"
              total={loadedCount("system", null)}
              heightLabels={heightLabels}
              widthLabels={widthLabels}
              renderCell={(h, w) => {
                const door = byCell[makeKey("system", null, h, w)];
                const key = makeKey("system", null, h, w);
                return (
                  <CategoryCell
                    door={door}
                    isUploading={uploadingFor === key}
                    onUpload={(file) => handleUpload("system", null, h, w, file)}
                    onDelete={() => door && handleDelete(door)}
                  />
                );
              }}
            />

            {/* Вид сверху — только 3 категории по ширине (узкая/средняя/широкая),
                высоту проёма не учитываем. */}
            <SchemeMatrixWidthOnly
              title="Вид сверху"
              total={loadedCount("top", null)}
              widthLabels={widthLabels}
              renderCell={(w) => {
                const door = byCell[makeKey("top", null, null, w)];
                const key = makeKey("top", null, null, w);
                return (
                  <CategoryCell
                    door={door}
                    isUploading={uploadingFor === key}
                    onUpload={(file) => handleUpload("top", null, null, w, file)}
                    onDelete={() => door && handleDelete(door)}
                  />
                );
              }}
            />

            {/* Виды двери — по каждой шотланке */}
            <div className="pt-4 border-t border-border/40">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Вид двери — по шотланкам
              </h2>
              <div className="space-y-4">
                {shotlanOptions.map((shotlanType) => {
                  const total = loadedCount("door", shotlanType);
                  return (
                    <SchemeMatrix
                      key={shotlanType}
                      title={shotlanType}
                      total={total}
                      heightLabels={heightLabels}
                      widthLabels={widthLabels}
                      renderCell={(h, w) => {
                        const door = byCell[makeKey("door", shotlanType, h, w)];
                        const key = makeKey("door", shotlanType, h, w);
                        return (
                          <CategoryCell
                            door={door}
                            isUploading={uploadingFor === key}
                            onUpload={(file) => handleUpload("door", shotlanType, h, w, file)}
                            onDelete={() => door && handleDelete(door)}
                          />
                        );
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SchemeMatrix({
  title,
  total,
  renderCell,
  heightLabels,
  widthLabels,
}: {
  title: string;
  total: number;
  renderCell: (h: HeightCategory, w: WidthCategory) => React.ReactNode;
  heightLabels: Record<HeightCategory, string>;
  widthLabels: Record<WidthCategory, string>;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">{title}</h2>
          <span className={`text-xs ${total === 9 ? "text-brand-600 font-medium" : "text-muted-foreground"}`}>
            {total} / 9 SVG загружено
          </span>
        </div>
        <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-2 text-xs">
          <div />
          {WIDTH_CATEGORIES.map((w) => (
            <div key={w} className="text-center font-medium text-muted-foreground px-1">
              {widthLabels[w]}
            </div>
          ))}
          {HEIGHT_CATEGORIES.map((h) => (
            <Fragment key={h}>
              <div className="flex items-center pr-1 font-medium text-muted-foreground text-right">
                {heightLabels[h]}
              </div>
              {WIDTH_CATEGORIES.map((w) => (
                <Fragment key={w}>{renderCell(h, w)}</Fragment>
              ))}
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Матрица 1×3 — только по ширине, без высоты (для «Вид сверху»). */
function SchemeMatrixWidthOnly({
  title,
  total,
  renderCell,
  widthLabels,
}: {
  title: string;
  total: number;
  renderCell: (w: WidthCategory) => React.ReactNode;
  widthLabels: Record<WidthCategory, string>;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">{title}</h2>
          <span className={`text-xs ${total === 3 ? "text-brand-600 font-medium" : "text-muted-foreground"}`}>
            {total} / 3 SVG загружено
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {WIDTH_CATEGORIES.map((w) => (
            <div key={w} className="text-center font-medium text-muted-foreground px-1">
              {widthLabels[w]}
            </div>
          ))}
          {WIDTH_CATEGORIES.map((w) => (
            <Fragment key={w}>{renderCell(w)}</Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCell({
  door,
  isUploading,
  onUpload,
  onDelete,
}: {
  door: DoorScheme | undefined;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-md border ${door ? "border-brand-500/30 bg-brand-50/30" : "border-border/60 bg-muted/20"} p-1.5 flex flex-col gap-1.5`}>
      <div className="h-20 rounded bg-white border border-border/40 flex items-center justify-center overflow-hidden">
        {door ? (
          <div
            className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: door.svgContent }}
          />
        ) : (
          <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
        )}
      </div>
      <div className="flex gap-1">
        <FileButton
          label={door ? "Заменить" : "Загрузить"}
          accept=".svg,image/svg+xml"
          disabled={isUploading}
          onPick={onUpload}
        />
        {door && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
        {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground self-center" />}
      </div>
    </div>
  );
}

function FileButton({
  label,
  accept,
  disabled,
  onPick,
}: {
  label: string;
  accept: string;
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="gap-1 h-7 px-2 text-xs flex-1"
        disabled={disabled}
        onClick={() => ref.current?.click()}
      >
        <Upload className="w-3 h-3" />
        {label}
      </Button>
    </>
  );
}

/** Редактор диапазонов размеров (3 полосы по высоте и 3 по ширине) для подсистемы. */
function SizeRangesEditor({
  draft,
  defaultRanges,
  setBand,
  onSave,
  onReset,
  saving,
  disabled,
}: {
  draft: SizeRanges;
  defaultRanges: SizeRanges;
  setBand: (axis: "heightBands" | "widthBands", idx: number, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  const isDefault =
    JSON.stringify(draft.heightBands) === JSON.stringify(defaultRanges.heightBands) &&
    JSON.stringify(draft.widthBands) === JSON.stringify(defaultRanges.widthBands);

  const num = (v: number, onChange: (val: string) => void) => (
    <input
      type="number"
      value={Number.isFinite(v) ? v : ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-50"
    />
  );

  const axisRow = (
    axis: "heightBands" | "widthBands",
    labels: [string, string, string],
  ) => {
    const b = draft[axis];
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="w-16 text-xs font-medium text-muted-foreground shrink-0">
          {axis === "heightBands" ? "Высота" : "Ширина"}
        </span>
        {([0, 1, 2] as const).map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">{labels[i]}</span>
            {num(b[i], (val) => setBand(axis, i, val))}
            <span className="text-[11px] text-muted-foreground">–</span>
            {num(b[i + 1], (val) => setBand(axis, i + 1, val))}
          </div>
        ))}
        <span className="text-[11px] text-muted-foreground">мм</span>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Диапазоны размеров (для этой подсистемы)</h2>
          {!isDefault && <span className="text-xs text-brand-600 font-medium">изменено</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          Границы трёх категорий по высоте (низкая/средняя/высокая) и ширине
          (узкая/средняя/широкая). Соседние поля связаны: конец одной полосы — начало следующей.
        </p>
        <div className="space-y-3 pt-1">
          {axisRow("heightBands", ["Низкая", "Средняя", "Высокая"])}
          {axisRow("widthBands", ["Узкая", "Средняя", "Широкая"])}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button variant="premium" size="sm" onClick={onSave} disabled={disabled || saving} className="gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Сохранить диапазоны
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} disabled={disabled || saving}>
            Сбросить к стандартным
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
