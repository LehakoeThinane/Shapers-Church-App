// AES-256-GCM encryption for church_integration.encrypted_token, replacing
// the previous no-op decryptToken() placeholder (`return encryptedToken`).
// The key comes from the PC_TOKEN_ENCRYPTION_KEY edge function secret — 32
// random bytes, base64-encoded (generate with `openssl rand -base64 32`,
// then `supabase secrets set PC_TOKEN_ENCRYPTION_KEY=...`) — and is never
// stored in the database. Ciphertext is stored in encrypted_token as
// base64(iv) + "." + base64(ciphertext); a fresh random IV is generated
// per encryption, per AES-GCM's requirement that an (key, iv) pair never
// repeat.
//
// encryptToken() is exported for whoever builds the real "connect Planning
// Center" admin flow (Phase 7) to call before inserting a token — nothing
// in this repo writes church_integration.encrypted_token yet.

async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("PC_TOKEN_ENCRYPTION_KEY");
  if (!raw) {
    throw new Error("PC_TOKEN_ENCRYPTION_KEY is not configured");
  }
  const keyBytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptToken(stored: string): Promise<string> {
  const [ivPart, dataPart] = stored.split(".");
  if (!ivPart || !dataPart) {
    throw new Error("encrypted_token is not in the expected iv.ciphertext format");
  }

  const key = await getKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivPart) },
    key,
    fromBase64(dataPart)
  );
  return new TextDecoder().decode(plaintext);
}
