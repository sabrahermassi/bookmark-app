# Data model

## users

| Column        | Type      | Notes                     |
| ------------- | --------- | ------------------------- |
| id            | uuid      | Primary key               |
| email         | text      | Required, unique          |
| password_hash | text      | Required                  |
| created_at    | timestamp | Required, defaults to now |

## folders

| Column     | Type      | Notes                                                |
| ---------- | --------- | ---------------------------------------------------- |
| id         | uuid      | Primary key                                          |
| user_id    | uuid      | Required, foreign key → users.id, on delete: cascade |
| name       | text      | Required                                             |
| created_at | timestamp | Required, defaults to now                            |

**Unique (user_id, name):** a user can't have two folders with the same name.

## bookmarks

| Column     | Type      | Notes                                                  |
| ---------- | --------- | ------------------------------------------------------ |
| id         | uuid      | Primary key                                            |
| folder_id  | uuid      | Required, foreign key → folders.id, on delete: cascade |
| user_id    | uuid      | Required, foreign key → users.id, on delete: cascade   |
| name       | text      | Required                                               |
| url        | text      | Required                                               |
| created_at | timestamp | Required, defaults to now                              |

**Unique (folder_id, name):** no two bookmarks with the same name in a folder
**Unique (folder_id, url):** the same link can't be saved twice in one folder

## Indexes

| Table     | Columns                     | Type            | Query it serves                                 |
| --------- | --------------------------- | --------------- | ----------------------------------------------- |
| bookmarks | name                        | GIN (full-text) | GET /bookmarks?name= (search by name)           |
| bookmarks | (folder_id, created_at, id) | B-tree          | GET /folders/:folderId/bookmarks (newest first) |

### Index timings (100,000 bookmarks, from `npm run db:seed`)

| Query       | Index                 | With index | Without   |
| ----------- | --------------------- | ---------- | --------- |
| Search      | GIN (full-text)       | 2.108 ms   | 75.581 ms |
| Folder list | B-tree (folder, date) | 0.23 ms    | 24 ms     |

### idempotency_keys

| Column          | Type      | Rules                                     |
| --------------- | --------- | ----------------------------------------- |
| id              | uuid      | Primary key                               |
| user_id         | uuid      | Required, foreign key → users.id, cascade |
| key             | text      | Required, the Idempotency-Key header      |
| request_hash    | text      | Required, SHA-256 of the request body     |
| response_status | integer   | Required, e.g. 201                        |
| response_body   | jsonb     | Required, the JSON that was sent          |
| created_at      | timestamp | Required, defaults to now()               |

**Unique (user_id, key):** one saved response per key, per user.

**Kept for 24 hours**, then deleted.
