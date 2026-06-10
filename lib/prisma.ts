import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | undefined;

// Only instantiate Prisma if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  prismaInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance as PrismaClient;

// Export a getter function for lazy initialization
export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    prismaInstance = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
  }
  return prismaInstance;
}