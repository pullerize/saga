"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";

interface MeCompany {
  id: string | null;
  name: string;
  logoUrl: string | null;
}

interface CompanyBrandProps {
  /** Размер лого Saga (соответствует Logo size). */
  size?: "sm" | "md" | "lg";
  /** Высота логотипа компании партнёра в px (по умолчанию подбирается под size). */
  partnerLogoHeight?: number;
  className?: string;
}

/**
 * Брендовый блок в кабинете: «лого партнёрской компании × лого SAGA».
 * Если пользователь принадлежит Saga Group или у его компании нет логотипа —
 * показываем только логотип SAGA.
 */
export function CompanyBrand({ size = "sm", partnerLogoHeight, className }: CompanyBrandProps) {
  const [company, setCompany] = useState<MeCompany | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Если файл логотипа не загрузился (битый/неподдерживаемый формат, 404) —
  // не показываем «битую картинку», а откатываемся на логотип SAGA.
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (cancelled) return;
        setCompany(c ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  // Лого партнёра рендерим заметно крупнее лого Saga, потому что в кабинете
  // оно — главный бренд страницы, а не подпись.
  const heightBySize = { sm: 40, md: 56, lg: 72 } as const;
  const partnerHeight = partnerLogoHeight ?? heightBySize[size];

  const isExternal =
    !!company &&
    !!company.logoUrl &&
    company.name.trim().toLowerCase() !== "saga group";

  if (!loaded || !isExternal || logoFailed) {
    return <Logo size={size} className={className} />;
  }

  return (
    <div className={`flex items-center ${className ?? ""}`}>
      {/* Логотип партнёрской компании (без SAGA — у партнёра в кабинете
          показываем только его собственный бренд). */}
      <div
        className="flex items-center"
        style={{ height: partnerHeight, maxWidth: partnerHeight * 6 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={company!.logoUrl!}
          alt={company!.name}
          className="h-full w-auto object-contain"
          onError={() => setLogoFailed(true)}
        />
      </div>
    </div>
  );
}
