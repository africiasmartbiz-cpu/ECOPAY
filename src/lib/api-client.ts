/**
 * Client HTTP pour les requêtes frontend avec transport sécurisé et résilience des sessions
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  if (typeof window !== "undefined") {
    const savedUser = localStorage.getItem("ecofrais_user") || localStorage.getItem("schoolpay_user");
    if (savedUser && !headers.has("x-user-fallback")) {
      headers.set("x-user-fallback", encodeURIComponent(savedUser));
    }
  }

  return fetch(url, {
    ...options,
    headers
  });
}
