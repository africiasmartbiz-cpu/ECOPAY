"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { FeePricingSection } from "@/components/FeePricingSection";
import { ClassSelectorEffectifSection } from "@/components/ClassSelectorEffectifSection";
import { ExcelStudentImportSection } from "@/components/ExcelStudentImportSection";
import { 
  GraduationCap, 
  Coins, 
  Layers, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Plus, 
  Sparkles,
  Users,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { formatXOF } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function DirectorPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Modale Inscription Élève
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelSection, setShowExcelSection] = useState(true);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    gender: "M",
    birthDate: "2013-05-10",
    birthPlace: "Lomé",
    classId: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    address: ""
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

      // Classes
      try {
        const clsRes = await apiFetch("/api/classes");
        if (clsRes.ok) {
          const clsData = await clsRes.json();
          setClasses(clsData.classes || []);
        }
      } catch (e) {}

      // Élèves
      const stuRes = await apiFetch("/api/students");
      const stuData = await stuRes.json();
      setStudents(stuData.students || []);

      // Alertes transmises par l'administrateur
      try {
        const alertRes = await apiFetch("/api/alerts?role=DIRECTOR");
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
  }, [router]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      const res = await apiFetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAddError(data.error || "Erreur lors de l'inscription.");
        return;
      }

      setShowAddModal(false);
      setNewStudent({
        firstName: "",
        lastName: "",
        gender: "M",
        birthDate: "2013-05-10",
        birthPlace: "Lomé",
        classId: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
        address: ""
      });
      await loadData();
    } catch (err: any) {
      setAddError("Erreur technique lors de l'inscription.");
    } finally {
      setAddLoading(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Chargement de la console Directeur...</p>
      </div>
    );
  }

  // Calculs financiers réels
  const totalExpected = students.reduce((sum, s) => sum + s.totalDue, 0);
  const totalCollected = students.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalRemaining = totalExpected - totalCollected;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Données par classe
  const classMap: Record<string, { name: string; count: number; expected: number; collected: number }> = {};
  students.forEach(s => {
    if (!classMap[s.className]) {
      classMap[s.className] = { name: s.className, count: 0, expected: 0, collected: 0 };
    }
    classMap[s.className].count += 1;
    classMap[s.className].expected += s.totalDue;
    classMap[s.className].collected += s.totalPaid;
  });

  const barChartData = Object.values(classMap).map(c => ({
    name: c.name,
    "Frais Attendus": c.expected,
    "Encaissé": c.collected,
    Taux: c.expected > 0 ? Math.round((c.collected / c.expected) * 100) : 0
  }));

  // Données camembert statuts
  const paidCount = students.filter(s => s.status === "PAID").length;
  const partialCount = students.filter(s => s.status === "PARTIAL").length;
  const unpaidCount = students.filter(s => s.status === "OVERDUE" || s.status === "UNPAID").length;

  const pieData = [
    { name: "Totalement Soldé", value: paidCount, color: "#16A34A" },
    { name: "Partiellement Réglé", value: partialCount, color: "#F59E0B" },
    { name: "Non Payé / Retard", value: unpaidCount, color: "#DC2626" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role="DIRECTOR" />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-[#14213D] tracking-tight">
                Tableau de Bord Exécutif — Supervision
              </h1>
              <p className="text-xs lg:text-sm text-slate-500">
                Direction : <strong className="text-slate-800">{currentUser.fullName}</strong> • Établissement : <strong className="text-slate-800">{currentUser.establishmentName}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/auth/switch-to-admin"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-[#5D3CF2]" />
                <span>← Retour Tableau de Bord</span>
              </a>
              <button
                onClick={() => setShowExcelSection(!showExcelSection)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer ${
                  showExcelSection 
                    ? "bg-emerald-600 text-white shadow-emerald-200" 
                    : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <FileSpreadsheet className={`w-4 h-4 ${showExcelSection ? "text-white" : "text-emerald-600"}`} />
                <span>📊 Tableur & Import Excel</span>
              </button>
              <Link
                href="/admin/staff"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl shadow-sm transition-all"
              >
                <Users className="w-4 h-4 text-[#5D3CF2]" />
                <span>Profils & Équipe</span>
              </Link>
              <ExportExcelButton type="students" label="Rapport Élèves (.xlsx)" />
              <ExportExcelButton type="debts" label="Rapport Impayés (.xlsx)" />
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4E2DE3] active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg btn-glow-purple cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Inscrire un Élève</span>
              </button>
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
                      L'administrateur de l'établissement a signalé une anomalie nécessitant l'intervention de la Direction (Effectifs, Inscriptions, Tarifs).
                    </p>
                  </div>
                </div>

                <Link
                  href="/director/messages"
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
                          {alert.category === "STUDENT_COUNT" ? "👥 Effectif / Classe" : alert.category === "PAYMENT_DELAY" ? "🚨 Retard Scolarité" : "⚠️ Anomalie"}
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

          {/* Cartes KPIs Directeur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Taux de Recouvrement"
              value={`${collectionRate} %`}
              subtitle="Performance financière globale"
              icon={TrendingUp}
              color="blue"
              badgeText={`Objectif de fin de trimestre : 85%`}
            />
            <StatsCard
              title="Recettes Réalisées"
              value={formatXOF(totalCollected)}
              subtitle={`Sur ${formatXOF(totalExpected)} facturés`}
              icon={Coins}
              color="green"
            />
            <StatsCard
              title="Reste à Recouvrer"
              value={formatXOF(totalRemaining)}
              subtitle="Créances et retards parents"
              icon={Clock}
              color="red"
            />
            <StatsCard
              title="Effectif d'Élèves"
              value={`${students.length} Inscrits`}
              subtitle={`${paidCount} à jour • ${unpaidCount} en retard`}
              icon={GraduationCap}
              color="purple"
            />
          </div>

          {/* Section Fixation des Prix d'Écolage (Tranches, Mensuel, Annuel) */}
          <FeePricingSection />

          {/* Section Sélection des Classes & Fixation des Effectifs (6A, 6B, 6C...) */}
          <ClassSelectorEffectifSection />

          {/* Grande Page Excel d'Importation Massive des Élèves */}
          {showExcelSection && (
            <ExcelStudentImportSection onImportSuccess={loadData} />
          )}

          {/* Graphiques Financiers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graphique à barres par classe */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Comparatif Frais Attendus vs Encaissés par Classe (XOF)</span>
                </h3>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${v / 1000}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => formatXOF(Number(value))} />
                    <Bar dataKey="Frais Attendus" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Encaissé" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Répartition circulaire du recouvrement */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Répartition des Situations Élèves</h3>
                <p className="text-[11px] text-slate-500">Statut des règlements de scolarité</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t text-xs">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <span className="text-slate-600">{d.name}</span>
                    </span>
                    <span className="font-bold text-slate-800">{d.value} élève(s)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tableau de suivi par classe pour le Directeur */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Performance de Recouvrement par Classe</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-3.5">Classe</th>
                    <th className="p-3.5">Effectif</th>
                    <th className="p-3.5">Total Attendu</th>
                    <th className="p-3.5">Total Encaissé</th>
                    <th className="p-3.5">Créances Restantes</th>
                    <th className="p-3.5 text-right">Taux de Recouvrement</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  {Object.values(classMap).map((cls, idx) => {
                    const rate = cls.expected > 0 ? Math.round((cls.collected / cls.expected) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-3.5 font-bold text-slate-900">{cls.name}</td>
                        <td className="p-3.5">{cls.count} élèves</td>
                        <td className="p-3.5 font-bold">{formatXOF(cls.expected)}</td>
                        <td className="p-3.5 font-bold text-emerald-600">{formatXOF(cls.collected)}</td>
                        <td className="p-3.5 font-bold text-red-600">{formatXOF(cls.expected - cls.collected)}</td>
                        <td className="p-3.5 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                            rate >= 80 ? "bg-emerald-100 text-emerald-800" : rate >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {rate} %
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Inscription d'Élève par la Direction */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border">
                <h3 className="font-bold text-base text-slate-900 mb-4">Inscrire un nouvel élève</h3>
                {addError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg mb-3">{addError}</p>
                )}
                <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700">Nom :</label>
                      <input
                        type="text"
                        required
                        value={newStudent.lastName}
                        onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })}
                        placeholder="Ex: TCHALLA"
                        className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700">Prénoms :</label>
                      <input
                        type="text"
                        required
                        value={newStudent.firstName}
                        onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })}
                        placeholder="Ex: Koffi Marc"
                        className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700">Classe :</label>
                      <select
                        required
                        value={newStudent.classId}
                        onChange={e => setNewStudent({ ...newStudent, classId: e.target.value })}
                        className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="">Sélectionner la classe</option>
                        {classes && classes.length > 0 ? (
                          classes.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({formatXOF(c.monthlyTuition || 0)})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="class-cp1">CP1 A (85 000 FCFA)</option>
                            <option value="class-ce2">CE2 B (90 000 FCFA)</option>
                            <option value="class-cm2">CM2 A (95 000 FCFA)</option>
                            <option value="class-6eme">6ème A (100 000 FCFA)</option>
                            <option value="class-3eme">3ème B (115 000 FCFA)</option>
                            <option value="class-tlec">Terminale C (125 000 FCFA)</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700">Genre :</label>
                      <select
                        value={newStudent.gender}
                        onChange={e => setNewStudent({ ...newStudent, gender: e.target.value as "M" | "F" })}
                        className="w-full p-2 border rounded-lg outline-none"
                      >
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Nom du Parent / Tuteur :</label>
                    <input
                      type="text"
                      required
                      value={newStudent.parentName}
                      onChange={e => setNewStudent({ ...newStudent, parentName: e.target.value })}
                      placeholder="Ex: M. TCHALLA Paul"
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700">Téléphone WhatsApp Parent (Togo) :</label>
                    <input
                      type="text"
                      required
                      value={newStudent.parentPhone}
                      onChange={e => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                      placeholder="Ex: +228 90 12 34 56"
                      className="w-full p-2 border rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm btn-glow-blue cursor-pointer"
                    >
                      {addLoading ? "Enregistrement..." : "Inscrire l'élève"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
