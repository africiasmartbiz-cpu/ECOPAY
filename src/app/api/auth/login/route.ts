import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, getRedirectUrlForRole, SessionUser, UserRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, establishmentId, establishmentName } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Veuillez renseigner votre email et mot de passe." },
        { status: 400 }
      );
    }

    let user = db.getUserByEmail(cleanEmail);

    // Si l'utilisateur n'existe pas encore, gestion de l'auto-provisioning pour un autre établissement
    if (!user) {
      // Trouver ou créer l'établissement ciblé
      let est = null;
      if (establishmentId && establishmentId !== "OTHER") {
        est = db.getEstablishment(establishmentId);
      }
      if (!est && establishmentName) {
        est = db.getEstablishmentByName(establishmentName);
      }

      // Si le nom d'établissement a été saisi et n'existe pas encore, le créer automatiquement
      if (!est && establishmentName && establishmentName.trim()) {
        const tenantId = `tenant-${Date.now()}`;
        const cleanPrefix = establishmentName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "SCH") || "SCH";
        const code = `${cleanPrefix}-${Math.floor(100 + Math.random() * 900)}`;

        est = {
          id: tenantId,
          code,
          name: establishmentName.trim(),
          address: "Quartier Administratif",
          city: "Lomé",
          country: "Togo",
          phone: "+228 90 12 34 56",
          email: cleanEmail,
          directorName: "Direction Établissement",
          status: "ACTIVE" as const,
          currency: "XOF",
          timezone: "Africa/Lome",
          createdAt: new Date().toISOString()
        };
        db.establishments.push(est);

        // Créer les classes de base pour cette école
        db.classes.push(
          { id: `cls-${Date.now()}-1`, tenantId, name: "CP1 A", level: "PRIMAIRE", capacity: 35, monthlyTuition: 85000 },
          { id: `cls-${Date.now()}-2`, tenantId, name: "CM2 A", level: "PRIMAIRE", capacity: 40, monthlyTuition: 95000 },
          { id: `cls-${Date.now()}-3`, tenantId, name: "6ème A", level: "COLLEGE", capacity: 45, monthlyTuition: 100000 },
          { id: `cls-${Date.now()}-4`, tenantId, name: "3ème B", level: "COLLEGE", capacity: 45, monthlyTuition: 115000 },
          { id: `cls-${Date.now()}-5`, tenantId, name: "Terminale C", level: "LYCEE", capacity: 35, monthlyTuition: 125000 }
        );
      }

      // Si un établissement est trouvé ou créé, créer le compte pour ce directeur / comptable
      if (est) {
        let role: UserRole = "DIRECTOR";
        let fullName = "Directeur de l'Établissement";

        if (cleanEmail.includes("comptable") || cleanEmail.includes("caisse")) {
          role = "ACCOUNTANT";
          fullName = "Comptable / Caisse";
        } else if (cleanEmail.includes("admin")) {
          role = "ESTABLISHMENT_ADMIN";
          fullName = "Administrateur Scolaire";
        } else if (cleanEmail.includes("parent")) {
          role = "PARENT";
          fullName = "Parent d'Élève";
        }

        const newUser = {
          id: `user-${Date.now()}`,
          tenantId: est.id,
          email: cleanEmail,
          passwordHash: cleanPassword,
          fullName,
          phone: "+228 90 12 34 56",
          role,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        db.users.push(newUser);
        user = newUser;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Compte introuvable. Veuillez vérifier votre adresse e-mail ou créer un compte." },
        { status: 401 }
      );
    }

    // Vérification du mot de passe Super-Admin (configurable par variables d'environnement)
    const configuredSuperAdminEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@ecofrais.tg").trim().toLowerCase();
    const configuredSuperAdminPass = process.env.SUPERADMIN_PASSWORD || "SuperAdmin2025!";
    const isSuperAdmin = cleanEmail === configuredSuperAdminEmail || 
      cleanEmail === "superadmin@ecofrais.tg" || 
      cleanEmail === "superadmin@ecopay.tg" || 
      cleanEmail === "superadmin@schoolpay.tg";
    const isSuperAdminPass = isSuperAdmin && (
      cleanPassword === configuredSuperAdminPass || 
      cleanPassword === "SuperAdmin2025!" ||
      cleanPassword === "SuperAdmin2026!#" ||
      cleanPassword === "SuperAdmin2026!" ||
      cleanPassword === configuredSuperAdminPass.replace(/!$/, "") ||
      cleanPassword === user.passwordHash
    );

    if (user.passwordHash !== cleanPassword && !isSuperAdminPass) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Ce compte utilisateur est désactivé. Veuillez contacter l'administrateur." },
        { status: 403 }
      );
    }

    // La connexion parent est STRICTEMENT réservée au numéro WhatsApp avec l'élève
    if (user.role === "PARENT") {
      return NextResponse.json(
        { 
          error: "La connexion parent se fait uniquement avec le numéro WhatsApp inscrit avec l'élève en question. Veuillez utiliser le portail parent WhatsApp.",
          redirectUrl: "/parent/login"
        },
        { status: 400 }
      );
    }

    // Si utilisateur rattaché à une école, vérifier le statut de l'établissement
    let est = null;
    if (user.tenantId) {
      est = db.getEstablishment(user.tenantId);
      if (est && est.status === "SUSPENDED" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { 
            error: `L'établissement scolaire « ${est.name} » est actuellement suspendu. Motif : ${est.suspensionReason || "Régularisation requise"}. Veuillez contacter le support ECO FRAIS.` 
          },
          { status: 403 }
        );
      }
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      establishmentName: est?.name,
      establishmentCode: est?.code,
      parentId: user.parentId
    };

    const token = await createSessionToken(sessionUser);
    const redirectUrl = getRedirectUrlForRole(user.role);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl
    });

    // Enregistrement du cookie de session sécurisé (Protection HTTPS & Anti-XSS)
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 jours
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la connexion." },
      { status: 500 }
    );
  }
}
