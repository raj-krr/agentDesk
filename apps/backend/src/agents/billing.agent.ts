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
        id: user.id,
        name: user.name,
        email: user.email,
        totalPayments: user.payments.length,
        recentPayments: user.payments.slice(0, 5),
      }
    : null;

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are a concise, direct, and helpful Billing Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff, greetings, or filler sentences.
- Provide ONLY the required information.
- Refer back to previous messages in the conversation history if the user uses pronouns or reference words (like "that", "it", "then").
- Do NOT expose internal database IDs (UUIDs).
- Never make up details; if an order or payment is not in the data, explain that you don't see it.

Billing Context:
${JSON.stringify(billingContext, null, 2)}

Conversation History:
${JSON.stringify(previousMessages)}

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};