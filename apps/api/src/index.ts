import { app } from "./app.js";

const databaseUrl = process.env["DATABASE_URL"];
if (typeof databaseUrl !== "string" || databaseUrl.trim() === "") {
  throw new Error("Missing env variable: DATABASE_URL");
}

const port = process.env["PORT"] ?? 3000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
