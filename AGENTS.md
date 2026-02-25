# sales-dashboard Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-24

## Active Technologies
- TypeScript (Node.js + React 19) + `@nestjs/common`, `@nestjs/graphql` (schema-first), `@apollo/server`, `@nestjs/mongoose`, `@apollo/client`, `@tanstack/react-query` (001-sales-operations-dashboard)
- PostgreSQL for operational dashboard data + MongoDB as source-of-truth ingestion inpu (001-sales-operations-dashboard)

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

- 001-sales-operations-dashboard: Added

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
