import { prisma } from "../db/prisma.js";

export const getLatestOrder = async (userId: string) => {
  return prisma.order.findFirst({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createOrder = async (
  userId: string,
  productName: string,
  status: string,
  trackingId?: string
) => {
  return prisma.order.create({
    data: {
      userId,
      productName,
      status,
      trackingId,
    },
  });
};