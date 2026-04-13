"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const projects = [
  {
    id: 1,
    label: "Каскадная система",
    location: "Ташкент, частная резиденция",
    type: "cascade",
    year: "2025",
  },
  {
    id: 2,
    label: "Синхронные двери",
    location: "Ташкент, апартаменты",
    type: "sync",
    year: "2025",
  },
  {
    id: 3,
    label: "Стена-перегородка",
    location: "Ташкент, офисное пространство",
    type: "partition",
    year: "2024",
  },
  {
    id: 4,
    label: "Врезанные в стену",
    location: "Самарканд, частный дом",
    type: "embedded-wall",
    year: "2024",
  },
  {
    id: 5,
    label: "Настенные двери",
    location: "Ташкент, пентхаус",
    type: "wall-mounted",
    year: "2024",
  },
  {
    id: 6,
    label: "Угловое примыкание",
    location: "Бухара, загородный дом",
    type: "angle",
    year: "2025",
  },
];

export function PortfolioSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(1);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const amount = scrollContainerRef.current.offsetWidth * 0.6;
    scrollContainerRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section ref={sectionRef} id="portfolio" className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-0 right-0 h-[40%]"
          style={{ background: "linear-gradient(to top, var(--brand-50), transparent)" }}
        />
      </div>

      {/* Header */}
      <motion.div
        style={{ y: headerY, opacity: headerOpacity }}
        className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 mb-12 lg:mb-16"
      >
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--saga-accent)" }} />
              <span className="text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: "var(--saga-accent)" }}>
                Портфолио
              </span>
            </div>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
              style={{ color: "var(--saga-primary)" }}
            >
              Наши{" "}
              <span style={{ color: "var(--saga-accent)" }}>работы</span>
            </h2>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--saga-primary)]/40 mr-3 hidden sm:block" style={{ color: "rgba(22,40,50,0.35)" }}>
              {projects.length} проектов
            </span>
            <button
              onClick={() => scroll("left")}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-[var(--brand-50)] cursor-pointer active:scale-95"
              style={{ border: "1px solid rgba(22,40,50,0.1)" }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: "var(--saga-primary)" }} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:brightness-110 cursor-pointer active:scale-95"
              style={{ backgroundColor: "var(--saga-primary)" }}
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Horizontal scroll gallery */}
      <div
        ref={scrollContainerRef}
        className="relative flex gap-5 overflow-x-auto px-5 sm:px-8 lg:pl-[max(2rem,calc((100vw-80rem)/2+3rem))] pb-6 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {projects.map((project, i) => {
          const isActive = project.id === activeId;
          const isEven = i % 2 === 0;

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              onMouseEnter={() => setActiveId(project.id)}
              className={cn(
                "group relative shrink-0 cursor-pointer",
                isEven ? "w-[340px] sm:w-[400px] lg:w-[480px]" : "w-[280px] sm:w-[340px] lg:w-[380px]",
              )}
            >
              {/* Image container */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl transition-all duration-500",
                  isEven ? "aspect-[3/4]" : "aspect-[4/5]",
                )}
              >
                {/* Placeholder */}
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundColor: isEven ? "var(--saga-primary)" : "var(--brand-100)",
                  }}
                >
                  {/* Inner gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: isEven
                        ? "linear-gradient(180deg, rgba(212,181,150,0.08) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)"
                        : "linear-gradient(180deg, rgba(22,40,50,0.02) 0%, transparent 40%, rgba(22,40,50,0.1) 100%)",
                    }}
                  />

                  {/* Watermark number */}
                  <div className="absolute top-6 right-6 font-display font-bold select-none" style={{
                    fontSize: "4rem",
                    lineHeight: 1,
                    color: isEven ? "rgba(255,255,255,0.04)" : "rgba(22,40,50,0.04)",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  {/* Center placeholder text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs tracking-[0.2em] uppercase" style={{
                      color: isEven ? "rgba(255,255,255,0.15)" : "rgba(22,40,50,0.12)",
                    }}>
                      Фото проекта
                    </span>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  {/* Expand button */}
                  <div className="absolute top-5 right-5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-100 scale-75"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Bottom info — always visible */}
                <div className="absolute bottom-0 inset-x-0 p-5 lg:p-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p
                        className="text-base lg:text-lg font-display font-bold transition-colors duration-300"
                        style={{ color: isEven ? "white" : "var(--saga-primary)" }}
                      >
                        {project.label}
                      </p>
                      <p
                        className="text-xs mt-1 transition-colors duration-300"
                        style={{ color: isEven ? "rgba(255,255,255,0.4)" : "rgba(22,40,50,0.35)" }}
                      >
                        {project.location}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        backgroundColor: isEven ? "rgba(255,255,255,0.08)" : "rgba(22,40,50,0.05)",
                        color: isEven ? "rgba(255,255,255,0.5)" : "rgba(22,40,50,0.3)",
                      }}
                    >
                      {project.year}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* End spacer */}
        <div className="shrink-0 w-8 lg:w-16" />
      </div>

      {/* Scroll hint line */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 mt-8">
        <div className="h-[1px] w-full" style={{ backgroundColor: "rgba(22,40,50,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              width: "30%",
              backgroundColor: "var(--saga-accent)",
            }}
            animate={{ x: ["0%", "233%", "0%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </section>
  );
}
