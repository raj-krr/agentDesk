import { streamText } from "ai";
import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";

export const supportAgent = async (
  message: string,
  userId: string,
  previousMessages: any[] = []
): Promise<Response> => {

  const user = await getUserDetails(userId);

  const userContext = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        totalConversations:
          user.conversations.length,
        totalOrders:
          user.orders.length,
        totalPayments:
          user.payments.length,
        recentOrders: user.orders.slice(0, 5),
        recentPayments: user.payments.slice(0, 5),
        recentConversations:
          user.conversations.slice(0, 5),
      }
    : null;

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are a concise, direct, and helpful Customer Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff, greetings, or filler sentences.
- Provide ONLY the required information.
- Refer back to previous messages in the conversation history if the user uses pronouns or reference words (like "that", "it", "then").
- Never make up account details. If information is not in the data, explain that you don't see it in their profile.
- Never expose sensitive info like tokens or password hashes.

User Details:
${JSON.stringify(userContext, null, 2)}

Conversation History:
${JSON.stringify(previousMessages)}

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};