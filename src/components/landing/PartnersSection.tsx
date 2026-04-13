"use client";

import { motion } from "framer-motion";

const partners = [
  { name: "Alumil", desc: "Профильные системы" },
  { name: "Schüco", desc: "Фурнитура" },
  { name: "AGC Glass", desc: "Стекло" },
  { name: "Siegenia", desc: "Механизмы" },
  { name: "Häfele", desc: "Комплектующие" },
  { name: "GU Group", desc: "Фурнитура" },
];

export function PartnersSection() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: "var(--brand-50)" }}>
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,181,150,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 lg:mb-20">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--saga-accent)" }} />
              <span className="text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: "var(--saga-accent)" }}>
                Партнёры
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
              style={{ color: "var(--saga-primary)" }}
            >
              Работаем с{" "}
              <span style={{ color: "var(--saga-accent)" }}>лучшими</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-sm leading-relaxed max-w-sm lg:text-right"
            style={{ color: "rgba(22, 40, 50, 0.4)" }}
          >
            Мы используем комплектующие исключительно от ведущих
            европейских производителей.
          </motion.p>
        </div>

        {/* Partners grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="group relative"
            >
              <div
                className="relative rounded-2xl p-6 lg:p-8 flex flex-col items-center justify-center aspect-square overflow-hidden transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-1"
                style={{
                  backgroundColor: "white",
                  border: "1px solid rgba(22,40,50,0.06)",
                }}
              >
                {/* Hover accent glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(circle at 50% 50%, rgba(212,181,150,0.08) 0%, transparent 70%)",
                  }}
                />

                {/* Corner accent on hover */}
                <div
                  className="absolute top-0 left-0 w-0 group-hover:w-10 h-[2px] transition-all duration-500"
                  style={{ backgroundColor: "var(--saga-accent)" }}
                />
                <div
                  className="absolute top-0 left-0 h-0 group-hover:h-10 w-[2px] transition-all duration-500"
                  style={{ backgroundColor: "var(--saga-accent)" }}
                />

                {/* Logo placeholder */}
                <div className="relative mb-4">
                  <span
                    className="font-display text-xl lg:text-2xl font-bold tracking-tight transition-colors duration-300 group-hover:text-[var(--saga-primary)]"
                    style={{ color: "rgba(22,40,50,0.25)" }}
                  >
                    {partner.name}
                  </span>
                </div>

                {/* Description */}
                <span
                  className="relative text-[10px] uppercase tracking-[0.15em] transition-colors duration-300"
                  style={{ color: "rgba(22,40,50,0.2)" }}
                >
                  {partner.desc}
                </span>

                {/* Bottom line */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-1/2 transition-all duration-500 rounded-full"
                  style={{ backgroundColor: "var(--saga-accent)" }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Infinite marquee */}
        <div className="mt-14 lg:mt-20 overflow-hidden">
          <div className="relative h-[1px] mb-8" style={{ backgroundColor: "rgba(22,40,50,0.06)" }} />

          <div className="flex whitespace-nowrap">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex shrink-0"
            >
              {[...partners, ...partners].map((partner, i) => (
                <span
                  key={i}
                  className="mx-8 lg:mx-12 font-display text-2xl lg:text-3xl font-bold select-none"
                  style={{ color: "rgba(22,40,50,0.06)" }}
                >
                  {partner.name}
                </span>
              ))}
            </motion.div>
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex shrink-0"
            >
              {[...partners, ...partners].map((partner, i) => (
                <span
                  key={`dup-${i}`}
                  className="mx-8 lg:mx-12 font-display text-2xl lg:text-3xl font-bold select-none"
                  style={{ color: "rgba(22,40,50,0.06)" }}
                >
                  {partner.name}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
