# bookmark-app

A bookmarks manager built to practise production backend patterns: full-text search, idempotent writes, authentication, background jobs and webhooks. Designed first, then built step by step.

## Engineering highlights

- **Design first.** Requirements, capacity estimates, API contract and data model were written before any code: [design](docs/design.md), [API](docs/api.md), [data model](docs/data-model.md).
- **Full-text search on a GIN index.** Search by name drops from about 75 ms to about 2 ms on 100,000 bookmarks, measured with `EXPLAIN ANALYZE`.
- **Idempotent writes.** `POST /bookmarks` accepts an `Idempotency-Key`. A retry replays the saved response instead of creating a duplicate, a reused key with a different body is rejected, and two parallel retries are handled safely.
- **One error format everywhere.** A central error handler returns `{ error: { code, message, fields } }` for validation errors, duplicates, unknown routes, broken JSON and server errors.
- **Input validation that matches the contract.** Every field is checked against `docs/api.md`, with one 422 that lists every invalid field.
- **Safe raw SQL.** The search query uses parameterized `$queryRaw`, never string concatenation.
- **CI on every pull request.** Type check, lint, and tests against a real Postgres, plus AI code review.

## Tech stack

TypeScript · React (Vite) · Express 5 · Prisma 7 · PostgreSQL 16 · Docker · Vitest · GitHub Actions

## Current state

Folders, bookmarks, search and idempotent bookmark creation work end to end. Requests use a fixed test user until authentication is added.

### Components

```mermaid
flowchart LR
  subgraph B["Browser"]
    UI["React app (Vite)<br/>FolderList · BookmarkList<br/>AddFolderForm · AddBookmarkForm"]
  end
  subgraph API["Express API"]
    direction TB
    JSON["express.json()<br/>reads the JSON body"]
    R["Routes under /api<br/>folders · bookmarks · search"]
    C["Controllers<br/>input checks · throw AppError<br/>test user until auth (step 4)"]
    NF["404 catcher<br/>unknown /api routes"]
    EH["Central error handler<br/>{ error: { code, message, fields } }"]
    JSON --> R --> C
    R -. no match .-> NF
    C -. throws .-> EH
  end
  subgraph DB["Postgres 16 in Docker"]
    T[("users · folders · bookmarks<br/>idempotency_keys")]
    IDX["Indexes<br/>GIN full-text on bookmarks.name<br/>B-tree (folder_id, created_at, id)"]
    T --- IDX
  end
  UI -- "fetch /api/…<br/>(Vite proxy)" --> JSON
  C -- "Prisma client<br/>$queryRaw for search" --> T
```

### Database

```mermaid
erDiagram
  users ||--o{ folders : owns
  users ||--o{ bookmarks : owns
  folders ||--o{ bookmarks : contains
  users ||--o{ idempotency_keys : sends
  users {
    uuid id PK
    text email UK
    text password_hash
    timestamp created_at
  }
  folders {
    uuid id PK
    uuid user_id FK
    text name "unique per user"
    timestamp created_at
  }
  bookmarks {
    uuid id PK
    uuid folder_id FK "B-tree with created_at, id"
    uuid user_id FK
    text name "GIN full-text index, unique per folder"
    text url "unique per folder"
    timestamp created_at
  }
  idempotency_keys {
    uuid id PK
    uuid user_id FK
    text key "unique per user"
    text request_hash "SHA-256 of the body"
    int response_status
    jsonb response_body
    timestamp created_at "kept 24 hours"
  }
```

### Creating a bookmark with an Idempotency-Key

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant A as API (createBookmark)
  participant DB as Postgres
  C->>A: POST /api/bookmarks + Idempotency-Key: K
  A->>A: Check the input, hash the body (SHA-256)
  A->>DB: Find the saved key (user, K)
  alt Key saved, same hash
    DB-->>A: Saved response
    A-->>C: Same 201 again, no new bookmark
  else Key saved, different body
    A-->>C: 422 IDEMPOTENCY_KEY_REUSED
  else New key
    A->>DB: One transaction: insert bookmark + save key and response
    alt Commit OK
      A-->>C: 201 Created
    else Unique violation: a parallel retry won the race
      A->>DB: Read the key the other request saved
      A-->>C: Same 201 (same body) or 409 DUPLICATE
    end
  end
```

### Search performance

100,000 bookmarks, created with `npm run db:seed`.

| Query                     | Index                              | With index | Without   |
| ------------------------- | ---------------------------------- | ---------- | --------- |
| Search by name            | GIN (full-text)                    | 2.108 ms   | 75.581 ms |
| Folder list, newest first | B-tree (folder_id, created_at, id) | 0.23 ms    | 24 ms     |

## Target state

What the system looks like once every step in the roadmap is done, optional ones included. These diagrams are the plan, and are updated as each step is built.

### Components

```mermaid
flowchart LR
  U["Browser<br/>React app"] -- HTTPS --> LB["Load balancer"]
  LB --> API
  subgraph API["API x2"]
    direction TB
    MW["Middleware<br/>helmet · logging<br/>rate limit · auth (JWT)"]
    RT["Routes + controllers<br/>ownership: WHERE user_id<br/>optimistic locking<br/>idempotency keys"]
    OB["Outbox insert<br/>same transaction<br/>as the change"]
    MW --> RT --> OB
  end
  subgraph WK["Worker"]
    direction TB
    RL["Outbox relay"] --> EM["Email jobs<br/>welcome · verify · reset"]
    RL --> WH["Webhook jobs<br/>signed · retries"]
    PU["Hourly purge<br/>old idempotency keys"]
    DS["Discover refresh"]
  end
  PG[("PostgreSQL<br/>primary + standby")]
  RD[("Redis<br/>cache · rate limits<br/>job queues")]
  S3[("Backups<br/>snapshots + PITR")]
  API --> PG
  API --> RD
  WK --> PG
  WK <--> RD
  PG -.-> S3
  subgraph EXT["Outside services"]
    SMTP["Email provider"]
    HOOK["Users' webhook URLs"]
    HN["Hacker News API"]
  end
  EM --> SMTP
  WH --> HOOK
  DS --> HN
  subgraph OBS["Observability"]
    PR["Prometheus + Grafana<br/>rate · errors · p95"]
    JG["Jaeger<br/>traces"]
  end
  API -. metrics + traces .-> OBS
  WK -. metrics + traces .-> OBS
