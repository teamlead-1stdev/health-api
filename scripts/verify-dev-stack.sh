#!/usr/bin/env bash
set -euo pipefail

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl

api_url="http://localhost:3000/health"
web_url="http://localhost:5173"
proxy_url="http://localhost:5173/api/health"
allowed_origin="http://localhost:5173"
blocked_origin="http://blocked-origin.invalid"

echo "Checking API health at ${api_url}"
curl -fsS "${api_url}" >/dev/null

echo "Checking web dev server at ${web_url}"
curl -fsS "${web_url}" >/dev/null

echo "Checking proxy from web to API at ${proxy_url}"
curl -fsS "${proxy_url}" >/dev/null

echo "Checking CORS allows ${allowed_origin}"
headers="$(curl -sS -D - -o /dev/null -H "Origin: ${allowed_origin}" "${api_url}")"
echo "${headers}" | grep -i "^access-control-allow-origin: ${allowed_origin}$" >/dev/null

echo "Checking CORS blocks ${blocked_origin}"
status="$(curl -sS -o /dev/null -w "%{http_code}" -H "Origin: ${blocked_origin}" "${api_url}")"
if [[ "${status}" != "403" ]]; then
  echo "Expected 403 for blocked origin, got ${status}" >&2
  exit 1
fi

echo "All checks passed."
