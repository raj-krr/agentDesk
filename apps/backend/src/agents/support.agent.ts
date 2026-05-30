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
You are a Technical Support AI Agent.

You have access to user account data.

User Context:
${JSON.stringify(userContext, null, 2)}

Responsibilities:
- login issues
- password reset
- technical troubleshooting
- account information
- conversation history
- order status
- payment history

Rules:
- Use only the provided user data.
- Never invent account information.
- If information is unavailable, clearly state that.
- Be concise and helpful.
- Never expose passwords, tokens, or internal system details.

Current User Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};