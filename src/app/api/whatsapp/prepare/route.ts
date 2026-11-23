import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { 
  WHATSAPP_TEMPLATES, 
  TemplateType, 
  compileWhatsAppMessage, 
  generateWhatsAppClickToChatUrl, 
  WhatsAppContext 
} from "@/lib/whatsapp";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const tenantId = user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Établissement non identifié" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { studentId, templateCode, customMessage } = body;

    if (!studentId) {
      return NextResponse.json({ error: "Identifiant de l'élève requis." }, { status: 400 });
    }

    const student = db.getStudentById(studentId, tenantId);
    if (!student) {
      return NextResponse.json({ error: "Élève introuvable dans votre établissement." }, { status: 404 });
    }

    const est = db.getEstablishment(tenantId);
    const invoice = db.invoices.find(inv => inv.studentId === student.id && inv.tenantId === tenantId);

    const context: WhatsAppContext = {
      studentName: `${student.lastName} ${student.firstName}`,
      className: student.className,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      totalDue: student.totalDue,
      totalPaid: student.totalPaid,
      balanceRemaining: student.balanceRemaining,
      dueDate: invoice?.dueDate,
      schoolName: est?.name || "ECO FRAIS"
    };

    const templateType = (templateCode as TemplateType) || "REMINDER";
    const template = WHATSAPP_TEMPLATES[templateType] || WHATSAPP_TEMPLATES.REMINDER;

    const baseText = customMessage || template.defaultText;
    const compiledMessage = compileWhatsAppMessage(baseText, context);

    const { url, normalizedPhone, isValid, error } = generateWhatsAppClickToChatUrl(
      student.parentPhone,
      compiledMessage
    );

    // Journalisation de la préparation WhatsApp (sans prétendre à un envoi automatique non confirmé)
    db.logNotification({
      tenantId,
      studentId: student.id,
      studentName: `${student.lastName} ${student.firstName}`,
      recipientPhone: normalizedPhone || student.parentPhone,
      channel: "WHATSAPP_CLICK",
      templateCode: templateType,
      content: compiledMessage,
      status: "PREPARED",
      sentByName: user.fullName
    });

    return NextResponse.json({
      success: true,
      url,
      compiledMessage,
      normalizedPhone,
      isValid,
      warning: error
    });
  } catch (error: any) {
    console.error("WhatsApp prepare error:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la préparation du message" }, { status: 500 });
  }
}
