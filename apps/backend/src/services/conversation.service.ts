import { prisma } from "../db/prisma.js";

export const getConversationById = async (
  conversationId: string
) => {
  return prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
  });
};

export const createConversation = async (userId: string) => {
  return prisma.conversation.create({
    data: {
      userId,
    },
  });
};

export const saveMessage = async (
  conversationId: string,
  role: string,
  content: string
) => {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
    },
  });
};

export const getConversationMessages = async (
  conversationId: string
) => {
  return prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};