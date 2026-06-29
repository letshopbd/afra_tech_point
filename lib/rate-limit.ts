// Simple in-memory rate limiter for local development
// In production, use Redis (Upstash) or a similar external store

type RateLimitData = {
  count: number;
  lastAttempt: number;
  blockedUntil: number;
};

const cache = new Map<string, RateLimitData>();

// STRICT SETTINGS
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return { allowed: true, remaining: MAX_ATTEMPTS, reset: 0 };
  }
  
  // Bypass rate limits for local area networks and loopback ONLY in development
  if (
    process.env.NODE_ENV !== "production" &&
    (ip.startsWith("192.168.") || 
     ip.startsWith("10.") || 
     ip.startsWith("172.") || 
     ip === "127.0.0.1" || 
     ip === "::1" || 
     ip === "::ffff:127.0.0.1")
  ) {
    return { allowed: true, remaining: MAX_ATTEMPTS, reset: 0 };
  }

  const data = cache.get(ip);

  if (!data) {
    return { allowed: true, remaining: MAX_ATTEMPTS, reset: 0 };
  }

  // If currently blocked
  if (now < data.blockedUntil) {
    return { allowed: false, remaining: 0, reset: data.blockedUntil };
  }

  // If block expired, reset
  if (now > data.blockedUntil && data.blockedUntil !== 0) {
    cache.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS, reset: 0 };
  }

  return { allowed: data.count < MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - data.count), reset: 0 };
}

export function recordFailure(ip: string) {
  const now = Date.now();
  const data = cache.get(ip) || { count: 0, lastAttempt: now, blockedUntil: 0 };

  data.count += 1;
  data.lastAttempt = now;

  if (data.count >= MAX_ATTEMPTS) {
    data.blockedUntil = now + BLOCK_DURATION;
    console.log(`[SECURITY] IP ${ip} BLOCKED for 30 minutes after ${data.count} failed attempts.`);
  }

  cache.set(ip, data);
}

export function recordSuccess(ip: string) {
  cache.delete(ip);
}
