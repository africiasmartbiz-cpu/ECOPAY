import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { UserRole } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const staff = db.getStaff(tenantId).map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }));

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Seuls le promoteur / administrateur ou directeur peuvent créer des profils au sein de l'établissement
    if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Action réservée au gestionnaire de l'établissement." }, { status: 403 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const body = await request.json();
    const { fullName, email, password, phone, role } = body;

    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Veuillez renseigner le nom, l'email, le mot de passe et le rôle du profil." },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ["DIRECTOR", "ACCOUNTANT", "ESTABLISHMENT_ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rôle non valide. Choisissez Directeur, Comptable ou Administrateur." },
        { status: 400 }
      );
    }

    const result = db.createStaffMember(tenantId, {
      fullName: fullName.trim(),
      email: email.trim(),
      password: password.trim(),
      phone: phone?.trim() || "+228 90 12 34 56",
      role
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur création profil" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    if (!userId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const success = db.deleteStaffMember(tenantId, userId);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ error: "Erreur suppression profil" }, { status: 500 });
  }
}
