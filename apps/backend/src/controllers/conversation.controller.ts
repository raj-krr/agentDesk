import type { Context } from "hono";

import {
  createConversation,
} from "../services/conversation.service.js";

export const createNewConversation =
  async (c: Context) => {

    try {

      const body = await c.req.json();

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
          message: "Failed to create conversation",
        },
        500
      );
    }
};