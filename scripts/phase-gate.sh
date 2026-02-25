#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run_step() {
  local phase="$1"
  local cmd="$2"
  printf '\n[phase-gate] %s\n' "$phase"
  (cd "$ROOT_DIR" && eval "$cmd")
}

run_step "Back-end build" "cd back && npm run build"
run_step "Back-end lint" "cd back && npm run eslint:check"
run_step "Back-end tests" "cd back && npm run test -- --passWithNoTests"
run_step "Front-end lint" "cd front && npm run eslint:check"
run_step "Front-end typecheck" "cd front && npm run typecheck"
run_step "Front-end build" "cd front && npm run build"

echo "[phase-gate] All checks passed"
