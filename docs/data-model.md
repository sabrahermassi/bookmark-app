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
