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
api_chat_url="http://127.0.0.1:3000/api/chat"
web_url="http://127.0.0.1:5173/"
proxy_url="http://127.0.0.1:5173/api/chat"
public_url="http://72.56.87.146:5173/"
cors_origin="http://72.56.87.146:5173"

fail() {
  echo "$1" >&2
  exit 1
}

curl_retry() {
  local attempt=0
  local max_attempts=25
  local delay=0.2
  local cmd=(curl "$@")

  while true; do
    if "${cmd[@]}"; then
      return 0
    fi
    attempt=$((attempt + 1))
    if (( attempt >= max_attempts )); then
      return 1
    fi
    sleep "${delay}"
  done
}

echo "Checking API health at ${api_url}"
curl_retry -fsS "${api_url}" >/dev/null || fail "API health check failed: ${api_url}"

echo "Checking web dev server at ${web_url}"
web_status="$(curl_retry -sS -o /dev/null -w "%{http_code}" -I "${web_url}")" \
  || fail "Web dev server check failed: ${web_url}"
if [[ "${web_status}" != "200" ]]; then
  fail "Web dev server returned ${web_status}: ${web_url}"
fi

echo "Checking proxy from web to API at ${proxy_url}"
curl_retry -fsS -H "Content-Type: application/json" -d '{"sessionId":"verify","message":"ping"}' "${proxy_url}" >/dev/null \
  || fail "Web proxy check failed: ${proxy_url}"

echo "Checking public reachability at ${public_url}"
public_status="$(curl_retry -sS -o /dev/null -w "%{http_code}" -I "${public_url}")" \
  || fail "Public reachability check failed: ${public_url}"
if [[ "${public_status}" != "200" ]]; then
  fail "Public reachability returned ${public_status}: ${public_url}"
fi

echo "Checking CORS preflight for ${cors_origin}"
cors_status="$(curl_retry -sS -o /dev/null -w "%{http_code}" -X OPTIONS "${api_chat_url}" \
  -H "Origin: ${cors_origin}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type")" \
  || fail "CORS preflight request failed: ${api_chat_url}"
if [[ "${cors_status}" != "200" && "${cors_status}" != "204" ]]; then
  fail "CORS preflight returned ${cors_status}: ${api_chat_url}"
fi
cors_headers="$(curl_retry -sS -D - -o /dev/null -X OPTIONS "${api_chat_url}" \
  -H "Origin: ${cors_origin}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type")" \
  || fail "CORS preflight headers failed: ${api_chat_url}"
cors_headers="$(printf "%s" "${cors_headers}" | tr -d '\r')"
echo "${cors_headers}" | grep -i "^access-control-allow-origin: ${cors_origin}$" >/dev/null \
  || fail "CORS allow-origin missing for ${cors_origin}"
echo "${cors_headers}" | grep -i "^access-control-allow-methods:" >/dev/null \
  || fail "CORS allow-methods missing"
echo "${cors_headers}" | grep -i "^access-control-allow-headers:" >/dev/null \
  || fail "CORS allow-headers missing"

echo "All checks passed."
