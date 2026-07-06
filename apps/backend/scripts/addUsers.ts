import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Raj Kumar",
        email: "raj@test.com",
        password,
      },
      {
        name: "John Doe",
        email: "john@test.com",
        password,
      },
      {
        name: "Sarah Smith",
        email: "sarah@test.com",
        password,
      }
    ]
  });

  console.log("Users added");
}

main()
  .finally(() => prisma.$disconnect());