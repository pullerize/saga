"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";

interface GuestContactGateProps {
  systemSlug: string;
  systemName: string;
  subsystemName?: string | null;
  fullWidth?: number | null;
  openWidth?: number | null;
  height?: number | null;
  doorWidth?: number | null;
  glassType?: string | null;
  shotlanType?: string | null;
  totalPrice?: number | null;
  onUnlock: () => void;
  onBack: () => void;
}

// Форма перед показом результата для гостей: имя + телефон.
// Лид сохраняется через /api/leads, затем onUnlock() открывает доступ к КП.
// Чтобы лид не дублировался при возврате назад и повторной отправке —
// результат подтверждения хранится в sessionStorage по уникальному ключу.
export function GuestContactGate({
  systemSlug,
  systemName,
  subsystemName,
  fullWidth,
  openWidth,
  height,
  doorWidth,
  glassType,
  shotlanType,
  totalPrice,
  onUnlock,
  onBack,
}: GuestContactGateProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const canSubmit = name.trim().length >= 2 && phoneDigits.length >= 9 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          systemSlug,
          systemName,
          subsystemName,
          fullWidth,
          openWidth,
          height,
          doorWidth,
          glassType,
          shotlanType,
          totalPrice,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось отправить заявку");
      }
      // sessionStorage с разблокировкой больше не пишем — форма должна
      // появляться каждый раз. Контакты сохраняем только для текущего шага.
      try {
        sessionStorage.setItem(
          "guest_lead_contact",
          JSON.stringify({ name: name.trim(), phone: phone.trim() }),
        );
      } catch {
        // ignore storage errors
      }
      void systemSlug;
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Затемнённый фон-оверлей — закрывает таблицу с ценой */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md bg-card rounded-2xl border premium-shadow-lg overflow-hidden my-auto"
      >
        <div className="brand-gradient text-white px-6 sm:px-10 py-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
            Расчёт почти готов
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-md mx-auto">
            Оставьте контактные данные — и мы откроем стоимость, состав КП и пришлём PDF на ваш номер.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-10 py-8 space-y-5">
          <div>
            <label htmlFor="lead-name" className="block text-sm font-medium mb-2">
              Имя <span className="text-destructive">*</span>
            </label>
            <Input
              id="lead-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к Вам обращаться?"
              autoComplete="name"
              required
              minLength={2}
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="lead-phone" className="block text-sm font-medium mb-2">
              Телефон <span className="text-destructive">*</span>
            </label>
            <Input
              id="lead-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123-45-67"
              autoComplete="tel"
              required
              disabled={submitting}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Менеджер свяжется с Вами для уточнения деталей заказа.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onBack}
              disabled={submitting}
              className="gap-2 order-2 sm:order-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
            <Button
              type="submit"
              variant="premium"
              size="lg"
              disabled={!canSubmit}
              className="gap-2 flex-1 order-1 sm:order-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Отправка…
                </>
              ) : (
                "Показать расчёт"
              )}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center pt-2">
            Нажимая «Показать расчёт», Вы соглашаетесь на обработку персональных данных.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
