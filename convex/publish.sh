#!/usr/bin/env bash
set -euo pipefail

pnpm build

if [[ "${1:-}" == "--tag" && "${2:-}" == "beta" ]]; then
  pnpm publish --tag beta --access public
else
  pnpm publish --access public
fi
