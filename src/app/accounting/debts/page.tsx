"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { WhatsAppModal } from "@/components/WhatsAppModal";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { Clock, AlertCircle, MessageSquare, Phone, Search, ArrowLeft, Building2 } from "lucide-react";
import { formatXOF } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function AccountingDebtsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [whatsAppStudent, setWhatsAppStudent] = useState<any | null>(null);

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

        const res = await apiFetch("/api/students");
        const json = await res.json();
        const allStudents = json.students || [];
        // Filtrer uniquement ceux qui ont une dette > 0
        setStudents(allStudents.filter((s: any) => s.balanceRemaining > 0));
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
        <p className="text-sm font-semibold text-slate-500">Chargement du suivi des impayés...</p>
      </div>
    );
  }

  const filtered = students.filter(s =>
    s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnpaid = students.reduce((sum, s) => sum + s.balanceRemaining, 0);

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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200 mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Gestion du Recouvrement & Échéanciers Dépassés</span>
              </div>
              <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
                Suivi des Impayés & Relances WhatsApp
              </h1>
              <p className="text-xs text-slate-500">
                Total des créances à recouvrer : <strong className="text-red-600">{formatXOF(totalUnpaid)}</strong>
              </p>
            </div>
            <ExportExcelButton type="debts" label="Exporter la Liste des Dettes (.xlsx)" />
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un parent ou un élève en retard..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs outline-none"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3.5">Élève & Matricule</th>
                  <th className="p-3.5">Classe</th>
                  <th className="p-3.5">Parent & Téléphone</th>
                  <th className="p-3.5">Total Scolarité</th>
                  <th className="p-3.5">Déjà Versé</th>
                  <th className="p-3.5">Dette Restante</th>
                  <th className="p-3.5 text-center">Relancer via WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{s.lastName} {s.firstName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{s.matricule}</p>
                    </td>
                    <td className="p-3.5 font-bold">{s.className}</td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">{s.parentName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{s.parentPhone}</p>
                    </td>
                    <td className="p-3.5 font-bold">{formatXOF(s.totalDue)}</td>
                    <td className="p-3.5 text-emerald-600 font-bold">{formatXOF(s.totalPaid)}</td>
                    <td className="p-3.5 font-black text-red-600">{formatXOF(s.balanceRemaining)}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() =>
                          setWhatsAppStudent({
                            id: s.id,
                            studentName: `${s.lastName} ${s.firstName}`,
                            className: s.className,
                            parentName: s.parentName,
                            parentPhone: s.parentPhone,
                            totalDue: s.totalDue,
                            totalPaid: s.totalPaid,
                            balanceRemaining: s.balanceRemaining,
                            schoolName: currentUser.establishmentName
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow-md btn-glow-green cursor-pointer active:scale-95 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Relancer</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <WhatsAppModal
            isOpen={!!whatsAppStudent}
            onClose={() => setWhatsAppStudent(null)}
            student={whatsAppStudent}
          />
        </main>
      </div>
    </div>
  );
}
