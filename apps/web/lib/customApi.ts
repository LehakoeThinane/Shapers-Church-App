const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export function hasCustomApi() { return Boolean(baseUrl); }

export async function getCustomPublic<T>(path: string): Promise<T> {
  if (!baseUrl) throw new Error("Custom API is not configured.");
  const response = await fetch(`${baseUrl}${path}`, { headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Custom API request failed.");
  return body as T;
}
