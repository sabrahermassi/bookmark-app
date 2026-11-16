import express from "express";
import type { Request, Response } from "express";
import { prisma } from "./controllers/bookmarks.controllers.js";
import { bookmarksRouter } from "./routes/bookmarks.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import type { ErrorResponse } from "./types/bookmarks.types.js";

export const app = express();
app.use(express.json());

app.get("/api", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ message: "OK" });
});

app.use("/api", bookmarksRouter);

// Any /api request that no route matched
app.use("/api", (_req: Request, res: Response<ErrorResponse>) => {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Route not found." } });
});

app.use(errorHandler);
