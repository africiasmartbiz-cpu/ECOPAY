import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const paymentId = params.id;
  const payment = db.getPaymentById(paymentId, user.tenantId);

  if (!payment) {
    return NextResponse.json({ error: "Reçu de paiement introuvable" }, { status: 404 });
  }

  // Si c'est un parent, vérifier qu'il s'agit bien de son enfant
  if (user.role === "PARENT" && user.parentId) {
    const student = db.students.find(s => s.id === payment.studentId);
    if (!student || student.parentId !== user.parentId) {
      return NextResponse.json({ error: "Accès refusé à ce reçu" }, { status: 403 });
    }
  }

  return NextResponse.json({ payment });
}
