import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { Codex } from "@openai/codex-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://72.56.87.146:5173",
];
const envCorsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const CORS_ORIGINS = Array.from(
  new Set([...DEFAULT_CORS_ORIGINS, ...envCorsOrigins]),
);

const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 60);
const RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || "1 minute";

const app = Fastify({ logger: true });

let codexInitError = null;
let codex = null;
try {
  codex = new Codex();
} catch (error) {
  codexInitError = error;
}

if (codexInitError) {
  app.log.error({ err: codexInitError }, "codex_init_failed");
}

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
  const payload = { status: statusCode, message: error.message || "Error" };

  if (error.message === "CORS blocked") {
    reply
      .code(403)
      .send({ status: 403, message: "CORS origin not allowed" });
    return;
  }

  if (error.validation) {
    payload.details = error.validation;
  }

  reply.code(statusCode).send(payload);
});

app.setNotFoundHandler((_request, reply) => {
  reply.code(404).send({ status: 404, message: "Route not found" });
});

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
  if (!OPENAI_API_KEY) {
    return reply
      .code(500)
      .send({ status: 500, message: "OPENAI_API_KEY is not set" });
  }
  if (codexInitError || !codex) {
    return reply
      .code(500)
      .send({ status: 500, message: "Codex initialization failed" });
  }
  const parsed = ChatBody.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      status: 400,
      message: "Invalid request body",
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
      .send({ status: 500, message: "Codex request failed" });
  }
});

app.listen({ port: PORT, host: HOST }).then(() => {
  app.log.info(`API listening on http://${HOST}:${PORT}`);
});
