"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqItems = [
  {
    question: "Какие виды дверных систем вы предлагаете?",
    answer:
      "Мы предлагаем семь типов систем: каскадные, синхронные, не связанные, врезанные в стену, стены-перегородки, настенные и угловые. Каждая система доступна в различных конфигурациях с возможностью индивидуального подбора стекла и комплектующих.",
  },
  {
    question: "Каковы сроки изготовления и монтажа?",
    answer:
      "Стандартные сроки составляют от 10 до 15 рабочих дней — от первого замера до готовой двери. Точные сроки согласовываются после проведения замера и зависят от сложности проекта.",
  },
  {
    question: "Предоставляете ли Вы гарантию?",
    answer:
      "Да, мы предоставляем гарантию на все комплектующие и монтажные работы. Гарантийный срок на профиль и фурнитуру — от 5 лет, на стекло — 3 года, на монтажные работы — 2 года.",
  },
  {
    question: "Возможна ли установка в готовый ремонт?",
    answer:
      "Безусловно. Наши системы предусматривают монтаж без повреждения существующей отделки. Верхнеподвесной механизм не требует напольных направляющих, что позволяет сохранить целостность напольного покрытия.",
  },
  {
    question: "Как рассчитать стоимость?",
    answer:
      "Вы можете воспользоваться нашим онлайн-калькулятором на сайте для предварительного расчёта. Для точной стоимости рекомендуем вызвать замерщика — эта услуга предоставляется бесплатно.",
  },
  {
    question: "Какие формы оплаты вы принимаете?",
    answer:
      "Мы принимаем наличный и безналичный расчёт, а также предоставляем возможность поэтапной оплаты: 70% предоплата перед производством и 30% после завершения монтажа.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-white">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 80% 20%, rgba(212,181,150,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{ backgroundColor: "rgba(22,40,50,0.06)" }}
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
                FAQ
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
              Часто задаваемые{" "}
              <span style={{ color: "var(--saga-accent)" }}>вопросы</span>
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
            Не нашли ответ? Свяжитесь с нами — мы с радостью поможем.
          </motion.p>
        </div>

        {/* Two-column FAQ layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {faqItems.map((item, i) => {
            const isOpen = openIndex === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={cn(
                  "group rounded-2xl transition-all duration-400 overflow-hidden",
                  isOpen && "lg:col-span-2",
                )}
                style={{
                  backgroundColor: isOpen ? "var(--saga-primary)" : "var(--brand-50)",
                  border: isOpen ? "none" : "1px solid transparent",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-start gap-5 p-6 lg:p-8 text-left cursor-pointer"
                >
                  {/* Number */}
                  <span
                    className="text-3xl lg:text-4xl font-display font-bold shrink-0 leading-none transition-colors duration-300 pt-1"
                    style={{
                      color: isOpen ? "var(--saga-accent)" : "rgba(22,40,50,0.08)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Question text */}
                  <div className="flex-1 min-w-0 pt-2">
                    <span
                      className={cn(
                        "text-base lg:text-lg font-display font-semibold transition-colors duration-300 block",
                        isOpen ? "text-white" : "text-[var(--saga-primary)] group-hover:text-[var(--saga-accent)]"
                      )}
                    >
                      {item.question}
                    </span>
                  </div>

                  {/* Toggle icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all duration-300 mt-1",
                      isOpen ? "rotate-45 bg-[var(--saga-accent)]" : "rotate-0"
                    )}
                    style={{
                      backgroundColor: isOpen ? "var(--saga-accent)" : "rgba(22,40,50,0.06)",
                    }}
                  >
                    <Plus
                      className="w-4 h-4 transition-colors duration-300"
                      style={{
                        color: isOpen ? "var(--saga-primary)" : "rgba(22,40,50,0.3)",
                      }}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 lg:px-8 pb-8 lg:pb-10 lg:pl-[5.5rem]">
                        <div className="max-w-2xl">
                          <div className="w-12 h-[1px] mb-5" style={{ backgroundColor: "var(--saga-accent)", opacity: 0.3 }} />
                          <p className="text-sm sm:text-base leading-relaxed text-white/50">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
