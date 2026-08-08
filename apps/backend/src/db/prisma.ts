import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env into process.env if not present
function loadEnv() {
  const possibleEnvPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "apps/backend/.env"),
    path.resolve(__dirname, "../../.env"),
  ];

  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [key, ...valParts] = trimmed.split("=");
            const keyName = key.trim();
            const val = valParts.join("=").trim().replace(/^["']|["']$/g, "");
            if (keyName && !process.env[keyName]) {
              process.env[keyName] = val;
            }
          }
        }
      } catch (_) {}
    }
  }
}

loadEnv();

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes("supabase.co") && !dbUrl.includes("sslmode=")) {
  dbUrl += dbUrl.includes("?") ? "&sslmode=require" : "?sslmode=require";
  process.env.DATABASE_URL = dbUrl;
}

export const prisma = new PrismaClient();