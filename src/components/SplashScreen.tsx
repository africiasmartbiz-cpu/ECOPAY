"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export function SplashScreen({ onFinish, durationMs = 1800 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Vérifier si le splash a déjà été joué dans cette session
    const hasSeenSplash = sessionStorage.getItem("ecofrais_splash_seen");
    if (hasSeenSplash) {
      setIsVisible(false);
      if (onFinish) onFinish();
      return;
    }

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 400);

    const endTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("ecofrais_splash_seen", "true");
      if (onFinish) onFinish();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [durationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0A101D] via-[#101C33] to-[#0A1826] text-white transition-opacity duration-500 select-none ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Auréoles luminescentes en arrière-plan */}
      <div className="absolute w-96 h-96 rounded-full bg-sky-500/15 blur-3xl animate-pulse pointer-events-none -top-12 -left-12"></div>
      <div className="absolute w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl animate-pulse pointer-events-none -bottom-12 -right-12"></div>

      {/* Bouton Passer discret */}
      <button
        onClick={() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem("ecofrais_splash_seen", "true");
            if (onFinish) onFinish();
          }, 200);
        }}
        className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-sm"
      >
        Passer →
      </button>

      {/* Conteneur Logo avec Animation Captivante */}
      <div className="relative flex flex-col items-center justify-center space-y-6">
        {/* Halo et cercle de mise en valeur */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#10b981] opacity-75 blur-xl animate-pulse"></div>
          
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white p-2.5 shadow-2xl shadow-sky-500/30 flex items-center justify-center transform hover:scale-105 transition-all duration-700 animate-in zoom-in-75 duration-700">
            <img
              src="/logo.jpg"
              alt="Logo Eco~frais"
              className="w-full h-full object-contain drop-shadow-md rounded-2xl"
            />
          </div>
        </div>

        {/* Typographie animée */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <div className="text-3xl sm:text-4xl font-black tracking-tight flex items-center justify-center gap-1">
            <span className="text-[#0284c7] drop-shadow-sm">Eco</span>
            <span className="text-[#10b981] drop-shadow-sm">~frais</span>
          </div>
          <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-300">
            Application de Gestion Scolaire
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Togo & Zone UEMOA • Mobile Money & Caisse</span>
          </div>
        </div>

        {/* Barre de chargement élégante */}
        <div className="w-48 sm:w-60 h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#10b981] rounded-full animate-pulse transition-all duration-1000 w-full"></div>
        </div>
      </div>
    </div>
  );
}
