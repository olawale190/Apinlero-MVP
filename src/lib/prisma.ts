import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Prevent multiple Prisma Client instances in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Configure Prisma with security-conscious logging
export const prisma = global.prisma || new PrismaClient({
  log: config.isDevelopment
    ? ['query', 'error', 'warn']
    : ['error'], // Only log errors in production (avoid leaking sensitive data)
});

// In development, save the client to avoid hot-reload issues
if (config.isDevelopment) {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
