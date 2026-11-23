import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès strictement réservé au Super-Administrateur" }, { status: 403 });
  }

  const establishments = db.getAllEstablishments().map(est => {
    const students = db.students.filter(s => s.tenantId === est.id);
    const users = db.users.filter(u => u.tenantId === est.id);
    const sub = db.subscriptions.find(s => s.establishmentId === est.id);
    const plan = sub ? db.subscriptionPlans.find(p => p.id === sub.planId) : null;

    return {
      ...est,
      studentCount: students.length,
      userCount: users.length,
      subscription: sub ? {
        planName: plan?.name || "Sans abonnement",
        billingCycle: sub.billingCycle,
        status: sub.status,
        endDate: sub.endDate
      } : null
    };
  });

  const stats = db.getPlatformStats();
  const plans = db.subscriptionPlans;

  return NextResponse.json({
    establishments,
    stats,
    plans
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès strictement réservé au Super-Administrateur" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { establishmentId, action, reason } = body;

    if (!establishmentId || !action) {
      return NextResponse.json({ error: "Identifiant et action requis" }, { status: 400 });
    }

    let newStatus: "ACTIVE" | "SUSPENDED" | "TRIAL" = "ACTIVE";
    if (action === "SUSPEND") {
      newStatus = "SUSPENDED";
    } else if (action === "ACTIVATE") {
      newStatus = "ACTIVE";
    } else if (action === "TRIAL") {
      newStatus = "TRIAL";
    }

    const updated = db.updateEstablishmentStatus(establishmentId, newStatus, reason);
    if (!updated) {
      return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
    }

    // Journalisation d'audit
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId: null,
      userId: user.id,
      userName: user.fullName,
      action: action === "SUSPEND" ? "ESTABLISHMENT_SUSPENDED" : "ESTABLISHMENT_ACTIVATED",
      entityType: "Establishment",
      entityId: establishmentId,
      details: `Changement de statut pour l'établissement « ${updated.name} » vers ${newStatus}. Motif : ${reason || "Non spécifié"}.`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, establishment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
