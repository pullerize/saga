"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCalculatorStore } from "@/stores/calculator";
import { StepsBar } from "./StepsBar";
import { DimensionInputs, DoorPreviewWrapper } from "./DimensionInputs";
import { SubsystemSelector } from "./SubsystemSelector";
import { GlassSelector } from "./GlassSelector";
import { ShotlanSelector } from "./ShotlanSelector";
import { ResultTable } from "./ResultTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { systemsData, getAvailableSubsystems } from "@/lib/calculations/systemsData";
import { calculateTotal } from "@/lib/calculations/engine";
import { calculateWithDB } from "@/lib/calculations/calculateWithDB";

const defaultSteps = [
  { label: "Подсистема", description: "Параметры и подсистема" },
  { label: "Стекло", description: "Тип стекла" },
  { label: "Шотланки", description: "Разделители" },
  { label: "Результат", description: "Расчёт" },
];

interface CalculatorWizardProps {
  systemType: string;
}

export function CalculatorWizard({ systemType }: CalculatorWizardProps) {
  const store = useCalculatorStore();
  const system = systemsData[systemType];
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitRef = useRef(false);

  // Sync URL query params with store selections
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    // Update params based on current store state
    const setParam = (key: string, value: string | null | undefined) => {
      if (value) {
        if (params.get(key) !== value) { params.set(key, value); changed = true; }
      } else {
        if (params.has(key)) { params.delete(key); changed = true; }
      }
    };

    setParam("sub", store.subsystemId);
    setParam("glass", store.glass);
    setParam("shotlan", store.shotlan);
    setParam("step", store.currentStep > 0 ? String(store.currentStep) : null);

    if (changed) {
      const qs = params.toString();
      router.replace(`/calculator/${systemType}${qs ? `?${qs}` : ""}`, { scroll: false });
    }
  }, [store.subsystemId, store.glass, store.shotlan, store.currentStep, systemType, router, searchParams]);

  // On mount: restore from URL params
  useEffect(() => {
    if (isInitRef.current) return;
    isInitRef.current = true;

    const sub = searchParams.get("sub");
    const glass = searchParams.get("glass");
    const shotlan = searchParams.get("shotlan");
    const step = searchParams.get("step");

    if (sub) store.setSubsystem(sub);
    if (glass) store.setGlass(glass);
    if (shotlan) store.setShotlan(shotlan);
    if (step) store.setStep(parseInt(step, 10) || 0);
  }, []);

  // Determine which width to use for subsystem filtering
  const filterWidth = useMemo(() => {
    if (system?.extraField) return store.openWidth;
    return store.fullWidth;
  }, [system, store.openWidth, store.fullWidth]);

  // Get available subsystems based on width
  const availableSubsystems = useMemo(() => {
    if (!system) return [];
    return Object.entries(system.subsystems)
      .filter(([, sub]) => filterWidth >= sub.min && filterWidth <= sub.max)
      .map(([key]) => key);
  }, [system, filterWidth]);

  // Auto-select if only one subsystem available
  useEffect(() => {
    if (availableSubsystems.length === 1 && store.subsystemId !== availableSubsystems[0]) {
      store.setSubsystem(availableSubsystems[0]);
    } else if (availableSubsystems.length === 0 && store.subsystemId) {
      store.setSubsystem('');
    } else if (store.subsystemId && !availableSubsystems.includes(store.subsystemId)) {
      store.setSubsystem('');
    }
  }, [availableSubsystems, store.subsystemId, store.setSubsystem]);

  // Check step validity
  const canProceed = useMemo(() => {
    if (!system) return false;
    switch (store.currentStep) {
      case 0: {
        const widthOk = store.fullWidth >= system.minWidth && store.fullWidth <= (system.maxFullWidth || system.maxWidth);
        const heightOk = store.height >= 1800 && store.height <= 3500;
        const subsystemOk = !!store.subsystemId && availableSubsystems.includes(store.subsystemId);
        const openWidthOk = !system.extraField || (store.openWidth >= system.minWidth && store.openWidth <= system.maxWidth);
        return widthOk && heightOk && subsystemOk && openWidthOk;
      }
      case 1:
        return !!store.glass;
      case 2:
        return !!store.shotlan;
      default:
        return false;
    }
  }, [store.currentStep, store.fullWidth, store.openWidth, store.height, store.glass, store.shotlan, store.subsystemId, system, availableSubsystems]);

  // Run calculation when moving to results
  const handleNext = useCallback(async () => {
    if (store.currentStep === 2 && system && store.subsystemId && store.glass && store.shotlan) {
      const subsystemDef = system.subsystems[store.subsystemId];
      if (subsystemDef) {
        const result = await calculateWithDB(
          systemType,
          store.subsystemId,
          subsystemDef.params,
          store.fullWidth,
          store.openWidth,
          store.height,
          store.glass,
          store.shotlan
        );
        store.setResults(result.doorWidth, result.components, result.total);
      }
    }
    store.nextStep();
  }, [store, system, systemType]);

  // Recalculate if on step 3 but no results (e.g. restored from URL)
  useEffect(() => {
    if (store.currentStep === 3 && !store.components && system && store.subsystemId && store.glass && store.shotlan) {
      const subsystemDef = system.subsystems[store.subsystemId];
      if (subsystemDef) {
        calculateWithDB(
          systemType,
          store.subsystemId,
          subsystemDef.params,
          store.fullWidth,
          store.openWidth,
          store.height,
          store.glass,
          store.shotlan
        ).then((result) => {
          store.setResults(result.doorWidth, result.components, result.total);
        });
      }
    }
  }, [store.currentStep, store.components, system, store.subsystemId, store.glass, store.shotlan, systemType]);

  const steps = useMemo(() => defaultSteps.map((step, i) => {
    switch (i) {
      case 0:
        return {
          ...step,
          description: store.subsystemId
            ? `Подсистема: ${store.subsystemId}`
            : step.description,
        };
      case 1:
        return {
          ...step,
          description: store.glass || step.description,
        };
      case 2:
        return {
          ...step,
          description: store.shotlan || step.description,
        };
      default:
        return step;
    }
  }), [store.subsystemId, store.glass, store.shotlan]);

  if (!system) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold text-destructive">
          Система &laquo;{systemType}&raquo; не найдена
        </h2>
        <p className="mt-2 text-muted-foreground">Проверьте URL или выберите систему на главной странице.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Steps 0-2: wizard UI */}
      {store.currentStep < 3 && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-background overflow-hidden">
          {/* System title */}
          <div className="shrink-0 px-4 sm:px-8 lg:px-12 pt-6 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Конфигуратор
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {system.name}
            </h2>
          </div>

          {/* Step content — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 pb-24">
            <AnimatePresence mode="wait">
          {/* Step 0: Dimensions + Subsystem */}
          {store.currentStep === 0 && (
            <motion.div
              key="dimensions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start"
            >
              {/* Left column: inputs + subsystems */}
              <div className="space-y-6 min-w-0">
                <DimensionInputs
                  fullWidth={store.fullWidth}
                  openWidth={store.openWidth}
                  height={store.height}
                  minWidth={system.minWidth}
                  maxWidth={system.extraField ? (system.maxFullWidth || system.maxWidth) : system.maxWidth}
                  hasExtraField={!!system.extraField}
                  openWidthMin={system.extraField ? system.minWidth : undefined}
                  openWidthMax={system.extraField ? system.maxWidth : undefined}
                  onChange={store.setDimensions}
                />
                {filterWidth > 0 && (
                  <SubsystemSelector
                    systemType={systemType}
                    subsystems={availableSubsystems}
                    selected={store.subsystemId}
                    onSelect={store.setSubsystem}
                  />
                )}
                {filterWidth > 0 && availableSubsystems.length === 0 && store.fullWidth > 0 && (
                  <p className="text-sm text-destructive">
                    Нет доступных подсистем для указанной ширины. Измените размеры.
                  </p>
                )}
              </div>

              {/* Right column: door preview */}
              <DoorPreviewWrapper
                fullWidth={store.fullWidth}
                height={store.height}
                minWidth={system.minWidth}
                maxWidth={system.extraField ? (system.maxFullWidth || system.maxWidth) : system.maxWidth}
                subsystemId={store.subsystemId}
              />
            </motion.div>
          )}

          {/* Step 1: Glass */}
          {store.currentStep === 1 && (
            <motion.div
              key="glass"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassSelector
                selected={store.glass}
                onSelect={store.setGlass}
              />
            </motion.div>
          )}

          {/* Step 2: Shotlan */}
          {store.currentStep === 2 && (
            <motion.div
              key="shotlan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ShotlanSelector
                selected={store.shotlan}
                onSelect={store.setShotlan}
                glass={store.glass}
              />
            </motion.div>
          )}

          </AnimatePresence>
          </div>

          {/* Navigation buttons — fixed bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-t border-border/60">
            <div className="px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="lg"
                onClick={store.prevStep}
                disabled={store.currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>

              {store.currentStep < steps.length - 1 && (
                <Button
                  variant="premium"
                  size="lg"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="gap-2"
                >
                  {store.currentStep === 2 ? (
                    <>
                      <Calculator className="w-4 h-4" />
                      Рассчитать
                    </>
                  ) : (
                    <>
                      Далее
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Results — full width */}
      {store.currentStep === 3 && store.components && (
        <ResultTable
          components={store.components}
          totalPrice={store.totalPrice ?? 0}
          systemName={system.name}
          doorWidth={store.doorWidth ?? 0}
          subsystemId={store.subsystemId}
          glass={store.glass}
          shotlan={store.shotlan}
          fullWidth={store.fullWidth}
          height={store.height}
          onBack={store.prevStep}
        />
      )}

      {store.currentStep === 3 && !store.components && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-card rounded-2xl border p-10 premium-shadow flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">Ошибка расчёта. Вернитесь и проверьте параметры.</p>
            <Button variant="ghost" size="lg" onClick={store.prevStep} className="gap-2 mt-4">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
