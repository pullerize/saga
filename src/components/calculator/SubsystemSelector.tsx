"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Play, Eye } from "lucide-react";
import { subsystemVideos, subsystemPosters } from "@/lib/calculations/media";
import { PreviewModal } from "./PreviewModal";

interface SubsystemSelectorProps {
  systemType: string;
  subsystems: string[];
  selected: string | null;
  onSelect: (subsystem: string) => void;
}

export function SubsystemSelector({
  systemType,
  subsystems,
  selected,
  onSelect,
}: SubsystemSelectorProps) {
  const [previewSub, setPreviewSub] = useState<string | null>(null);

  if (subsystems.length === 0) return null;

  const videos = subsystemVideos[systemType] || {};
  const posters = subsystemPosters[systemType] || {};

  const previewMedia = previewSub && videos[previewSub]
    ? { type: "video" as const, src: videos[previewSub], poster: posters[previewSub] }
    : previewSub && posters[previewSub]
      ? { type: "image" as const, src: posters[previewSub] }
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-brand-500 to-brand-300" />
        <h4 className="text-sm font-display font-bold text-foreground">
          Подсистема
        </h4>
        <span className="text-[10px] text-muted-foreground">
          ({subsystems.length})
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap gap-3">
        {subsystems.map((sub) => (
          <SubsystemCard
            key={sub}
            name={sub}
            videoSrc={videos[sub]}
            posterSrc={posters[sub]}
            isSelected={selected === sub}
            onSelect={() => onSelect(sub)}
            onPreview={() => setPreviewSub(sub)}
          />
        ))}
      </div>

      <PreviewModal
        open={!!previewSub}
        onClose={() => setPreviewSub(null)}
        onSelect={() => {
          if (previewSub) onSelect(previewSub);
          setPreviewSub(null);
        }}
        title={`Подсистема ${previewSub ?? ""}`}
        media={previewMedia}
      />
    </motion.div>
  );
}

function SubsystemCard({
  name,
  videoSrc,
  posterSrc,
  isSelected,
  onSelect,
  onPreview,
}: {
  name: string;
  videoSrc?: string;
  posterSrc?: string;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    videoRef.current?.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const hasMedia = videoSrc || posterSrc;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative w-[185px] shrink-0 rounded-xl overflow-hidden transition-all duration-300",
        "border-2",
        isSelected
          ? "border-brand-600 shadow-[0_0_12px_-2px] shadow-brand-500/25"
          : "border-neutral-300 hover:border-brand-400 hover:shadow-md"
      )}
    >
      {/* Media area — click opens preview */}
      {hasMedia && (
        <div
          onClick={onPreview}
          className="relative w-full aspect-[16/10] overflow-hidden bg-brand-950 cursor-pointer"
        >
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc}
              muted
              loop
              playsInline
              preload="none"
              className={cn(
                "w-full h-full object-cover transition-transform duration-500 ease-out",
                isHovered && "scale-[1.08]"
              )}
            />
          ) : posterSrc ? (
            <img
              src={posterSrc}
              alt={name}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500 ease-out",
                isHovered && "scale-[1.08]"
              )}
            />
          ) : null}

          {/* Overlay */}
          <div className={cn(
            "absolute inset-0 transition-all duration-300",
            isHovered
              ? "bg-gradient-to-t from-black/60 via-black/10 to-black/5"
              : "bg-gradient-to-t from-black/50 via-transparent to-transparent"
          )} />

          {/* Play hint */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25">
              {videoSrc
                ? <Play className="w-3.5 h-3.5 text-white fill-white/90 ml-0.5" />
                : <Eye className="w-3.5 h-3.5 text-white" />
              }
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
      )}

      {/* Bottom bar */}
      <button
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 transition-colors duration-200 cursor-pointer",
          isSelected
            ? "bg-brand-600 text-white"
            : "bg-white hover:bg-brand-50/80"
        )}
      >
        {/* Name */}
        <span className={cn(
          "flex-1 text-left text-[12px] font-semibold leading-tight truncate",
          !isSelected && "text-foreground"
        )}>
          {name}
        </span>

        {/* Status indicator */}
        {isSelected ? (
          <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-muted-foreground/30 shrink-0 group-hover:border-brand-400 transition-colors" />
        )}
      </button>
    </div>
  );
}
