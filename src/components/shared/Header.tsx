"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useCalculatorStore } from "@/stores/calculator";
import { LogIn, LogOut, Shield, Menu, X, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const defaultSteps = [
  { label: "Подсистема", fallback: "Параметры" },
  { label: "Стекло", fallback: "Тип стекла" },
  { label: "Шотланки", fallback: "Разделители" },
  { label: "Результат", fallback: "Расчёт" },
];

export function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const store = useCalculatorStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoClick = () => {
    setMobileOpen(false);
    store.reset();
    router.push("/");
  };

  const isCalculator = pathname.startsWith("/calculator/");

  // Steps with selected values
  const steps = useMemo(() => {
    if (!isCalculator) return [];
    return defaultSteps.map((step, i) => {
      let desc = step.fallback;
      switch (i) {
        case 0: if (store.subsystemId) desc = store.subsystemId; break;
        case 1: if (store.glass) desc = store.glass; break;
        case 2: if (store.shotlan) desc = store.shotlan; break;
      }
      return { ...step, description: desc };
    });
  }, [isCalculator, store.subsystemId, store.glass, store.shotlan]);

  return (
    <header className="sticky top-0 z-50 glass-effect">
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="grid h-16 items-center" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          {/* Logo */}
          <button onClick={handleLogoClick} className="cursor-pointer shrink-0 justify-self-start">
            <Logo size="sm" />
          </button>

          {/* Steps bar — only on calculator pages */}
          {isCalculator && steps.length > 0 ? (
            <nav className="hidden md:flex items-center justify-center min-w-0 px-4">
              <div className="max-w-2xl w-full">
              <ol className="flex items-center w-full">
                {steps.map((step, index) => {
                  const isComplete = index < store.currentStep;
                  const isCurrent = index === store.currentStep;

                  return (
                    <li
                      key={step.label}
                      className={cn("flex items-center min-w-0", index < steps.length - 1 && "flex-1")}
                    >
                      <button
                        onClick={() => {
                          if (isComplete) store.setStep(index);
                        }}
                        disabled={!isComplete}
                        className={cn(
                          "flex items-center gap-2 min-w-0",
                          isComplete && "cursor-pointer group"
                        )}
                      >
                        {/* Circle */}
                        <div
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                            isComplete && "bg-brand-600 text-white",
                            isCurrent && "bg-brand-600 text-white ring-2 ring-brand-300 ring-offset-1",
                            !isComplete && !isCurrent && "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          {isComplete ? <Check className="w-3 h-3" /> : index + 1}
                        </div>

                        {/* Text */}
                        <div className="hidden lg:block text-left min-w-0">
                          <p className={cn(
                            "text-[11px] font-semibold leading-none truncate",
                            (isComplete || isCurrent) ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5 max-w-[100px]">
                            {step.description}
                          </p>
                        </div>
                      </button>

                      {/* Connector */}
                      {index < steps.length - 1 && (
                        <div className="flex-1 mx-2 h-px bg-border relative min-w-[12px]">
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 bg-brand-600 transition-all duration-300",
                              isComplete ? "w-full" : "w-0"
                            )}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              </div>
            </nav>
          ) : (
            <div />
          )}

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0 justify-self-end">
            <nav className="hidden md:flex items-center gap-6">
              {session && (
                <Link href="/partner" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Кабинет
                </Link>
              )}
              {session?.user?.role === "ADMIN" && (
                <Link href="/admin" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Админ
                </Link>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {session ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    {session.user?.name}
                    {session.user?.role === "ADMIN" && <Shield className="w-3 h-3 inline ml-1 text-brand-500" />}
                  </span>
                  <Button variant="outline" size="sm" className="gap-2 h-8 text-xs" onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="w-3.5 h-3.5" />
                    Выйти
                  </Button>
                </>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                    <LogIn className="w-3.5 h-3.5" />
                    Войти
                  </Button>
                </Link>
              )}
            </div>

            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 py-4 space-y-3 animate-fade-in">
            {session && (
              <Link href="/partner" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
                Кабинет
              </Link>
            )}
            {session?.user?.role === "ADMIN" && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors">
                Админ
              </Link>
            )}
            <div className="pt-3 border-t border-border/50 px-3">
              {session ? (
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}>
                  <LogOut className="w-4 h-4" />
                  Выйти ({session.user?.name})
                </Button>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <LogIn className="w-4 h-4" />
                    Войти
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
