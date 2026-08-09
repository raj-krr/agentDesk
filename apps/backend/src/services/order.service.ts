import { prisma } from "../db/prisma.js";
import { getUserDetails } from "./user.service.js";
import { Prisma } from "@prisma/client";

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

const findUserOrder = async (orderId: string, userId: string) => {
  let order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true }
  });

  if (!order) {
    const cleanId = orderId.replace(/^#?ORD-?/i, "").toLowerCase();
    const userOrders = await prisma.order.findMany({
      where: { userId },
      include: { payments: true }
    });
    order = userOrders.find(
      (o: any) =>
        o.id.toLowerCase().startsWith(cleanId) ||
        cleanId.startsWith(o.id.toLowerCase().slice(0, 8)) ||
        o.productName.toLowerCase().includes(cleanId)
    ) || null;
  }

  return order;
};

export const returnOrder = async (orderId: string, userId: string) => {
  const order = await findUserOrder(orderId, userId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Idempotent: If return is already initiated or completed, return the order gracefully
  if (order.status === "Return Initiated" || order.status === "Returned") {
    return order;
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
    where: { id: order.id },
    data: {
      status: "Return Initiated",
      returnInitiatedAt: new Date(),
    },
  });
  try {
    await getUserDetails(userId, true);
  } catch (err) {
  }
  return updated;
};

export const processPickupAndRefund = async (orderId: string, userId: string) => {
  const order = await findUserOrder(orderId, userId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "Return Initiated") {
    throw new Error("Order is not in Return Initiated state");
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "Returned" }
    });

    if (order.payments.length > 0) {
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: { status: "Refunded" }
      });
    }

    return updatedOrder;
  });
  try {
    await getUserDetails(userId, true);
  } catch (err) {
  }
  return result;
};

export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await findUserOrder(orderId, userId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Idempotent: If order is already Cancelled, return it gracefully without throwing an error
  if (order.status === "Cancelled") {
    return order;
  }

  if (order.status !== "Processing" && order.status !== "Pending") {
    throw new Error("Only orders under processing or pending can be cancelled");
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "Cancelled" }
    });

    if (order.payments.length > 0) {
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: { status: "Refunded" }
      });
    }

    return updatedOrder;
  });
  try {
    await getUserDetails(userId, true);
  } catch (err) {
  }
  return result;
};