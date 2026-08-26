import { streamText } from "ai";
import { groq } from "../lib/groq.js";
import { getUserDetails } from "../services/user.service.js";
import { searchKnowledgeBase } from "../services/knowledge.service.js";
import { retrievePolicyTool } from "../tools/retrieve-policy.tool.js";

export const supportAgent = async (
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

  const userContext = user
    ? {
        name: user.name,
        email: user.email,
        totalConversations: user.conversations.length,
        totalOrders: user.orders.length,
        totalPayments: user.payments.length,
        orders: user.orders.map((o: any) => ({
          productName: o.productName,
          price: o.payments && o.payments.length > 0 ? `$${o.payments[0].amount.toFixed(2)}` : "N/A",
          status: o.status,
          orderDate: formatDate(o.createdAt),
          deliveredDate: formatDate(o.deliveredAt),
        })),
        payments: user.payments.map((p: any) => ({
          amount: `$${p.amount.toFixed(2)}`,
          status: p.status,
          productName: p.order?.productName,
          paymentDate: formatDate(p.createdAt),
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
${results.map((r, i) => `
--- Policy ${i + 1}: ${r.title} (${r.category}) ---
${r.content}
`).join("")}

IMPORTANT: Use the above policy information to answer the user's question. Do NOT make up policy details.
`;
    }
  } catch (err) {
  }

  const systemPrompt = `
You are a concise, direct, and helpful Customer Support Assistant.

Style Rules:
- Keep your response short, direct, and concise. Avoid unnecessary conversational fluff when answering specific support queries.
- Speak naturally and professionally. Always refer to items strictly by their clean Product Name (e.g., "Sony WH-1000XM5" or "PlayStation 5"). NEVER output codes like "#ORD-BF918715" or raw database UUIDs.
- NEVER mention internal code variables, boolean flags, or JSON property names (e.g., "isEligibleReturn", "returnInitiatedDate", or "flag is false").
- If the user sends a simple greeting (e.g., "hello", "hi", "hey"), respond with a brief, friendly greeting and ask how you can help.
- Provide ONLY the required information.
- Refer back to previous messages in the conversation history if the user uses pronouns or reference words (like "that", "it", "then").
- Always format dates in clean, human-readable format (e.g., "Aug 5, 2026"). Never output raw ISO timestamps or milliseconds.
- Structure your response using clean, formatted bullet points when listing multiple items to make it easy to read. Do NOT list items in a single flat paragraph.
- Never make up account details. If information is not in the data, explain that you don't see it in their profile.
- Never expose sensitive info like tokens or password hashes.

${policyContext}

User Details:
${JSON.stringify(userContext, null, 2)}
`;

  const result = streamText({
    model: groq("openai/gpt-oss-120b"),
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