import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, SessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  return handleSwitch(request);
}

export async function GET(request: Request) {
  const result = await handleSwitch(request, true);
  return result;
}

async function handleSwitch(request: Request, redirect: boolean = false) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      if (redirect) return NextResponse.redirect(new URL("/login", request.url));
      return NextResponse.json({ error: "Non autorisé. Veuillez vous connecter." }, { status: 401 });
    }

    // Sécurité stricte : Les comptes PARENT ou non rattachés ne peuvent en aucun cas s'auto-promouvoir
    if (user.role === "PARENT" || !user.tenantId) {
      if (redirect) return NextResponse.redirect(new URL("/parent", request.url));
      return NextResponse.json({ error: "Accès strictement refusé aux comptes parents." }, { status: 403 });
    }

    const tenantId = user.tenantId;

    // 1. Rechercher le compte Administrateur de cet établissement
    let adminUser = db.users.find(
      u => u.tenantId === tenantId && u.role === "ESTABLISHMENT_ADMIN" && u.isActive !== false
    );

    // 2. Si non trouvé, rechercher le compte Directeur ou le premier utilisateur actif
    if (!adminUser) {
      adminUser = db.users.find(
        u => u.tenantId === tenantId && u.role === "DIRECTOR" && u.isActive !== false
      );
    }

    const est = db.getEstablishment(tenantId);

    const sessionUser: SessionUser = {
      id: adminUser ? adminUser.id : (user ? user.id : `user-admin-${tenantId}`),
      email: adminUser ? adminUser.email : `admin@${tenantId}.tg`,
      fullName: adminUser ? adminUser.fullName : "Administrateur Établissement",
      role: "ESTABLISHMENT_ADMIN",
      tenantId: tenantId,
      establishmentName: est?.name || user?.establishmentName || "Complexe Scolaire",
      establishmentCode: est?.code || user?.establishmentCode || "SCH"
    };

    const token = await createSessionToken(sessionUser);

    if (redirect) {
      const response = NextResponse.redirect(new URL("/admin", request.url));
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      });
      return response;
    }

    const response = NextResponse.json({
      success: true,
      redirectUrl: "/admin",
      user: sessionUser
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    console.error("Erreur switch-to-admin:", error);
    if (redirect) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.json({ error: error?.message || "Erreur" }, { status: 500 });
  }
}
