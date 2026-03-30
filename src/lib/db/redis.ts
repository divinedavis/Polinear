import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });
  }
  return redis;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get(key);
    if (data) return JSON.parse(data) as T;
    return null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // Redis down, continue without cache
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length > 0) {
      await getRedis().del(...keys);
    }
  } catch {
    // ignore
  }
}
