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

Expected response shape:

```json
{"sessionId":"demo","answer":"...","items":[]}
```
