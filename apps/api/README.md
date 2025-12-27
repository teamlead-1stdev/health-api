# Health API Backend

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Install dependencies from repo root:

```bash
npm install
```

## Environment

Required:

- `OPENAI_API_KEY` - API key for Codex/OpenAI requests.

Optional:

- `PORT` - API port (default `3000`).
- `HOST` - bind host (default `0.0.0.0`).
- `CORS_ORIGINS` - comma-separated list of allowed origins.
- `RATE_LIMIT_MAX` - max requests per window (default `60`).
- `RATE_LIMIT_WINDOW` - rate limit window (default `1 minute`).

## Run

```bash
npm run dev -w @health/api
```

or

```bash
npm run start -w @health/api
```

## Endpoints

### GET /health

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"ok":true}
```

### POST /api/chat

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"Hello"}'
```

Manual origin check (simulate browser Origin):

```bash
curl -i -X POST http://127.0.0.1:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://72.56.87.146:5173" \
  -d '{"sessionId":"demo","message":"hi"}'
```

Expected response shape:

```json
{"sessionId":"demo","answer":"...","items":[]}
```
