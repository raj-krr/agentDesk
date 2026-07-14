import { Hono } from 'hono'
import userRouter from "./routes/user.route.js";
import orderRouter from "./routes/order.route.js";
import chatRouter from './routes/chat.route.js';
import conversationRouter from './routes/conversation.route.js';
import paymentRouter from './routes/payment.route.js';
import { cors } from 'hono/cors';
import { prisma } from './db/prisma.js';
import { redis } from './lib/redis.js';

export const app = new Hono()

app.use("*", cors({
  origin: "*",
}));

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
