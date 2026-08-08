# AgentDesk - Multi-Agent AI Backend Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Hono.js](https://img.shields.io/badge/Hono-v4.11.9-orange.svg)](https://hono.dev/)
[![Vercel AI SDK](https://img.shields.io/badge/AI--SDK-v6.0.191-black.svg)](https://sdk.vercel.ai/docs)
[![Groq LLM](https://img.shields.io/badge/Groq-Llama%203.1--8B-purple.svg)](https://groq.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue.svg)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v5.0-green.svg)](https://www.prisma.io/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis-red.svg)](https://upstash.com/)
[![Frontend Repository](https://img.shields.io/badge/Frontend-AgentDesk%20Web-blue.svg)](../../apps/web)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AgentDesk Backend** is an enterprise-grade, real-time AI customer support platform engineered to route, resolve, and manage automated e-commerce workflows. Powered by Hono.js on Node.js, Vercel AI SDK with Groq (`llama-3.1-8b-instant`), PostgreSQL `pgvector`, and Upstash Redis, AgentDesk Backend handles intelligent multi-agent intent routing, local 384-dimensional vector embedding generation, real-time streaming response generation, e-commerce order/billing governance, and self-healing system diagnostics.

> 🔗 **Monorepo Ecosystem**:
> - ⚙️ **Backend Service (This Service)**: [`apps/backend`](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend)
> - 🎨 **Frontend Web App**: [`apps/web`](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/web)

---

## 🎯 Full-Stack Context & Problem AgentDesk Backend Solves

Building a modern AI customer service platform introduces complex operational challenges that standard CRUD backends and naive single-prompt LLM wrappers cannot address:

1. **Prompt Overhead & Agent Hallucinations**: Sending huge system prompts with order tools, payment rules, and policy documents in a single LLM request causes high latency, token bloat, and agent confusion. AgentDesk Backend solves this with an **LLM Router Agent** (`router.agent.ts`) that classifies intent into dedicated domain sub-agents (**ORDER**, **BILLING**, **SUPPORT**).
2. **External Embedding API Costs & Cold-Start Latency**: Relying on external embedding providers (e.g. OpenAI Embeddings API) introduces network latency and recurring API billings. AgentDesk Backend runs a **local HuggingFace Transformers embedding pipeline** (`all-MiniLM-L6-v2`) inside Node.js, combined with PostgreSQL `pgvector` for zero-cost, high-speed cosine similarity RAG retrieval.
3. **Strict E-Commerce Business Logic Governance**: LLMs frequently fail at business rule verification (e.g., return window limits or refund eligibility). AgentDesk Backend implements deterministic state logic inside sub-agents (e.g., verifying if an order was delivered within 7 days before allowing return initiation).
4. **Resilient Vector & Session Caching**: Preventing redundant embedding calculations and database hits by caching vector representations and query results in Upstash Redis with a transparent in-memory fallback.

---

## 🚀 Key Backend Capabilities

### 1. 🤖 Multi-Agent Orchestration & Intent Router Engine
- **Router Agent (`router.agent.ts`)**: Fast intent classification using Groq's `llama-3.1-8b-instant` to categorize inbound queries into specialized sub-agents:
  - 📦 **ORDER Agent (`order.agent.ts`)**: Manages order tracking, status lookups, expected delivery dates, cancellation checks, and return window validations.
  - 💳 **BILLING Agent (`billing.agent.ts`)**: Handles payment verification, double-charge disputes, subscription management, and invoice lookup.
  - 🎧 **SUPPORT Agent (`support.agent.ts`)**: Executes RAG policy retrieval tools to answer general FAQs, shipping rules, and return policies accurately.

### 2. 🧠 Local RAG & PostgreSQL pgvector Subsystem
- **On-Device Embeddings (`knowledge.service.ts`)**: Generates normalized 384-dimensional vector embeddings locally using `@huggingface/transformers` (`Xenova/all-MiniLM-L6-v2`).
- **Zero Cold-Start Warmup**: Pre-loads the ONNX runtime model during server startup (`warmUpEmbeddingModel`) so initial queries suffer zero cold-start delay.
- **pgvector Cosine Search**: Executes high-speed vector similarity queries (`<=>` vector operator in PostgreSQL) with configurable distance thresholds.
- **Auto-Seeding Engine**: Automatically reads policy files (`policies.json`), computes vector embeddings, and populates the database on boot.

### 3. 🌊 Real-Time Response Streaming Controller
- **Hono Streaming Handler (`chat.controller.ts`)**: Delivers chunk-by-chunk streamed AI responses back to the web client using standard `ReadableStream`.
- **System Intent Injection**: Automatically injects classification tags (`[Routed to: ORDER]`) into the stream so the client can render real-time agent badges.

### 4. 🛍️ E-Commerce Workflow & Return Governance
- **Deterministic Return Validation**: Computes `deliveredAt` timestamps against strict 7-day windows before mutating order status to `RETURN_INITIATED`.
- **Status State Machine**: Enforces non-cancellable rules (e.g. preventing order cancellation if status is `Delivered` or `In Transit`).

### 5. 🛠️ Diagnostics & Caching Architecture
- **Upstash Redis Caching (`lib/redis.ts`)**: Caches generated embeddings and session data with seamless fallback to in-memory caching if Redis keys are unconfigured.
- **Diagnostic Endpoint (`/api/diagnose-rag`)**: Self-contained RAG health check analyzing vector counts, embedding generation, distance metrics, and search performance.

---

## 🏗️ Backend System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              AgentDesk Web Client (Next.js 16)                         │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│ │   Chat Interface     │  │    Sandbox Panel     │  │     Conversation History       │ │
│ └──────────┬───────────┘  └──────────┬───────────┘  └───────────────┬────────────────┘ │
└────────────┼─────────────────────────┼──────────────────────────────┼──────────────────┘
             │                         │                              │
             │ Streaming HTTP (SSE)    │ REST API (Fetch)             │ Data Seeding
             ▼                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          AgentDesk Backend Service (Hono.js)                           │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                       Router Agent (Intent Classification)                         │ │
│ └──────────────┬──────────────────────────┬──────────────────────────┬───────────────┘ │
│                │                          │                          │                 │
│                ▼                          ▼                          ▼                 │
│    ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐      │
│    │     Order Agent      │   │    Billing Agent     │   │    Support Agent     │      │
│    │ (Tracking & Returns) │   │(Invoices & Payments) │   │ (RAG Policy Search)  │      │
│    └──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘      │
└───────────────┼──────────────────────────┼──────────────────────────┼──────────────────┘
                │                          │                          │
                ▼                          ▼                          ▼
 ┌───────────────────────────┐  ┌───────────────────────────┐  ┌────────────────────────┐
 │ PostgreSQL + pgvector DB  │  │   Upstash Redis Cache     │  │ HuggingFace MiniLM-L6  │
 └───────────────────────────┘  └───────────────────────────┘  └────────────────────────┘
```

---

## 📊 Database Models (Prisma Schemas)

| Model | Source File | Description |
| :--- | :--- | :--- |
| **User** | `prisma/schema.prisma` | Stores user credentials (bcrypt hashed passwords), email, name, and timestamps. |
| **Conversation** | `prisma/schema.prisma` | Stores chat session metadata, titles, user references, and created dates. |
| **Message** | `prisma/schema.prisma` | Stores conversation history, message roles (`user` / `assistant`), and content. |
| **Order** | `prisma/schema.prisma` | Manages e-commerce products, tracking IDs, status (`Processing`, `Delivered`, `RETURN_INITIATED`), delivery, and return dates. |
| **Payment** | `prisma/schema.prisma` | Stores financial transaction logs, amounts, statuses (`Succeeded`, `Failed`, `Pending`), and order links. |
| **Invoice** | `prisma/schema.prisma` | Stores customer receipt records linked to payment IDs. |
| **KnowledgeBase** | `prisma/schema.prisma` | Stores ground-truth policy documents, titles, categories, and 384-dim `vector(384)` embeddings. |

---

## 🔌 API & Event Reference

### REST API Endpoints Overview
- **`POST /api/users/register`**: Register a new user account.
- **`POST /api/users/login`**: Authenticate user and issue JWT session token.
- **`GET /api/users/me`**: Retrieve current user profile and summary metrics.
- **`GET /api/conversations`**: Fetch all chat conversations for authenticated user.
- **`POST /api/conversations`**: Create a new conversation session.
- **`GET /api/conversations/:id`**: Fetch conversation message history.
- **`POST /api/chat`**: Main chat entrypoint; streams multi-agent LLM response chunks.
- **`GET /api/orders`**: Fetch user orders.
- **`POST /api/orders`**: Seed mock order for testing.
- **`POST /api/orders/:id/return`**: Initiate return for eligible delivered order.
- **`GET /api/payments`**: Fetch user payment records.
- **`GET /api/health`**: Comprehensive system health check (DB & Redis status).
- **`GET /api/diagnose-rag`**: RAG subsystem diagnostic inspection tool.

---

## 📁 Source Code Directory Layout

```
apps/backend/
├── prisma/
│   └── schema.prisma          # Prisma ORM Database Schemas & pgvector definition
├── src/
│   ├── agents/                # Multi-Agent Domain System
│   │   ├── router.agent.ts    # Intent classification router
│   │   ├── order.agent.ts     # Order tracking & return logic
│   │   ├── billing.agent.ts   # Payment & invoice resolution agent
│   │   └── support.agent.ts   # RAG policy search agent
│   ├── controllers/           # HTTP Request Controllers
│   │   ├── chat.controller.ts # Streaming chat handler
│   │   ├── conversation.controller.ts # Session CRUD controller
│   │   ├── order.controller.ts# Order management controller
│   │   ├── payment.controller.ts # Payment controller & sandbox generator
│   │   └── user.controller.ts # Authentication & user profile controller
│   ├── data/
│   │   └── policies.json      # Knowledge base seed dataset
│   ├── db/
│   │   └── prisma.ts          # Singleton Prisma client instance
│   ├── lib/                   # External Service Clients
│   │   ├── groq.ts            # Groq provider initialization
│   │   ├── redis.ts           # Upstash Redis client with fallback
│   │   └── xai.ts             # xAI provider setup
│   ├── middleware/
│   │   └── auth.middleware.ts # JWT authentication & route protector
│   ├── routes/                # Hono Router Definitions
│   ├── services/              # Core Business Logic Services
│   │   ├── knowledge.service.ts # pgvector, MiniLM pipeline & RAG search
│   │   ├── order.service.ts   # Order state transitions & return validation
│   │   ├── conversation.service.ts # Chat thread storage service
│   │   └── user.service.ts    # Password hashing & user CRUD
│   ├── tools/
│   │   └── retrieve-policy.tool.ts # Vercel AI SDK policy lookup tool
│   ├── app.ts                 # Hono app setup, CORS, routes & diagnostics
│   └── index.ts               # Entrypoint: Server start & RAG startup sequence
├── .env                       # Environment configuration
├── package.json               # Backend dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL**: PostgreSQL database with `pgvector` extension support
- **Groq API Key**: API Key from [Groq Console](https://console.groq.com/)
- **Upstash Redis (Optional)**: Redis REST URL and Token (falls back to memory)

### 2. Environment Variables Configuration
Create a `.env` file in `apps/backend/`:

```env
PORT=3001
NODE_ENV=development

# Database connection URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentdesk_db?schema=public

# Authentication secret
JWT_SECRET=your_jwt_secret_key_here

# Groq AI Provider
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional: Upstash Redis Caching
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### 3. Database Migration & Run

```bash
cd apps/backend

# Install dependencies
pnpm install

# Push database schema & generate Prisma client
pnpm db:push

# Start backend server in watch mode
pnpm dev
```

Backend server starts at `http://localhost:3001`.

---

## 🎨 Pairing With Frontend Repository

To run the complete system:

1. Launch the **Backend Service** on port `3001`.
2. Start the **Frontend Web App**:
   ```bash
   cd apps/web
   pnpm dev
   ```
3. Ensure `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` is set to `http://localhost:3001`.

---

## 🐳 Docker & Production Build

To compile and build the backend for production:

```bash
pnpm build
pnpm start
```

---

## 📄 License
Licensed under the [MIT License](LICENSE).
