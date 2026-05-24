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

export function getPrismaClient(): PrismaClient {
  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient();
  }

  return globalThis.prisma;
}

// Lazy proxy keeps static generation safe: importing this module no longer
// opens a database pool until code actually performs a Prisma operation.
export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "then") return undefined;

      const client = getPrismaClient();
      const value = Reflect.get(client, prop);

      return typeof value === "function" ? value.bind(client) : value;
    },
  }
) as PrismaClient;

export default prisma;
