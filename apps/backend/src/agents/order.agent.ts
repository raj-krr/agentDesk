import { streamText } from "ai";

import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";

export const orderAgent = async (
  message: string,
  userId: string,
  previousMessages: any[] = []
): Promise<Response> => {

  const user = await getUserDetails(userId);

  const context = user
    ? {
        name: user.name,
        email: user.email,
        orders: user.orders,
        payments: user.payments,
      }
    : null;

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are a concise, direct, and helpful Order Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff, greetings, or filler sentences.
- Provide ONLY the required information.
- Refer back to previous messages in the conversation history if the user uses pronouns or reference words (like "that", "it", "then").
- Do NOT expose internal database IDs (UUIDs). Only share tracking IDs or Invoice IDs if relevant.
- Never make up details; if an order or payment is not in the data, explain that you don't see it.

User Context:
${JSON.stringify(context, null, 2)}

Conversation History:
${JSON.stringify(previousMessages)}

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};