/// <reference types="node" />
import { enablePgVector, seedKnowledgeBase } from "../src/services/knowledge.service.js";

async function main() {
  try {
    await enablePgVector();
    await seedKnowledgeBase();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();
