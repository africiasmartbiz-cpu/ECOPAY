"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ShieldAlert, Clock, User, Building2 } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function SuperAdminAuditPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const mockLogs = [
    {
      id: "log-1",
      action: "PAYMENT_CREATED",
      user: "Afiwa DOVI (Comptable)",
      school: "Complexe Scolaire La Renaissance",
      details: "Encaissement de 40 000 FCFA via TMoney pour l'élève MENSAH Elom David. Reçu : REC-2024-REN-0002",
      date: "2024-12-05T14:30:00Z"
    },
    {
      id: "log-2",
      action: "PAYMENT_CREATED",
      user: "Afiwa DOVI (Comptable)",
      school: "Complexe Scolaire La Renaissance",
      details: "Encaissement de 30 000 FCFA en espèces pour l'élève MENSAH Elom David. Reçu : REC-2024-REN-0001",
      date: "2024-10-10T09:15:00Z"
    },
    {
      id: "log-3",
      action: "ESTABLISHMENT_ACTIVATED",
      user: "Kodjo TCHALLA (Super-Admin)",
      school: "Plateforme SaaS",
      details: "Souscription et activation de l'établissement Collège & Lycée Saint-Joseph (Formule Essentiel)",
      date: "2024-10-01T08:00:00Z"
    }
  ];

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
        <p className="text-xs font-semibold text-slate-500">Chargement des journaux de sécurité...</p>
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
              Journaux d'Audit & Sécurité de la Plateforme
            </h1>
            <p className="text-xs text-slate-500">
              Traçabilité chronologique des actions sensibles, encaissements et modifications administratives
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3.5">Horodatage</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Opérateur</th>
                  <th className="p-3.5">Établissement</th>
                  <th className="p-3.5">Détails de l'opération</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {mockLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.date)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{log.user}</td>
                    <td className="p-3.5 text-slate-600">{log.school}</td>
                    <td className="p-3.5 text-slate-700 max-w-md">{log.details}</td>
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
