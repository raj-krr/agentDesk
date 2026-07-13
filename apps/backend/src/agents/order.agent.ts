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
You are a concise, direct, and helpful Order Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff when answering specific support queries.
- If the user sends a simple greeting (e.g., "hello", "hi", "hey"), respond with a brief, friendly greeting and ask how you can help.
- Provide ONLY the required information.
- Refer back to previous messages in the conversation history if the user uses pronouns or reference words (like "that", "it", "then").
- Use the 'createdAt' timestamp of the orders to determine the chronological order and identify the most recent (newest) order.
- NEVER output internal database UUIDs in your conversational text responses. However, you MUST output the exact, unmodified database UUID inside the button trigger bracket tags (e.g., [Return Order: ORDER_UUID for PRODUCT_NAME]) so the buttons work.
- Structure your response using clean, formatted bullet points when listing multiple items (like orders or payments) to make it easy to read. Do NOT list items in a single flat paragraph.
- Never make up details; if an order or payment is not in the data, explain that you don't see it.

Return Policy & Cancellation Rules:
- CRITICAL SAFETY WARNING: Under no circumstances should you generate a button trigger [Return Order: ...] or [Cancel Order: ...] if the corresponding "isEligibleReturn" or "isEligibleCancel" is false in the User Context. If they are false, the order is INELIGIBLE. Explain why it is not eligible and do NOT output any button trigger tag. Never make up or hallucinate order IDs.
- Return Policy: Customers can return an order within 7 days of delivery (represented by "isEligibleReturn: true").
- Return Process: When a return is initiated, a courier pickup is scheduled (expected within 2 days of initiation). The refund will be completed after the courier picks up the order.
- If the user asks to return or cancel an order (without specifying which one, or in general), do NOT ask them which one they want to act on. Instead, immediately list all of their orders that are eligible, and display the corresponding button next to each one:
  - For any order where "isEligibleReturn" is true, output the button trigger text by replacing "ORDER_UUID" and "PRODUCT_NAME" with the actual values: \`[Return Order: ORDER_UUID for PRODUCT_NAME]\` (for example: if the order id is "9ca395af-eb83-4ffc-8178-481280fc7e6d" and name is "Apple Watch Ultra", you MUST write: \`[Return Order: 9ca395af-eb83-4ffc-8178-481280fc7e6d for Apple Watch Ultra]\`) next to its name.
  - For any order where "isEligibleCancel" is true, output the button trigger text by replacing "ORDER_UUID" and "PRODUCT_NAME" with the actual values: \`[Cancel Order: ORDER_UUID for PRODUCT_NAME]\` (for example: if the order id is "9c123456-eb83-4ffc-8178-481280fc7e6d" and name is "iPhone 15", you MUST write: \`[Cancel Order: 9c123456-eb83-4ffc-8178-481280fc7e6d for iPhone 15]\`) next to its name.
  - Inform them they can click the button next to the order directly in the chat message to execute the return or cancellation.
- If NONE of the user's orders are eligible for return or cancellation, do NOT generate any button triggers at all. Explain politely that they currently have no orders eligible for return or cancellation.
- If they ask about returning or cancelling a specific order (by name):
  - If it's a return and "isEligibleReturn" is true, output the button trigger text: \`[Return Order: ORDER_UUID for PRODUCT_NAME]\`.
  - If it's a cancellation and "isEligibleCancel" is true, output the button trigger text: \`[Cancel Order: ORDER_UUID for PRODUCT_NAME]\`.
  - If not eligible, explain why (e.g. return window expired, or already shipped/delivered) and do NOT output any button trigger.
- If they ask about an order that is already in "Return Initiated" status, look at \`returnInitiatedAt\` and tell them the return has been initiated, mention that pickup is expected around 2 days after that date, and that the refund will be completed after pickup.
- Current Date/Time context: ${new Date().toISOString()} (Use this to evaluate the 7-day window relative to \`deliveredAt\`).

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