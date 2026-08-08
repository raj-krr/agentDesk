# Implementation Plan - Phase 2: Production-Grade RAG (Knowledge Base via pgvector)

This phase moves company policy rules out of hardcoded agent system prompts and into a dynamic, semantic-searchable Knowledge Base. This ensures that the agents retrieve the most up-to-date business rules (e.g., return policies, cancellation eligibility, shipping times) directly from the database using vector search.

## User Review Required

> [!IMPORTANT]
> **Database Vector Extension**:
> - We will run `CREATE EXTENSION IF NOT EXISTS vector;` on the Supabase PostgreSQL database. Supabase natively supports `pgvector`, so this command will activate it immediately.
> - The Hono backend requires the `@huggingface/transformers` library (successor to `@xenova/transformers`) to compute 384-dimensional embeddings locally on the CPU using the lightweight `all-MiniLM-L6-v2` model. This is completely free and requires no external API keys.

> [!WARNING]
> **First-run cold boot**: The `all-MiniLM-L6-v2` model (~80MB) downloads on the very first startup. This adds ~10-15s to the initial boot. After that, the model is cached locally in `~/.cache/huggingface` and loads in ~1-2s.

> [!WARNING]
> **Agent refactor required**: All three agents currently use `streamText({ prompt: "..." })` (single string). To support tool calling with `maxSteps`, we must switch each agent to the `messages: [{ role, content }]` array format. This is a structural change to every agent file.

---

## Proposed Changes

### 1. Database & Schema Configuration

#### [MODIFY] [schema.prisma](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/prisma/schema.prisma)
- Add the `KnowledgeBase` model to the schema:
```prisma
model KnowledgeBase {
  id        String   @id @default(uuid())
  title     String
  content   String
  category  String   // "Return", "Cancellation", "Shipping", "General"
  embedding Unsupported("vector(384)")?
  createdAt DateTime @default(now())
}
```

#### [MODIFY] [package.json](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/package.json)
- Add `@huggingface/transformers` to dependencies (NOT `@xenova/transformers` which is deprecated).

---

### 2. Embedding & Search Services

#### [NEW] [knowledge.service.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/services/knowledge.service.ts)
- Create a service handling:
  - **Embedding Generation**: Local vectorization of text using `@huggingface/transformers` with the `all-MiniLM-L6-v2` model. Singleton pattern to avoid reloading the model on every request.
  - **Embedding Cache Layer**: Cache computed embeddings for frequent queries via the existing Redis/memory cache layer in [redis.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/lib/redis.ts) to avoid re-computing (~50-100ms per embedding call).
  - **Vector Cosine Similarity Search**: Query the database using a raw Prisma query with a **distance threshold cutoff** to avoid returning irrelevant results:
    ```typescript
    prisma.$queryRaw`
      SELECT id, title, content, category,
             (embedding <=> ${embedding}::vector) as distance
      FROM "KnowledgeBase"
      WHERE (embedding <=> ${embedding}::vector) < 0.7
      ORDER BY distance ASC
      LIMIT ${limit}
    `
    ```
    The `< 0.7` threshold ensures only semantically relevant policies are returned. Without this, every query would return results even if completely unrelated.

#### [NEW] [data/policies.json](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/data/policies.json)
- A standalone JSON data file containing all company policy documents to seed into the Knowledge Base. Keeps policy content separate from service logic for easy editing. Example structure:
```json
[
  {
    "title": "Return Policy",
    "content": "Customers can return delivered orders within 7 days of delivery...",
    "category": "Return"
  },
  {
    "title": "Cancellation Policy",
    "content": "Orders in Processing or Pending status can be cancelled...",
    "category": "Cancellation"
  }
]
```
- Policies to cover: Return windows, cancellation eligibility, shipping timelines, refund processing, payment methods, account security, escalation procedures.

#### [NEW] [scripts/seed-knowledge.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/scripts/seed-knowledge.ts)
- A dedicated seed script that:
  1. Reads policies from `data/policies.json`
  2. Generates vector embeddings for each document
  3. Inserts them into the `KnowledgeBase` table with embeddings
  4. Can be called from startup (auto-seed if table is empty) or manually via `npx tsx scripts/seed-knowledge.ts`

---

### 3. Agent Tool Integration & Refactor

#### [NEW] [tools/retrieve-policy.tool.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/tools/retrieve-policy.tool.ts)
- Define the `retrievePolicy` tool as a shared module used by all three agents:
```typescript
import { tool } from "ai";
import { z } from "zod";
import { searchKnowledgeBase } from "../services/knowledge.service.js";

export const retrievePolicyTool = tool({
  description: "Search the company knowledge base for official policies on returns, cancellations, refunds, shipping, billing, or account support. Use this when the user asks about rules, policies, or eligibility criteria.",
  parameters: z.object({
    query: z.string().describe("Natural language search query describing what policy information is needed."),
  }),
  execute: async ({ query }) => {
    const results = await searchKnowledgeBase(query);
    if (results.length === 0) {
      return { found: false, message: "No relevant policies found." };
    }
    return { found: true, policies: results };
  },
});
```

#### [MODIFY] [support.agent.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/agents/support.agent.ts)
#### [MODIFY] [order.agent.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/agents/order.agent.ts)
#### [MODIFY] [billing.agent.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/agents/billing.agent.ts)
- **Refactor from `prompt:` to `messages:` format** — Each agent currently passes a single `prompt` string to `streamText()`. We must refactor to:
```typescript
const result = streamText({
  model: groq("llama-3.1-8b-instant"),
  messages: [
    { role: "system", content: systemPrompt },
    ...cleanHistory,
    { role: "user", content: message },
  ],
  tools: { retrievePolicy: retrievePolicyTool },
  maxSteps: 3,
});
```
- This structural change is required because Vercel AI SDK tool calling only works with the `messages` array format, not the single `prompt` string.
- The system prompt content stays the same — it just moves from the `prompt` field into a `system` message.

---

### 4. Startup & Orchestration

#### [MODIFY] [index.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/index.ts)
- Add a startup sequence that runs after `serve()`:
  1. **Enable pgvector**: Execute `CREATE EXTENSION IF NOT EXISTS vector;` via `prisma.$queryRawUnsafe()`
  2. **Warm up embedding model**: Pre-load the transformer model so the first user query doesn't pay the cold-start penalty
  3. **Auto-seed Knowledge Base**: Check if the `KnowledgeBase` table is empty, and if so, run the seed script to populate it with vectorized policies

---

## Verification Plan

### Automated Verification
- Monitor backend console logs at startup to confirm:
  - `pgvector` extension enabled successfully
  - Transformer model loaded and cached
  - Knowledge Base seeded with N policy documents

### Manual Verification
- Open the chat and test policy-related questions:
  - *"What is your return policy?"* → Should trigger `retrievePolicy` tool → response cites the 7-day return window from the KB
  - *"Can I cancel a shipped order?"* → Should retrieve cancellation policy → explains shipped orders cannot be cancelled
  - *"How long do refunds take?"* → Should retrieve refund processing policy
- Verify that non-policy questions (e.g. *"Where is my AirPods Max order?"*) still work normally without triggering the tool unnecessarily
