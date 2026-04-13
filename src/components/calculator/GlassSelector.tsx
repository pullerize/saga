"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Eye } from "lucide-react";
import { glassOptions } from "@/lib/calculations/constants";
import { glassImages } from "@/lib/calculations/media";
import { PreviewModal } from "./PreviewModal";

interface GlassSelectorProps {
  selected: string | null;
  onSelect: (glass: string) => void;
}

export function GlassSelector({ selected, onSelect }: GlassSelectorProps) {
  const [previewGlass, setPreviewGlass] = useState<string | null>(null);
  const [hoveredGlass, setHoveredGlass] = useState<string | null>(null);

  const previewMedia = previewGlass && glassImages[previewGlass]
    ? { type: "image" as const, src: glassImages[previewGlass] }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-brand-500 to-brand-300" />
        <h3 className="text-sm font-display font-bold text-foreground">Тип стекла</h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {glassOptions.map((glass) => {
          const isSelected = selected === glass;
          const isHovered = hoveredGlass === glass;
          const imgSrc = glassImages[glass];
          return (
            <div
              key={glass}
              onMouseEnter={() => setHoveredGlass(glass)}
              onMouseLeave={() => setHoveredGlass(null)}
              className={cn(
                "group relative rounded-xl overflow-hidden transition-all duration-300 border-2",
                isSelected
                  ? "border-brand-600 shadow-[0_0_12px_-2px] shadow-brand-500/25"
                  : "border-neutral-300 hover:border-brand-400 hover:shadow-md"
              )}
            >
              {/* Image — click opens preview */}
              <div
                onClick={() => setPreviewGlass(glass)}
                className="relative w-full aspect-[3/4] overflow-hidden bg-muted cursor-pointer"
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={glass}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-500 ease-out",
                      isHovered && "scale-[1.08]"
                    )}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                    {glass}
                  </div>
                )}

                {/* Overlay */}
                <div className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isHovered
                    ? "bg-gradient-to-t from-black/60 via-black/10 to-black/5"
                    : "bg-gradient-to-t from-black/40 via-transparent to-transparent"
                )} />

                {/* View hint */}
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                  isHovered ? "opacity-100" : "opacity-0"
                )}>
                  <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Selected badge */}
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
                onClick={() => onSelect(glass)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 transition-colors duration-200 cursor-pointer",
                  isSelected
                    ? "bg-brand-600 text-white"
                    : "bg-white hover:bg-brand-50/80"
                )}
              >
                <span className={cn(
                  "flex-1 text-left text-[12px] font-semibold leading-tight truncate",
                  !isSelected && "text-foreground"
                )}>
                  {glass}
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
        open={!!previewGlass}
        onClose={() => setPreviewGlass(null)}
        onSelect={() => {
          if (previewGlass) onSelect(previewGlass);
          setPreviewGlass(null);
        }}
        title={previewGlass ?? ""}
        media={previewMedia}
      />
    </motion.div>
  );
}
