import type { BarPrefs, Game, Gender, Look, Person, Preference, Stats } from './types';
import { DEFAULT_BARS, randomLook } from './look';
import { chooseDream, evaluateDream, maybeOfferDream } from './dreams';
import { originOf, randomOrigin, type OriginId } from './origins';
import { clubOf } from './skills';
import { LAST, MONTHS, PLACES } from './names';
import { CAREERS, royalJobTitle, salaryAt } from './data';
import {
  adjust, bond, causeOfDeath, deathChance, die, estateShares, fullName, living, log, makePerson, netWorth, randomFirst, relationLabel, used,
} from './helpers';
import { rollEvents } from './events';
import { socialYear } from './social';
import { questYear } from './quests';
import { storyYear } from './stories';
import { finalYear, missExamYear, stageLabel } from './school';
import { pressNews } from './news';
import { districtOf } from './property';
import { chance, clamp, money, pick, rand, uid } from './util';

export interface NewLifeOptions {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  preference?: Preference;
  look?: Look;
  bars?: BarPrefs;
  /** Dream career id, or null for "not sure yet". */
  dream?: string | null;
  /** Hand-picked starting stats. Random when left out. */
  stats?: Stats;
  /** Family background. Random when left out. */
  origin?: OriginId;
}

function blankGame(o: NewLifeOptions): Game {
  const gender = o.gender ?? pick(['male', 'female'] as const);
  const place = pick(PLACES);
  return {
    version: 1,
    id: uid(),
    generation: 1,
    firstName: o.firstName?.trim() || randomFirst(gender),
    lastName: o.lastName?.trim() || pick(LAST),
    gender,
    preference: o.preference ?? (gender === 'male' ? 'women' : 'men'),
    age: 0,
    birthMonth: rand(0, 11),
    birthDay: rand(1, 28),
    country: place.country,
    city: pick(place.cities),
    stats: o.stats ? { ...o.stats } : { happiness: rand(55, 100), health: rand(60, 100), smarts: rand(15, 100), looks: rand(15, 100) },
    money: 0,
    education: { stage: 'none', yearsLeft: 0, grades: 50, degrees: [], studentLoans: 0 },
    job: null,
    retired: false,
    pension: 0,
    relationships: [],
    assets: [],
    log: [],
    alive: true,
    pending: [],
    used: [],
    flags: [],
    criminalRecord: 0,
    prison: 0,
    look: o.look ?? randomLook(gender),
    bars: o.bars ?? structuredClone(DEFAULT_BARS),
    dream: null,
    counters: {},
    wardrobe: [],
    origin: o.origin ?? 'normal',
    skills: {},
    clubs: [],
    yearUses: {},
    fameBonus: 0,
    socials: [],
    quests: [],
    stories: [],
    papers: [],
    ancestors: [],
    rejections: {},
  };
}

export function newLife(o: NewLifeOptions = {}): Game {
  const g = blankGame({ ...o, origin: o.origin ?? randomOrigin() });
  const origin = originOf(g.origin);
  for (const [k, d] of Object.entries(origin.statShift) as [keyof Stats, number][]) g.stats[k] = clamp(g.stats[k] + d);
  g.wardrobe.push(...(origin.wardrobe ?? []));
  if (g.origin === 'royalty') g.fameBonus = 35; // the whole country knows your name before you can walk

  const momAge = rand(19, 40);
  const mom = makePerson('mother', 'female', momAge, g.lastName, rand(70, 100));
  const dad = makePerson('father', 'male', Math.max(19, momAge + rand(-3, 8)), g.lastName, rand(60, 100));
  const officialParent = pick([mom, dad]);
  for (const p of [mom, dad]) {
    const job = g.origin === 'official' && p !== officialParent ? pick(originOf('normal').parentJobs) : pick(origin.parentJobs);
    p.job = g.origin === 'royalty' ? (p.gender === 'male' ? 'King' : 'Queen') : job.title;
    p.salary = rand(job.salary[0], job.salary[1]);
    if (g.origin === 'royalty') p.look = { ...p.look!, acc: { hat: 'crown' }, top: 'royal', topColor: '#e0445a' };
  }
  g.relationships.push(mom, dad);
  if (chance(0.4) && momAge >= 21) {
    const n = chance(0.3) ? 2 : 1;
    for (let i = 0; i < n; i++) {
      g.relationships.push(makePerson('sibling', pick(['male', 'female'] as const), rand(1, Math.min(12, momAge - 19)), g.lastName, rand(50, 85)));
    }
  }

  log(g, `I was born a ${g.gender === 'male' ? 'boy' : 'girl'} in ${g.city}, ${g.country}.`);
  log(g, origin.birthLine(g.country));
  log(g, `My birthday is ${MONTHS[g.birthMonth]} ${g.birthDay}.`);
  const jobText = (p: Person) => (p.job && p.job !== 'Unemployed' && p.job !== 'Unhoused' ? `, a ${p.job}` : '');
  log(g, `My mother is ${fullName(mom)} (${mom.age}${jobText(mom)}) and my father is ${fullName(dad)} (${dad.age}${jobText(dad)}).`);
  for (const s of living(g, 'sibling')) log(g, `I have an older ${relationLabel(s).toLowerCase()}, ${s.firstName} (${s.age}).`);
  if (o.dream) chooseDream(g, o.dream, { boost: !o.stats });
  return g;
}

