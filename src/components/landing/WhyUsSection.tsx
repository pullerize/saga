"use client";

import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const reasons = [
  {
    number: "01",
    title: "Гарантия\nкачества",
    description:
      "Исключительно сертифицированные материалы и комплектующие европейских производителей. Каждое изделие проходит многоступенчатый контроль перед установкой.",
    stat: "5 лет",
    statLabel: "гарантии",
  },
  {
    number: "02",
    title: "Индивидуальный\nподход",
    description:
      "Каждый проект разрабатывается с учётом архитектурных особенностей Вашего пространства. Персональный менеджер сопровождает Вас на каждом этапе.",
    stat: "100%",
    statLabel: "персонализация",
  },
  {
    number: "03",
    title: "Премиальное\nисполнение",
    description:
      "Анодированный алюминиевый профиль, закалённое стекло толщиной 8–10 мм и фурнитура ведущих европейских брендов. Эстетика, рассчитанная на десятилетия.",
    stat: "Class A",
    statLabel: "материалы",
  },
  {
    number: "04",
    title: "Точность\nво всём",
    description:
      "Собственное производство и отлаженная логистика позволяют гарантировать точное соблюдение сроков. От замера до монтажа — без задержек и компромиссов.",
    stat: "7 дней",
    statLabel: "до установки",
  },
];

// Precompute constants to avoid hydration mismatch from floating point
const ARC_LENGTH = +(2 * Math.PI * 190).toFixed(2);

const TICK_MARKS = Array.from({ length: 60 }).map((_, i) => {
  const angle = (i / 60) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const isMajor = i % 15 === 0;
  const r1 = isMajor ? 175 : 181;
  const r2 = 186;
  return {
    x1: +(200 + r1 * Math.cos(rad)).toFixed(2),
    y1: +(200 + r1 * Math.sin(rad)).toFixed(2),
    x2: +(200 + r2 * Math.cos(rad)).toFixed(2),
    y2: +(200 + r2 * Math.sin(rad)).toFixed(2),
    isMajor,
  };
});

// Layout: each slide = hold zone + transition zone
// |--- hold (nothing changes) ---|--- transition (snap to next) ---|
const HOLD_SCREENS = 1.2;       // screens of "frozen" scroll per slide
const TRANSITION_SCREENS = 0.3; // narrow band where the slide actually changes
const SLIDE_SCREENS = HOLD_SCREENS + TRANSITION_SCREENS;
const TOTAL_SCREENS = reasons.length * SLIDE_SCREENS;

// Build keyframes: for each slide, the index stays the same during hold, then jumps
// scrollYProgress ranges that map to each index
function getSlideIndex(progress: number): number {
  const pos = progress * TOTAL_SCREENS;
  for (let i = 0; i < reasons.length; i++) {
    const slideStart = i * SLIDE_SCREENS;
    const holdEnd = slideStart + HOLD_SCREENS;
    const slideEnd = slideStart + SLIDE_SCREENS;
    if (pos <= holdEnd) return i;           // in hold zone — stay on slide i
    if (pos < slideEnd) return i;           // in transition zone — still slide i until next hold
  }
  return reasons.length - 1;
}

