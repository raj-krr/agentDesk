import { streamText } from "ai";
import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";

export const billingAgent = async (
  message: string,
  userId: string
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
You are a warm, friendly, and natural Billing Support Assistant.

Always respond in a natural, conversational, and helpful support voice. Avoid sounding like a rigid robot.

You have access to the user's recent billing and payment history to help them:
Billing Context:
${JSON.stringify(billingContext, null, 2)}

Responsibilities:
- Help with refunds, invoices, subscriptions, payments, or billing problems.
- Keep responses concise, clear, and human-like.
- Refer to their payment history naturally (e.g., checking specific amounts, invoice details, succeeded/failed statuses).
- Never make up billing details; if something is not in the data, explain that you don't see it on their profile.

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};