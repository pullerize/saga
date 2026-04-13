"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  FileText,
  ArrowRight,
  LogOut,
} from "lucide-react";

export default function PartnerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-brand-600">Кабинет партнёра</span>
        </div>
        <Link href="/auth/login">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            Выйти
          </Button>
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Добро пожаловать!
          </h1>
          <p className="text-muted-foreground mt-1">Панель партнёра SAGA</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/partner/calculations">
            <Card className="cursor-pointer hover:border-brand-300 transition-colors">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium">Мои расчёты</p>
                    <p className="text-sm text-muted-foreground">История всех расчётов</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/calculator">
            <Card className="cursor-pointer hover:border-brand-300 transition-colors">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium">Новый расчёт</p>
                    <p className="text-sm text-muted-foreground">Открыть калькулятор</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
