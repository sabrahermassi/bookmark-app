import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

const app = express();
app.use(express.json());

app.get("/", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ message: "OK" });
});

const port = process.env["PORT"] ?? 3000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
