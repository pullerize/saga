"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Eye } from "lucide-react";
import { shotlanOptions, hideWithRiffled, type ShotlanOption } from "@/lib/calculations/constants";
import { shotlanImages } from "@/lib/calculations/media";
import { PreviewModal } from "./PreviewModal";

const shortLabels: Record<string, string> = {
  "Без шотланок": "Нет",
  "1шт по горизонтали": "1 гориз.",
  "2шт по горизонтали": "2 гориз.",
  "1шт по вертикали": "1 вертик.",
  "1шт по вертикали и 1шт по горизонтали": "1В + 1Г",
  "1шт по вертикали и 2шт по горизонтали": "1В + 2Г",
  "1шт по вертикали и 3шт по горизонтали": "1В + 3Г",
  "1шт по вертикали и 4шт по горизонтали": "1В + 4Г",
  "1шт по вертикали и 5шт по горизонтали": "1В + 5Г",
  "Очень много разделений": "Макс.",
};

interface ShotlanSelectorProps {
  selected: string | null;
  onSelect: (shotlan: string) => void;
  glass: string | null;
}

export function ShotlanSelector({ selected, onSelect, glass }: ShotlanSelectorProps) {
  const [previewShotlan, setPreviewShotlan] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const isRiffled = glass === "Рифленое";

  const availableOptions = shotlanOptions.filter(
    (opt) => !isRiffled || !hideWithRiffled.includes(opt as ShotlanOption)
  );

  const previewMedia = previewShotlan && shotlanImages[previewShotlan]
    ? { type: "image" as const, src: shotlanImages[previewShotlan] }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-brand-500 to-brand-300" />
        <h3 className="text-sm font-display font-bold text-foreground">Шотланки</h3>
        <span className="text-[10px] text-muted-foreground">({availableOptions.length})</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {availableOptions.map((option) => {
          const isSelected = selected === option;
          const isHovered = hoveredOption === option;
          const imgSrc = shotlanImages[option];
          const label = shortLabels[option] || option;

          return (
            <div
              key={option}
              onMouseEnter={() => setHoveredOption(option)}
              onMouseLeave={() => setHoveredOption(null)}
              className={cn(
                "group relative rounded-xl overflow-hidden transition-all duration-300 border-2",
                isSelected
                  ? "border-brand-600 shadow-[0_0_12px_-2px] shadow-brand-500/25"
                  : "border-neutral-300 hover:border-brand-400 hover:shadow-md"
              )}
            >
              {/* Image — click opens preview */}
              <div
                onClick={() => setPreviewShotlan(option)}
                className="relative w-full aspect-[16/10] overflow-hidden bg-neutral-100 cursor-pointer"
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={option}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-500 ease-out",
                      isHovered && "scale-[1.08]"
                    )}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] p-2 text-center">
                    {label}
                  </div>
                )}

                <div className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isHovered
                    ? "bg-gradient-to-t from-black/60 via-black/10 to-black/5"
                    : "bg-gradient-to-t from-black/40 via-transparent to-transparent"
                )} />

                <div className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                  isHovered ? "opacity-100" : "opacity-0"
                )}>
                  <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute top-2 left-2 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shadow-md"
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom bar */}
              <button
                onClick={() => onSelect(option)}
                className={cn(
                  "w-full flex items-center gap-1.5 px-2.5 py-2 transition-colors duration-200 cursor-pointer",
                  isSelected
                    ? "bg-brand-600 text-white"
                    : "bg-white hover:bg-brand-50/80"
                )}
              >
                <span className={cn(
                  "flex-1 text-left text-[12px] font-semibold leading-tight truncate",
                  !isSelected && "text-foreground"
                )}>
                  {label}
                </span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-muted-foreground/30 shrink-0 group-hover:border-brand-400 transition-colors" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <PreviewModal
        open={!!previewShotlan}
        onClose={() => setPreviewShotlan(null)}
        onSelect={() => {
          if (previewShotlan) onSelect(previewShotlan);
          setPreviewShotlan(null);
        }}
        title={shortLabels[previewShotlan ?? ""] || previewShotlan || ""}
        subtitle={previewShotlan !== shortLabels[previewShotlan ?? ""] ? previewShotlan ?? undefined : undefined}
        media={previewMedia}
      />
    </motion.div>
  );
}
