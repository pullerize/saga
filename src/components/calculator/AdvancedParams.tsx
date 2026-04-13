"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Settings2,
  Truck,
  Hammer,
  Shield,
  Sparkles,
  ArrowUpFromLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvancedCalculationParams } from "@/lib/calculations/config";
import {
  wallMaterialLabels,
  complexityLabels,
  urgencyLabels,
} from "@/lib/calculations/config";

interface AdvancedParamsProps {
  params: AdvancedCalculationParams;
  onChange: (params: AdvancedCalculationParams) => void;
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border",
        selected
          ? "bg-brand-50 border-brand-300 text-brand-700 premium-shadow"
          : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function ServiceToggle({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 w-full text-left",
        checked
          ? "bg-brand-50 border-brand-300 text-brand-700 premium-shadow"
          : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 shrink-0",
          checked ? "text-brand-600" : "text-muted-foreground"
        )}
      />
      <span className="text-sm font-medium">{label}</span>
      {checked && (
        <Badge variant="gold" className="ml-auto text-xs">
          Выбрано
        </Badge>
      )}
    </button>
  );
}

export function AdvancedParams({ params, onChange }: AdvancedParamsProps) {
  const update = (partial: Partial<AdvancedCalculationParams>) => {
    onChange({ ...params, ...partial });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="w-5 h-5 text-brand-600" />
          Расширенные параметры
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wall Material */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Материал стены
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(wallMaterialLabels).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                selected={params.wallMaterial === value}
                onClick={() =>
                  update({
                    wallMaterial:
                      value as AdvancedCalculationParams["wallMaterial"],
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* Installation Complexity */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Сложность монтажа
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(complexityLabels).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                selected={params.installationComplexity === value}
                onClick={() =>
                  update({
                    installationComplexity:
                      value as AdvancedCalculationParams["installationComplexity"],
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Срочность
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(urgencyLabels).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                selected={params.urgency === value}
                onClick={() =>
                  update({
                    urgency:
                      value as AdvancedCalculationParams["urgency"],
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* Additional Services */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Дополнительные услуги
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <ServiceToggle
              label="Демонтаж старой двери"
              icon={Hammer}
              checked={params.needDemontage}
              onChange={(checked) => update({ needDemontage: checked })}
            />
            <ServiceToggle
              label="Доставка"
              icon={Truck}
              checked={params.needDelivery}
              onChange={(checked) => update({ needDelivery: checked })}
            />
            <ServiceToggle
              label="Армирование проёма"
              icon={Shield}
              checked={params.needReinforcement}
              onChange={(checked) => update({ needReinforcement: checked })}
            />
            <ServiceToggle
              label="Уборка после монтажа"
              icon={Sparkles}
              checked={params.needCleanup}
              onChange={(checked) => update({ needCleanup: checked })}
            />
            <ServiceToggle
              label="Подъём на этаж"
              icon={ArrowUpFromLine}
              checked={params.needLift}
              onChange={(checked) =>
                update({ needLift: checked, floor: checked ? params.floor : 1 })
              }
            />
          </div>
        </div>

        {/* Floor Input */}
        {params.needLift && (
          <div className="space-y-2 pl-1">
            <label className="text-sm font-medium text-foreground">
              Этаж
            </label>
            <div className="flex items-center gap-3 max-w-xs">
              <Input
                type="number"
                min={1}
                max={50}
                value={params.floor}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 50) {
                    update({ floor: val });
                  }
                }}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {params.floor > 1
                  ? `Подъём: ${params.floor - 1} ${params.floor - 1 === 1 ? "этаж" : params.floor - 1 < 5 ? "этажа" : "этажей"}`
                  : "Без подъёма (1 этаж)"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
