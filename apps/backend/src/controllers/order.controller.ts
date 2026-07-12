import type { Context } from "hono";
import { prisma } from "../db/prisma.js";
import { getLatestOrder, createOrder, returnOrder, processPickupAndRefund, cancelOrder } from "../services/order.service.js";
import { cacheDel } from "../lib/redis.js";

export const getOrders = async (c: Context) => {
  try {
    const user = c.get("user");
    const orders = await getLatestOrder(user.userId);

    return c.json({
      success: true,
      orders,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch orders",
      },
      500
    );
  }
};

export const createMockOrder = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { productName, status, trackingId, expectedDelivery, deliveredAt } = body;
    const user = c.get("user");

    if (!productName || !status) {
      return c.json(
        {
          success: false,
          message: "Product name and status are required",
        },
        400
      );
    }

    const order = await createOrder(
      user.userId,
      productName,
      status,
      trackingId,
      expectedDelivery,
      deliveredAt
    );

    try {
      await cacheDel(`user:${user.userId}`);
    } catch (err) {
      console.error("Cache invalidation error in createMockOrder:", err);
    }

    return c.json(
      {
        success: true,
        order,
      },
      201
    );
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return c.json(
      {
        success: false,
        message: "Failed to create order",
      },
      500
    );
  }
};

export const processOrderReturn = async (c: Context) => {
  try {
    const orderId = c.req.param("id");
    const user = c.get("user");

    const order = await returnOrder(orderId, user.userId);

    return c.json({
      success: true,
      message: "Order successfully returned",
      order,
    });
  } catch (error: any) {
    console.error("RETURN ORDER ERROR:", error);
    return c.json(
      {
        success: false,
        message: error.message || "Failed to return order",
      },
      400
    );
  }
};

export const processOrderRefund = async (c: Context) => {
  try {
    const orderId = c.req.param("id");
    const user = c.get("user");

    const order = await processPickupAndRefund(orderId, user.userId);

    return c.json({
      success: true,
      message: "Order successfully refunded after pickup",
      order,
    });
  } catch (error: any) {
    console.error("REFUND ORDER ERROR:", error);
    return c.json(
      {
        success: false,
        message: error.message || "Failed to process refund",
      },
      400
    );
  }
};

export const updateOrderStatus = async (c: Context) => {
  try {
    const orderId = c.req.param("id");
    const { status } = await c.req.json();
    const user = c.get("user");

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    if (order.userId !== user.userId) {
      return c.json({ success: false, message: "Unauthorized" }, 403);
    }

    const updateData: any = { status };
    if (status === "Delivered") {
      updateData.deliveredAt = new Date();
    } else if (status === "Return Initiated") {
      updateData.returnInitiatedAt = new Date();
    } else {
      if (status === "Processing" || status === "Shipped" || status === "Delayed" || status === "Cancelled") {
        updateData.deliveredAt = null;
        updateData.returnInitiatedAt = null;
      }
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    try {
      await cacheDel(`user:${user.userId}`);
    } catch (err) {
      console.error("Cache invalidation error in updateOrderStatus:", err);
    }

    return c.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updated
    });
  } catch (error: any) {
    console.error("UPDATE ORDER STATUS ERROR:", error);
    return c.json({ success: false, message: error.message || "Failed to update order status" }, 500);
  }
};

export const processOrderCancel = async (c: Context) => {
  try {
    const orderId = c.req.param("id");
    const user = c.get("user");

    const order = await cancelOrder(orderId, user.userId);

    return c.json({
      success: true,
      message: "Order successfully cancelled",
      order,
    });
  } catch (error: any) {
    console.error("CANCEL ORDER ERROR:", error);
    return c.json(
      {
        success: false,
        message: error.message || "Failed to cancel order",
      },
      400
    );
  }
};