# AgentDesk — Complete RAG Flow

## High-Level Overview

```mermaid
flowchart LR
    A["📄 policies.json\n(9 documents)"] -->|Seed once at startup| B["🧠 Embedding Model\n(MiniLM-L6-v2)"]
    B -->|384-dim vectors| C["🗄️ PostgreSQL\n+ pgvector"]

    D["👤 User Query"] -->|Runtime| E["🧠 Embedding Model"]
    E -->|Query vector| C
    C -->|Top 3 matches| F["🤖 LLM\n(Groq)"]
    F -->|Answer| G["👤 User"]
```

---

## Phase 1: Knowledge Base Seeding (One-Time at Startup)

This happens once when the server boots — populates the vector database with policy documents.

```mermaid
sequenceDiagram
    participant App as 🚀 App Startup<br/>(app.ts)
    participant KB as Knowledge Service
    participant EMB as Embedding Model<br/>(MiniLM-L6-v2 local)
    participant PG as PostgreSQL<br/>+ pgvector

    App->>KB: enablePgVector()
    KB->>PG: CREATE EXTENSION vector
    KB->>PG: CREATE TABLE "KnowledgeBase"<br/>(id, title, content, category, embedding vector(384))

    App->>KB: seedKnowledgeBase()
    KB->>KB: Read policies.json (9 documents)

    loop For each policy document
        KB->>EMB: generateEmbedding("Return Policy Customers can return...")
        EMB-->>KB: [0.032, -0.118, 0.045, ...] (384 floats)
        KB->>PG: INSERT INTO "KnowledgeBase"<br/>(title, content, category, embedding)
    end

    App->>KB: warmUpEmbeddingModel()
    Note over EMB: Pre-loads model so first<br/>user query is fast
```

### Source Files

