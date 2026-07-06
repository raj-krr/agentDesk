import * as bcrypt from "bcrypt";
import { prisma } from "../db/prisma.js";

export const getUserProfile = async (
  userId: string
) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
};

export const getUserSupportContext = async (
  userId: string
) => {
  const user = await getUserDetails(userId);

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    totalConversations:
      user.conversations.length,
    totalOrders:
      user.orders.length,
    totalPayments:
      user.payments.length,
    conversations: user.conversations,
    orders: user.orders,
    payments: user.payments,
  };
};

export const getUserDetails = async (
  userId: string
) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,

      conversations: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      },

      orders: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          productName: true,
          status: true,
          trackingId: true,
          expectedDelivery: true,
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
          createdAt: true,
        },
      },

      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          amount: true,
          status: true,
          orderId: true,
          order: {
            select: {
              id: true,
              productName: true,
              status: true,
            },
          },
          createdAt: true,

          invoices: {
            select: {
              id: true,
              amount: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getUserByEmail = async (
  email: string
) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });
};

export const getUserById = async (
  userId: string
) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
};