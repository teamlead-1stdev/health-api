# API

Base URL (local): `http://127.0.0.1:3000`

## POST /api/chat

Send a chat message and receive a response.

Request headers:
- `Content-Type: application/json`
- `Origin` is validated by CORS allowlist.

Request body:
```json
{
  "sessionId": "demo",
  "message": "hi"
}
```

Response 200:
```json
{
  "sessionId": "demo",
  "answer": "...",
  "items": []
}
```

Errors:
- 400: `{ "status": 400, "message": "Invalid request body" }`
- 403: `{ "status": 403, "message": "CORS origin not allowed" }`
- 500: `{ "status": 500, "message": "Codex request failed" }`

Examples:
```bash
curl -i -X POST http://127.0.0.1:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://72.56.87.146:5173" \
  -d '{"sessionId":"demo","message":"hi"}'
```
