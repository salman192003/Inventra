import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple Prisma Client instances in development (hot reload)

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres.bapjpnvndyfvsbhfrpyy:LZ%23%3FFka%2BC_Yr8%2Aj@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.bapjpnvndyfvsbhfrpyy:LZ%23%3FFka%2BC_Yr8%2Aj@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
