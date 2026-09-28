import AsyncStorage from "@react-native-async-storage/async-storage";

const tokenKey = "shapers_custom_api_token";
const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export interface CustomMobileUser {
  person: {
    id: string;
    church_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  roleAssignments: Array<{ role: string; scope_type: string; scope_id: string | null }>;
}

function apiUrl() {
  if (!baseUrl) {
    throw new Error("Custom API is not configured. Set EXPO_PUBLIC_API_URL in apps/mobile/.env.");
  }

  return baseUrl;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = (await response.json().catch(() => null)) as { message?: string } | T | null;

  if (!response.ok) {
    throw new Error(body && typeof body === "object" && "message" in body && typeof body.message === "string"
      ? body.message
      : "The request could not be completed.");
  }

  return body as T;
}

async function saveToken(token: string) {
  await AsyncStorage.setItem(tokenKey, token);
}

export async function signInCustom(email: string, password: string) {
  const result = await request<{ token: string }>("/auth/login", {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });
  await saveToken(result.token);
}

export async function signUpCustom(input: {
  email: string;
  password: string;
  churchInviteCode: string;
  firstName: string;
  lastName: string;
}) {
  const result = await request<{ token: string }>("/auth/signup", {
    body: JSON.stringify(input),
    method: "POST",
  });
  await saveToken(result.token);
}

export async function getCustomMe(): Promise<CustomMobileUser | null> {
  const token = await AsyncStorage.getItem(tokenKey);
  if (!token) return null;

  try {
    return await request<CustomMobileUser>("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    await AsyncStorage.removeItem(tokenKey);
    return null;
  }
}

export async function signOutCustom() {
  await AsyncStorage.removeItem(tokenKey);
}
