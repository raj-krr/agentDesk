import { streamText } from "ai";
import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";

export const supportAgent = async (
  message: string,
  userId: string
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
You are a warm, friendly, and natural Customer Support Assistant. 

Please reply in a conversational, helpful, and human tone. Empathize with the user and speak naturally. Avoid robotic phrases like "based on your user context", "as an AI assistant", "system details", or "I have access to account data". Talk like a real person working in support.

You have access to the following account details to help the user:
User Details:
${JSON.stringify(userContext, null, 2)}

Responsibilities:
- Help with technical support, account information, login problems, or password resets.
- Refer to their details (like their name or history) naturally when appropriate.
- If they ask general questions or chit-chat, reply warmly and conversationally.
- Never make up account details. If information is not in the data, explain that you don't see it in their profile.
- Never expose sensitive info like tokens or password hashes.

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};