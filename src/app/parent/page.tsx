"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { 
  GraduationCap, 
  Coins, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Calendar,
  Building2,
  ShieldCheck,
  Download,
  MessageSquare,
  PhoneCall,
  Send,
  Smartphone,
  X,
  Sparkles
} from "lucide-react";
import { formatXOF, formatDate, normalizeTogoPhone } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

export default function ParentPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [establishment, setEstablishment] = useState<any>(null);

  // Modale Réclamation / Signalement WhatsApp
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimType, setClaimType] = useState("PAYMENT_REPORT");
  const [claimChildId, setClaimChildId] = useState("");
  const [claimDetails, setClaimDetails] = useState("");

  useEffect(() => {
    const loadParentData = async () => {
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
          const saved = localStorage.getItem("ecofrais_user") || (localStorage.getItem("ecofrais_user") || localStorage.getItem("schoolpay_user"));
          if (saved) user = JSON.parse(saved);
        }

        if (!user) {
          window.location.href = "/login";
          return;
        }

        setCurrentUser(user);

        // Récupérer uniquement les enfants de ce parent
        const res = await apiFetch("/api/parent/children");
        const json = await res.json();
        const chList = json.children || [];
        setChildren(chList);
        setEstablishment(json.establishment || null);
        if (chList.length > 0) {
          setClaimChildId(chList[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadParentData();
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Chargement de votre espace parent sécurisé...</p>
      </div>
    );
  }

  // Calculs totaux pour la famille
  const totalFamilyDue = children.reduce((sum, c) => sum + (c.invoice?.finalAmount || 0), 0);
  const totalFamilyPaid = children.reduce((sum, c) => sum + (c.invoice?.paidAmount || 0), 0);
  const totalFamilyBalance = totalFamilyDue - totalFamilyPaid;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role="PARENT" />

        <main className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto max-w-6xl">
          {/* Bannière Parent */}
          <div className="bg-gradient-to-r from-[#14213D] to-blue-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-3 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portail Parent Sécurisé</span>
              </span>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                Bienvenue, {currentUser.fullName}
              </h1>
              <p className="text-xs lg:text-sm text-slate-300 mt-1 max-w-xl">
                Suivez en temps réel la scolarité de vos enfants inscrits à <strong>{establishment?.name || "l'établissement"}</strong>, consultez les échéanciers et téléchargez vos reçus officiels.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 text-right whitespace-nowrap">
              <p className="text-xs text-slate-300">Total Enfants Inscrits</p>
              <p className="text-3xl font-black text-white">{children.length} {children.length > 1 ? "Élèves" : "Élève"}</p>
            </div>
          </div>

          {/* Synthèse financière famille */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title="Total Scolarités Famille"
              value={formatXOF(totalFamilyDue)}
              subtitle="Année scolaire 2024-2025"
              icon={Coins}
              color="blue"
            />
            <StatsCard
              title="Montant Déjà Réglé"
              value={formatXOF(totalFamilyPaid)}
              subtitle="Versements confirmés avec reçus"
              icon={CheckCircle2}
              color="green"
            />
            <StatsCard
              title="Solde Restant à Régler"
              value={formatXOF(totalFamilyBalance)}
              subtitle={totalFamilyBalance === 0 ? "Félicitations, scolarités soldées !" : "À régulariser à la caisse ou Mobile Money"}
              icon={Clock}
              color={totalFamilyBalance === 0 ? "green" : "red"}
            />
          </div>

          {/* Section d'Appel & Réclamation WhatsApp (Demande Utilisateur) */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-teal-500/10 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#25D366]/20 text-emerald-800 text-xs font-black">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Service Réclamations & Signalement WhatsApp Direct</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Besoin de contacter la Caisse ou de signaler un versement ?
              </h3>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Signalez un paiement TMoney ou Flooz effectué, transmettez vos références de transfert, demandez un reçu officiel ou contactez directement l'administration de <strong>{establishment?.name || "l'école"}</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClaimModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs rounded-2xl shadow-lg btn-glow-green cursor-pointer active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Signaler ou Réclamer via WhatsApp</span>
              </button>

              <a
                href={`tel:${establishment?.phone || "+22890123456"}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-2xl border border-slate-300 shadow-sm cursor-pointer transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Appel Téléphonique ({establishment?.phone || "+228 90 12 34 56"})</span>
              </a>
            </div>
          </div>

          {/* Fiches par Enfant */}
          <div className="space-y-6">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Situation Individuelle de Vos Enfants
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map(child => {
                const inv = child.invoice;
                const isPaid = inv?.balanceAmount === 0;

                return (
                  <div
                    key={child.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* En-tête Enfant */}
                      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {child.matricule}
                          </span>
                          <h3 className="font-black text-lg text-slate-900 mt-1">
                            {child.firstName} {child.lastName}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Classe : <span className="text-blue-600 font-bold">{child.className}</span>
                          </p>
                        </div>

                        <div>
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Soldé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              <Clock className="w-3.5 h-3.5" /> Reste {formatXOF(inv?.balanceAmount)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Détail financier */}
                      <div className="py-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Montant total scolarité :</span>
                          <span className="font-bold text-slate-900">{formatXOF(inv?.finalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Montant déjà versé :</span>
                          <span className="font-bold text-emerald-600">{formatXOF(inv?.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 font-bold pt-2 border-t border-dashed">
                          <span>Solde restant dû :</span>
                          <span className="font-black text-red-600">{formatXOF(inv?.balanceAmount)}</span>
                        </div>
                      </div>

                      {/* Échéances prévues */}
                      {inv?.items && inv.items.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Échéancier des tranches :
                          </p>
                          <div className="space-y-1.5">
                            {inv.items.map((item: any) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-[11px] font-medium"
                              >
                                <span className="text-slate-700">{item.description}</span>
                                <span className="font-mono font-bold text-slate-900">{formatXOF(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Historique des reçus de cet enfant */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Reçus de paiement officiels :
                      </p>
                      {child.payments && child.payments.length > 0 ? (
                        <div className="space-y-1.5">
                          {child.payments.map((p: any) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs"
                            >
                              <div>
                                <p className="font-mono font-bold text-blue-600">{p.receiptNumber}</p>
                                <p className="text-[10px] text-slate-400">{formatDate(p.paymentDate)} • {p.paymentMethod}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900">{formatXOF(p.amount)}</span>
                                <Link
                                  href={`/receipt/${p.id}`}
                                  target="_blank"
                                  className="p-2 bg-indigo-50 text-[#5D3CF2] hover:bg-[#5D3CF2] hover:text-white rounded-xl transition-all btn-glow-purple cursor-pointer"
                                  title="Consulter et imprimer le reçu officiel"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Aucun reçu émis pour le moment.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal de Réclamation & Signalement WhatsApp Parent */}
          {showClaimModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-[#128C7E] text-white p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Service Réclamations & Signalement</h3>
                      <p className="text-xs text-white/80">
                        Établissement : {establishment?.name || "Administration Scolaire"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowClaimModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Concerne l'élève :</label>
                    <select
                      value={claimChildId}
                      onChange={e => setClaimChildId(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {children.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} ({c.matricule} • {c.className})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Motif de votre démarche :</label>
                    <select
                      value={claimType}
                      onChange={e => setClaimType(e.target.value)}
                      className="w-full p-2.5 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="PAYMENT_REPORT">📢 Signaler un versement Mobile Money effectué (TMoney / Flooz)</option>
                      <option value="RECEIPT_ISSUE">❓ Réclamation sur solde ou reçu non délivré</option>
                      <option value="PAYMENT_DELAY">⏳ Demande d'aménagement d'échéance / délai</option>
                      <option value="OTHER">💬 Autre question à la direction ou comptabilité</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Détails de votre versement ou réclamation :
                    </label>
                    <textarea
                      rows={4}
                      value={claimDetails}
                      onChange={e => setClaimDetails(e.target.value)}
                      placeholder="Ex: J'ai transféré 40 000 FCFA par TMoney le 12/11 avec la référence TG908234. Merci de confirmer et m'envoyer le reçu officiel."
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
                    />
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-800 text-[11px] leading-relaxed">
                    <p className="font-bold mb-0.5">ℹ️ Transmission directe :</p>
                    <p>En cliquant sur « Envoyer via WhatsApp », la conversation s'ouvrira directement avec le numéro de la caisse de l'école (<strong>{establishment?.phone || "+228 90 12 34 56"}</strong>) avec votre message complet pré-rédigé.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetPhone = establishment?.phone || "+228 90 12 34 56";
                      const { cleanDigits } = normalizeTogoPhone(targetPhone);
                      const selectedChild = children.find(c => c.id === claimChildId) || children[0];
                      
                      const typeTitles: Record<string, string> = {
                        PAYMENT_REPORT: "📢 Signalement d'un versement Mobile Money (TMoney / Flooz)",
                        RECEIPT_ISSUE: "❓ Réclamation sur solde ou reçu scolaire",
                        PAYMENT_DELAY: "⏳ Demande de délai de paiement / aménagement",
                        OTHER: "💬 Question ou demande d'assistance"
                      };

                      const message = `Bonjour ${establishment?.name || "l'administration"},\n\nJe suis ${currentUser.fullName}, parent / tuteur légal de l'élève ${selectedChild?.firstName || ""} ${selectedChild?.lastName || ""} (Matricule : ${selectedChild?.matricule || "N/A"}, Classe : ${selectedChild?.className || "N/A"}).\n\n*Objet :* ${typeTitles[claimType] || "Réclamation"}\n*Détails :* ${claimDetails.trim() || "Je vous contacte concernant la situation scolaire de mon enfant."}\n\nMerci de bien vouloir vérifier et me faire un retour.\nCordialement,\n${currentUser.fullName}`;

                      const url = `https://wa.me/${cleanDigits || "22890123456"}?text=${encodeURIComponent(message)}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                      setShowClaimModal(false);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs rounded-2xl shadow-lg btn-glow-green cursor-pointer active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Envoyer sur WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