export function WhyUsSection() {
  const containerRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveIndex(getSlideIndex(v));
  });

  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveIndex(getSlideIndex(v));
  });

  return (
    <section
      ref={containerRef}
      id="why-us"
      className="relative"
      style={{ height: `${TOTAL_SCREENS * 100}vh` }}
    >
      {/* Sticky viewport — white background */}
      <div className="sticky top-0 h-screen overflow-hidden bg-white">

        {/* ── Background ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Warm gradient wash */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 70% at 60% 40%, rgba(212,181,150,0.09) 0%, transparent 70%),
                radial-gradient(ellipse 60% 60% at 15% 75%, rgba(22,40,50,0.04) 0%, transparent 60%)
              `,
            }}
          />

          {/* Floating orbs */}
          <motion.div
            animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[8%] right-[10%] w-[40vw] h-[40vw] max-w-[550px] max-h-[550px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(212,181,150,0.06) 0%, transparent 65%)" }}
          />
          <motion.div
            animate={{ x: [0, -25, 15, 0], y: [0, 20, -30, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[5%] left-[8%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(22,40,50,0.035) 0%, transparent 65%)" }}
          />

          {/* Bottom progress line */}
          <motion.div
            style={{ scaleX: progressHeight }}
            className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
          >
            <div className="h-full" style={{ background: "linear-gradient(90deg, var(--saga-accent), var(--saga-primary))" }} />
          </motion.div>
        </div>

        {/* ── Content layout ── */}
        <div className="relative h-full flex flex-col justify-center">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center">

              {/* Left: progress indicator */}
              <div className="lg:col-span-1 hidden lg:flex flex-col items-center">
                <div className="relative h-48">
                  <div className="absolute inset-0 w-[1px] left-1/2 -translate-x-1/2" style={{ backgroundColor: "rgba(22,40,50,0.08)" }} />
                  <motion.div
                    className="absolute top-0 w-[1px] left-1/2 -translate-x-1/2"
                    style={{
                      height: progressHeight,
                      backgroundColor: "var(--saga-accent)",
                    }}
                  />
                  {reasons.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-1/2 -translate-x-1/2 transition-all duration-500"
                      style={{ top: `${(i / (reasons.length - 1)) * 100}%` }}
                    >
                      <div
                        className={cn(
                          "rounded-full transition-all duration-500",
                          i === activeIndex ? "w-3 h-3 scale-100" : "w-2 h-2"
                        )}
                        style={{
                          backgroundColor:
                            i <= activeIndex ? "var(--saga-accent)" : "rgba(22,40,50,0.12)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Center: main content */}
              <div className="lg:col-span-6 lg:pl-8">
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--saga-accent)" }} />
                  <span
                    className="text-[11px] font-medium uppercase tracking-[0.3em]"
                    style={{ color: "var(--saga-accent)" }}
                  >
                    Почему мы
                  </span>
                </div>

                {/* Number */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`num-${activeIndex}`}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="block text-[13px] font-semibold tracking-[0.2em] mb-4"
                    style={{ color: "var(--saga-accent)" }}
                  >
                    {reasons[activeIndex].number} / 0{reasons.length}
                  </motion.span>
                </AnimatePresence>

                {/* Title */}
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={`title-${activeIndex}`}
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] whitespace-pre-line"
                    style={{ color: "var(--saga-primary)" }}
                  >
                    {reasons[activeIndex].title}
                  </motion.h2>
                </AnimatePresence>

                {/* Description */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`desc-${activeIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, delay: 0.05 }}
                    className="mt-6 text-sm sm:text-base leading-relaxed max-w-md"
                    style={{ color: "rgba(22, 40, 50, 0.45)" }}
                  >
                    {reasons[activeIndex].description}
                  </motion.p>
                </AnimatePresence>

                {/* Mobile progress */}
                <div className="flex items-center gap-2 mt-8 lg:hidden">
                  {reasons.map((_, i) => (
                    <div
                      key={i}
                      className="h-[2px] rounded-full transition-all duration-500"
                      style={{
                        width: i === activeIndex ? 32 : 12,
                        backgroundColor:
                          i === activeIndex ? "var(--saga-accent)" : "rgba(22,40,50,0.1)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Right: cinematic dial composition */}
              <div className="lg:col-span-5 hidden lg:flex justify-center items-center">
                <div className="relative w-[340px] h-[340px] xl:w-[400px] xl:h-[400px]">

                  {/* Outer arc — progress ring */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" suppressHydrationWarning>
                    {/* Track */}
                    <circle
                      cx="200" cy="200" r="190"
                      fill="none"
                      stroke="rgba(22,40,50,0.05)"
                      strokeWidth="1"
                    />
                    {/* Active arc */}
                    <motion.circle
                      cx="200" cy="200" r="190"
                      fill="none"
                      stroke="var(--saga-accent)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray={ARC_LENGTH}
                      style={{
                        strokeDashoffset: useTransform(
                          scrollYProgress,
                          [0, 1],
                          [ARC_LENGTH, 0]
                        ),
                      }}
                      transform="rotate(-90 200 200)"
                    />
                    {/* Tick marks */}
                    {TICK_MARKS.map((t, i) => (
                      <line
                        key={i}
                        x1={t.x1}
                        y1={t.y1}
                        x2={t.x2}
                        y2={t.y2}
                        stroke={t.isMajor ? "rgba(22,40,50,0.12)" : "rgba(22,40,50,0.04)"}
                        strokeWidth={t.isMajor ? 1.5 : 0.5}
                      />
                    ))}
                    {/* Position dot on arc */}
                    <motion.circle
                      r="4"
                      fill="var(--saga-accent)"
                      style={{
                        cx: useTransform(scrollYProgress, (v) =>
                          200 + 190 * Math.cos(((v * 360 - 90) * Math.PI) / 180)
                        ),
                        cy: useTransform(scrollYProgress, (v) =>
                          200 + 190 * Math.sin(((v * 360 - 90) * Math.PI) / 180)
                        ),
                      }}
                    />
                    {/* Glow behind dot */}
                    <motion.circle
                      r="12"
                      fill="var(--saga-accent)"
                      opacity="0.15"
                      style={{
                        cx: useTransform(scrollYProgress, (v) =>
                          200 + 190 * Math.cos(((v * 360 - 90) * Math.PI) / 180)
                        ),
                        cy: useTransform(scrollYProgress, (v) =>
                          200 + 190 * Math.sin(((v * 360 - 90) * Math.PI) / 180)
                        ),
                      }}
                    />
                  </svg>

                  {/* Inner ring */}
                  <div
                    className="absolute inset-[35px] xl:inset-[42px] rounded-full"
                    style={{ border: "1px solid rgba(22,40,50,0.06)" }}
                  />

                  {/* Rotating inner decorative ring */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[55px] xl:inset-[65px] rounded-full"
                    style={{ border: "1px dashed rgba(22,40,50,0.04)" }}
                  />

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`dial-${activeIndex}`}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center"
                      >
                        <span
                          className="font-display font-bold tracking-tight leading-none"
                          style={{
                            fontSize: "clamp(3rem, 5vw, 4.5rem)",
                            color: "var(--saga-primary)",
                          }}
                        >
                          {reasons[activeIndex].stat}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-[0.25em] mt-3"
                          style={{ color: "var(--saga-accent)" }}
                        >
                          {reasons[activeIndex].statLabel}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Cardinal labels — 01 02 03 04 positioned around the circle */}
                  {reasons.map((reason, i) => {
                    const positions = [
                      { top: "-8px", left: "50%", transform: "translateX(-50%)" },
                      { top: "50%", right: "-12px", transform: "translateY(-50%)" },
                      { bottom: "-8px", left: "50%", transform: "translateX(-50%)" },
                      { top: "50%", left: "-12px", transform: "translateY(-50%)" },
                    ];
                    const isActive = i === activeIndex;
                    return (
                      <motion.span
                        key={reason.number}
                        animate={{
                          opacity: isActive ? 1 : 0.15,
                          scale: isActive ? 1.3 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                        className="absolute text-[11px] font-bold tracking-[0.15em] z-10"
                        style={{
                          ...positions[i],
                          color: isActive ? "var(--saga-accent)" : "var(--saga-primary)",
                        }}
                      >
                        {reason.number}
                      </motion.span>
                    );
                  })}

                  {/* Ambient glow behind */}
                  <div
                    className="absolute inset-[20%] rounded-full pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, rgba(212,181,150,0.06) 0%, transparent 70%)",
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
