import { streamText } from "ai";
import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";

export const billingAgent = async (
  message: string,
  userId: string,
  previousMessages: any[] = []
): Promise<Response> => {

  const user = await getUserDetails(userId);

  const billingContext = user
    ? {
        name: user.name,
        email: user.email,
        payments: user.payments.map((p) => ({
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
          productName: p.order?.productName,
        })),
      }
    : null;

  const cleanHistory = previousMessages.slice(-5).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content.replace(/^(\[Routed to: [A-Z]+\]\s*)+/, ""),
  }));

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are a concise, direct, and helpful Billing Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff when answering specific support queries.
- If the user sends a simple greeting (e.g., "hello", "hi", "hey"), respond with a brief, friendly greeting and ask how you can help.
- Provide ONLY the required information.
- Refer back to previous messages in the conversation history if the user uses pronouns or reference words (like "that", "it", "then").
- NEVER output internal database UUIDs (e.g. "9ca395af-eb83-4ffc-8178-481280fc7e6d" or any other long alphanumeric identifiers). Under no circumstances should these be shown. Instead, refer to payments or orders by their names/details (e.g., "payment for your belt order").
- Structure your response using clean, formatted bullet points when listing multiple items to make it easy to read. Do NOT list items in a single flat paragraph.
- Never make up details; if an order or payment is not in the data, explain that you don't see it.

Billing Context:
${JSON.stringify(billingContext, null, 2)}

Conversation History:
${JSON.stringify(cleanHistory)}

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};