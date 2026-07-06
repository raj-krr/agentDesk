import type { Context } from "hono";
import { prisma } from "../db/prisma.js";

export const createMockPayment = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { amount, status, orderId } = body;
    const user = c.get("user");

    if (amount === undefined || !status) {
      return c.json(
        {
          success: false,
          message: "Amount and status are required",
        },
        400
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return c.json(
        {
          success: false,
          message: "Amount must be a valid number",
        },
        400
      );
    }

    // Run in a transaction to create both the Payment and its Invoice
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: user.userId,
          amount: numericAmount,
          status: status,
          orderId: orderId || undefined,
        },
      });

      // Auto-create invoice associated with the payment
      const invoice = await tx.invoice.create({
        data: {
          paymentId: payment.id,
          amount: numericAmount,
        },
      });

      return { payment, invoice };
    });

    return c.json(
      {
        success: true,
        payment: result.payment,
        invoice: result.invoice,
      },
      201
    );
  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);
    return c.json(
      {
        success: false,
        message: "Failed to create payment",
      },
      500
    );
  }
};
