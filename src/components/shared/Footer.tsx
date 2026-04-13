import Link from "next/link";
import { Logo } from "./Logo";

const navLinks = [
  { label: "Системы", href: "/#systems" },
  { label: "Калькулятор", href: "/calculator/cascade" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-brand-800/50 bg-brand-950 text-brand-200">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Logo size="sm" className="[&_h1]:text-white [&_p]:text-brand-400" />
            <p className="mt-5 text-sm text-brand-400 max-w-sm leading-relaxed">
              Премиальные дверные системы. Конфигуратор для быстрого расчёта
              стоимости и подбора комплектующих.
            </p>
          </div>

          {/* Nav */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300 mb-5">
              Навигация
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300 mb-5">
              Контакты
            </h3>
            <div className="space-y-3 text-sm text-brand-400">
              <p>+998 XX XXX XX XX</p>
              <p>info@saga.uz</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-brand-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-500">
            &copy; {new Date().getFullYear()} SAGA. Все права защищены.
          </p>
          <p className="text-xs text-brand-600">
            Premium Door Systems
          </p>
        </div>
      </div>
    </footer>
  );
}
