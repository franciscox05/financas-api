import request from "supertest";
import { createApp } from "../app.js";

export const app = createApp();

export async function registerUser(overrides = {}) {
  const payload = {
    name: "Test User",
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: "password123",
    ...overrides,
  };

  const res = await request(app).post("/auth/register").send(payload);
  return { token: res.body.token, user: res.body.user, payload };
}

export async function createCategory(token, overrides = {}) {
  const res = await request(app)
    .post("/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Groceries", type: "EXPENSE", ...overrides });
  return res.body;
}
