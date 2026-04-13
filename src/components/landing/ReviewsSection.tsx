"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Алексей К.",
    role: "Частный клиент",
    text: "Обратились в SAGA для установки каскадных дверей в загородном доме. Результат превзошёл наши ожидания — качество материалов и монтажа на высшем уровне.",
    rating: 5,
  },
  {
    name: "Дизайн-студия «Интерьер»",
    role: "Партнёр",
    text: "Сотрудничаем с SAGA на протяжении двух лет. Неизменно высокое качество, точное соблюдение сроков и профессиональный подход к каждому проекту.",
    rating: 5,
  },
  {
    name: "Мария Д.",
    role: "Частный клиент",
    text: "Установили стеклянные перегородки в квартире. Помещение преобразилось — стало больше света и пространства. Благодарим команду SAGA за внимательный подход.",
    rating: 5,
  },
];

export function ReviewsSection() {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: "var(--brand-50)" }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "var(--saga-primary)" }}
          >
            Отзывы
          </h2>
          <div
            className="mx-auto mt-4 w-12 h-[2px]"
            style={{ backgroundColor: "var(--saga-accent)" }}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="bg-white rounded-xl p-6 lg:p-8"
              style={{ boxShadow: "0 2px 16px rgba(22, 40, 50, 0.06)" }}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 fill-current"
                    style={{ color: "var(--saga-accent)" }}
                  />
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(22, 40, 50, 0.65)" }}>
                &laquo;{review.text}&raquo;
              </p>

              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--saga-primary)" }}>
                  {review.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(22, 40, 50, 0.4)" }}>
                  {review.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
