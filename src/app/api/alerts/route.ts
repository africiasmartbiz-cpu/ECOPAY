import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

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

    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role") || user.role;

    const alerts = db.getAlerts(tenantId, roleParam);
    return NextResponse.json({ success: true, alerts });
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

    // Seul le personnel de gestion (notamment l'administrateur d'école) peut signaler un problème
    if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "DIRECTOR" && user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const body = await request.json();
    const { targetRole, category, title, description, priority } = body;

    if (!title || !description || !targetRole || !category) {
      return NextResponse.json(
        { error: "Veuillez renseigner le titre, la description, la catégorie et le destinataire de l'alerte." },
        { status: 400 }
      );
    }

    const validTargets = ["DIRECTOR", "ACCOUNTANT", "BOTH"];
    if (!validTargets.includes(targetRole)) {
      return NextResponse.json({ error: "Destinataire invalide" }, { status: 400 });
    }

    const validCategories = ["PAYMENT_DELAY", "STUDENT_COUNT", "CASH_DISCREPANCY", "OTHER"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Catégorie d'anomalie invalide" }, { status: 400 });
    }

    const alert = db.createAlert({
      tenantId,
      creatorId: user.id,
      creatorName: `${user.fullName} (${user.role === "ESTABLISHMENT_ADMIN" ? "Admin" : user.role})`,
      targetRole,
      category,
      title: title.trim(),
      description: description.trim(),
      priority: priority || "NORMAL"
    });

    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur enregistrement alerte" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== "RESOLVE") {
      return NextResponse.json({ error: "Paramètres manquants ou invalides" }, { status: 400 });
    }

    const resolved = db.resolveAlert(id, `${user.fullName} (${user.role})`);
    if (!resolved) {
      return NextResponse.json({ error: "Alerte introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, alert: resolved });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur mise à jour alerte" }, { status: 500 });
  }
}