/** Start a new life as a child of someone who just died, inheriting their estate. */
export function continueAsChild(prev: Game, childId: string): Game {
  const child = prev.relationships.find((p) => p.id === childId);
  if (!child) return newLife();
  const heirs = living(prev, 'child');
  // Only what the will leaves this child — nothing, if they were written out of it.
  const share = estateShares(prev).find((h) => h.id === childId)?.amount ?? 0;

  const inheritedOrigin: OriginId = prev.origin === 'royalty' ? 'royalty'
    : share >= 2_000_000 ? 'rich' : share >= 50_000 ? 'normal' : share > 0 ? 'poor' : (prev.origin as OriginId) ?? 'normal';
  const g = blankGame({ firstName: child.firstName, lastName: child.lastName, gender: child.gender, look: child.look, bars: prev.bars, origin: inheritedOrigin });
  g.generation = prev.generation + 1;
  g.age = child.age;
  g.country = prev.country;
  g.city = prev.city;
  g.money = share;
  g.stats.happiness = clamp(g.stats.happiness - 20);
  if (g.age >= 18) g.education.degrees.push('hs');
  else if (g.age >= 12) Object.assign(g.education, { stage: 'high', yearsLeft: 18 - g.age });
  else if (g.age >= 5) Object.assign(g.education, { stage: 'elementary', yearsLeft: 12 - g.age });
  if (g.age >= 2) g.flags.push('first-word', 'first-steps');

  const other = living(prev, 'spouse', 'partner')[0];
  if (other) g.relationships.push({ ...other, id: uid(), relation: other.gender === 'male' ? 'father' : 'mother', closeness: rand(60, 95) });
  for (const sib of heirs) if (sib.id !== childId) g.relationships.push({ ...sib, id: uid(), relation: 'sibling', closeness: rand(50, 90) });

  // Keep the line going: every generation remembers the ones before it.
  g.ancestors = [
    ...prev.ancestors,
    {
      generation: prev.generation,
      name: fullName(prev),
      gender: prev.gender,
      age: prev.age,
      career: prev.job?.title ?? (prev.retired ? 'Retired' : 'None'),
      origin: prev.origin,
      look: prev.look,
      cause: prev.causeOfDeath,
    },
  ].slice(-12);

  log(g, `I am ${fullName(g)}, child of the late ${fullName(prev)}.`);
  log(g, `👪 I'm generation ${g.generation} of the ${g.lastName} family.`);
  if (share > 0) log(g, `I inherited ${money(share)} from their estate.`);
  else if (prev.will?.length) log(g, 'Their will left me nothing.');
  return g;
}

export function ageUp(g: Game) {
  if (!g.alive || g.pending.length) return;
  evaluateDream(g, true);
  g.age++;
  g.used = [];
  g.yearUses = {};
  g.log.push({ age: g.age, entries: [] });

  ageRelationships(g);
  if (g.prison > 0) prisonYear(g);
  schoolYear(g);
  workYear(g);
  assetYear(g);
  socialYear(g);
  questYear(g);
  storyYear(g);
  pressNews(g);
  statDrift(g);
  milestones(g);

  if (g.stats.health <= 0) return die(g, 'failing health');
  if (chance(deathChance(g.age, g.stats.health) * (g.flags.includes('blessed:longlife') ? 0.5 : 1))) return die(g, causeOfDeath(g.age));
  evaluateDream(g, false);
  maybeOfferDream(g);
  rollEvents(g);
}

