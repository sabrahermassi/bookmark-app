import express from "express";
import type { Express, Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

// types
type FolderCreateBody = { name: string };
type FolderResponse = {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
};
type FolderListResponse = {
  folders: FolderResponse[];
};
type BookmarkCreateBody = {
  folder_id: string;
  name: string;
  url: string;
};
type BookmarkResponse = {
  id: string;
  folder_id: string;
  user_id: string;
  name: string;
  url: string;
  created_at: Date;
};
type FolderBookmarksParams = {
  folderId: string;
};
type FolderBookmarksQuery = {
  sort?: string;
  limit?: string;
  offset?: string;
};
type BookmarkListResponse = { bookmarks: BookmarkResponse[] };
type UserBookmarksQuery = {
  name: string;
  limit?: string;
  offset?: string;
};
type BookmarkParams = {
  bookmarkId: string;
};
type BookmarkUpdateBody = Partial<BookmarkCreateBody>;

const TEST_USER_ID = "d604d922-de6a-4052-bc49-2ce8e2814e8d";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

export const app: Express = express();
app.use(express.json());

app.get("/api", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ message: "OK" });
});

// POST /folders
app.post(
  "/api/folders",
  async (
    req: Request<Record<string, never>, FolderResponse, FolderCreateBody>,
    res: Response<FolderResponse>,
  ) => {
    const { name } = req.body;

    const folder = await prisma.folder.create({
      data: { name, userId: TEST_USER_ID },
    });

    res.status(201).json({
      id: folder.id,
      user_id: folder.userId,
      name: folder.name,
      created_at: folder.createdAt,
    });
  },
);

// GET /folders
app.get(
  "/api/folders",
  async (
    req: Request<Record<string, never>, FolderListResponse>,
    res: Response<FolderListResponse>,
  ) => {
    const folders = await prisma.folder.findMany({
      where: { userId: TEST_USER_ID },
    });

    res.json({
      folders: folders.map((folder) => ({
        id: folder.id,
        user_id: folder.userId,
        name: folder.name,
        created_at: folder.createdAt,
      })),
    });
  },
);

// POST /bookmarks
app.post(
  "/api/bookmarks",
  async (
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

    res.status(201).json({
      id: bookmark.id,
      folder_id: bookmark.folderId,
      user_id: bookmark.userId,
      name: bookmark.name,
      url: bookmark.url,
      created_at: bookmark.createdAt,
    });
  },
);

// GET /folders/:folderId/bookmarks (with sort, limit and offset)
app.get(
  "/api/folders/:folderId/bookmarks",
  async (
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
      bookmarks: bookmarks.map((bookmark) => ({
        id: bookmark.id,
        folder_id: bookmark.folderId,
        user_id: bookmark.userId,
        name: bookmark.name,
        url: bookmark.url,
        created_at: bookmark.createdAt,
      })),
    });
  },
);

// GET /bookmarks?name=…
app.get(
  "/api/bookmarks",
  async (
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
      bookmarks: bookmarks.map((bookmark) => ({
        id: bookmark.id,
        folder_id: bookmark.folderId,
        user_id: bookmark.userId,
        name: bookmark.name,
        url: bookmark.url,
        created_at: bookmark.createdAt,
      })),
    });
  },
);

// PUT /bookmarks/:bookmarkId
app.put(
  "/api/bookmarks/:bookmarkId",
  async (
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

    res.json({
      id: bookmark.id,
      folder_id: bookmark.folderId,
      user_id: bookmark.userId,
      name: bookmark.name,
      url: bookmark.url,
      created_at: bookmark.createdAt,
    });
  },
);

// Request<Params, ResponseBody, RequestBody, Query>
// Response<ResponseBody>

// DELETE /bookmarks/:bookmarkId
app.delete(
  "/api/bookmarks/:bookmarkId",
  async (req: Request<BookmarkParams>, res: Response) => {
    const { bookmarkId } = req.params;

    await prisma.bookmark.delete({ where: { id: bookmarkId } });

    res.status(204).end();
  },
);
