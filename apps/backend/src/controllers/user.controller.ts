import type { Context } from "hono";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";


import {
  getAllUsers,
  getUserByEmail,
  createUser,
  getUserDetails
} from "../services/user.service.js";

export const getUsers = async (c: Context) => {
  const users = await getAllUsers();

  return c.json({
    success: true,
    users,
  });
};

export const getMe = async (
  c: Context
) => {
  try {

    const user =
      c.get("user");

    const profile =
      await getUserDetails(
        user.userId
      );

    if (!profile) {
      return c.json(
        {
          success: false,
          message:
            "User not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      user: profile,
    });

  } catch (error) {

    console.error(error);

    return c.json(
      {
        success: false,
        message:
          "Failed to fetch user",
      },
      500
    );
  }
};

export const register = async (c: Context) => {
  try {
    const body = await c.req.json();

    const { name, email, password } = body;

    const existingUser =
      await getUserByEmail(email);

    if (existingUser) {
      return c.json(
        {
          success: false,
          message: "User already exists",
        },
        409
      );
    }

    const user = await createUser(
      name,
      email,
      password
    );

    return c.json(
      {
        success: true,
        user,
      },
      201
    );
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    return c.json(
      {
        success: false,
        message: "Registration failed",
      },
      500
    );
  }
};

export const login = async (c: Context) => {
  try {
    const body = await c.req.json();

    const { email, password } = body;

    const user =
      await getUserByEmail(email);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found",
        },
        404
      );
    }

    console.log("Entered password:", password);
console.log("Stored password:", user.password);

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    console.log("Password Match:", validPassword);
    if (!validPassword) {
      return c.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        401
      );
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
      console.error(
    "LOGIN ERROR:",
    error
  );

    return c.json(
      {
        success: false,
        message: "Login failed",
         error: String(error),
      },
      500
    );
  }
};

export const logout = async (c: Context) => {
  return c.json({
    success: true,
    message: "Logged out successfully",
  });
};

export const loginDemoUser = async (c: Context) => {
  try {
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const email = `demo_${uniqueId}@agentdesk.demo`;
    const name = "Demo User";
    const password = "demouser123";

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Seed Order 1: Sony WH-1000XM5 (Delivered, Eligible for Return)
    const orderSony = await prisma.order.create({
      data: {
        userId: user.id,
        productName: "Sony WH-1000XM5",
        status: "Delivered",
        trackingId: "TRK-SONY-1122",
        expectedDelivery: "Delivered",
        deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      }
    });
    const paymentSony = await prisma.payment.create({
      data: {
        userId: user.id,
        orderId: orderSony.id,
        amount: 399.99,
        status: "Succeeded"
      }
    });
    await prisma.invoice.create({
      data: {
        paymentId: paymentSony.id,
        amount: 399.99
      }
    });

    // Seed Order 2: Apple Watch Ultra (Delivered, Expired Return Window)
    const orderWatch = await prisma.order.create({
      data: {
        userId: user.id,
        productName: "Apple Watch Ultra",
        status: "Delivered",
        trackingId: "TRK-WATCH-3344",
        expectedDelivery: "Delivered",
        deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      }
    });
    const paymentWatch = await prisma.payment.create({
      data: {
        userId: user.id,
        orderId: orderWatch.id,
        amount: 799.99,
        status: "Succeeded"
      }
    });
    await prisma.invoice.create({
      data: {
        paymentId: paymentWatch.id,
        amount: 799.99
      }
    });

    // Seed Order 3: AirPods Max (Delayed Shipping)
    const orderAirPods = await prisma.order.create({
      data: {
        userId: user.id,
        productName: "AirPods Max",
        status: "Delayed",
        trackingId: "TRK-DELAYED-8899",
        expectedDelivery: "July 20, 2026",
      }
    });
    const paymentAirPods = await prisma.payment.create({
      data: {
        userId: user.id,
        orderId: orderAirPods.id,
        amount: 549.00,
        status: "Succeeded"
      }
    });
    await prisma.invoice.create({
      data: {
        paymentId: paymentAirPods.id,
        amount: 549.00
      }
    });

    // Seed Order 4: iPhone 15 Pro Max (Cancelled)
    const orderIPhone = await prisma.order.create({
      data: {
        userId: user.id,
        productName: "iPhone 15 Pro Max",
        status: "Cancelled",
        trackingId: "TRK-CANCELLED-1002",
        expectedDelivery: "Cancelled",
      }
    });
    const paymentIPhone = await prisma.payment.create({
      data: {
        userId: user.id,
        orderId: orderIPhone.id,
        amount: 1199.00,
        status: "Refunded"
      }
    });
    await prisma.invoice.create({
      data: {
        paymentId: paymentIPhone.id,
        amount: 1199.00
      }
    });

    // Seed Order 5: Leather Case (Processing, Eligible for Cancellation)
    const orderCase = await prisma.order.create({
      data: {
        userId: user.id,
        productName: "Leather Case",
        status: "Processing",
        trackingId: "TRK-CASE-4500",
        expectedDelivery: "July 16, 2026",
      }
    });
    const paymentCase = await prisma.payment.create({
      data: {
        userId: user.id,
        orderId: orderCase.id,
        amount: 149.99,
        status: "Succeeded"
      }
    });
    await prisma.invoice.create({
      data: {
        paymentId: paymentCase.id,
        amount: 149.99
      }
    });

    // Seed Conversation 1: Login Issues
    const conv1 = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: "Login Issues",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      }
    });
    await prisma.message.createMany({
      data: [
        {
          conversationId: conv1.id,
          role: "user",
          content: "Hey, I had some trouble logging in yesterday. Is there a password policy?",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 1000),
        },
        {
          conversationId: conv1.id,
          role: "assistant",
          content: "[Routed to: SUPPORT] Hello! I'm sorry to hear you had trouble logging in. Passwords must be at least 8 characters long and contain both letters and numbers. Let me know if you need to reset it!",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000),
        }
      ]
    });

    // Seed Conversation 2: Track AirPods Max
    const conv2 = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: "Track AirPods Max",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      }
    });
    await prisma.message.createMany({
      data: [
        {
          conversationId: conv2.id,
          role: "user",
          content: "Where is my AirPods Max order?",
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 1000),
        },
        {
          conversationId: conv2.id,
          role: "assistant",
          content: "[Routed to: ORDER] Your AirPods Max order is currently delayed. The estimated delivery date is July 20, 2026. Tracking number is TRK-DELAYED-8899.",
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 5000),
        }
      ]
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    try {
      await getUserDetails(user.id, true);
    } catch (err) {
      console.error("Cache update error in loginDemoUser:", err);
    }

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }, 201);

  } catch (error) {
    console.error("DEMO USER LOGIN ERROR:", error);
    return c.json({
      success: false,
      message: "Failed to set up demo session",
      error: String(error),
    }, 500);
  }
};