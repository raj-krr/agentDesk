import type { Context } from "hono";
import { getLatestOrder } from "../services/order.service.js";

export const getOrders = async (c: Context) => {
  try {
    const orders = await getLatestOrder();

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