import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const navLinks = [
  { label: "Для Вашего дома", href: "#features" },
  { label: "О нас", href: "#why-us" },
  { label: "Наши работы", href: "#portfolio" },
  { label: "Калькулятор", href: "/calculator/cascade" },
];

export function LandingFooter() {
  return (
    <footer id="contacts" style={{ backgroundColor: "var(--saga-primary)" }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Logo size="sm" className="[&_img]:brightness-0 [&_img]:invert" />
            <p className="mt-5 text-sm text-white/40 max-w-sm leading-relaxed">
              Премиальные раздвижные и межкомнатные дверные системы.
              Индивидуальный подход, безупречное качество, профессиональный монтаж.
            </p>
          </div>

          {/* Nav */}
          <div className="md:col-span-3">
            <h3
              className="text-xs font-semibold uppercase tracking-[0.2em] mb-5"
              style={{ color: "var(--saga-accent)" }}
            >
              Навигация
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h3
              className="text-xs font-semibold uppercase tracking-[0.2em] mb-5"
              style={{ color: "var(--saga-accent)" }}
            >
              Контакты
            </h3>
            <div className="space-y-3 text-sm text-white/40">
              <p>+998 XX XXX XX XX</p>
              <p>info@saga.uz</p>
              <p>г. Ташкент</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} SAGA. Все права защищены.
          </p>
          <p className="text-xs text-white/15">
            Premium Door Systems
          </p>
        </div>
      </div>
    </footer>
  );
}
