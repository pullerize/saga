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

interface NavItem {
  href: string;
  label: string;
  icon: typeof Calculator;
  description: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Работа с клиентами",
    items: [
      { href: "/admin/calculator", label: "Карточка клиента", icon: Calculator, description: "Создать карточку клиента и расчёт" },
    ],
  },
  {
    title: "Конфигуратор систем",
    items: [
      { href: "/admin/systems", label: "Системы", icon: Layers, description: "Системы, подсистемы и стекла" },
      { href: "/admin/characteristics", label: "Характеристики", icon: Tag, description: "Справочник параметров" },
      { href: "/admin/formulas", label: "Формулы", icon: FunctionSquare, description: "Формулы расчёта" },
      { href: "/admin/prices", label: "Цены", icon: Settings, description: "Цены компонентов" },
      { href: "/admin/variants", label: "Варианты", icon: LayoutGrid, description: "Иконки, схемы, описания" },
    ],
  },
  {
    title: "Управление",
    items: [
      { href: "/admin/users", label: "Пользователи", icon: Users, description: "Управление партнёрами" },
      { href: "/admin/services", label: "Услуги", icon: Wrench, description: "Дополнительные услуги" },
      { href: "/admin/analytics", label: "Аналитика", icon: BarChart3, description: "Архив и статистика" },
    ],
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
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

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold">Панель управления</h1>
          <p className="text-muted-foreground mt-1">Обзор системы SAGA</p>
        </div>

        <div className="space-y-10">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{group.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((item) => (
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
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
