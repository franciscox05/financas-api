import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, registerUser, createCategory } from "./helpers.js";

async function createTransaction(token, categoryId, overrides = {}) {
  return request(app)
    .post("/transactions")
    .set("Authorization", `Bearer ${token}`)
    .send({
      categoryId,
      amount: 50,
      type: "EXPENSE",
      date: "2026-10-05",
      ...overrides,
    });
}

describe("Transactions", () => {
  it("creates a transaction", async () => {
    const { token } = await registerUser();
    const category = await createCategory(token);

    const res = await createTransaction(token, category.id, { amount: 45.5, description: "Supermercado" });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe("45.5");
  });

  it("filters by category and date range", async () => {
    const { token } = await registerUser();
    const groceries = await createCategory(token, { name: "Groceries" });
    const transport = await createCategory(token, { name: "Transport" });

    await createTransaction(token, groceries.id, { date: "2026-10-01", amount: 20 });
    await createTransaction(token, transport.id, { date: "2026-09-15", amount: 10 });

    const res = await request(app)
      .get("/transactions")
      .query({ categoryId: groceries.id, from: "2026-10-01", to: "2026-10-31" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].categoryId).toBe(groceries.id);
  });

  it("does not leak transactions across users", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const category = await createCategory(userA.token);
    await createTransaction(userA.token, category.id);

    const res = await request(app)
      .get("/transactions")
      .set("Authorization", `Bearer ${userB.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("summarizes totals by category and type", async () => {
    const { token } = await registerUser();
    const category = await createCategory(token, { name: "Groceries", type: "EXPENSE" });

    await createTransaction(token, category.id, { amount: 20 });
    await createTransaction(token, category.id, { amount: 30 });

    const res = await request(app).get("/transactions/summary").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ category: "Groceries", type: "EXPENSE", total: "50" }]);
  });

  it("rejects an amount that is not positive", async () => {
    const { token } = await registerUser();
    const category = await createCategory(token);

    const res = await createTransaction(token, category.id, { amount: -10 });
    expect(res.status).toBe(400);
  });
});
