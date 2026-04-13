"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface Stats {
  total: number;
  thisMonth: number;
}

export default function PartnerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({ total: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/calculations");
        if (res.ok) {
          const data = await res.json();
          const calculations = data.calculations ?? data ?? [];
          const now = new Date();
          const thisMonth = calculations.filter((c: { createdAt: string }) => {
            const d = new Date(c.createdAt);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
          setStats({
            total: calculations.length,
            thisMonth: thisMonth.length,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Добро пожаловать{session?.user?.name ? `, ${session.user.name}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Панель партнёра SAGA
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего расчётов
            </CardTitle>
            <Calculator className="w-5 h-5 text-brand-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">
              {loading ? "..." : stats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              За этот месяц
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-brand-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">
              {loading ? "..." : stats.thisMonth}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Статус
            </CardTitle>
            <FileText className="w-5 h-5 text-brand-600" />
          </CardHeader>
          <CardContent>
            <Badge variant="success">Активен</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Быстрые действия</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/partner/calculations">
            <Card className="cursor-pointer hover:border-brand-300 transition-colors">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-brand-600" />
                  <div>
                    <p className="font-medium">Мои расчёты</p>
                    <p className="text-sm text-muted-foreground">
                      История всех расчётов
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/">
            <Card className="cursor-pointer hover:border-brand-300 transition-colors">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-brand-600" />
                  <div>
                    <p className="font-medium">Новый расчёт</p>
                    <p className="text-sm text-muted-foreground">
                      Открыть калькулятор
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
