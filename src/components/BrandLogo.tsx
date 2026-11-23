"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BookOpen, Sprout, TrendingUp } from "lucide-react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  className?: string;
}

export function BrandLogo({ size = "md", showSubtitle = false, className = "" }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* ICÔNE / LOGO */}
      <div className={`${iconSizes[size]} relative rounded-xl overflow-hidden bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0`}>
        {!imgError ? (
          <img
            src="/logo.jpg"
            alt="Eco~frais Logo"
            className="w-full h-full object-contain p-0.5"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#10b981] flex items-center justify-center text-white font-black text-sm">
            EF
          </div>
        )}
      </div>

      {/* TYPOGRAPHIE */}
      <div className="flex flex-col justify-center">
        <div className={`font-black ${textSizes[size]} tracking-tight leading-none`}>
          <span className="text-[#0284c7]">Eco</span>
          <span className="text-[#10b981]">~frais</span>
        </div>
        {showSubtitle ? (
          <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase mt-1">
            Application de Gestion Scolaire
          </span>
        ) : (
          <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase mt-0.5">
            ECO & FRAIS
          </span>
        )}
      </div>
    </div>
  );
}
