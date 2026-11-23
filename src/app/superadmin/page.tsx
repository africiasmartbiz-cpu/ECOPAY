"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { 
  Building2, 
  Users, 
  Coins, 
  Headphones, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Send,
  Sparkles
} from "lucide-react";
import { formatXOF, formatDate } from "@/lib/formatters";
import { apiFetch } from "@/lib/api-client";
import { SessionUser } from "@/lib/auth";

export default function SuperAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [targetSchoolId, setTargetSchoolId] = useState<string | null>(null);

  const fetchData = async () => {
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

      // Charger les données de la plateforme
      const res = await apiFetch("/api/superadmin/establishments");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (establishmentId: string, currentStatus: string) => {
    const isSuspended = currentStatus === "SUSPENDED";
    const action = isSuspended ? "ACTIVATE" : "SUSPEND";

    if (!isSuspended && !targetSchoolId) {
      // Ouvrir le prompt de suspension
      setTargetSchoolId(establishmentId);
      return;
    }

    try {
      setActionLoading(true);
      const res = await apiFetch("/api/superadmin/establishments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishmentId,
          action,
          reason: isSuspended ? "" : suspensionReason || "Défaut de paiement de l'abonnement SaaS"
        })
      });

      if (res.ok) {
        setTargetSchoolId(null);
        setSuspensionReason("");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Chargement de la console Super-Admin...</p>
      </div>
    );
  }

  const { stats, establishments, plans } = data || {};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role="SUPER_ADMIN" />

        <main className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto max-w-7xl">
          {/* En-tête */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Console de Contrôle SaaS • Propriétaire Plateforme</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#14213D] tracking-tight">
              Pilotage Global ECO & FRAIS
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 mt-1">
              Supervision des établissements scolaires, abonnements et revenus récurrents au Togo.
            </p>
          </div>

          {/* Cartes KPIs SaaS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="MRR SaaS (Revenus Récurrents)"
              value={formatXOF(stats?.platformMRR || 0)}
              subtitle="Chiffre d'affaires mensuel"
              icon={Coins}
              color="purple"
            />
            <StatsCard
              title="Établissements Inscrits"
              value={stats?.totalEstablishments || 0}
              subtitle={`${stats?.activeSchools || 0} actifs • ${stats?.suspendedSchools || 0} suspendus`}
              icon={Building2}
              color="blue"
            />
            <StatsCard
              title="Élèves sur la Plateforme"
              value={stats?.totalStudents || 0}
              subtitle="Répartis sur toutes les écoles"
              icon={Users}
              color="green"
            />
            <StatsCard
              title="Tickets Support Ouverts"
              value={stats?.openTickets || 0}
              subtitle="Demandes d'assistance"
              icon={Headphones}
              color="amber"
            />
          </div>

          {/* Tableau des Établissements */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Parc des Établissements Scolaires</h3>
                <p className="text-xs text-slate-500">Gestion de l'activation, suspension et suivi des abonnements</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Établissement</th>
                    <th className="p-4">Ville / Pays</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Élèves</th>
                    <th className="p-4">Abonnement</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {establishments?.map((est: any) => {
                    const isSuspended = est.status === "SUSPENDED";
                    return (
                      <tr key={est.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{est.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">{est.code} • Dir : {est.directorName}</p>
                        </td>
                        <td className="p-4">
                          <p>{est.city}, {est.country}</p>
                          <p className="text-[10px] text-slate-400">{est.address}</p>
                        </td>
                        <td className="p-4">
                          <p>{est.phone}</p>
                          <p className="text-[10px] text-slate-400">{est.email}</p>
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {est.studentCount} élèves
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                            {est.subscription?.planName || "Formule Pro"}
                          </span>
                        </td>
                        <td className="p-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="w-3.5 h-3.5" />
                              Suspendu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Actif
                            </span>
                          )}
                          {isSuspended && est.suspensionReason && (
                            <p className="text-[10px] text-red-600 mt-1 max-w-xs">{est.suspensionReason}</p>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isSuspended ? (
                            <button
                              onClick={() => handleToggleStatus(est.id, est.status)}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs btn-glow-green cursor-pointer active:scale-95 transition-all shadow-md"
                            >
                              Réactiver
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(est.id, est.status)}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-700 border border-red-200 font-bold text-xs cursor-pointer active:scale-95 transition-all"
                            >
                              Suspendre
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal de motif de suspension */}
          {targetSchoolId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-bold text-base text-slate-900">Confirmer la suspension</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  La suspension bloque l'accès aux opérations de l'établissement sans supprimer ses données ni son historique financier.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motif de la suspension :</label>
                  <input
                    type="text"
                    value={suspensionReason}
                    onChange={e => setSuspensionReason(e.target.value)}
                    placeholder="Ex: Facture d'abonnement SaaS impayée"
                    className="w-full text-xs p-2.5 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setTargetSchoolId(null)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleToggleStatus(targetSchoolId, "ACTIVE")}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Confirmer la suspension
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formules SaaS */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Grille Tarifaire des Abonnements SaaS (XOF)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans?.map((plan: any) => (
                <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      {plan.code}
                    </span>
                    <h4 className="font-black text-lg text-slate-900 mt-2">{plan.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{plan.description}</p>

                    <div className="my-4">
                      <span className="text-2xl font-black text-slate-900">{formatXOF(plan.priceMonthly)}</span>
                      <span className="text-xs text-slate-500 font-semibold"> / mois</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">ou {formatXOF(plan.priceYearly)} / an (-16%)</p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600">
                      {plan.features?.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                    Limite : <strong>{plan.maxStudents === -1 ? "Illimité" : `${plan.maxStudents} élèves`}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
