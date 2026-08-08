import * as nodeServer from '@hono/node-server';
import { app } from './app.js';
import { enablePgVector, warmUpEmbeddingModel, seedKnowledgeBase } from "./services/knowledge.service.js";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

nodeServer.serve({
  fetch: app.fetch,
  port: port,
});

// Run RAG startup sequence asynchronously to avoid blocking server binding
(async () => {
  try {
    await enablePgVector();
    await seedKnowledgeBase();
    await warmUpEmbeddingModel();
  } catch (error) {
  }
})();
// Reseed trigger: 34 master policies synced
