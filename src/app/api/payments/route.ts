import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const tenantId = user.tenantId || db.establishments[0]?.id;
  if (!tenantId) {
    return NextResponse.json({ payments: [] });
  }
  const payments = db.getPayments(tenantId);

  return NextResponse.json({
    success: true,
    payments
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Le comptable, l'administrateur et la direction peuvent encaisser
  if (user.role !== "ACCOUNTANT" && user.role !== "ESTABLISHMENT_ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Accès refusé. Seul le service de gestion peut enregistrer un encaissement." },
      { status: 403 }
    );
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Établissement non identifié" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { studentId, amount, paymentMethod, referenceNumber, payerName, payerPhone, notes, idempotencyKey } = body;

    if (!studentId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Veuillez renseigner l'élève, le montant et le mode de paiement." },
        { status: 400 }
      );
    }

    const validMethods = ["ESPECES", "TMONEY", "FLOOZ", "VIREMENT", "CHEQUE"];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Mode de paiement invalide. Choisissez Espèces, TMoney, Flooz, Virement ou Chèque." },
        { status: 400 }
      );
    }

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être un entier supérieur à zéro." },
        { status: 400 }
      );
    }

    const result = db.processPayment({
      tenantId,
      studentId,
      amount: parsedAmount,
      paymentMethod,
      referenceNumber,
      receivedByUserId: user.id,
      receivedByName: user.fullName,
      payerName,
      payerPhone,
      notes,
      idempotencyKey
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      newBalance: result.newBalance
    });
  } catch (error: any) {
    console.error("Payment API error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur lors de l'encaissement" }, { status: 500 });
  }
}
