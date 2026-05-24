import { prisma } from "../db/prisma.js";

export const getLatestOrder = async () => {
  return prisma.order.findFirst({
    orderBy: {
      createdAt: "desc",
    },
  });
};