import { Hono } from 'hono'
import userRouter from "./routes/user.route.js";
import orderRouter from "./routes/order.route.js";
import chatRouter from './routes/chat.route.js';
import conversationRouter from './routes/conversation.route.js';
import paymentRouter from './routes/payment.route.js';
import { cors } from 'hono/cors';
import { prisma } from './db/prisma.js';
import { redis } from './lib/redis.js';
import { enablePgVector, seedKnowledgeBase } from "./services/knowledge.service.js";

export const app = new Hono()

app.use("*", cors({
  origin: "*",
}));

app.onError((err, c) => {
  return c.json(
    {
      success: false,
      message: err.message || "Internal Server Error",
      error: String(err),
    },
    500
  );
});

app.get('/', (c) => c.text('Backend is alive'))

app.get('/api/health', async (c) => {
  let dbStatus = "unknown";
  let redisStatus = "unknown";
  let hasError = false;

  // 1. Check Database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err: any) {
    dbStatus = `failed: ${err.message || err}`;
    hasError = true;
  }

  // 2. Check Redis connection
  try {
    if (redis) {
      await redis.ping();
      redisStatus = "connected";
    } else {
      redisStatus = "not configured (using memory fallback)";
    }
  } catch (err: any) {
    redisStatus = `failed: ${err.message || err}`;
    hasError = true;
  }

  return c.json(
    {
      status: hasError ? "error" : "ok",
      service: "agentDesk-backend",
      database: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    },
    hasError ? 500 : 200
  );
})

app.route("/api/users", userRouter);
app.route("/api/orders", orderRouter);
app.route("/api/chat", chatRouter);
app.route("/api/conversations", conversationRouter);
app.route("/api/payments", paymentRouter);

app.get("/api/test-convs", async (c) => {
  try {
    const convs = await prisma.conversation.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
    return c.json({ success: true, convs });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Temporary RAG diagnostic endpoint
app.get("/api/diagnose-rag", async (c) => {
  const { searchKnowledgeBase, generateEmbedding } = await import("./services/knowledge.service.js");
  const diagnostics: any = {};

  // 1. Count KB rows
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "KnowledgeBase"`);
    diagnostics.rowCount = count;
  } catch (err: any) {
    diagnostics.rowCountError = err.message;
  }

  // 2. Check embedding status
  try {
    const docs = await prisma.$queryRawUnsafe(
      `SELECT title, category, 
              CASE WHEN embedding IS NOT NULL THEN 'YES' ELSE 'NO' END as has_embedding
       FROM "KnowledgeBase"`
    );
    diagnostics.documents = docs;
  } catch (err: any) {
    diagnostics.documentsError = err.message;
  }

  // 3. Test embedding generation
  try {
    const emb = await generateEmbedding("return policy");
    diagnostics.embeddingTest = { success: true, dimensions: emb.length, sample: emb.slice(0, 3) };
  } catch (err: any) {
    diagnostics.embeddingTest = { success: false, error: err.message };
  }

  // 4. Test search with normal threshold
  try {
    const results = await searchKnowledgeBase("return policy", 3, 0.7);
    diagnostics.searchNormal = { found: results.length, results: results.map(r => ({ title: r.title, distance: r.distance })) };
  } catch (err: any) {
    diagnostics.searchNormal = { error: err.message };
  }

  // 5. Test search with wide threshold
  try {
    const results = await searchKnowledgeBase("return policy", 5, 2.0);
    diagnostics.searchWide = { found: results.length, results: results.map(r => ({ title: r.title, distance: r.distance })) };
  } catch (err: any) {
    diagnostics.searchWide = { error: err.message };
  }

  // 6. Raw distance check
  try {
    const emb = await generateEmbedding("return policy");
    const embStr = `[${emb.join(",")}]`;
    const raw = await prisma.$queryRawUnsafe(
      `SELECT title, (embedding <=> $1::text::vector) as distance
       FROM "KnowledgeBase"
       WHERE embedding IS NOT NULL
       ORDER BY distance ASC`,
      embStr
    );
    diagnostics.rawDistances = raw;
  } catch (err: any) {
    diagnostics.rawDistancesError = err.message;
  }

  return c.json(diagnostics);
});








