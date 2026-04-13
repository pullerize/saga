"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  label: string;
  description: string;
}

interface StepsBarProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepsBar({ steps, currentStep, onStepClick }: StepsBarProps) {
  return (
    <nav className="w-full">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li
              key={step.label}
              className={cn("flex-1 relative", index !== steps.length - 1 && "pr-4")}
            >
              <button
                onClick={() => isComplete && onStepClick?.(index)}
                disabled={!isComplete}
                className={cn(
                  "flex items-center gap-3 w-full group",
                  isComplete && "cursor-pointer"
                )}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isComplete &&
                      "border-brand-600 bg-brand-600 text-white",
                    isCurrent &&
                      "border-brand-600 bg-white text-brand-700 premium-shadow",
                    !isComplete &&
                      !isCurrent &&
                      "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    index + 1
                  )}

                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-brand-400"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                  )}
                </div>

                {/* Step text */}
                <div className="hidden sm:block text-left">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      (isComplete || isCurrent) ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </button>

              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-[calc(2.5rem+0.75rem)] right-0 h-0.5 bg-border">
                  <motion.div
                    className="h-full bg-brand-600 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isComplete ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
