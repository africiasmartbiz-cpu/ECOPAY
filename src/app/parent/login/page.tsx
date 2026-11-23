"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Building2, 
  Lock, 
  GraduationCap,
  MessageSquare,
  ArrowLeft
} from "lucide-react";

export default function ParentLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Données renvoyées par l'API
  const [parentInfo, setParentInfo] = useState<{
    parentName?: string;
    schoolName?: string;
    childrenCount?: number;
    childrenNames?: string[];
    simulatedCode?: string;
    whatsappUrl?: string;
  } | null>(null);

  // 1. Demande du code OTP par WhatsApp
  const handleRequestOtp = async (customPhone?: string) => {
    setError(null);
    setLoading(true);
    const targetPhone = customPhone || phone;

    try {
      const res = await fetch("/api/auth/parent-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_OTP", phone: targetPhone })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Impossible d'envoyer le code.");
        return;
      }

      setParentInfo(data);
      setCode(""); // Case de confirmation vide : l'utilisateur doit saisir le code identique reçu sur WhatsApp
      setStep("OTP");

      // Redirection / ouverture directe vers WhatsApp
      if (data.whatsappUrl && typeof window !== "undefined") {
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (err) {
      setError("Erreur technique lors de la demande.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Vérification du code OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/parent-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "VERIFY_OTP", 
          phone, 
          code: code.trim() 
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Code invalide.");
        return;
      }

      // Sauvegarde dans le localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("ecofrais_user", JSON.stringify(data.user));
        localStorage.setItem("schoolpay_user", JSON.stringify(data.user));
      }

      // Redirection immédiate vers l'espace parent
      window.location.href = data.redirectUrl || "/parent";
    } catch (err) {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#14213D] to-indigo-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* En-tête */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <BrandLogo size="md" />
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all backdrop-blur-sm border border-white/10"
        >
          <Building2 className="w-4 h-4 text-[#0284c7]" />
          <span>Accès Direction & Administration →</span>
        </Link>
      </header>

      {/* Carte Centrale */}
      <main className="max-w-md w-full mx-auto my-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-emerald-100">
              <Smartphone className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14213D] tracking-tight">
              Espace Parents & Tuteurs
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Accédez directement à la scolarité de vos enfants avec le <strong>numéro WhatsApp enregistré avec l'élève</strong> lors de son inscription.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Connexion exclusive au numéro WhatsApp de l'élève</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ÉTAPE 1 : NUMÉRO DE TÉLÉPHONE */}
          {step === "PHONE" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Numéro WhatsApp inscrit avec l'élève :
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">
                    🇹🇬
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+228 90 12 34 56"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2] font-mono transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Exemple : 90 11 22 33 ou +228 90 11 22 33
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg btn-glow-green cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Vérification dossier élève..." : "Recevoir mon Code WhatsApp →"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : CODE DE VÉRIFICATION OTP */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1.5">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dossier identifié : <strong>{parentInfo?.parentName}</strong></span>
                </p>
                <p className="text-[11px] text-emerald-800">
                  Établissement : <strong>{parentInfo?.schoolName}</strong>
                </p>
                {parentInfo?.childrenNames && parentInfo.childrenNames.length > 0 && (
                  <div className="pt-1 border-t border-emerald-200/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Élève(s) rattaché(s) :
                    </p>
                    <p className="text-xs font-semibold text-emerald-900">
                      {parentInfo.childrenNames.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Bouton direct pour ouvrir l'application WhatsApp */}
              {parentInfo?.whatsappUrl && (
                <a
                  href={parentInfo.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>📲 Ouvrir WhatsApp pour voir votre code</span>
                </a>
              )}

              <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Le code de sécurité ECO & FRAIS a été envoyé directement sur WhatsApp.</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Code reçu sur WhatsApp (4 chiffres) :
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Vérification stricte
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  required
                  autoFocus
                  value={code}
                  onChange={e => {
                    setError(null);
                    setCode(e.target.value.replace(/\D/g, ""));
                  }}
                  placeholder="••••"
                  className={`w-full text-center tracking-[0.5em] py-3.5 bg-slate-50 border rounded-2xl text-2xl font-black text-slate-900 outline-none focus:bg-white font-mono transition-all ${
                    code.length === 4 && parentInfo?.simulatedCode
                      ? code === parentInfo.simulatedCode
                        ? "border-emerald-500 ring-2 ring-emerald-400/50 bg-emerald-50/20"
                        : "border-red-400 ring-2 ring-red-400/50 bg-red-50/20"
                      : "border-slate-200 focus:ring-2 focus:ring-[#0284c7]"
                  }`}
                />

                {/* Indicateur de conformité en direct */}
                {code.length === 4 && parentInfo?.simulatedCode ? (
                  code === parentInfo.simulatedCode ? (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Code identique au code envoyé sur WhatsApp !</span>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-xl text-[11px] font-bold text-red-700 flex items-center justify-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Code non identique au message WhatsApp</span>
                    </div>
                  )
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                    Saisissez dans cette case les 4 chiffres reçus sur votre application WhatsApp.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 4}
                className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Vérification du code..." : "Valider & Ouvrir mon Espace Parent →"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  className="font-bold text-[#0284c7] hover:underline cursor-pointer"
                >
                  Renvoyer un nouveau code sur WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("PHONE");
                    setCode("");
                    setError(null);
                  }}
                  className="font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Changer de numéro</span>
                </button>
              </div>
            </form>
          )}

          {/* Note de Sécurité */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Connexion sécurisée chiffrée • Togo (XOF)</span>
          </div>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ECO & FRAIS (Eco~frais) Togo • Application de Gestion Scolaire & Recouvrement
      </footer>
    </div>
  );
}
