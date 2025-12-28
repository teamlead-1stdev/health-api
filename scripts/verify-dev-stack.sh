#!/usr/bin/env bash
set -euo pipefail

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl

api_url="http://127.0.0.1:3000/health"
web_url="http://127.0.0.1:5173"
proxy_url="http://127.0.0.1:5173/api/chat"
allowed_origin="http://127.0.0.1:5173"
blocked_origin="http://blocked-origin.invalid"

fail() {
  echo "$1" >&2
  exit 1
}

echo "Checking API health at ${api_url}"
curl -fsS "${api_url}" >/dev/null || fail "API health check failed: ${api_url}"

echo "Checking web dev server at ${web_url}"
curl -fsS "${web_url}" >/dev/null || fail "Web dev server check failed: ${web_url}"

echo "Checking proxy from web to API at ${proxy_url}"
curl -fsS -H "Content-Type: application/json" -d '{"sessionId":"verify","message":"ping"}' "${proxy_url}" >/dev/null \
  || fail "Web proxy check failed: ${proxy_url}"

echo "Checking CORS allows ${allowed_origin}"
headers="$(curl -sS -D - -o /dev/null -H "Origin: ${allowed_origin}" "${api_url}")" \
  || fail "CORS allow check failed: ${api_url}"
echo "${headers}" | grep -i "^access-control-allow-origin: ${allowed_origin}$" >/dev/null \
  || fail "CORS allow header missing for ${allowed_origin}"

echo "Checking CORS blocks ${blocked_origin}"
status="$(curl -sS -o /dev/null -w "%{http_code}" -H "Origin: ${blocked_origin}" "${api_url}")"
if [[ "${status}" != "403" ]]; then
  fail "Expected 403 for blocked origin, got ${status}"
fi

echo "All checks passed."
