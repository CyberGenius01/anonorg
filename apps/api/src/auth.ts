import type { FastifyInstance, FastifyRequest } from "fastify";
import argon2 from "argon2";
import { prisma } from "@paas/database";

declare module "fastify" {
  interface FastifyRequest {
    principal?: { userId: string; organizationId?: string; platformOwner?: boolean };
  }
}

export async function registerAuth(app: FastifyInstance) {
  await app.register(import("@fastify/jwt"), {
    secret: process.env.JWT_SECRET ?? "dev-only-change-me",
    sign: { expiresIn: process.env.JWT_ACCESS_TTL ?? "15m" }
  });

  app.post("/api/v1/auth/login", async (req, reply) => {
    const body = req.body as { email?: string; password?: string };
    const user = body.email ? await prisma.user.findUnique({ where: { email: body.email }}) : null;
    if (!user || !body.password || !(await argon2.verify(user.passwordHash, body.password))) {
      return reply.code(401).send({ error: "INVALID_CREDENTIALS" });
    }
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id, status: "ACTIVE" }
    });
    const token = await app.jwt.sign({ sub: user.id });
    return { accessToken: token, user: { id: user.id, email: user.email }, memberships };
  });
}

export async function authenticate(req: FastifyRequest) {
  await req.jwtVerify();
  const userId = String((req.user as { sub: string }).sub);
  const platformOwner = Boolean(await prisma.platformOwner.findFirst({ where: { userId }}));
  req.principal = { userId, platformOwner };
}
