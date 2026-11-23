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

    const fees = db.getFeeConfigs(tenantId);
    return NextResponse.json({ success: true, fees });
  } catch (error: any) {
    console.error("Erreur GET fees:", error);
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
      return NextResponse.json({ error: "Action réservée aux administrateurs et directeurs" }, { status: 403 });
    }

    const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
    }

    const body = await request.json();
    const { name, level, paymentMode, academicYear, annualAmount, monthlyAmount, discountAnnual, tranches, id } = body;

    if (!name || !annualAmount) {
      return NextResponse.json(
        { error: "Veuillez renseigner le libellé et le montant annuel de l'écolage." },
        { status: 400 }
      );
    }

    const cleanId = id && typeof id === "string" && id.trim().length > 0 ? id.trim() : undefined;

    const saved = db.saveFeeConfig(tenantId, {
      id: cleanId,
      name,
      level,
      academicYear: academicYear || "2024-2025",
      paymentMode: paymentMode || "MIXTE",
      annualAmount: Number(annualAmount) || 100000,
      monthlyAmount: Number(monthlyAmount) || Math.round((Number(annualAmount) || 100000) / 10),
      discountAnnual: Number(discountAnnual) || 0,
      tranches: Array.isArray(tranches) ? tranches : undefined
    });

    return NextResponse.json({ success: true, fee: saved });
  } catch (error: any) {
    console.error("Erreur enregistrement tarif:", error);
    return NextResponse.json({ error: error?.message || "Erreur enregistrement tarif" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const deleted = db.deleteFeeConfig(tenantId, id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("Erreur suppression tarif:", error);
    return NextResponse.json({ error: "Erreur suppression tarif" }, { status: 500 });
  }
}
