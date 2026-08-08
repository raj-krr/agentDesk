import { tool } from "ai";
import { z } from "zod";
import { searchKnowledgeBase } from "../services/knowledge.service.js";
import * as fs from "fs";
import * as path from "path";

function logDebug(message: string) {
  try {
    fs.appendFileSync(
      path.resolve(process.cwd(), "agent_debug.log"),
      `[${new Date().toISOString()}] ${message}\n`
    );
  } catch (err) {}
}

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
  execute: async (args) => {
    // Deep diagnostic logging to understand what AI SDK actually passes
    logDebug(`=== TOOL EXECUTE RAW DIAGNOSTICS ===`);
    logDebug(`typeof args: ${typeof args}`);
    logDebug(`JSON.stringify(args): ${JSON.stringify(args)}`);
    logDebug(`Object.keys(args): ${JSON.stringify(Object.keys(args || {}))}`);
    logDebug(`args?.query: ${args?.query}`);
    logDebug(`(args as any)?.query: ${(args as any)?.query}`);
    logDebug(`=====================================`);

    // Extract query from whatever shape the SDK gives us
    let query = "";
    if (typeof args === "string") {
      query = args;
    } else if (args && typeof args === "object") {
      query = (args as any).query || (args as any).question || (args as any).searchQuery || "";
    }

    logDebug(`Final extracted query: "${query}"`);

    if (!query || query.trim().length === 0) {
      logDebug(`WARNING: Empty query after extraction, returning no results`);
      return {
        found: false,
        message: "No search query was provided. Please specify what policy information you need.",
      };
    }

    try {
      const results = await searchKnowledgeBase(query);
      logDebug(`searchKnowledgeBase successfully returned ${results.length} documents`);
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
      logDebug(`Error inside retrievePolicyTool: ${err.message}\nStack: ${err.stack}`);
      throw err;
    }
  },
});

