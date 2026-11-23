"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { 
  Inbox, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Clock, 
  User, 
  Building2, 
  ArrowLeft, 
  AlertCircle, 
  GraduationCap, 
  Check, 
  Sparkles,
  ShieldAlert,
  Calendar,
  Filter
} from "lucide-react";
import { SessionUser, getRoleBadgeLabel } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/formatters";

export default function DirectorMessagesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

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

      // Charger uniquement les alertes destinées au Directeur (DIRECTOR ou BOTH)
      const res = await apiFetch(`/api/alerts?role=DIRECTOR`);
      if (res.ok) {
        const json = await res.json();
        const list = json.alerts || [];
        setAlerts(list);
        if (list.length > 0 && !selectedAlertId) {
          setSelectedAlertId(list[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      setResolvingId(alertId);
      setActionSuccess(null);
      const res = await apiFetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, action: "RESOLVE" })
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? {
          ...a,
          status: "RESOLVED",
          resolvedAt: new Date().toISOString(),
          resolvedByName: currentUser?.fullName || "Directeur"
        } : a));
        setActionSuccess("Signalement marqué comme traité avec succès !");
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">
          Chargement de la messagerie Directeur...
        </p>
      </div>
    );
  }

  // Filtrage des alertes
  const filteredAlerts = alerts.filter(a => {
    const matchFilter = 
      filterTab === "ALL" ? true :
      filterTab === "OPEN" ? a.status === "OPEN" :
      a.status === "RESOLVED";

    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.creatorName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchFilter && matchSearch;
  });

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || filteredAlerts[0] || null;
  const openCount = alerts.filter(a => a.status === "OPEN").length;
  const resolvedCount = alerts.filter(a => a.status === "RESOLVED").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role="DIRECTOR" />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          {/* EN-TÊTE DE LA MESSAGERIE DIRECTEUR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#5D3CF2] text-xs font-bold mb-2 border border-purple-200">
                <GraduationCap className="w-3.5 h-3.5 text-[#5D3CF2]" />
                <span>Boîte de Messagerie Dédiée • Profil Directeur d'École</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-[#14213D] tracking-tight">
                Messagerie & Signalements Directeur
              </h1>
              <p className="text-xs lg:text-sm text-slate-500">
                Consultez les signalements d'anomalies (effectifs, retards scolarité, dossiers élèves) transmis par l'Administration.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/director"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour Tableau de bord Directeur</span>
              </Link>
            </div>
          </div>

          {/* STATS RAPIDES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Alertes Reçues</p>
                <p className="text-2xl font-black text-[#14213D] mt-1">{alerts.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#5D3CF2]">
                <Inbox className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-500">En attente de traitement</p>
                <p className="text-2xl font-black text-rose-600 mt-1">{openCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Traitées & Résolues</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* ZONE PRINCIPALE MESSAGERIE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[520px]">
            {/* COLONNE GAUCHE : LISTE DES ALERTES */}
            <div className="w-full md:w-5/12 border-r border-slate-200 flex flex-col">
              {/* Barre de recherche et filtres */}
              <div className="p-4 border-b border-slate-200 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher une alerte..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterTab("ALL")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
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
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      filterTab === "OPEN"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Ouvertes ({openCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab("RESOLVED")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      filterTab === "RESOLVED"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Résolues ({resolvedCount})
                  </button>
                </div>
              </div>

              {/* Liste d'alertes */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-300" />
                    <p className="font-semibold">Aucune alerte reçue</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Votre boîte de messagerie Directeur est à jour.
                    </p>
                  </div>
                ) : (
                  filteredAlerts.map(alert => {
                    const isSelected = selectedAlert?.id === alert.id;
                    const isOpen = alert.status === "OPEN";

                    return (
                      <button
                        key={alert.id}
                        type="button"
                        onClick={() => setSelectedAlertId(alert.id)}
                        className={`w-full text-left p-4 transition-all hover:bg-slate-50 cursor-pointer ${
                          isSelected ? "bg-purple-50/70 border-l-4 border-l-[#5D3CF2]" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            alert.priority === "URGENT" ? "bg-rose-100 text-rose-700" :
                            alert.priority === "HIGH" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {alert.priority}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(alert.createdAt)}
                          </span>
                        </div>

                        <p className={`text-xs font-bold line-clamp-1 ${isOpen ? "text-[#14213D]" : "text-slate-500"}`}>
                          {alert.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                          {alert.description}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>De : {alert.creatorName}</span>
                          <span className={`font-bold ${isOpen ? "text-rose-600" : "text-emerald-600"}`}>
                            {isOpen ? "En attente" : "Traité"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLONNE DROITE : DÉTAIL DE L'ALERTE SÉLECTIONNÉE */}
            <div className="w-full md:w-7/12 p-6 flex flex-col justify-between">
              {selectedAlert ? (
                <div className="space-y-6">
                  {/* En-tête de l'alerte */}
                  <div className="space-y-3 pb-4 border-b border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                          selectedAlert.priority === "URGENT" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                          selectedAlert.priority === "HIGH" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                          "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}>
                          Priorité {selectedAlert.priority}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          selectedAlert.status === "OPEN" ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}>
                          {selectedAlert.status === "OPEN" ? "● En cours d'examen" : "✓ Traité & Résolu"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatDate(selectedAlert.createdAt)}
                      </span>
                    </div>

                    <h2 className="text-lg lg:text-xl font-black text-[#14213D]">
                      {selectedAlert.title}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Émis par : <strong>{selectedAlert.creatorName}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Destinataire : <strong className="text-[#5D3CF2]">Directeur d'École</strong></span>
                    </div>
                  </div>

                  {/* Contenu / Description */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Description du problème signalé
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {selectedAlert.description}
                    </div>
                  </div>

                  {/* Détails de résolution */}
                  {selectedAlert.status === "RESOLVED" && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Ce signalement a été marqué comme résolu</span>
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        Résolu par {selectedAlert.resolvedByName || "Directeur"} le {formatDate(selectedAlert.resolvedAt || selectedAlert.createdAt)}.
                      </p>
                    </div>
                  )}

                  {/* Action de résolution */}
                  {selectedAlert.status === "OPEN" && (
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Avez-vous effectué les vérifications nécessaires (inscriptions, effectifs) ?
                      </p>
                      <button
                        type="button"
                        disabled={resolvingId === selectedAlert.id}
                        onClick={() => handleResolveAlert(selectedAlert.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{resolvingId === selectedAlert.id ? "Traitement..." : "Marquer comme Traité & Résolu"}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Inbox className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-600">Aucun message sélectionné</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Sélectionnez une alerte dans la liste à gauche pour consulter les détails et effectuer le suivi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
