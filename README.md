# AgentDesk - AI Multi-Agent Customer Support & RAG Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-v16.2.6-black.svg)](https://nextjs.org/)
[![Hono.js](https://img.shields.io/badge/Hono-v4.11.9-orange.svg)](https://hono.dev/)
[![Groq LLM](https://img.shields.io/badge/Groq-Llama%203.1--8B-purple.svg)](https://groq.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue.svg)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v5.0-green.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-v2.8.3-red.svg)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AgentDesk** is an enterprise-grade, full-stack AI customer support platform engineered to route, resolve, and automate complex e-commerce customer service workflows. Built as a high-performance Turborepo monorepo, AgentDesk combines a Next.js 16 / React 19 frontend with a Hono.js / TypeScript backend powered by Vercel AI SDK, Groq (`llama-3.1-8b-instant`), PostgreSQL `pgvector`, local HuggingFace 384-dim embeddings, and Upstash Redis.

> 🔗 **Monorepo Architecture**:
> - ⚙️ **Backend Service**: [`apps/backend`](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend) (Hono.js + Multi-Agent Router + pgvector RAG + Prisma)
> - 🎨 **Frontend Web App**: [`apps/web`](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/web) (Next.js 16 App Router + Streaming UI + Sandbox)

---

## 🎯 Full-Stack Context & Problem AgentDesk Solves

Building an automated AI customer support system introduces distinct technical and architectural challenges that standard backends and naive single-prompt LLM wrappers cannot manage:

1. **High LLM Latency & Agent Prompt Bloat**: Combining order tracking, refund rules, and policy documentation in one single system prompt causes huge context bloat and frequent agent hallucinations. AgentDesk solves this with an **LLM Router Agent Engine** (`router.agent.ts`) that classifies user intent into specialized sub-agents (**ORDER**, **BILLING**, **SUPPORT**).
2. **Expensive Embedding API & Cold-Start Delays**: External embedding services add network latency and recurring API costs. AgentDesk solves this with a **Zero-Cost Local HuggingFace Embedding Subsystem** (`all-MiniLM-L6-v2`) generating 384-dimensional vector embeddings on-device, coupled with PostgreSQL `pgvector` for instant cosine similarity searches.
3. **Strict E-Commerce Business Logic Governance**: LLMs often fail to enforce strict business policies (e.g. 7-day return windows or non-cancellable order states). AgentDesk Backend implements deterministic state machines inside sub-agents to compute timestamps and enforce business rules before mutating database states.
4. **Real-Time Stream Processing & Interactive QA Testing**: Waiting for complete LLM generation causes poor user experience, and testing complex order states requires tedious database seeding. AgentDesk Frontend streams chunked text responses in real-time (`ReadableStream`) and includes an **Embedded Interactive Sandbox** for 1-click test data seeding.

---

## 🚀 Key Capabilities

### 1. 🤖 Multi-Agent Orchestration & Intent Routing
- **LLM Intent Classifier**: Evaluates user prompts via Groq's `llama-3.1-8b-instant` model and dynamically routes queries to dedicated agents:
  - 📦 **ORDER Agent (`order.agent.ts`)**: Handles delivery tracking, expected arrival calculations, order cancellation logic, and 7-day return window enforcement.
  - 💳 **BILLING Agent (`billing.agent.ts`)**: Resolves payment verification, subscription changes, invoice lookups, and double-charge disputes.
  - 🎧 **SUPPORT Agent (`support.agent.ts`)**: Leverages RAG policy search tools (`retrievePolicy`) to answer shipping SLAs, return guidelines, and technical FAQs accurately.

### 2. 🧠 Local RAG & PostgreSQL pgvector Subsystem
- **On-Device Embeddings**: Uses `@huggingface/transformers` (`Xenova/all-MiniLM-L6-v2`) to produce normalized 384-dimensional vectors locally without third-party API dependencies.
- **Zero Cold-Start Preloading**: Pre-loads the ONNX runtime model during server initialization (`warmUpEmbeddingModel`).
- **pgvector Cosine Search**: Executes high-speed vector similarity queries (`<=>` vector operator) with strict distance filtering.
- **Auto-Seeding Pipeline**: Populates PostgreSQL with ground-truth company policies (`policies.json`) automatically on startup.

### 3. 🌊 Real-Time Response Streaming & Interactive Frontend UI
- **Chunked Stream Decoding**: Consumes backend `ReadableStream` chunks to render real-time assistant responses.
- **Dynamic Intent Badges**: Visual indicator pills (`[Routed to: ORDER]`, `[Routed to: BILLING]`, `[Routed to: SUPPORT]`) display which specialized sub-agent handled the request.
- **In-Chat Action Widgets**: Interactive message buttons allowing users to initiate order returns or view receipts directly.

### 4. 🛠️ Embedded E-Commerce Testing Sandbox
- **1-Click Test Preset Seeding**: Seeding instant test scenarios directly from the frontend (Delayed AirPods Max, Cancelled iPhone 15, Double Charge Dispute, Subscription Refund, Return-Eligible Sony XM5, and Expired Return Apple Watch).
- **Custom Order & Payment Form**: Developer tools to create custom mock orders with custom delivery dates and tracking IDs.

### 5. 🔐 Security, RBAC & Multi-Tenant Infrastructure
- **JWT Session Security**: Secure user authentication and route protection.
- **Upstash Redis Caching**: Caches vector embeddings and session data with in-memory fallback.
- **Turborepo Workspace Architecture**: High-speed parallelized build, lint, and development pipeline across monorepo packages.

---

## 🏗️ Full-Stack & Component Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              AgentDesk Web Client (Next.js 16)                         │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────────┐ │
│ │  Chat Interface & UI │  │    Sandbox Panel     │  │  Conversation History Sidebar  │ │
│ │ (Real-Time Streaming)│  │ (1-Click Mock Seed)  │  │   (Session State Management)   │ │
│ └──────────┬───────────┘  └──────────┬───────────┘  └───────────────┬────────────────┘ │
└────────────┼─────────────────────────┼──────────────────────────────┼──────────────────┘
             │                         │                              │
             │ Streaming SSE / Fetch   │ REST API Calls               │ Session Data
             ▼                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          AgentDesk Backend Service (Hono.js)                           │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                     Router Agent (LLM Intent Classifier)                           │ │
│ └──────────────┬──────────────────────────┬──────────────────────────┬───────────────┘ │
│                │                          │                          │                 │
│                ▼                          ▼                          ▼                 │
│    ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐      │
│    │     Order Agent      │   │    Billing Agent     │   │    Support Agent     │      │
│    │  (Order State Engine)│   │ (Payment Engine)     │   │  (RAG Vector Tool)   │      │
│    └──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘      │
└───────────────┼──────────────────────────┼──────────────────────────┼──────────────────┘
                │                          │                          │
                ▼                          ▼                          ▼
 ┌───────────────────────────┐  ┌───────────────────────────┐  ┌────────────────────────┐
 │ PostgreSQL + pgvector DB  │  │   Upstash Redis Cache     │  │ HuggingFace MiniLM-L6  │
 └───────────────────────────┘  └───────────────────────────┘  └────────────────────────┘
```

---

## 📊 Unified Database Models (Prisma Schemas)

| Model | Source File | Description |
| :--- | :--- | :--- |
| **User** | `apps/backend/prisma/schema.prisma` | Stores user credentials (hashed passwords), profile info, and relationships. |
| **Conversation** | `apps/backend/prisma/schema.prisma` | Manages chat session threads, user owners, and creation dates. |
| **Message** | `apps/backend/prisma/schema.prisma` | Stores chat logs, roles (`user` / `assistant`), and text content. |
| **Order** | `apps/backend/prisma/schema.prisma` | Manages products, tracking IDs, status (`Processing`, `Delivered`, `RETURN_INITIATED`), delivery, and return dates. |
| **Payment** | `apps/backend/prisma/schema.prisma` | Stores transaction amounts, status (`Succeeded`, `Failed`, `Pending`), and order references. |
| **Invoice** | `apps/backend/prisma/schema.prisma` | Billing receipt records linked to completed payments. |
| **KnowledgeBase** | `apps/backend/prisma/schema.prisma` | RAG policy table storing titles, content, categories, and 384-dim `vector(384)` embeddings. |

---

## 🔌 API & Socket/Streaming Event Reference

### REST & Streaming Endpoints Overview
- **`POST /api/users/register`**: Register a new user account.
- **`POST /api/users/login`**: Authenticate user & receive JWT token.
- **`GET /api/users/me`**: Fetch current user profile and active orders summary.
- **`GET /api/conversations`**: Fetch user conversation list.
- **`POST /api/conversations`**: Create new conversation thread.
- **`GET /api/conversations/:id`**: Fetch conversation message history.
- **`POST /api/chat`**: Send user prompt & stream AI agent chunked response (`ReadableStream`).
- **`GET /api/orders`**: Fetch user order records.
- **`POST /api/orders`**: Seed mock order for testing.
- **`POST /api/orders/:id/return`**: Initiate return for eligible delivered order.
- **`GET /api/payments`**: Fetch payment history.
- **`GET /api/health`**: Check backend, PostgreSQL, and Redis connections.
- **`GET /api/diagnose-rag`**: Run RAG subsystem diagnostics and vector distance check.

---

## 📁 Full-Stack Source Code Directory Layout

```
agentDesk/
├── apps/
│   ├── backend/               # Hono.js Backend Service
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Prisma Schemas & pgvector definition
│   │   ├── src/
│   │   │   ├── agents/        # Router, Order, Billing & Support Agents
│   │   │   ├── controllers/   # Streaming Chat & REST Controllers
│   │   │   ├── data/          # Policy seed dataset (`policies.json`)
│   │   │   ├── db/            # Singleton Prisma client
│   │   │   ├── lib/           # Groq LLM, Upstash Redis & xAI clients
│   │   │   ├── middleware/    # Auth JWT verifier middleware
│   │   │   ├── routes/        # Hono route definitions
│   │   │   ├── services/      # RAG vector search, Knowledge & Order services
│   │   │   ├── tools/         # Vercel AI SDK policy lookup tool
│   │   │   ├── app.ts         # Hono app configuration
│   │   │   └── index.ts       # Server entrypoint & RAG startup sequence
│   │   └── package.json
│   │
│   └── web/                   # Next.js 16 Web Dashboard App
│       ├── app/
│       │   ├── auth/          # Login & Register views
│       │   ├── chat/          # Primary Chat Page dashboard
│       │   └── layout.tsx     # Next.js root layout
│       ├── components/
│       │   ├── chat/          # ChatInput & ChatMessages stream view
│       │   ├── conversation/  # ConversationSidebar drawer
│       │   └── sandbox/       # Interactive Sandbox Panel modal
│       ├── lib/               # Auth, API fetch, chat streaming & sandbox client
│       └── package.json
│
├── packages/
│   ├── eslint-config/         # Shared ESLint configuration
│   └── typescript-config/     # Shared TypeScript configuration
├── package.json               # Root monorepo scripts & dependencies
├── pnpm-workspace.yaml        # PNPM workspace definition
└── turbo.json                 # Turborepo task pipeline configuration
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **pnpm**: v9.x or higher (`npm install -g pnpm`)
- **PostgreSQL Database**: With `pgvector` extension enabled
- **Groq API Key**: Obtain from [Groq Console](https://console.groq.com/)

### 2. Environment Variables Setup

#### Backend Environment (`apps/backend/.env`)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentdesk_db?schema=public
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=gsk_your_groq_api_key
```

#### Frontend Environment (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Monorepo Installation & Run

```bash
# Clone the repository
git clone https://github.com/raj-krr/agentDesk.git
cd agentDesk

# Install dependencies across all packages
pnpm install

# Push database schema & generate Prisma client
cd apps/backend
pnpm db:push
cd ../..

# Start both frontend and backend concurrently via Turborepo
pnpm dev
```

- Frontend opens at: `http://localhost:3000`
- Backend runs at: `http://localhost:3001`

---

## 🎨 Pairing Frontend & Backend

The frontend communicates with the backend via REST endpoints and chunked SSE streaming (`http://localhost:3001/api/chat`). Ensure both applications are running concurrently (`pnpm dev`).

---

## 🐳 Docker Deployment & Scripts

To run individual service builds:

```bash
# Build all workspaces with Turborepo
pnpm build

# Run type check across monorepo
pnpm check-types
```

---

## 📄 License
Licensed under the [MIT License](LICENSE).