import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const TEST_USER_ID = "d604d922-de6a-4052-bc49-2ce8e2814e8d";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

export const app = express();
app.use(express.json());

app.get("/api", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ message: "OK" });
});

// POST /folders
app.post("/api/folders", async (req, res) => {
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
});

// GET /folders
app.get("/api/folders", async (req, res) => {
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
});

// POST /bookmarks
app.post("/api/bookmarks", async (req, res) => {
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
});

// GET /folders/:folderId/bookmarks (with sort, limit and offset)
app.get("/api/folders/:folderId/bookmarks", async (req, res) => {
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
});

// GET /bookmarks?name=…
app.get("/api/bookmarks", async (req, res) => {
  const { name } = req.query;
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: TEST_USER_ID,
      name: { contains: String(name), mode: "insensitive" },
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
});

// PUT /bookmarks/:bookmarkId
app.put("/api/bookmarks/:bookmarkId", async (req, res) => {
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
});

// DELETE /bookmarks/:bookmarkId
app.delete("/api/bookmarks/:bookmarkId", async (req, res) => {
  const { bookmarkId } = req.params;

  await prisma.bookmark.delete({ where: { id: bookmarkId } });

  res.status(204).end();
});
