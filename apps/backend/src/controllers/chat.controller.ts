import type { Context } from "hono";

import { routerAgent }
from "../agents/router.agent.js";

import {
  saveMessage,
  getConversationMessages,
  getConversationById,
} from "../services/conversation.service.js";

export const sendMessage =
  async (c: Context) => {

    try {

      const body =
        await c.req.json();

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

      // Previous messages
      const previousMessages =
        await getConversationMessages(
          conversationId
        );

      // Get conversation
      const conversation =
        await getConversationById(
          conversationId
        );

      if (!conversation) {

        return c.json(
          {
            success: false,
            message:
              "Conversation not found",
          },
          404
        );
      }

      // Get stream from agent
      const stream =
        await routerAgent(
          message,
          previousMessages,
          conversationId,
          conversation.userId
        );

      let fullResponse = "";

      // Create streaming response
      return new Response(

        new ReadableStream({

          async start(controller) {

            const reader =
              stream.body?.getReader();

            const decoder =
              new TextDecoder();

            if (!reader) {

              controller.close();

              return;
            }

            while (true) {

              const {
                done,
                value,
              } =
                await reader.read();

              if (done) break;

              const chunk =
                decoder.decode(
                  value
                );

              // Save full response
              fullResponse += chunk;

              // Send chunk to frontend
              controller.enqueue(
                value
              );
            }

            // Save assistant message
            await saveMessage(
              conversationId,
              "assistant",
              fullResponse
            );

            controller.close();
          },
        }),

        {
          headers: {
            "Content-Type":
              "text/plain",
          },
        }
      );

    } catch (error) {

      console.error(error);

      return c.json(
        {
          success: false,
          message:
            "Something went wrong",
        },
        500
      );
    }
};