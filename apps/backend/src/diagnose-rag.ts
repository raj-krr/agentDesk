import { prisma } from "./db/prisma.js";
import { searchKnowledgeBase, generateEmbedding } from "./services/knowledge.service.js";

async function diagnose() {
  // 1. Check if KnowledgeBase table exists and has rows
  try {
    const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "KnowledgeBase"`);
  } catch (err: any) {
  }

  // 2. Check if embeddings are populated (not null)
  try {
    const withEmbeddings = await prisma.$queryRawUnsafe(
      `SELECT id, title, category, 
              CASE WHEN embedding IS NOT NULL THEN 'YES' ELSE 'NO' END as has_embedding
       FROM "KnowledgeBase"`
    );
  } catch (err: any) {
  }

  // 3. Test embedding generation
  try {
    const embedding = await generateEmbedding("return policy");
  } catch (err: any) {
  }

  // 4. Test vector search
  try {
    const results = await searchKnowledgeBase("return policy", 3, 0.7);
  } catch (err: any) {
  }

  // 5. Test with wider distance threshold
  try {
    const results = await searchKnowledgeBase("return policy", 5, 1.5);
  } catch (err: any) {
  }

  // 6. Raw vector query
  try {
    const embedding = await generateEmbedding("return policy");
    const embeddingStr = `[${embedding.join(",")}]`;
    const allDist = await prisma.$queryRawUnsafe(
      `SELECT title, category, (embedding <=> $1::text::vector) as distance
       FROM "KnowledgeBase"
       WHERE embedding IS NOT NULL
       ORDER BY distance ASC`,
      embeddingStr
    );
  } catch (err: any) {
  }

  await prisma.$disconnect();
  process.exit(0);
}

diagnose().catch((err) => {
  process.exit(1);
});
