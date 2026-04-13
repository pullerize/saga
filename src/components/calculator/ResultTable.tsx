"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import type { CalcComponent } from "@/lib/calculations/engine";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResultTableProps {
  components: CalcComponent[];
  totalPrice: number;
  systemName: string;
  doorWidth: number;
  subsystemId?: string | null;
  glass?: string | null;
  shotlan?: string | null;
  fullWidth?: number;
  height?: number;
  onBack?: () => void;
}

export function ResultTable({
  components,
  totalPrice,
  systemName,
  doorWidth,
  subsystemId,
  glass,
  shotlan,
  fullWidth,
  height,
  onBack,
}: ResultTableProps) {
  return (
    <div className="fixed inset-0 top-16 z-40 flex flex-col bg-background overflow-hidden">
      {/* Header bar */}
      <div className="brand-gradient shrink-0">
        <div className="px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
          <div>
            <p className="text-brand-200/50 text-[10px] uppercase tracking-widest leading-none mb-1">Результат расчёта</p>
            <h2 className="font-display text-base sm:text-lg font-bold text-white">
              {systemName}
            </h2>
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-white tabular-nums">
            {formatPrice(totalPrice)}
            <span className="text-[10px] text-brand-200/50 ml-1">у.е.</span>
          </p>
        </div>
      </div>

      {/* Table area — takes all remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
            <tr className="border-b border-border/50">
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-4 sm:pl-8 lg:pl-12 pr-2 py-2.5 w-10">
                №
              </th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2.5">
                Наименование
              </th>
              <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2.5 w-24">
                Кол-во
              </th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2.5 w-24">
                Цена
              </th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pl-2 pr-4 sm:pr-8 lg:pr-12 py-2.5 w-28">
                Сумма
              </th>
            </tr>
          </thead>
          <tbody>
            {components.map((comp, i) => (
              <tr
                key={`${comp.key}-${i}`}
                className={cn(
                  "border-b border-border/15 last:border-0 hover:bg-brand-50/40 transition-colors group",
                  i % 2 === 1 && "bg-muted/8"
                )}
              >
                <td className="pl-4 sm:pl-8 lg:pl-12 pr-2 py-2 text-[11px] text-muted-foreground/50 tabular-nums">
                  {i + 1}
                </td>
                <td className="px-2 py-2 text-[13px] font-medium text-foreground group-hover:text-brand-700 transition-colors">
                  {comp.name}
                </td>
                <td className="px-2 py-2 text-[13px] text-center tabular-nums">
                  <span className="font-medium text-foreground">
                    {typeof comp.qty === "number" && comp.qty % 1 !== 0
                      ? comp.qty.toFixed(2)
                      : comp.qty}
                  </span>
                  {comp.unit && (
                    <span className="text-[11px] text-muted-foreground ml-0.5">{comp.unit}</span>
                  )}
                </td>
                <td className="px-2 py-2 text-[13px] text-right text-muted-foreground tabular-nums">
                  {formatPrice(comp.price)}
                </td>
                <td className="pl-2 pr-4 sm:pr-8 lg:pr-12 py-2 text-[13px] text-right font-semibold tabular-nums text-foreground">
                  {formatPrice(comp.sum)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom bar — always visible */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 sm:px-8 lg:px-12 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Итого:</span>
          <span className="text-base font-bold text-brand-700 tabular-nums">{formatPrice(totalPrice)} у.е.</span>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => window.print()}>
          <FileText className="w-3.5 h-3.5" />
          Печать
        </Button>
      </div>
    </div>
  );
}

