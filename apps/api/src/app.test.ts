import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("GET /api", () => {
  it("returns OK", async () => {
    const res = await request(app).get("/api");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "OK" });
  });
});
