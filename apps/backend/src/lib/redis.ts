import { Redis } from "@upstash/redis";

// Initialize Redis only if variables exist
const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })
  : null;

// Fallback in-memory cache class
class MemoryCache {
  private store = new Map<string, { data: any; expiry: number }>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: any) {
    this.store.set(key, { data, expiry: Date.now() + this.TTL });
  }

  delete(key: string) {
    this.store.delete(key);
  }
}

const memoryCache = new MemoryCache();

export const cacheGet = async (key: string): Promise<any> => {
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : cached;
      }
    } catch (err) {
    }
  }

  // Fallback to memory cache
  const cached = memoryCache.get(key);
  return cached;
};

export const cacheSet = async (key: string, data: any, ttlSeconds: number = 300): Promise<void> => {
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
      return;
    } catch (err) {
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, data);
};

export const cacheDel = async (key: string): Promise<void> => {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (err) {
    }
  }

  // Fallback to memory cache
  memoryCache.delete(key);
};
