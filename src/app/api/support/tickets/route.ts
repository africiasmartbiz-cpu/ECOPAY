import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let tickets: any[] = [];
  if (user.role === "SUPER_ADMIN") {
    tickets = db.tickets;
  } else if (user.tenantId) {
    tickets = db.tickets.filter(t => t.tenantId === user.tenantId);
  }

  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ticketId, subject, message, priority } = body;

    if (action === "REPLY") {
      if (!ticketId || !message) {
        return NextResponse.json({ error: "Ticket et message requis" }, { status: 400 });
      }

      const isAdmin = user.role === "SUPER_ADMIN";
      const updated = db.replyTicket(ticketId, user.fullName, message, isAdmin);
      if (!updated) {
        return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
      }

      return NextResponse.json({ success: true, ticket: updated });
    } else {
      // Création d'un nouveau ticket
      if (!user.tenantId) {
        return NextResponse.json({ error: "Seul un établissement peut ouvrir un ticket de support" }, { status: 400 });
      }

      if (!subject || !message) {
        return NextResponse.json({ error: "Sujet et message requis" }, { status: 400 });
      }

      const ticket = db.createTicket({
        tenantId: user.tenantId,
        creatorId: user.id,
        subject,
        message,
        priority: priority || "MEDIUM"
      });

      return NextResponse.json({ success: true, ticket });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
