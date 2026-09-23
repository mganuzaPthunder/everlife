import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getKV } from './db.js';

/* ───────── Types shared with the client (kept loose on purpose) ───────── */

export interface LifeSummary {
  name: string;
  age: number;
  alive: boolean;
  subtitle: string;
  look?: unknown;
  gender?: string;
}

interface Life {
  id: string;
  code: string;
  owner: string;
  version: number;
  game: unknown;
  summary: LifeSummary;
  updatedAt: number;
  updatedBy: string;
}

interface User { username: string; email?: string; salt: string; hash: string; createdAt: number }
type AccessLevel = 'pending' | 'view' | 'play';
type AccessMap = Record<string, AccessLevel>;
interface AccessRequest { lifeId: string; lifeName: string; requester: string; at: number }
interface ActivityEntry { at: number; text: string }

export interface RpcResult { status: number; body: unknown }

class HttpError extends Error {
  constructor(public status: number, message: string, public data?: unknown) { super(message); }
}

/* ───────── Helpers ───────── */

const SESSION_TTL = 60 * 60 * 24 * 180; // 180 days
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_GAME_BYTES = 1_500_000;

const k = {
  user: (u: string) => `user:${u}`,
  email: (e: string) => `email:${e}`,
  session: (t: string) => `session:${t}`,
  owned: (u: string) => `ulives:${u}`,
  shared: (u: string) => `ushared:${u}`,
  life: (id: string) => `life:${id}`,
  code: (c: string) => `code:${c}`,
  access: (id: string) => `access:${id}`,
  requests: (u: string) => `requests:${u}`,
  activity: (id: string) => `activity:${id}`,
  graves: (u: string) => `graves:${u}`,
};

const db = () => getKV();
const list = async <T>(key: string) => (await db().get<T[]>(key)) ?? [];
const hashPassword = (password: string, salt: string) => scryptSync(password, salt, 32).toString('hex');

function cleanUsername(raw: unknown) {
  const u = String(raw ?? '').trim().toLowerCase().replace(/^@/, '');
  if (!/^[a-z0-9_]{3,20}$/.test(u)) throw new HttpError(400, 'Usernames are 3–20 letters, numbers or underscores.');
  return u;
}

