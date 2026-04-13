"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Loader2,
  AlertCircle,
  DoorOpen,
  ChevronDown,
  ChevronRight,
  Layers,
  Ruler,
} from "lucide-react";

interface Subsystem {
  id: string;
  name: string;
  minWidth: number | null;
  maxWidth: number | null;
  minHeight: number | null;
  maxHeight: number | null;
  params: Record<string, unknown> | null;
  isActive: boolean;
}

interface DoorSystem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  minWidth: number | null;
  maxWidth: number | null;
  minHeight: number | null;
  maxHeight: number | null;
  isActive: boolean;
  subsystems: Subsystem[];
}

export default function SystemsPage() {
  const [systems, setSystems] = useState<DoorSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchSystems() {
      try {
        const res = await fetch("/api/systems");
        if (!res.ok) throw new Error("Не удалось загрузить системы");
        const data = await res.json();
        setSystems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }
    fetchSystems();
  }, []);

  function toggleExpanded(id: string) {
    setExpandedSystems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function formatRange(min: number | null, max: number | null, unit = "мм"): string {
    if (min != null && max != null) return `${min}–${max} ${unit}`;
    if (min != null) return `от ${min} ${unit}`;
    if (max != null) return `до ${max} ${unit}`;
    return "—";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-muted-foreground text-sm">Загрузка систем...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
      <div>
        <h1 className="font-display text-3xl font-bold">Дверные системы</h1>
        <p className="text-muted-foreground mt-1">
          Обзор всех систем и подсистем (только чтение)
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                <DoorOpen className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{systems.length}</p>
                <p className="text-xs text-muted-foreground">Всего систем</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {systems.reduce((sum, s) => sum + s.subsystems.length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Всего подсистем</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {systems.reduce(
                    (sum, s) => sum + s.subsystems.filter((ss) => ss.isActive).length,
                    0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Активных подсистем</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Systems grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {systems.map((system) => {
          const isExpanded = expandedSystems.has(system.id);
          const activeSubsystems = system.subsystems.filter((ss) => ss.isActive);

          return (
            <Card key={system.id} className={cn(!system.isActive && "opacity-60")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DoorOpen className="w-5 h-5 text-brand-500" />
                      {system.name}
                    </CardTitle>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {system.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {system.isActive ? (
                      <Badge variant="success">Активна</Badge>
                    ) : (
                      <Badge variant="secondary">Неактивна</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {system.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {system.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ширина:</span>
                    <span className="font-medium">
                      {formatRange(system.minWidth, system.maxWidth)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Высота:</span>
                    <span className="font-medium">
                      {formatRange(system.minHeight, system.maxHeight)}
                    </span>
                  </div>
                </div>

                {/* Subsystems toggle */}
                <button
                  onClick={() => toggleExpanded(system.id)}
                  className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  Подсистемы
                  <Badge variant="secondary" className="ml-1">
                    {activeSubsystems.length} / {system.subsystems.length}
                  </Badge>
                </button>

                {/* Subsystem details */}
                {isExpanded && system.subsystems.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {system.subsystems.map((sub) => {
                      const paramsCount = sub.params
                        ? Object.keys(sub.params).length
                        : 0;

                      return (
                        <div
                          key={sub.id}
                          className={cn(
                            "rounded-lg border p-3 bg-muted/30",
                            !sub.isActive && "opacity-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{sub.name}</span>
                              {!sub.isActive && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Неактивна
                                </Badge>
                              )}
                            </div>
                            {paramsCount > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                {paramsCount} парам.
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                            <span>
                              Ширина: {formatRange(sub.minWidth, sub.maxWidth)}
                            </span>
                            <span>
                              Высота: {formatRange(sub.minHeight, sub.maxHeight)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && system.subsystems.length === 0 && (
                  <p className="mt-3 text-sm text-muted-foreground italic">
                    Подсистемы не найдены
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {systems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <DoorOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Системы не найдены в базе данных</p>
        </div>
      )}
    </div>
  );
}
