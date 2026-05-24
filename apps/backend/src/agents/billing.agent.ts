import { streamText } from "ai";

import { groq } from "../lib/groq.js";

export const billingAgent = async (
  message: string
): Promise<Response> => {

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are a Billing Support AI Agent.

Responsibilities:
- help with refunds
- invoices
- subscriptions
- payments
- billing problems

Respond naturally and professionally.

User Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};