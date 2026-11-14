import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "OK" });
});

const port = process.env["PORT"] ?? 3000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
