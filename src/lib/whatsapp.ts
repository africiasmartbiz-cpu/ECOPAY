import { formatXOF, formatDate, normalizeTogoPhone } from "./formatters";

export interface WhatsAppContext {
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  totalDue: number;
  totalPaid: number;
  balanceRemaining: number;
  dueDate?: string | Date;
  schoolName: string;
  receiptNumber?: string;
  lastPaymentAmount?: number;
  merchantInfo?: {
    enabled: boolean;
    tmoney?: string;
    flooz?: string;
    accountName?: string;
    rib?: string;
  };
}

export type TemplateType = "REMINDER" | "PAYMENT_CONFIRMATION" | "DUE_DATE" | "DEBT_ALERT" | "CUSTOM";

export interface WhatsAppTemplate {
  code: TemplateType;
  title: string;
  description: string;
  defaultText: string;
}

export const WHATSAPP_TEMPLATES: Record<TemplateType, WhatsAppTemplate> = {
  REMINDER: {
    code: "REMINDER",
    title: "A. Rappel de paiement",
    description: "Rappel bienveillant concernant la scolarité de l'élève",
    defaultText: `Bonjour cher parent [NOM_PARENT],\n\nNous espérons que vous allez bien. L'administration de l'établissement [NOM_ETABLISSEMENT] vous rappelle que pour votre enfant [NOM_ELEVE] en classe de [CLASSE], le solde actuel de scolarité est de [SOLDE_RESTANT].\n\nNous vous invitons à régulariser ce montant à la caisse ou via TMoney/Flooz dès que possible.\n\nMerci pour votre confiance.\nDirection [NOM_ETABLISSEMENT]`
  },
  PAYMENT_CONFIRMATION: {
    code: "PAYMENT_CONFIRMATION",
    title: "B. Confirmation d'encaissement",
    description: "Reçu et confirmation d'un paiement effectué",
    defaultText: `Bonjour cher parent [NOM_PARENT],\n\nL'établissement [NOM_ETABLISSEMENT] accuse bonne réception du versement de [MONTANT_PAYE] pour votre enfant [NOM_ELEVE] en classe de [CLASSE].\n\nN° Reçu : [NUMERO_RECU]\nSolde restant : [SOLDE_RESTANT]\n\nVotre reçu officiel est disponible à la comptabilité et sur votre espace parent.\n\nCordialement,\nService Comptabilité`
  },
  DUE_DATE: {
    code: "DUE_DATE",
    title: "C. Rappel d'échéance",
    description: "Avis avant la date limite de la prochaine tranche",
    defaultText: `Avis d'échéance — [NOM_ETABLISSEMENT]\n\nCher(e) [NOM_PARENT], nous vous informons que l'échéance de la tranche de scolarité pour [NOM_ELEVE] ([CLASSE]) arrive à terme le [DATE_ECHEANCE].\n\nMontant de la tranche attendue : [SOLDE_RESTANT].\n\nMerci de prendre vos dispositions pour éviter tout retard.\nService financier [NOM_ETABLISSEMENT]`
  },
  DEBT_ALERT: {
    code: "DEBT_ALERT",
    title: "D. Notification d'impayé / Relance",
    description: "Relance urgente pour impayé en retard",
    defaultText: `URGENT — Situation financière [NOM_ELEVE]\n\nCher parent [NOM_PARENT],\nSauf erreur de notre part, la scolarité de votre enfant [NOM_ELEVE] ([CLASSE]) présente un retard de paiement avec un impayé de [SOLDE_RESTANT] (Date limite dépassée : [DATE_ECHEANCE]).\n\nNous vous prions de bien vouloir passer d'urgence à la caisse de l'école [NOM_ETABLISSEMENT] pour faire le point.\n\nLa Direction`
  },
  CUSTOM: {
    code: "CUSTOM",
    title: "E. Message libre personnalisé",
    description: "Message entièrement personnalisable pour le parent",
    defaultText: `Bonjour cher parent [NOM_PARENT],\n\nConcernant votre enfant [NOM_ELEVE] ([CLASSE]) à [NOM_ETABLISSEMENT] : \n[Votre message ici]\n\nSolde scolarité : [SOLDE_RESTANT].\n\nCordialement,\nL'administration`
  }
};

/**
 * Remplace les variables dynamiques dans un modèle de message
 */
export function compileWhatsAppMessage(templateText: string, ctx: WhatsAppContext): string {
  let message = templateText;
  
  message = message.replace(/\[NOM_ELEVE\]/g, ctx.studentName || "l'élève");
  message = message.replace(/\[CLASSE\]/g, ctx.className || "sa classe");
  message = message.replace(/\[NOM_PARENT\]/g, ctx.parentName || "Parent d'élève");
  message = message.replace(/\[MONTANT_DU\]/g, formatXOF(ctx.totalDue));
  message = message.replace(/\[MONTANT_PAYE\]/g, formatXOF(ctx.lastPaymentAmount ?? ctx.totalPaid));
  message = message.replace(/\[SOLDE_RESTANT\]/g, formatXOF(ctx.balanceRemaining));
  message = message.replace(/\[DATE_ECHEANCE\]/g, ctx.dueDate ? formatDate(ctx.dueDate) : "immédiate");
  message = message.replace(/\[NOM_ETABLISSEMENT\]/g, ctx.schoolName || "ECO & FRAIS");
  message = message.replace(/\[NUMERO_RECU\]/g, ctx.receiptNumber || "N/A");

  if (ctx.merchantInfo && ctx.merchantInfo.enabled) {
    let merchantBlock = "\n\n💳 *Coordonnées de paiement Mobile Money de l'école :*";
    if (ctx.merchantInfo.tmoney) {
      merchantBlock += `\n• TMoney : *${ctx.merchantInfo.tmoney}*`;
    }
    if (ctx.merchantInfo.flooz) {
      merchantBlock += `\n• Flooz : *${ctx.merchantInfo.flooz}*`;
    }
    if (ctx.merchantInfo.accountName) {
      merchantBlock += `\n• Titulaire : ${ctx.merchantInfo.accountName}`;
    }
    if (ctx.merchantInfo.rib) {
      merchantBlock += `\n• Compte bancaire : ${ctx.merchantInfo.rib}`;
    }
    merchantBlock += "\n_⚠️ Indiquez le nom & matricule de l'élève en référence du transfert._";

    if (message.includes("[COMPTE_MARCHAND]")) {
      message = message.replace(/\[COMPTE_MARCHAND\]/g, merchantBlock);
    } else {
      message += merchantBlock;
    }
  } else {
    message = message.replace(/\[COMPTE_MARCHAND\]/g, "");
  }

  return message;
}

/**
 * Génère le lien sécurisé WhatsApp Click-to-Chat
 */
export function generateWhatsAppClickToChatUrl(phone: string, message: string): {
  url: string;
  normalizedPhone: string;
  isValid: boolean;
  error?: string;
} {
  const { normalized, isValid, cleanDigits } = normalizeTogoPhone(phone);
  
  if (!cleanDigits) {
    return {
      url: "",
      normalizedPhone: "",
      isValid: false,
      error: "Numéro de téléphone absent pour ce parent."
    };
  }

  // wa.me attend les chiffres sans le signe '+'
  const waPhone = cleanDigits;
  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${waPhone}?text=${encodedText}`;

  return {
    url,
    normalizedPhone: normalized,
    isValid,
    error: isValid ? undefined : "Numéro togolais potentiellement invalide (doit comporter 8 chiffres après 228)."
  };
}
