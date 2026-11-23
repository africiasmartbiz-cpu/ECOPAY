"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "@/lib/api-client";

interface ExportExcelButtonProps {
  type: "students" | "payments" | "debts";
  label?: string;
  className?: string;
}

export function ExportExcelButton({ type, label = "Exporter Excel (.xlsx)", className = "" }: ExportExcelButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/reports/export?type=${type}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erreur lors de la récupération des données.");
      }

      const { data, filename } = await res.json();

      if (!data || data.length === 0) {
        alert("Aucune donnée enregistrée à exporter pour cet établissement.");
        return;
      }

      // 1. Création de la feuille de calcul
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Ajustement automatique de la largeur des colonnes
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 16)
      }));
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Export ECO & FRAIS");

      // 2. Génération robuste du fichier binaire via Blob (compatible 100% navigateurs)
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" 
      });

      const fileNameToUse = `${filename || `ecofrais_${type}_${Date.now()}`}.xlsx`;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileNameToUse);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

    } catch (err: any) {
      console.error("Erreur Export Excel:", err);
      alert(err.message || "Échec du téléchargement du fichier Excel. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black rounded-2xl shadow-md btn-glow-green cursor-pointer transition-all disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      <span>{label}</span>
    </button>
  );
}
