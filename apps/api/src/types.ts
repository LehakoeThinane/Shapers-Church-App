import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; churchId: string; personId: string };
    user: { sub: string; churchId: string; personId: string };
  }
}
