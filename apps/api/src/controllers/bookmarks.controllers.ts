import type { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client.js";
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
import { AppError } from "../middleware/error.middleware.js";

const TEST_USER_ID = "d604d922-de6a-4052-bc49-2ce8e2814e8d";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

export const createFolder = async (
  req: Request<Record<string, never>, FolderResponse, FolderCreateBody>,
  res: Response<FolderResponse>,
) => {
  const name = req.body?.name;

  // 422: name missing, empty, or not text
  if (typeof name !== "string" || name.trim() === "") {
    throw new AppError(422, "VALIDATION_ERROR", "Some fields are invalid", {
      name: "Name is required",
    });
  }

  try {
    const folder = await prisma.folder.create({
      data: { name, userId: TEST_USER_ID },
    });
    res.status(201).json(toFolderResponse(folder));
  } catch (error) {
    // 409: the user already has a folder with this name
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "DUPLICATE",
        "You already have a folder with this name.",
      );
    }
    throw error;
  }
};

export const listUserFolders = async (
  _req: Request<Record<string, never>, FolderListResponse>,
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
  const { folder_id, name, url } = req.body ?? {};
  const fields: Record<string, string> = {};

  if (typeof folder_id !== "string" || !UUID_REGEX.test(folder_id)) {
    fields.folder_id = "Folder ID must be a valid id";
  }

  if (typeof name !== "string" || name.trim() === "") {
    fields.name = "Name is required";
  }

  if (
    typeof url !== "string" ||
    !URL.canParse(url) ||
    !(url.startsWith("http://") || url.startsWith("https://"))
  ) {
    fields.url = "URL must be a valid http or https link";
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Some fields are invalid",
      fields,
    );
  }

  // Folder lookup: Check if folder doesn't exist or belongs to another user */
  const folder = await prisma.folder.findFirst({
    where: { id: folder_id, userId: TEST_USER_ID },
  });

  if (folder === null) {
    throw new AppError(
      404,
      "NOT_FOUND",
      "Folder not found or belongs to another user.",
    );
  }

  try {
    const bookmark = await prisma.bookmark.create({
      data: {
        folderId: folder_id,
        name,
        url,
        userId: TEST_USER_ID,
      },
    });

    res.status(201).json(toBookmarkResponse(bookmark));
  } catch (error) {
    // 409: A bookmark with this name or url already exists in this folder
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "DUPLICATE",
        "You already have a bookmark with this name or url.",
      );
    }
    throw error;
  }
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
  const folderId = req.params.folderId;
  const sort = req.query.sort ?? "newest";
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const fields: Record<string, string> = {};

  if (typeof folderId !== "string" || !UUID_REGEX.test(folderId)) {
    fields.folderId = "Folder ID must be a valid id";
  }

  if (typeof sort !== "string" || (sort !== "oldest" && sort !== "newest")) {
    fields.sort = "Sort value must be newest or oldest";
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    fields.limit = "Limit must be a whole number, between 1 and 100";
  }

  if (!Number.isInteger(offset) || offset < 0) {
    fields.offset = "Offset must be a whole number, 0 or more";
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Some fields are invalid",
      fields,
    );
  }

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId: TEST_USER_ID },
  });

  if (folder === null) {
    throw new AppError(
      404,
      "NOT_FOUND",
      "Folder not found or belongs to another user.",
    );
  }

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

  const fields: Record<string, string> = {};

  if (typeof name !== "string" || name.trim() === "") {
    fields.name = "Name missing or empty.";
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    fields.limit = "Limit must be a whole number, between 1 and 100";
  }

  if (!Number.isInteger(offset) || offset < 0) {
    fields.offset = "Offset must be a whole number, 0 or more";
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Some fields are invalid",
      fields,
    );
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: TEST_USER_ID,
      name: { contains: name, mode: "insensitive" },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
  const { folder_id, name, url } = req.body ?? {};
  const fields: Record<string, string> = {};

  if (typeof bookmarkId !== "string" || !UUID_REGEX.test(bookmarkId)) {
    fields.bookmarkId = "Bookmark ID must be a valid id";
  }

  if (
    folder_id !== undefined &&
    (typeof folder_id !== "string" || !UUID_REGEX.test(folder_id))
  ) {
    fields.folder_id = "Folder ID must be a valid id";
  }

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    fields.name = "Name can't be empty";
  }

  if (
    url !== undefined &&
    (typeof url !== "string" ||
      !URL.canParse(url) ||
      !(url.startsWith("http://") || url.startsWith("https://")))
  ) {
    fields.url = "URL must be a valid http or https link";
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Some fields are invalid",
      fields,
    );
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId: TEST_USER_ID },
  });

  if (bookmark === null) {
    throw new AppError(
      404,
      "NOT_FOUND",
      "Bookmark not found or belongs to another user.",
    );
  }

  if (folder_id !== undefined) {
    const folder = await prisma.folder.findFirst({
      where: { id: folder_id, userId: TEST_USER_ID },
    });
    if (folder === null) {
      throw new AppError(
        404,
        "NOT_FOUND",
        "Folder not found or belongs to another user.",
      );
    }
  }

  try {
    const updatedBookmark = await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        folderId: folder_id,
        name,
        url,
      },
    });

    res.json(toBookmarkResponse(updatedBookmark));
  } catch (error) {
    // 409: A bookmark with this name or url already exists in this folder
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "DUPLICATE",
        "A bookmark with this name or url already exists in this folder.",
      );
    }
    throw error;
  }
};

export const deleteBookmark = async (
  req: Request<BookmarkParams>,
  res: Response,
) => {
  const { bookmarkId } = req.params;

  if (typeof bookmarkId !== "string" || !UUID_REGEX.test(bookmarkId)) {
    throw new AppError(422, "VALIDATION_ERROR", "Some fields are invalid", {
      bookmarkId: "Bookmark ID must be a valid id",
    });
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId: TEST_USER_ID },
  });

  if (bookmark === null) {
    throw new AppError(
      404,
      "NOT_FOUND",
      "Bookmark not found or belongs to another user.",
    );
  }

  await prisma.bookmark.delete({ where: { id: bookmarkId } });

  res.status(204).end();
};
