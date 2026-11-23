import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { formatXOF, formatDate } from "@/lib/formatters";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (user.role === "PARENT") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const tenantId = user.tenantId || (user.role === "SUPER_ADMIN" ? (db.establishments[0]?.id || null) : null);
  if (!tenantId) {
    return NextResponse.json({ error: "Aucun établissement associé" }, { status: 400 });
  }

  const est = db.getEstablishment(tenantId);
  const schoolPrefix = est?.name ? est.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() : "ecofrais";

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "students";

  if (type === "students") {
    const rawStudents = db.getStudents(tenantId);
    const students = rawStudents.map(s => ({
      Matricule: s.matricule,
      Nom: s.lastName,
      Prénoms: s.firstName,
      Genre: s.gender,
      Classe: s.className,
      Parent: s.parentName,
      Téléphone: s.parentPhone,
      "Total Frais (FCFA)": s.totalDue,
      "Total Versé (FCFA)": s.totalPaid,
      "Reste à Payer (FCFA)": s.balanceRemaining,
      Statut: s.status === "PAID" ? "Soldé" : s.status === "PARTIAL" ? "Partiel" : "En retard"
    }));

    return NextResponse.json({ 
      data: students, 
      filename: `${schoolPrefix}_eleves_${Date.now()}` 
    });
  }

  if (type === "payments") {
    const rawPayments = db.getPayments(tenantId);
    const payments = rawPayments.map(p => ({
      "N° Reçu": p.receiptNumber,
      Date: formatDate(p.paymentDate),
      Matricule: p.matricule,
      Élève: p.studentName,
      Classe: p.className,
      "Montant Versé (FCFA)": p.amount,
      "Mode de paiement": p.paymentMethod,
      Référence: p.referenceNumber || "GUICHET",
      Payeur: p.payerName,
      Caissier: p.receivedByName,
      Statut: p.status
    }));

    return NextResponse.json({ 
      data: payments, 
      filename: `${schoolPrefix}_journal_caisse_${Date.now()}` 
    });
  }

  if (type === "debts") {
    const rawDebts = db.getStudents(tenantId).filter(s => s.balanceRemaining > 0);
    const debts = rawDebts.map(s => ({
      Matricule: s.matricule,
      Élève: `${s.lastName} ${s.firstName}`,
      Classe: s.className,
      Parent: s.parentName,
      Téléphone: s.parentPhone,
      "Total Frais (FCFA)": s.totalDue,
      "Montant Réglé (FCFA)": s.totalPaid,
      "Dette / Reste (FCFA)": s.balanceRemaining,
      Statut: s.status === "PARTIAL" ? "Paiement Partiel" : "Impayé Total"
    }));

    return NextResponse.json({ 
      data: debts, 
      filename: `${schoolPrefix}_impayes_recouvrement_${Date.now()}` 
    });
  }

  return NextResponse.json({ error: "Type d'export non reconnu" }, { status: 400 });
}
