import { streamText } from "ai";

import { groq } from "../lib/groq.js";

import { getOrderTool } from "../tools/get-order.tool.js";

export const orderAgent = async (
  message: string
): Promise<Response> => {

  const order = await getOrderTool();

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

prompt: `
You are an Order Support AI Agent.

Your responsibilities:
- Answer clearly and naturally
- Be concise
- Use the provided order details
- Do NOT expose internal database IDs
- Mention tracking ID and shipment status only
- Sound like a professional customer support assistant

Order Details:
${JSON.stringify(order)}

User Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};