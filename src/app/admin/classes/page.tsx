"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Layers, Users, Coins, Plus, CheckCircle2 } from "lucide-react";
import { formatXOF } from "@/lib/formatters";
import { SessionUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";
import { ClassSelectorEffectifSection } from "@/components/ClassSelectorEffectifSection";

export default function AdminClassesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
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

        // Récupérer les classes réelles
        let classList: any[] = [];
        try {
          const cRes = await apiFetch("/api/classes");
          if (cRes.ok) {
            const cData = await cRes.json();
            classList = cData.classes || [];
          }
        } catch (e) {}

        // Récupérer les élèves
        const res = await apiFetch("/api/students");
        const json = await res.json();
        const students = json.students || [];

        if (classList.length > 0) {
          const mapped = classList.map(c => {
            const classStudents = students.filter((s: any) => s.classId === c.id);
            return {
              id: c.id,
              name: c.name,
              level: c.level || "SCOLAIRE",
              capacity: c.capacity || 40,
              tuition: c.monthlyTuition || 90000,
              students: classStudents
            };
          });
          setClasses(mapped);
        } else {
          // Regrouper par classe fallback
          const classMap: Record<string, any> = {
            "CP1 A": { id: "class-cp1", name: "CP1 A", level: "PRIMAIRE", capacity: 35, tuition: 85000, students: [] },
            "CE2 B": { id: "class-ce2", name: "CE2 B", level: "PRIMAIRE", capacity: 40, tuition: 90000, students: [] },
            "CM2 A": { id: "class-cm2", name: "CM2 A", level: "PRIMAIRE", capacity: 40, tuition: 95000, students: [] },
            "6ème A": { id: "class-6eme", name: "6ème A", level: "COLLEGE", capacity: 45, tuition: 100000, students: [] },
            "3ème B": { id: "class-3eme", name: "3ème B", level: "COLLEGE", capacity: 45, tuition: 115000, students: [] },
            "Terminale C": { id: "class-tlec", name: "Terminale C", level: "LYCEE", capacity: 35, tuition: 125000, students: [] }
          };

          students.forEach((s: any) => {
            if (classMap[s.className]) {
              classMap[s.className].students.push(s);
            }
          });

          setClasses(Object.values(classMap));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xs font-semibold text-slate-500">Chargement des classes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={currentUser} />

      <div className="flex flex-1">
        <Sidebar role={currentUser.role} />

        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
                Structure des Classes & Niveaux
              </h1>
              <p className="text-xs text-slate-500">
                Année Scolaire 2024-2025 • Établissement : <strong>{currentUser.establishmentName}</strong>
              </p>
            </div>
          </div>

          {/* Section Interactive de Sélection des Classes et Fixation des Effectifs (6A, 6B, 6C) */}
          <ClassSelectorEffectifSection />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(cls => {
              const studentCount = cls.students.length;
              const totalExpected = cls.students.reduce((sum: number, s: any) => sum + s.totalDue, 0);
              const totalCollected = cls.students.reduce((sum: number, s: any) => sum + s.totalPaid, 0);
              const rate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

              return (
                <div key={cls.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {cls.level}
                      </span>
                      <h3 className="font-black text-xl text-slate-900 mt-1">{cls.name}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {studentCount} / {cls.capacity} élèves
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Tarif scolarité unitaire :</span>
                      <strong className="text-slate-900">{formatXOF(cls.tuition)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total frais attendus :</span>
                      <strong className="text-slate-900">{formatXOF(totalExpected)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total déjà encaissé :</span>
                      <strong className="text-emerald-600">{formatXOF(totalCollected)}</strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Taux de recouvrement</span>
                      <span>{rate} %</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
