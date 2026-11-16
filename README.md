# bookmark-app

A full-stack bookmarks manager built with React, TypeScript, Express and PostgreSQL, where users save, organize and search their links privately.

## Run it locally

Requirements: Node (LTS) and Docker Desktop.

1. Create `.env` at the root:

```
PORT=3000
DATABASE_URL=postgresql://bookmarks:bookmarks@localhost:5432/bookmarks
```

2. Install and start:

```
npm install
docker compose up -d --wait
npx prisma migrate dev
npm run db:seed
npm run dev
```

`npm run db:seed` is optional: it adds a test user and 100,000 bookmarks.

3. The API runs on http://localhost:3000/api.

## Docs

- [Design](docs/design.md)
- [API](docs/api.md)
- [Data model](docs/data-model.md)
