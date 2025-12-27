import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import { z } from "zod";
import { Codex } from "@openai/codex-sdk";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const CORS_ORIGINS = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://72.56.87.146:5173"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 60);
const RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || "1 minute";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (CORS_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked"), false);
  },
  credentials: true,
});

await app.register(rateLimit, {
  max: RATE_LIMIT_MAX,
  timeWindow: RATE_LIMIT_WINDOW,
});

app.setErrorHandler((error, _request, reply) => {
  const statusCode = error.statusCode || 500;
  const payload = {
    statusCode,
    error: error.message || "Internal Server Error",
  };

  if (error.message === "CORS blocked") {
    reply.code(403).send({ statusCode: 403, error: "CORS origin not allowed" });
    return;
  }

  if (error.validation) {
    payload.details = error.validation;
  }

  reply.code(statusCode).send(payload);
});

app.setNotFoundHandler((_request, reply) => {
  reply.code(404).send({ statusCode: 404, error: "Route not found" });
});

const codex = new Codex();
const threads = new Map();

app.get("/health", async () => ({ ok: true }));

const ChatBody = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(4000),
});

const findLastAgentMessage = (items) => {
  if (!Array.isArray(items)) return "";
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    if (item?.type !== "agent_message") continue;
    const content = item?.content ?? item?.message ?? item?.text;
    if (typeof content === "string") return content;
  }
  return "";
};

app.post("/api/chat", async (request, reply) => {
  const parsed = ChatBody.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      statusCode: 400,
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }

  const { sessionId, message } = parsed.data;

  let thread = threads.get(sessionId);
  if (!thread) {
    thread = codex.startThread();
    threads.set(sessionId, thread);
  }

  try {
    const result = await thread.run(message);
    const items = Array.isArray(result?.items) ? result.items : [];
    const answer =
      (typeof result?.finalResponse === "string" && result.finalResponse) ||
      findLastAgentMessage(items) ||
      "";

    return { sessionId, answer, items };
  } catch (error) {
    request.log.error(error, "codex_run_failed");
    return reply
      .code(500)
      .send({ statusCode: 500, error: "Codex request failed" });
  }
});

app.listen({ port: PORT, host: HOST }).then(() => {
  app.log.info(`API listening on http://${HOST}:${PORT}`);
});
