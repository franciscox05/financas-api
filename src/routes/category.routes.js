import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

export const categoryRouter = Router();
categoryRouter.use(requireAuth);

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().optional(),
});

categoryRouter.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

categoryRouter.post("/", async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

categoryRouter.put("/:id", async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    await assertOwnership(req.userId, req.params.id);

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

categoryRouter.delete("/:id", async (req, res, next) => {
  try {
    await assertOwnership(req.userId, req.params.id);
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

async function assertOwnership(userId, categoryId) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== userId) {
    throw new ApiError(404, "Category not found");
  }
}
