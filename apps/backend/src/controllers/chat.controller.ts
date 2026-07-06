import type { Context } from "hono";
import { generateText } from "ai";
import { groq } from "../lib/groq.js";
import { prisma } from "../db/prisma.js";
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

    // If the conversation title is default "New Conversation", generate a summary title
    if (conversation.title === "New Conversation") {
      try {
        const titleResult = await generateText({
          model: groq("llama-3.1-8b-instant"),
          prompt: `Generate a very short, concise, and clean summary of the following user query to be used as a chat conversation title.
Max 3-5 words. Do NOT wrap in quotes. Do NOT add a period. Do NOT include words like "Query:", "Title:", "Summary:", or "Conversation:".
User query: "${message}"`
        });
        const generatedTitle = titleResult.text.trim().replace(/^["']|["']$/g, '');
        
        // Update title in the database
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: generatedTitle },
        });
      } catch (err) {
        console.error("Failed to generate AI conversation title:", err);
      }
    }

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