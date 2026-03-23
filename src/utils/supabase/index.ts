import { projectId, publicAnonKey } from "./info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a47a578b`;

export async function apiRequest(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...(options?.headers ?? {}),
    },
  });
  return res.json();
}
