import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { config } from "./config.js";
import { registerAuthRoutes } from "./auth.js";
import { registerPublicRoutes } from "./public.js";
import { registerAdminRoutes } from "./admin.js";
import "./types.js";

const app = Fastify({ logger: true });
// DEMO ONLY: native Expo clients do not send a stable browser Origin. Use an
// explicit allow-list before this API serves a public web application.
await app.register(cors, { origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN, credentials: false });
await app.register(jwt, { secret: config.JWT_SECRET });
app.get("/health", async () => ({ status: "ok" }));
registerAuthRoutes(app);
registerPublicRoutes(app);
registerAdminRoutes(app);
await app.listen({ port: config.PORT, host: "0.0.0.0" });
