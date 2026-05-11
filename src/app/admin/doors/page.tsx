"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Check,
  AlertCircle,
} from "lucide-react";
import { systemsData } from "@/lib/calculations/systemsData";
import { shotlanOptions } from "@/lib/calculations/constants";

interface DoorScheme {
  id: string;
  systemSlug: string;
  subsystemName: string;
  shotlanType: string;
  svgContent: string;
}

// Системы, у которых ВКЛ. подсистемы (каскад/синхрон и т.д.).
const SYSTEMS = Object.entries(systemsData).map(([slug, sys]) => ({
  slug,
  name: sys.name,
  subsystems: Object.keys(sys.subsystems),
}));

export default function AdminDoorsPage() {
  const [doors, setDoors] = useState<DoorScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string>(SYSTEMS[0]?.slug ?? "");
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("");
  const [uploadingFor, setUploadingFor] = useState<string>("");
  const [error, setError] = useState("");

  const subsystems = useMemo(
    () => SYSTEMS.find((s) => s.slug === selectedSystem)?.subsystems ?? [],
    [selectedSystem],
  );

  // При смене системы — выбрать первую подсистему
  useEffect(() => {
    if (subsystems.length > 0 && !subsystems.includes(selectedSubsystem)) {
      setSelectedSubsystem(subsystems[0]);
    }
  }, [subsystems, selectedSubsystem]);

  const fetchDoors = useCallback(async () => {
    if (!selectedSystem || !selectedSubsystem) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/doors?systemSlug=${encodeURIComponent(selectedSystem)}&subsystemName=${encodeURIComponent(selectedSubsystem)}`,
      );
      if (res.ok) setDoors(await res.json());
    } finally {
      setLoading(false);
    }
  }, [selectedSystem, selectedSubsystem]);

  useEffect(() => { fetchDoors(); }, [fetchDoors]);

  // Карта shotlan → DoorScheme для текущей подсистемы
  const byShotlan = useMemo(() => {
    const map: Record<string, DoorScheme> = {};
    for (const d of doors) {
      if (d.systemSlug === selectedSystem && d.subsystemName === selectedSubsystem) {
        map[d.shotlanType] = d;
      }
    }
    return map;
  }, [doors, selectedSystem, selectedSubsystem]);

  async function handleUpload(shotlanType: string, file: File) {
    setUploadingFor(shotlanType);
    setError("");
    try {
      const text = await file.text();
      const res = await fetch("/api/doors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemSlug: selectedSystem,
          subsystemName: selectedSubsystem,
          shotlanType,
          svgContent: text,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Не удалось загрузить дверь");
        return;
      }
      await fetchDoors();
    } finally {
      setUploadingFor("");
    }
  }

  async function handleDelete(door: DoorScheme) {
    if (!confirm(`Удалить дверь «${door.shotlanType}»?`)) return;
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
          <span className="text-sm font-semibold text-brand-600">Двери (по шотланкам)</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Двери по шотланкам</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Для каждой подсистемы загружаются отдельные SVG-двери под разные типы
            шотланок. При выборе клиентом конкретной шотланки — система автоматически
            подтягивает соответствующий SVG в слот «Вид двери».
          </p>
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
              {SYSTEMS.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name} ({s.slug})</option>
              ))}
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

        {/* Matrix: shotlan → door */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Загрузка...
          </div>
        ) : (
          <div className="grid gap-3">
            {shotlanOptions.map((shotlanType) => {
              const door = byShotlan[shotlanType];
              const isUploading = uploadingFor === shotlanType;
              return (
                <Card key={shotlanType}>
                  <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-32 h-24 rounded-lg bg-muted/40 border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {door ? (
                        <div
                          className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                          dangerouslySetInnerHTML={{ __html: door.svgContent }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{shotlanType}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {door ? "✓ SVG загружен" : "SVG не загружен — слот «Вид двери» возьмёт fallback"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <FileButton
                        label={door ? "Заменить" : "Загрузить"}
                        accept=".svg,image/svg+xml"
                        disabled={isUploading}
                        onPick={(f) => handleUpload(shotlanType, f)}
                      />
                      {door && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(door)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Удалить
                        </Button>
                      )}
                      {isUploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {door && !isUploading && <Check className="w-4 h-4 text-brand-600" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
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
        className="gap-1"
        disabled={disabled}
        onClick={() => ref.current?.click()}
      >
        <Upload className="w-3.5 h-3.5" />
        {label}
      </Button>
    </>
  );
}
