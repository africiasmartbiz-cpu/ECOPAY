"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clipboard, 
  Save, 
  Sparkles, 
  Layers, 
  Users, 
  FileText,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  Filter,
  Check,
  Calendar
} from "lucide-react";
import * as XLSX from "xlsx";
import { formatXOF } from "@/lib/formatters";
import { apiFetch } from "@/lib/api-client";

export interface StudentRow {
  id: string;
  className: string;
  academicYear: string;
  lastName: string;
  firstName: string;
  gender: "M" | "F";
  birthDate: string;
  parentName: string;
  parentPhone: string;
  tuitionAmount: number;
}

const DEFAULT_EMPTY_ROW = (index: number, defaultYear: string = "2024-2025", defaultClass: string = "6ème A"): StudentRow => ({
  id: `row-${Date.now()}-${index}`,
  className: defaultClass,
  academicYear: defaultYear,
  lastName: "",
  firstName: "",
  gender: "M",
  birthDate: "2013-05-10",
  parentName: "",
  parentPhone: "+228 90 ",
  tuitionAmount: 105000
});

export function ExcelStudentImportSection({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [globalYear, setGlobalYear] = useState("2024-2025");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterClass, setFilterClass] = useState<string>("ALL");

  const [rows, setRows] = useState<StudentRow[]>([
    {
      id: "row-1",
      className: "6ème A",
      academicYear: "2024-2025",
      lastName: "KOUDOSSOU",
      firstName: "Mawuli David",
      gender: "M",
      birthDate: "2012-04-15",
      parentName: "M. KOUDOSSOU Mawuena",
      parentPhone: "+228 90 11 22 33",
      tuitionAmount: 105000
    },
    {
      id: "row-2",
      className: "6ème A",
      academicYear: "2024-2025",
      lastName: "AMEGASSI",
      firstName: "Afiwa Gracia",
      gender: "F",
      birthDate: "2012-08-20",
      parentName: "Mme AMEGASSI Akofa",
      parentPhone: "+228 91 33 44 55",
      tuitionAmount: 105000
    },
    {
      id: "row-3",
      className: "6ème B",
      academicYear: "2024-2025",
      lastName: "DOSSEH",
      firstName: "Koffi Samuel",
      gender: "M",
      birthDate: "2012-11-05",
      parentName: "M. DOSSEH Jean-Paul",
      parentPhone: "+228 92 55 66 77",
      tuitionAmount: 105000
    }
  ]);

  const [classesList, setClassesList] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modale Copier-Coller depuis Excel
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await apiFetch("/api/classes");
        if (res.ok) {
          const json = await res.json();
          if (json.classes && json.classes.length > 0) {
            setClassesList(json.classes.map((c: any) => c.name));
          }
        }
      } catch (e) {}
    };
    fetchClasses();
  }, []);

  // 1. Mise à jour d'une cellule
  const updateCell = (id: string, field: keyof StudentRow, value: any) => {
    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // 2. Appliquer l'année scolaire à toutes les lignes en un clic
  const applyYearToAll = () => {
    setRows(prev => prev.map(r => ({ ...r, academicYear: globalYear })));
    setSuccessMsg(`Année scolaire « ${globalYear} » appliquée à toutes les lignes (${rows.length}) !`);
  };

  // 3. Ajouter des lignes vides
  const addRows = (count: number = 5) => {
    const defaultCls = classesList[0] || "6ème A";
    const newItems = Array.from({ length: count }).map((_, i) => 
      DEFAULT_EMPTY_ROW(rows.length + i, globalYear, defaultCls)
    );
    setRows(prev => [...prev, ...newItems]);
  };

  // 4. Supprimer une ligne
  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // 5. Télécharger le Modèle Excel Vierge (.xlsx)
  const downloadTemplate = () => {
    const templateData = [
      {
        "Classe": "6ème A",
        "Annee_Scolaire": "2024-2025",
        "Nom": "MENSAH",
        "Prénoms": "Koffi Emmanuel",
        "Sexe": "M",
        "Date_Naissance": "2012-05-14",
        "Nom_Parent": "M. MENSAH Paul",
        "Telephone_Parent": "+228 90 12 34 56",
        "Scolarite_Annuelle": 105000
      },
      {
        "Classe": "6ème B",
        "Annee_Scolaire": "2024-2025",
        "Nom": "LAWSON",
        "Prénoms": "Ablavi Jeanne",
        "Sexe": "F",
        "Date_Naissance": "2012-09-22",
        "Nom_Parent": "Mme LAWSON Brigitte",
        "Telephone_Parent": "+228 91 23 45 67",
        "Scolarite_Annuelle": 105000
      },
      {
        "Classe": "3ème A",
        "Annee_Scolaire": "2024-2025",
        "Nom": "AGBEMEBIA",
        "Prénoms": "Messan Eric",
        "Sexe": "M",
        "Date_Naissance": "2009-03-10",
        "Nom_Parent": "M. AGBEMEBIA Messan",
        "Telephone_Parent": "+228 92 34 56 78",
        "Scolarite_Annuelle": 115000
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet["!cols"] = [
      { wch: 12 }, // Classe
      { wch: 16 }, // Annee_Scolaire
      { wch: 16 }, // Nom
      { wch: 20 }, // Prénoms
      { wch: 8 },  // Sexe
      { wch: 15 }, // Date_Naissance
      { wch: 24 }, // Nom_Parent
      { wch: 20 }, // Telephone_Parent
      { wch: 18 }  // Scolarite_Annuelle
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eleves");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" 
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modele_import_eleves_ecofrais_${globalYear.replace("/", "-")}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 6. Exporter la grille actuelle vers Excel
  const exportCurrentGrid = () => {
    if (rows.length === 0) {
      setErrorMsg("La grille est vide, aucun élève à exporter.");
      return;
    }

    const exportData = rows.map(r => ({
      "Classe": r.className,
      "Annee_Scolaire": r.academicYear,
      "Nom": r.lastName,
      "Prénoms": r.firstName,
      "Sexe": r.gender,
      "Date_Naissance": r.birthDate,
      "Nom_Parent": r.parentName,
      "Telephone_Parent": r.parentPhone,
      "Scolarite_Annuelle": r.tuitionAmount
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Eleves_Grille");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" 
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grille_eleves_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 7. Téléverser un fichier Excel (.xlsx / .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg("Le fichier Excel sélectionné est vide.");
          return;
        }

        // Conversion intelligente des colonnes selon divers formats possibles
        const parsedRows: StudentRow[] = rawJson.map((row, idx) => {
          const className = row["Classe"] || row["classe"] || row["CLASSE"] || row["Class"] || "6ème A";
          const academicYear = row["Annee_Scolaire"] || row["Annee"] || row["Année"] || row["annee"] || row["Year"] || globalYear;
          const lastName = row["Nom"] || row["nom"] || row["NOM"] || row["Nom de famille"] || "";
          const firstName = row["Prénoms"] || row["Prénom"] || row["prenom"] || row["PRENOM"] || "";
          const rawGender = String(row["Sexe"] || row["sexe"] || row["Genre"] || "M").toUpperCase().trim();
          const gender: "M" | "F" = rawGender.startsWith("F") ? "F" : "M";
          const birthDate = row["Date_Naissance"] || row["Date de naissance"] || row["Naissance"] || "2013-05-10";
          const parentName = row["Nom_Parent"] || row["Parent"] || row["Tuteur"] || `Parent de ${lastName}`;
          const parentPhone = row["Telephone_Parent"] || row["Telephone"] || row["Phone"] || "+228 90 00 00 00";
          const tuitionAmount = Number(row["Scolarite_Annuelle"] || row["Scolarite"] || row["Montant"] || 105000);

          return {
            id: `excel-row-${Date.now()}-${idx}`,
            className: String(className).trim(),
            academicYear: String(academicYear).trim() || globalYear,
            lastName: String(lastName).trim().toUpperCase(),
            firstName: String(firstName).trim(),
            gender,
            birthDate: String(birthDate).trim(),
            parentName: String(parentName).trim(),
            parentPhone: String(parentPhone).trim(),
            tuitionAmount: isNaN(tuitionAmount) ? 105000 : tuitionAmount
          };
        }).filter(r => r.lastName || r.firstName);

        if (parsedRows.length === 0) {
          setErrorMsg("Aucune ligne d'élève valide détectée dans le fichier.");
          return;
        }

        setRows(parsedRows);
        setSuccessMsg(`🎉 ${parsedRows.length} élève(s) importé(s) depuis votre fichier Excel avec succès ! Vous pouvez vérifier et enregistrer.`);
      } catch (err) {
        console.error("Erreur lecture Excel:", err);
        setErrorMsg("Impossible de lire ce fichier Excel. Vérifiez le format.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 8. Coller du texte brut (TSV ou CSV)
  const parseClipboardText = useCallback((text: string) => {
    if (!text.trim()) return;

    try {
      const lines = text.trim().split(/\r?\n/);
      const newRows: StudentRow[] = [];

      lines.forEach((line, idx) => {
        // Découpage par tabulation (standard Excel Ctrl+C) ou par point-virgule ou virgule
        const parts = line.includes("\t") 
          ? line.split("\t") 
          : line.includes(";") 
          ? line.split(";") 
          : line.split(",");

        if (parts.length >= 2) {
          const firstPart = parts[0]?.trim() || "";
          const secondPart = parts[1]?.trim() || "";

          // Vérifier si la ligne ressemble à un en-tête
          const lowerFirst = firstPart.toLowerCase();
          if (lowerFirst === "classe" || lowerFirst === "nom" || lowerFirst === "annee" || lowerFirst === "année") {
            return; // Ignorer l'en-tête
          }

          let className = "6ème A";
          let academicYear = globalYear;
          let lastName = "";
          let firstName = "";
          let gender: "M" | "F" = "M";
          let parentName = "";
          let parentPhone = "+228 90 12 34 56";

          // Détection intelligente selon le contenu de la 1ère colonne
          const isClassFirst = firstPart.match(/^(CP|CE|CM|6|5|4|3|2|1|Term|Sec|Prem)/i);
          const isYearFirst = firstPart.match(/^202[0-9]/);

          if (isYearFirst) {
            academicYear = firstPart;
            className = secondPart || "6ème A";
            lastName = parts[2]?.trim() || "";
            firstName = parts[3]?.trim() || "";
            gender = parts[4]?.toUpperCase().startsWith("F") ? "F" : "M";
            parentName = parts[5]?.trim() || `Parent de ${lastName}`;
            parentPhone = parts[6]?.trim() || "+228 90 00 00 00";
          } else if (isClassFirst) {
            className = firstPart;
            // 2ème colonne : soit année soit nom
            if (secondPart.match(/^202[0-9]/)) {
              academicYear = secondPart;
              lastName = parts[2]?.trim() || "";
              firstName = parts[3]?.trim() || "";
              gender = parts[4]?.toUpperCase().startsWith("F") ? "F" : "M";
              parentName = parts[5]?.trim() || `Parent de ${lastName}`;
              parentPhone = parts[6]?.trim() || "+228 90 00 00 00";
            } else {
              lastName = secondPart;
              firstName = parts[2]?.trim() || "";
              gender = parts[3]?.toUpperCase().startsWith("F") ? "F" : "M";
              parentName = parts[4]?.trim() || `Parent de ${lastName}`;
              parentPhone = parts[5]?.trim() || "+228 90 00 00 00";
            }
          } else {
            lastName = firstPart;
            firstName = secondPart;
            className = parts[2]?.trim() || "6ème A";
            gender = parts[3]?.toUpperCase().startsWith("F") ? "F" : "M";
            parentName = parts[4]?.trim() || `Parent de ${lastName}`;
            parentPhone = parts[5]?.trim() || "+228 90 00 00 00";
          }

          if (lastName || firstName) {
            newRows.push({
              id: `pasted-${Date.now()}-${idx}`,
              className: className || "6ème A",
              academicYear: academicYear || globalYear,
              lastName: lastName.toUpperCase(),
              firstName,
              gender,
              birthDate: "2013-05-10",
              parentName,
              parentPhone,
              tuitionAmount: 105000
            });
          }
        }
      });

      if (newRows.length > 0) {
        setRows(prev => [...prev, ...newRows]);
        setShowPasteModal(false);
        setPastedText("");
        setSuccessMsg(`🎉 ${newRows.length} élève(s) collé(s) depuis votre tableur Excel avec succès !`);
      } else {
        setErrorMsg("Format non reconnu. Assurez-vous de sélectionner des cellules complètes dans Excel et de faire Ctrl+C.");
      }
    } catch (e) {
      setErrorMsg("Erreur lors du traitement du copier-coller.");
    }
  }, [globalYear]);

  // Support du raccourci clavier natif Ctrl+V quand le conteneur a le focus
  const handleNativePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Si l'utilisateur colle dans un input ou textarea normal, ne pas intercepter
    const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
    if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
      return;
    }

    const pastedData = e.clipboardData.getData("text");
    if (pastedData && pastedData.includes("\t")) {
      e.preventDefault();
      parseClipboardText(pastedData);
    }
  };

  // 9. Enregistrement définitif de tous les élèves dans ECO & FRAIS
  const handleSaveAll = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const validRows = rows.filter(r => r.lastName.trim() || r.firstName.trim());
    if (validRows.length === 0) {
      setErrorMsg("Veuillez renseigner au moins un élève avec son nom et son prénom.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: validRows })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de l'enregistrement");
      }

      setSuccessMsg(`🎉 Félicitations : ${json.count} élève(s) ont été enregistrés avec succès dans l'établissement pour l'année ${globalYear} avec leurs matricules et factures !`);
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Statistiques rapides
  const validCount = rows.filter(r => r.lastName.trim()).length;
  const classesBreakdown: Record<string, number> = {};
  rows.forEach(r => {
    if (r.lastName.trim()) {
      classesBreakdown[r.className] = (classesBreakdown[r.className] || 0) + 1;
    }
  });

  const totalTuitionSum = rows.reduce((sum, r) => sum + (r.lastName.trim() ? (Number(r.tuitionAmount) || 0) : 0), 0);

  // Filtrage d'affichage
  const displayedRows = filterClass === "ALL" 
    ? rows 
    : rows.filter(r => r.className === filterClass);

  return (
    <div 
      ref={containerRef}
      onPaste={handleNativePaste}
      tabIndex={0}
      className={`bg-white border border-slate-200 shadow-sm transition-all outline-none ${
        isFullscreen 
          ? "fixed inset-0 z-50 p-6 overflow-y-auto flex flex-col bg-white" 
          : "rounded-3xl p-6 space-y-6"
      }`}
    >
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#14213D] tracking-tight">
                  Grande Page Excel d'Inscription & Importation Massive
                </h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                  Excel & Sheets Compatible
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Remplissez la grille comme dans Microsoft Excel, téléversez votre fichier <strong>.xlsx</strong> ou faites <strong>Ctrl+C / Ctrl+V</strong> depuis un tableur externe.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'Action Import / Modèle / Plein Écran */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bascule Plein Écran */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
            title={isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-slate-600" />
                <span>Réduire</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-slate-600" />
                <span>⛶ Plein Écran</span>
              </>
            )}
          </button>

          {/* Télécharger Modèle Vierge */}
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
            title="Télécharger un fichier Excel modèle prêt à l'emploi"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Modèle (.xlsx)</span>
          </button>

          {/* Téléverser Fichier Excel */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md btn-glow-green transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>📂 Importer Fichier Excel</span>
          </button>

          {/* Coller depuis le Presse-papier */}
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#5D3CF2] font-bold text-xs rounded-2xl border border-indigo-200 transition-all cursor-pointer"
          >
            <Clipboard className="w-4 h-4" />
            <span>📋 Coller d'Excel</span>
          </button>

          {/* Exporter la grille */}
          <button
            type="button"
            onClick={exportCurrentGrid}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
            title="Exporter le contenu actuel de la grille en .xlsx"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exporter Grille</span>
          </button>

          {/* Ajouter lignes */}
          <button
            type="button"
            onClick={() => addRows(5)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ 5 Lignes</span>
          </button>
        </div>
      </div>

      {/* Messages d'Alerte ou de Succès */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barre d'Outils et Paramètres Rapides (Année scolaire & Filtres) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
        {/* Année scolaire globale */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Calendar className="w-4 h-4 text-[#5D3CF2]" />
            <span>Année Scolaire de la Promotion :</span>
          </div>
          <input
            type="text"
            value={globalYear}
            onChange={e => setGlobalYear(e.target.value)}
            placeholder="Ex: 2024-2025"
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 w-32 text-center outline-none focus:ring-1 focus:ring-[#5D3CF2]"
          />
          <button
            type="button"
            onClick={applyYearToAll}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#5D3CF2] font-bold rounded-xl border border-indigo-200 cursor-pointer transition-all"
            title="Appliquer cette année scolaire à toutes les lignes existantes"
          >
            Appliquer à tous
          </button>
        </div>

        {/* Filtrer par classe */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-slate-600">Filtrer par classe :</span>
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-800 outline-none"
          >
            <option value="ALL">Toutes les classes ({rows.length})</option>
            {Array.from(new Set(rows.map(r => r.className))).map(cls => (
              <option key={cls} value={cls}>
                {cls} ({rows.filter(r => r.className === cls).length})
              </option>
            ))}
          </select>
        </div>

        {/* Indicateurs rapides */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-700">
              Élèves prêts : <strong className="text-emerald-700 font-black text-sm">{validCount}</strong>
            </span>
          </div>

          <span className="text-slate-300">|</span>

          <span className="font-bold text-slate-700">
            Montant Total : <strong className="text-indigo-700 font-black">{formatXOF(totalTuitionSum)}</strong>
          </span>

          <button
            type="button"
            onClick={() => setRows([])}
            className="text-[11px] text-slate-400 hover:text-red-600 underline font-semibold ml-2 cursor-pointer"
          >
            Vider la grille
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRANDE GRILLE / TABLEUR TYPE EXCEL                                        */}
      {/* ========================================================================= */}
      <div className={`border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm ${isFullscreen ? "flex-1 flex flex-col" : ""}`}>
        <div className={`overflow-x-auto ${isFullscreen ? "flex-1 max-h-[calc(100vh-280px)]" : "max-h-[540px]"}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#14213D] text-white font-bold uppercase tracking-wider sticky top-0 z-20">
              <tr>
                <th className="p-3 w-10 text-center text-slate-400 border-r border-slate-800">#</th>
                <th className="p-3 min-w-[110px] border-r border-slate-800">Classe *</th>
                <th className="p-3 min-w-[110px] border-r border-slate-800">Année *</th>
                <th className="p-3 min-w-[150px] border-r border-slate-800">Nom de Famille *</th>
                <th className="p-3 min-w-[150px] border-r border-slate-800">Prénom(s) *</th>
                <th className="p-3 min-w-[65px] text-center border-r border-slate-800">Sexe</th>
                <th className="p-3 min-w-[120px] border-r border-slate-800">Date Naissance</th>
                <th className="p-3 min-w-[170px] border-r border-slate-800">Nom du Parent / Tuteur</th>
                <th className="p-3 min-w-[150px] border-r border-slate-800">Téléphone WhatsApp</th>
                <th className="p-3 min-w-[120px] border-r border-slate-800 text-right">Scolarité (FCFA)</th>
                <th className="p-3 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800 bg-white">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">
                    <p className="font-semibold text-sm">La grille est vide.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Cliquez sur <strong>« + 5 Lignes »</strong>, <strong>« 📂 Importer Fichier Excel »</strong> ou <strong>« 📋 Coller d'Excel »</strong>.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-indigo-50/40 transition-colors group">
                    {/* Numéro de ligne */}
                    <td className="p-2 text-center text-slate-400 font-mono text-[11px] bg-slate-50 border-r border-slate-200">
                      {index + 1}
                    </td>

                    {/* Classe */}
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.className}
                        onChange={e => updateCell(row.id, "className", e.target.value)}
                        placeholder="Ex: 6ème A"
                        list="classes-datalist"
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg font-bold text-slate-900 outline-none"
                      />
                    </td>

                    {/* Année Scolaire */}
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.academicYear}
                        onChange={e => updateCell(row.id, "academicYear", e.target.value)}
                        placeholder="2024-2025"
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg text-slate-700 outline-none text-xs font-mono font-semibold"
                      />
                    </td>

                    {/* Nom */}
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.lastName}
                        onChange={e => updateCell(row.id, "lastName", e.target.value.toUpperCase())}
                        placeholder="NOM"
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg font-bold text-slate-900 outline-none uppercase"
                      />
                    </td>

                    {/* Prénoms */}
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.firstName}
                        onChange={e => updateCell(row.id, "firstName", e.target.value)}
                        placeholder="Prénoms"
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg font-semibold text-slate-800 outline-none"
                      />
                    </td>

                    {/* Sexe */}
                    <td className="p-1.5 border-r border-slate-200 text-center">
                      <select
                        value={row.gender}
                        onChange={e => updateCell(row.id, "gender", e.target.value as "M" | "F")}
                        className="px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg font-black text-xs outline-none cursor-pointer"
                      >
                        <option value="M">M</option>
                        <option value="F">F</option>
                      </select>
                    </td>

                    {/* Date Naissance */}
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="date"
                        value={row.birthDate}
                        onChange={e => updateCell(row.id, "birthDate", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg text-slate-700 outline-none text-xs font-mono"
                      />
                    </td>

                    {/* Parent */}
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.parentName}
                        onChange={e => updateCell(row.id, "parentName", e.target.value)}
                        placeholder="M. ou Mme ..."
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg text-slate-800 outline-none"
                      />
                    </td>

                    {/* Téléphone WhatsApp */}
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="tel"
                        value={row.parentPhone}
                        onChange={e => updateCell(row.id, "parentPhone", e.target.value)}
                        placeholder="+228 90 12 34 56"
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg text-slate-800 outline-none font-mono"
                      />
                    </td>

                    {/* Scolarité FCFA */}
                    <td className="p-1.5 border-r border-slate-200 text-right">
                      <input
                        type="number"
                        step={1000}
                        value={row.tuitionAmount}
                        onChange={e => updateCell(row.id, "tuitionAmount", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#5D3CF2] focus:bg-white rounded-lg text-right font-black text-slate-900 outline-none font-mono"
                      />
                    </td>

                    {/* Action Supprimer */}
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-slate-300 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Datalist pour suggestions des classes */}
      <datalist id="classes-datalist">
        {classesList.map((c, i) => (
          <option key={i} value={c} />
        ))}
        <option value="CP1 A" />
        <option value="CP2 A" />
        <option value="CE1 A" />
        <option value="CE2 A" />
        <option value="CM1 A" />
        <option value="CM2 A" />
        <option value="6ème A" />
        <option value="6ème B" />
        <option value="6ème C" />
        <option value="5ème A" />
        <option value="5ème B" />
        <option value="4ème A" />
        <option value="4ème B" />
        <option value="3ème A" />
        <option value="3ème B" />
        <option value="Seconde A" />
        <option value="Première D" />
        <option value="Terminale C" />
      </datalist>

      {/* Barre de Validation et Enregistrement Final */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          ℹ️ Lors de l'enregistrement, ECO & FRAIS génère automatiquement les <strong>Matricules officiels</strong>, les <strong>Comptes Parents</strong> et les <strong>Factures d'écolage</strong> pour chaque élève.
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving || validCount === 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-black text-sm rounded-2xl shadow-xl btn-glow-purple cursor-pointer active:scale-95 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>
            {saving ? "Enregistrement en cours..." : `Enregistrer tous les élèves (${validCount}) →`}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODALE COPIER-COLLER DEPUIS EXCEL                                         */}
      {/* ========================================================================= */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-[#5D3CF2] rounded-xl">
                  <Clipboard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Coller des données depuis Microsoft Excel ou Google Sheets
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sélectionnez vos lignes dans Excel, faites <strong>Ctrl+C</strong>, puis collez ci-dessous avec <strong>Ctrl+V</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                rows={8}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={"Collez ici vos cellules copiées depuis Excel (séparées par tabulations)...\nExemple :\n6ème A\t2024-2025\tMENSAH\tKoffi\tM\tM. Paul\t+228 90 12 34 56\n6ème B\t2024-2025\tLAWSON\tAblavi\tF\tMme Brigitte\t+228 91 23 45 67"}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
              />

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                💡 <strong>Astuce :</strong> Vous pouvez copier directement des colonnes entières depuis Excel. L'ordre recommandé est : <em>Classe, Année, Nom, Prénoms, Sexe, Parent, Téléphone</em>.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => parseClipboardText(pastedText)}
                  disabled={!pastedText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-black text-xs rounded-2xl shadow-md btn-glow-purple cursor-pointer transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insérer dans la Grille</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
