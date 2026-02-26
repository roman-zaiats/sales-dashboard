---
name: setup-working-tree-environment
description: Configure per-worktree frontend and backend ports by applying a random offset and writing local environment values. Use when setting up another sales-dashboard worktree that should run on unique local ports without committing changes.
---

# Setup working tree environment

This skill creates/updates worktree-local environment overrides in `.env.local` files for the dashboard back-end and front-end.

1. Generate a random offset between `1` and `100`.
2. Add that digit to default ports:
   - Backend base port `8000`
   - Frontend base port `5173`
3. Update local files:
   - `back/.env.local` => `PORT`
   - `front/.env.local` => `VITE_FRONTEND_PORT`, `VITE_GRAPHQL_ENDPOINT`
4. Print the resolved ports for quick verification.

## Run

```bash
.codex/skills/setup-working-tree-environment/scripts/setup-working-tree-environment.sh
```

Optional:

```bash
.codex/skills/setup-working-tree-environment/scripts/setup-working-tree-environment.sh /path/to/sales-dashboard-worktree-7
```

## Note

Only `.env.local` files are touched, so each worktree keeps its own local port mapping outside git history.
