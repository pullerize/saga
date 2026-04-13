"use client";

import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";
import { Ruler, FileCheck, CreditCard, Clock, ScanLine, Factory, Hammer, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { icon: Ruler, number: "01", title: "Черновой замер проёма", duration: "1–2 дня", day: 1, note: "Специалист выезжает к Вам для предварительного обмера и оценки условий монтажа" },
  { icon: FileCheck, number: "02", title: "Проект и согласование", duration: "1–2 дня", day: 3, note: "Готовим техническую документацию и согласовываем с Вами все детали проекта" },
  { icon: CreditCard, number: "03", title: "Предоплата 70%", duration: "", day: 4, note: "Если ремонт ещё не готов — ждём готовности проёма. Вы ничего не теряете" },
  { icon: ScanLine, number: "04", title: "Чистовой замер проёма", duration: "1–2 дня", day: 5, note: "Финальные замеры с точностью до миллиметра после завершения отделочных работ" },
  { icon: Factory, number: "05", title: "Производство двери", duration: "5–7 дней", day: 7, note: "Изготовление конструкции на собственном производстве по индивидуальным размерам" },
  { icon: Hammer, number: "06", title: "Сборка двери", duration: "1 день", day: 13, note: "Предварительная сборка и проверка качества всех комплектующих перед выездом" },
  { icon: Home, number: "07", title: "Установка двери", duration: "1–2 дня", day: 14, note: "Профессиональный монтаж, настройка механизмов и финальная проверка работы системы" },
];

const TOTAL_DAYS = 15;

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const lineProgress = useTransform(scrollYProgress, [0.05, 0.95], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(Math.floor(v * steps.length), steps.length - 1);
    setActiveStep(idx);
  });

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${steps.length * 100}vh` }}
    >
      <div
        className="sticky top-0 h-screen overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--saga-primary)" }}
      >
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
          <motion.div
            animate={{
              background: [
                "radial-gradient(ellipse 50% 50% at 80% 30%, rgba(212,181,150,0.08) 0%, transparent 70%)",
                "radial-gradient(ellipse 50% 50% at 20% 70%, rgba(212,181,150,0.08) 0%, transparent 70%)",
                "radial-gradient(ellipse 50% 50% at 80% 30%, rgba(212,181,150,0.08) 0%, transparent 70%)",
              ],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          />
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-center">

              {/* Left — header + active step detail */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--saga-accent)" }} />
                  <span className="text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: "var(--saga-accent)" }}>
                    Процесс
                  </span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-8">
                  Как всё{" "}
                  <span style={{ color: "var(--saga-accent)" }}>происходит?</span>
                </h2>

                {/* Active step showcase */}
                <div className="relative min-h-[180px]">
                  {steps.map((step, i) => {
                    const isActive = i === activeStep;
                    const StepIcon = step.icon;
                    return (
                      <motion.div
                        key={step.number}
                        initial={false}
                        animate={{
                          opacity: isActive ? 1 : 0,
                          y: isActive ? 0 : 20,
                          scale: isActive ? 1 : 0.95,
                        }}
                        transition={{ duration: 0.3 }}
                        className={cn("absolute inset-0", !isActive && "pointer-events-none")}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{
                              backgroundColor: "rgba(212,181,150,0.1)",
                              border: "1px solid rgba(212,181,150,0.15)",
                            }}
                          >
                            <StepIcon className="w-6 h-6" style={{ color: "var(--saga-accent)" }} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold tracking-[0.2em] block" style={{ color: "var(--saga-accent)" }}>
                              ШАГ {step.number}
                            </span>
                            {step.duration && (
                              <span className="text-xs text-white/30">{step.duration}</span>
                            )}
                          </div>
                        </div>

                        <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-3">
                          {step.title}
                        </h3>

                        {step.note && (
                          <p className="text-sm text-white/35 leading-relaxed max-w-sm">
                            {step.note}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Total days */}
                <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl lg:text-4xl font-bold" style={{ color: "var(--saga-accent)" }}>
                      10–15
                    </span>
                    <span className="text-sm text-white/35">рабочих дней</span>
                  </div>
                  <p className="text-xs text-white/20 mt-1">от замера до готовой двери</p>
                </div>
              </div>

              {/* Right — visual timeline */}
              <div className="hidden lg:block">
                <div className="relative">
                  {/* Connecting line */}
                  <div className="absolute left-[28px] top-0 bottom-0 w-[2px] rounded-full bg-white/[0.06]">
                    <motion.div
                      className="absolute top-0 left-0 w-full rounded-full origin-top"
                      style={{
                        scaleY: lineProgress,
                        backgroundColor: "var(--saga-accent)",
                        boxShadow: "0 0 12px rgba(212,181,150,0.3)",
                        height: "100%",
                      }}
                    />
                  </div>

                  {/* Step items */}
                  <div className="space-y-1">
                    {steps.map((step, i) => {
                      const isActive = i === activeStep;
                      const isPast = i < activeStep;
                      const StepIcon = step.icon;

                      return (
                        <motion.div
                          key={step.number}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: i * 0.04 }}
                          className="relative pl-16 py-3"
                        >
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2">
                            <motion.div
                              animate={{
                                scale: isActive ? 1 : 0.75,
                                backgroundColor: isActive || isPast
                                  ? "var(--saga-accent)"
                                  : "rgba(255,255,255,0.08)",
                              }}
                              transition={{ duration: 0.3 }}
                              className="w-[58px] h-[58px] rounded-2xl flex items-center justify-center"
                              style={{
                                boxShadow: isActive
                                  ? "0 0 24px rgba(212,181,150,0.2), 0 0 0 4px rgba(212,181,150,0.08)"
                                  : "none",
                              }}
                            >
                              <StepIcon
                                className="w-5 h-5 transition-colors duration-300"
                                style={{
                                  color: isActive || isPast ? "var(--saga-primary)" : "rgba(255,255,255,0.2)",
                                }}
                              />
                            </motion.div>
                          </div>

                          {/* Step card */}
                          <motion.div
                            animate={{
                              backgroundColor: isActive
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(255,255,255,0.02)",
                              borderColor: isActive
                                ? "rgba(212,181,150,0.15)"
                                : "rgba(255,255,255,0.04)",
                            }}
                            transition={{ duration: 0.3 }}
                            className="rounded-xl px-5 py-4 border flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[10px] font-bold tracking-[0.15em] transition-colors duration-300"
                                  style={{ color: isActive || isPast ? "var(--saga-accent)" : "rgba(255,255,255,0.15)" }}
                                >
                                  {step.number}
                                </span>
                                <span
                                  className={cn(
                                    "text-sm font-semibold transition-colors duration-300 truncate",
                                    isActive ? "text-white" : isPast ? "text-white/50" : "text-white/25"
                                  )}
                                >
                                  {step.title}
                                </span>
                              </div>
                            </div>

                            {step.duration && (
                              <span
                                className={cn(
                                  "text-[11px] font-medium shrink-0 px-3 py-1 rounded-full transition-all duration-300",
                                  isActive
                                    ? "bg-[rgba(212,181,150,0.12)] text-[var(--saga-accent)] border border-[rgba(212,181,150,0.15)]"
                                    : "text-white/15"
                                )}
                              >
                                {step.duration}
                              </span>
                            )}
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile timeline */}
              <div className="lg:hidden">
                <div className="flex items-center gap-2 mb-2">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className="h-[3px] rounded-full transition-all duration-300"
                      style={{
                        flex: i === activeStep ? 3 : 1,
                        backgroundColor: i <= activeStep ? "var(--saga-accent)" : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-white/20 text-right">
                  {activeStep + 1} / {steps.length}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
