const tokenKey = "shapers_custom_api_token";
const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export interface CustomMe { person: { id: string; church_id: string; first_name: string; last_name: string; email: string | null; phone: string | null }; roleAssignments: { id: string; role: string; created_at: string }[]; }

function apiUrl() { if (!baseUrl) throw new Error("Custom API is not configured. Set NEXT_PUBLIC_API_URL in apps/web/.env.local."); return baseUrl; }
function setToken(token: string) { window.localStorage.setItem(tokenKey, token); }
export function getCustomToken() { return typeof window === "undefined" ? null : window.localStorage.getItem(tokenKey); }
export function signOutCustom() { window.localStorage.removeItem(tokenKey); }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error ?? "API request failed."); return body as T;
}

export async function signInCustom(email: string, password: string) { const response = await request<{ token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); setToken(response.token); }
export async function signUpCustom(input: { email: string; password: string; churchInviteCode: string; firstName: string; lastName: string }) { const response = await request<{ token: string }>("/auth/signup", { method: "POST", body: JSON.stringify(input) }); setToken(response.token); }
export async function getCustomMe(): Promise<CustomMe | null> { const token = getCustomToken(); if (!token) return null; try { return await request<CustomMe>("/me", { headers: { Authorization: `Bearer ${token}` } }); } catch { signOutCustom(); return null; } }
