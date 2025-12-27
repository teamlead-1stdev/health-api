#!/usr/bin/env bash
set -euo pipefail

cd /home/dev/work/health-api

./scripts/free-ports.sh
exec npm run dev:all