function ageRelationships(g: Game) {
  for (const p of g.relationships) {
    if (!p.alive) continue;
    p.age++;
    bond(p, -rand(0, 4));
    const risk = deathChance(p.age, 65) * (p.relation === 'child' || p.relation === 'sibling' ? 0.5 : 1);
    if (chance(risk)) personDies(g, p);
  }

  const mom = living(g, 'mother')[0];
  if (mom && mom.age <= 42 && g.age <= 12 && chance(0.12)) {
    const baby = makePerson('sibling', pick(['male', 'female'] as const), 0, g.lastName, rand(60, 90));
    g.relationships.push(baby);
    log(g, `My mother gave birth to a baby ${baby.gender === 'male' ? 'brother' : 'sister'}, ${baby.firstName}!`);
  }

  const partner = living(g, 'partner')[0];
  if (partner && partner.closeness < 15 && chance(0.5)) {
    g.relationships = g.relationships.filter((p) => p !== partner);
    adjust(g, 'happiness', -10);
    log(g, `💔 ${partner.firstName} broke up with me.`);
  }
  const spouse = living(g, 'spouse')[0];
  if (spouse && spouse.closeness < 10 && chance(0.4)) {
    g.relationships = g.relationships.filter((p) => p !== spouse);
    if (g.money > 0) g.money = Math.round(g.money / 2);
    adjust(g, 'happiness', -15);
    log(g, `💔 ${spouse.firstName} filed for divorce and took half of my money.`);
  }
}

function personDies(g: Game, p: Person) {
  p.alive = false;
  log(g, `🕯️ My ${relationLabel(p).toLowerCase()} ${fullName(p)} passed away at age ${p.age}.`);
  if (['mother', 'father', 'spouse', 'child', 'sibling', 'partner'].includes(p.relation)) adjust(g, 'happiness', -rand(10, 25));
  const [lo, hi] = originOf(g.origin).inheritance;
  if ((p.relation === 'mother' || p.relation === 'father') && g.age >= 18 && hi > 0 && chance(0.7)) {
    const amount = rand(lo, hi) * 1000;
    g.money += amount;
    log(g, `I inherited ${money(amount)}.`);
  } else if (p.relation === 'spouse' && chance(0.8)) {
    const amount = Math.max(5000, Math.round((p.salary ?? 50000) * rand(1, 4)));
    g.money += amount;
    log(g, `I inherited ${money(amount)}.`);
  }
}

function prisonYear(g: Game) {
  g.prison--;
  adjust(g, 'happiness', -rand(3, 8));
  if (g.prison === 0) {
    log(g, '🔓 I was released from prison.');
    adjust(g, 'happiness', 15);
  }
}

/** What they teach you at the palace. */
const ROYAL_LESSONS = [
  'court etiquette and how to address a duke',
  'the history of the crown',
  'how to give a speech without saying anything',
  'French, Latin and one more language for good measure',
  'horse riding and the royal seat',
  'ballroom dancing',
  'how to hold a teacup properly',
  'state protocol and seating plans',
  'how to wave for exactly forty minutes',
  'diplomacy and which hands to shake',
  'heraldry and the family tree',
  'how to open a hospital wing',
  'the art of the royal portrait',
];

