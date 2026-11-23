"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, X, Check, ArrowRight, Smartphone, Banknote, Building2 } from "lucide-react";
import { formatXOF } from "@/lib/formatters";
import { apiFetch } from "@/lib/api-client";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  student: {
    id: string;
    studentName: string;
    matricule: string;
    className: string;
    parentName: string;
    parentPhone: string;
    balanceRemaining: number;
    totalDue: number;
  } | null;
}

export const PAYMENT_METHODS = [
  { id: "ESPECES", label: "Espèces (Guichet)", icon: Banknote, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "TMONEY", label: "TMoney (Togocom)", icon: Smartphone, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { id: "FLOOZ", label: "Flooz (Moov Togo)", icon: Smartphone, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "VIREMENT", label: "Virement Bancaire", icon: Building2, color: "text-purple-600 bg-purple-50 border-purple-200" }
];

export function PaymentModal({ isOpen, onClose, onSuccess, student }: PaymentModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("ESPECES");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [payerName, setPayerName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialisation à l'ouverture
  React.useEffect(() => {
    if (student) {
      setAmount(student.balanceRemaining);
      setPayerName(student.parentName);
      setReferenceNumber("");
      setNotes("");
      setError(null);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError("Le montant doit être supérieur à 0 FCFA.");
      return;
    }

    if (amount > student.balanceRemaining) {
      setError(`Le montant ne peut pas dépasser le solde restant (${formatXOF(student.balanceRemaining)}).`);
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          amount: Math.round(amount),
          paymentMethod,
          referenceNumber: referenceNumber || (paymentMethod === "ESPECES" ? "GUICHET" : "N/A"),
          payerName,
          payerPhone: student.parentPhone,
          notes,
          idempotencyKey: `idem-${student.id}-${Date.now()}`
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Échec de l'enregistrement du paiement.");
        return;
      }

      // Succès
      if (onSuccess) onSuccess();
      onClose();

      // Rediriger vers la page du reçu officiel généré
      if (data.payment?.id) {
        window.location.href = `/receipt/${data.payment.id}`;
      }
    } catch (err: any) {
      setError("Erreur technique lors de l'encaissement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* En-tête */}
        <div className="bg-[#14213D] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Enregistrer un Encaissement</h3>
              <p className="text-xs text-slate-300">
                {student.studentName} • {student.matricule} ({student.className})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Récapitulatif solde */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Solde restant dû :</p>
              <p className="text-lg font-black text-red-600">{formatXOF(student.balanceRemaining)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total facturé :</p>
              <p className="text-sm font-semibold text-slate-700">{formatXOF(student.totalDue)}</p>
            </div>
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Mode de paiement :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-600"
                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-blue-600" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montant à encaisser */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Montant versé (FCFA) :
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                max={student.balanceRemaining}
                required
                value={amount || ""}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full text-lg font-bold p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-slate-800"
                placeholder="Ex: 30000"
              />
              <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">
                XOF
              </span>
            </div>

            {/* Boutons de raccourcis */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(student.balanceRemaining)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                Solde total ({formatXOF(student.balanceRemaining)})
              </button>
              {student.balanceRemaining > 20000 && (
                <button
                  type="button"
                  onClick={() => setAmount(Math.round(student.balanceRemaining / 2))}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  50% ({formatXOF(Math.round(student.balanceRemaining / 2))})
                </button>
              )}
            </div>
          </div>

          {/* Référence de transaction (TMoney / Flooz / Chèque) */}
          {paymentMethod !== "ESPECES" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Référence transaction {paymentMethod} :
              </label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="Ex: TMON-228-89412 ou N° Chèque"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          )}

          {/* Nom du déposant / payeur */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nom du payeur / tuteur :
            </label>
            <input
              type="text"
              value={payerName}
              onChange={e => setPayerName(e.target.value)}
              placeholder="Ex: M. MENSAH Koffi"
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Observations éventuelles :
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Tranche 2 scolarité"
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Boutons d'action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || amount <= 0}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5D3CF2] hover:bg-[#4E2DE3] active:scale-95 text-white font-black text-xs rounded-2xl shadow-xl btn-glow-purple cursor-pointer transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? "Validation en cours..." : "Valider & Générer le Reçu"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
