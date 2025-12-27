# Health API Web

Simple chat UI for the Health API backend.

## Run locally

1) Start the API (from repo root):

```bash
cd apps/api
npm run dev
```

2) Start the web app (new terminal):

```bash
cd apps/web
npm run dev
```

Vite proxies `/api/*` to `http://localhost:3000`, so the UI can call `/api/chat`
without CORS issues.

## Test the chat flow

1) Open `http://localhost:5173`.
2) Keep the default session ID (`demo`) or enter a new one.
3) Send a message and confirm a reply appears in the assistant bubble.
4) Stop the API to verify the error state appears in the UI.
