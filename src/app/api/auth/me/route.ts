import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const establishment = user.tenantId ? db.getEstablishment(user.tenantId) : null;

  return NextResponse.json({
    authenticated: true,
    user,
    establishment
  });
}
