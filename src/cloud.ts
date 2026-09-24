import type { Game, Look } from './game/types';
import type { Grave } from './game/storage';

/* ───────── Session ───────── */

const SESSION_KEY = 'everlife:session:v1';

export interface Session { token: string; username: string }

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Which life this device last played, per account. */
export const activeLifeKey = (username: string) => `everlife:active:${username}`;
export function getActiveLife(username: string) {
  try { return localStorage.getItem(activeLifeKey(username)); } catch { return null; }
}
export function setActiveLife(username: string, id: string | null) {
  try {
    if (id) localStorage.setItem(activeLifeKey(username), id);
    else localStorage.removeItem(activeLifeKey(username));
  } catch { /* ignore */ }
}

/* ───────── RPC ───────── */

export class RpcError extends Error {
  constructor(public status: number, message: string, public data?: unknown) { super(message); }
}

export async function rpc<T = unknown>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  const session = getSession();
  let res: Response;
  try {
    res = await fetch('/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}) },
      body: JSON.stringify({ action, args }),
    });
  } catch {
    throw new RpcError(0, 'Can’t reach the LunaLife servers. Check your connection.');
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string; data?: unknown };
  if (!res.ok) throw new RpcError(res.status, body.error ?? 'Something went wrong.', body.data);
  return body as T;
}

/* ───────── Shapes returned by the server ───────── */

export interface LifeSummary { name: string; age: number; alive: boolean; subtitle: string; look?: Look; gender?: string }

export interface LifeMeta extends LifeSummary {
  id: string;
  code?: string;
  owner: string;
  role: 'owner' | 'guest';
  /** What this player may do with the life. */
  can: 'view' | 'play';
  status?: 'pending' | 'view' | 'play';
  version: number;
  updatedAt: number;
  updatedBy: string;
}

export interface Overview { mine: LifeMeta[]; shared: LifeMeta[]; graves: Grave[] }
export interface AccessRequest { lifeId: string; lifeName: string; requester: string; at: number }
export interface ManageInfo { code: string; users: { username: string; status: 'pending' | 'view' | 'play' }[]; activity: { at: number; text: string }[] }

export function summarize(g: Game, subtitle: string): LifeSummary {
  return { name: `${g.firstName} ${g.lastName}`, age: g.age, alive: g.alive, subtitle, look: g.look, gender: g.gender };
}
