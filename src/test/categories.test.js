import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser, createCategory } from "./helpers.js";

describe("Categories", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/categories");
    expect(res.status).toBe(401);
  });

  it("creates and lists categories scoped to the user", async () => {
    const { token } = await registerUser();

    await createCategory(token, { name: "Groceries", type: "EXPENSE" });
    await createCategory(token, { name: "Salary", type: "INCOME" });

    const res = await request(app).get("/categories").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("does not leak categories across users", async () => {
    const userA = await registerUser();
    const userB = await registerUser();

    await createCategory(userA.token, { name: "Groceries" });

    const res = await request(app).get("/categories").set("Authorization", `Bearer ${userB.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("updates a category it owns", async () => {
    const { token } = await registerUser();
    const category = await createCategory(token);

    const res = await request(app)
      .put(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Renamed" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
  });

  it("refuses to update a category owned by another user", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const category = await createCategory(userA.token);

    const res = await request(app)
      .put(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ name: "Hijacked" });

    expect(res.status).toBe(404);
  });

  it("deletes a category it owns", async () => {
    const { token } = await registerUser();
    const category = await createCategory(token);

    const res = await request(app)
      .delete(`/categories/${category.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