function schoolYear(g: Game) {
  const e = g.education;
  if (g.prison > 0) return;
  const bornRoyal = g.origin === 'royalty' && !royalFree(g);

  // A royal child is taught at the palace — no elementary, no high school, no university.
  if (bornRoyal && e.stage !== 'royal' && !e.degrees.includes('royal') && g.age >= 5 && g.age < 18) {
    Object.assign(e, { stage: 'royal', yearsLeft: 18 - g.age, program: undefined, missedExams: 0 });
    e.grades = clamp(g.stats.smarts + rand(-10, 20));
    log(g, '👑 I started at the Royal Academy, where they teach you how to be royalty.');
    return;
  }
  // Freed from royal duty in the middle of it all? Join a normal school for your age.
  if (e.stage === 'royal' && !bornRoyal) {
    if (g.age < 12) Object.assign(e, { stage: 'elementary', yearsLeft: 12 - g.age });
    else if (g.age < 18) Object.assign(e, { stage: 'high', yearsLeft: 18 - g.age });
    else Object.assign(e, { stage: 'none', yearsLeft: 0 });
    log(g, '🎒 I left the palace tutors and joined a normal school.');
  }
  if (e.stage === 'none') {
    if (g.age === 5 && !e.degrees.length && !bornRoyal) {
      e.stage = 'elementary';
      e.yearsLeft = 7;
      e.missedExams = 0;
      e.grades = clamp(g.stats.smarts + rand(-15, 15));
      log(g, '🎒 I started elementary school.');
    }
    return;
  }
  if (e.stage === 'royal') {
    e.grades = clamp(Math.round(e.grades + (g.stats.smarts - e.grades) * 0.25 + rand(-5, 10)));
    adjust(g, 'smarts', rand(0, 2));
    adjust(g, 'looks', rand(0, 1));
    clubYear(g);
    log(g, `👑 At the Royal Academy I learned ${pick(ROYAL_LESSONS)}.`);
    if (!used(g, 'school:exam')) missExamYear(g);
    e.yearsLeft = Math.max(0, e.yearsLeft - 1);
    if (finalYear(g)) log(g, '👑 This is my last year at the academy — sit the final exam and I can graduate.');
    return;
  }

  e.grades = clamp(Math.round(e.grades + (g.stats.smarts - e.grades) * 0.3 + rand(-8, 8)));
  adjust(g, 'smarts', rand(0, 3));
  clubYear(g);
  if (!used(g, 'school:exam')) missExamYear(g);
  e.yearsLeft = Math.max(0, e.yearsLeft - 1);

  if ((e.stage === 'university' || e.stage === 'graduate') && e.grades < 20 && chance(0.35)) {
    log(g, '📉 I was expelled for failing grades.');
    leaveAllClubs(g);
    adjust(g, 'happiness', -15);
    Object.assign(e, { stage: 'none', program: undefined });
    return;
  }
  // Graduating is the player's move now — the Work tab has the button.
  if (finalYear(g)) {
    log(g, `🎓 I'm in my final year of ${stageLabel(e.stage)}. Sit the final exam and I can graduate.`);
  }
  return;
}

function clubYear(g: Game) {
  for (const m of g.clubs) {
    const c = clubOf(m.id);
    if (!c) continue;
    m.years++;
    for (const [k, v] of Object.entries(c.yearly) as [keyof Stats, number][]) adjust(g, k, v);
    if (c.counter) g.counters[c.counter] = (g.counters[c.counter] ?? 0) + 1;
    if (!m.president && m.years >= 2 && chance(0.25 + g.stats.looks / 400)) {
      m.president = true;
      adjust(g, 'happiness', 6);
      log(g, `🏅 I was elected president of the ${c.name}!`);
    } else if (chance(0.35)) {
      log(g, `${c.emoji} ${pick(c.moments)}`);
    }
  }
}

/** Clubs end when you stop going to school. */
export function leaveAllClubs(g: Game) {
  if (!g.clubs.length) return;
  log(g, `I said goodbye to my ${g.clubs.map((m) => clubOf(m.id)?.name).join(', ')}.`);
  g.clubs = [];
}

function workYear(g: Game) {
  const e = g.education;
  if (e.studentLoans > 0 && e.stage === 'none') e.studentLoans = Math.round(e.studentLoans * 1.03);

  const job = g.job;
  if (job) {
    job.years++;
    job.performance = clamp(job.performance + rand(-8, 6));
    g.money += Math.round(job.salary * (job.partTime ? 0.9 : 0.6));


    const career = CAREERS.find((c) => c.id === job.careerId);
    if (job.royal) {
      // Royal careers follow the line of succession, not performance reviews.
    } else if (career && job.years >= 2 && job.performance >= 70 && job.level < career.levels.length - 1 && chance(0.45)) {
      job.level++;
      job.title = career.levels[job.level];
      job.salary = Math.max(job.salary, salaryAt(career, job.level));
      job.performance = 55;
      adjust(g, 'happiness', 10);
      log(g, `📈 I was promoted to ${job.title}! New salary: ${money(job.salary)}.`);
    } else if (job.performance < 15 && chance(0.5)) {
      log(g, `📦 I was fired from my job as ${job.title}.`);
      adjust(g, 'happiness', -15);
      g.job = null;
    }
  } else if (g.retired) {
    g.money += g.pension;
  } else if (g.age >= 22 && g.age < 60 && g.education.stage === 'none' && g.prison === 0) {
    adjust(g, 'happiness', -rand(0, 3));
  }

  // Student loans: minimum payment of 10% of salary (or 8% of the balance), paid from savings.
  if (e.studentLoans > 0 && e.stage === 'none') {
    const due = Math.min(e.studentLoans, Math.max(job && !job.partTime ? Math.round(job.salary * 0.1) : 0, Math.round(e.studentLoans * 0.08)));
    const pay = Math.min(due, Math.max(0, g.money));
    e.studentLoans -= pay;
    g.money -= pay;
    if (pay > 0 && e.studentLoans === 0) log(g, '🎉 I paid off my student loans!');
  }

  // A spouse shares part of their income with the household.
  const spouse = living(g, 'spouse')[0];
  if (spouse?.salary) g.money += Math.round(spouse.salary * (spouse.vip ? 0.15 : 0.1));

  if (g.origin === 'homeless' && g.age < 18 && chance(0.5)) {
    adjust(g, 'health', -rand(0, 1));
    adjust(g, 'happiness', -rand(0, 1));
  }

  if (g.money < -5000 && chance(0.4)) {
    adjust(g, 'happiness', -5);
    log(g, 'Debt collectors keep calling me.');
  }
}

