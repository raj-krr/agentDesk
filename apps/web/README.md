# AgentDesk - Web Frontend Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-v16.2.6-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-v19.2.4-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-blue.svg)](https://www.typescriptlang.org/)
[![Backend Repository](https://img.shields.io/badge/Backend-AgentDesk%20Service-orange.svg)](../../apps/backend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AgentDesk Web** is the official user dashboard and interactive customer support interface for the AgentDesk platform. Built using Next.js 16 (App Router), React 19, and Tailwind CSS 4, AgentDesk Web delivers real-time chunked LLM response streaming, dynamic multi-agent intent badges, interactive in-chat action widgets, session history navigation, and an embedded developer testing sandbox.

> 🔗 **Monorepo Ecosystem**:
> - 🎨 **Frontend Web App (This App)**: [`apps/web`](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/web)
> - ⚙️ **Backend Service**: [`apps/backend`](file:///c:/Users/ASUS/Desktop/Project/agentDesk/apps/backend)

---

## 🎯 Full-Stack Context & Problem AgentDesk Frontend Solves

Delivering a seamless AI customer support experience on the web requires tackling major frontend UI and UX challenges:

1. **Janky Response Rendering & Long Delays**: Waiting for full LLM completion before displaying text creates poor user experience. AgentDesk Web solves this with **real-time Chunked Stream Decoding** using Fetch API `ReadableStream` for instant typing feedback.
2. **Opaque Agent Actions & Intent Confusion**: Users often wonder why an AI agent gives a specific response. AgentDesk Web parses agent intent tags (`[Routed to: ORDER]`, `[Routed to: BILLING]`, `[Routed to: SUPPORT]`) and renders visual **Intent Pills & Status Badges**.
3. **Complex Test Data Setup for QA**: Testing order tracking, payment disputes, or return windows usually requires tedious database manual entry. AgentDesk Web features an **Embedded Interactive Sandbox Panel** allowing developers and testers to seed realistic e-commerce scenarios in 1 click.
4. **Context Switching & History Management**: Managing multiple ongoing support tickets without losing chat state. AgentDesk Web provides a responsive **Conversation Sidebar** with automatic session title generation and persistent state loading.

---

## 🚀 Key Frontend Capabilities

### 1. 💬 Real-Time Chunked Streaming Chat Engine
- **ReadableStream Processor (`ChatMessages.tsx`)**: Consumes chunked text streams from the backend API, rendering text progressively without blocking the main UI thread.
- **Thinking & Typing Indicators**: Visual animated indicators that inform the user when the AI router is classifying intent or generating responses.

### 2. 🏷️ Dynamic Intent Badges & Interactive Widgets
- **Visual Intent Pills**: Automatically detects routed agent markers and renders clean, styled status badges (`[Routed to: ORDER]`, `[Routed to: BILLING]`, `[Routed to: SUPPORT]`).
- **In-Chat Action Components**: Embedded interactive buttons allowing users to directly initiate order returns, check delivery status, or view invoices without typing.

### 3. 🛠️ Embedded Developer & QA Sandbox Panel
- **Quick Preset Templates (`SandboxPanel.tsx`)**: 1-click seeding for common customer support test cases:
  - 🎧 **Delayed Order**: AirPods Max order marked as delayed with tracking ID.
  - ❌ **Cancelled Order**: iPhone 15 Pro Max with failed payment.
  - 💳 **Double Charge Dispute**: Leather Case order with failed double payment attempt.
  - 🔄 **Subscription Refund**: Cloud Storage order with pending refund.
  - ✅ **Return Eligible**: Sony XM5 headphones delivered 3 days ago.
  - ⏳ **Return Expired**: Apple Watch Ultra delivered 10 days ago (past 7-day limit).
- **Custom Data Creator**: Custom forms for crafting bespoke order statuses, tracking numbers, and delivery dates.

### 4. 🗂️ Conversation Session Sidebar
- **Auto-Generated Titles**: Dynamically updates session titles after the first AI exchange.
- **Session Navigation (`ConversationSidebar.tsx`)**: Switching between historical support threads, starting new chats, and user profile summaries.

### 5. 🔐 Authentication & Session Guarding
- **JWT Client Storage**: Manages tokens securely in `localStorage`.
- **Protected Routes**: Automatic redirection to `/auth/login` for unauthenticated requests and clean logout workflow.

---

## 🏗️ Frontend Architecture & Component Topology

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              AgentDesk Chat Dashboard Page                             │
│                                (`app/chat/page.tsx`)                                   │
│ ┌──────────────────────────┐  ┌──────────────────────────────────────────────────────┐ │
│ │   ConversationSidebar    │  │                   Main Chat Panel                    │ │
│ │ ┌──────────────────────┐ │  │ ┌──────────────────────────────────────────────────┐ │ │
│ │ │  Session List        │ │  │ │ ChatHeader (Title & User Profile)                │ │ │
│ │ ├──────────────────────┤ │  │ ├──────────────────────────────────────────────────┤ │ │
│ │ │  New Chat Button     │ │  │ │ ChatMessages (Streamed Bubbles & Intent Badges)  │ │ │
│ │ ├──────────────────────┤ │  │ ├──────────────────────────────────────────────────┤ │ │
│ │ │  User Badge          │ │  │ │ ChatInput (Form & Submit Controls)               │ │ │
│ │ └──────────────────────┘ │  │ └──────────────────────────────────────────────────┘ │ │
│ └──────────────────────────┘  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │ SandboxPanel Modal   │
                                │ (Data Seed Engine)   │
                                └──────────────────────┘
```

---

## 📊 State & Data Flow Summary

| Component | File Path | Responsibilities & Hooks |
| :--- | :--- | :--- |
| **Chat Page** | `app/chat/page.tsx` | Core container state; manages `conversations`, `selectedConversation`, `messages`, `sending` stream state, and sandbox open toggle. |
| **ChatMessages** | `components/chat/ChatMessages.tsx` | Message list renderer; parses markdown/intent tags, renders typing dots, intent badges, and action buttons. |
| **ChatInput** | `components/chat/ChatInput.tsx` | Message input form; auto-resizing text area, submit handlers, and disabled states. |
| **ConversationSidebar** | `components/conversation/ConversationSidebar.tsx` | Navigation drawer; lists active chats, creates new sessions, displays user credentials, triggers logout. |
| **SandboxPanel** | `components/sandbox/SandboxPanel.tsx` | Modal panel; handles quick preset seeding and custom mock order/payment creation. |

---

## 🔌 API Communication Reference

The web client communicates with the backend REST and Streaming API endpoints defined in `lib/`:

- **`fetchCurrentUser()`** (`lib/auth.ts`): Queries `GET /api/users/me` for user profile and order summary.
- **`sendMessage()`** (`lib/chat.ts`): Posts user message to `POST /api/chat` and returns a `ReadableStream`.
- **`getConversations()`** (`lib/conversation.ts`): Queries `GET /api/conversations`.
- **`createConversation()`** (`lib/conversation.ts`): Posts to `POST /api/conversations`.
- **`createMockOrder()`** (`lib/sandbox.ts`): Posts to `POST /api/orders` to seed test data.

---

## 📁 Source Code Directory Layout

```
apps/web/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx     # Login view
│   │   └── register/page.tsx  # Registration view
│   ├── chat/
│   │   └── page.tsx           # Primary chat dashboard & state hub
│   ├── user/
│   │   └── page.tsx           # User profile view
│   ├── globals.css            # Tailwind CSS 4 global styles
│   └── layout.tsx             # Root layout container
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx      # Chat input component
│   │   └── ChatMessages.tsx   # Message list & stream bubble component
│   ├── conversation/
│   │   └── ConversationSidebar.tsx # Sidebar navigation component
│   └── sandbox/
│       └── SandboxPanel.tsx   # Developer test data sandbox modal
├── lib/
│   ├── api.ts                 # Base fetch configuration & URL definitions
│   ├── auth.ts                # Client auth helpers & local storage manager
│   ├── chat.ts                # Streaming API communication client
│   ├── conversation.ts        # Conversation CRUD API wrapper
│   └── sandbox.ts             # Mock order & payment generation wrappers
├── .env.local                 # Local environment configuration
├── next.config.ts             # Next.js configuration
├── package.json               # Frontend dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **pnpm**: Package manager (`npm install -g pnpm`)
- **Backend Service**: Running AgentDesk Backend Service on `http://localhost:3001`

### 2. Environment Variables Configuration
Create a `.env.local` file in `apps/web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Installation & Run

```bash
cd apps/web

# Install dependencies
pnpm install

# Start Next.js development server
pnpm dev
```

Application starts at `http://localhost:3000`.

---

## 🎨 Pairing With Backend Repository

1. Ensure the **Backend Service** (`apps/backend`) is running on `http://localhost:3001`.
2. Open `http://localhost:3000` in your browser.
3. Register a new user account or log in.
4. Click the **🛠️ Sandbox** button in the header to seed test orders and test multi-agent support routing!

---

## 🐳 Docker & Production Build

To build the optimized Next.js production bundle:

```bash
pnpm build
pnpm start
```

---

## 📄 License
Licensed under the [MIT License](LICENSE).
