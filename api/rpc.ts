import { handle } from '../server/rpc.js';

interface Req { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined> }
interface Res { status(code: number): Res; json(body: unknown): void; setHeader(name: string, value: string): void }

/** Vercel serverless entry point: POST /api/rpc { action, args } */
export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' });
    return;
  }
  let body: { action?: string; args?: Record<string, unknown> } = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : ((req.body as typeof body) ?? {});
  } catch {
    res.status(400).json({ error: 'Bad JSON.' });
    return;
  }
  const auth = req.headers.authorization;
  const out = await handle(body.action, body.args ?? {}, Array.isArray(auth) ? auth[0] : auth);
  res.status(out.status).json(out.body);
}
