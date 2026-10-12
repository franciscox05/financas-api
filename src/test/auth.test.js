import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser } from "./helpers.js";

describe("POST /auth/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Francisco",
      email: "francisco@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user).toMatchObject({ name: "Francisco", email: "francisco@example.com" });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects invalid payloads", async () => {
    const res = await request(app).post("/auth/register").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email", async () => {
    await registerUser({ email: "dup@example.com" });
    const res = await request(app).post("/auth/register").send({
      name: "Someone Else",
      email: "dup@example.com",
      password: "password123",
    });
    expect(res.status).toBe(409);
  });
});

describe("POST /auth/login", () => {
  it("logs in with correct credentials", async () => {
    const { payload } = await registerUser({ email: "login@example.com" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("rejects a wrong password", async () => {
    const { payload } = await registerUser({ email: "wrongpass@example.com" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: payload.email, password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "whatever123" });

    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("returns the authenticated user", async () => {
    const { token, user } = await registerUser();

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, email: user.email });
  });

  it("rejects requests without a token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get("/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
