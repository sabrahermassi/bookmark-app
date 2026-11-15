import type { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type {
  FolderResponse,
  FolderCreateBody,
  FolderListResponse,
  BookmarkResponse,
  BookmarkCreateBody,
  FolderBookmarksParams,
  BookmarkListResponse,
  FolderBookmarksQuery,
  UserBookmarksQuery,
  BookmarkParams,
  BookmarkUpdateBody,
} from "../types/bookmarks.types.js";
import {
  toFolderResponse,
  toBookmarkResponse,
} from "../types/bookmarks.types.js";

const TEST_USER_ID = "d604d922-de6a-4052-bc49-2ce8e2814e8d";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

export const createFolder = async (
  req: Request<Record<string, never>, FolderResponse, FolderCreateBody>,
  res: Response<FolderResponse>,
) => {
  const { name } = req.body;

  const folder = await prisma.folder.create({
    data: { name, userId: TEST_USER_ID },
  });

  res.status(201).json(toFolderResponse(folder));
};

export const listUsersFolders = async (
  req: Request<Record<string, never>, FolderListResponse>,
  res: Response<FolderListResponse>,
) => {
  const folders = await prisma.folder.findMany({
    where: { userId: TEST_USER_ID },
  });

  res.json({
    folders: folders.map((folder) => toFolderResponse(folder)),
  });
};

export const createBookmark = async (
  req: Request<Record<string, never>, BookmarkResponse, BookmarkCreateBody>,
  res: Response<BookmarkResponse>,
) => {
  const { folder_id, name, url } = req.body;

  const bookmark = await prisma.bookmark.create({
    data: {
      folderId: folder_id,
      name,
      url,
      userId: TEST_USER_ID,
    },
  });

  res.status(201).json(toBookmarkResponse(bookmark));
};

export const getBookmarks = async (
  req: Request<
    FolderBookmarksParams,
    BookmarkListResponse,
    unknown,
    FolderBookmarksQuery
  >,
  res: Response<BookmarkListResponse>,
) => {
  const { folderId } = req.params;
  const sort = req.query.sort;
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const bookmarks = await prisma.bookmark.findMany({
    where: { folderId, userId: TEST_USER_ID },
    orderBy: [
      { createdAt: sort === "oldest" ? "asc" : "desc" },
      { id: sort === "oldest" ? "asc" : "desc" },
    ],
    take: limit,
    skip: offset,
  });

  res.json({
    bookmarks: bookmarks.map((bookmark) => toBookmarkResponse(bookmark)),
  });
};

export const searchUsersBookmarks = async (
  req: Request<
    Record<string, never>,
    BookmarkListResponse,
    unknown,
    UserBookmarksQuery
  >,
  res: Response<BookmarkListResponse>,
) => {
  const { name } = req.query;
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: TEST_USER_ID,
      name: { contains: name, mode: "insensitive" },
    },
    take: limit,
    skip: offset,
  });

  res.json({
    bookmarks: bookmarks.map((bookmark) => toBookmarkResponse(bookmark)),
  });
};

export const editBookmark = async (
  req: Request<BookmarkParams, BookmarkResponse, BookmarkUpdateBody>,
  res: Response<BookmarkResponse>,
) => {
  const { bookmarkId } = req.params;
  const { folder_id, name, url } = req.body;

  const bookmark = await prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      folderId: folder_id,
      name,
      url,
    },
  });

  res.json(toBookmarkResponse(bookmark));
};

export const deleteBookmark = async (
  req: Request<BookmarkParams>,
  res: Response,
) => {
  const { bookmarkId } = req.params;

  await prisma.bookmark.delete({ where: { id: bookmarkId } });

  res.status(204).end();
};
