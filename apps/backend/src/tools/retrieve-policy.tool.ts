import { tool } from "ai";
import { z } from "zod";
import { searchKnowledgeBase } from "../services/knowledge.service.js";

/**
 * Shared `retrievePolicy` tool used by all agents.
 * The LLM decides when to call this based on the user's question.
 */
export const retrievePolicyTool = tool({
  description:
    "Search the company knowledge base for official policies on returns, cancellations, refunds, shipping, billing, or account support. Use this when the user asks about rules, policies, eligibility criteria, timelines, or procedures.",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "Natural language search query describing what policy information is needed.",
      ),
  }),
  execute: async (input: { query: string }) => {
    const query = input?.query || "";
    if (!query || query.trim().length === 0) {
      return {
        found: false,
        message: "No search query was provided. Please specify what policy information you need.",
      };
    }

    try {
      const results = await searchKnowledgeBase(query);
      if (results.length === 0) {
        return {
          found: false,
          message: "No relevant policies found in the knowledge base.",
        };
      }
      return {
        found: true,
        policies: results.map((r) => ({
          title: r.title,
          content: r.content,
          category: r.category,
          relevanceScore: (1 - r.distance).toFixed(3),
        })),
      };
    } catch (err: any) {
      throw err;
    }
  },
} as any);
