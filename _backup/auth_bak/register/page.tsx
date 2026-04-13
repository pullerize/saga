"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          companyName: companyName || undefined,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при регистрации");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
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
            Станьте партнёром
            <br />
            <span className="text-gold-light">премиального бренда</span>
          </h2>
          <p className="mt-6 text-brand-300 max-w-md leading-relaxed">
            Получите доступ к эксклюзивным ценам, персональному калькулятору
            и профессиональной поддержке. Развивайте бизнес вместе с SAGA.
          </p>
        </div>
      </div>

      {/* Right: registration form */}
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

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-0 shadow-none sm:border sm:premium-shadow">
                <CardContent className="p-0 sm:p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-3">
                    Заявка отправлена
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Ваш аккаунт создан и ожидает подтверждения администратором.
                    Мы уведомим вас по электронной почте, когда доступ будет открыт.
                  </p>
                  <Link href="/auth/login">
                    <Button variant="premium" size="lg" className="w-full">
                      Вернуться к входу
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">
                Регистрация партнёра
              </h1>
              <p className="text-muted-foreground mb-8">
                Заполните форму для создания партнёрского аккаунта
              </p>

              <Card className="border-0 shadow-none sm:border sm:premium-shadow">
                <CardContent className="p-0 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Имя <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Ваше имя"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Email <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Телефон</label>
                      <Input
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Необязательно. Формат: +7 (999) 123-45-67
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Компания</label>
                      <Input
                        type="text"
                        placeholder="Название компании"
                        autoComplete="organization"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Пароль <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Минимум 6 символов"
                          autoComplete="new-password"
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Подтверждение пароля <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Повторите пароль"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? (
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
                        <UserPlus className="w-4 h-4" />
                      )}
                      {loading ? "Отправка..." : "Зарегистрироваться"}
                    </Button>
                  </form>

                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    Уже есть аккаунт?{" "}
                    <Link
                      href="/auth/login"
                      className="text-brand-500 font-medium hover:text-brand-700 transition-colors"
                    >
                      Войти
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
