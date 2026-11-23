"use client";

import React, { useState, useEffect } from "react";
import { 
  Coins, 
  Calendar, 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Trash2, 
  Layers, 
  Percent, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  Save,
  X
} from "lucide-react";
import { formatXOF } from "@/lib/formatters";
import { apiFetch } from "@/lib/api-client";

interface FeePricingSectionProps {
  canEdit?: boolean;
}

export function FeePricingSection({ canEdit = true }: FeePricingSectionProps) {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "TRANCHE" | "MENSUEL" | "ANNUEL">("ALL");

  // Modale de fixation de tarif
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    id: "",
    name: "Scolarité Primaire (CP1 - CM2)",
    level: "PRIMAIRE",
    academicYear: "2024-2025",
    paymentMode: "MIXTE",
    annualAmount: 95000,
    monthlyAmount: 9500,
    discountAnnual: 5,
    tranches: [
      { trancheNumber: 1, name: "Tranche 1 (Rentrée Octobre)", percentage: 40, amount: 38000, dueDate: "2024-10-15" },
      { trancheNumber: 2, name: "Tranche 2 (Deuxième Trimestre)", percentage: 35, amount: 33250, dueDate: "2024-12-15" },
      { trancheNumber: 3, name: "Tranche 3 (Solde Troisième Trimestre)", percentage: 25, amount: 23750, dueDate: "2025-02-15" }
    ]
  });

  const loadFees = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/fees");
      if (res.ok) {
        const json = await res.json();
        setFees(json.fees || []);
      }
    } catch (err) {
      console.error("Erreur chargement des tarifs d'écolage:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  // Calcul automatique des tranches quand le montant annuel change
  const handleAnnualChange = (amount: number) => {
    const monthly = Math.round(amount / 10);
    const t1 = Math.round(amount * 0.4);
    const t2 = Math.round(amount * 0.35);
    const t3 = amount - t1 - t2;

    setFormData(prev => ({
      ...prev,
      annualAmount: amount,
      monthlyAmount: monthly,
      tranches: [
        { ...prev.tranches[0], amount: t1, percentage: 40 },
        { ...prev.tranches[1], amount: t2, percentage: 35 },
        { ...prev.tranches[2], amount: t3, percentage: 25 }
      ]
    }));
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await apiFetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de l'enregistrement");
      }

      await loadFees();
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de sauvegarde");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette grille tarifaire ?")) return;
    try {
      const res = await apiFetch(`/api/fees?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFees(prev => prev.filter(f => f.id !== id));
      }
    } catch (e) {
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* En-tête de la section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-[#5D3CF2] rounded-xl">
              <Coins className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-[#14213D] tracking-tight">
              Fixation des Prix d'Écolage & Modalités de Paiement
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Définissez vos barèmes tarifaires officiels : par <strong>Tranches</strong>, en <strong>Mensualités</strong> ou au <strong>Comptant Annuel</strong> (Année 2024-2025).
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setFormData({
                id: "",
                name: "Scolarité Nouvelle Classe",
                level: "PRIMAIRE",
                academicYear: "2024-2025",
                paymentMode: "MIXTE",
                annualAmount: 100000,
                monthlyAmount: 10000,
                discountAnnual: 5,
                tranches: [
                  { trancheNumber: 1, name: "Tranche 1 (Rentrée)", percentage: 40, amount: 40000, dueDate: "2024-10-15" },
                  { trancheNumber: 2, name: "Tranche 2 (Mi-Année)", percentage: 35, amount: 35000, dueDate: "2024-12-15" },
                  { trancheNumber: 3, name: "Tranche 3 (Solde)", percentage: 25, amount: 25000, dueDate: "2025-02-15" }
                ]
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-bold text-xs rounded-2xl shadow-md btn-glow-purple transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>➕ Fixer un Nouveau Tarif</span>
          </button>
        )}
      </div>

      {/* Onglets de filtrage des modes */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "ALL" 
              ? "bg-[#14213D] text-white shadow-sm" 
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Vue Complète & Comparatif
        </button>
        <button
          onClick={() => setActiveTab("TRANCHE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "TRANCHE" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "bg-amber-50 text-amber-800 hover:bg-amber-100"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Règlement par Tranches (Échéanciers)</span>
        </button>
        <button
          onClick={() => setActiveTab("MENSUEL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "MENSUEL" 
              ? "bg-blue-600 text-white shadow-sm" 
              : "bg-blue-50 text-blue-800 hover:bg-blue-100"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Règlement Mensuel (10 Mois)</span>
        </button>
        <button
          onClick={() => setActiveTab("ANNUEL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "ANNUEL" 
              ? "bg-emerald-600 text-white shadow-sm" 
              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Comptant Annuel (Remise Écoles)</span>
        </button>
      </div>

      {/* Liste des grilles tarifaires configurées */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-semibold">
          Chargement des barèmes d'écolage...
        </div>
      ) : fees.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-600">Aucun tarif d'écolage configuré pour l'instant.</p>
          <p className="text-[11px] text-slate-400 mt-1">Cliquez sur « Fixer un Nouveau Tarif » pour définir vos tranches ou mensualités.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {fees.map((fee) => {
            const discountedAnnual = fee.discountAnnual > 0 
              ? Math.round(fee.annualAmount * (1 - fee.discountAnnual / 100))
              : fee.annualAmount;

            return (
              <div 
                key={fee.id}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-[#5D3CF2] font-black text-[10px] uppercase">
                          {fee.level}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {fee.academicYear}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                        {fee.name}
                      </h3>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => handleDeleteFee(fee.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer ce tarif"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 3 Cartouches : Tranche / Mensuel / Annuel */}
                  <div className="grid grid-cols-3 gap-2 py-3 bg-white rounded-xl border border-slate-200/80 px-3 mb-4">
                    <div className="text-center border-r border-slate-100">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">1. Tranches</span>
                      <span className="text-xs font-black text-slate-900 block mt-0.5">
                        {fee.tranches?.length || 3} Échéances
                      </span>
                      <span className="text-[9px] text-slate-400">Par Trimestre</span>
                    </div>

                    <div className="text-center border-r border-slate-100">
                      <span className="text-[10px] font-bold text-blue-700 uppercase block">2. Mensuel</span>
                      <span className="text-xs font-black text-slate-900 block mt-0.5">
                        {formatXOF(fee.monthlyAmount)}
                      </span>
                      <span className="text-[9px] text-slate-400">/ mois (10 mois)</span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">3. Annuel</span>
                      <span className="text-xs font-black text-emerald-700 block mt-0.5">
                        {formatXOF(discountedAnnual)}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-semibold">
                        {fee.discountAnnual > 0 ? `-${fee.discountAnnual}% remise` : "Comptant"}
                      </span>
                    </div>
                  </div>

                  {/* Détail des Tranches d'Écolage */}
                  {(activeTab === "ALL" || activeTab === "TRANCHE") && (
                    <div className="space-y-1.5 mb-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Découpage par Tranches :
                      </p>
                      {fee.tranches?.map((tr: any, idx: number) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between text-xs py-1.5 px-3 bg-white rounded-lg border border-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center">
                              T{tr.trancheNumber}
                            </span>
                            <span className="font-semibold text-slate-800">{tr.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900">{formatXOF(tr.amount)}</span>
                            <span className="text-[10px] text-slate-400 block">Échéance : {tr.dueDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Détail du paiement Mensuel */}
                  {(activeTab === "ALL" || activeTab === "MENSUEL") && (
                    <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-bold text-blue-900">Échéance Mensuelle :</p>
                          <p className="text-[10px] text-blue-700">À régler au plus tard le 05 de chaque mois</p>
                        </div>
                      </div>
                      <span className="font-black text-blue-900">{formatXOF(fee.monthlyAmount)} / mois</span>
                    </div>
                  )}

                  {/* Détail du paiement Comptant Annuel */}
                  {(activeTab === "ALL" || activeTab === "ANNUEL") && (
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-bold text-emerald-900">Paiement Comptant Annuel :</p>
                          <p className="text-[10px] text-emerald-700">Frais normaux : {formatXOF(fee.annualAmount)}</p>
                        </div>
                      </div>
                      <span className="font-black text-emerald-800">{formatXOF(discountedAnnual)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Barème Actif
                  </span>
                  <span>Total Annuel Référence : <strong className="text-slate-800 font-bold">{formatXOF(fee.annualAmount)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE DE FIXATION OU MODIFICATION D'UN TARIF */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-[#5D3CF2] rounded-xl">
                  <Coins className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Fixation des Prix d'Écolage
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Paramétrez le montant annuel, les tranches et les mensualités
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveFee} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Libellé du Barème d'Écolage * :
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex : Scolarité Collège (6ème - 3ème)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cycle / Niveau :
                  </label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  >
                    <option value="MATERNELLE">Maternelle</option>
                    <option value="PRIMAIRE">Primaire</option>
                    <option value="COLLEGE">Collège</option>
                    <option value="LYCEE">Lycée</option>
                    <option value="TOUS">Toutes les classes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Année Scolaire :
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>
              </div>

              {/* FIXATION DES 3 MODALITÉS */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <p className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Montants de Référence (FCFA) :
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Montant Annuel (FCFA) * :
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      value={formData.annualAmount}
                      onChange={e => handleAnnualChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Mensualité (10 mois) :
                    </label>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={formData.monthlyAmount}
                      onChange={e => setFormData({ ...formData, monthlyAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Remise Annuel (%) :
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.discountAnnual}
                      onChange={e => setFormData({ ...formData, discountAnnual: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-700 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                    />
                  </div>
                </div>
              </div>

              {/* DÉTAIL DES 3 TRANCHES */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Échéancier des 3 Tranches :
                </p>
                {formData.tranches.map((tr, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="col-span-5">
                      <span className="text-[10px] font-bold text-slate-400 block">Libellé Tranche {index + 1} :</span>
                      <input
                        type="text"
                        value={tr.name}
                        onChange={e => {
                          const updated = [...formData.tranches];
                          updated[index].name = e.target.value;
                          setFormData({ ...formData, tranches: updated });
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="col-span-4">
                      <span className="text-[10px] font-bold text-slate-400 block">Montant (FCFA) :</span>
                      <input
                        type="number"
                        value={tr.amount}
                        onChange={e => {
                          const updated = [...formData.tranches];
                          updated[index].amount = Number(e.target.value);
                          setFormData({ ...formData, tranches: updated });
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900"
                      />
                    </div>

                    <div className="col-span-3">
                      <span className="text-[10px] font-bold text-slate-400 block">Date limite :</span>
                      <input
                        type="date"
                        value={tr.dueDate}
                        onChange={e => {
                          const updated = [...formData.tranches];
                          updated[index].dueDate = e.target.value;
                          setFormData({ ...formData, tranches: updated });
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-black text-xs rounded-2xl shadow-md btn-glow-purple cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? "Enregistrement..." : "Enregistrer la Grille Tarifaire"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
