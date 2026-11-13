# Bookmarks manager – design

## Problem

Design a bookmarks manager. People find links online (articles, docs, videos)
and want to save them and find them again later, from any device.

### Clarifications

- Standalone web app, used in any browser (not a browser extension)
- Users paste a URL into the app; one-click saving is out of scope
- We store the link only, not the page content or files
- Folders are one level only (no folders inside folders)

## Functional requirements

Users should be able to:

- Create folders: one level
- Save a URL: with a name in a folder
- View the bookmarks in a folder
- Search bookmarks (by name)
- Edit or delete a bookmark

## Non-functional requirements

The system should be:

- Fast: save bookmarks and search for them in about 500ms
- Highly available (fault tolerance) when failure happens
- Secure (users data and user A should not read userB bookmarks or data)
- Durable: data is not lost
- Scalable when traffic spikes happens (seasons, events) --> 10 million registred users, 1 million of them active on a given day (spikes: 3 times the normal level)

## Core entities

User, Folder, Bookmark

Full data model: [data-model.md](data-model.md)

## API

- POST /folders
- POST /bookmarks
- GET /folders/:folderId/bookmarks
- GET /bookmarks?name=…
- PUT /bookmarks/:bookmarkId
- DELETE /bookmarks/:bookmarkId

Full details: [api.md](api.md)

![System design](diagrams/system-design.png)
