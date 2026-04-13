"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    number: "01",
    title: "Без напольных рельсов",
    description:
      "Верхнеподвесная система обеспечивает абсолютно ровный пол без порогов и направляющих. Безопасность, эстетика и удобство в каждом движении двери.",
    accent: "Чистый пол",
  },
  {
    number: "02",
    title: "Из цельного профиля",
    description:
      "Каждая деталь профиля изготавливается из единого алюминиевого сплава, что исключает сварные швы и обеспечивает безупречную геометрию конструкции.",
    accent: "Без швов",
  },
  {
    number: "03",
    title: "Анодированный профиль",
    description:
      "Защитное анодное покрытие придаёт профилю благородный оттенок и защищает поверхность от коррозии, царапин и воздействия ультрафиолета на протяжении десятилетий.",
    accent: "На десятилетия",
  },
  {
    number: "04",
    title: "Безопасное стекло",
    description:
      "Закалённое стекло толщиной 8–10 мм обладает повышенной прочностью. В случае повреждения оно рассыпается на мелкие безопасные фрагменты, исключая риск травм.",
    accent: "8–10 мм",
  },
  {
    number: "05",
    title: "Прозрачный просчёт",
    description:
      "Воспользуйтесь нашим онлайн-калькулятором для мгновенного расчёта стоимости. Вы видите полную спецификацию комплектующих и стоимость каждой позиции.",
    accent: "Онлайн",
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 items-center py-6 lg:py-8"
    >
      {/* Text side */}
      <motion.div
        style={{ y }}
        className={`px-5 sm:px-8 lg:px-16 ${isEven ? "lg:order-1" : "lg:order-2"}`}
      >
        {/* Number + line */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="text-[11px] font-bold tracking-[0.2em]"
            style={{ color: "var(--saga-accent)" }}
          >
            {feature.number}
          </span>
          <div className="flex-1 h-[1px] max-w-[60px]" style={{ backgroundColor: "rgba(22,40,50,0.1)" }} />
        </div>

        {/* Title */}
        <h3
          className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.1] mb-5"
          style={{ color: "var(--saga-primary)" }}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm sm:text-base leading-relaxed max-w-md mb-8"
          style={{ color: "rgba(22, 40, 50, 0.45)" }}
        >
          {feature.description}
        </p>

        {/* CTA button */}
        <a
          href="#contacts"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-xs font-medium tracking-wide transition-all hover:bg-[rgba(22,40,50,0.05)]"
          style={{ border: "1px solid rgba(22,40,50,0.15)", color: "var(--saga-primary)" }}
        >
          Подробнее
        </a>
      </motion.div>

      {/* Image side */}
      <div className={`relative ${isEven ? "lg:order-2" : "lg:order-1"}`}>
        <motion.div
          style={{ scale: imageScale, y: imageY }}
          className="relative aspect-[4/3] overflow-hidden"
        >
          {/* Placeholder with premium styling */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: isEven ? "var(--saga-primary)" : "var(--brand-50)",
            }}
          >
            {/* Inner gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: isEven
                  ? "linear-gradient(135deg, rgba(212,181,150,0.1) 0%, transparent 60%)"
                  : "linear-gradient(135deg, rgba(22,40,50,0.03) 0%, transparent 60%)",
              }}
            />

            {/* Large feature number watermark */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
              <span
                className="font-display font-bold"
                style={{
                  fontSize: "clamp(8rem, 15vw, 14rem)",
                  color: isEven ? "rgba(255,255,255,0.04)" : "rgba(22,40,50,0.04)",
                }}
              >
                {feature.number}
              </span>
            </div>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-xs font-medium tracking-[0.2em] uppercase"
                style={{ color: isEven ? "rgba(255,255,255,0.2)" : "rgba(22,40,50,0.15)" }}
              >
                Фото / Видео
              </span>
            </div>

            {/* Corner accents */}
            <div className="absolute top-6 left-6 w-10 h-[1px]" style={{ backgroundColor: isEven ? "rgba(212,181,150,0.2)" : "rgba(22,40,50,0.08)" }} />
            <div className="absolute top-6 left-6 h-10 w-[1px]" style={{ backgroundColor: isEven ? "rgba(212,181,150,0.2)" : "rgba(22,40,50,0.08)" }} />
            <div className="absolute bottom-6 right-6 w-10 h-[1px]" style={{ backgroundColor: isEven ? "rgba(212,181,150,0.2)" : "rgba(22,40,50,0.08)" }} />
            <div className="absolute bottom-6 right-6 h-10 w-[1px]" style={{ backgroundColor: isEven ? "rgba(212,181,150,0.2)" : "rgba(22,40,50,0.08)" }} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} id="features" className="relative">
      {/* Section header — aligned with card text (px-16 inside 50% grid) */}
      <div className="px-5 sm:px-8 lg:px-16 pt-16 lg:pt-24 pb-8 lg:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--saga-accent)" }} />
              <span
                className="text-[11px] font-medium uppercase tracking-[0.3em]"
                style={{ color: "var(--saga-accent)" }}
              >
                Для Вашего дома
              </span>
            </div>
            <h2
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
              style={{ color: "var(--saga-primary)" }}
            >
              Что делает наши
              <br />
              системы{" "}
              <span style={{ color: "var(--saga-accent)" }}>особенными</span>
            </h2>
          </div>

          <p
            className="text-sm leading-relaxed max-w-sm lg:text-right"
            style={{ color: "rgba(22, 40, 50, 0.4)" }}
          >
            Каждая деталь спроектирована с вниманием к Вашему комфорту,
            безопасности и эстетике пространства.
          </p>
        </motion.div>
      </div>

      {/* Feature cards — full-bleed alternating layout */}
      <div className="space-y-0">
        {features.map((feature, i) => (
          <FeatureCard key={feature.number} feature={feature} index={i} />
        ))}
      </div>

      {/* Bottom spacer */}
      <div className="h-16 lg:h-24" />
    </section>
  );
}
