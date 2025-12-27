#!/usr/bin/env bash
set -euo pipefail

ports=(3000 5173)

if ! command -v lsof >/dev/null 2>&1 && ! command -v fuser >/dev/null 2>&1; then
  echo "Missing lsof or fuser; cannot verify ports 3000/5173 are free." >&2
  exit 1
fi

get_pids_for_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true
    return
  fi
  if command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "${port}" 2>/dev/null || true
    return
  fi
  echo ""
}

for port in "${ports[@]}"; do
  pids="$(get_pids_for_port "${port}")"
  if [[ -z "${pids}" ]]; then
    continue
  fi

  echo "Killing process(es) on port ${port}: ${pids}" >&2
  kill ${pids} 2>/dev/null || true
  sleep 1

  still_pids="$(get_pids_for_port "${port}")"
  if [[ -n "${still_pids}" ]]; then
    echo "Force killing process(es) on port ${port}: ${still_pids}" >&2
    kill -9 ${still_pids} 2>/dev/null || true
  fi

done
