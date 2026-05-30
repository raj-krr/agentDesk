import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import userRouter from "./routes/user.route.js";
import orderRouter from "./routes/order.route.js";
import chatRouter from './routes/chat.route.js';
import conversationRouter from './routes/conversation.route.js';
import { cors } from 'hono/cors';
const app = new Hono()


app.use("*", cors({
  origin: "*",
}));
app.get('/', (c) => c.text('Backend is alive'))

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    service: 'agentDesk-backend',
  })
)
app.route("/api/users", userRouter);
app.route("/api/orders", orderRouter);
app.route("/api/chat", chatRouter); 
app.route("/api/conversations", conversationRouter);

serve({
  fetch: app.fetch,
  port: 3001,
})

console.log('🚀 Backend running on http://localhost:3001')
