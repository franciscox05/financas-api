import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

export const transactionRouter = Router();
transactionRouter.use(requireAuth);

const transactionSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.coerce.date(),
});

const listQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

transactionRouter.get("/", async (req, res, next) => {
  try {
    const { from, to, categoryId, type, page, pageSize } = listQuerySchema.parse(req.query);

    const where = {
      userId: req.userId,
      ...(categoryId && { categoryId }),
      ...(type && { type }),
      ...((from || to) && {
        date: { ...(from && { gte: from }), ...(to && { lte: to }) },
      }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ data: transactions, page, pageSize, total });
  } catch (err) {
    next(err);
  }
});

transactionRouter.get("/summary", async (req, res, next) => {
  try {
    const { from, to } = listQuerySchema.pick({ from: true, to: true }).parse(req.query);

    const where = {
      userId: req.userId,
      ...((from || to) && {
        date: { ...(from && { gte: from }), ...(to && { lte: to }) },
      }),
    };

    const grouped = await prisma.transaction.groupBy({
      by: ["categoryId", "type"],
      where,
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
    });
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    res.json(
      grouped.map((g) => ({
        category: categoryById.get(g.categoryId)?.name ?? "Unknown",
        type: g.type,
        total: g._sum.amount,
      }))
    );
  } catch (err) {
    next(err);
  }
});

transactionRouter.get("/:id", async (req, res, next) => {
  try {
    const transaction = await findOwned(req.userId, req.params.id);
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

transactionRouter.post("/", async (req, res, next) => {
  try {
    const data = transactionSchema.parse(req.body);
    const transaction = await prisma.transaction.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
});

transactionRouter.put("/:id", async (req, res, next) => {
  try {
    const data = transactionSchema.partial().parse(req.body);
    await findOwned(req.userId, req.params.id);

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data,
    });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
});

transactionRouter.delete("/:id", async (req, res, next) => {
  try {
    await findOwned(req.userId, req.params.id);
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

async function findOwned(userId, id) {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.userId !== userId) {
    throw new ApiError(404, "Transaction not found");
  }
  return transaction;
}
