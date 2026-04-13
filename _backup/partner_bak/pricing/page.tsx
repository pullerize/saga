"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { DollarSign } from "lucide-react";
import type { Component } from "@/types";

const categoryLabels: Record<string, string> = {
  component: "Комплектующие",
  glass: "Стекло",
  service: "Услуги",
  shotlan: "Шотланки",
};

export default function PartnerPricingPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComponents() {
      try {
        const res = await fetch("/api/admin/components");
        if (res.ok) {
          const data = await res.json();
          setComponents(data.components ?? data ?? []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchComponents();
  }, []);

  // Group by category
  const grouped = components.reduce<Record<string, Component[]>>(
    (acc, comp) => {
      const cat = comp.category || "component";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(comp);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Цены
        </h1>
        <p className="text-muted-foreground mt-1">
          Актуальные цены на комплектующие и услуги
        </p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-muted-foreground">
          Загрузка...
        </div>
      ) : components.length === 0 ? (
        <div className="p-10 text-center">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Данные о ценах отсутствуют</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-brand-600" />
                {categoryLabels[category] ?? category}
                <Badge variant="secondary" className="ml-2">
                  {items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Наименование
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Ключ
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Ед. изм.
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                        Цена
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((comp) => (
                      <tr
                        key={comp.id}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">{comp.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {comp.key}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {comp.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                          {formatPrice(comp.defaultPrice)} сум
                        </td>
                        <td className="px-4 py-3 text-center">
                          {comp.isActive ? (
                            <Badge variant="success">Активен</Badge>
                          ) : (
                            <Badge variant="secondary">Неактивен</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
