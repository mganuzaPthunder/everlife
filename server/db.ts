import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Minimal JSON key-value store. Upstash Redis in production, a local file in development. */
export interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

function upstash(url: string, token: string): KV {
  const call = async (command: unknown[]) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    const data = (await res.json()) as { result?: unknown; error?: string };
    if (data.error) throw new Error(`KV: ${data.error}`);
    return data.result;
  };
  return {
    async get<T>(key: string) {
      const raw = await call(['GET', key]);
      return raw == null ? null : (JSON.parse(String(raw)) as T);
    },
    async set(key, value, ttl) {
      await call(ttl ? ['SET', key, JSON.stringify(value), 'EX', ttl] : ['SET', key, JSON.stringify(value)]);
    },
    async del(key) {
      await call(['DEL', key]);
    },
  };
}

/** Dev-only store: one JSON file, writes serialized so nothing gets clobbered. */
function fileStore(file: string): KV {
  let data: Record<string, unknown> | null = null;
  let queue = Promise.resolve();
  const load = async () => {
    if (data) return data;
    try {
      data = JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, unknown>;
    } catch {
      data = {};
    }
    return data;
  };
  const flush = () => {
    queue = queue.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(data));
    });
    return queue;
  };
  return {
    async get<T>(key: string) {
      const d = await load();
      return key in d ? (structuredClone(d[key]) as T) : null;
    },
    async set(key, value) {
      const d = await load();
      d[key] = structuredClone(value);
      await flush();
    },
    async del(key) {
      const d = await load();
      delete d[key];
      await flush();
    },
  };
}

let kv: KV | null = null;

export function getKV(): KV {
  if (kv) return kv;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) kv = upstash(url, token);
  else if (process.env.VERCEL) throw new Error('DB_NOT_CONFIGURED');
  else kv = fileStore(path.join(process.cwd(), '.data', 'db.json'));
  return kv;
}
