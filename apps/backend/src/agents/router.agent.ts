import { generateText } from "ai";
import { groq } from "../lib/groq.js";

import { orderAgent } from "./order.agent.js";
import { billingAgent } from "./billing.agent.js";
import { supportAgent } from "./support.agent.js";

export const routerAgent = async (message: string,previousMessages: any[],  conversationId: string) : Promise<Response>=> {
  const result = await generateText({
    model: groq("llama-3.1-8b-instant"),

prompt: `
You are an AI router for a customer support platform.

Your task is to classify the user's intent into ONLY ONE category.

Categories:

ORDER:
- tracking package
- shipping updates
- delivery delays
- order status
- cancellations
- product ordered
- package arrival

BILLING:
- refunds
- invoices
- payments
- subscriptions
- charges
- pricing
- billing issues

SUPPORT:
- login problems
- technical issues
- password reset
- FAQs
- account help
- general support

Examples:

User: "Where is my package?"
Answer: ORDER

User: "Why is delivery delayed?"
Answer: ORDER

User: "I need a refund"
Answer: BILLING

User: "Payment failed"
Answer: BILLING

User: "I forgot my password"
Answer: SUPPORT

User: "App is not working"
Answer: SUPPORT

Conversation History:
${JSON.stringify(previousMessages)}

Current User Message:
"${message}"

Rules:
- Return ONLY one category
- No explanation
- No extra text
`,
  });

  const intent = result.text.trim();

  if (intent === "ORDER") {
    return orderAgent(message);
  }

if (intent === "BILLING") {
  return billingAgent(message);
}

return supportAgent(message);
};