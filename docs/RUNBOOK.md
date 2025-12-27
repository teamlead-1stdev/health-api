# Runbook

## Start services (manual)

API:
```bash
cd apps/api
npm run dev
```

Web:
```bash
cd apps/web
npm run dev:public
```

## Restart services

If running in terminals, stop with Ctrl+C and start again.

If ports are stuck:
```bash
sudo lsof -ti tcp:3000 | xargs -r sudo kill -9
sudo lsof -ti tcp:5173 | xargs -r sudo kill -9
```

## Logs

- API logs to stdout when started with `npm run dev` or `npm run start`.
- Vite logs to stdout and shows the public URL.

## Common failures

- 403 on `/api/chat`: CORS origin not allowlisted. Check `CORS_ORIGINS` or defaults.
- 500 on `/api/chat`: missing `OPENAI_API_KEY` or Codex request error.
- `ECONNREFUSED` in web proxy: API not running or wrong proxy target.
- Vite not reachable externally: ensure `npm run dev:public` and port 5173 open.
