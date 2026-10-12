import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser, createCategory } from "./helpers.js";

describe("Budgets", () => {
  it("creates a budget", async () => {
    const { token } = await registerUser();
    const category = await createCategory(token);

    const res = await request(app)
      .post("/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({ categoryId: category.id, amountLimit: 200, period: "2026-10" });

    expect(res.status).toBe(201);
    expect(res.body.amountLimit).toBe("200");
  });

  it("rejects an invalid period format", async () => {
    const { token } = await registerUser();
    const category = await createCategory(token);

    const res = await request(app)
      .post("/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({ categoryId: category.id, amountLimit: 200, period: "October-2026" });

    expect(res.status).toBe(400);
  });

  it("reports spent and remaining for the period", async () => {
    const { token } = await registerUser();
    const category = await createCategory(token);

    const budgetRes = await request(app)
      .post("/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({ categoryId: category.id, amountLimit: 200, period: "2026-10" });

    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ categoryId: category.id, amount: 45.5, type: "EXPENSE", date: "2026-10-05" });

    // outside the budget's period, should not count
    await request(app)
      .post("/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ categoryId: category.id, amount: 999, type: "EXPENSE", date: "2026-09-05" });

    const res = await request(app)
      .get(`/budgets/${budgetRes.body.id}/status`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.spent).toBe("45.5");
    expect(res.body.remaining).toBe(154.5);
  });

  it("404s on a budget owned by another user", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const category = await createCategory(userA.token);

    const budgetRes = await request(app)
      .post("/budgets")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ categoryId: category.id, amountLimit: 100, period: "2026-10" });

    const res = await request(app)
      .get(`/budgets/${budgetRes.body.id}/status`)
      .set("Authorization", `Bearer ${userB.token}`);

    expect(res.status).toBe(404);
  });
});
