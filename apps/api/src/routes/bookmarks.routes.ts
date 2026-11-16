import express from "express";
import type { Router } from "express";
import {
  createFolder,
  listUserFolders,
  createBookmark,
  getBookmarks,
  searchUsersBookmarks,
  editBookmark,
  deleteBookmark,
} from "../controllers/bookmarks.controllers.js";

export const bookmarksRouter: Router = express.Router();

// POST /folders
bookmarksRouter.post("/folders", createFolder);

// GET /folders
bookmarksRouter.get("/folders", listUserFolders);

// POST /bookmarks
bookmarksRouter.post("/bookmarks", createBookmark);

// GET /folders/:folderId/bookmarks (with sort, limit and offset)
bookmarksRouter.get("/folders/:folderId/bookmarks", getBookmarks);

// GET /bookmarks?name=…
bookmarksRouter.get("/bookmarks", searchUsersBookmarks);

// PUT /bookmarks/:bookmarkId
bookmarksRouter.put("/bookmarks/:bookmarkId", editBookmark);

// DELETE /bookmarks/:bookmarkId
bookmarksRouter.delete("/bookmarks/:bookmarkId", deleteBookmark);
