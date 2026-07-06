import { streamText } from "ai";

import { groq } from "../lib/groq.js";

import { getOrderTool } from "../tools/get-order.tool.js";

export const orderAgent = async (
  message: string,
  userId: string
): Promise<Response> => {

  const order = await getOrderTool(userId);

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

prompt: `
You are a warm, friendly, and natural Order Support Assistant.

Always respond in a natural, conversational, and helpful support voice. Avoid sounding like a rigid robot. 

Responsibilities:
- Answer the query using the order details below.
- Talk clearly, naturally, and concisely.
- Mention the tracking ID and shipment status only.
- Do NOT expose internal database IDs (UUIDs).

Order Details:
${JSON.stringify(order)}

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};