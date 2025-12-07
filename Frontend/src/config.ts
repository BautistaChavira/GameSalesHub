// API configuration base
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"; // ⚠️ cambia según tu backend

export const API_URLS = {
  // Auth
  register: `${API_BASE_URL}/register`,
  login: `${API_BASE_URL}/login`,
  
  // Games
  games: `${API_BASE_URL}/games`, // obtener todos los juegos
  search: `${API_BASE_URL}/search`, // buscar juegos por título
  
  // Genres
  genres: `${API_BASE_URL}/genres`, // obtener todos los géneros
  
  // Offers
  personalizedOffers: `${API_BASE_URL}/personalized-offers`, // ofertas basadas en géneros favoritos
  
  // Dinámicos (se construyen con buildUserURL):
  // - /api/user/:userId/favorite-games (GET, POST, DELETE)
  // - /api/user/:userId/favorite-genres (GET, POST, DELETE)

} as const;

// Helper para construir URLs dinámicas de usuario
export const buildUserURL = (userId: string, resource: 'favorite-games' | 'favorite-genres') => {
  return `${API_BASE_URL}/user/${userId}/${resource}`;
};

// Helper para construir URLs de presupuesto
export const buildBudgetURL = (userId: string) => {
  return `${API_BASE_URL}/user/${userId}/budget`;
};

// API request timeout (ms)
export const API_TIMEOUT = 10000;

// Utility for API requests with timeout
export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout = API_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: "include", // útil si usas cookies de sesión
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    const endTime = performance.now();
    console.log(`[Response Time] ${Math.round(endTime - startTime)}ms`);
    console.log(`[Response Status] ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = `Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error("[API Error]", errorMessage, errorData);
      } catch {
        console.error("[API Error] No se pudo parsear el mensaje de error");
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      console.log("[API Response]", data);
    } else {
      data = await response.text();
      console.log("[API Response] (texto plano):", data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error(
          "[Timeout Error] La petición ha excedido el tiempo de espera:",
          timeout,
          "ms"
        );
        throw new Error("La petición ha excedido el tiempo de espera");
      }
      console.error("[API Error]", error.name, error.message);
      throw error;
    }
    console.error("[Unknown Error]", error);
    throw new Error("Error desconocido en la petición");
  } finally {
    clearTimeout(id);
  }
}