"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const dimensions = {
    sm: { width: 80, height: 24 },
    md: { width: 120, height: 36 },
    lg: { width: 160, height: 48 },
  };

  const { width, height } = dimensions[size];

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/img/logo/123.png"
        alt="SAGA Group"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
