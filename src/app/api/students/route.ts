import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Seuls les rôles d'établissement et le superadmin peuvent accéder
  if (user.role === "PARENT") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase();
  const classId = searchParams.get("classId");

  // Déterminer le tenantId : strictement celui de la session
  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
  }

  let students = db.getStudents(tenantId);

  if (search) {
    students = students.filter(
      s =>
        s.firstName.toLowerCase().includes(search) ||
        s.lastName.toLowerCase().includes(search) ||
        s.matricule.toLowerCase().includes(search) ||
        s.parentName.toLowerCase().includes(search)
    );
  }

  if (classId) {
    students = students.filter(s => s.classId === classId);
  }

  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // L'administrateur d'établissement et le directeur peuvent inscrire des élèves
  if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Droits insuffisants. Seule la direction ou l'administration peut inscrire un élève." },
      { status: 403 }
    );
  }

  const tenantId = user.tenantId || db.establishments[0]?.id;
  if (!tenantId) {
    return NextResponse.json({ error: "Aucun établissement actif" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, gender, birthDate, birthPlace, classId, parentName, parentPhone, parentEmail, address } = body;

    if (!firstName || !lastName || !classId || !parentName || !parentPhone) {
      return NextResponse.json(
        { error: "Veuillez renseigner tous les champs obligatoires (Nom, Prénom, Classe, Parent, Téléphone)." },
        { status: 400 }
      );
    }

    const newStudent = db.addStudent({
      tenantId,
      firstName,
      lastName,
      gender: gender || "M",
      birthDate: birthDate || "2015-01-01",
      birthPlace: birthPlace || "Lomé",
      classId,
      parentName,
      parentPhone,
      parentEmail,
      address: address || "Lomé, Togo"
    });

    return NextResponse.json({ success: true, student: newStudent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
