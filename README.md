# Health API Demo

Monorepo with a Vite React UI and a Fastify API.

## Local run

Prereqs:
- Node.js >= 20
- npm

Setup:
```bash
npm install
cp apps/api/.env.example apps/api/.env
# set OPENAI_API_KEY in apps/api/.env
```

API (terminal 1):
```bash
cd apps/api
npm run dev
```

Web (terminal 2):
```bash
cd apps/web
npm run dev:public
```

Open:
- UI: http://72.56.87.146:5173
- API: http://72.56.87.146:3000/health

## Staging run

API (staging-like, no file watch):
```bash
cd apps/api
npm run start
```

Web (build + preview on public host):
```bash
cd apps/web
npm run build
npm run preview -- --host 0.0.0.0 --port 5173
```

## Deploy steps (manual)

1) Pull latest code on the server.
2) Install deps:
```bash
npm install
```
3) Update `apps/api/.env` (must include `OPENAI_API_KEY`).
4) Restart services (see `docs/RUNBOOK.md`).
5) Validate:
- `curl http://127.0.0.1:3000/health`
- open the UI and send a chat message.

## Docs

- API contract: `docs/API.md`
- Runbook: `docs/RUNBOOK.md`
- Contributing: `CONTRIBUTING.md`
