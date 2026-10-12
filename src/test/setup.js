import { config } from "dotenv";
config({ path: ".env.test" });

import { beforeEach, afterAll } from "vitest";
import { prisma } from "../config/db.js";

beforeEach(async () => {
  await prisma.$transaction([
    prisma.budget.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
