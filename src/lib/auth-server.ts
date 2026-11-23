import { cookies, headers } from "next/headers";
import { verifySessionToken, SessionUser, COOKIE_NAME } from "./auth";
import { db } from "./db";

/**
 * Récupère l'utilisateur connecté côté serveur depuis les cookies de session
 * ou le header de secours en environnement de développement local
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    // 1. Vérification par Cookie de Session JWT (avec rétro-compatibilité)
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value || cookieStore.get("schoolpay_token")?.value;
    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) {
        if (verified.email?.includes("@schoolpay.tg")) {
          verified.email = verified.email.replace("@schoolpay.tg", "@ecofrais.tg");
        }
        return verified;
      }
    }

    // 2. Fallback de secours strictement restreint au développement local
    // EN PRODUCTION : CE HEADER EST STRICTEMENT INTERDIT (Prévention contre le contournement d'authentification)
    if (process.env.NODE_ENV !== "production") {
      const headerList = headers();
      const fallbackHeader = headerList.get("x-user-fallback");
      if (fallbackHeader) {
        try {
          const parsed = JSON.parse(decodeURIComponent(fallbackHeader));
          const dbUser = db.getUserById(parsed.id);
          if (dbUser && dbUser.isActive) {
            const est = dbUser.tenantId ? db.getEstablishment(dbUser.tenantId) : null;
            return {
              id: dbUser.id,
              email: dbUser.email,
              fullName: dbUser.fullName,
              role: dbUser.role as any,
              tenantId: dbUser.tenantId,
              establishmentName: est?.name,
              establishmentCode: est?.code,
              parentId: dbUser.parentId
            };
          }
        } catch (e) {}
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}
