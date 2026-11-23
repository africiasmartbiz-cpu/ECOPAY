"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { 
  GraduationCap, 
  Coins, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Search, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Eye, 
  Layers,
  Receipt,
  UserCheck
} from "lucide-react";
import { formatXOF, formatDate } from "@/lib/formatters";
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
  Cell
} from "recharts";

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");

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

      if (user && user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "PARENT") {
        try {
          const switchRes = await apiFetch("/api/auth/switch-to-admin", { method: "POST" });
          if (switchRes.ok) {
            const switchData = await switchRes.json();
            if (switchData.user) {
              user = switchData.user;
              localStorage.setItem("schoolpay_user", JSON.stringify(user));
            }
          }
        } catch (e) {}
      }

      setCurrentUser(user);

      // 1. Classes de l'établissement
      try {
        const clsRes = await apiFetch("/api/classes");
        if (clsRes.ok) {
          const clsData = await clsRes.json();
          setClasses(clsData.classes || []);
        }
      } catch (e) {}

      // 2. Élèves de l'établissement
      try {
        const stuRes = await apiFetch("/api/students");
        if (stuRes.ok) {
          const stuData = await stuRes.json();
          setStudents(stuData.students || []);
        }
      } catch (e) {}

      // 3. Personnel / Équipe
      try {
        const staffRes = await apiFetch("/api/staff");
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaffList(staffData.staff || []);
        }
      } catch (e) {}

      // 4. Derniers paiements
      try {
        const payRes = await apiFetch("/api/payments");
        if (payRes.ok) {
          const payData = await payRes.json();
          setPayments(payData.payments || []);
        }
      } catch (e) {}
    } catch (err) {
      console.error("Erreur chargement situation globale:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">
          Chargement de la situation globale de l'établissement...
        </p>
      </div>
    );
  }

  // Calculs statistiques consolidés (Lecture seule)
  const totalStudents = students.length;
  const totalBoys = students.filter(s => s.gender === "M").length;
  const totalGirls = students.filter(s => s.gender === "F").length;
  const totalExpected = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);
  const totalCollected = students.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const totalRemaining = totalExpected - totalCollected;
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Répartition par classe
  const classBreakdown: Record<string, { 
    name: string; 
    level?: string; 
    capacity: number; 
    tuition: number; 
    count: number; 
    expected: number; 
    collected: number 
  }> = {};

  classes.forEach(c => {
    classBreakdown[c.name] = {
      name: c.name,
      level: c.level,
      capacity: c.capacity || 45,
      tuition: c.monthlyTuition || 100000,
      count: 0,
      expected: 0,
      collected: 0
    };
  });

  students.forEach(s => {
    const clsName = s.className || "Autre";
    if (!classBreakdown[clsName]) {
      classBreakdown[clsName] = {
        name: clsName,
        capacity: 45,
        tuition: s.totalDue || 100000,
        count: 0,
        expected: 0,
        collected: 0
      };
    }
    classBreakdown[clsName].count += 1;
    classBreakdown[clsName].expected += s.totalDue || 0;
    classBreakdown[clsName].collected += s.totalPaid || 0;
  });

  // Données graphiques
  const barChartData = Object.values(classBreakdown).map(c => ({
    name: c.name,
    "Attendu": c.expected,
    "Encaissé": c.collected,
    Taux: c.expected > 0 ? Math.round((c.collected / c.expected) * 100) : 0
  }));

  const paidCount = students.filter(s => s.status === "PAID").length;
  const partialCount = students.filter(s => s.status === "PARTIAL").length;
  const unpaidCount = students.filter(s => s.status === "OVERDUE" || s.status === "UNPAID").length;

  const pieData = [
    { name: "Totalement Soldé", value: paidCount, color: "#16A34A" },
    { name: "Partiellement Réglé", value: partialCount, color: "#F59E0B" },
    { name: "En Retard / Dettes", value: unpaidCount, color: "#DC2626" }
  ];

  // Profils actifs
  const activeDirectors = staffList.filter(s => s.role === "DIRECTOR" && s.isActive !== false);
  const activeAccountants = staffList.filter(s => s.role === "ACCOUNTANT" && s.isActive !== false);
  const activeAdmins = staffList.filter(s => s.role === "ESTABLISHMENT_ADMIN" && s.isActive !== false);

  // Calcul du Montant Total en Caisse Aujourd'hui (Demandé par l'utilisateur)
  const todayStr = new Date().toISOString().split("T")[0];
  const todayPayments = payments.filter(p => p.paymentDate && p.paymentDate.startsWith(todayStr));
  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayCash = todayPayments.filter(p => p.paymentMethod === "ESPECES").reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayTMoney = todayPayments.filter(p => p.paymentMethod === "TMONEY").reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayFlooz = todayPayments.filter(p => p.paymentMethod === "FLOOZ").reduce((sum, p) => sum + (p.amount || 0), 0);

  // Filtrage des élèves pour le tableau récapitulatif
  const filteredStudents = students.filter(s => {
    const fullName = `${s.lastName} ${s.firstName}`.toLowerCase();
    const matricule = (s.matricule || "").toLowerCase();
    const parent = (s.parentName || "").toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          matricule.includes(searchTerm.toLowerCase()) ||
                          parent.includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === "ALL" || s.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role={currentUser.role} />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* ========================================================================= */}
          {/* EN-TÊTE : SITUATION GLOBALE DE L'ÉTABLISSEMENT                            */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold mb-2">
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Présentation Globale de l'Établissement • Mode Consultation</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-[#14213D] tracking-tight">
                Tableau de Bord — Présentation de l'Établissement
              </h1>
              <p className="text-xs lg:text-sm text-slate-500">
                Établissement : <strong className="text-slate-800">{currentUser.establishmentName}</strong> • Année Scolaire 2024-2025
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <ExportExcelButton type="students" label="Exporter Rapport Global (.xlsx)" />
              <Link
                href="/admin/staff"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg btn-glow-purple transition-all"
              >
                <Users className="w-4 h-4" />
                <span>Équipe & Profils (Bascule de session) →</span>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BANNIÈRE EXPLICATIVE : RÈGLE D'OR CONSULTATION VS MODIFICATION            */}
          {/* ========================================================================= */}
          <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-purple-50/80 border border-indigo-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-100 text-[#5D3CF2] rounded-2xl mt-0.5">
                <Eye className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed text-indigo-950">
                <p className="font-black text-sm">
                  Ce Tableau de Bord présente la situation d'ensemble sans modification directe.
                </p>
                <p className="text-indigo-700 mt-0.5">
                  Pour <strong>inscrire des élèves</strong>, <strong>fixer les prix d'écolage</strong> ou <strong>enregistrer des paiements de caisse</strong>, rendez-vous dans le menu <strong>« Équipe & Profils »</strong> et connectez-vous sous le profil dédié (Directeur, Comptable ou Administrateur).
                </p>
              </div>
            </div>

            <Link
              href="/admin/staff"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-[#5D3CF2] font-black text-xs rounded-xl border border-indigo-200 shadow-xs whitespace-nowrap transition-all"
            >
              <span>Voir les 3 Profils</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* 1. LES 4 GRANDS KPIS GLOBAUX                                              */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Effectif Total Inscrits"
              value={`${totalStudents} Élèves`}
              subtitle={`${totalBoys} Garçons • ${totalGirls} Filles`}
              icon={GraduationCap}
              color="blue"
            />
            <StatsCard
              title="Recettes Réalisées"
              value={formatXOF(totalCollected)}
              subtitle={`Sur ${formatXOF(totalExpected)} facturés`}
              icon={Coins}
              color="green"
            />
            <StatsCard
              title="Taux de Recouvrement"
              value={`${collectionRate} %`}
              subtitle="Performance financière globale"
              icon={TrendingUp}
              color="amber"
              badgeText={`Objectif annuel : 95%`}
            />
            <StatsCard
              title="Créances & Reste à Recouvrer"
              value={formatXOF(totalRemaining)}
              subtitle={`${unpaidCount} dossier(s) avec solde à solder`}
              icon={Clock}
              color="red"
            />
          </div>

          {/* ========================================================================= */}
          {/* MONTANT TOTAL EN CAISSE AUJOURD'HUI (Demandé par l'utilisateur)           */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-xl shadow-emerald-700/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-emerald-100 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>Point de Caisse Quotidien • {formatDate(new Date())}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span>Montant Total en Caisse Aujourd'hui</span>
              </h2>
              <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed">
                Total des encaissements enregistrés aujourd'hui par la Caisse de l'établissement (Espèces au guichet, T-Money et Flooz).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Encaissé ce Jour</p>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">{formatXOF(todayTotal)}</p>
                <p className="text-[10px] text-emerald-200 mt-0.5">{todayPayments.length} règlement(s) enregistré(s) ce jour</p>
              </div>

              <div className="sm:border-l sm:border-white/20 sm:pl-4 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-emerald-100 font-medium">💵 Espèces :</span>
                  <span className="font-mono font-black text-white">{formatXOF(todayCash)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-emerald-100 font-medium">📱 T-Money :</span>
                  <span className="font-mono font-black text-white">{formatXOF(todayTMoney)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-emerald-100 font-medium">📱 Flooz :</span>
                  <span className="font-mono font-black text-white">{formatXOF(todayFlooz)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. RÉPARTITION DES RÔLES & TÂCHES AUX PROFILS RESPECTIFS                  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#5D3CF2]" />
                  <span>Répartition des Tâches par Profil de l'Établissement</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Chaque tâche opérationnelle est déléguée à son profil respectif accessible depuis « Équipe & Profils ».
                </p>
              </div>

              <Link
                href="/admin/staff"
                className="text-xs font-bold text-[#5D3CF2] hover:underline flex items-center gap-1"
              >
                <span>Gérer les comptes dans Équipe & Profils</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* CARTE DIR */}
              <Link
                href="/admin/staff"
                className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      DIR
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                      {activeDirectors.length} Actif(s)
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-xs group-hover:text-purple-700 transition-colors">
                    Profil Directeur (Espace /director)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    <strong>Tâches exclusives :</strong> Inscription des élèves (individuelle & Grand Tableur Excel), fixation des prix d'écolage par tranches, découpage des classes et effectifs.
                  </p>
                </div>
                <div className="pt-3 border-t border-purple-200/60 mt-3 flex items-center justify-between text-[11px] font-bold text-purple-700">
                  <span>Accéder via Équipe & Profils</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* CARTE CPT */}
              <Link
                href="/admin/staff"
                className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      CPT
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {activeAccountants.length} Actif(s)
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">
                    Profil Comptable / Caisse (Espace /accounting)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    <strong>Tâches exclusives :</strong> Encaissement des frais scolaires (Espèces, TMoney, Flooz), génération des reçus officiels PDF certifiés, relances WhatsApp d'impayés.
                  </p>
                </div>
                <div className="pt-3 border-t border-emerald-200/60 mt-3 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                  <span>Accéder via Équipe & Profils</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* CARTE ADM */}
              <Link
                href="/admin/staff"
                className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      ADM
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {activeAdmins.length} Actif(s)
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-xs group-hover:text-blue-700 transition-colors">
                    Profil Administrateur (Espace /admin/staff)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    <strong>Tâches exclusives :</strong> Création et gestion des identifiants du personnel, supervision de la sécurité, configuration des droits et des profils.
                  </p>
                </div>
                <div className="pt-3 border-t border-blue-200/60 mt-3 flex items-center justify-between text-[11px] font-bold text-blue-700">
                  <span>Accéder via Équipe & Profils</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. GRAPHIQUES FINANCIERS ET STATUTS                                       */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* BarChart par classe */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#5D3CF2]" />
                  <span>Comparatif Frais Attendus vs Encaissés par Classe (XOF)</span>
                </h3>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${v / 1000}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => formatXOF(Number(value))} />
                    <Bar dataKey="Attendu" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Encaissé" fill="#5D3CF2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PieChart statuts de paiement */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Santé Financière des Règlements</h3>
                <p className="text-[11px] text-slate-500">Statut des règlements des {totalStudents} élèves</p>
              </div>

              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
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

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
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

          {/* ========================================================================= */}
          {/* 4. SITUATION GLOBALE DES CLASSES & EFFECTIFS (LECTURE SEULE)              */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Situation Globale des Classes & Taux de Remplissage (Lecture Seule)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Synthèse des effectifs et du recouvrement financier pour chaque division
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                {Object.keys(classBreakdown).length} Classe(s) configurée(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Classe</th>
                    <th className="p-3.5">Niveau</th>
                    <th className="p-3.5">Effectif / Capacité</th>
                    <th className="p-3.5">Remplissage</th>
                    <th className="p-3.5 font-mono">Total Attendu</th>
                    <th className="p-3.5 font-mono">Total Encaissé</th>
                    <th className="p-3.5 font-mono">Créances Restantes</th>
                    <th className="p-3.5 text-right">Taux Recouvrement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {Object.values(classBreakdown).map((cls, idx) => {
                    const fillRate = cls.capacity > 0 ? Math.round((cls.count / cls.capacity) * 100) : 0;
                    const recRate = cls.expected > 0 ? Math.round((cls.collected / cls.expected) * 100) : 0;
                    const debt = cls.expected - cls.collected;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-black text-slate-900">{cls.name}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {cls.level || "COLLEGE"}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold">
                          <span className="text-[#5D3CF2]">{cls.count}</span>
                          <span className="text-slate-400"> / {cls.capacity} élèves</span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${fillRate >= 90 ? "bg-red-500" : fillRate >= 60 ? "bg-emerald-500" : "bg-blue-500"}`} 
                                style={{ width: `${Math.min(fillRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-600">{fillRate}%</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{formatXOF(cls.expected)}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">{formatXOF(cls.collected)}</td>
                        <td className="p-3.5 font-mono font-bold text-red-600">{formatXOF(debt)}</td>
                        <td className="p-3.5 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                            recRate >= 80 ? "bg-emerald-100 text-emerald-800" : recRate >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {recRate} %
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. SITUATION DÉTAILLÉE DES ÉLÈVES (LECTURE SEULE)                         */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#5D3CF2]" />
                  <span>Répertoire & Situation Individuelle des Élèves (Lecture Seule)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Consultez la fiche financière de chaque élève. Toute modification s'effectue via le profil Directeur.
                </p>
              </div>

              {/* Filtres de consultation */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Rechercher nom, matricule..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#5D3CF2] w-48"
                  />
                </div>

                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Toutes les classes ({students.length})</option>
                  {Array.from(new Set(students.map(s => s.className))).map((clsName, i) => (
                    <option key={i} value={clsName}>{clsName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Matricule</th>
                    <th className="p-3">Nom & Prénoms</th>
                    <th className="p-3">Classe</th>
                    <th className="p-3">Parent / Tuteur</th>
                    <th className="p-3 font-mono">Frais Dus</th>
                    <th className="p-3 font-mono">Déjà Versé</th>
                    <th className="p-3 font-mono">Solde Restant</th>
                    <th className="p-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 font-semibold">
                        Aucun élève trouvé avec les critères saisis.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#5D3CF2]">{student.matricule}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {student.lastName} {student.firstName}
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{student.className}</td>
                        <td className="p-3 text-slate-600">
                          {student.parentName}
                          {student.parentPhone && (
                            <span className="block text-[10px] text-slate-400 font-mono">{student.parentPhone}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">{formatXOF(student.totalDue)}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{formatXOF(student.totalPaid)}</td>
                        <td className="p-3 font-mono font-bold text-red-600">{formatXOF(student.balanceRemaining)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            student.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : student.status === "PARTIAL"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {student.status === "PAID" ? "Soldé" : student.status === "PARTIAL" ? "Partiel" : "En retard"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. DERNIERS ENCAISSEMENTS GUICHET & MOBILE MONEY (LECTURE SEULE)          */}
          {/* ========================================================================= */}
          {payments && payments.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Derniers Règlements Encaissés par la Caisse (Lecture Seule)</span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Opérations validées en caisse
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Reçu N°</th>
                      <th className="p-2.5">Élève & Classe</th>
                      <th className="p-2.5">Mode Paiement</th>
                      <th className="p-2.5 font-mono">Montant Encaissé</th>
                      <th className="p-2.5">Encaissé par</th>
                      <th className="p-2.5">Date & Heure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.slice(0, 5).map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50/70">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{pay.receiptNumber}</td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          {pay.studentName} ({pay.className})
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[10px] text-slate-800">
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">
                          {formatXOF(pay.amount)}
                        </td>
                        <td className="p-2.5 text-slate-600">{pay.receivedByName || "Caisse"}</td>
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">{formatDate(pay.paymentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
