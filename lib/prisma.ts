import * as Prisma from '@prisma/client';

/**
 * PrismaClient singleton to prevent multiple instances in development
 */

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

const PrismaClientClass = (Prisma as any).PrismaClient ?? (Prisma as any).default ?? (Prisma as any);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClientClass({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
