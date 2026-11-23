"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { 
  ShieldCheck, 
  UserPlus, 
  AlertTriangle, 
  Users, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Lock, 
  LayoutDashboard, 
  Building2, 
  ArrowRight, 
  Trash2, 
  Clock, 
  KeyRound, 
  Eye, 
  EyeOff,
  Bell,
  Sparkles,
  FileText
} from "lucide-react";
import { SessionUser, UserRole, getRoleBadgeLabel } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/formatters";

export default function AdminProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [alertsList, setAlertsList] = useState<any[]>([]);

  // Modale de création d'un profil (Directeur / Comptable / Admin)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("DIRECTOR");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+228 ");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Modale de signalement de problème (Directeur & Comptable)
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTargetRole, setAlertTargetRole] = useState<"BOTH" | "DIRECTOR" | "ACCOUNTANT">("BOTH");
  const [alertCategory, setAlertCategory] = useState<"PAYMENT_DELAY" | "STUDENT_COUNT" | "CASH_DISCREPANCY" | "OTHER">("PAYMENT_DELAY");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertPriority, setAlertPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("HIGH");
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

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

      // Si l'utilisateur n'est pas encore basculé en rôle Administrateur
      if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "SUPER_ADMIN") {
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

      // Charger l'équipe et les profils
      try {
        const staffRes = await apiFetch("/api/staff");
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaffList(staffData.staff || []);
        }
      } catch (e) {}

      // Charger les alertes internes
      try {
        const alertRes = await apiFetch("/api/alerts");
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setAlertsList(alertData.alerts || []);
        }
      } catch (e) {}
    } catch (err) {
      console.error("Erreur chargement profil admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileSubmitting(true);

    try {
      const res = await apiFetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          role,
          email,
          password,
          phone
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de la création du profil");
      }

      setProfileSuccess(`Le profil ${getRoleBadgeLabel(role).label} pour ${fullName} a été créé avec succès !`);
      setFullName("");
      setEmail("");
      setPassword("");
      setPhone("+228 ");
      await loadData();
      setTimeout(() => {
        setShowCreateModal(false);
        setProfileSuccess(null);
      }, 1500);
    } catch (err: any) {
      setProfileError(err.message || "Erreur de création");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    setAlertSuccess(null);
    setAlertSubmitting(true);

    try {
      const res = await apiFetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: alertTargetRole,
          category: alertCategory,
          title: alertTitle,
          description: alertDescription,
          priority: alertPriority
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de l'enregistrement de l'alerte");
      }

      setAlertSuccess("Le signalement a été transmis avec succès aux responsables concernés !");
      setAlertTitle("");
      setAlertDescription("");
      await loadData();
      setTimeout(() => {
        setShowAlertModal(false);
        setAlertSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAlertError(err.message || "Erreur d'envoi");
    } finally {
      setAlertSubmitting(false);
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
        setAlertsList(prev => prev.map(a => a.id === id ? { ...a, status: "RESOLVED", resolvedAt: new Date().toISOString() } : a));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous désactiver l'accès pour ${name} ?`)) return;
    try {
      const res = await apiFetch(`/api/staff?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStaffList(prev => prev.map(m => m.id === id ? { ...m, isActive: false } : m));
      }
    } catch (e) {
      alert("Erreur lors de la désactivation.");
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">
          Chargement du profil administrateur...
        </p>
      </div>
    );
  }

  const directors = staffList.filter(s => s.role === "DIRECTOR" && s.isActive !== false);
  const accountants = staffList.filter(s => s.role === "ACCOUNTANT" && s.isActive !== false);
  const admins = staffList.filter(s => s.role === "ESTABLISHMENT_ADMIN" && s.isActive !== false);
  const openAlerts = alertsList.filter(a => a.status === "OPEN");
  const resolvedAlerts = alertsList.filter(a => a.status === "RESOLVED");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role="ESTABLISHMENT_ADMIN" />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* ========================================================================= */}
          {/* EN-TÊTE : PROFIL DE L'ADMINISTRATEUR D'ÉCOLE                              */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2 border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Session Administrateur Scolaire Sécurisée • Profil Exécutif</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-[#14213D] tracking-tight">
                Profil Administrateur — Tâches Opérationnelles
              </h1>
              <p className="text-xs lg:text-sm text-slate-500">
                Administrateur : <strong className="text-slate-800">{currentUser.fullName}</strong> • Établissement : <strong className="text-slate-800">{currentUser.establishmentName}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setProfileError(null);
                  setProfileSuccess(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg btn-glow-purple cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>➕ Créer un Profil (DIR / CPT / ADM)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlertError(null);
                  setAlertSuccess(null);
                  setShowAlertModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>🚨 Signaler une Anomalie</span>
              </button>

              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl shadow-xs transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-[#5D3CF2]" />
                <span>Voir Présentation École →</span>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BANNIÈRE D'INFORMATION : RÔLE UNIQUE DE L'ADMINISTRATEUR                  */}
          {/* ========================================================================= */}
          <div className="p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 border border-blue-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl mt-0.5 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed text-blue-950">
                <p className="font-black text-sm">
                  Espace réservé à l'Administrateur pour exécuter ses tâches propres.
                </p>
                <p className="text-blue-800 mt-0.5">
                  Le Tableau de bord général sert à <strong>présenter la situation de l'établissement</strong> (élèves, encaissements, classes).
                  C'est <strong>uniquement ici</strong>, sur votre profil administrateur, que vous pouvez <strong>créer les profils</strong> collaborateurs et <strong>transmettre des signalements</strong> (retards, effectifs, caisse) au Directeur et au Comptable.
                </p>
              </div>
            </div>

            <Link
              href="/admin/staff"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-[#5D3CF2] font-black text-xs rounded-xl border border-indigo-200 shadow-xs whitespace-nowrap transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Voir Équipe & Profils</span>
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* KPIS OPÉRATIONNELS DE L'ADMINISTRATEUR                                    */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Profils Collaborateurs"
              value={`${staffList.filter(s => s.isActive !== false).length} Actifs`}
              subtitle={`${directors.length} DIR • ${accountants.length} CPT • ${admins.length} ADM`}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Anomalies en Cours"
              value={`${openAlerts.length} Alerte(s)`}
              subtitle="Transmises aux DIR et CPT"
              icon={AlertTriangle}
              color="red"
              badgeText={openAlerts.length > 0 ? "Action requise" : "Tout est normal"}
            />
            <StatsCard
              title="Problèmes Résolus"
              value={`${resolvedAlerts.length} Traité(s)`}
              subtitle="Par l'équipe opérationnelle"
              icon={CheckCircle2}
              color="green"
            />
            <StatsCard
              title="Sécurité du Compte"
              value="256-Bit JWT"
              subtitle="Cookies HttpOnly & SameSite Lax"
              icon={Lock}
              color="purple"
            />
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1 : SIGNALEMENTS & ANOMALIES (Admin -> DIR & CPT)                */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Signalements & Anomalies Transmis aux Responsables (Directeur & Comptable)
                  </h2>
                  {openAlerts.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black animate-pulse">
                      {openAlerts.length} en cours
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transmettez ici les retards d'écolage constatés, effectifs mal calculés ou écarts de caisse. Le Directeur et le Comptable les recevront directement sur leur tableau de bord.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAlertError(null);
                  setAlertSuccess(null);
                  setShowAlertModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>+ Signaler un Problème</span>
              </button>
            </div>

            {alertsList.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700">Aucune anomalie signalée pour le moment</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tout fonctionne correctement au sein de l'établissement. Cliquez sur « + Signaler un Problème » en cas d'incohérence.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {alertsList.map(alert => {
                  const isOpen = alert.status === "OPEN";
                  const isDelay = alert.category === "PAYMENT_DELAY";
                  const isCount = alert.category === "STUDENT_COUNT";
                  const isCash = alert.category === "CASH_DISCREPANCY";

                  const targetLabel = 
                    alert.targetRole === "BOTH" ? "Directeur & Comptable" :
                    alert.targetRole === "DIRECTOR" ? "Directeur d'École" : "Comptable / Caisse";

                  const targetBg =
                    alert.targetRole === "BOTH" ? "bg-purple-100 text-purple-800 border-purple-200" :
                    alert.targetRole === "DIRECTOR" ? "bg-indigo-100 text-indigo-800 border-indigo-200" :
                    "bg-emerald-100 text-emerald-800 border-emerald-200";

                  const categoryLabel = 
                    isDelay ? "Retard de Paiement / Dettes" :
                    isCount ? "Effectif / Classe Mal Calculé" :
                    isCash ? "Écart de Caisse / Encaissement" : "Autre Anomalie";

                  return (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isOpen 
                          ? "bg-rose-50/30 border-rose-200 hover:border-rose-400 shadow-xs" 
                          : "bg-slate-50/60 border-slate-200 opacity-80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${targetBg}`}>
                            Destinataire : {targetLabel}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              alert.priority === "URGENT" ? "bg-red-600 text-white" :
                              alert.priority === "HIGH" ? "bg-amber-500 text-white" :
                              "bg-blue-500 text-white"
                            }`}>
                              {alert.priority === "URGENT" ? "🔴 URGENT" : alert.priority === "HIGH" ? "⚠️ ÉLEVÉ" : "ℹ️ NORMAL"}
                            </span>

                            {isOpen ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                En attente
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Traité
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                          <span>{isDelay ? "🚨" : isCount ? "👥" : isCash ? "💵" : "⚠️"}</span>
                          <span>{categoryLabel}</span>
                        </div>

                        <h3 className="font-black text-slate-900 text-sm leading-snug">
                          {alert.title}
                        </h3>

                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-100">
                          {alert.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                        <span>Émis par : <strong className="text-slate-700">{alert.creatorName}</strong></span>

                        {isOpen ? (
                          <button
                            type="button"
                            onClick={() => handleResolveAlert(alert.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shadow-xs cursor-pointer transition-all active:scale-95"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Résolu</span>
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold">
                            Résolu le {formatDate(alert.resolvedAt || alert.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2 : GESTION DES PROFILS & COLLABORATEURS                           */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#5D3CF2]" />
                  <span>Membres du Personnel & Profils Actifs ({staffList.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  L'administrateur gère ici la création de nouveaux profils et les identifiants d'accès.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileError(null);
                  setProfileSuccess(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5D3CF2] hover:bg-[#4C2CE0] active:scale-95 text-white font-black text-xs rounded-xl shadow-md btn-glow-purple cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Créer un Profil</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-3">Nom & Prénoms</th>
                    <th className="p-3">Rôle / Profil</th>
                    <th className="p-3">Email de Connexion</th>
                    <th className="p-3">Téléphone</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {staffList.map((s, i) => {
                    const badge = getRoleBadgeLabel(s.role as any);
                    return (
                      <tr key={s.id || i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-900">
                          {s.fullName}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {s.email}
                        </td>
                        <td className="p-3 text-slate-600">
                          {s.phone || "—"}
                        </td>
                        <td className="p-3">
                          {s.isActive !== false ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-red-200">
                              Désactivé
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {s.isActive !== false && s.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(s.id, s.fullName)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Désactiver l'accès de ce collaborateur"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALE 1 : CRÉATION D'UN PROFIL (DIR / CPT / ADM)                         */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-[#5D3CF2] rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Nouveau Profil au sein de l'Établissement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Attribuez un rôle (Directeur, Comptable, Admin) et ses identifiants
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Rôle & Profil à Créer * :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("DIRECTOR")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "DIRECTOR"
                        ? "border-[#5D3CF2] bg-indigo-50/60 ring-2 ring-[#5D3CF2] text-indigo-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">🎓 Directeur</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Supervision</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ACCOUNTANT")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "ACCOUNTANT"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600 text-emerald-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">💰 Comptable</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Caisse & Reçus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ESTABLISHMENT_ADMIN")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "ESTABLISHMENT_ADMIN"
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600 text-blue-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">⚙️ Admin</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Gestion</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nom et Prénoms du Collaborateur * :
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ex : M. KOUDOSSOU Mawuli"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email de Connexion * :
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="comptable@mon-ecole.tg"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Téléphone WhatsApp :
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+228 90 12 34 56"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mot de Passe Initial pour ce Profil * :
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Le collaborateur utilisera cet email et mot de passe pour se connecter directement à son espace dédié.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-black text-xs rounded-2xl shadow-md btn-glow-purple cursor-pointer transition-all disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{profileSubmitting ? "Création en cours..." : "Créer le Profil"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE 2 : SIGNALER UN PROBLÈME AUX DIRECTEUR ET COMPTABLE                 */}
      {/* ========================================================================= */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Signaler une Anomalie / un Problème
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Transmettre une alerte opérationnelle directement au Directeur et/ou Comptable
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {alertError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{alertError}</span>
              </div>
            )}

            {alertSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{alertSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAlert} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. Destinataire(s) de l'Alerte * :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertTargetRole("BOTH")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      alertTargetRole === "BOTH"
                        ? "border-[#5D3CF2] bg-indigo-50/60 ring-2 ring-[#5D3CF2] text-indigo-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">👥 Les Deux</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Dir & Caisse</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAlertTargetRole("DIRECTOR")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      alertTargetRole === "DIRECTOR"
                        ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-600 text-purple-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">🎓 Directeur</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Effectifs / Classes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAlertTargetRole("ACCOUNTANT")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      alertTargetRole === "ACCOUNTANT"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600 text-emerald-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">💰 Comptable</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Paiements & Caisse</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  2. Type / Catégorie d'Anomalie * :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAlertCategory("PAYMENT_DELAY");
                      if (!alertTitle) setAlertTitle("Retard de paiement critique constaté");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      alertCategory === "PAYMENT_DELAY"
                        ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-600 text-rose-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">🚨 Retard de Paiement</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">Tranche impayée, dettes anormales</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertCategory("STUDENT_COUNT");
                      if (!alertTitle) setAlertTitle("Effectif ou découpage de classe mal calculé");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      alertCategory === "STUDENT_COUNT"
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600 text-indigo-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">👥 Effectif Mal Calculé</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">Classe surchargée, incohérence effectif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertCategory("CASH_DISCREPANCY");
                      if (!alertTitle) setAlertTitle("Anomalie d'encaissement ou écart de caisse");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      alertCategory === "CASH_DISCREPANCY"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600 text-emerald-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">💵 Écart de Caisse</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">TMoney/Flooz non rapproché, reçu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAlertCategory("OTHER");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      alertCategory === "OTHER"
                        ? "border-amber-600 bg-amber-50/60 ring-2 ring-amber-600 text-amber-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">⚠️ Autre Problème</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">Urgence générale, organisation</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    3. Objet / Titre du Signalement * :
                  </label>
                  <input
                    type="text"
                    required
                    value={alertTitle}
                    onChange={e => setAlertTitle(e.target.value)}
                    placeholder="Ex : Retard critique 2ème tranche en classe de 3ème"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Priorité :
                  </label>
                  <select
                    value={alertPriority}
                    onChange={e => setAlertPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="URGENT">🔴 Urgent</option>
                    <option value="HIGH">🟡 Élevé</option>
                    <option value="NORMAL">🔵 Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  4. Description Détaillée & Consignes pour le Directeur / Comptable * :
                </label>
                <textarea
                  required
                  rows={4}
                  value={alertDescription}
                  onChange={e => setAlertDescription(e.target.value)}
                  placeholder="Ex : Nous avons constaté que l'effectif de la 6ème B est calculé à 45 élèves alors que 42 places sont autorisées. Merci au Directeur de recalculer et de vérifier la liste d'inscription..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={alertSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{alertSubmitting ? "Transmission en cours..." : "Transmettre l'Alerte"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
