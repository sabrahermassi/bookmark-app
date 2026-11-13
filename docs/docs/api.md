# API

Back to [design.md](design.md)

**Base URL:** `/api`

All endpoints require the access token in the `Authorization` header.

The user always comes from the token.

## Error format

Every error uses this shape:

```json
{
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "You already have a folder with this name."
  }
}
```

Validation errors also list the invalid fields:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "fields": { "url": "Must be a valid URL" }
  }
}
```

---

## POST /folders

Create a folder.

**Request**

- Body:

```json
{
  "name": "Travel"
}
```

**Success: 201 Created**

```json
{
  "id": "f-23",
  "user_id": "u-45",
  "name": "Travel",
  "created_at": "2026-11-13T17:10:00Z"
}
```

**Errors**

| Status | When                                    |
| ------ | --------------------------------------- |
| 401    | Missing or invalid token                |
| 409    | The folder already exists for this user |
| 422    | name missing, empty, or not text        |

---

## GET /folders

List the user's folders.

**Request**

Nothing besides the token.

**Success: 200 OK**

No folders returns an empty list: `{ "folders": [] }`.

```json
{
  "folders": [
    {
      "id": "f-23",
      "user_id": "u-45",
      "name": "Travel",
      "created_at": "2026-11-13T17:10:00Z"
    }
  ]
}
```

**Errors**

| Status | When                     |
| ------ | ------------------------ |
| 401    | Missing or invalid token |

---

## POST /bookmarks

Create a bookmark in a folder.

**Request**

- Body:

```json
{
  "folder_id": "f-23",
  "name": "Sweden trip",
  "url": "https://visitsweden.com/"
}
```

**Success: 201 Created**

```json
{
  "id": "b-8",
  "folder_id": "f-23",
  "user_id": "u-45",
  "name": "Sweden trip",
  "url": "https://visitsweden.com/",
  "created_at": "2026-11-13T18:56:00Z"
}
```

**Errors**

| Status | When                                                                   |
| ------ | ---------------------------------------------------------------------- |
| 401    | Missing or invalid token                                               |
| 404    | Folder doesn't exist or belongs to another user                        |
| 409    | A bookmark with this name or url already exists in this folder         |
| 422    | folder_id, name or url missing, empty or not text; url not a valid URL |

---

## GET /folders/:folderId/bookmarks

Get a folder's bookmarks, sorted and paginated.

**Request**

- Path: `folderId` (the folder's id)
- Query:

| Name   | Type   | Required | Description                          | Default  |
| ------ | ------ | -------- | ------------------------------------ | -------- |
| sort   | text   | no       | `newest` or `oldest` (by created_at) | `newest` |
| limit  | number | no       | How many to return (1–100)           | 20       |
| offset | number | no       | How many to skip                     | 0        |

**Success: 200 OK**

```json
{
  "bookmarks": [
    {
      "id": "b-8",
      "folder_id": "f-76",
      "user_id": "u-45",
      "name": "Sweden winter trip",
      "url": "https://visitsweden.com/",
      "created_at": "2026-11-13T18:56:00Z"
    }
  ]
}
```

**Errors**

| Status | When                                                                         |
| ------ | ---------------------------------------------------------------------------- |
| 401    | Missing or invalid token                                                     |
| 404    | Folder doesn't exist or belongs to another user                              |
| 422    | sort not `newest`/`oldest`; limit not 1–100; offset negative or not a number |

---

## GET /bookmarks?name=…

Search the user's bookmarks by name.

**Request**

- Query:

| Name | Type | Required | Description                           | Default |
| ---- | ---- | -------- | ------------------------------------- | ------- |
| name | text | yes      | Words to search for in bookmark names | –       |

**Success: 200 OK**

No match returns an empty list: `{ "bookmarks": [] }`.

```json
{
  "bookmarks": [
    {
      "id": "b-8",
      "folder_id": "f-76",
      "user_id": "u-45",
      "name": "Sweden winter trip",
      "url": "https://visitsweden.com/",
      "created_at": "2026-11-13T18:56:00Z"
    }
  ]
}
```

**Errors**

| Status | When                     |
| ------ | ------------------------ |
| 401    | Missing or invalid token |
| 422    | name missing or empty    |

---

## PUT /bookmarks/:bookmarkId

Edit a bookmark. Send only the fields that change.

**Request**

- Path: `bookmarkId` (the bookmark's id)
- Body:

```json
{
  "folder_id": "f-76",
  "name": "Sweden winter trip"
}
```

**Success: 200 OK**

```json
{
  "id": "b-8",
  "folder_id": "f-76",
  "user_id": "u-45",
  "name": "Sweden winter trip",
  "url": "https://visitsweden.com/",
  "created_at": "2026-11-13T18:56:00Z"
}
```

**Errors**

| Status | When                                                           |
| ------ | -------------------------------------------------------------- |
| 401    | Missing or invalid token                                       |
| 404    | Folder or bookmark doesn't exist or belongs to another user    |
| 409    | A bookmark with this name or url already exists in this folder |
| 422    | A sent field is empty or not text; url not a valid URL         |

---

## DELETE /bookmarks/:bookmarkId

Delete a bookmark.

**Request**

- Path: `bookmarkId` (the bookmark's id)

**Success: 204 No Content**

No body.

**Errors**

| Status | When                                              |
| ------ | ------------------------------------------------- |
| 401    | Missing or invalid token                          |
| 404    | Bookmark doesn't exist or belongs to another user |
