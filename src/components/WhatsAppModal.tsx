"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, X, AlertCircle, CheckCircle2, Phone, Sparkles, Smartphone, Building2, CreditCard } from "lucide-react";
import { WHATSAPP_TEMPLATES, TemplateType, compileWhatsAppMessage, WhatsAppContext } from "@/lib/whatsapp";
import { normalizeTogoPhone, formatXOF } from "@/lib/formatters";
import { apiFetch } from "@/lib/api-client";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    studentName: string;
    className: string;
    parentName: string;
    parentPhone: string;
    totalDue: number;
    totalPaid: number;
    balanceRemaining: number;
    schoolName?: string;
    dueDate?: string;
  } | null;
}

export function WhatsAppModal({ isOpen, onClose, student }: WhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("REMINDER");
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Configuration Compte Marchand de l'établissement
  const [includeMerchant, setIncludeMerchant] = useState(true);
  const [tmoneyNumber, setTmoneyNumber] = useState("+228 90 12 34 56");
  const [floozNumber, setFloozNumber] = useState("+228 98 76 54 32");
  const [merchantName, setMerchantName] = useState(student?.schoolName || "Établissement Scolaire");

  // Mise à jour du nom de l'école quand l'élève change
  useEffect(() => {
    if (student?.schoolName) {
      setMerchantName(student.schoolName);
    }
  }, [student]);

  // Mise à jour du texte à la sélection de l'élève, template ou compte marchand
  useEffect(() => {
    if (student) {
      const template = WHATSAPP_TEMPLATES[selectedTemplate];
      const ctx: WhatsAppContext = {
        studentName: student.studentName,
        className: student.className,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        totalDue: student.totalDue,
        totalPaid: student.totalPaid,
        balanceRemaining: student.balanceRemaining,
        dueDate: student.dueDate || "15/12/2024",
        schoolName: student.schoolName || "Établissement Scolaire",
        merchantInfo: {
          enabled: includeMerchant,
          tmoney: tmoneyNumber,
          flooz: floozNumber,
          accountName: merchantName
        }
      };
      setCustomText(compileWhatsAppMessage(template.defaultText, ctx));

      const { isValid } = normalizeTogoPhone(student.parentPhone);
      if (!isValid) {
        setWarning("Format de numéro WhatsApp togolais invalide (ex attendu : 90 12 34 56 ou +228 90 12 34 56)");
      } else {
        setWarning(null);
      }
    }
  }, [student, selectedTemplate, includeMerchant, tmoneyNumber, floozNumber, merchantName]);

  if (!isOpen || !student) return null;

  const { normalized, cleanDigits } = normalizeTogoPhone(student.parentPhone);

  const handleOpenWhatsApp = async () => {
    try {
      setLoading(true);
      // Appel API pour tracer la préparation du message dans les journaux d'audit
      const res = await apiFetch("/api/whatsapp/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          templateCode: selectedTemplate,
          customMessage: customText
        })
      });

      const data = await res.json();
      if (data.url) {
        // Ouverture de WhatsApp Web ou App dans une nouvelle fenêtre
        window.open(data.url, "_blank", "noopener,noreferrer");
        onClose();
      } else {
        alert(data.error || "Impossible de générer le lien WhatsApp.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la préparation de WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête vert WhatsApp */}
        <div className="bg-[#128C7E] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Notification WhatsApp Parent</h3>
              <p className="text-xs text-white/80">
                Élève : <span className="font-semibold">{student.studentName}</span> ({student.className})
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

        {/* Corps */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Fiche destinataire */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs text-slate-500">Destinataire légal :</span>
              <p className="font-semibold text-slate-800 text-sm">{student.parentName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-sm font-bold text-slate-700">
                {normalized || student.parentPhone || "Numéro manquant"}
              </span>
            </div>
          </div>

          {warning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          )}

          {/* Choix du modèle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Modèle de message :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(WHATSAPP_TEMPLATES) as TemplateType[]).map(key => {
                const tpl = WHATSAPP_TEMPLATES[key];
                const isSelected = selectedTemplate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplate(key)}
                    className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-[#128C7E] bg-emerald-50 text-emerald-900 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                    }`}
                  >
                    <p className="font-bold">{tpl.title.split(". ")[1] || tpl.title}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tpl.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Compte Marchand de l'Établissement (TMoney / Flooz) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeMerchant}
                  onChange={e => setIncludeMerchant(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  Inclure les coordonnées du compte marchand de l'établissement
                </span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Togo Mobile Money
              </span>
            </div>

            {includeMerchant && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Compte TMoney (Togocom) :
                  </label>
                  <input
                    type="text"
                    value={tmoneyNumber}
                    onChange={e => setTmoneyNumber(e.target.value)}
                    placeholder="Ex: +228 90 12 34 56"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Compte Flooz (Moov Togo) :
                  </label>
                  <input
                    type="text"
                    value={floozNumber}
                    onChange={e => setFloozNumber(e.target.value)}
                    placeholder="Ex: +228 98 76 54 32"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Titulaire du compte :
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={e => setMerchantName(e.target.value)}
                    placeholder="Ex: Caisse Scolaire"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Zone de texte éditable */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Message prérempli (personnalisable avant envoi) :
              </label>
              <span className="text-[11px] text-slate-400">Variables substituées automatiquement</span>
            </div>
            <textarea
              rows={7}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none leading-relaxed text-slate-800"
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800 leading-relaxed">
              <strong>Sécurité & Contrôle :</strong> En cliquant sur le bouton ci-dessous, WhatsApp ou WhatsApp Web s'ouvrira avec le numéro et le texte prérempli. Vous gardez la main pour relire avant de cliquer sur le bouton Envoyer.
            </p>
          </div>
        </div>

        {/* Pied de modal avec bouton d'action */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={loading || !cleanDigits}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black text-white bg-[#25D366] hover:bg-[#1EBE5D] btn-glow-green cursor-pointer active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "Préparation..." : `Ouvrir WhatsApp (${normalized || "Numéro"})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
