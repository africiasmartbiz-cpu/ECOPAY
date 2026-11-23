import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, SessionUser } from "@/lib/auth";
import { normalizeTogoPhone } from "@/lib/formatters";
import { generateWhatsAppClickToChatUrl } from "@/lib/whatsapp";

// Cache mémoire des codes OTP temporaires
const globalForOtp = globalThis as unknown as { 
  parentOtps: Map<string, { code: string; expiresAt: number; parentId: string }> 
};
if (!globalForOtp.parentOtps) {
  globalForOtp.parentOtps = new Map();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, code } = body;

    const cleanPhone = (phone || "").trim();
    if (!cleanPhone) {
      return NextResponse.json(
        { error: "Veuillez renseigner votre numéro de téléphone WhatsApp." },
        { status: 400 }
      );
    }

    const { normalized, cleanDigits } = normalizeTogoPhone(cleanPhone);
    const last8 = cleanDigits.slice(-8);

    // =========================================================================
    // VÉRIFICATION STRICTE : LE NUMÉRO DOIT ÊTRE ENREGISTRÉ AVEC UN ÉLÈVE INSCRIT
    // =========================================================================
    const findParentWithStudent = () => {
      // 1. Rechercher tous les parents correspondant au numéro de téléphone
      const matchingParents = db.parents.filter(p => {
        const pDigits = (p.phone || "").replace(/\D/g, "");
        const pSecDigits = (p.phoneSecondary || "").replace(/\D/g, "");
        return (last8.length >= 8 && (pDigits.endsWith(last8) || pSecDigits.endsWith(last8))) ||
               cleanDigits === pDigits;
      });

      // 2. Trouver le parent qui a au moins un élève inscrit dans l'établissement
      for (const p of matchingParents) {
        const children = db.getParentChildren(p.id, p.tenantId);
        if (children && children.length > 0) {
          return { parent: p, children };
        }
      }

      // 3. Recherche inverse par les élèves inscrits
      for (const s of db.students) {
        if (!s.isActive) continue;
        const p = db.parents.find(par => par.id === s.parentId);
        if (p) {
          const pDigits = (p.phone || "").replace(/\D/g, "");
          if (last8.length >= 8 && pDigits.endsWith(last8)) {
            const children = db.getParentChildren(p.id, p.tenantId);
            return { parent: p, children };
          }
        }
      }

      return { parent: null, children: [] };
    };

    const { parent, children } = findParentWithStudent();

    // =========================================================================
    // ÉTAPE 1 : ENVOI DU CODE OTP PAR WHATSAPP
    // =========================================================================
    if (action === "SEND_OTP") {
      // Si aucun élève inscrit n'a ce numéro WhatsApp : REFUS STRICT
      if (!parent || !children || children.length === 0) {
        return NextResponse.json(
          { 
            error: `Aucun élève inscrit n'a été trouvé avec le numéro WhatsApp « ${cleanPhone} ». La connexion parent est strictement réservée au numéro WhatsApp enregistré dans le dossier scolaire de l'élève à l'établissement. Veuillez contacter l'école pour enregistrer ou mettre à jour votre numéro.` 
          },
          { status: 404 }
        );
      }

      // Génération du code OTP à 4 chiffres
      const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      globalForOtp.parentOtps.set(last8, {
        code: generatedCode,
        expiresAt,
        parentId: parent.id
      });

      const establishment = db.getEstablishment(parent.tenantId);
      const studentNamesList = children.map(c => `${c.firstName} (${c.className})`).join(", ");

      const whatsappText = `*ECO & FRAIS — Application de Gestion Scolaire*\n\nBonjour *${parent.fullName}*,\n\nVotre code de connexion pour accéder à l'espace scolarité de vos enfants (*${studentNamesList}*) à *${establishment?.name || "l'établissement"}* est :\n\n🔐 Code : *${generatedCode}*\n\n_Ce code est strictement confidentiel et expire dans 10 minutes._\n\nECO & FRAIS Togo (XOF)`;

      const waResult = generateWhatsAppClickToChatUrl(parent.phone, whatsappText);

      // Journaliser la notification WhatsApp
      try {
        db.logNotification({
          tenantId: parent.tenantId,
          recipientPhone: parent.phone,
          studentName: children.map(c => c.firstName).join(", "),
          channel: "WHATSAPP_CLICK",
          templateCode: "OTP_LOGIN",
          content: `Code de sécurité de connexion WhatsApp ECO & FRAIS : ${generatedCode}`,
          status: "SENT",
          sentByName: "Système ECO & FRAIS"
        });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: `Code de sécurité envoyé directement vers WhatsApp au ${parent.phone}`,
        parentName: parent.fullName,
        schoolName: establishment?.name || "Établissement Scolaire",
        childrenCount: children.length,
        childrenNames: children.map(c => `${c.firstName} (${c.className})`),
        whatsappUrl: waResult.url,
        whatsappText,
        simulatedCode: generatedCode // Conservé pour la validation
      });
    }

    // =========================================================================
    // ÉTAPE 2 : VÉRIFICATION DU CODE OTP & CONNEXION DIRECTE
    // =========================================================================
    if (action === "VERIFY_OTP") {
      const cleanCode = (code || "").trim();
      if (!cleanCode) {
        return NextResponse.json(
          { error: "Veuillez saisir le code reçu par WhatsApp." },
          { status: 400 }
        );
      }

      // Vérifier à nouveau la liaison élève
      if (!parent || !children || children.length === 0) {
        return NextResponse.json(
          { 
            error: "Aucun élève inscrit n'est associé à ce numéro WhatsApp. Accès refusé." 
          },
          { status: 403 }
        );
      }

      const cached = globalForOtp.parentOtps.get(last8);

      if (!cached) {
        return NextResponse.json(
          { error: "Aucun code n'a été demandé pour ce numéro ou la session a expiré. Veuillez demander un nouveau code WhatsApp." },
          { status: 401 }
        );
      }

      if (Date.now() > cached.expiresAt) {
        return NextResponse.json(
          { error: "Le code envoyé sur WhatsApp a expiré (validité 10 minutes). Veuillez demander un nouveau code." },
          { status: 401 }
        );
      }

      // Vérification stricte d'identité entre le code envoyé sur WhatsApp et le code saisi
      if (cached.code !== cleanCode) {
        return NextResponse.json(
          { 
            error: `Code incorrect : Le code saisi « ${cleanCode} » n'est pas identique au code envoyé sur WhatsApp. Veuillez ouvrir votre WhatsApp et saisir le code exact à 4 chiffres.` 
          },
          { status: 401 }
        );
      }

      // Vérifier ou créer l'utilisateur UserData rattaché
      let user = db.users.find(u => u.parentId === parent.id && u.tenantId === parent.tenantId);
      if (!user) {
        user = {
          id: `user-parent-${Date.now()}`,
          tenantId: parent.tenantId,
          email: parent.email || `parent.${parent.id}@ecofrais.tg`,
          passwordHash: "ParentSecret2025!",
          fullName: parent.fullName,
          phone: parent.phone,
          role: "PARENT",
          parentId: parent.id,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
      }

      const est = db.getEstablishment(parent.tenantId);

      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: "PARENT",
        tenantId: user.tenantId,
        establishmentName: est?.name || "Établissement Scolaire",
        establishmentCode: est?.code || "SCH",
        parentId: parent.id
      };

      const token = await createSessionToken(sessionUser);

      // Création de la réponse avec cookie de session
      const response = NextResponse.json({
        success: true,
        redirectUrl: "/parent",
        user: sessionUser
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 jours
      });

      // Nettoyer l'OTP après usage
      globalForOtp.parentOtps.delete(last8);

      return response;
    }

    return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
  } catch (error: any) {
    console.error("Erreur parent-whatsapp login:", error);
    return NextResponse.json({ error: error?.message || "Erreur technique" }, { status: 500 });
  }
}
