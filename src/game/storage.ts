import type { Game, Gender, Look } from './types';
import { netWorth } from './helpers';
import { DEFAULT_BARS, randomLook } from './look';
import { degreeName } from './data';
import { careerOf } from './dreams';

const INDEX_KEY = 'everlife:index:v1';
const LEGACY_SAVE_KEY = 'everlife:save:v1';
const GRAVE_KEY = 'everlife:graveyard:v1';
const lifeKey = (id: string) => `everlife:life:${id}`;

interface LifeIndex {
  activeId: string | null;
  ids: string[];
}

export interface Grave {
  id: string;
  name: string;
  age: number;
  cause: string;
  netWorth: number;
  generation: number;
  gender?: Gender;
  look?: Look;
  born?: string;
  career?: string;
  degree?: string;
  dream?: string;
  dreamFulfilled?: boolean;
  children?: number;
  married?: boolean;
  notes?: { age: number; text: string }[];
  epitaph?: string;
  diedAt?: number;
}

/* ───────── Storage helpers ───────── */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full — the game still works for this session */
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Fill in fields added after a save was made. */
export function normalize(g: Game | null): Game | null {
  if (g?.version !== 1) return null;
  g.look ??= randomLook(g.gender);
  g.bars ??= structuredClone(DEFAULT_BARS);
  g.dream ??= null;
  g.counters ??= {};
  g.wardrobe ??= [];
  g.origin ??= 'normal';
  g.skills ??= {};
  g.clubs ??= [];
  g.yearUses ??= {};
  g.fameBonus ??= 0;
  g.socials ??= [];
  g.quests ??= [];
  g.stories ??= [];
  g.papers ??= [];
  g.ancestors ??= [];
  g.rejections ??= {};
  g.look.top ??= 'tee';
  g.look.topColor ??= '#6b3fc4';
  return g;
}

function readIndex(): LifeIndex {
  const index = read<LifeIndex>(INDEX_KEY, { activeId: null, ids: [] });
  // One-time move from the single-save format.
  const legacy = normalize(read<Game | null>(LEGACY_SAVE_KEY, null));
  if (legacy) {
    write(lifeKey(legacy.id), legacy);
    if (!index.ids.includes(legacy.id)) index.ids.unshift(legacy.id);
    index.activeId ??= legacy.id;
    write(INDEX_KEY, index);
    remove(LEGACY_SAVE_KEY);
  }
  return index;
}

/* ───────── Lives ───────── */

export function loadLife(id: string): Game | null {
  return normalize(read<Game | null>(lifeKey(id), null));
}

export function loadActiveLife(): Game | null {
  const { activeId } = readIndex();
  return activeId ? loadLife(activeId) : null;
}

/** Every life still being lived, most recently played first. */
export function listLives(): Game[] {
  return readIndex().ids.map(loadLife).filter((g): g is Game => !!g && g.alive);
}

/** Save a life and make it the one being played. Dead lives are removed (they live on in the graveyard). */
export function saveLife(g: Game) {
  const index = readIndex();
  if (!g.alive) {
    removeLife(g.id);
    return;
  }
  write(lifeKey(g.id), g);
  index.ids = [g.id, ...index.ids.filter((id) => id !== g.id)];
  index.activeId = g.id;
  write(INDEX_KEY, index);
}

export function setActiveLife(id: string | null) {
  const index = readIndex();
  index.activeId = id;
  write(INDEX_KEY, index);
}

export function removeLife(id: string) {
  const index = readIndex();
  index.ids = index.ids.filter((x) => x !== id);
  if (index.activeId === id) index.activeId = null;
  write(INDEX_KEY, index);
  remove(lifeKey(id));
}

/* ───────── Graveyard ───────── */

const NOTE_PATTERNS = [
  /graduated/i, /hired as/i, /promoted/i, /married/i, /welcomed a baby/i, /dream/i, /sentenced/i, /escaped/i,
  /lottery/i, /inherited/i, /retired/i, /divorce/i, /robbed a bank/i, /LEGENDARY|Oscar|record|history/i, /moved to/i,
];

function lifeNotes(g: Game) {
  const notes: { age: number; text: string }[] = [];
  for (const year of g.log) {
    for (const text of year.entries) {
      if (NOTE_PATTERNS.some((re) => re.test(text)) && !/missed a step|Dream step/.test(text)) notes.push({ age: year.age, text });
    }
  }
  // Keep it readable: the first few milestones and the most recent ones.
  return notes.length > 14 ? [...notes.slice(0, 7), ...notes.slice(-7)] : notes;
}

export function loadGraveyard(): Grave[] {
  return read<Grave[]>(GRAVE_KEY, []);
}

export function makeGrave(g: Game): Grave {
  const degree = g.education.degrees.at(-1);
  return {
    id: g.id,
    name: `${g.firstName} ${g.lastName}`,
    age: g.age,
    cause: g.causeOfDeath ?? 'unknown causes',
    netWorth: netWorth(g),
    generation: g.generation,
    gender: g.gender,
    look: g.look,
    born: `${g.city}, ${g.country}`,
    career: g.job?.title ?? (g.retired ? 'Retired' : undefined),
    degree: degree ? degreeName(degree) : undefined,
    dream: g.dream ? careerOf(g.dream.careerId)?.title : undefined,
    dreamFulfilled: !!g.dream && (g.job?.careerId === g.dream.careerId || g.log.some((y) => y.entries.some((e) => /dream.*came true/i.test(e)))),
    children: g.relationships.filter((p) => p.relation === 'child').length,
    married: g.relationships.some((p) => p.relation === 'spouse'),
    notes: lifeNotes(g),
    diedAt: Date.now(),
  };
}

/* ───────── One-time import of lives saved on this device before accounts existed ───────── */

const IMPORTED_KEY = 'everlife:imported:v1';

export function readLocalSaves(): { lives: Game[]; graves: Grave[] } {
  try {
    if (localStorage.getItem(IMPORTED_KEY)) return { lives: [], graves: [] };
  } catch {
    return { lives: [], graves: [] };
  }
  const lives = readIndex().ids.map(loadLife).filter((g): g is Game => !!g && g.alive);
  return { lives, graves: loadGraveyard() };
}

export function markLocalImported() {
  write(IMPORTED_KEY, Date.now());
}
