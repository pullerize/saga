"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

const navLinks = [
  { label: "Для Вашего дома", href: "#features" },
  { label: "О нас", href: "#why-us" },
  { label: "Наши работы", href: "#portfolio" },
  { label: "Контакты", href: "#contacts" },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 50));
  }, [scrollY]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(22,40,50,0.06)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="shrink-0 relative">
              <motion.div
                animate={{ opacity: scrolled ? 1 : 0, scale: scrolled ? 1 : 0.9 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Logo size="sm" />
              </motion.div>
              <motion.div
                animate={{ opacity: scrolled ? 0 : 1, scale: scrolled ? 0.9 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Logo size="sm" className="[&_img]:brightness-0 [&_img]:invert" />
              </motion.div>
            </Link>

            {/* Desktop nav — centered pill */}
            <nav
              className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-500"
              style={{
                backgroundColor: scrolled ? "var(--brand-50)" : "rgba(255,255,255,0.08)",
                border: scrolled ? "1px solid rgba(22,40,50,0.06)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 rounded-full text-[13px] font-medium tracking-wide transition-all duration-300 hover:bg-white/10"
                  style={{
                    color: scrolled ? "var(--saga-primary)" : "rgba(255,255,255,0.7)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = scrolled ? "var(--saga-primary)" : "white";
                    e.currentTarget.style.backgroundColor = scrolled ? "white" : "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = scrolled ? "var(--saga-primary)" : "rgba(255,255,255,0.7)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Language */}
              <div
                className="flex items-center gap-0.5 text-xs rounded-full px-1 py-1 transition-all duration-500"
                style={{
                  backgroundColor: scrolled ? "var(--brand-50)" : "rgba(255,255,255,0.06)",
                  border: scrolled ? "1px solid rgba(22,40,50,0.06)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <button
                  className="px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: scrolled ? "white" : "rgba(255,255,255,0.12)",
                    color: scrolled ? "var(--saga-primary)" : "white",
                    fontSize: "11px",
                  }}
                >
                  RU
                </button>
                <button
                  className="px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer hover:bg-white/5"
                  style={{
                    color: scrolled ? "rgba(22,40,50,0.35)" : "rgba(255,255,255,0.35)",
                    fontSize: "11px",
                  }}
                >
                  UZ
                </button>
              </div>

              {/* CTA */}
              <Link
                href="/auth/login"
                className="group inline-flex items-center gap-2 h-10 px-5 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-300 active:scale-[0.97]"
                style={{
                  backgroundColor: scrolled ? "var(--saga-primary)" : "var(--saga-accent)",
                  color: scrolled ? "white" : "var(--saga-primary)",
                }}
              >
                Рассчитать
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              style={{
                backgroundColor: scrolled ? "var(--brand-50)" : "rgba(255,255,255,0.08)",
                color: scrolled ? "var(--saga-primary)" : "white",
              }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu — fullscreen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: "var(--saga-primary)" }}
          >
            {/* Close zone top */}
            <div className="h-16" />

            <div className="px-8 pt-8">
              {/* Nav links */}
              <nav className="space-y-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="flex items-center justify-between py-4 text-lg font-display font-semibold text-white/80 hover:text-white transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {link.label}
                    <ArrowRight className="w-4 h-4 text-white/20" />
                  </motion.a>
                ))}
              </nav>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="mt-10"
              >
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full h-14 rounded-full text-sm font-semibold tracking-wide"
                  style={{ backgroundColor: "var(--saga-accent)", color: "var(--saga-primary)" }}
                >
                  Рассчитать стоимость
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Language */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="mt-6 flex items-center gap-3"
              >
                <button className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-white cursor-pointer">
                  RU
                </button>
                <button className="px-4 py-2 rounded-full text-xs font-medium text-white/30 cursor-pointer">
                  UZ
                </button>
              </motion.div>

              {/* Bottom info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="absolute bottom-10 left-8 right-8"
              >
                <p className="text-xs text-white/20">+998 XX XXX XX XX</p>
                <p className="text-xs text-white/15 mt-1">info@saga.uz</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
