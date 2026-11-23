"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Plus, 
  UserCheck, 
  KeyRound, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  ArrowRight,
  UserPlus,
  AlertCircle,
  X,
  LogIn,
  Eye,
  EyeOff,
  Zap,
  GraduationCap,
  Wallet,
  Settings,
  LayoutDashboard
} from "lucide-react";
import { SessionUser, getRoleBadgeLabel, UserRole } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function AdminStaffPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Modale de connexion directe par profil (DIR, CPT)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole>("DIRECTOR");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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

      // Charger les membres du personnel de l'établissement
      const res = await apiFetch("/api/staff");
      if (res.ok) {
        const json = await res.json();
        setStaffList(json.staff || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // Ouverture de la modale de connexion rapide pour un rôle
  const openFastLogin = (targetRole: UserRole, prefillEmail?: string) => {
    setLoginRole(targetRole);
    setLoginError(null);
    setLoginPassword("");
    setShowLoginPassword(false);

    if (prefillEmail) {
      setLoginEmail(prefillEmail);
    } else {
      const existing = staffList.find(s => s.role === targetRole && s.isActive !== false);
      setLoginEmail(existing?.email || "");
    }
    setShowLoginModal(true);
  };

  // Soumission de la connexion au profil sélectionné
  const handleFastLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
          establishmentId: currentUser?.tenantId,
          establishmentName: currentUser?.establishmentName
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || "Adresse email ou mot de passe incorrect.");
        setLoginLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("schoolpay_user", JSON.stringify(data.user));
        if (data.user.role === "DIRECTOR") {
          window.location.href = "/director";
        } else if (data.user.role === "ACCOUNTANT") {
          window.location.href = "/accounting";
        } else if (data.user.role === "ESTABLISHMENT_ADMIN") {
          window.location.href = "/admin/profile";
        } else {
          window.location.href = data.redirectUrl || "/";
        }
      }
    } catch (err) {
      setLoginError("Erreur technique de connexion.");
      setLoginLoading(false);
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
        <p className="text-xs font-semibold text-slate-500">Chargement de l'équipe et des profils...</p>
      </div>
    );
  }

  const directors = staffList.filter(s => s.role === "DIRECTOR" && s.isActive !== false);
  const accountants = staffList.filter(s => s.role === "ACCOUNTANT" && s.isActive !== false);
  const admins = staffList.filter(s => s.role === "ESTABLISHMENT_ADMIN" && s.isActive !== false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role={currentUser.role} />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-indigo-50 text-[#5D3CF2] rounded-lg">
                  <Building2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Compte Établissement : {currentUser.establishmentName}
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
                Gestion des Profils & Équipe de l'Établissement
              </h1>
              <p className="text-xs text-slate-500">
                Basculez vers les profils <strong>Directeur (DIR)</strong> ou <strong>Comptable (CPT)</strong>, ou retournez au <strong>Tableau de Bord Administrateur (ADM)</strong>.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs rounded-2xl shadow-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>← Retour au Tableau de Bord</span>
            </Link>
          </div>

          {/* 3 Cartes Interactives de Connexion Directe DIR, CPT, ADM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CARTE 1 : DIRECTEUR (DIR) */}
            <div 
              className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-purple-500 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/15 transition-colors"></div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 font-black text-base flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                      DIR
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                        Profil Directeur
                      </h3>
                      <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                        {directors.length} Compte(s) actif(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 text-xs text-slate-600">
                  <p className="font-bold text-purple-900">Tâches opérationnelles exclusives :</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Inscription des élèves (Individuelle & Grand Tableur Excel)</li>
                    <li>Fixation des prix d'écolage (Tranches, Mensuel, Annuel)</li>
                    <li>Configuration des classes et effectifs (6A, 6B, 6C...)</li>
                    <li>Supervision exécutive et analytique</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openFastLogin("DIRECTOR")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Saisir Mot de Passe & Ouvrir (DIR) →</span>
                </button>
                <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-50 px-2 py-1 rounded-lg">
                  /director
                </span>
              </div>
            </div>

            {/* CARTE 2 : COMPTABLE (CPT) */}
            <div 
              className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/15 transition-colors"></div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-base flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                      CPT
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                        Profil Comptable / Caisse
                      </h3>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        {accountants.length} Compte(s) actif(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 text-xs text-slate-600">
                  <p className="font-bold text-emerald-900">Tâches opérationnelles exclusives :</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Guichet d'encaissement (Espèces, TMoney, Flooz)</li>
                    <li>Génération et téléchargement des Reçus officiels PDF</li>
                    <li>Suivi des impayés et créances des familles</li>
                    <li>Envoi des relances WhatsApp automatiques</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openFastLogin("ACCOUNTANT")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Saisir Mot de Passe & Ouvrir (CPT) →</span>
                </button>
                <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                  /accounting
                </span>
              </div>
            </div>

            {/* CARTE 3 : ADMINISTRATEUR (ADM) */}
            <div 
              className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/15 transition-colors"></div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 font-black text-base flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      ADM
                    </span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                        Profil Administrateur Scolaire
                      </h3>
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                        {admins.length} Compte(s) actif(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 text-xs text-slate-600">
                  <p className="font-bold text-blue-900">Tâches opérationnelles exclusives :</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Création et gestion des profils collaborateurs (Directeur, Caisse, Admin)</li>
                    <li>Attribution des identifiants et réinitialisation des mots de passe</li>
                    <li>Signalement des problèmes (retards, effectifs) aux Directeur & Comptable</li>
                    <li>Paramétrage des droits d'accès et sécurité de l'établissement</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openFastLogin("ESTABLISHMENT_ADMIN")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Saisir Mot de Passe & Ouvrir (ADM) →</span>
                </button>
                <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-2 py-1 rounded-lg">
                  /admin/profile
                </span>
              </div>
            </div>
          </div>

          {/* Tableau des Collaborateurs de l'Établissement */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Membres Actifs au sein de l'établissement ({staffList.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Cliquez sur « Se connecter » sur une ligne pour basculer directement
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-3.5">Nom & Prénoms</th>
                    <th className="p-3.5">Profil / Rôle</th>
                    <th className="p-3.5">Téléphone</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {staffList.map((s, i) => {
                    const badge = getRoleBadgeLabel(s.role as any);
                    return (
                      <tr key={s.id || i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border text-slate-700 font-bold flex items-center justify-center text-xs">
                              {s.fullName ? s.fullName.substring(0, 2).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{s.fullName}</p>
                              <p className="text-[10px] text-slate-400">ID: {s.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {s.phone || "—"}
                        </td>
                        <td className="p-3.5">
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
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {s.isActive !== false && (
                              <button
                                onClick={() => openFastLogin(s.role, s.email)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#5D3CF2] hover:text-white text-slate-700 font-bold text-[11px] rounded-xl transition-all cursor-pointer"
                                title="Se connecter à ce profil"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Se connecter</span>
                              </button>
                            )}

                            {s.isActive !== false && s.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeactivate(s.id, s.fullName)}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Désactiver l'accès de ce profil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
      {/* MODALE DE CONNEXION DIRECTE PAR PROFIL (DIR / CPT / ADM)                  */}
      {/* ========================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md ${
                  loginRole === "DIRECTOR" ? "bg-purple-600 shadow-purple-200" :
                  loginRole === "ACCOUNTANT" ? "bg-emerald-600 shadow-emerald-200" :
                  "bg-blue-600 shadow-blue-200"
                }`}>
                  {loginRole === "DIRECTOR" ? "DIR" : loginRole === "ACCOUNTANT" ? "CPT" : "ADM"}
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Connexion Profil {loginRole === "DIRECTOR" ? "Directeur" : loginRole === "ACCOUNTANT" ? "Comptable" : "Administrateur"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Établissement : <strong className="text-slate-700">{currentUser.establishmentName}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleFastLogin} className="mt-4 space-y-4">
              {/* Raccourci vers les comptes existants de ce rôle dans l'établissement */}
              {staffList.filter(s => s.role === loginRole && s.isActive !== false).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Comptes {loginRole === "DIRECTOR" ? "Directeurs" : loginRole === "ACCOUNTANT" ? "Comptables" : "Admins"} enregistrés :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {staffList
                      .filter(s => s.role === loginRole && s.isActive !== false)
                      .map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLoginEmail(s.email)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border ${
                            loginEmail === s.email 
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {s.fullName || s.email}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Saisie de l'Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Adresse e-mail du {loginRole === "DIRECTOR" ? "Directeur" : loginRole === "ACCOUNTANT" ? "Comptable" : "Gestionnaire"} * :
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="email@etablissement.tg"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>
              </div>

              {/* Saisie du Mot de Passe */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mot de passe * :
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  ℹ️ Redirige directement vers {loginRole === "DIRECTOR" ? "/director" : loginRole === "ACCOUNTANT" ? "/accounting" : "/admin"}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50 ${
                    loginRole === "DIRECTOR" ? "bg-purple-600 hover:bg-purple-700 shadow-purple-200" :
                    loginRole === "ACCOUNTANT" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" :
                    "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {loginLoading ? "Connexion en cours..." : `Se connecter et ouvrir ${loginRole === "DIRECTOR" ? "/director" : loginRole === "ACCOUNTANT" ? "/accounting" : "/admin"} →`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
