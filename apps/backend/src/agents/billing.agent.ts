import { streamText } from "ai";
import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";
import { searchKnowledgeBase } from "../services/knowledge.service.js";

export const billingAgent = async (
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

  const billingContext = user
    ? {
        name: user.name,
        email: user.email,
        payments: user.payments.map((p: any) => ({
          amount: `$${p.amount.toFixed(2)}`,
          status: p.status,
          paymentDate: formatDate(p.createdAt),
          productName: p.order?.productName,
          orderStatus: p.order?.status,
        })),
        orders: user.orders.map((o: any) => ({
          productName: o.productName,
          price: o.payments && o.payments.length > 0 ? `$${o.payments[0].amount.toFixed(2)}` : "N/A",
          status: o.status,
          orderDate: formatDate(o.createdAt),
        })),
      }
    : null;

  const cleanHistory = previousMessages.slice(-6).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content
      .replace(/^(\[Routed to: [A-Z]+\]\s*)+/, "")
      .replace(/\[RAG Sources:\s*[^\]]+\]/g, "")
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
You are a concise, direct, and helpful Billing Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff when answering specific support queries.
- Speak naturally and professionally. Always refer to items strictly by their clean Product Name (e.g., "Sony WH-1000XM5" or "PlayStation 5"). NEVER output codes like "#ORD-BF918715" or raw database UUIDs.
- NEVER mention internal code variables, boolean flags, or JSON property names (e.g., "isEligibleReturn", "returnInitiatedDate", or "flag is false").
- If the user sends a simple greeting (e.g., "hello", "hi", "hey"), respond with a brief, friendly greeting and ask how you can help.
- Provide ONLY the required information.
- Refer back to previous messages in the conversation history if the user uses pronouns or reference words (like "that", "it", "then").
- Always format dates in clean, human-readable format (e.g., "Aug 5, 2026"). Never output raw ISO timestamps or milliseconds.
- Structure your response using clean, formatted bullet points when listing multiple items to make it easy to read. Do NOT list items in a single flat paragraph.
- Never make up details; if an order or payment is not in the data, explain that you don't see it.
- Refund Policy: 
  * If an order's status is "Cancelled", the refund has been processed (the payment status is "Refunded").
  * If an order's status is "Return Initiated", the return is underway but the refund is not processed yet (the payment status is still "Succeeded"). Explain that the refund will be completed after the courier picks up the order. Reference the payment amount as the pending refund amount.

${policyContext}

Billing Context:
${JSON.stringify(billingContext, null, 2)}
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