import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./routes/auth.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { transactionRouter } from "./routes/transaction.routes.js";
import { budgetRouter } from "./routes/budget.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const openapiDocument = YAML.parse(readFileSync(join(__dirname, "..", "openapi.yaml"), "utf8"));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.use("/auth", authRouter);
  app.use("/categories", categoryRouter);
  app.use("/transactions", transactionRouter);
  app.use("/budgets", budgetRouter);

  app.use(errorHandler);

  return app;
}
