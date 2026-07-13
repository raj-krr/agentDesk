import { streamText } from "ai";

import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";

export const orderAgent = async (
  message: string,
  userId: string,
  previousMessages: any[] = []
): Promise<Response> => {

  const user = await getUserDetails(userId);

  const context = user
    ? {
        name: user.name,
        email: user.email,
        orders: user.orders.map((o: any) => {
          const isDelivered = o.status === "Delivered";
          const withinWindow = o.deliveredAt
            ? (Date.now() - new Date(o.deliveredAt).getTime()) / (1000 * 60 * 60 * 24) <= 7
            : false;
          const isEligibleReturn = isDelivered && withinWindow;
          const isEligibleCancel = o.status === "Processing" || o.status === "Pending";
          const showId = isEligibleReturn || isEligibleCancel;

          return {
            id: o.id,
            productName: o.productName,
            status: o.status,
            trackingId: o.trackingId,
            expectedDelivery: o.expectedDelivery,
            deliveredAt: o.deliveredAt,
            returnInitiatedAt: o.returnInitiatedAt,
            createdAt: o.createdAt,
            isEligibleReturn,
            isEligibleCancel,
          };
        }),
      }
    : null;

  console.log("=== DEBUG ORDER AGENT USER CONTEXT ===");
  console.log(JSON.stringify(context, null, 2));
  console.log("======================================");

  const cleanHistory = previousMessages.slice(-5).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content.replace(/^(\[Routed to: [A-Z]+\]\s*)+/, ""),
  }));

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),

    prompt: `
You are a concise and direct Order Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff.
- If the user sends a simple greeting (e.g., "hello", "hi"), respond with a brief greeting and ask how you can help.
- Refer back to previous messages in the conversation history if the user uses pronouns (like "that", "it").
- Use the 'createdAt' timestamp of the orders to identify the most recent (newest) order.
- CRITICAL SECURITY CONSTRAINT: Under no circumstances should you write, list, or print a raw database UUID (e.g., "8c0fa209-8ce6-...") inside any visible text, bullet points, names, or descriptions. The ONLY place you are allowed to output a UUID is inside the button trigger bracket tags (e.g., [Cancel Order: ORDER_UUID for PRODUCT_NAME]). Never write UUIDs outside the brackets.
- Structure your response using clean, formatted bullet points when listing items. Do NOT list items in a single flat paragraph.
- Never make up details; if an order is not in the data, explain that you don't see it.

Return & Cancellation Button Rules:
- For any order in the User Context, look at "isEligibleReturn" and "isEligibleCancel" flags to determine eligibility.
- Under no circumstances should you generate a button trigger [Return Order: ...] or [Cancel Order: ...] if the corresponding "isEligibleReturn" or "isEligibleCancel" is false. If they are false, the order is INELIGIBLE. Explain why it is not eligible and do NOT output any button trigger.
- When listing eligible orders:
  - If "isEligibleReturn" is true, output the button trigger: \`[Return Order: ORDER_UUID for PRODUCT_NAME]\` (replace ORDER_UUID and PRODUCT_NAME with actual values from the order).
  - If "isEligibleCancel" is true, output the button trigger: \`[Cancel Order: ORDER_UUID for PRODUCT_NAME]\` (replace ORDER_UUID and PRODUCT_NAME with actual values from the order).
- If the user asks to return or cancel orders, list ONLY the eligible ones along with their buttons. If none of the user's orders are eligible, explain politely: "None of your orders are currently eligible for return or cancellation."
- If the user asks about an order already in "Return Initiated" status, mention that the return has been initiated, pickup is scheduled 2 days after returnInitiatedAt, and refund will complete after pickup. Do NOT output a return button for it.

User Context:
${JSON.stringify(context, null, 2)}

Conversation History:
${JSON.stringify(cleanHistory)}

User's Message:
"${message}"
`,
  });

  return result.toTextStreamResponse();
};