import type { Context } from "hono";

import { routerAgent } from "../agents/router.agent.js";

import {
  saveMessage,
  getConversationMessages,
} from "../services/conversation.service.js";

export const sendMessage = async (c: Context) => {
  try {
    const body = await c.req.json();

    const {
      message,
      conversationId,
    } = body;

    // Save user message
    await saveMessage(
      conversationId,
      "user",
      message
    );

    // Fetch previous conversation history
    const previousMessages =
      await getConversationMessages(
        conversationId
      );

    // Get streaming response from router agent
    const response = await routerAgent(
      message,
      previousMessages,
      conversationId,
    );

    // Return stream directly
    return response;

  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Something went wrong",
      },
      500
    );
  }
};