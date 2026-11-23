"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Coins, Calendar, CheckCircle2, Plus } from "lucide-react";
import { formatXOF } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import { FeePricingSection } from "@/components/FeePricingSection";

export default function AdminFeesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const feeItems = [
    { name: "Frais d'inscription & dossier", amount: 25000, category: "INSCRIPTION", due: "15/09/2024", order: "Obligatoire à l'inscription" },
    { name: "Scolarité Tranche 1 (30%)", amount: 30000, category: "SCOLARITE", due: "15/10/2024", order: "1ère Tranche" },
    { name: "Scolarité Tranche 2 (40%)", amount: 40000, category: "SCOLARITE", due: "15/12/2024", order: "2ème Tranche" },
    { name: "Scolarité Tranche 3 (30%)", amount: 30000, category: "SCOLARITE", due: "15/02/2025", order: "3ème Tranche" },
    { name: "Cantine Scolaire Mensuelle", amount: 15000, category: "CANTINE", due: "05 de chaque mois", order: "Optionnel" },
    { name: "Transport Scolaire Mensuel", amount: 12000, category: "TRANSPORT", due: "05 de chaque mois", order: "Optionnel" }
  ];

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
        <p className="text-xs font-semibold text-slate-500">Chargement de la grille des frais...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role={currentUser.role} />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
                Grille des Frais Scolaires & Échéanciers
              </h1>
              <p className="text-xs text-slate-500">
                Configuration des tranches d'écolage et dates limites pour l'année 2024-2025
              </p>
            </div>
          </div>

          {/* Section Fixation des Prix d'Écolage interactive */}
          <FeePricingSection />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Tranches d'Écolage Configurées</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3.5">Libellé du Frais</th>
                  <th className="p-3.5">Catégorie</th>
                  <th className="p-3.5">Échéance</th>
                  <th className="p-3.5">Période / Tranche</th>
                  <th className="p-3.5 text-right">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {feeItems.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-bold text-slate-900">{f.name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {f.category}
                      </span>
                    </td>
                    <td className="p-3.5 flex items-center gap-1.5 font-mono text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {f.due}
                    </td>
                    <td className="p-3.5 text-slate-500">{f.order}</td>
                    <td className="p-3.5 text-right font-black text-slate-900">
                      {formatXOF(f.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
