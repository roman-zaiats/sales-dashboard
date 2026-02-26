# sales-dashboard Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies
- TypeScript (Node.js + React 19) + `@nestjs/common`, `@nestjs/graphql` (schema-first), `@apollo/server`, `@nestjs/mongoose`, `@apollo/client`, `@tanstack/react-query` (001-sales-operations-dashboard)
- PostgreSQL for operational dashboard data + MongoDB as source-of-truth ingestion inpu (001-sales-operations-dashboard)
- TypeScript (Node.js + React 19) + `@nestjs/common`, `@nestjs/graphql` (schema-first), `@apollo/server`, `drizzle-orm`, `@apollo/client` (003-remove-sale-source-fields)
- PostgreSQL for persisted sales/listings, MongoDB for ingestion source inpu (003-remove-sale-source-fields)

- (001-sales-operations-dashboard)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for 

## Code Style

: Follow standard conventions

## Repository Reference Policy

- `/Users/romanzaiats/IdeaProjects/sales-dashboard/reference` is a **reference-only** repo.
- Do **not copy** files out of it into this repository.
- Do **not edit** that repository.
- You may read files in that repo for reference only.

## GraphQL Type Generation Policy

- `back/schema.graphql` is the GraphQL contract source of truth for both backend and frontend.
- Frontend types in `front/src/generated/graphql.tsx` must be produced by `front/npm run codegen:graphql` and not hand-edited.

## Recent Changes
- 001-sales-operations-dashboard: Added TypeScript (Node.js + React 19) + `@nestjs/common`, `@nestjs/graphql` (schema-first), `@apollo/server`, `@nestjs/mongoose`, `@apollo/client`, `@tanstack/react-query`

- 002-sales-operations-dashboard: Refined to a single-process dashboard runtime and removed leader/worker launch-mode requirements.
- 003-remove-sale-source-fields: Added TypeScript (Node.js + React 19) + `@nestjs/common`, `@nestjs/graphql` (schema-first), `@apollo/server`, `drizzle-orm`, `@apollo/client`

<!-- MANUAL ADDITIONS START -->

## Shadcn UI workflow

- Do not hand-edit files under `front/src/components/ui`.
- For all Shadcn UI building blocks (buttons, card, table, sidebar, etc.), install/update through Shadcn CLI:
  - `pnpm dlx shadcn@latest add <component-name>`
- Do not copy component implementations from reference repos. Use the installed Shadcn version directly.
<!-- MANUAL ADDITIONS END -->
