import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { registerAuth, authenticate } from "./auth.js";
import { registerRoutes } from "./routes.js";

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  requestIdHeader: "x-request-id",
  genReqId: () => crypto.randomUUID()
});

await app.register(cors, { origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" });
await app.register(helmet);
await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
await app.register(sensible);
await registerAuth(app);

app.addHook("preHandler", async (req) => {
  if (req.url.startsWith("/api/v1/auth/")) return;
  await authenticate(req);
});

await registerRoutes(app);

app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

app.setErrorHandler((error, req, reply) => {
  req.log.error({ err: error, requestId: req.id }, "request_failed");
  const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
  return reply.code(status).send({ error: status === 500 ? "INTERNAL_ERROR" : error.message, requestId: req.id });
});

await app.listen({ host: "0.0.0.0", port: Number(process.env.API_PORT ?? 4000) });
