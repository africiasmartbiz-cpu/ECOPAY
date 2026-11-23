"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { SplashScreen } from "@/components/SplashScreen";
import { 
  GraduationCap, 
  ArrowRight, 
  Wallet, 
  MessageSquare, 
  Receipt, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  Smartphone,
  Coins
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9FD] text-slate-800 flex flex-col justify-between selection:bg-[#5D3CF2] selection:text-white relative overflow-hidden">
      {/* Écran d'accueil captivant animé (Splash screen au lancement) */}
      <SplashScreen durationMs={2000} />
      {/* Éléments de décor légers (Doodles / Cercles doux) */}
      <div className="absolute top-20 left-12 w-32 h-32 rounded-full bg-orange-400/10 blur-2xl pointer-events-none"></div>
      <div className="absolute top-40 right-16 w-48 h-48 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none"></div>

      {/* 1. Barre de navigation */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between z-20">
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <BrandLogo size="md" showSubtitle={true} />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
          <a href="#features" className="hover:text-[#5D3CF2] transition-colors">Fonctionnalités</a>
          <a href="#stats" className="hover:text-[#5D3CF2] transition-colors">Chiffres clés</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/parent/login"
            className="px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span>👨‍👩‍👧 Espace Parents</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-full bg-[#1E143E] hover:bg-[#5D3CF2] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>Connexion École</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </Link>
        </div>
      </header>

      {/* 2. Section Hero principale avec les cercles illustratifs et badges flottants */}
      <section className="max-w-6xl w-full mx-auto px-6 pt-10 pb-16 text-center relative z-10 flex-1 flex flex-col justify-center">
        {/* Titre & Sous-titre */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm text-xs font-bold text-[#0284c7]">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>ECO & FRAIS • Gestion Scolaire & Écolages Togo & UEMOA</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#1E143E] tracking-tight leading-[1.15]">
            Un avenir meilleur pour la gestion de vos <span className="text-[#0284c7]">écoles</span> & <span className="text-[#10b981]">frais</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Digitalisez les inscriptions, les écolages par tranches, les encaissements guichet en <strong>Espèces, TMoney et Flooz</strong>, et les relances WhatsApp en un clic.
          </p>
        </div>

        {/* Boutons CTA Principaux */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/parent/login"
            className="px-7 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <span>👨‍👩‍👧 Espace Parents (Accès WhatsApp)</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-full bg-[#1E143E] hover:bg-[#5D3CF2] active:scale-95 text-white font-black text-sm shadow-xl transition-all flex items-center gap-2.5 group cursor-pointer"
          >
            <span>🏫 Accès Établissement (Direction & Caisse)</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Badges Flottants de Statistiques (Style de l'image de référence) */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-4 sm:gap-8">
          {/* Cercle Visuel Gauche (Orange) */}
          <div className="hidden lg:flex items-center gap-3 bg-white/90 backdrop-blur-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-[#FF7E5F] flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-[#1E143E]">7.5k+</p>
              <p className="text-[11px] text-slate-500 font-semibold">Élèves inscrits & gérés</p>
            </div>
          </div>

          {/* Badge Central (Vert) */}
          <div className="flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-[#1E143E]">1 Clic</p>
              <p className="text-[11px] text-slate-500 font-semibold">Relances WhatsApp parents</p>
            </div>
          </div>

          {/* Cercle Visuel Droit (Jaune) */}
          <div className="hidden lg:flex items-center gap-3 bg-white/90 backdrop-blur-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-[#FFC043] flex items-center justify-center text-white shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black text-[#1E143E]">100%</p>
              <p className="text-[11px] text-slate-500 font-semibold">Recouvrement Mobile Money</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bandeau Sombre Inférieur avec les Cartes Fonctionnalités (Comme sur l'image) */}
      <section id="features" className="max-w-6xl w-full mx-auto px-6 mb-10">
        <div className="bg-[#1E143E] rounded-3xl p-6 sm:p-10 text-white shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Carte 1 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Caisse & Mobile Money</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Encaissements partiels et complets par tranche en Espèces, TMoney et Flooz.
              </p>
            </div>

            {/* Carte 2 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Passerelle WhatsApp</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                5 modèles automatiques pour rappeler les échéances et notifier les paiements.
              </p>
            </div>

            {/* Carte 3 (Active / Highlighted comme sur la maquette) */}
            <div className="p-4 rounded-2xl bg-[#5D3CF2] shadow-lg shadow-indigo-600/40 border border-indigo-400/30">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center mb-3">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Reçus PDF & QR Code</h4>
              <p className="text-[11px] text-indigo-100 leading-relaxed">
                Génération séquentielle unique avec filigrane officiel et impression instantanée.
              </p>
            </div>

            {/* Carte 4 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white mb-1">5 Espaces Étanches</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Super-Admin, Directeur, Comptable, Admin École et Portail Parent indépendant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer épuré */}
      <footer className="py-6 border-t border-slate-200/60 bg-white text-center text-xs text-slate-400">
        <p>© 2025 ECO & FRAIS (Eco~frais). Application professionnelle de gestion scolaire & des finances (Togo & Afrique de l'Ouest).</p>
      </footer>
    </div>
  );
}
