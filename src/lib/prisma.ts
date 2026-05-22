import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  // Use adapter for direct connection (Prisma 7.x pattern)
  if (connectionString) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return undefined;
        throw new Error("DATABASE_URL is not configured");
      },
    }
  ) as PrismaClient;
}

// Prevent multiple instances during hot reload in development
export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
