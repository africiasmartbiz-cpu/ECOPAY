import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const list = db.getAllEstablishments().map(e => ({
      id: e.id,
      code: e.code,
      name: e.name,
      city: e.city,
      country: e.country,
      status: e.status
    }));

    return NextResponse.json({ success: true, establishments: list });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Impossible de récupérer les établissements." },
      { status: 500 }
    );
  }
}
