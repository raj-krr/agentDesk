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
        name: user.name,
        email: user.email,
        totalConversations: user.conversations.length,
        totalOrders: user.orders.length,
        totalPayments: user.payments.length,
        recentOrders: user.orders.slice(0, 5).map(o => ({ productName: o.productName, status: o.status })),
        recentPayments: user.payments.slice(0, 5).map(p => ({ amount: p.amount, status: p.status })),
      }
    : null;

  const cleanHistory = previousMessages.slice(-5).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content.replace(/^(\[Routed to: [A-Z]+\]\s*)+/, ""),
  }));

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are a concise, direct, and helpful Customer Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff when answering specific support queries.
- If the user sends a simple greeting (e.g., "hello", "hi", "hey"), respond with a brief, friendly greeting and ask how you can help.
- Provide ONLY the required information.
- Refer back to previous messages in the conversation history if the user uses pronouns or reference words (like "that", "it", "then").
- NEVER output internal database UUIDs (e.g. "9ca395af-eb83-4ffc-8178-481280fc7e6d" or any other long alphanumeric identifiers). Under no circumstances should these be shown. Instead, refer to items by their names/details.
- Structure your response using clean, formatted bullet points when listing multiple items to make it easy to read. Do NOT list items in a single flat paragraph.
- Never make up account details. If information is not in the data, explain that you don't see it in their profile.
- Never expose sensitive info like tokens or password hashes.

User Details:
${JSON.stringify(userContext, null, 2)}

Conversation History:
${JSON.stringify(cleanHistory)}

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};