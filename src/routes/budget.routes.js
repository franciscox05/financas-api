import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

export const budgetRouter = Router();
budgetRouter.use(requireAuth);

const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  amountLimit: z.number().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/, "period must be in YYYY-MM format"),
});

budgetRouter.get("/", async (req, res, next) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId },
      include: { category: true },
    });
    res.json(budgets);
  } catch (err) {
    next(err);
  }
});

budgetRouter.post("/", async (req, res, next) => {
  try {
    const data = budgetSchema.parse(req.body);
    const budget = await prisma.budget.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

budgetRouter.delete("/:id", async (req, res, next) => {
  try {
    await findOwned(req.userId, req.params.id);
    await prisma.budget.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

budgetRouter.get("/:id/status", async (req, res, next) => {
  try {
    const budget = await findOwned(req.userId, req.params.id);

    const [year, month] = budget.period.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const spent = await prisma.transaction.aggregate({
      where: {
        userId: req.userId,
        categoryId: budget.categoryId,
        type: "EXPENSE",
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    const spentAmount = spent._sum.amount ?? 0;
    res.json({
      budget,
      spent: spentAmount,
      remaining: Number(budget.amountLimit) - Number(spentAmount),
    });
  } catch (err) {
    next(err);
  }
});

async function findOwned(userId, id) {
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) {
    throw new ApiError(404, "Budget not found");
  }
  return budget;
}
