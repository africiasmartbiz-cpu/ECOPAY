import { SignJWT, jwtVerify } from "jose";

export type UserRole = 
  | "SUPER_ADMIN" 
  | "ESTABLISHMENT_ADMIN" 
  | "DIRECTOR" 
  | "ACCOUNTANT" 
  | "PARENT";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string | null;
  establishmentName?: string;
  establishmentCode?: string;
  parentId?: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.includes("schoolpay_") || secret.length < 32) {
      console.error("ALERTE CRITIQUE SÉCURITÉ : Définir un JWT_SECRET aléatoire fort d'au moins 32 caractères dans les variables d'environnement de production !");
    }
  }
  return new TextEncoder().encode(secret || "schoolpay_super_secret_jwt_key_2025_africa_west_togo_32bytes");
}

const JWT_SECRET = getJwtSecret();

export const COOKIE_NAME = "ecofrais_token";

/**
 * Génère un JWT signé pour la session utilisateur (sans clés undefined pour compatibilité jose)
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const cleanPayload: Record<string, any> = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId
  };

  if (user.establishmentName) cleanPayload.establishmentName = user.establishmentName;
  if (user.establishmentCode) cleanPayload.establishmentCode = user.establishmentCode;
  if (user.parentId) cleanPayload.parentId = user.parentId;

  return await new SignJWT(cleanPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Vérifie et décode le JWT de session
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch (error) {
    return null;
  }
}

/**
 * Détermine l'URL de redirection par défaut selon le rôle
 */
export function getRedirectUrlForRole(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/superadmin";
    case "ESTABLISHMENT_ADMIN":
      return "/admin/profile";
    case "DIRECTOR":
      return "/director";
    case "ACCOUNTANT":
      return "/accounting";
    case "PARENT":
      return "/parent";
    default:
      return "/login";
  }
}

/**
 * Libellé en français pour chaque rôle
 */
export function getRoleBadgeLabel(role: UserRole): { label: string; color: string } {
  switch (role) {
    case "SUPER_ADMIN":
      return { label: "Super-Administrateur", color: "bg-purple-100 text-purple-800 border-purple-300" };
    case "ESTABLISHMENT_ADMIN":
      return { label: "Admin Établissement", color: "bg-blue-100 text-blue-800 border-blue-300" };
    case "DIRECTOR":
      return { label: "Directeur", color: "bg-amber-100 text-amber-800 border-amber-300" };
    case "ACCOUNTANT":
      return { label: "Comptable / Caisse", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "PARENT":
      return { label: "Espace Parent", color: "bg-indigo-100 text-indigo-800 border-indigo-300" };
    default:
      return { label: role, color: "bg-gray-100 text-gray-800 border-gray-300" };
  }
}
