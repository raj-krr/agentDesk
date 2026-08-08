import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    const res = await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
  } finally {
    await prisma.$disconnect();
  }
}

main();
