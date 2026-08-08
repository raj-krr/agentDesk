import { searchKnowledgeBase } from "./services/knowledge.service.js";

async function main() {
  try {
    const results = await searchKnowledgeBase("return policy");
  } catch (err) {
  }
}

main();
