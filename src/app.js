import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { transactionRouter } from "./routes/transaction.routes.js";
import { budgetRouter } from "./routes/budget.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use("/auth", authRouter);
  app.use("/categories", categoryRouter);
  app.use("/transactions", transactionRouter);
  app.use("/budgets", budgetRouter);

  app.use(errorHandler);

  return app;
}
