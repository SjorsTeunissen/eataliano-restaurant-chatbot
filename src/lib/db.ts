import { v4 as uuidv4 } from "uuid";
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

interface User {
  chatId: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Redis (production)
// ---------------------------------------------------------------------------
function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

// ---------------------------------------------------------------------------
// JSON file (local dev fallback)
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const JSON_PATH = path.join(DATA_DIR, "users.json");

function readJsonStore(): Record<string, User> {
  try {
    const raw = fs.readFileSync(JSON_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeJsonStore(data: Record<string, User>) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function registerUser(chatId: string): Promise<string> {
  const apiKey = uuidv4();
  const user: User = { chatId, createdAt: new Date().toISOString() };

  const redis = getRedis();
  if (redis) {
    await redis.set(`user:${apiKey}`, JSON.stringify(user));
  } else {
    const store = readJsonStore();
    store[apiKey] = user;
    writeJsonStore(store);
  }

  return apiKey;
}

export async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get<string>(`user:${apiKey}`);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw as unknown as User;
  } else {
    const store = readJsonStore();
    return store[apiKey] ?? null;
  }
}
