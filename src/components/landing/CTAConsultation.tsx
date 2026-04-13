"use client";

import { motion, useScroll, useTransform, useMotionValue, animate } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { ArrowRight, Phone, Check, ChevronRight } from "lucide-react";

export function CTAConsultation() {
  const ref = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s'-]/g, "");
    setName(val);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d+]/g, "");
    // Always keep +998 prefix
    if (!raw.startsWith("+998")) raw = "+998";
    // Limit to +998 + 9 digits
    const digits = raw.slice(4).replace(/\D/g, "").slice(0, 9);
    // Format: +998 XX XXX XX XX
    let formatted = "+998";
    if (digits.length > 0) formatted += " " + digits.slice(0, 2);
    if (digits.length > 2) formatted += " " + digits.slice(2, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 7);
    if (digits.length > 7) formatted += " " + digits.slice(7, 9);
    setPhone(formatted);
  };
  const [verified, setVerified] = useState(false);
  const [dragging, setDragging] = useState(false);
  const sliderX = useMotionValue(0);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  const handleSliderDragEnd = useCallback(() => {
    setDragging(false);
    if (!sliderTrackRef.current) return;
    const trackWidth = sliderTrackRef.current.offsetWidth - 52; // thumb width
    if (sliderX.get() >= trackWidth * 0.85) {
      animate(sliderX, trackWidth, { duration: 0.2 });
      setVerified(true);
    } else {
      animate(sliderX, 0, { type: "spring", stiffness: 400, damping: 25 });
    }
  }, [sliderX]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.1"],
  });

  // Stage 1 (0–0.3): tiny circle appears in center
  // Stage 2 (0.3–0.7): expands into rounded rectangle
  // Stage 3 (0.7–1.0): snaps to full screen
  const clipPath = useTransform(
    scrollYProgress,
    [0, 0.15, 0.5, 1],
    [
      "inset(48% 48% 48% 48% round 50%)",
      "inset(30% 25% 30% 25% round 3rem)",
      "inset(8% 4% 8% 4% round 1.5rem)",
      "inset(0% 0% 0% 0% round 0rem)",
    ]
  );
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 0.9, 1]);
  const rotate = useTransform(scrollYProgress, [0, 0.4, 1], [3, -1, 0]);
  const bgBlur = useTransform(scrollYProgress, [0, 0.4], [20, 0]);
  const innerY = useTransform(scrollYProgress, [0.5, 1], [80, 0]);
  const innerOpacity = useTransform(scrollYProgress, [0.3, 0.8], [0, 1]);
  const innerScale = useTransform(scrollYProgress, [0.5, 1], [0.9, 1]);

  // Static particles — no Math.random to avoid hydration mismatch
  const particles = [
    { id: 0, x: 5, y: 12, size: 3, duration: 18, delay: 0 },
    { id: 1, x: 15, y: 68, size: 2, duration: 22, delay: 3 },
    { id: 2, x: 25, y: 35, size: 4, duration: 16, delay: 1 },
    { id: 3, x: 35, y: 82, size: 2, duration: 25, delay: 5 },
    { id: 4, x: 42, y: 20, size: 3, duration: 20, delay: 2 },
    { id: 5, x: 55, y: 55, size: 2, duration: 28, delay: 7 },
    { id: 6, x: 62, y: 8, size: 3, duration: 17, delay: 4 },
    { id: 7, x: 70, y: 45, size: 4, duration: 23, delay: 1 },
    { id: 8, x: 78, y: 75, size: 2, duration: 19, delay: 6 },
    { id: 9, x: 85, y: 30, size: 3, duration: 26, delay: 3 },
    { id: 10, x: 92, y: 60, size: 2, duration: 21, delay: 8 },
    { id: 11, x: 10, y: 90, size: 3, duration: 24, delay: 2 },
    { id: 12, x: 48, y: 42, size: 4, duration: 15, delay: 5 },
    { id: 13, x: 30, y: 5, size: 2, duration: 27, delay: 9 },
    { id: 14, x: 88, y: 88, size: 3, duration: 18, delay: 4 },
    { id: 15, x: 20, y: 50, size: 2, duration: 22, delay: 6 },
  ];

  return (
    <section ref={ref} className="relative">
      <motion.div
        style={{
          clipPath,
          scale,
          rotate,
          filter: useTransform(bgBlur, (v) => `blur(${v}px)`),
        }}
        className="relative overflow-hidden min-h-svh flex items-center"
      >
        {/* ── Background ── */}
        <div className="absolute inset-0" style={{ backgroundColor: "var(--saga-primary)" }}>
          {/* Morphing gradient */}
          <motion.div
            animate={{
              background: [
                "radial-gradient(ellipse 50% 60% at 15% 50%, rgba(212,181,150,0.14) 0%, transparent 70%)",
                "radial-gradient(ellipse 60% 50% at 75% 25%, rgba(212,181,150,0.14) 0%, transparent 70%)",
                "radial-gradient(ellipse 55% 55% at 50% 80%, rgba(212,181,150,0.14) 0%, transparent 70%)",
                "radial-gradient(ellipse 50% 60% at 15% 50%, rgba(212,181,150,0.14) 0%, transparent 70%)",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
          />

          {/* Particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.id % 3 === 0 ? "var(--saga-accent)" : "white",
                opacity: p.id % 3 === 0 ? 0.15 : 0.04,
              }}
              animate={{
                y: [0, -30, 10, -20, 0],
                x: [0, 15, -10, 5, 0],
                opacity: p.id % 3 === 0
                  ? [0.15, 0.25, 0.1, 0.2, 0.15]
                  : [0.04, 0.08, 0.03, 0.06, 0.04],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* SAGA watermark */}
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
            <span
              className="font-display font-bold whitespace-nowrap opacity-[0.02]"
              style={{ fontSize: "clamp(10rem, 22vw, 25rem)", color: "white", letterSpacing: "0.15em" }}
            >
              SAGA
            </span>
          </div>

          {/* Noise */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* ── Content ── */}
        <motion.div
          style={{ y: innerY, opacity: innerOpacity, scale: innerScale }}
          className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — text */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-[1px]" style={{ backgroundColor: "var(--saga-accent)" }} />
                <span className="text-[11px] font-medium uppercase tracking-[0.3em]" style={{ color: "var(--saga-accent)" }}>
                  Консультация
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.08]">
                Не знаете, что
                <br />
                именно Вам{" "}
                <span className="relative">
                  <span style={{ color: "var(--saga-accent)" }}>нужно?</span>
                  {/* Underline accent */}
                  <motion.span
                    className="absolute -bottom-1 left-0 h-[2px] rounded-full"
                    style={{ backgroundColor: "var(--saga-accent)", opacity: 0.5 }}
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              </h2>

              <p className="mt-5 text-sm sm:text-base leading-relaxed text-white/40 max-w-md">
                Мы поможем подобрать оптимальное решение для Вашего пространства.
                Оставьте номер телефона, и наш специалист свяжется с Вами
                в течение 30 минут.
              </p>

              {/* Trust markers */}
              <div className="mt-10 flex items-center gap-8">
                {[
                  { val: "30 мин", label: "время ответа" },
                  { val: "Бесплатно", label: "консультация" },
                  { val: "7 дней", label: "в неделю" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-lg font-display font-bold text-white">{item.val}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/25 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form card */}
            <div>
              <div
                className="relative rounded-2xl p-8 sm:p-10"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >

                {/* Card content */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "rgba(212,181,150,0.1)", border: "1px solid rgba(212,181,150,0.1)" }}
                    >
                      <Phone className="w-4 h-4" style={{ color: "var(--saga-accent)" }} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-white">
                        Оставьте заявку
                      </h3>
                      <p className="text-[11px] text-white/30">
                        Перезвоним в течение 30 минут
                      </p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2 block">
                        Ваше имя
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Введите имя"
                        className="w-full h-14 rounded-xl px-5 text-sm text-white placeholder:text-white/15 transition-all duration-300 focus:outline-none"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.04)",
                          border: `1px solid ${focusedField === "name" ? "var(--saga-accent)" : "rgba(255,255,255,0.06)"}`,
                          boxShadow: focusedField === "name" ? "0 0 0 4px rgba(212,181,150,0.08), 0 0 20px rgba(212,181,150,0.05)" : "none",
                        }}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2 block">
                        Номер телефона
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        onFocus={() => setFocusedField("phone")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="+998 __ ___ __ __"
                        className="w-full h-14 rounded-xl px-5 text-sm text-white placeholder:text-white/15 transition-all duration-300 focus:outline-none tabular-nums"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.04)",
                          border: `1px solid ${focusedField === "phone" ? "var(--saga-accent)" : "rgba(255,255,255,0.06)"}`,
                          boxShadow: focusedField === "phone" ? "0 0 0 4px rgba(212,181,150,0.08), 0 0 20px rgba(212,181,150,0.05)" : "none",
                        }}
                      />
                    </div>

                    {/* Slide captcha */}
                    <div
                      ref={sliderTrackRef}
                      className="relative w-full h-14 rounded-xl overflow-hidden select-none"
                      style={{
                        backgroundColor: verified ? "rgba(212,181,150,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${verified ? "rgba(212,181,150,0.25)" : "rgba(255,255,255,0.06)"}`,
                        transition: "all 0.4s",
                      }}
                    >
                      {/* Fill progress */}
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-xl"
                        style={{
                          width: useTransform(sliderX, (v) => v + 52),
                          background: "linear-gradient(90deg, rgba(212,181,150,0.08), rgba(212,181,150,0.15))",
                        }}
                      />

                      {/* Label */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {verified ? (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 text-xs font-medium tracking-wide"
                            style={{ color: "var(--saga-accent)" }}
                          >
                            <Check className="w-4 h-4" />
                            Подтверждено
                          </motion.span>
                        ) : (
                          <motion.span
                            animate={{ opacity: dragging ? 0 : [0.3, 0.5, 0.3] }}
                            transition={dragging ? { duration: 0.15 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="text-xs font-medium tracking-wide text-white/30"
                          >
                            Сдвиньте для подтверждения →
                          </motion.span>
                        )}
                      </div>

                      {/* Draggable thumb */}
                      {!verified && (
                        <motion.div
                          drag="x"
                          dragConstraints={sliderTrackRef}
                          dragElastic={0}
                          dragMomentum={false}
                          onDragStart={() => setDragging(true)}
                          onDragEnd={handleSliderDragEnd}
                          style={{ x: sliderX }}
                          className="absolute top-1 left-1 w-12 h-12 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
                        >
                          <div
                            className="w-full h-full rounded-lg flex items-center justify-center transition-all duration-200"
                            style={{
                              backgroundColor: "var(--saga-accent)",
                              boxShadow: dragging
                                ? "0 0 20px rgba(212,181,150,0.3), 0 4px 12px rgba(0,0,0,0.2)"
                                : "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                          >
                            <ChevronRight className="w-5 h-5" style={{ color: "var(--saga-primary)" }} />
                          </div>
                        </motion.div>
                      )}

                      {/* Verified checkmark in thumb position */}
                      {verified && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute top-1 right-1 w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "var(--saga-accent)" }}
                        >
                          <Check className="w-5 h-5" style={{ color: "var(--saga-primary)" }} />
                        </motion.div>
                      )}
                    </div>

                    {/* Submit button — only active after verification */}
                    <button
                      disabled={!verified}
                      className="group relative w-full h-14 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-[rgba(212,181,150,0.15)] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
                      style={{ backgroundColor: "var(--saga-accent)", color: "var(--saga-primary)" }}
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                      <span className="relative inline-flex items-center gap-2">
                        Получить консультацию
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </button>
                  </div>

                  {/* Separator */}
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-[1px] bg-white/[0.06]" />
                    <span className="text-[10px] text-white/20 uppercase tracking-wider">или</span>
                    <div className="flex-1 h-[1px] bg-white/[0.06]" />
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="#"
                      className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-medium text-white/50 transition-all hover:text-white hover:bg-white/[0.04]"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      Instagram
                    </a>
                    <a
                      href="#"
                      className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-medium text-white/50 transition-all hover:text-white hover:bg-white/[0.04]"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      Telegram
                    </a>
                  </div>

                  <p className="mt-5 text-[10px] text-white/15 text-center leading-relaxed">
                    Нажимая кнопку, Вы соглашаетесь с обработкой персональных данных
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
