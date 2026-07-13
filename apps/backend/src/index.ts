import { serve } from '@hono/node-server'
import { app } from './app.js';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

serve({
  fetch: app.fetch,
  port: port,
})

console.log(`🚀 Backend running on port ${port}`)
