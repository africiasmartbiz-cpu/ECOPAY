"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { Receipt, Printer, ExternalLink, Smartphone, Banknote, Building2, ArrowLeft } from "lucide-react";
import { formatXOF, formatDate, formatDateTime } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function AccountingPaymentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
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

        // Récupérer l'historique des encaissements
        const res = await apiFetch("/api/reports/export?type=payments");
        const json = await res.json();
        setPayments(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Chargement de l'historique des paiements...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role={currentUser.role} />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* Barre de Retour en arrière & Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-black text-xs rounded-2xl border border-slate-200 shadow-xs transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-[#5D3CF2] group-hover:-translate-x-1 transition-transform" />
              <span>← Retour en arrière</span>
            </button>

            <div className="flex items-center gap-2">
              <Link
                href="/accounting"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all shadow-2xs"
              >
                <span>Guichet Caisse</span>
              </Link>
              <a
                href="/api/auth/switch-to-admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#5D3CF2] font-bold text-xs rounded-xl border border-indigo-200 transition-all shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Tableau de Bord & Équipe</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
                Historique des Encaissements & Reçus Émis
              </h1>
              <p className="text-xs text-slate-500">
                Traçabilité intégrale des transactions financières (Espèces, TMoney, Flooz)
              </p>
            </div>
            <ExportExcelButton type="payments" label="Exporter le Journal de Caisse (.xlsx)" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-3.5">N° Reçu</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Élève & Classe</th>
                    <th className="p-3.5">Montant Versé</th>
                    <th className="p-3.5">Mode & Référence</th>
                    <th className="p-3.5">Payeur</th>
                    <th className="p-3.5">Caissier</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-mono font-bold text-blue-700">{p["N° Reçu"]}</td>
                      <td className="p-3.5 text-slate-500">{p["Date"]}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{p["Élève"]}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p["Matricule"]} • {p["Classe"]}</p>
                      </td>
                      <td className="p-3.5 font-black text-slate-900">
                        {formatXOF(p["Montant (FCFA)"])}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">
                          {p["Mode de paiement"]}
                        </span>
                        {p["Référence"] && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p["Référence"]}</p>
                        )}
                      </td>
                      <td className="p-3.5">{p["Payeur"]}</td>
                      <td className="p-3.5 text-slate-500">{p["Caissier"]}</td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/receipt/${p.id || 'pay-1'}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold rounded-xl transition-all btn-glow-blue cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Voir Reçu</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
