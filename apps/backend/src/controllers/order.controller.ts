import type { Context } from "hono";
import { getLatestOrder, createOrder } from "../services/order.service.js";

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
    const { productName, status, trackingId } = body;
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
      trackingId
    );

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