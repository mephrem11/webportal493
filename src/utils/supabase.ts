type ApiRequestOptions = RequestInit;

type SessionPayload = {
  access_token: string;
  refresh_token: string;
};

type SessionResponse = {
  data: { session: { access_token: string } | null };
};

type AuthApi = {
  getSession: () => Promise<SessionResponse>;
  setSession: (payload: SessionPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

type SupabaseLikeClient = {
  auth: AuthApi;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const mockAuth: AuthApi = {
  async getSession() {
    const accessToken = localStorage.getItem("access_token");
    return {
      data: {
        session: accessToken ? { access_token: accessToken } : null,
      },
    };
  },
  async setSession(payload: SessionPayload) {
    localStorage.setItem("access_token", payload.access_token);
    localStorage.setItem("refresh_token", payload.refresh_token);
  },
  async signOut() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

const client: SupabaseLikeClient = {
  auth: mockAuth,
};

export function getSupabaseClient(): SupabaseLikeClient {
  return client;
}

export async function apiRequest(
  path: string,
  options: ApiRequestOptions = {},
  accessToken?: string
) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const endpoint = `${API_BASE_URL}${normalizedPath}`;
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : (data as { error?: string }).error || "Request failed";
    throw new Error(message);
  }

  return data;
}