```

### Database: data and auth tables

```mermaid
erDiagram
  users ||--o{ folders : owns
  users ||--o{ bookmarks : owns
  folders ||--o{ bookmarks : contains
  users ||--o{ idempotency_keys : sends
  users ||--o{ refresh_tokens : "stays logged in"
  users ||--o{ user_tokens : "reset or verify"
  users {
    uuid id PK
    text email UK
    text password_hash "argon2id or bcrypt"
    timestamp email_verified_at "NEW"
    timestamp created_at
  }
  folders {
    uuid id PK
    uuid user_id FK
    text name "unique per user"
    timestamp created_at
  }
  bookmarks {
    uuid id PK
    uuid folder_id FK
    uuid user_id FK
    text name "GIN full-text index"
    text url
    int version "NEW, optimistic locking"
    int visit_count "NEW, atomic UPDATE"
    timestamp created_at
  }
  idempotency_keys {
    uuid id PK
    uuid user_id FK
    text key "unique per user"
    text request_hash
    jsonb response_body
    timestamp created_at "purged after 24 hours"
  }
  refresh_tokens {
    uuid id PK
    uuid user_id FK
    text token_hash
    timestamp expires_at
    timestamp revoked_at
  }
  user_tokens {
    uuid id PK
    uuid user_id FK
    text purpose "reset_password or verify_email"
    text token_hash
    timestamp expires_at
    timestamp used_at
  }
```

### Database: events and Discover tables

```mermaid
erDiagram
  users ||--o{ webhook_endpoints : registers
  users ||--o{ outbox : "events for"
  users {
    uuid id PK
  }
  webhook_endpoints {
    uuid id PK
    uuid user_id FK
    text url "SSRF-checked"
    text secret "signs each delivery"
    boolean enabled
  }
  outbox {
    uuid id PK
    uuid user_id FK
    text channel "email or webhook"
    text type "user.registered, bookmark.created"
    jsonb payload
    text status
    int attempts
    timestamp next_attempt_at
    timestamp locked_until
  }
  discover_items {
    uuid id PK
    int hn_id UK
    text title
    text url
    int score
    timestamp fetched_at
  }
```

### Login and authenticated requests

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant A as API
  participant DB as Postgres
  C->>A: POST /api/auth/login (email, password)
  A->>DB: Find user, verify the slow password hash
  A-->>C: Access token (short-lived) + refresh token
  C->>A: GET /api/folders + access token
  A->>A: Auth middleware verifies the token, sets the user
  A->>DB: SELECT ... WHERE user_id = current user
  A-->>C: 200, only this user's folders
  Note over C,A: Access token expired
  C->>A: POST /api/auth/refresh + refresh token
  A->>DB: Check the stored hash, rotate it
  A-->>C: New access token + new refresh token
```

### Webhook delivery

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant A as API
  participant DB as Postgres (outbox)
  participant W as Worker
  participant R as User's webhook URL
  C->>A: POST /api/bookmarks
  A->>DB: One transaction: insert bookmark + outbox row (bookmark.created)
  A-->>C: 201 Created
  loop Every few seconds
    W->>DB: Claim due outbox rows (locked_until)
  end
  W->>R: POST event, signed with the endpoint's secret
  alt 2xx
    W->>DB: Mark the row sent
  else Error or timeout
    W->>DB: attempts + 1, schedule a retry with backoff
  end
```

## Roadmap

- [x] System design, API contract and data model
- [x] Project setup, Docker, CI and AI review
- [x] Bookmarks API: validation, error handling, full-text search, idempotency keys
- [ ] React app (in progress)
- [ ] API tests against a real database
- [ ] Authentication
- [ ] Ownership and security checks
- [ ] Purge expired idempotency keys (hourly job)
- [ ] Deploy to production
- [ ] Optional: Discover feed from Hacker News
- [ ] Optional: email notifications and webhooks (outbox pattern)
- [ ] Optional: race conditions and double submits
- [ ] Optional: password reset and email verification
- [ ] Optional: Redis cache, job queues, metrics and tracing

## Design docs

- [Design](docs/design.md): problem, requirements, capacity estimates, high-level design, retries and idempotency
- [API](docs/api.md): every endpoint, its request, responses and errors
- [Data model](docs/data-model.md): tables, keys, constraints, indexes and their timings

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

3. Open the app at http://localhost:5173. The API runs on http://localhost:3000/api.
