import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      {
        name: "Raj Kumar",
        email: "raj@test.com",
        password: "password123"
      },
      {
        name: "John Doe",
        email: "john@test.com",
        password: "password123"
      },
      {
        name: "Sarah Smith",
        email: "sarah@test.com",
        password: "password123"
      }
    ]
  });

  console.log("Users added");
}

main()
  .finally(() => prisma.$disconnect());