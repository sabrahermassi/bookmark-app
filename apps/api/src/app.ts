import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

export const app = express();
app.use(express.json());

app.get("/api", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ message: "OK" });
});
