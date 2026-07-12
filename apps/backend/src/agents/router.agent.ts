import { generateText } from "ai";
import { groq } from "../lib/groq.js";

import { orderAgent } from "./order.agent.js";
import { billingAgent } from "./billing.agent.js";
import { supportAgent } from "./support.agent.js";

export const routerAgent = async (message: string, previousMessages: any[], conversationId: string, userId: string) : Promise<{ intent: string; response: Response }> => {
  const cleanHistory = previousMessages.slice(-3).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content.replace(/^(\[Routed to: [A-Z]+\]\s*)+/, ""),
  }));

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
- greetings and chitchat (e.g. hello, hi, hey, good morning, thanks)

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

User: "hello"
Answer: SUPPORT

User: "hi there"
Answer: SUPPORT

Conversation History:
${JSON.stringify(cleanHistory)}

Current User Message:
"${message}"

Rules:
- Return ONLY one category (ORDER, BILLING, or SUPPORT)
- If the message is a simple greeting, general chitchat, or does not clearly fit into ORDER or BILLING, classify it as SUPPORT.
- No explanation
- No extra text
`,
  });

  const rawIntent = result.text.toUpperCase().trim();
  let intent = "SUPPORT";
  if (rawIntent.includes("ORDER")) {
    intent = "ORDER";
  } else if (rawIntent.includes("BILLING")) {
    intent = "BILLING";
  }

  let response: Response;
  if (intent === "ORDER") {
    response = await orderAgent(message, userId, previousMessages);
  } else if (intent === "BILLING") {
    response = await billingAgent(message, userId, previousMessages);
  } else {
    response = await supportAgent(message, userId, previousMessages);
  }

  return { intent, response };
};