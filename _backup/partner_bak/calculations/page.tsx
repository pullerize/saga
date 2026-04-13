"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react";
import type { Calculation, CalculatedComponent } from "@/types";

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "success" | "destructive" }> = {
  draft: { label: "Черновик", variant: "secondary" },
  sent: { label: "Отправлен", variant: "default" },
  ordered: { label: "Заказан", variant: "outline" },
  completed: { label: "Выполнен", variant: "success" },
};

const PAGE_SIZE = 10;

export default function PartnerCalculationsPage() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCalculations() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/calculations?page=${page}&limit=${PAGE_SIZE}`
        );
        if (res.ok) {
          const data = await res.json();
          const items = data.calculations ?? data ?? [];
          setCalculations(items);
          setTotal(data.total ?? items.length);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchCalculations();
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Мои расчёты
        </h1>
        <p className="text-muted-foreground mt-1">
          История выполненных расчётов
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground">
              Загрузка...
            </div>
          ) : calculations.length === 0 ? (
            <div className="p-10 text-center">
              <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Расчётов пока нет</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Дата
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Клиент
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Система
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Размеры
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Сумма
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      Статус
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((calc) => {
                    const expanded = expandedId === calc.id;
                    const status = statusConfig[calc.status] ?? statusConfig.draft;
                    const date = new Date(calc.createdAt).toLocaleDateString(
                      "ru-RU",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    );

                    return (
                      <>
                        <tr
                          key={calc.id}
                          className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedId(expanded ? null : calc.id)
                          }
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {date}
                          </td>
                          <td className="px-4 py-3">
                            {calc.customerName || "---"}
                          </td>
                          <td className="px-4 py-3">
                            <div>{calc.glassType}</div>
                            <div className="text-xs text-muted-foreground">
                              {calc.shotlanType}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {calc.fullWidth}
                            {calc.openWidth ? ` / ${calc.openWidth}` : ""} x{" "}
                            {calc.height} мм
                          </td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                            {formatPrice(calc.totalPrice)} сум
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {expanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </td>
                        </tr>
                        {expanded && (
                          <tr key={`${calc.id}-detail`}>
                            <td colSpan={7} className="px-4 py-4 bg-muted/20">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Компоненты:
                                </p>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-muted-foreground">
                                      <th className="text-left py-1">
                                        Наименование
                                      </th>
                                      <th className="text-right py-1">
                                        Кол-во
                                      </th>
                                      <th className="text-right py-1">
                                        Цена
                                      </th>
                                      <th className="text-right py-1">
                                        Сумма
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(calc.components ?? []).map(
                                      (comp: CalculatedComponent, i: number) => (
                                        <tr
                                          key={i}
                                          className="border-t border-muted"
                                        >
                                          <td className="py-1">
                                            {comp.name}
                                          </td>
                                          <td className="text-right py-1">
                                            {comp.qty} {comp.unit}
                                          </td>
                                          <td className="text-right py-1">
                                            {formatPrice(comp.price)}
                                          </td>
                                          <td className="text-right py-1 font-medium">
                                            {formatPrice(comp.sum)}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                                <div className="text-right font-semibold pt-2 border-t">
                                  Итого: {formatPrice(calc.totalPrice)} сум
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Страница {page} из {totalPages} (всего {total})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
