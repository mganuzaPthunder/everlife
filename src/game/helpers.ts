import type { Game, Gender, Person, RelationType, StatKey } from './types';
import { FEMALE, LAST, MALE } from './names';
import { clamp, pick, rand, uid } from './util';
import { randomLook } from './look';

export function log(g: Game, text: string) {
  let year = g.log[g.log.length - 1];
  if (!year || year.age !== g.age) {
    year = { age: g.age, entries: [] };
    g.log.push(year);
  }
  year.entries.push(text);
}

export const adjust = (g: Game, stat: StatKey, delta: number) => {
  g.stats[stat] = clamp(Math.round(g.stats[stat] + delta));
};

export const bond = (p: Person | undefined, delta: number) => {
  if (p) p.closeness = clamp(Math.round(p.closeness + delta));
};

export const randomFirst = (gender: Gender) => pick(gender === 'male' ? MALE : FEMALE);
export const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;

export function makePerson(
  relation: RelationType,
  gender: Gender,
  age: number,
  lastName?: string,
  closeness = rand(40, 80),
): Person {
  return {
    id: uid(),
    look: randomLook(gender),
    firstName: randomFirst(gender),
    lastName: lastName ?? pick(LAST),
    gender,
    age,
    relation,
    closeness,
    alive: true,
  };
}

export const living = (g: Game, ...rels: RelationType[]) =>
  g.relationships.filter((p) => p.alive && (rels.length === 0 || rels.includes(p.relation)));

export const partnerOf = (g: Game) => living(g, 'partner', 'spouse')[0];
export const isSingle = (g: Game) => !partnerOf(g);

export function datingGender(g: Game): Gender {
  if (g.preference === 'men') return 'male';
  if (g.preference === 'women') return 'female';
  return pick(['male', 'female'] as const);
}

export function datingAge(g: Game) {
  return Math.max(g.age >= 18 ? 18 : 14, g.age + rand(-5, 5));
}

export function relationLabel(p: Person): string {
  const m = p.gender === 'male';
  switch (p.relation) {
    case 'mother': return 'Mother';
    case 'father': return 'Father';
    case 'sibling': return m ? 'Brother' : 'Sister';
    case 'friend': return 'Friend';
    case 'partner': return m ? 'Boyfriend' : 'Girlfriend';
    case 'spouse': return m ? 'Husband' : 'Wife';
    case 'child': return m ? 'Son' : 'Daughter';
  }
}

/** How many times something was done this year. */
export const usesThisYear = (g: Game, key: string) => g.yearUses[key] ?? 0;
export const noteUse = (g: Game, key: string) => { g.yearUses[key] = usesThisYear(g, key) + 1; };
/** First go is free; after that the price doubles: 100, 200, 400… */
export const repeatFee = (uses: number) => (uses <= 0 ? 0 : 100 * 2 ** (uses - 1));

export const used = (g: Game, key: string) => g.used.includes(key);
export const markUsed = (g: Game, key: string) => {
  if (!g.used.includes(key)) g.used.push(key);
};

export const bump = (g: Game, key: string) => {
  g.counters[key] = (g.counters[key] ?? 0) + 1;
};

export function hasEdu(g: Game, req?: string | string[]): boolean {
  if (!req) return true;
  if (Array.isArray(req)) return req.some((r) => hasEdu(g, r));
  if (req === 'ba') return g.education.degrees.some((d) => d.startsWith('ba:'));
  return g.education.degrees.includes(req);
}

export const inSchool = (g: Game) => g.education.stage !== 'none';

export const netWorth = (g: Game) =>
  g.money + g.assets.reduce((s, a) => s + a.value, 0) - g.education.studentLoans;

export function deathChance(age: number, health: number) {
  const base = age < 1 ? 0.003 : age < 40 ? 0.0008 : 0.0008 * Math.exp((age - 40) * 0.095);
  const frailty = 0.4 + (100 - health) / 60;
  return Math.min(0.95, base * frailty);
}

export function causeOfDeath(age: number) {
  if (age < 18) return pick(['a sudden illness', 'an accident', 'a rare infection']);
  if (age < 55) return pick(['a car accident', 'a heart attack', 'cancer', 'an aneurysm']);
  if (age >= 85) return pick(['old age', 'old age', 'natural causes', 'heart failure', 'pneumonia']);
  return pick(['heart failure', 'a stroke', 'cancer', 'pneumonia', 'natural causes']);
}

export function die(g: Game, cause: string) {
  g.alive = false;
  g.causeOfDeath = cause;
  g.pending = [];
  log(g, `🕯️ I passed away from ${cause} at age ${g.age}.`);
}

export function avatar(gender: Gender, age: number, alive = true) {
  if (!alive) return '🪦';
  if (age < 3) return '👶';
  if (age < 13) return gender === 'male' ? '👦' : '👧';
  if (age < 60) return gender === 'male' ? '👨' : '👩';
  return gender === 'male' ? '👴' : '👵';
}