function cleanEmail(raw: unknown) {
  const e = String(raw ?? '').trim().toLowerCase();
  if (e.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw new HttpError(400, 'Please enter a valid email address.');
  return e;
}

function cleanPassword(raw: unknown) {
  const p = String(raw ?? '');
  if (p.length < 6 || p.length > 100) throw new HttpError(400, 'Passwords need at least 6 characters.');
  return p;
}

async function newSession(username: string) {
  const token = randomBytes(24).toString('hex');
  await db().set(k.session(token), { username }, SESSION_TTL);
  return { token, username };
}

async function authed(header: string | undefined) {
  const token = header?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please log in.');
  const s = await db().get<{ username: string }>(k.session(token));
  if (!s) throw new HttpError(401, 'Your session expired. Please log in again.');
  return { username: s.username, token };
}

async function newCode() {
  for (let i = 0; i < 20; i++) {
    const code = Array.from(randomBytes(6), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
    if (!(await db().get(k.code(code)))) return code;
  }
  throw new HttpError(500, 'Could not create a life code.');
}

async function getLife(id: string) {
  const life = await db().get<Life>(k.life(String(id)));
  if (!life) throw new HttpError(404, 'That life no longer exists.');
  return life;
}

async function role(u: string, life: Life): Promise<'owner' | 'play' | 'view' | null> {
  if (life.owner === u) return 'owner';
  const access = (await db().get<AccessMap>(k.access(life.id))) ?? {};
  return access[u] === 'play' ? 'play' : access[u] === 'view' ? 'view' : null;
}

/** `need: 'view'` lets watchers through; `need: 'play'` requires permission to make changes. */
async function mustAccess(u: string, life: Life, need: 'view' | 'play') {
  const r = await role(u, life);
  if (!r) {
    const access = (await db().get<AccessMap>(k.access(life.id))) ?? {};
    throw new HttpError(403, access[u] === 'pending' ? `Waiting for @${life.owner} to approve you.` : 'You no longer have access to this life.');
  }
  if (need === 'play' && r === 'view') throw new HttpError(403, `You can only watch this life. Ask @${life.owner} for permission to play.`);
  return r;
}

async function addActivity(lifeId: string, text: string) {
  const items = await list<ActivityEntry>(k.activity(lifeId));
  items.unshift({ at: Date.now(), text });
  await db().set(k.activity(lifeId), items.slice(0, 40));
}

async function pushUnique(key: string, value: string) {
  const items = await list<string>(key);
  if (!items.includes(value)) await db().set(key, [value, ...items]);
}

async function removeFrom(key: string, value: string) {
  const items = await list<string>(key);
  await db().set(key, items.filter((x) => x !== value));
}

function meta(life: Life, r: 'owner' | 'play' | 'view', status?: string) {
  return {
    id: life.id, code: r === 'owner' ? life.code : undefined, owner: life.owner,
    role: r === 'owner' ? 'owner' : 'guest', can: r === 'owner' ? 'play' : r, status,
    version: life.version, updatedAt: life.updatedAt, updatedBy: life.updatedBy, ...life.summary,
  };
}

function checkGame(game: unknown) {
  const size = JSON.stringify(game ?? null).length;
  if (!game || typeof game !== 'object') throw new HttpError(400, 'Missing game data.');
  if (size > MAX_GAME_BYTES) throw new HttpError(413, 'This life is too big to save.');
}

async function createLifeRecord(owner: string, id: string, game: unknown, summary: LifeSummary) {
  if (await db().get(k.life(id))) return getLife(id);
  const code = await newCode();
  const life: Life = { id, code, owner, version: 1, game, summary, updatedAt: Date.now(), updatedBy: owner };
  await db().set(k.life(id), life);
  await db().set(k.code(code), id);
  await pushUnique(k.owned(owner), id);
  return life;
}

async function destroyLife(life: Life) {
  const access = (await db().get<AccessMap>(k.access(life.id))) ?? {};
  for (const u of Object.keys(access)) await removeFrom(k.shared(u), life.id);
  const reqs = await list<AccessRequest>(k.requests(life.owner));
  await db().set(k.requests(life.owner), reqs.filter((r) => r.lifeId !== life.id));
  await removeFrom(k.owned(life.owner), life.id);
  await Promise.all([db().del(k.life(life.id)), db().del(k.code(life.code)), db().del(k.access(life.id)), db().del(k.activity(life.id))]);
}

/* ───────── Actions ───────── */

type Args = Record<string, unknown>;
type Action = (args: Args, auth: string | undefined) => Promise<unknown>;

const actions: Record<string, Action> = {
  async signup(a) {
    const username = cleanUsername(a.username);
    const email = cleanEmail(a.email);
    const password = cleanPassword(a.password);
    if (await db().get(k.user(username))) throw new HttpError(409, 'That username is taken. Try another!');
    if (await db().get(k.email(email))) throw new HttpError(409, 'That email already has an account. Try logging in!');
    const salt = randomBytes(16).toString('hex');
    await db().set(k.user(username), { username, email, salt, hash: hashPassword(password, salt), createdAt: Date.now() } satisfies User);
    await db().set(k.email(email), username);
    return { ...(await newSession(username)), email };
  },

  async login(a) {
    // Log in with a username or an email address.
    const id = String(a.username ?? '').trim().toLowerCase();
    const byEmail = /^[^@\s]+@[^@\s]+$/.test(id) ? await db().get<string>(k.email(id)) : null;
    if (id.includes('@') && !id.startsWith('@') && !byEmail) throw new HttpError(401, 'Wrong email or password.');
    const username = byEmail ?? cleanUsername(id);
    const user = await db().get<User>(k.user(username));
    const given = Buffer.from(hashPassword(String(a.password ?? ''), user?.salt ?? 'x'), 'hex');
    if (!user || !timingSafeEqual(given, Buffer.from(user.hash, 'hex'))) throw new HttpError(401, 'Wrong username or password.');
    return newSession(username);
  },

  async logout(_a, auth) {
    const { token } = await authed(auth);
    await db().del(k.session(token));
    return { ok: true };
  },

  /** Region + database round-trip, for diagnosing slowness. No secrets. */
  async health() {
    const t = Date.now();
    await db().get('health:ping');
    const first = Date.now() - t;
    const t2 = Date.now();
    await db().get('health:ping');
    return { region: process.env.VERCEL_REGION ?? 'local', dbMs: [first, Date.now() - t2] };
  },

  /** Permanently delete your account (password required). Your lives are deleted; tombstones too. */
  async deleteAccount(a, auth) {
    const { username, token } = await authed(auth);
    const user = await db().get<User>(k.user(username));
    const given = Buffer.from(hashPassword(String(a.password ?? ''), user?.salt ?? 'x'), 'hex');
    if (!user || !timingSafeEqual(given, Buffer.from(user.hash, 'hex'))) throw new HttpError(401, 'Wrong password.');
    for (const id of await list<string>(k.owned(username))) {
      const life = await db().get<Life>(k.life(id));
      if (life) await destroyLife(life);
    }
    for (const id of await list<string>(k.shared(username))) {
      const access = (await db().get<AccessMap>(k.access(id))) ?? {};
      delete access[username];
      await db().set(k.access(id), access);
    }
    await Promise.all([
      db().del(k.user(username)), db().del(k.owned(username)), db().del(k.shared(username)),
      db().del(k.requests(username)), db().del(k.graves(username)), db().del(k.session(token)),
      user.email ? db().del(k.email(user.email)) : Promise.resolve(),
    ]);
    return { ok: true };
  },

  async me(_a, auth) {
    const { username } = await authed(auth);
    const user = await db().get<User>(k.user(username));
    return { username, email: user?.email };
  },

  /** Everything the Lives screen needs in one go. */
  async overview(_a, auth) {
    const { username } = await authed(auth);
    const owned = await list<string>(k.owned(username));
    const shared = await list<string>(k.shared(username));
    const mine = (await Promise.all(owned.map((id) => db().get<Life>(k.life(id))))).filter((l): l is Life => !!l).map((l) => meta(l, 'owner'));
    const others = [];
    for (const id of shared) {
      const life = await db().get<Life>(k.life(id));
      if (!life) continue;
      const access = (await db().get<AccessMap>(k.access(id))) ?? {};
      const level = access[username];
      if (!level) continue;
      others.push(meta(life, level === 'play' ? 'play' : 'view', level));
    }
    return { mine, shared: others, graves: await list(k.graves(username)) };
  },

  async getLife(a, auth) {
    const { username } = await authed(auth);
    const life = await getLife(String(a.id));
    const r = await mustAccess(username, life, 'view');
    return { ...meta(life, r), game: life.game };
  },

  /** Cheap check used for live sync. */
  async lifeVersion(a, auth) {
    const { username } = await authed(auth);
    const life = await getLife(String(a.id));
    await mustAccess(username, life, 'view');
    return { version: life.version, updatedBy: life.updatedBy };
  },

  async createLife(a, auth) {
    const { username } = await authed(auth);
    checkGame(a.game);
    const id = String((a.game as { id?: string }).id ?? '');
    if (!/^[a-z0-9]{4,20}$/i.test(id)) throw new HttpError(400, 'Bad life id.');
    const life = await createLifeRecord(username, id, a.game, a.summary as LifeSummary);
    return meta(life, 'owner');
  },

  async saveLife(a, auth) {
    const { username } = await authed(auth);
    checkGame(a.game);
    const life = await getLife(String(a.id));
    const r = await mustAccess(username, life, 'play');
    if (Number(a.version) !== life.version) {
      throw new HttpError(409, `@${life.updatedBy} made changes to this life.`, { ...meta(life, r), game: life.game });
    }
    const summary = a.summary as LifeSummary;
    if (r !== 'owner' && summary.age !== life.summary.age) await addActivity(life.id, `@${username} played ${summary.name} to age ${summary.age}`);
    Object.assign(life, { game: a.game, summary, version: life.version + 1, updatedAt: Date.now(), updatedBy: username });
    await db().set(k.life(life.id), life);
    return { version: life.version };
  },

  /** Owner deletes a life for good; a guest just leaves it. */
  async removeLife(a, auth) {
    const { username } = await authed(auth);
    const life = await getLife(String(a.id));
    if (life.owner === username) {
      await destroyLife(life);
    } else {
      const access = (await db().get<AccessMap>(k.access(life.id))) ?? {};
      delete access[username];
      await db().set(k.access(life.id), access);
      await removeFrom(k.shared(username), life.id);
      await addActivity(life.id, `@${username} left this life`);
    }
    return { ok: true };
  },

  /** A life ended: add a tombstone for the owner (and the player, if different) and remove the life. */
  async bury(a, auth) {
    const { username } = await authed(auth);
    const life = await getLife(String(a.id));
    await mustAccess(username, life, 'play');
    for (const u of new Set([life.owner, username])) {
      const graves = await list<{ id: string }>(k.graves(u));
      await db().set(k.graves(u), [a.grave, ...graves.filter((g) => g.id !== life.id)].slice(0, 60));
    }
    await destroyLife(life);
    return { ok: true };
  },

  async setEpitaph(a, auth) {
    const { username } = await authed(auth);
    const graves = await list<{ id: string; epitaph?: string }>(k.graves(username));
    await db().set(k.graves(username), graves.map((g) => (g.id === a.id ? { ...g, epitaph: String(a.epitaph ?? '').slice(0, 140) } : g)));
    return { ok: true };
  },

  /** Enter a friend's 6-character life code. */
  async requestAccess(a, auth) {
    const { username } = await authed(auth);
    const code = String(a.code ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) throw new HttpError(400, 'Life codes are 6 letters or numbers.');
    const id = await db().get<string>(k.code(code));
    if (!id) throw new HttpError(404, 'No life found with that code.');
    const life = await getLife(id);
    if (life.owner === username) throw new HttpError(400, 'That’s your own life! 😄');
    const access = (await db().get<AccessMap>(k.access(id))) ?? {};
    if (access[username] === 'view' || access[username] === 'play') return { status: access[username], owner: life.owner, name: life.summary.name };
    access[username] = 'pending';
    await db().set(k.access(id), access);
    await pushUnique(k.shared(username), id);
    const reqs = (await list<AccessRequest>(k.requests(life.owner))).filter((r) => !(r.lifeId === id && r.requester === username));
    await db().set(k.requests(life.owner), [...reqs, { lifeId: id, lifeName: life.summary.name, requester: username, at: Date.now() }]);
    await addActivity(id, `@${username} asked to join`);
    return { status: 'pending', owner: life.owner, name: life.summary.name };
  },

  /** Pending "may @someone play your life?" questions for the current user. */
  async requests(_a, auth) {
    const { username } = await authed(auth);
    return { requests: await list<AccessRequest>(k.requests(username)) };
  },

  async respond(a, auth) {
    const { username } = await authed(auth);
    const life = await getLife(String(a.lifeId));
    if (life.owner !== username) throw new HttpError(403, 'Only the owner can decide.');
    const requester = cleanUsername(a.requester);
    const level: AccessLevel = a.level === 'play' ? 'play' : 'view';
    const access = (await db().get<AccessMap>(k.access(life.id))) ?? {};
    if (a.allow) access[requester] = level;
    else { delete access[requester]; await removeFrom(k.shared(requester), life.id); }
    await db().set(k.access(life.id), access);
    const reqs = await list<AccessRequest>(k.requests(username));
    await db().set(k.requests(username), reqs.filter((r) => !(r.lifeId === life.id && r.requester === requester)));
    await addActivity(life.id, a.allow
      ? (level === 'play' ? `🎮 @${username} let @${requester} play` : `👀 @${username} let @${requester} watch`)
      : `🚫 @${username} declined @${requester}`);
    return { ok: true };
  },

  /** Switch a friend between watching and playing. */
  async setAccess(a, auth) {
    const { username } = await authed(auth);
    const life = await getLife(String(a.lifeId));
    if (life.owner !== username) throw new HttpError(403, 'Only the owner can manage users.');
    const target = cleanUsername(a.username);
    const level: AccessLevel = a.level === 'play' ? 'play' : 'view';
    const access = (await db().get<AccessMap>(k.access(life.id))) ?? {};
    if (!access[target] || access[target] === 'pending') throw new HttpError(400, 'That person doesn’t have access yet.');
    access[target] = level;
    await db().set(k.access(life.id), access);
    await addActivity(life.id, level === 'play' ? `🎮 @${username} let @${target} play` : `👀 @${username} set @${target} to view only`);
    return { ok: true };
  },

  async manage(a, auth) {
    const { username } = await authed(auth);
    const life = await getLife(String(a.lifeId));
    if (life.owner !== username) throw new HttpError(403, 'Only the owner can manage users.');
    const access = (await db().get<AccessMap>(k.access(life.id))) ?? {};
    return {
      code: life.code,
      users: Object.entries(access).map(([u, status]) => ({ username: u, status })),
      activity: await list<ActivityEntry>(k.activity(life.id)),
    };
  },

  async revoke(a, auth) {
    const { username } = await authed(auth);
    const life = await getLife(String(a.lifeId));
    if (life.owner !== username) throw new HttpError(403, 'Only the owner can manage users.');
    const target = cleanUsername(a.username);
    const access = (await db().get<AccessMap>(k.access(life.id))) ?? {};
    delete access[target];
    await db().set(k.access(life.id), access);
    await removeFrom(k.shared(target), life.id);
    const reqs = await list<AccessRequest>(k.requests(username));
    await db().set(k.requests(username), reqs.filter((r) => !(r.lifeId === life.id && r.requester === target)));
    await addActivity(life.id, `🔒 @${username} removed @${target}’s access`);
    return { ok: true };
  },

  /** Move lives and tombstones saved on this device into the account. */
  async importLocal(a, auth) {
    const { username } = await authed(auth);
    const lives = Array.isArray(a.lives) ? (a.lives as { game: { id: string }; summary: LifeSummary }[]) : [];
    let imported = 0;
    for (const l of lives.slice(0, 20)) {
      try {
        checkGame(l.game);
        if (!(await db().get(k.life(l.game.id)))) { await createLifeRecord(username, l.game.id, l.game, l.summary); imported++; }
      } catch { /* skip broken saves */ }
    }
    if (Array.isArray(a.graves) && a.graves.length) {
      const graves = await list<{ id: string }>(k.graves(username));
      const ids = new Set(graves.map((g) => g.id));
      await db().set(k.graves(username), [...graves, ...(a.graves as { id: string }[]).filter((g) => !ids.has(g.id))].slice(0, 60));
    }
    return { imported };
  },
};

export async function handle(action: unknown, args: Args, auth: string | undefined): Promise<RpcResult> {
  try {
    if (!auth && typeof args?.__token === 'string') auth = `Bearer ${args.__token}`;
    const fn = actions[String(action)];
    if (!fn) return { status: 400, body: { error: 'Unknown action.' } };
    return { status: 200, body: await fn(args ?? {}, auth) };
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: { error: e.message, data: e.data } };
    if (e instanceof Error && e.message === 'DB_NOT_CONFIGURED') {
      return { status: 503, body: { error: 'The EverLife database isn’t connected yet. Add Upstash Redis in your Vercel project’s Storage tab.' } };
    }
    console.error(e);
    return { status: 500, body: { error: 'Something went wrong on the server.' } };
  }
}
