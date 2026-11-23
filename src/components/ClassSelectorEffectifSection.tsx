"use client";

import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Users, 
  Plus, 
  CheckCircle2, 
  Save, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  X, 
  Edit3, 
  Zap, 
  GraduationCap, 
  Check, 
  SlidersHorizontal 
} from "lucide-react";
import { formatXOF } from "@/lib/formatters";
import { apiFetch } from "@/lib/api-client";

interface ClassSelectorEffectifSectionProps {
  canEdit?: boolean;
}

export function ClassSelectorEffectifSection({ canEdit = true }: ClassSelectorEffectifSectionProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Édition rapide d'effectif par classe (id -> capacity)
  const [editingCapacity, setEditingCapacity] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Modale Assistant Rapide (ex: 6A, 6B, 6C)
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchLevelName, setBatchLevelName] = useState("6ème");
  const [batchCategory, setBatchCategory] = useState<"MATERNELLE" | "PRIMAIRE" | "COLLEGE" | "LYCEE">("COLLEGE");
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(["A", "B", "C"]);
  const [batchCapacity, setBatchCapacity] = useState<number>(45);
  const [batchTuition, setBatchTuition] = useState<number>(105000);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Modale Classe Unique
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleName, setSingleName] = useState("");
  const [singleLevel, setSingleLevel] = useState<"MATERNELLE" | "PRIMAIRE" | "COLLEGE" | "LYCEE">("COLLEGE");
  const [singleCapacity, setSingleCapacity] = useState(45);
  const [singleTuition, setSingleTuition] = useState(100000);
  const [singleLoading, setSingleLoading] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/classes");
      if (res.ok) {
        const json = await res.json();
        const clsList = json.classes || [];
        setClasses(clsList);
        // Initialiser l'état d'édition
        const initialCaps: Record<string, number> = {};
        clsList.forEach((c: any) => {
          initialCaps[c.id] = c.capacity || 40;
        });
        setEditingCapacity(initialCaps);
      }
    } catch (err) {
      console.error("Erreur chargement classes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // Sauvegarde rapide de l'effectif d'une classe
  const handleSaveCapacity = async (classId: string) => {
    const newCap = editingCapacity[classId];
    if (!newCap || newCap < 1) return;

    try {
      setSavingId(classId);
      const res = await apiFetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: classId, capacity: newCap })
      });

      if (res.ok) {
        setSavedSuccessId(classId);
        setClasses(prev => prev.map(c => c.id === classId ? { ...c, capacity: newCap } : c));
        setTimeout(() => setSavedSuccessId(null), 2000);
      }
    } catch (e) {
      alert("Erreur lors de la mise à jour de l'effectif.");
    } finally {
      setSavingId(null);
    }
  };

  // Création par lot (ex: 6ème A, 6ème B, 6ème C)
  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDivisions.length === 0) {
      setBatchError("Veuillez sélectionner au moins une division (ex: A, B ou C).");
      return;
    }
    setBatchLoading(true);
    setBatchError(null);

    try {
      const res = await apiFetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "BATCH",
          levelName: batchLevelName,
          levelCategory: batchCategory,
          divisions: selectedDivisions,
          capacityPerClass: batchCapacity,
          tuition: batchTuition
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur création par lot");
      }

      await loadClasses();
      setShowBatchModal(false);
    } catch (err: any) {
      setBatchError(err.message || "Erreur de génération des classes");
    } finally {
      setBatchLoading(false);
    }
  };

  // Création d'une classe unique
  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName) return;
    setSingleLoading(true);

    try {
      const res = await apiFetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: singleName,
          level: singleLevel,
          capacity: singleCapacity,
          monthlyTuition: singleTuition
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur création classe");
      }

      await loadClasses();
      setShowSingleModal(false);
      setSingleName("");
    } catch (err: any) {
      alert(err.message || "Erreur création");
    } finally {
      setSingleLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string, name: string) => {
    if (!confirm(`Confirmez-vous la suppression de la classe « ${name} » ?`)) return;
    try {
      const res = await apiFetch(`/api/classes?id=${classId}`, { method: "DELETE" });
      if (res.ok) {
        setClasses(prev => prev.filter(c => c.id !== classId));
      }
    } catch (e) {
      alert("Erreur lors de la suppression de la classe.");
    }
  };

  // Filtrage selon onglet
  const filteredClasses = classes.filter(c => {
    if (activeTab === "ALL") return true;
    return c.level === activeTab;
  });

  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const globalOccupancy = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* En-tête de la section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-[#5D3CF2] rounded-xl">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-[#14213D] tracking-tight">
              Sélection des Classes & Fixation des Effectifs
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configurez vos différentes classes (ex : <strong>6ème A, 6ème B, 6ème C</strong>) et indiquez l'effectif maximum prévu pour chacune.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Assistant Rapide Divisions (6A, 6B, 6C) */}
            <button
              onClick={() => {
                setBatchError(null);
                setShowBatchModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#5D3CF2] font-black text-xs rounded-2xl border border-indigo-200 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>⚡ Générateur 6A, 6B, 6C...</span>
            </button>

            {/* Ajouter une Classe Unique */}
            <button
              onClick={() => setShowSingleModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-black text-xs rounded-2xl shadow-md btn-glow-purple transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>➕ Nouvelle Classe</span>
            </button>
          </div>
        )}
      </div>

      {/* Résumé Global des Effectifs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nombre de Classes</span>
            <span className="text-base font-black text-slate-900">{classes.length} Classes ouvertes</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Capacité Totale Établissement</span>
            <span className="text-base font-black text-slate-900">{totalCapacity} Places prévues</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Inscrits Actuels / Remplissage</span>
            <span className="text-base font-black text-slate-900">{totalStudents} Élèves ({globalOccupancy}%)</span>
          </div>
        </div>
      </div>

      {/* Onglets de filtrage par Cycle */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "ALL" ? "bg-[#14213D] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Toutes les Classes ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab("COLLEGE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "COLLEGE" ? "bg-[#5D3CF2] text-white shadow-sm" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          }`}
        >
          Collège (6ème, 5ème, 4ème, 3ème)
        </button>
        <button
          onClick={() => setActiveTab("PRIMAIRE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "PRIMAIRE" ? "bg-emerald-600 text-white shadow-sm" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          Primaire (CP, CE, CM)
        </button>
        <button
          onClick={() => setActiveTab("LYCEE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "LYCEE" ? "bg-amber-600 text-white shadow-sm" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          Lycée (2nde, 1ère, Tle)
        </button>
        <button
          onClick={() => setActiveTab("MATERNELLE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "MATERNELLE" ? "bg-pink-600 text-white shadow-sm" : "bg-pink-50 text-pink-700 hover:bg-pink-100"
          }`}
        >
          Maternelle
        </button>
      </div>

      {/* Grille / Liste des Classes avec Option d'Effectif devant chaque classe */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-semibold">
          Chargement des classes et effectifs...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs font-bold text-slate-600">Aucune classe trouvée pour ce niveau.</p>
          <p className="text-[11px] text-slate-400 mt-1">Utilisez l'assistant rapide pour générer vos classes en 1 clic.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map(cls => {
            const currentCap = editingCapacity[cls.id] !== undefined ? editingCapacity[cls.id] : cls.capacity;
            const studentCount = cls.studentCount || 0;
            const occupancyRate = currentCap > 0 ? Math.min(100, Math.round((studentCount / currentCap) * 100)) : 0;
            const isFull = studentCount >= currentCap;

            return (
              <div
                key={cls.id}
                className="bg-white border-2 border-slate-200 hover:border-indigo-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Titre de la Classe & Cycle */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {cls.level}
                      </span>
                      <h3 className="font-black text-lg text-slate-900 mt-1">
                        {cls.name}
                      </h3>
                    </div>

                    <div className="text-right">
                      {isFull ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          Complet
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {currentCap - studentCount} place(s) dispo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* OPTION D'EFFECTIF INTERACTIVE DEVANT CHAQUE CLASSE */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#5D3CF2]" />
                        <span>Effectif / Capacité prévue :</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">élèves max</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Contrôleur d'Effectif (- / +) */}
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, (editingCapacity[cls.id] || cls.capacity) - 1);
                          setEditingCapacity({ ...editingCapacity, [cls.id]: val });
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-black text-sm flex items-center justify-center transition-colors"
                        title="Diminuer l'effectif"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min={1}
                        max={150}
                        value={currentCap}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setEditingCapacity({ ...editingCapacity, [cls.id]: val });
                        }}
                        className="w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-black text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const val = (editingCapacity[cls.id] || cls.capacity) + 1;
                          setEditingCapacity({ ...editingCapacity, [cls.id]: val });
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-black text-sm flex items-center justify-center transition-colors"
                        title="Augmenter l'effectif"
                      >
                        +
                      </button>

                      {/* Bouton de sauvegarde de l'effectif */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleSaveCapacity(cls.id)}
                          disabled={savingId === cls.id}
                          className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            savedSuccessId === cls.id
                              ? "bg-emerald-600 text-white"
                              : "bg-[#14213D] hover:bg-[#5D3CF2] text-white active:scale-95"
                          }`}
                        >
                          {savedSuccessId === cls.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Enregistré</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingId === cls.id ? "..." : "Fixer"}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Jauge de Remplissage de la Classe */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Élèves inscrits : {studentCount}</span>
                      <span>{occupancyRate}% remplie</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          occupancyRate >= 100 ? "bg-red-500" : occupancyRate >= 80 ? "bg-amber-500" : "bg-[#5D3CF2]"
                        }`}
                        style={{ width: `${occupancyRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Pied de Carte : Tarif et Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Scolarité : <strong className="text-slate-900">{formatXOF(cls.monthlyTuition)}</strong>
                  </span>

                  {canEdit && studentCount === 0 && (
                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Supprimer la classe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE ASSISTANT RAPIDE : GÉNÉRATION DIVISIONS (6A, 6B, 6C...)             */}
      {/* ========================================================================= */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-50 text-[#5D3CF2] rounded-xl">
                  <Zap className="w-5 h-5 text-amber-500" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Assistant de Génération de Classes (Divisions)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Créez rapidement vos sections (ex: 6ème A, 6ème B, 6ème C) avec leurs effectifs
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {batchError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{batchError}</span>
              </div>
            )}

            <form onSubmit={handleBatchCreate} className="mt-4 space-y-4">
              {/* Choix du Niveau de Base */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Niveau / Classe de Base * :
                  </label>
                  <select
                    value={batchLevelName}
                    onChange={e => {
                      const val = e.target.value;
                      setBatchLevelName(val);
                      if (val.includes("6") || val.includes("5") || val.includes("4") || val.includes("3")) {
                        setBatchCategory("COLLEGE");
                        setBatchTuition(105000);
                      } else if (val.includes("Seconde") || val.includes("Première") || val.includes("Terminale")) {
                        setBatchCategory("LYCEE");
                        setBatchTuition(125000);
                      } else {
                        setBatchCategory("PRIMAIRE");
                        setBatchTuition(85000);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                  >
                    <optgroup label="Collège (Togo)">
                      <option value="6ème">6ème</option>
                      <option value="5ème">5ème</option>
                      <option value="4ème">4ème</option>
                      <option value="3ème">3ème</option>
                    </optgroup>
                    <optgroup label="Lycée">
                      <option value="Seconde">Seconde</option>
                      <option value="Première">Première</option>
                      <option value="Terminale">Terminale</option>
                    </optgroup>
                    <optgroup label="Primaire">
                      <option value="CP1">CP1</option>
                      <option value="CP2">CP2</option>
                      <option value="CE1">CE1</option>
                      <option value="CE2">CE2</option>
                      <option value="CM1">CM1</option>
                      <option value="CM2">CM2</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cycle d'Enseignement :
                  </label>
                  <select
                    value={batchCategory}
                    onChange={e => setBatchCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                  >
                    <option value="COLLEGE">Collège</option>
                    <option value="PRIMAIRE">Primaire</option>
                    <option value="LYCEE">Lycée</option>
                    <option value="MATERNELLE">Maternelle</option>
                  </select>
                </div>
              </div>

              {/* Sélection des Divisions (A, B, C, D...) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Divisions à créer (Cochez pour générer) :
                </label>
                <div className="flex flex-wrap gap-2">
                  {["A", "B", "C", "D", "E", "F"].map(div => {
                    const isSelected = selectedDivisions.includes(div);
                    return (
                      <button
                        key={div}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDivisions(selectedDivisions.filter(d => d !== div));
                          } else {
                            setSelectedDivisions([...selectedDivisions, div].sort());
                          }
                        }}
                        className={`w-12 h-10 rounded-xl font-black text-xs transition-all border ${
                          isSelected
                            ? "bg-[#5D3CF2] text-white border-[#5D3CF2] shadow-md shadow-indigo-500/25 scale-105"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {div}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Aperçu des classes qui seront créées :{" "}
                  <strong className="text-[#5D3CF2]">
                    {selectedDivisions.map(d => `${batchLevelName} ${d}`).join(", ") || "Aucune division cochée"}
                  </strong>
                </p>
              </div>

              {/* Effectif et Tarif par classe */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#5D3CF2]" />
                    <span>Effectif par classe :</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={batchCapacity}
                    onChange={e => setBatchCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                  <span className="text-[9px] text-slate-400">Ex: 45 élèves par division</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tarif écolage (FCFA) :
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={batchTuition}
                    onChange={e => setBatchTuition(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                  <span className="text-[9px] text-slate-400">Scolarité annuelle</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={batchLoading || selectedDivisions.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-black text-xs rounded-2xl shadow-md btn-glow-purple cursor-pointer transition-all disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>
                    {batchLoading ? "Génération..." : `Créer les ${selectedDivisions.length} classes en 1 clic`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE CLASSE UNIQUE                                                      */}
      {/* ========================================================================= */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                Ajouter une Classe Spécifique
              </h3>
              <button 
                onClick={() => setShowSingleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nom complet de la classe * :
                </label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={e => setSingleName(e.target.value)}
                  placeholder="Ex: 6ème A, CM2 B, 3ème B..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#5D3CF2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cycle / Niveau :
                  </label>
                  <select
                    value={singleLevel}
                    onChange={e => setSingleLevel(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                  >
                    <option value="COLLEGE">Collège</option>
                    <option value="PRIMAIRE">Primaire</option>
                    <option value="LYCEE">Lycée</option>
                    <option value="MATERNELLE">Maternelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Effectif Max (Places) :
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={150}
                    required
                    value={singleCapacity}
                    onChange={e => setSingleCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tarif Annuel Scolarité (FCFA) :
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={singleTuition}
                  onChange={e => setSingleTuition(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#5D3CF2]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={singleLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5D3CF2] hover:bg-[#4C2CE0] text-white font-black text-xs rounded-2xl shadow-md btn-glow-purple cursor-pointer transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{singleLoading ? "Création..." : "Ajouter la Classe"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
