"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import {
  Calculator,
  Users,
  FileText,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface StatsData {
  calculationsToday: number;
  activePartners: number;
  totalCalculations: number;
  totalRevenue: number;
  recentCalculations: {
    id: string;
    systemName: string;
    clientName: string | null;
    totalPrice: number;
    createdAt: string;
    userName: string | null;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Не удалось загрузить статистику");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        {
          title: "Расчётов сегодня",
          value: stats.calculationsToday.toString(),
          icon: Calculator,
        },
        {
          title: "Активных партнёров",
          value: stats.activePartners.toString(),
          icon: Users,
        },
        {
          title: "Всего расчётов",
          value: stats.totalCalculations.toString(),
          icon: FileText,
        },
        {
          title: "Общая сумма",
          value: `${formatPrice(stats.totalRevenue)} у.е.`,
          icon: TrendingUp,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-muted-foreground text-sm">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Панель управления</h1>
        <p className="text-muted-foreground mt-1">Обзор системы SAGA</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="hover:border-brand-200 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-5 h-5 text-brand-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Последние расчёты
            {stats?.recentCalculations && (
              <Badge variant="secondary">
                {stats.recentCalculations.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentCalculations && stats.recentCalculations.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      ID
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Система
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Клиент
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Пользователь
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Сумма (у.е.)
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCalculations.map((calc) => (
                    <tr
                      key={calc.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-xs font-mono text-muted-foreground">
                        {calc.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {calc.systemName}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {calc.clientName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {calc.userName || "Гость"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right">
                        {formatPrice(calc.totalPrice)}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground text-right">
                        {new Date(calc.createdAt).toLocaleDateString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Расчётов пока нет</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
