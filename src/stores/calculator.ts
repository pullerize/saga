import { create } from "zustand";
import type { CalcComponent } from "@/lib/calculations/engine";
import type { AdvancedCalculationParams } from "@/lib/calculations/config";

interface CalculatorState {
  // Selections
  systemSlug: string | null;
  systemName: string;
  subsystemId: string | null;
  glass: string | null;
  shotlan: string | null;
  fullWidth: number;
  openWidth: number;
  height: number;

  // Step tracking
  currentStep: number;

  // Computed results
  doorWidth: number | null;
  components: CalcComponent[] | null;
  totalPrice: number | null;

  // Advanced mode
  advancedParams: AdvancedCalculationParams;
  selectedServices: string[];
  adjustedTotal: number | null;
  breakdown: { label: string; amount: number }[] | null;

  // Actions
  setSystem: (slug: string, name: string) => void;
  setSubsystem: (id: string) => void;
  setDimensions: (dims: Partial<{ fullWidth: number; openWidth: number; height: number }>) => void;
  setGlass: (glass: string) => void;
  setShotlan: (shotlan: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setResults: (doorWidth: number, components: CalcComponent[], totalPrice: number) => void;
  setAdvancedParams: (params: Partial<AdvancedCalculationParams>) => void;
  setSelectedServices: (services: string[]) => void;
  setAdvancedResults: (adjustedTotal: number, breakdown: { label: string; amount: number }[]) => void;
  reset: () => void;
}

const defaultAdvancedParams: AdvancedCalculationParams = {
  wallMaterial: "concrete",
  installationComplexity: "standard",
  urgency: "standard",
  needDemontage: false,
  needDelivery: false,
  needReinforcement: false,
  needCleanup: false,
  needLift: false,
  floor: 1,
};

const initialState = {
  systemSlug: null as string | null,
  systemName: "",
  subsystemId: null as string | null,
  glass: null as string | null,
  shotlan: "Без шотланок" as string | null,
  fullWidth: 0,
  openWidth: 0,
  height: 0,
  currentStep: 0,
  doorWidth: null as number | null,
  components: null as CalcComponent[] | null,
  totalPrice: null as number | null,
  advancedParams: defaultAdvancedParams,
  selectedServices: [] as string[],
  adjustedTotal: null as number | null,
  breakdown: null as { label: string; amount: number }[] | null,
};

export const useCalculatorStore = create<CalculatorState>((set) => ({
  ...initialState,

  setSystem: (slug, name) =>
    set({ systemSlug: slug, systemName: name }),

  setSubsystem: (id) =>
    set({ subsystemId: id || null }),

  setDimensions: (dims) =>
    set((state) => ({
      fullWidth: dims.fullWidth ?? state.fullWidth,
      openWidth: dims.openWidth ?? state.openWidth,
      height: dims.height ?? state.height,
    })),

  setGlass: (glass) => set({ glass }),

  setShotlan: (shotlan) => set({ shotlan }),

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

  setResults: (doorWidth, components, totalPrice) =>
    set({ doorWidth, components, totalPrice }),

  setAdvancedParams: (params) =>
    set((state) => ({
      advancedParams: { ...state.advancedParams, ...params },
    })),

  setSelectedServices: (services) =>
    set({ selectedServices: services }),

  setAdvancedResults: (adjustedTotal, breakdown) =>
    set({ adjustedTotal, breakdown }),

  reset: () => set(initialState),
}));
