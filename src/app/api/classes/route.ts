import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const classes = db.getClasses(tenantId);
    return NextResponse.json({ success: true, classes });
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

    if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Action réservée aux directeurs et administrateurs" }, { status: 403 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const body = await request.json();
    const { mode, name, level, capacity, monthlyTuition, levelName, levelCategory, divisions, capacityPerClass, tuition } = body;

    // Mode Assistant par lot (ex: 6ème A, 6ème B, 6ème C)
    if (mode === "BATCH" && levelName && divisions && Array.isArray(divisions)) {
      const created = db.batchAddClasses(
        tenantId,
        levelName,
        levelCategory || "COLLEGE",
        divisions,
        Number(capacityPerClass) || 45,
        Number(tuition)
      );
      return NextResponse.json({ success: true, created, classes: db.getClasses(tenantId) });
    }

    // Mode Classe unique
    if (!name || !level) {
      return NextResponse.json({ error: "Le nom et le niveau de la classe sont requis." }, { status: 400 });
    }

    const newClass = db.addClass(tenantId, {
      name,
      level,
      capacity: Number(capacity) || 45,
      monthlyTuition: Number(monthlyTuition) || 95000
    });

    return NextResponse.json({ success: true, class: newClass, classes: db.getClasses(tenantId) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur création classe" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Action réservée aux directeurs et administrateurs" }, { status: 403 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const body = await request.json();
    const { id, capacity, name, level, monthlyTuition } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de classe manquant" }, { status: 400 });
    }

    const updated = db.updateClass(tenantId, id, {
      name,
      level,
      capacity: capacity !== undefined ? Number(capacity) : undefined,
      monthlyTuition: monthlyTuition !== undefined ? Number(monthlyTuition) : undefined
    });

    if (!updated) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, class: updated, classes: db.getClasses(tenantId) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur mise à jour classe" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Action réservée aux directeurs et administrateurs" }, { status: 403 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const deleted = db.deleteClass(tenantId, id);
    return NextResponse.json({ success: deleted, classes: db.getClasses(tenantId) });
  } catch (error) {
    return NextResponse.json({ error: "Erreur suppression classe" }, { status: 500 });
  }
}
