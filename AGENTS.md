# Bookmarks app

A full-stack bookmarks manager where users save, organize and search links in folders.

## Critical rules

- I am learning. When reviewing, explain the problem and the concept. Do not rewrite my code or give full solutions unless I ask.
- Do not install dependencies without asking.
- Do not run or create Prisma migrations unless I ask.
- Do not commit unless I ask.
- Never edit apps/api/src/generated/ or .env.
- Code must match the design docs. If it doesn't, say which doc and which part.

## Design docs

- System design: docs/design.md
- API contract (endpoints, status codes, error format): docs/api.md
- Tables, keys, constraints, indexes: docs/data-model.md

## Commands

- Package manager: npm (not pnpm, not yarn). One package.json at the root.
- Start Postgres: docker compose up -d
- Dev server: npm run dev (auto-reloads; do not restart it)
- Build and run: npm start
- After changing prisma/schema.prisma: npx prisma generate

## Required after edits

1. npm run typecheck
2. npx eslint .

## Architecture

- apps/api/src: Express 5 API, TypeScript strict
- prisma/: Prisma 7 schema; generated client in apps/api/src/generated
- Postgres 16 in Docker (docker-compose.yml)
- apps/web: React app (not created yet)

## Code style

- The user id always comes from the auth token, never from the request body.
- Every error uses the error format in docs/api.md.

## Git

- Single-line commit messages, lowercase: "add folder endpoint"
