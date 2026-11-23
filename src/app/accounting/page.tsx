"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { PaymentModal } from "@/components/PaymentModal";
import { WhatsAppModal } from "@/components/WhatsAppModal";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { 
  Wallet, 
  Receipt, 
  Coins, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Smartphone, 
  MessageSquare, 
  ArrowRight, 
  Eye, 
  FileText, 
  Printer, 
  ArrowLeft, 
  Building2,
  AlertTriangle
} from "lucide-react";
import { formatXOF, formatDate } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function AccountingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [alerts, setAlerts] = useState<any[]>([]);

  // Modales
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<any | null>(null);
  const [selectedStudentForWA, setSelectedStudentForWA] = useState<any | null>(null);

  const loadData = async () => {
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

      const stuRes = await apiFetch("/api/students");
      const stuData = await stuRes.json();
      setStudents(stuData.students || []);

      // Alertes transmises par l'administrateur
      try {
        const alertRes = await apiFetch("/api/alerts?role=ACCOUNTANT");
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setAlerts(alertData.alerts || []);
        }
      } catch (e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await apiFetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "RESOLVE" })
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "RESOLVED" } : a));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Chargement de la caisse...</p>
      </div>
    );
  }

  // Filtrage
  const filteredStudents = students.filter(s => {
    const matchSearch =
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      filterStatus === "ALL" ? true :
      filterStatus === "DEBT" ? s.balanceRemaining > 0 :
      filterStatus === "PAID" ? s.status === "PAID" : true;

    return matchSearch && matchStatus;
  });

  const totalCollectedToday = students.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalDebts = students.reduce((sum, s) => sum + s.balanceRemaining, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role="ACCOUNTANT" />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* En-tête Guichet */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
                <Wallet className="w-3.5 h-3.5" />
                <span>Guichet Caisse & Recouvrement Mobile Money</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-[#14213D] tracking-tight">
                Gestion des Encaissements & Reçus
              </h1>
              <p className="text-xs lg:text-sm text-slate-500">
                Opérateur caisse : <strong className="text-slate-800">{currentUser.fullName}</strong> • Établissement : <strong className="text-slate-800">{currentUser.establishmentName}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/api/auth/switch-to-admin"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#5D3CF2]" />
                <span>← Retour Tableau de Bord & Équipe</span>
              </a>
              <ExportExcelButton type="payments" label="Export Encaissements (.xlsx)" />
              <ExportExcelButton type="debts" label="Export Impayés (.xlsx)" />
            </div>
          </div>

          {/* SIGNALEMENTS & ALERTES REÇUES DE L'ADMINISTRATEUR */}
          {alerts.filter(a => a.status === "OPEN").length > 0 && (
            <div className="p-4 bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border-2 border-rose-300 rounded-3xl space-y-3 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-rose-600 text-white rounded-xl shadow-sm">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-black text-rose-950 text-sm flex items-center gap-2">
                      <span>Signalement(s) Prioritaire(s) de l'Administrateur</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                        {alerts.filter(a => a.status === "OPEN").length} à traiter
                      </span>
                    </h3>
                    <p className="text-[11px] text-rose-800">
                      L'administrateur de l'établissement a signalé une anomalie nécessitant l'intervention de la Caisse / Comptabilité (Retard de paiement, Dettes, Écart).
                    </p>
                  </div>
                </div>

                <Link
                  href="/accounting/messages"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-300 shadow-xs transition-all whitespace-nowrap"
                >
                  <span>Ouvrir Boîte de Messagerie ({alerts.filter(a => a.status === "OPEN").length}) →</span>
                </Link>
              </div>

              <div className="space-y-2">
                {alerts.filter(a => a.status === "OPEN").map(alert => (
                  <div key={alert.id} className="p-3.5 bg-white rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                          {alert.category === "PAYMENT_DELAY" ? "🚨 Retard de Paiement" : alert.category === "CASH_DISCREPANCY" ? "💵 Écart de Caisse" : "⚠️ Anomalie"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          alert.priority === "URGENT" ? "bg-red-600 text-white" :
                          alert.priority === "HIGH" ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                        }`}>
                          {alert.priority}
                        </span>
                        <span className="font-black text-slate-900 text-xs">{alert.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl mt-1">{alert.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Transmis par : <strong>{alert.creatorName}</strong></p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResolveAlert(alert.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap self-end sm:self-center active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Marquer comme Traité</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs de Caisse */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title="Total Encaissé (Toutes classes)"
              value={formatXOF(totalCollectedToday)}
              subtitle="Versements cumulés enregistrés"
              icon={Coins}
              color="green"
            />
            <StatsCard
              title="Créances / Dettes Globales"
              value={formatXOF(totalDebts)}
              subtitle="Montants à recouvrer auprès des parents"
              icon={Clock}
              color="red"
            />
            <StatsCard
              title="Moyens de Paiement Acceptés"
              value="Espèces • TMoney • Flooz"
              subtitle="Validation instantanée avec reçu"
              icon={Smartphone}
              color="blue"
            />
          </div>

          {/* Recherche & Filtres rapides */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Recherche instantanée : Nom de l'élève, matricule ou parent..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Tous ({students.length})
              </button>
              <button
                onClick={() => setFilterStatus("DEBT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === "DEBT" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Impayés uniquement ({students.filter(s => s.balanceRemaining > 0).length})
              </button>
              <button
                onClick={() => setFilterStatus("PAID")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === "PAID" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Soldés ({students.filter(s => s.status === "PAID").length})
              </button>
            </div>
          </div>

          {/* Table de caisse avec bouton d'encaissement et WhatsApp */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Fiche de Caisse — Opérations Financières</h3>
              <span className="text-[11px] text-slate-500">Cliquez sur « Encaisser » pour saisir un versement partiel ou complet</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Matricule & Élève</th>
                    <th className="p-3.5">Classe</th>
                    <th className="p-3.5">Parent d'Élève</th>
                    <th className="p-3.5">Total Scolarité</th>
                    <th className="p-3.5">Déjà Payé</th>
                    <th className="p-3.5">Solde Restant</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-center">Actions Caisse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredStudents.map(student => {
                    const hasBalance = student.balanceRemaining > 0;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{student.lastName} {student.firstName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{student.matricule}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[11px]">
                            {student.className}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-900">{student.parentName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{student.parentPhone}</p>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {formatXOF(student.totalDue)}
                        </td>
                        <td className="p-3.5 text-emerald-600 font-bold">
                          {formatXOF(student.totalPaid)}
                        </td>
                        <td className="p-3.5 font-black text-red-600">
                          {formatXOF(student.balanceRemaining)}
                        </td>
                        <td className="p-3.5">
                          {student.balanceRemaining === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Soldé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3" /> Reste {formatXOF(student.balanceRemaining)}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-2">
                            {/* Bouton Encaisser Luminescent */}
                            {hasBalance ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedStudentForPay({
                                    id: student.id,
                                    studentName: `${student.lastName} ${student.firstName}`,
                                    matricule: student.matricule,
                                    className: student.className,
                                    parentName: student.parentName,
                                    parentPhone: student.parentPhone,
                                    balanceRemaining: student.balanceRemaining,
                                    totalDue: student.totalDue
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#5D3CF2] hover:bg-[#4E2DE3] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md btn-glow-purple cursor-pointer transition-all"
                              >
                                <Wallet className="w-3.5 h-3.5" />
                                <span>Encaisser</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                Réglé ✓
                              </span>
                            )}

                            {/* BOUTON VERT WHATSAPP LUMINESCENT (MODULE 9) */}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedStudentForWA({
                                  id: student.id,
                                  studentName: `${student.lastName} ${student.firstName}`,
                                  className: student.className,
                                  parentName: student.parentName,
                                  parentPhone: student.parentPhone,
                                  totalDue: student.totalDue,
                                  totalPaid: student.totalPaid,
                                  balanceRemaining: student.balanceRemaining,
                                  schoolName: currentUser.establishmentName
                                })
                              }
                              title="Envoyer un rappel WhatsApp au parent"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md btn-glow-green cursor-pointer transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">WhatsApp</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modale d'encaissement guichet */}
          <PaymentModal
            isOpen={!!selectedStudentForPay}
            onClose={() => setSelectedStudentForPay(null)}
            onSuccess={loadData}
            student={selectedStudentForPay}
          />

          {/* Modale WhatsApp */}
          <WhatsAppModal
            isOpen={!!selectedStudentForWA}
            onClose={() => setSelectedStudentForWA(null)}
            student={selectedStudentForWA}
          />
        </main>
      </div>
    </div>
  );
}
