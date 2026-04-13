"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Users,
  Settings,
  BarChart3,
  Layers,
  Wrench,
  Tag,
  FunctionSquare,
  LayoutGrid,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin/calculator", label: "Карточка клиента", icon: Calculator, description: "Создать карточку клиента и расчёт" },
  { href: "/admin/prices", label: "Цены", icon: Settings, description: "Управление ценами компонентов" },
  { href: "/admin/systems", label: "Системы", icon: Layers, description: "Конструктор дверных систем" },
  { href: "/admin/formulas", label: "Формулы", icon: FunctionSquare, description: "Формулы расчёта по системам" },
  { href: "/admin/characteristics", label: "Характеристики", icon: Tag, description: "Справочник параметров подсистем" },
  { href: "/admin/variants", label: "Варианты", icon: LayoutGrid, description: "Иконки и описания подсистем" },
  { href: "/admin/users", label: "Пользователи", icon: Users, description: "Управление партнёрами" },
  { href: "/admin/services", label: "Услуги", icon: Wrench, description: "Дополнительные услуги" },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3, description: "Архив и статистика" },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-brand-600">Админ-панель</span>
        </div>
        <Link href="/auth/login">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            Выйти
          </Button>
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold">Панель управления</h1>
          <p className="text-muted-foreground mt-1">Обзор системы SAGA</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full cursor-pointer hover:border-brand-300 hover:-translate-y-0.5 transition-all duration-300">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
