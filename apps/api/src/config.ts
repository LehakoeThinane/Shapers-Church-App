import { z } from "zod";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // Environment variables may be supplied by the hosting platform instead.
}

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  BOOTSTRAP_TOKEN: z.string().min(32),
  // Demo deployment intentionally allows Expo/native origins. Tighten this to
  // the web origin(s) you own before exposing a production web client.
  CORS_ORIGIN: z.string().default("*"),
});

export const config = configSchema.parse(process.env);
