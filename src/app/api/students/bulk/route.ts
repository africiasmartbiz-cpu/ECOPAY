import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Action réservée à la direction ou à l'administration de l'établissement." },
        { status: 403 }
      );
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const body = await request.json();
    const { students } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "Aucun élève valide fourni pour l'enregistrement." },
        { status: 400 }
      );
    }

    // Protection anti-déni de service : Maximum 500 élèves par import
    if (students.length > 500) {
      return NextResponse.json(
        { error: "Le nombre maximal d'élèves par importation est limité à 500 pour garantir la stabilité du serveur." },
        { status: 400 }
      );
    }

    // Assainissement strict des données en entrée
    const sanitizedStudents = students.map((s: any) => ({
      lastName: String(s.lastName || "").slice(0, 80).trim(),
      firstName: String(s.firstName || "").slice(0, 80).trim(),
      className: String(s.className || "6ème A").slice(0, 30).trim(),
      gender: (s.gender === "F" ? "F" : "M") as "M" | "F",
      birthDate: String(s.birthDate || "2013-05-10").slice(0, 10),
      parentName: String(s.parentName || "").slice(0, 100).trim(),
      parentPhone: String(s.parentPhone || "").slice(0, 30).trim(),
      tuitionAmount: Math.max(0, Math.min(10000000, Number(s.tuitionAmount) || 0)),
      academicYear: String(s.academicYear || "2024-2025").slice(0, 15)
    })).filter((s: any) => s.lastName.length > 0 || s.firstName.length > 0);

    if (sanitizedStudents.length === 0) {
      return NextResponse.json(
        { error: "Aucune ligne valide trouvée avec un nom ou prénom." },
        { status: 400 }
      );
    }

    const result = db.bulkAddStudents(tenantId, sanitizedStudents);

    return NextResponse.json({
      success: true,
      message: `${result.count} élève(s) enregistré(s) avec succès !`,
      count: result.count,
      created: result.created
    });
  } catch (error: any) {
    console.error("Erreur bulk add students:", error);
    return NextResponse.json({ error: error?.message || "Erreur enregistrement par lot" }, { status: 500 });
  }
}
