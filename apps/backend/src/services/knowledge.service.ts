import { prisma } from "../db/prisma.js";
import { cacheGet, cacheSet } from "../lib/redis.js";
import * as path from 'path';
import * as fs from 'fs';

// Clean environment variables that could cause HuggingFace auth failures
delete process.env.HF_TOKEN;
delete process.env.HUGGING_FACE_HUB_TOKEN;
delete process.env.HUGGINGFACE_CO_TOKEN;
delete process.env.HF_API_KEY;
delete process.env.HF_API_TOKEN;

// Resolve local model directory path dynamically
let cacheDir = path.resolve(process.cwd(), ".cache");
if (!fs.existsSync(cacheDir)) {
  cacheDir = path.resolve(process.cwd(), "apps/backend/.cache");
}
const modelDir = path.join(cacheDir, "Xenova/all-MiniLM-L6-v2");

// ── Singleton embedding pipeline ──────────────────────────────────
let embeddingPipeline: any = null;

async function getEmbeddingPipeline(): Promise<any> {
  if (!embeddingPipeline) {
    const moduleName = "@huggingface/transformers";
    const { pipeline, env } = await import(moduleName);
    
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.localModelPath = cacheDir;
    
    embeddingPipeline = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      quantized: true,
    });
  }
  return embeddingPipeline;
}

/** Pre-load the model so the first user query doesn't pay cold-start cost */
export async function warmUpEmbeddingModel(): Promise<void> {
  await getEmbeddingPipeline();
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const safeText = typeof text === "string" ? text : "";
  // Check cache first
  const cacheKey = `emb:${safeText.slice(0, 100)}`;
  try {
    const cached = await cacheGet(cacheKey);
    if (cached) return cached as number[];
  } catch (_) {}

  const pipe = await getEmbeddingPipeline();
  const output = await pipe(safeText, { pooling: "mean", normalize: true });

  // output.data is a Float32Array — convert to plain number[]
  const embedding = Array.from(output.data as Float32Array);

  // Cache for 1 hour
  try {
    await cacheSet(cacheKey, embedding, 3600);
  } catch (_) {}

  return embedding;
}

// ── Vector search ─────────────────────────────────────────────────
export interface KBSearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  distance: number;
}

export async function searchKnowledgeBase(
  query: string,
  limit: number = 3,
  maxDistance: number = 1.2,
): Promise<KBSearchResult[]> {
  try {
    const embedding = await generateEmbedding(query);
    const embeddingStr = `[${embedding.join(",")}]`;

    const results: KBSearchResult[] = await prisma.$queryRawUnsafe(
      `SELECT id, title, content, category,
              (embedding <=> $1::text::vector) as distance
       FROM "KnowledgeBase"
       WHERE embedding IS NOT NULL
         AND (embedding <=> $1::text::vector) < $2
       ORDER BY distance ASC
       LIMIT $3`,
      embeddingStr,
      maxDistance,
      limit,
    );

    if (results && results.length > 0) {
      return results;
    }
  } catch (err) {
  }

  // Fallback 1: Text search if vector search returns 0 results or fails
  try {
    const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    const keywords = cleanQuery.split(/\s+/).filter((w) => w.length > 3);
    
    let whereClause = "1=1";
    if (keywords.length > 0) {
      whereClause = keywords.map((k) => `title ILIKE '%${k}%' OR content ILIKE '%${k}%'`).join(" OR ");
    }

    const textResults: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, title, content, category, 0.5 as distance
       FROM "KnowledgeBase"
       WHERE ${whereClause}
       LIMIT $1`,
      limit
    );

    if (textResults && textResults.length > 0) {
      return textResults;
    }
  } catch (err) {
  }

  // Fallback 2: General top policy records
  try {
    const fallbackResults: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, title, content, category, 0.5 as distance
       FROM "KnowledgeBase"
       LIMIT $1`,
      limit
    );
    return fallbackResults || [];
  } catch (err) {
    return [];
  }
}

// ── Seeding ───────────────────────────────────────────────────────
export async function seedKnowledgeBase(): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");
  let policiesPath = path.resolve(process.cwd(), "src/data/policies.json");
  if (!fs.existsSync(policiesPath)) {
    policiesPath = path.resolve(process.cwd(), "apps/backend/src/data/policies.json");
  }
  const policies = JSON.parse(fs.readFileSync(policiesPath, "utf8"));

  for (const policy of policies) {
    try {
      const existing: any = await prisma.$queryRawUnsafe(
        `SELECT id FROM "KnowledgeBase" WHERE title = $1 LIMIT 1`,
        policy.title
      );

      const embedding = await generateEmbedding(`${policy.title} ${policy.content}`);
      const embeddingStr = `[${embedding.join(",")}]`;

      if (Array.isArray(existing) && existing.length > 0) {
        await prisma.$queryRawUnsafe(
          `UPDATE "KnowledgeBase" SET content = $1, category = $2, embedding = $3::text::vector WHERE title = $4`,
          policy.content,
          policy.category,
          embeddingStr,
          policy.title
        );
      } else {
        await prisma.$queryRawUnsafe(
          `INSERT INTO "KnowledgeBase" (id, title, content, category, embedding, "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4::text::vector, NOW())`,
          policy.title,
          policy.content,
          policy.category,
          embeddingStr,
        );
      }
    } catch (e) {}
  }
}

// ── Enable pgvector extension & Create Table ──────────────────────
export async function enablePgVector(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
  } catch (err: any) {
  }

  try {
    await prisma.$queryRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "KnowledgeBase" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "embedding" vector(384),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
      );
    `);
  } catch (err: any) {
  }
}
