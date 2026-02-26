#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(pwd)}"
BACKEND_ENV_FILE="$ROOT_DIR/back/.env.local"
FRONTEND_ENV_FILE="$ROOT_DIR/front/.env.local"

BACKEND_BASE_PORT=8000
FRONTEND_BASE_PORT=5173
GRAPHQL_PATH="/graphql"

if [[ ! -d "$ROOT_DIR/back" || ! -d "$ROOT_DIR/front" ]]; then
  echo "Expected 'back' and 'front' directories under '$ROOT_DIR'." >&2
  exit 1
fi

WORKTREE_NAME="$(basename "$ROOT_DIR")"
SUFFIX=$(( (RANDOM % 100) + 1 ))

BACKEND_PORT=$((BACKEND_BASE_PORT + SUFFIX))
FRONTEND_PORT=$((FRONTEND_BASE_PORT + SUFFIX))
GRAPHQL_ENDPOINT="http://localhost:${BACKEND_PORT}${GRAPHQL_PATH}"

update_or_append_env() {
  local target_file="$1"
  local key="$2"
  local value="$3"

  local temp_file
  temp_file="$(mktemp)"

  if [[ -f "$target_file" ]]; then
    awk -v key="$key" -v value="$value" '
      BEGIN { updated = 0 }
      $0 ~ "^" key "=" { print key "=" value; updated = 1; next }
      { print }
      END {
        if (!updated) {
          print key "=" value
        }
      }
    ' "$target_file" > "$temp_file"
    mv "$temp_file" "$target_file"
  else
    printf '%s=%s\n' "$key" "$value" > "$target_file"
    rm -f "$temp_file"
  fi
}

update_or_append_env "$BACKEND_ENV_FILE" "PORT" "$BACKEND_PORT"
update_or_append_env "$FRONTEND_ENV_FILE" "VITE_FRONTEND_PORT" "$FRONTEND_PORT"
update_or_append_env "$FRONTEND_ENV_FILE" "VITE_GRAPHQL_ENDPOINT" "$GRAPHQL_ENDPOINT"

echo "Updated ports for worktree '$WORKTREE_NAME':"
echo "  back/.env.local PORT=${BACKEND_PORT}"
echo "  front/.env.local VITE_FRONTEND_PORT=${FRONTEND_PORT}"
echo "  front/.env.local VITE_GRAPHQL_ENDPOINT=${GRAPHQL_ENDPOINT}"
