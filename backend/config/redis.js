const Redis = require("ioredis");

let client = null;

function getRedis() {
  if (client) return client;

  if (!process.env.REDIS_URL) {
    console.warn("[Redis] REDIS_URL not set — token blocklist disabled (logout won't invalidate tokens server-side)");
    return null;
  }

  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  client.on("connect",  () => console.log("[Redis] Connected"));
  client.on("error",    (e) => console.error("[Redis] Error:", e.message));

  return client;
}

// Blocklist helpers
async function blockToken(jti, ttlSeconds) {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set("bl:" + jti, "1", "EX", ttlSeconds);
  } catch (e) {
    console.error("[Redis] blockToken error:", e.message);
  }
}

async function isBlocked(jti) {
  const r = getRedis();
  if (!r) return false;
  try {
    const val = await r.get("bl:" + jti);
    return val === "1";
  } catch (e) {
    console.error("[Redis] isBlocked error:", e.message);
    return false;
  }
}

module.exports = { getRedis, blockToken, isBlocked };