function assetYear(g: Game) {
  for (const a of g.assets) {
    a.age++;
    const area = districtOf(a.location)?.growth ?? 0; // smart postcodes climb faster
    a.value = Math.round(a.kind === 'car' ? a.value * 0.88 : a.value * (1 + rand(-3, 8) / 100 + area));
    g.money -= Math.round(a.kind === 'car' ? a.value * 0.03 : a.value * 0.01);
  }
  const home = g.assets.find((a) => a.kind === 'house');
  if (home) adjust(g, 'happiness', 1 + Math.min(3, Object.values(home.decor ?? {}).filter((v) => v && v !== 'none').length));
}

function statDrift(g: Game) {
  const a = g.age;
  adjust(g, 'health', a < 30 ? rand(-2, 3) : a < 50 ? rand(-3, 1) : a < 70 ? rand(-3, 1) : rand(-5, 1));
  adjust(g, 'happiness', Math.round((60 - g.stats.happiness) * 0.08) + rand(-4, 4));
  adjust(g, 'looks', a < 20 ? rand(-1, 3) : a < 35 ? rand(-1, 1) : rand(-2, 0));
  if (a > 70) adjust(g, 'smarts', rand(-3, 0));
}

export const royalFree = (g: Game) => g.origin !== 'royalty' || g.flags.includes('royalFreed');

function setRoyalLevel(g: Game, level: number) {
  const c = CAREERS.find((x) => x.id === 'royal')!;
  const title = royalJobTitle(g.gender, level);
  g.job = { careerId: 'royal', title, salary: salaryAt(c, level), years: g.job?.royal ? g.job.years : 0, performance: g.job?.performance ?? 60, level, partTime: false, royal: true };
  return title;
}

/** Royals take on duties automatically — unless the family let them choose their own path. */
function royalYear(g: Game) {
  if (royalFree(g) || g.prison > 0) return;
  const monarchs = living(g, 'mother', 'father').filter((p) => p.job === 'King' || p.job === 'Queen');
  if (g.age === 18 && !g.job?.royal) {
    const title = setRoyalLevel(g, 0);
    log(g, `👑 I took up my royal duties as ${title} ${g.firstName} of ${g.country}.`);
    return;
  }
  if (!g.job?.royal) return;
  if (g.job.level < 2 && g.age >= 18 && monarchs.length === 0) {
    const title = setRoyalLevel(g, 2);
    adjust(g, 'happiness', 10);
    log(g, `👑 I was crowned ${title} of ${g.country}! Long live the ${title.toLowerCase()}!`);
  } else if (g.job.level === 0 && g.age >= 30) {
    const title = setRoyalLevel(g, 1);
    log(g, `👑 I was named ${title}, next in line to the throne.`);
  }
}

function milestones(g: Game) {
  if (g.age === 18) {
    log(g, '🌙 I’m officially an adult!');
    const fund = originOf(g.origin).trustFund;
    if (fund > 0) {
      g.money += fund;
      log(g, `💰 My trust fund unlocked: ${money(fund)}!`);
    }
  }
  royalYear(g);
  if (g.age === 60 && g.job && !g.job.partTime && !g.job.royal) log(g, 'I’m now old enough to retire.');
  if (g.age === 100) log(g, '💯 I turned 100 years old!');
}
