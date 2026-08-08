import { streamText } from "ai";

import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";
import { searchKnowledgeBase } from "../services/knowledge.service.js";

export const orderAgent = async (
  message: string,
  userId: string,
  previousMessages: any[] = []
): Promise<{ response: Response; sources: string[] }> => {

  const user = await getUserDetails(userId);

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return undefined;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (_) {
      return String(dateStr);
    }
  };

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
          const price = o.payments && o.payments.length > 0 ? `$${o.payments[0].amount.toFixed(2)}` : "N/A";

          return {
            id: o.id, // Internal UUID - reserved strictly for button triggers [Return Order: ORDER_UUID for PRODUCT_NAME]
            productName: o.productName,
            price,
            status: o.status,
            trackingId: o.trackingId,
            expectedDelivery: o.expectedDelivery,
            deliveredDate: formatDate(o.deliveredAt),
            returnInitiatedDate: formatDate(o.returnInitiatedAt),
            orderDate: formatDate(o.createdAt),
            isEligibleReturn,
            isEligibleCancel,
          };
        }),
      }
    : null;

  const cleanHistory = previousMessages.slice(-6).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content
      .replace(/^(\[Routed to: [A-Z]+\]\s*)+/, "")
      .replace(/\[RAG Sources:\s*[^\]]+\]/g, "")
      .replace(/\s*\(#ORD-[A-Z0-9]+\)/g, "")
      .replace(/\s*\(Return option unavailable\)/gi, "")
      .replace(/\s*\(Cancel option unavailable\)/gi, "")
      .trim(),
  }));

  // Pre-fetch relevant policies from knowledge base (RAG)
  let policyContext = "";
  let sources: string[] = [];
  try {
    const results = await searchKnowledgeBase(message, 3, 1.2);
    if (results.length > 0) {
      sources = Array.from(new Set(results.map((r: any) => r.title)));
      policyContext = `
Relevant Company Policies (from knowledge base):
${results.map((r: any, i: number) => `
--- Policy ${i + 1}: ${r.title} (${r.category}) ---
${r.content}
`).join("")}
`;
    }
  } catch (err) {
  }

  const systemPrompt = `
You are a professional, direct, and helpful Order Support Specialist for AgentDesk.

Strict Output Rules:
- Speak naturally and professionally as a customer support agent.
- Always refer to products strictly by their clean Product Name. NEVER write internal codes like "#ORD-44565B85" or raw IDs in sentence text.
- NEVER write developer placeholders like "(Cancel option unavailable)" or "(Return option unavailable)".
- MANDATORY RULE: Whenever an item is eligible for cancellation (isEligibleCancel: true) or return (isEligibleReturn: true), you MUST append its exact bracket action button tag immediately next to the item name!

Interactive Action Button Tag Syntax:
- For cancellation: \`[Cancel Order: id for Product Name]\`
- For return: \`[Return Order: id for Product Name]\`
- Copy the exact "id" from User Context. Never generate action buttons for ineligible, cancelled, or returned orders.

FEW-SHOT EXAMPLES OF REQUIRED OUTPUT FORMAT:

Example 1 (User asks "which items I can cancel"):
Eligible for Cancellation:
• item3 [Cancel Order: 44565b85-eb83-4ffc-8178-481280fc7e6d for item3]

Not Eligible for Cancellation:
• iPhone 15 Pro Max (already cancelled)
• Sony WH-1000XM5 (already shipped)

Example 2 (User asks "which items I can return"):
Eligible for Return:
• AirPods Max [Return Order: 9ca395af-eb83-4ffc-8178-481280fc7e6d for AirPods Max]

Not Eligible for Return:
• Sony WH-1000XM5 (Return initiated — courier pickup scheduled within 2 business days)
• notebook (7-day return window expired)

${policyContext}

User Context:
${JSON.stringify(context, null, 2)}
`;

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),
    system: systemPrompt,
    messages: [
      ...cleanHistory,
      { role: "user", content: message }
    ],
  });

  return {
    response: result.toTextStreamResponse(),
    sources,
  };
};