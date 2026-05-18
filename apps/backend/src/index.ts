import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => c.text('Backend is alive'))

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    service: 'agentDesk-backend',
  })
)

serve({
  fetch: app.fetch,
  port: 3000,
})

console.log('🚀 Backend running on http://localhost:3000')
