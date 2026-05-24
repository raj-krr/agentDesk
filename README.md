# AgentDesk 🚀  
### AI-Powered Multi-Agent Customer Support System

AgentDesk is a modern AI-powered customer support backend built using a **multi-agent architecture**.  
It intelligently routes user queries to specialized AI agents such as:

- 📦 Order Support Agent
- 💳 Billing Support Agent
- 🛠️ General Support Agent

The system uses:
- ⚡ Hono for backend APIs
- 🧠 AI SDK + Groq LLM for intelligent routing
- 🗄️ Prisma ORM + Supabase PostgreSQL
- 💬 Conversation memory system
- 🧩 Tool-based AI architecture

---

# ✨ Features

## 🤖 AI Multi-Agent Routing

The system intelligently classifies user intent and routes requests to the correct agent.

### Example:
- “Where is my package?” → Order Agent
- “Refund not received” → Billing Agent
- “I can't login” → Support Agent

---

## 📦 Order Tracking Agent

Fetches real order data from the database and responds naturally using AI.

### Example Response

```text
Your iPhone 15 order has been shipped successfully.

Tracking ID: TRK12345
```

---

## 🧠 Conversation Memory

Stores:
- conversations
- messages
- chat history

This allows contextual AI conversations.

### Example

```text
User: Track my order
AI: Your package has shipped

User: When will it arrive?
AI: It should arrive soon
```

---

## 🛠️ Tool-Based Architecture

Agents do not directly access the database.

### Architecture

```text
Agent → Tool → Service → Prisma → Database
```

This creates:
- scalable architecture
- clean separation
- reusable logic

---

## ⚡ Streaming-Ready AI Responses

Built with Vercel AI SDK streaming support for ChatGPT-like experiences.

---

# 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| Hono | Backend framework |
| TypeScript | Type safety |
| Prisma | ORM |
| Supabase | PostgreSQL database |
| Groq | LLM provider |
| Vercel AI SDK | AI orchestration |
| TurboRepo | Monorepo management |
| pnpm | Fast package manager |

---

# 🧱 Project Architecture

```text
Frontend
   ↓
Hono Backend
   ↓
Controllers
   ↓
Router Agent (LLM)
   ↓
Sub Agents
   ├── Order Agent
   ├── Billing Agent
   └── Support Agent
          ↓
Tools
          ↓
Services
          ↓
Prisma ORM
          ↓
Supabase PostgreSQL
```

---

# 📂 Folder Structure

```text
apps/
 ├── backend/
 │    ├── src/
 │    │    ├── agents/
 │    │    ├── controllers/
 │    │    ├── routes/
 │    │    ├── services/
 │    │    ├── tools/
 │    │    ├── db/
 │    │    ├── lib/
 │    │    └── index.ts
 │    │
 │    ├── prisma/
 │    └── package.json
 │
 └── web/ (frontend - upcoming)
```

---

# 🧠 AI Flow

```text
User Message
     ↓
Router Agent
     ↓
Intent Classification
     ↓
Sub-Agent Selection
     ↓
Tool Execution
     ↓
Database Query
     ↓
AI Response
```

---

# ⚙️ API Endpoints

## Health Check

```http
GET /api/health
```

---

## Get Users

```http
GET /users
```

---

## Get Orders

```http
GET /orders
```

---

## Create Conversation

```http
POST /conversations
```

### Request Body

```json
{
  "userId": "your-user-id"
}
```

---

## Send Chat Message

```http
POST /chat/messages
```

### Request Body

```json
{
  "message": "Track my order",
  "conversationId": "your-conversation-id"
}
```

---

# 🚀 Getting Started

## 1. Clone Repository

```bash
git clone <repo-url>
```

---

## 2. Install Dependencies

```bash
pnpm install
```

---

## 3. Setup Environment Variables

Create `.env`

```env
DATABASE_URL=your_supabase_url
GROQ_API_KEY=your_groq_api_key
```

---

## 4. Push Prisma Schema

```bash
pnpm prisma db push
```

---

## 5. Run Development Server

```bash
pnpm dev
```

---

# 📌 Future Improvements

- ✅ Frontend chat UI
- ✅ Real-time streaming UI
- ✅ Authentication
- ✅ Dynamic tool calling
- ✅ RAG integration
- ✅ Agent analytics
- ✅ Vector database memory
- ✅ Admin dashboard

---

# 👨‍💻 Author

Built with ❤️ by Raj Kumar

---

# 📜 License

MIT License