"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { CreditCard, CheckCircle2, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { formatXOF } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function SuperAdminPlansPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);

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

        if (user.role !== "SUPER_ADMIN") {
          window.location.href = "/";
          return;
        }

        setCurrentUser(user);

        const res = await apiFetch("/api/superadmin/establishments");
        const json = await res.json();
        setPlans(json.plans || []);
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
        <p className="text-xs font-semibold text-slate-500">Chargement des formules SaaS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role="SUPER_ADMIN" />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          <div>
            <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
              Formules d'Abonnement SaaS ECO & FRAIS
            </h1>
            <p className="text-xs text-slate-500">
              Configuration des forfaits, tarification en Francs CFA (XOF) et quotas de souscription
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    {plan.code}
                  </span>
                  <h3 className="font-black text-xl text-slate-900 mt-2">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.description}</p>

                  <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-3xl font-black text-slate-900">{formatXOF(plan.priceMonthly)}</p>
                    <p className="text-xs text-slate-500 font-medium">Facturation mensuelle</p>
                    <p className="text-[11px] text-purple-700 font-bold mt-1">
                      Annuel : {formatXOF(plan.priceYearly)} / an
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700">
                    {plan.features?.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Quota : <strong>{plan.maxStudents === -1 ? "Illimité" : `${plan.maxStudents} élèves`}</strong></span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Actif</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
