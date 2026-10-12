import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

const app = createApp();

describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /auth/register", () => {
  it("rejects invalid payloads", async () => {
    const res = await request(app).post("/auth/register").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });
});
