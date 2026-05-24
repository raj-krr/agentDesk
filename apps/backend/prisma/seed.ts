import { prisma }
from "../src/db/prisma.js";

async function main() {

  // Create users
  const user1 =
    await prisma.user.create({
      data: {
        email:
          "raj@example.com",

        name: "Raj",
      },
    });

  const user2 =
    await prisma.user.create({
      data: {
        email:
          "alex@example.com",

        name: "Alex",
      },
    });

  // Orders
  await prisma.order.createMany({
    data: [
      {
        userId: user1.id,
        productName:
          "iPhone 15",
        trackingId:
          "TRK12345",
        status: "SHIPPED",
      },

      {
        userId: user1.id,
        productName:
          "MacBook Air",
        trackingId:
          "TRK67890",
        status: "DELIVERED",
      },

      {
        userId: user2.id,
        productName:
          "AirPods Pro",
        trackingId:
          "TRK99999",
        status: "PROCESSING",
      },

      {
        userId: user2.id,
        productName:
          "PS5",
        trackingId:
          "TRK88888",
        status: "DELAYED",
      },
    ],
  });

  // Payments
  const payment1 =
    await prisma.payment.create({
      data: {
        userId: user1.id,
        amount: 999,
        status: "SUCCESS",
      },
    });

  const payment2 =
    await prisma.payment.create({
      data: {
        userId: user2.id,
        amount: 499,
        status: "FAILED",
      },
    });

  // Invoices
  await prisma.invoice.createMany({
    data: [
      {
        paymentId:
          payment1.id,
        amount: 999,
      },

      {
        paymentId:
          payment2.id,
        amount: 499,
      },
    ],
  });

  console.log(
    "🌱 Database seeded!"
  );
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });