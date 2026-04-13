"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: () => void;
  title: string;
  subtitle?: string;
  selectLabel?: string;
  media:
    | { type: "video"; src: string; poster?: string }
    | { type: "image"; src: string }
    | null;
}

export function PreviewModal({
  open,
  onClose,
  onSelect,
  title,
  subtitle,
  selectLabel = "Выбрать",
  media,
}: PreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      videoRef.current?.play().catch(() => {});
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop with animated gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
            {/* Decorative ambient glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-600/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-gold/8 blur-[100px] animate-pulse [animation-delay:1s]" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-4xl mx-4 group"
          >
            {/* Glow frame */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/20 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-brand-400/20 to-gold/20 blur-sm" />

            <div className="relative rounded-2xl overflow-hidden bg-black/60 shadow-2xl ring-1 ring-white/10">
              {/* Top bar: title + close */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                className="relative z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 via-black/50 to-transparent"
              >
                <div className="min-w-0">
                  <h3 className="text-white font-display text-xl sm:text-2xl font-bold tracking-tight truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="mt-0.5 text-white/50 text-sm truncate">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 ml-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </motion.div>

              {/* Media */}
              {media?.type === "video" ? (
                <video
                  ref={videoRef}
                  src={media.src}
                  poster={media.poster}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full max-h-[60vh] object-contain"
                />
              ) : media?.type === "image" ? (
                <div className="relative">
                  <img
                    src={media.src}
                    alt={title}
                    className="w-full max-h-[60vh] object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </div>
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-white/30">
                  <Sparkles className="w-8 h-8 mr-2" />
                  Нет превью
                </div>
              )}

              {/* Bottom bar with button */}
              {onSelect && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
                  className="relative py-5 flex justify-center bg-gradient-to-t from-black/80 via-black/50 to-transparent"
                >
                  <Button
                    variant="premium"
                    size="xl"
                    onClick={onSelect}
                    className="px-16 gap-3 relative overflow-hidden group/btn"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                    <Check className="w-5 h-5" />
                    {selectLabel}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
