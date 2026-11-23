/**
 * Utilitaires de formatage monétaire, dates et numéros de téléphone pour le Togo (XOF)
 */

export function formatXOF(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 FCFA";
  // Formatage entier sans décimales avec séparateur d'espace insécable
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} FCFA`;
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} à ${hours}:${minutes}`;
}

/**
 * Normalise un numéro togolais au format international standard WhatsApp (+228XXXXXXXX)
 * Gère les numéros saisis avec ou sans indicatif, avec espaces ou tirets
 */
export function normalizeTogoPhone(phoneInput: string | null | undefined): {
  normalized: string;
  isValid: boolean;
  cleanDigits: string;
} {
  if (!phoneInput) {
    return { normalized: "", isValid: false, cleanDigits: "" };
  }

  // Retirer tous les caractères non numériques sauf le '+'
  let cleaned = phoneInput.trim().replace(/[\s\-\.\(\)]/g, "");

  // Si commence par "+", garder le code pays
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // Si le numéro a 8 chiffres (format national togolais ex: 90123456)
  if (cleaned.length === 8) {
    cleaned = "228" + cleaned;
  }

  // Vérification : 11 chiffres pour le Togo (228 + 8 chiffres)
  const isValid = /^228(90|91|92|93|96|97|98|99|70|71|72|79)\d{6}$/.test(cleaned);

  return {
    normalized: "+" + cleaned,
    isValid: isValid || (cleaned.startsWith("228") && cleaned.length === 11),
    cleanDigits: cleaned
  };
}
