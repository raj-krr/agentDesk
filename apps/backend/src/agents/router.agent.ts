import { generateText } from "ai";
import { groq } from "../lib/groq.js";

import { orderAgent } from "./order.agent.js";
import { billingAgent } from "./billing.agent.js";
import { supportAgent } from "./support.agent.js";

export const routerAgent = async (message: string, previousMessages: any[], conversationId: string, userId: string) : Promise<{ intent: string; response: Response; sources: string[] }> => {
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
- requests to track, cancel, or return specific orders (e.g. "where is my package", "cancel my order", "return my phone")
- shipping/delivery status of specific orders or order history inquiries

BILLING:
- requests about specific payments, refunds, invoices, subscription changes, or prices/costs of ordered products (e.g. "what is the price of that?", "how much did AirPods Max cost?", "what is the price?", "I need a refund")

SUPPORT:
- general policies, rules, timelines, windows, or procedures (e.g. "what is the return policy?", "what is the return window?", "standard shipping times", "refund policy rules", "cancellation guidelines")
- login problems, technical issues, password reset, or FAQs
- greetings and general chitchat

Examples:

User: "Where is my package?"
Answer: ORDER

User: "Why is delivery delayed?"
Answer: ORDER

User: "What is the price of that?"
Answer: BILLING

User: "How much did my AirPods Max cost?"
Answer: BILLING

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

  let agentResult: { response: Response; sources: string[] };
  if (intent === "ORDER") {
    agentResult = await orderAgent(message, userId, previousMessages);
  } else if (intent === "BILLING") {
    agentResult = await billingAgent(message, userId, previousMessages);
  } else {
    agentResult = await supportAgent(message, userId, previousMessages);
  }

  return { intent, response: agentResult.response, sources: agentResult.sources };
};