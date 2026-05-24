import type { Context } from "hono";

import { prisma }
  from "../db/prisma.js";

import {
  createConversation,
} from "../services/conversation.service.js";


// CREATE CONVERSATION
export const createNewConversation =
  async (c: Context) => {

    try {

      const body =
        await c.req.json();

      const { userId } = body;

      const conversation =
        await createConversation(userId);

      return c.json({
        success: true,
        conversation,
      });

    } catch (error) {

      return c.json(
        {
          success: false,
          message:
            "Failed to create conversation",
        },
        500
      );
    }
};


// GET SINGLE CONVERSATION
export const getConversationById =
  async (c: Context) => {

    try {

      const id =
        c.req.param("id");

      const conversation =
        await prisma.conversation.findUnique({
          where: {
            id,
          },

          include: {
            messages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

      return c.json({
        success: true,
        conversation,
      });

    } catch (error) {

      return c.json(
        {
          success: false,
          message:
            "Failed to fetch conversation",
        },
        500
      );
    }
};


// GET ALL CONVERSATIONS
export const getAllConversations =
  async (c: Context) => {

    try {

      const conversations =
        await prisma.conversation.findMany({
          orderBy: {
            createdAt: "desc",
          },
        });

      return c.json({
        success: true,
        conversations,
      });

    } catch (error) {

      return c.json(
        {
          success: false,
          message:
            "Failed to fetch conversations",
        },
        500
      );
    }
};


// UPDATE CONVERSATION TITLE
export const updateConversationTitle =
  async (c: Context) => {

    try {

      const id =
        c.req.param("id");

      const body =
        await c.req.json();

      const { title } = body;

      const conversation =
        await prisma.conversation.update({
          where: {
            id,
          },

          data: {
            title,
          },
        });

      return c.json({
        success: true,
        conversation,
      });

    } catch (error) {

      return c.json(
        {
          success: false,
          message:
            "Failed to update title",
        },
        500
      );
    }
};