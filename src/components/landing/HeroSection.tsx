"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/* ─── Animated counter ─── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, target, {
      duration: 2,
      delay: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [target]);
  return <>{value}{suffix}</>;
}

/* ─── Letter-by-letter reveal ─── */
function AnimatedLine({
  text,
  delay = 0,
  className,
  style,
}: {
  text: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className} style={style}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: delay + i * 0.03,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Cursor-follow glow ─── */
function GlowOrb() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 40, damping: 20 });
  const springY = useSpring(y, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[120px] z-0"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        background: "radial-gradient(circle, var(--saga-accent), transparent 70%)",
      }}
    />
  );
}

const stats = [
  { value: 7, suffix: "", label: "типов систем" },
  { value: 500, suffix: "+", label: "реализованных проектов" },
  { value: 5, suffix: " лет", label: "гарантии качества" },
];

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.6], [0, -40]);

  return (
    <section
      ref={ref}
      className="relative flex flex-col overflow-hidden"
      style={{ height: "100vh", backgroundColor: "var(--saga-primary)", boxShadow: "0 4px 0 0 var(--saga-primary)" }}
    >
      <GlowOrb />

      {/* ── Background decorations ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div style={{ y: bgY }} className="absolute inset-0">
          {/* Large gradient orb */}
          <div
            className="absolute top-[-30%] right-[-10%] w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] rounded-full"
            style={{
              background: "radial-gradient(circle at 40% 40%, rgba(186,160,143,0.08) 0%, transparent 60%)",
            }}
          />

          {/* Accent rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute top-[5%] right-[5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px]"
          >
            <div
              className="absolute inset-0 rounded-full opacity-[0.06]"
              style={{ border: "1px solid var(--saga-accent)" }}
            />
            <div
              className="absolute inset-[15%] rounded-full opacity-[0.04]"
              style={{ border: "1px solid var(--saga-accent)" }}
            />
            <div
              className="absolute inset-[35%] rounded-full opacity-[0.03]"
              style={{ border: "1px solid var(--saga-accent)" }}
            />
          </motion.div>

          {/* Diagonal lines */}
          <div className="absolute inset-0">
            <div
              className="absolute top-0 right-[35%] w-[1px] h-[200%] origin-top rotate-[20deg] opacity-[0.04]"
              style={{ backgroundColor: "var(--saga-accent)" }}
            />
            <div
              className="absolute top-0 right-[25%] w-[1px] h-[200%] origin-top rotate-[20deg] opacity-[0.03]"
              style={{ backgroundColor: "var(--saga-accent)" }}
            />
          </div>

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </div>

      {/* ── Vertical side text ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute left-5 lg:left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-4 z-10"
      >
        <div className="w-[1px] h-12" style={{ backgroundColor: "rgba(186,160,143,0.2)" }} />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.3em] whitespace-nowrap"
          style={{
            color: "rgba(186,160,143,0.3)",
            writingMode: "vertical-lr",
            transform: "rotate(180deg)",
          }}
        >
          SAGA Group
        </span>
        <div className="w-[1px] h-12" style={{ backgroundColor: "rgba(186,160,143,0.2)" }} />
      </motion.div>

      {/* ── Main content ── */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative flex-1 min-h-0 flex flex-col justify-center z-10"
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex items-center gap-4 mb-6 lg:mb-8 overflow-hidden"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-10 h-[1px] origin-left"
              style={{ backgroundColor: "var(--saga-accent)" }}
            />
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-[11px] font-medium uppercase tracking-[0.3em]"
              style={{ color: "var(--saga-accent)" }}
            >
              Премиальные дверные системы
            </motion.span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display font-bold leading-[0.92] tracking-tight">
            <span className="block text-[clamp(2.6rem,7.5vw,6.5rem)] text-white overflow-hidden">
              <AnimatedLine text="Раздвижные" delay={0.3} />
            </span>
            <span className="block text-[clamp(2.6rem,7.5vw,6.5rem)] text-white/30 overflow-hidden">
              <AnimatedLine text="и межкомнатные" delay={0.6} />
            </span>
            <span className="block text-[clamp(2.6rem,7.5vw,6.5rem)] overflow-hidden">
              <AnimatedLine
                text="двери"
                delay={1.0}
                style={{ color: "var(--saga-accent)" }}
              />
            </span>
          </h1>

          {/* Description + CTA */}
          <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-20 items-end">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="text-sm sm:text-base leading-relaxed max-w-md text-white/35"
            >
              Изысканные решения для Вашего интерьера.
              Индивидуальный подход, безупречное качество,
              профессиональный монтаж.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.7 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                href="/auth/login"
                className="group relative inline-flex items-center gap-3 h-13 px-8 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 overflow-hidden"
                style={{ backgroundColor: "var(--saga-accent)", color: "var(--saga-primary)" }}
              >
                {/* Shine effect */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative">Рассчитать стоимость</span>
                <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="group inline-flex items-center justify-center h-13 px-8 rounded-full text-sm font-medium tracking-wide border border-white/10 text-white/50 transition-all duration-300 hover:border-white/25 hover:text-white/80"
              >
                Подробнее
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom stats bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.8 }}
        className="relative shrink-0 border-t border-white/[0.06] z-10"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
            {stats.map((stat, i) => (
              <div key={stat.label} className="py-4 lg:py-5 px-4 lg:px-8 text-center lg:text-left">
                <p className="text-xl lg:text-2xl font-display font-bold text-white tabular-nums">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-white/25">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        className="absolute bottom-20 right-8 lg:right-12 hidden lg:flex flex-col items-center gap-3 z-10"
      >
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/20" style={{ writingMode: "vertical-lr" }}>
          Scroll
        </span>
        <motion.div
          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-10 origin-top"
          style={{ backgroundColor: "var(--saga-accent)" }}
        />
      </motion.div>
    </section>
  );
}
