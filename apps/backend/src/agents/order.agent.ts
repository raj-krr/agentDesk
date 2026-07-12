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
            id: showId ? o.id : undefined,
            productName: o.productName,
            status: o.status,
            trackingId: o.trackingId,
            expectedDelivery: o.expectedDelivery,
            deliveredAt: o.deliveredAt,
            returnInitiatedAt: o.returnInitiatedAt,
          };
        }),
      }
    : null;

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
- NEVER output internal database UUIDs (e.g. "9ca395af-eb83-4ffc-8178-481280fc7e6d" or any other long alphanumeric identifiers). Under no circumstances should these be shown. Instead, refer to orders by their product names (e.g., "your belt order").
- Structure your response using clean, formatted bullet points when listing multiple items (like orders or payments) to make it easy to read. Do NOT list items in a single flat paragraph.
- Never make up details; if an order or payment is not in the data, explain that you don't see it.

Return Policy & Cancellation Rules:
- CRITICAL SAFETY WARNING: Under no circumstances should you generate a button trigger [Return Order: ...] or [Cancel Order: ...] if the order has no "id" property in the User Context. If the "id" is undefined, the order is INELIGIBLE for that action (e.g. Shipped orders are not delivered yet, so they are not returnable; they are also past processing, so they are not cancelable). Explain why it is not eligible and do NOT output any button trigger tag. Never make up or hallucinate order IDs.
- Return Policy: Customers can return an order within 7 days of delivery.
- Return Process: When a return is initiated, a courier pickup is scheduled (expected within 2 days of initiation). The refund will be completed after the courier picks up the order.
- If the user asks to return or cancel an order (without specifying which one, or in general), do NOT ask them which one they want to act on. Instead, immediately list all of their orders that are eligible, and display the corresponding button next to each one:
  - For any order that is delivered and within the 7-day return window, output the exact trigger text: \`[Return Order: <orderId> for <productName>]\` next to its name.
  - For any order that is "Processing" or "Pending", output the exact trigger text: \`[Cancel Order: <orderId> for <productName>]\` next to its name.
  - Inform them they can click the button next to the order directly in the chat message to execute the return or cancellation.
- If NONE of the user's orders are eligible for return or cancellation, do NOT generate any button triggers at all. Explain politely that they currently have no orders eligible for return or cancellation.
- If they ask about returning or cancelling a specific order (by name):
  - If it's a return and it is eligible, output the exact trigger text: \`[Return Order: <orderId> for <productName>]\`.
  - If it's a cancellation and the status is "Processing" or "Pending", output the exact trigger text: \`[Cancel Order: <orderId> for <productName>]\`.
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