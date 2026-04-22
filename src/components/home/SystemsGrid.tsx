"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PreviewModal } from "@/components/calculator/PreviewModal";
import { systemMedia } from "@/lib/calculations/media";

const SYSTEM_DESCRIPTIONS: Record<string, string> = {
  cascade: "Панели 3-8, плавное каскадное движение",
  sync: "Синхронное открывание с обеих сторон",
  unlinked: "Независимое движение каждой панели",
  "embedded-wall": "Интеграция в стеновую конструкцию",
  partition: "Трансформируемые перегородки",
  "wall-mounted": "Крепление на стену с внешним механизмом",
  angle: "Системы с угловым соединением",
};

interface DBSystem {
  slug: string;
  name: string;
  subsystems: { id: string }[];
}

interface SystemsGridProps {
  /** Where to navigate after selecting a system. Defaults to "/auth/login" */
  targetPath?: "calculator" | "auth";
}

export function SystemsGrid({ targetPath = "auth" }: SystemsGridProps) {
  const router = useRouter();
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [systems, setSystems] = useState<
    Array<{ slug: string; name: string; description: string; subsystems: number }>
  >([]);

  useEffect(() => {
    fetch("/api/systems")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: DBSystem[]) => {
        setSystems(
          data.map((s) => ({
            slug: s.slug,
            name: s.name,
            description: SYSTEM_DESCRIPTIONS[s.slug] ?? "",
            subsystems: s.subsystems.length,
          }))
        );
      })
      .catch(() => setSystems([]));
  }, []);

  const previewSystem = previewSlug ? systems.find((s) => s.slug === previewSlug) : null;
  const previewMedia = previewSlug && systemMedia[previewSlug]
    ? { type: "video" as const, src: systemMedia[previewSlug].video, poster: systemMedia[previewSlug].poster }
    : null;

  return (
    <>
      {/* Systems grid */}
      <section id="systems" className="relative pt-8 pb-16 lg:pt-12 lg:pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-100/40 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-brand-50/60 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-2">
                Каталог
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Выберите систему
              </h2>
            </div>
            <div className="hidden sm:block w-24 h-[2px] bg-gradient-to-r from-brand-300 to-transparent mb-2" />
          </motion.div>

          {/* Featured system - first card large */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
            {systems.slice(0, 2).map((system, i) => (
              <motion.div
                key={system.slug}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <SystemCardLarge
                  slug={system.slug}
                  name={system.name}
                  description={system.description}
                  subsystems={system.subsystems}
                  onClick={() => setPreviewSlug(system.slug)}
                />
              </motion.div>
            ))}
          </div>

          {/* Remaining systems */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {systems.slice(2).map((system, i) => (
              <motion.div
                key={system.slug}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <SystemCard
                  slug={system.slug}
                  name={system.name}
                  description={system.description}
                  subsystems={system.subsystems}
                  onClick={() => setPreviewSlug(system.slug)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PreviewModal
        open={!!previewSlug}
        onClose={() => setPreviewSlug(null)}
        onSelect={() => {
          setPreviewSlug(null);
          if (previewSlug) {
            router.push(targetPath === "calculator" ? `/calculator/${previewSlug}` : "/auth/login");
          }
        }}
        title={previewSystem?.name ?? ""}
        selectLabel="Рассчитать"
        media={previewMedia}
      />
    </>
  );
}

/* Large featured card */
function SystemCardLarge({
  slug,
  name,
  description,
  subsystems,
  onClick,
}: {
  slug: string;
  name: string;
  description: string;
  subsystems: number;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = systemMedia[slug];

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white border border-border/60 hover:border-brand-300/60 transition-all duration-500 premium-shadow hover:premium-shadow-lg hover:-translate-y-1"
    >
      {media && (
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-brand-950">
          <video
            ref={videoRef}
            src={media.video}
            poster={media.poster}
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Play className="w-6 h-6 text-white fill-white/80" />
            </div>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                  {name}
                </h3>
                <p className="mt-1 text-sm text-white/70">{description}</p>
              </div>
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider shrink-0">
                {subsystems} подсистем
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="px-5 sm:px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-brand-600 group-hover:text-brand-700 transition-colors">
          Рассчитать стоимость
        </span>
        <div className="w-8 h-8 rounded-full bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
          <ArrowRight className="w-4 h-4 text-brand-600 group-hover:translate-x-0.5 transition-transform duration-300" />
        </div>
      </div>
    </div>
  );
}

/* Compact card for remaining systems */
function SystemCard({
  slug,
  name,
  description,
  subsystems,
  onClick,
}: {
  slug: string;
  name: string;
  description: string;
  subsystems: number;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = systemMedia[slug];

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative cursor-pointer h-full rounded-2xl overflow-hidden bg-white border border-border/60 hover:border-brand-300/60 transition-all duration-500 premium-shadow hover:premium-shadow-lg hover:-translate-y-1"
    >
      {media && (
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-brand-950">
          <video
            ref={videoRef}
            src={media.video}
            poster={media.poster}
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display text-sm font-bold text-foreground group-hover:text-brand-700 transition-colors duration-300 leading-tight">
            {name}
          </h3>
          <span className="text-[10px] font-medium text-brand-500 bg-brand-50 rounded-full px-2 py-0.5 shrink-0">
            {subsystems}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
