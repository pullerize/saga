"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, Loader2, UserRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Неверный логин или пароль");
      return;
    }

    // Fetch session to determine role-based redirect
    const session = await getSession();
    const role = (session?.user as { role?: string })?.role;

    if (role === "ADMIN") {
      router.push("/admin");
    } else if (role === "PARTNER" || role === "MANAGER") {
      router.push("/partner");
    } else {
      router.push("/");
    }
    router.refresh();
  }

  function handleGuest() {
    router.push("/calculator");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: decorative brand panel */}
      <div className="hidden lg:flex lg:w-1/2 brand-gradient relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-center px-16 text-white">
          <Logo size="lg" className="[&_h1]:text-white [&_p]:text-brand-300 mb-12" />
          <h2 className="font-display text-3xl font-bold leading-tight">
            Управляйте бизнесом
            <br />
            <span className="text-gold-light">на новом уровне</span>
          </h2>
          <p className="mt-6 text-brand-300 max-w-md leading-relaxed">
            Полный контроль над ценами, партнёрами и документацией.
            Премиальный инструмент для премиального бренда.
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <h1 className="font-display text-2xl font-bold mb-2">
            Вход в систему
          </h1>
          <p className="text-muted-foreground mb-8">
            Войдите для просмотра результатов расчёта
          </p>

          <Card className="border-0 shadow-none sm:border sm:premium-shadow">
            <CardContent className="p-0 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Логин</label>
                  <Input
                    type="text"
                    placeholder="Введите логин"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Пароль</label>
                    <Link
                      href="#"
                      className="text-xs text-brand-500 hover:text-brand-700 transition-colors"
                    >
                      Забыли пароль?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите пароль"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive font-medium">{error}</p>
                )}

                <Button
                  type="submit"
                  variant="premium"
                  size="lg"
                  className="w-full gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {loading ? "Вход..." : "Войти"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">или</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={handleGuest}
              >
                <UserRound className="w-4 h-4" />
                Войти как гость
              </Button>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Нет аккаунта?{" "}
                <Link
                  href="/auth/register"
                  className="text-brand-500 font-medium hover:text-brand-700 transition-colors"
                >
                  Регистрация партнёра
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
