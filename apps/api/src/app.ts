import express from "express";
import { prisma } from "./controllers/bookmarks.controllers.js";
import { bookmarksRouter } from "./routes/bookmarks.routes.js";

export const app = express();
app.use(express.json());

app.get("/api", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ message: "OK" });
});

app.use("/api", bookmarksRouter);
