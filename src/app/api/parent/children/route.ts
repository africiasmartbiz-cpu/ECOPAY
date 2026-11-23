import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") {
    return NextResponse.json({ error: "Accès strictement réservé à l'espace parent." }, { status: 403 });
  }

  const parentId = user.parentId;
  const tenantId = user.tenantId;

  if (!parentId || !tenantId) {
    return NextResponse.json({ error: "Profil parent non rattaché." }, { status: 400 });
  }

  const children = db.getParentChildren(parentId, tenantId);
  const establishment = db.getEstablishment(tenantId);

  return NextResponse.json({
    children,
    establishment
  });
}
