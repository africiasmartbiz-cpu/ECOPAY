"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Printer, Download, ArrowLeft, Building2, CheckCircle2, ShieldCheck, QrCode } from "lucide-react";
import { formatXOF, formatDateTime } from "@/lib/formatters";
import { apiFetch } from "@/lib/api-client";

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await apiFetch(`/api/receipts/${params.id}`);
        if (!res.ok) {
          setError("Reçu de paiement introuvable ou accès non autorisé.");
          return;
        }
        const json = await res.json();
        setPayment(json.payment);
      } catch (err) {
        setError("Erreur technique lors du chargement du reçu.");
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [params.id]);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ecofrais_user") || (localStorage.getItem("ecofrais_user") || localStorage.getItem("schoolpay_user"));
        if (stored) {
          const u = JSON.parse(stored);
          if (u.role === "DIRECTOR") { router.push("/director"); return; }
          if (u.role === "ACCOUNTANT") { router.push("/accounting"); return; }
          if (u.role === "ESTABLISHMENT_ADMIN") { router.push("/admin"); return; }
          if (u.role === "PARENT") { router.push("/parent"); return; }
          if (u.role === "SUPER_ADMIN") { router.push("/superadmin"); return; }
        }
      } catch (e) {}

      if (document.referrer && document.referrer.includes(window.location.host)) {
        router.back();
      } else {
        router.push("/accounting");
      }
    }
  };

  const downloadReceiptPDF = async () => {
    if (!payment) return;
    try {
      setDownloading(true);
      const { jsPDF } = await import("jspdf");
      const est = payment.establishment;
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a5"
      });

      // Background header bar
      doc.setFillColor(20, 33, 61); // #14213D
      doc.rect(0, 0, 210, 28, "F");

      // Title & School Name
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(est?.name?.toUpperCase() || "ÉTABLISSEMENT SCOLAIRE", 14, 12);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${est?.address || ""}, ${est?.city || "Lomé"} - ${est?.country || "Togo"} | Tél : ${est?.phone || ""}`, 14, 19);

      // Receipt Badge
      doc.setFillColor(22, 163, 74); // emerald green
      doc.roundedRect(145, 6, 52, 16, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("REÇU DE PAIEMENT", 150, 12);
      doc.setFontSize(8);
      doc.text(payment.receiptNumber || "", 150, 18);

      // Section Header
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("DÉTAILS DU RÈGLEMENT OFFICIEL", 14, 38);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Date & Heure : ${formatDateTime(payment.paymentDate)}`, 130, 38);

      // Student Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 42, 88, 32, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Élève : ${payment.studentName}`, 18, 49);
      doc.setFont("helvetica", "normal");
      doc.text(`Matricule : ${payment.matricule}`, 18, 56);
      doc.text(`Classe : ${payment.className}`, 18, 63);
      doc.text(`Année scolaire : 2024-2025`, 18, 70);

      // Payer Box
      doc.roundedRect(108, 42, 88, 32, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.text(`Payeur : ${payment.payerName || "Parent d'élève"}`, 112, 49);
      doc.setFont("helvetica", "normal");
      doc.text(`Téléphone : ${payment.payerPhone || "N/A"}`, 112, 56);
      doc.text(`Mode : ${payment.paymentMethod} (Réf : ${payment.referenceNumber || "GUICHET"})`, 112, 63);
      doc.text(`Caissier : ${payment.receivedByName || "Caisse Centrale"}`, 112, 70);

      // Financial Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 80, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Description des frais", 18, 85);
      doc.text("Total scolarité", 90, 85);
      doc.text("Montant Versé", 130, 85);
      doc.text("Solde Restant", 165, 85);

      // Financial Table Content
      doc.setFont("helvetica", "normal");
      doc.text("Frais de scolarité & écolage 2024-2025", 18, 95);
      doc.text(`${formatXOF(payment.totalAmount)}`, 90, 95);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text(`${formatXOF(payment.amount)}`, 130, 95);

      if (payment.remainingBalance === 0) {
        doc.setTextColor(22, 163, 74);
      } else {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(`${formatXOF(payment.remainingBalance)}`, 165, 95);

      // Total Banner
      doc.setFillColor(20, 33, 61);
      doc.roundedRect(14, 104, 182, 14, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("TOTAL NET ENCAISSÉ :", 20, 113);
      doc.setFontSize(12);
      doc.text(`${formatXOF(payment.amount)}`, 150, 113);

      // Footer with stamp & signature
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Sécurité ECO & FRAIS : HASH-${payment.id?.substring(0, 8) || "VALID"} | Application Togo (XOF)`, 14, 128);
      doc.text("Document officiel certifié conforme par la direction de l'établissement.", 14, 133);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Cachet et signature de la Caisse :", 125, 126);
      doc.line(125, 136, 192, 136);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(payment.receivedByName || "Le Caissier", 140, 140);

      // Save PDF file
      doc.save(`Recu_${payment.receiptNumber || payment.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du fichier PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-xs font-semibold text-slate-500">Génération du reçu officiel...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <p className="text-sm font-bold text-red-600 mb-4">{error || "Reçu introuvable."}</p>
        <Link href="/" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const est = payment.establishment;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
      {/* Barre d'action supérieure (masquée à l'impression) */}
      <div className="no-print max-w-2xl w-full flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-white hover:bg-slate-800 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Retour au Tableau de Bord</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Bouton Téléchargement Direct PDF */}
          <button
            onClick={downloadReceiptPDF}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg btn-glow-green cursor-pointer active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Génération PDF..." : "Télécharger le Reçu (.PDF)"}</span>
          </button>

          {/* Bouton Impression Standard */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl shadow-lg btn-glow-blue cursor-pointer active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* REÇU OFFICIEL (Format Standard A5 Paysage / Demi-Page Écoles Privées Togo) */}
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10 relative overflow-hidden text-slate-900 print:shadow-none print:border-none print:p-6 print:m-0">
        {/* Filigrane "PAYÉ / VALIDÉ" */}
        <div className="absolute right-12 top-28 pointer-events-none select-none opacity-10 rotate-[-25deg]">
          <span className="text-8xl font-black text-emerald-800 border-8 border-emerald-800 px-6 py-2 rounded-3xl">
            PAYÉ
          </span>
        </div>

        {/* En-tête Établissement Scolaire */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#14213D] text-white flex items-center justify-center font-black text-xl shadow-md">
              {est?.code?.substring(0, 3) || "SCH"}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#14213D] uppercase">
                {est?.name || "Établissement Scolaire"}
              </h2>
              <p className="text-[11px] text-slate-600 font-medium">{est?.address}, {est?.city} — {est?.country}</p>
              <p className="text-[10px] text-slate-500">Tél : {est?.phone} • Email : {est?.email}</p>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-lg">
              REÇU DE PAIEMENT
            </span>
            <p className="font-mono text-sm font-black text-blue-700 mt-1">{payment.receiptNumber}</p>
            <p className="text-[11px] text-slate-500">{formatDateTime(payment.paymentDate)}</p>
          </div>
        </div>

        {/* Détails de l'élève */}
        <div className="grid grid-cols-2 gap-4 py-6 border-b border-slate-200 text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Élève :</p>
            <p className="text-base font-black text-slate-900 mt-0.5">{payment.studentName}</p>
            <p className="text-slate-600 font-mono mt-0.5">Matricule : <strong>{payment.matricule}</strong></p>
            <p className="text-slate-600 mt-0.5">Classe : <strong>{payment.className}</strong></p>
          </div>

          <div className="text-right sm:text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payeur / Déposant :</p>
            <p className="font-bold text-slate-900 mt-0.5">{payment.payerName || "Parent d'élève"}</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Tél : {payment.payerPhone || "N/A"}</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Opérateur Caisse : {payment.receivedByName}</p>
          </div>
        </div>

        {/* Tableau du versement */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="pb-2">Description</th>
                <th className="pb-2">Moyen de paiement</th>
                <th className="pb-2">Réf. Transaction</th>
                <th className="pb-2 text-right">Montant Réglé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              <tr>
                <td className="py-3">Frais d'écolage & scolarité 2024-2025</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">
                    {payment.paymentMethod}
                  </span>
                </td>
                <td className="py-3 font-mono text-[11px] text-slate-500">
                  {payment.referenceNumber || "GUICHET"}
                </td>
                <td className="py-3 text-right text-base font-black text-emerald-600">
                  {formatXOF(payment.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Synthèse comptable & Reste à payer */}
        <div className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>Total facturation scolaire :</span>
              <strong className="text-slate-900">{formatXOF(payment.totalAmount)}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>Solde restant après ce versement :</span>
              <strong className={payment.remainingBalance === 0 ? "text-emerald-600" : "text-red-600 font-black"}>
                {formatXOF(payment.remainingBalance)}
              </strong>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Encaissé :</span>
            <p className="text-2xl font-black text-slate-900">{formatXOF(payment.amount)}</p>
          </div>
        </div>

        {/* Cachet, Signature et Authentification */}
        <div className="pt-6 border-t-2 border-slate-900 flex items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400">
              <QrCode className="w-10 h-10 text-slate-700" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-700 uppercase">Authenticité Certifiée</p>
              <p className="text-[9px] text-slate-400 font-mono">ECO-FRAIS-SECURE-HASH-{payment.id.substring(0, 8)}</p>
              <p className="text-[9px] text-slate-400">Vérifiable au guichet de l'école</p>
            </div>
          </div>

          <div className="text-center w-48">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-8">
              Cachet & Signature de la Caisse
            </p>
            <p className="text-xs font-bold text-slate-800 border-t border-slate-300 pt-1">
              {payment.receivedByName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
