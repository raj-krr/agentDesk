import { prisma } from "../db/prisma.js";
import { cacheDel } from "../lib/redis.js";

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
  trackingId?: string,
  expectedDelivery?: string,
  deliveredAt?: Date | string
) => {
  return prisma.order.create({
    data: {
      userId,
      productName,
      status,
      trackingId,
      expectedDelivery,
      deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
    },
  });
};

export const returnOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "Delivered") {
    throw new Error("Only delivered orders can be returned");
  }

  if (!order.deliveredAt) {
    throw new Error("Order delivery date is not set");
  }

  const deliveryDate = new Date(order.deliveredAt);
  const now = new Date();
  const diffTime = now.getTime() - deliveryDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays > 7) {
    throw new Error("Return window has expired (7 days)");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "Return Initiated",
      returnInitiatedAt: new Date(),
    },
  });
  try {
    await cacheDel(`user:${userId}`);
  } catch (err) {
    console.error("Cache invalidation error in returnOrder:", err);
  }
  return updated;
};

export const processPickupAndRefund = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "Return Initiated") {
    throw new Error("Order is not in Return Initiated state");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "Returned" }
    });

    if (order.payments.length > 0) {
      await tx.payment.updateMany({
        where: { orderId: orderId },
        data: { status: "Refunded" }
      });
    }

    return updatedOrder;
  });
  try {
    await cacheDel(`user:${userId}`);
  } catch (err) {
    console.error("Cache invalidation error in processPickupAndRefund:", err);
  }
  return result;
};

export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "Processing" && order.status !== "Pending") {
    throw new Error("Only orders under processing or pending can be cancelled");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: "Cancelled" }
    });

    if (order.payments.length > 0) {
      await tx.payment.updateMany({
        where: { orderId: orderId },
        data: { status: "Refunded" }
      });
    }

    return updatedOrder;
  });
  try {
    await cacheDel(`user:${userId}`);
  } catch (err) {
    console.error("Cache invalidation error in cancelOrder:", err);
  }
  return result;
};