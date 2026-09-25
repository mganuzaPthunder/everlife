import type { Game, Gender, Person, RelationType, StatKey } from './types';
import { FEMALE, LAST, MALE } from './names';
import { chance, clamp, pick, rand, uid } from './util';
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

/** Children you could carry on as: your own and your stepchildren (not in-laws, not exes). */
export const playableChildren = (g: Game) =>
  g.relationships.filter((p) => p.alive && p.relation === 'child' && !p.ex && p.kin !== 'in-law');

/** Your own family and current people — not in-laws, step-family or exes. */
export const isCore = (p: Person) => !p.kin && !p.ex;

export const living = (g: Game, ...rels: RelationType[]) =>
  g.relationships.filter((p) => p.alive && isCore(p) && (rels.length === 0 || rels.includes(p.relation)));

/** Who gets what when you die: your will if you wrote one (skipping anyone who has died), otherwise your children. */
export function estateShares(g: Game): { id: string; name: string; amount: number }[] {
  const named = (g.will ?? []).flatMap((id) => {
    if (id === 'charity') return [{ id, name: 'Charity' }];
    const p = g.relationships.find((x) => x.id === id && x.alive);
    return p ? [{ id, name: p.firstName }] : [];
  });
  const heirs = named.length ? named : living(g, 'child').map((p) => ({ id: p.id, name: p.firstName }));
  if (!heirs.length) return [];
  const share = Math.max(0, Math.round(netWorth(g) / heirs.length));
  return heirs.map((h) => ({ ...h, amount: share }));
}

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
  const base = (() => {
    switch (p.relation) {
      case 'mother': return p.kin === 'step' ? 'Stepmother' : 'Mother';
      case 'father': return p.kin === 'step' ? 'Stepfather' : 'Father';
      case 'sibling': return p.kin === 'step' ? (m ? 'Stepbrother' : 'Stepsister') : m ? 'Brother' : 'Sister';
      case 'friend': return 'Friend';
      case 'coworker': return 'Co-worker';
      case 'partner': return m ? 'Boyfriend' : 'Girlfriend';
      case 'spouse': return m ? 'Husband' : 'Wife';
      case 'child': return p.kin === 'step' ? (m ? 'Stepson' : 'Stepdaughter') : m ? 'Son' : 'Daughter';
    }
  })();
  const label = p.kin === 'in-law' ? `${base}-in-law` : base;
  return p.ex ? `Ex-${label.toLowerCase()}` : label;
}

/** Keep your co-workers in step with your job: a new team when you're hired, none when you leave. */
export function syncCoworkers(g: Game) {
  const job = g.job && !g.job.royal ? g.job : null;
  const key = job ? `job:${job.careerId}` : undefined;
  g.relationships = g.relationships.filter((p) => p.relation !== 'coworker' || (key && p.via === key));
  if (!job || g.relationships.some((p) => p.relation === 'coworker' && p.alive)) return;
  for (let i = rand(3, 5); i > 0; i--) {
    const age = job.partTime ? Math.max(15, g.age + rand(-2, 5)) : Math.max(18, g.age + rand(-12, 12));
    const p = makePerson('coworker', pick(['male', 'female'] as const), age, undefined, rand(25, 60));
    Object.assign(p, { via: key, job: job.title });
    g.relationships.push(p);
  }
}

/** Children carry their father's last name: yours if you're the dad, otherwise your partner's if he's a man. */
export const babyLastName = (g: Game, other?: Person) =>
  g.gender === 'male' || !other || other.gender !== 'male' ? g.lastName : other.lastName;

/* ───────── Royal ranks, and the consort titles that follow them ───────── */

const RANK_PAIRS: [string, string][] = [['King', 'Queen'], ['Crown Prince', 'Crown Princess'], ['Grand Duke', 'Grand Duchess'], ['Archduke', 'Archduchess'], ['Prince', 'Princess']];

/** "Crown Prince of Aldoria" or "Crown Princess Consort" → "Crown Prince" / "Crown Princess". */
export function royalRank(title?: string) {
  const bare = (title ?? '').replace(/ of .*$/, '').replace(/ Consort$/, '').trim();
  return RANK_PAIRS.some(([m, f]) => bare === m || bare === f) ? bare : 'Prince';
}

/** The same rank for a man or a woman: Queen ↔ King, Crown Princess ↔ Crown Prince… */
export function rankFor(rank: string, gender: Gender) {
  const pair = RANK_PAIRS.find(([m, f]) => rank === m || rank === f) ?? RANK_PAIRS[4];
  return gender === 'male' ? pair[0] : pair[1];
}

/** What you're called when married to someone of that rank: a King's wife is Queen Consort. */
export const consortTitle = (spouseTitle: string | undefined, gender: Gender) => `${rankFor(royalRank(spouseTitle), gender)} Consort`;

/** Consorts are paid by the rank they share. */
export const consortSalary = (title: string) =>
  /^(King|Queen)/.test(title) ? 5_000_000 : /^Crown/.test(title) ? 3_000_000 : /^(Grand|Arch)/.test(title) ? 2_500_000 : 2_000_000;

/** A spouse comes with a family: their parents, siblings, and sometimes children of their own. */
export function addInLaws(g: Game, spouse: Person, royalHouse = !!spouse.royal) {
  const add = (p: Person) => { p.via = spouse.id; g.relationships.push(p); return p; };
  for (const gender of ['female', 'male'] as const) {
    const parent = add(makePerson(gender === 'female' ? 'mother' : 'father', gender, spouse.age + rand(22, 34), spouse.lastName, rand(35, 75)));
    parent.kin = 'in-law';
    if (royalHouse) { parent.royal = true; parent.job = gender === 'female' ? 'Queen' : 'King'; }
    if (parent.age > 85 || chance(Math.max(0, (parent.age - 60) / 60))) parent.alive = false;
  }
  for (let i = rand(0, 2); i > 0; i--) {
    const sib = add(makePerson('sibling', pick(['male', 'female'] as const), Math.max(1, spouse.age + rand(-8, 8)), spouse.lastName, rand(35, 75)));
    sib.kin = 'in-law';
    if (royalHouse) sib.royal = true;
  }
  if (spouse.age >= 24 && chance(0.3)) {
    for (let i = rand(1, 2); i > 0; i--) {
      const kid = add(makePerson('child', pick(['male', 'female'] as const), rand(0, Math.min(17, spouse.age - 20)), spouse.lastName, rand(30, 70)));
      kid.kin = 'step';
    }
  }
}

/** Divorcing out of the royal family ends the title, the duties and the crown. */
export function loseConsortTitle(g: Game): string | null {
  if (g.origin === 'royalty' || !g.flags.includes('royalByMarriage')) return null;
  g.flags = g.flags.filter((f) => f !== 'royalByMarriage');
  const title = g.job?.royal ? g.job.title : null;
  if (g.job?.royal) g.job = null;
  if (g.look.acc?.hat === 'crown' || g.look.acc?.hat === 'tiara') g.look = { ...g.look, acc: { ...g.look.acc, hat: undefined } };
  log(g, `👑 After the divorce I’m no longer ${title ?? 'royalty'}.`);
  return `I’m no longer ${title ?? 'part of the royal family'}.`;
}

/** A divorce or break-up turns the person — and the family that came with them — into exes. */
export function makeEx(g: Game, person: Person) {
  person.ex = true;
  bond(person, -30);
  for (const p of g.relationships) if (p.via === person.id) p.ex = true;
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
