"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { FileSpreadsheet, Download, FileText, CheckCircle2 } from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function AdminReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let user: any = null;
        try {
          const meRes = await apiFetch("/api/auth/me");
          if (meRes.ok) {
            const meData = await meRes.json();
            user = meData.user;
          }
        } catch (e) {}

        if (!user && typeof window !== "undefined") {
          const saved = (localStorage.getItem("ecofrais_user") || localStorage.getItem("schoolpay_user"));
          if (saved) user = JSON.parse(saved);
        }

        if (!user) {
          window.location.href = "/login";
          return;
        }

        setCurrentUser(user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xs font-semibold text-slate-500">Chargement des rapports...</p>
      </div>
    );
  }

  const reports = [
    {
      title: "Répertoire Complet des Élèves & Soldes",
      desc: "Liste nominative des élèves avec classe, parent, contact, total frais dus, montants versés et soldes restants.",
      type: "students" as const,
      color: "border-blue-200 bg-blue-50/50"
    },
    {
      title: "Journal Général des Encaissements & Caisse",
      desc: "Historique chronologique détaillé de tous les règlements (Espèces, TMoney, Flooz) avec numéros de reçus uniques.",
      type: "payments" as const,
      color: "border-emerald-200 bg-emerald-50/50"
    },
    {
      title: "État des Créances & Dettes Élèves",
      desc: "Suivi ciblé des impayés avec dates limites, coordonnées WhatsApp des tuteurs pour le recouvrement.",
      type: "debts" as const,
      color: "border-red-200 bg-red-50/50"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role={currentUser.role} />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          <div>
            <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
              Centre de Rapports & Exports Financiers
            </h1>
            <p className="text-xs text-slate-500">
              Génération et téléchargement instantané des documents de gestion au format Excel (.xlsx) et PDF
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reports.map((r, i) => (
              <div
                key={i}
                className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between ${r.color}`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-800 shadow-sm mb-4 border">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{r.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80">
                  <ExportExcelButton type={r.type} label="Télécharger Excel (.xlsx)" className="w-full justify-center" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
