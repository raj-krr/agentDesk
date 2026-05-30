import type { Context } from "hono";

import { routerAgent } from "../agents/router.agent.js";

import {
  saveMessage,
  getConversationMessages,
  getConversationById,
} from "../services/conversation.service.js";

export const sendMessage = async (
  c: Context
) => {
  try {

    const body =
      await c.req.json();

    const {
      message,
      conversationId,
    } = body;

    const user =
      c.get("user");

    // Verify conversation ownership first
    const conversation =
      await getConversationById(
        conversationId
      );

    if (
      !conversation ||
      conversation.userId !==
        user.userId
    ) {
      return c.json(
        {
          success: false,
          message:
            "Conversation not found",
        },
        404
      );
    }

    // Save user message
    await saveMessage(
      conversationId,
      "user",
      message
    );

    // Get previous messages
    const previousMessages =
      await getConversationMessages(
        conversationId
      );

    // Route to correct agent
    const stream =
      await routerAgent(
        message,
        previousMessages,
        conversationId,
        conversation.userId
      );

    let fullResponse = "";

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

            fullResponse +=
              chunk;

            controller.enqueue(
              value
            );
          }

          // Save AI response
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