| File | Role |
|------|------|
| [policies.json](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/data/policies.json) | 9 raw policy documents (Return, Cancellation, Shipping, Refund, Billing, Security, Escalation) |
| [knowledge.service.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/services/knowledge.service.ts) → [seedKnowledgeBase()](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/services/knowledge.service.ts#L103-L139) | Reads JSON, generates embeddings, inserts into pgvector |
| [knowledge.service.ts](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/services/knowledge.service.ts) → [enablePgVector()](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend/src/services/knowledge.service.ts#L142-L166) | Creates the pgvector extension and KnowledgeBase table |

### What Gets Stored

```
┌──────────────────────────────────────────────────────────────────┐
│                    KnowledgeBase Table (pgvector)                │
├──────────┬─────────────────┬──────────────┬─────────────────────┤
│ id (PK)  │ title           │ category     │ embedding           │
├──────────┼─────────────────┼──────────────┼─────────────────────┤
│ uuid-1   │ Return Policy   │ Return       │ [0.03, -0.11, ...]  │
│ uuid-2   │ Return Inelig.  │ Return       │ [0.05, -0.08, ...]  │
│ uuid-3   │ Cancellation    │ Cancellation │ [-0.02, 0.14, ...]  │
│ uuid-4   │ Shipping Info   │ Shipping     │ [0.07, -0.03, ...]  │
│ uuid-5   │ Delayed Order   │ Shipping     │ [0.01, 0.09, ...]   │
│ uuid-6   │ Refund Policy   │ General      │ [-0.04, 0.12, ...]  │
│ uuid-7   │ Payment Methods │ General      │ [0.06, -0.07, ...]  │
│ uuid-8   │ Account Security│ General      │ [0.02, 0.05, ...]   │
│ uuid-9   │ Escalation      │ General      │ [-0.01, 0.03, ...]  │
└──────────┴─────────────────┴──────────────┴─────────────────────┘
                              384 dimensions per vector
```

---

## Phase 2: Runtime Query Flow (Every User Message)

This is the full journey of a user question like *"What is the return policy?"*

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant FE as 🖥️ Frontend
    participant CC as Chat Controller
    participant R as Router Agent
    participant S as Support Agent
    participant LLM as 🤖 Groq LLM
    participant T as retrievePolicy Tool
    participant EMB as 🧠 Embedding Model
    participant Redis as ⚡ Redis Cache
    participant PG as 🗄️ pgvector

    U->>FE: "What is the return policy?"
    FE->>CC: POST /messages { message, conversationId }

    Note over CC: Step 1: Save & Route
    CC->>CC: Save user message to DB
    CC->>R: routerAgent(message, history)
    R->>LLM: Classify intent → "SUPPORT"
    R->>S: supportAgent(message, userId, history)

    Note over S: Step 2: Build Context & Stream
    S->>S: Fetch user details (name, email, orders, payments)
    S->>S: Build system prompt with user context
    S->>LLM: streamText({ prompt + tools: [retrievePolicy] })

    Note over LLM: Step 3: LLM Decides to Use Tool
    LLM-->>S: Tool Call: retrievePolicy({ query: "return policy" })

    Note over T: Step 4: RAG Retrieval
    T->>Redis: Check embedding cache for "return policy"
    alt Cache hit
        Redis-->>T: Cached embedding vector
    else Cache miss
        T->>EMB: generateEmbedding("return policy")
        EMB-->>T: [0.041, -0.092, 0.067, ...] (384 dims)
        T->>Redis: Cache embedding (TTL: 1 hour)
    end

    Note over PG: Step 5: Vector Similarity Search
    T->>PG: SELECT * FROM "KnowledgeBase"<br/>WHERE (embedding <=> query_vector) < 0.7<br/>ORDER BY distance ASC LIMIT 3
    PG-->>T: Top 3 closest policy documents

    T-->>LLM: { found: true, policies: [Return Policy, Return Ineligibility, Refund Policy] }

    Note over LLM: Step 6: LLM Synthesizes Answer
    LLM-->>S: "You can return delivered orders within 7 days..."
    S-->>CC: Streaming text response
    CC->>CC: Prepend "[Routed to: SUPPORT]"
    CC-->>FE: Stream chunks via ReadableStream
    CC->>CC: Save full response to DB
    FE-->>U: Display streamed answer
```

---

## Phase 3: Vector Search Details

### How Similarity Search Works

```mermaid
flowchart TD
    A["User Query: 'What is the return policy?'"] --> B["Generate Query Embedding"]
    B --> C["Query Vector: [0.041, -0.092, 0.067, ...]"]
    C --> D["Cosine Distance Search Against All 9 Stored Vectors"]

    D --> E["Calculate distance to each document"]

    E --> F["Return Policy → distance: 0.15 ✅"]
    E --> G["Return Ineligibility → distance: 0.28 ✅"]
    E --> H["Refund Policy → distance: 0.42 ✅"]
    E --> I["Cancellation Policy → distance: 0.55"]
    E --> J["Shipping Info → distance: 0.72 ❌"]
    E --> K["Account Security → distance: 0.89 ❌"]

    F --> L["Top 3 Results (distance < 0.7)"]
    G --> L
    H --> L

    style F fill:#51cf66,color:#fff
    style G fill:#51cf66,color:#fff
    style H fill:#51cf66,color:#fff
    style J fill:#ff6b6b,color:#fff
    style K fill:#ff6b6b,color:#fff
```

### Search Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Distance metric | Cosine (`<=>`) | Measures angle between vectors |
| Max distance | `0.7` | Filters out irrelevant docs (closer to 0 = more similar) |
| Limit | `3` | Returns top 3 most relevant documents |
| Vector dimensions | `384` | MiniLM-L6-v2 output size |

> [!NOTE]
> Relevance score shown to the LLM is `1 - distance`, so a distance of `0.15` becomes a relevance score of `0.850` (85% relevant).

---

## Component Map (File → Responsibility)

```mermaid
flowchart TB
    subgraph "📨 Request Layer"
        A["chat.controller.ts<br/>Receives message, saves, routes, streams back"]
    end

    subgraph "🧭 Routing Layer"
        B["router.agent.ts<br/>Classifies intent → ORDER / BILLING / SUPPORT"]
    end

    subgraph "🤖 Agent Layer"
        C["support.agent.ts<br/>Handles support queries with RAG tool"]
        D["order.agent.ts<br/>Handles order queries"]
        E["billing.agent.ts<br/>Handles billing queries"]
    end

    subgraph "🔧 Tool Layer"
        F["retrieve-policy.tool.ts<br/>Bridge between LLM and knowledge base"]
    end

    subgraph "📚 RAG Engine"
        G["knowledge.service.ts<br/>Embeddings + Vector Search + Seeding"]
    end

    subgraph "💾 Storage"
        H["PostgreSQL + pgvector<br/>KnowledgeBase table"]
        I["Redis<br/>Embedding cache"]
        J["MiniLM-L6-v2 (local)<br/>Embedding model"]
    end

    subgraph "📄 Data"
        K["policies.json<br/>9 policy documents"]
    end

    A --> B
    B --> C & D & E
    C --> F
    D --> F
    E --> F
    F --> G
    G --> H & I & J
    K -.->|Seeded at startup| G
```

---

## Key Design Decisions

| Decision | What | Why |
|----------|------|-----|
| **Local embedding model** | MiniLM-L6-v2 runs on the server, not via API | Zero cost, no API key needed, no network latency |
| **pgvector** | PostgreSQL extension for vector search | Reuses existing Postgres, no separate vector DB |
| **Redis caching** | Embedding vectors cached for 1 hour | Same queries don't re-compute embeddings |
| **LLM-controlled retrieval** | LLM decides WHEN to call the tool | Avoids unnecessary KB lookups for greetings/chitchat |
| **384 dimensions** | MiniLM-L6-v2 output size | Good balance of quality vs storage/speed |
| **Cosine distance < 0.7** | Relevance threshold | Prevents returning irrelevant documents |
| **Top 3 results** | Limit on returned docs | Keeps LLM context small and focused |
