"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { 
  Inbox, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Clock, 
  ShieldCheck, 
  User, 
  Building2, 
  ArrowLeft, 
  Plus, 
  X, 
  AlertCircle, 
  Users, 
  Wallet, 
  GraduationCap, 
  Receipt,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { SessionUser, getRoleBadgeLabel, UserRole } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/formatters";

export default function MessagesInboxPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modale pour composer une nouvelle alerte / message
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTargetRole, setComposeTargetRole] = useState<"BOTH" | "DIRECTOR" | "ACCOUNTANT">("BOTH");
  const [composeCategory, setComposeCategory] = useState<"PAYMENT_DELAY" | "STUDENT_COUNT" | "CASH_DISCREPANCY" | "OTHER">("PAYMENT_DELAY");
  const [composeTitle, setComposeTitle] = useState("");
  const [composeDescription, setComposeDescription] = useState("");
  const [composePriority, setComposePriority] = useState<"NORMAL" | "HIGH" | "URGENT">("HIGH");
  const [submitting, setSubmitting] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccess, setComposeSuccess] = useState<string | null>(null);

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

      // Redirection automatique vers la boîte de messagerie propre et unique à chaque profil
      if (user.role === "DIRECTOR") {
        router.replace("/director/messages");
        return;
      }
      if (user.role === "ACCOUNTANT") {
        router.replace("/accounting/messages");
        return;
      }
      if (user.role === "ESTABLISHMENT_ADMIN") {
        router.replace("/admin/profile");
        return;
      }
      router.replace("/admin");
      return;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeError(null);
    setComposeSuccess(null);
    setSubmitting(true);

    try {
      const res = await apiFetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: composeTargetRole,
          category: composeCategory,
          title: composeTitle,
          description: composeDescription,
          priority: composePriority
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de l'enregistrement de l'alerte");
      }

      setComposeSuccess("Message d'alerte transmis avec succès aux responsables concernés !");
      setComposeTitle("");
      setComposeDescription("");
      await loadData();
      if (json.alert) {
        setSelectedAlertId(json.alert.id);
      }
      setTimeout(() => {
        setShowComposeModal(false);
        setComposeSuccess(null);
      }, 1500);
    } catch (err: any) {
      setComposeError(err.message || "Erreur d'envoi");
    } finally {
      setSubmitting(false);
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
        setAlerts(prev => prev.map(a => a.id === id ? { 
          ...a, 
          status: "RESOLVED", 
          resolvedAt: new Date().toISOString(),
          resolvedByName: `${currentUser?.fullName} (${currentUser?.role})`
        } : a));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">
          Chargement de la boîte de messagerie...
        </p>
      </div>
    );
  }

  // Filtrage
  const filteredAlerts = alerts.filter(a => {
    const matchesTab = 
      filterTab === "ALL" ? true :
      filterTab === "OPEN" ? a.status === "OPEN" :
      a.status === "RESOLVED";

    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (a.title || "").toLowerCase().includes(search) ||
      (a.description || "").toLowerCase().includes(search) ||
      (a.creatorName || "").toLowerCase().includes(search);

    return matchesTab && matchesSearch;
  });

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || filteredAlerts[0] || null;
  const openCount = alerts.filter(a => a.status === "OPEN").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role={currentUser.role} />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* ========================================================================= */}
          {/* EN-TÊTE : BOÎTE DE RÉCEPTION & MESSAGERIE D'ALERTES                       */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[#5D3CF2] text-xs font-bold mb-2 border border-indigo-200">
                <Inbox className="w-3.5 h-3.5" />
                <span>Messagerie Interne Sécurisée de l'Établissement</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-[#14213D] tracking-tight">
                Boîte de Messagerie & Alertes
              </h1>
              <p className="text-xs lg:text-sm text-slate-500">
                Communication opérationnelle entre la Direction, la Caisse et l'Administration de <strong className="text-slate-800">{currentUser.establishmentName}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setComposeError(null);
                  setComposeSuccess(null);
                  setShowComposeModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg btn-glow-purple cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Rédiger un Signalement d'Alerte</span>
              </button>

              <Link
                href={
                  currentUser.role === "DIRECTOR" ? "/director" :
                  currentUser.role === "ACCOUNTANT" ? "/accounting" :
                  currentUser.role === "ESTABLISHMENT_ADMIN" ? "/admin/profile" : "/admin"
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl shadow-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-[#5D3CF2]" />
                <span>Retour à mon Espace</span>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INTERFACE DE LA BOÎTE DE MESSAGERIE (LISTE + DETAIL DU MESSAGE)           */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            {/* PANNEAU GAUCHE : LISTE DES MESSAGES D'ALERTE */}
            <div className="lg:col-span-5 border-r border-slate-200 flex flex-col bg-slate-50/40">
              {/* Barre de recherche et onglets */}
              <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par objet, auteur..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterTab("ALL")}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      filterTab === "ALL" 
                        ? "bg-[#5D3CF2] text-white shadow-xs" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Toutes ({alerts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab("OPEN")}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      filterTab === "OPEN" 
                        ? "bg-rose-600 text-white shadow-xs" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>En attente</span>
                    {openCount > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        filterTab === "OPEN" ? "bg-white text-rose-600" : "bg-rose-600 text-white"
                      }`}>
                        {openCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab("RESOLVED")}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      filterTab === "RESOLVED" 
                        ? "bg-emerald-600 text-white shadow-xs" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Traitées
                  </button>
                </div>
              </div>

              {/* Liste défilante des alertes */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold">Aucun message d'alerte dans cette vue</p>
                  </div>
                ) : (
                  filteredAlerts.map(alert => {
                    const isSelected = selectedAlert?.id === alert.id;
                    const isOpen = alert.status === "OPEN";

                    const isDelay = alert.category === "PAYMENT_DELAY";
                    const isCount = alert.category === "STUDENT_COUNT";
                    const isCash = alert.category === "CASH_DISCREPANCY";

                    return (
                      <div
                        key={alert.id}
                        onClick={() => setSelectedAlertId(alert.id)}
                        className={`p-3.5 transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-white border-l-4 border-l-[#5D3CF2] shadow-xs" 
                            : "hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-bold text-slate-800 truncate max-w-[170px]">
                            {alert.creatorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDate(alert.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            alert.priority === "URGENT" ? "bg-red-600 text-white" :
                            alert.priority === "HIGH" ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                          }`}>
                            {alert.priority}
                          </span>

                          <span className="text-[10px] text-slate-500 font-medium">
                            {isDelay ? "🚨 Retard" : isCount ? "👥 Effectif" : isCash ? "💵 Caisse" : "⚠️ Anomalie"}
                          </span>

                          {isOpen ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500 ml-auto animate-pulse" title="Non résolu"></span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold ml-auto flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Traité
                            </span>
                          )}
                        </div>

                        <p className={`text-xs font-black line-clamp-1 ${isSelected ? "text-[#5D3CF2]" : "text-slate-900"}`}>
                          {alert.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {alert.description}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PANNEAU DROIT : LECTEUR DU MESSAGE SÉLECTIONNÉ */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-white p-6">
              {selectedAlert ? (
                <div className="space-y-5">
                  {/* En-tête du message */}
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                          selectedAlert.priority === "URGENT" ? "bg-red-100 text-red-800 border border-red-200" :
                          selectedAlert.priority === "HIGH" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}>
                          {selectedAlert.priority === "URGENT" ? "🔴 Priorité URGENTE" :
                           selectedAlert.priority === "HIGH" ? "🟡 Priorité ÉLEVÉE" : "🔵 Priorité NORMALE"}
                        </span>

                        <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200">
                          Destinataire : {
                            selectedAlert.targetRole === "BOTH" ? "Directeur & Comptable" :
                            selectedAlert.targetRole === "DIRECTOR" ? "Directeur d'École" : "Comptable / Caisse"
                          }
                        </span>
                      </div>

                      <span className="text-xs text-slate-400 font-mono">
                        {formatDate(selectedAlert.createdAt)}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                      {selectedAlert.title}
                    </h2>

                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>Transmis par : <strong className="text-slate-800">{selectedAlert.creatorName}</strong></span>
                      <span>•</span>
                      <span>Catégorie : <strong>{
                        selectedAlert.category === "PAYMENT_DELAY" ? "Retard de Scolarité / Recouvrement" :
                        selectedAlert.category === "STUDENT_COUNT" ? "Incohérence d'Effectif / Découpage de Classe" :
                        selectedAlert.category === "CASH_DISCREPANCY" ? "Écart de Caisse / Encaissement" : "Autre Anomalie"
                      }</strong></span>
                    </div>
                  </div>

                  {/* Corps du message */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-800 text-xs leading-relaxed space-y-2 whitespace-pre-wrap">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Message & Consignes transmises :
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedAlert.description}
                    </p>
                  </div>

                  {/* Statut de résolution */}
                  {selectedAlert.status === "RESOLVED" && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Cette anomalie a été traitée et résolue</p>
                        <p className="text-[11px] text-emerald-700">
                          Validée le {formatDate(selectedAlert.resolvedAt || selectedAlert.createdAt)} par {selectedAlert.resolvedByName || "un responsable"}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    {selectedAlert.status === "OPEN" ? (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(selectedAlert.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Marquer comme Traité & Résolu</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Dossier clos
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setComposeTargetRole(selectedAlert.targetRole || "BOTH");
                        setComposeCategory(selectedAlert.category || "PAYMENT_DELAY");
                        setComposeTitle(`Re: ${selectedAlert.title}`);
                        setShowComposeModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Répondre / Transmettre une note</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-8 text-slate-400">
                  <div>
                    <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#5D3CF2]" />
                    <p className="font-bold text-sm text-slate-700">Sélectionnez un message d'alerte</p>
                    <p className="text-xs text-slate-400 mt-1">Choisissez une alerte dans la liste de gauche pour afficher ses consignes détaillées.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALE : NOUVEAU MESSAGE / SIGNALEMENT D'ALERTE                           */}
      {/* ========================================================================= */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Transmettre un Message d'Alerte
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Alertez immédiatement les responsables de l'établissement (Directeur / Caisse)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {composeError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{composeError}</span>
              </div>
            )}

            {composeSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{composeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAlert} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. Destinataire(s) du Message * :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setComposeTargetRole("BOTH")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      composeTargetRole === "BOTH"
                        ? "border-[#5D3CF2] bg-indigo-50/60 ring-2 ring-[#5D3CF2] text-indigo-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">👥 Les Deux</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Dir & Caisse</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setComposeTargetRole("DIRECTOR")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      composeTargetRole === "DIRECTOR"
                        ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-600 text-purple-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">🎓 Directeur</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Effectifs / Classes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setComposeTargetRole("ACCOUNTANT")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      composeTargetRole === "ACCOUNTANT"
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
                      setComposeCategory("PAYMENT_DELAY");
                      if (!composeTitle) setComposeTitle("Retard de paiement critique constaté");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      composeCategory === "PAYMENT_DELAY"
                        ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-600 text-rose-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">🚨 Retard de Paiement</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">Tranche impayée, dettes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComposeCategory("STUDENT_COUNT");
                      if (!composeTitle) setComposeTitle("Effectif ou découpage de classe mal calculé");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      composeCategory === "STUDENT_COUNT"
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600 text-indigo-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">👥 Effectif Mal Calculé</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">Classe surchargée, incohérence</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComposeCategory("CASH_DISCREPANCY");
                      if (!composeTitle) setComposeTitle("Anomalie d'encaissement ou écart de caisse");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      composeCategory === "CASH_DISCREPANCY"
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600 text-emerald-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">💵 Écart de Caisse</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">TMoney/Flooz, reçu guichet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setComposeCategory("OTHER")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      composeCategory === "OTHER"
                        ? "border-amber-600 bg-amber-50/60 ring-2 ring-amber-600 text-amber-950 font-black"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                    }`}
                  >
                    <span className="block text-xs">⚠️ Autre Problème</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">Urgence générale</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    3. Objet / Titre du Message * :
                  </label>
                  <input
                    type="text"
                    required
                    value={composeTitle}
                    onChange={e => setComposeTitle(e.target.value)}
                    placeholder="Ex : Retard critique 2ème tranche en 3ème A"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Priorité :
                  </label>
                  <select
                    value={composePriority}
                    onChange={e => setComposePriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  >
                    <option value="URGENT">🔴 Urgent</option>
                    <option value="HIGH">🟡 Élevé</option>
                    <option value="NORMAL">🔵 Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  4. Message & Consignes Opérationnelles * :
                </label>
                <textarea
                  required
                  rows={4}
                  value={composeDescription}
                  onChange={e => setComposeDescription(e.target.value)}
                  placeholder="Détaillez le problème constaté et les actions attendues de la Direction ou de la Caisse..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-black text-xs rounded-2xl shadow-md btn-glow-purple cursor-pointer transition-all disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Transmission en cours..." : "Envoyer l'Alerte"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
