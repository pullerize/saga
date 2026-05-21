import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Editable } from "@/components/site-edit/Editable";

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
              <Editable
                contentKey="home.footer.tagline"
                defaultValue="Премиальные раздвижные и межкомнатные дверные системы. Индивидуальный подход, безупречное качество, профессиональный монтаж."
                as="span"
                multiline
              />
            </p>
          </div>

          {/* Nav */}
          <div className="md:col-span-3">
            <h3
              className="text-xs font-semibold uppercase tracking-[0.2em] mb-5"
              style={{ color: "var(--saga-accent)" }}
            >
              <Editable contentKey="home.footer.nav_title" defaultValue="Навигация" as="span" />
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link, i) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    <Editable
                      contentKey={`home.footer.nav${i + 1}_label`}
                      defaultValue={link.label}
                      as="span"
                    />
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
              <Editable contentKey="home.footer.contacts_title" defaultValue="Контакты" as="span" />
            </h3>
            <div className="space-y-3 text-sm text-white/40">
              <p>
                <a href="tel:+998900989889" className="hover:text-white transition-colors">
                  <Editable contentKey="home.footer.contact_phone" defaultValue="+998 90 098-98-89" as="span" />
                </a>
              </p>
              <p>
                <Editable contentKey="home.footer.contact_email" defaultValue="info@perfectsystem.uz" as="span" />
              </p>
              <p>
                <Editable contentKey="home.footer.contact_city" defaultValue="г. Ташкент" as="span" />
              </p>
              <p className="flex items-center gap-3 pt-2">
                <a
                  href="https://www.instagram.com/perfectsystem.uz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  Instagram
                </a>
                <span className="opacity-30">·</span>
                <a
                  href="https://t.me/Foziljon_K"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="Telegram"
                >
                  Telegram
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()}{" "}
            <Editable contentKey="home.footer.copyright" defaultValue="SAGA. Все права защищены." as="span" />
          </p>
          <p className="text-xs text-white/15">
            <Editable contentKey="home.footer.bottom_tagline" defaultValue="Premium Door Systems" as="span" />
          </p>
        </div>
      </div>
    </footer>
  );
}
