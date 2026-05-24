import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Raj",
      email: "raj@gmail.com",
    },
  });

  await prisma.order.create({
    data: {
      userId: user.id,
      productName: "iPhone 15",
      status: "SHIPPED",
      trackingId: "TRK12345",
    },
  });
}

main();