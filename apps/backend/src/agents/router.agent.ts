import { generateText } from "ai";
import { groq } from "../lib/groq.js";

import { orderAgent } from "./order.agent.js";
import { billingAgent } from "./billing.agent.js";
import { supportAgent } from "./support.agent.js";

export const routerAgent = async (message: string,previousMessages: any[],  conversationId: string) : Promise<Response>=> {
  const result = await generateText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are an AI intent classifier.

Classify the user query into ONLY ONE:

- ORDER
- BILLING
- SUPPORT

User message:
"${message}"

Return ONLY the category name.
`,
  });

  const intent = result.text.trim();

  if (intent === "ORDER") {
    return orderAgent(message);
  }

  if (intent === "BILLING") {
    return billingAgent();
  }

  return supportAgent();
};