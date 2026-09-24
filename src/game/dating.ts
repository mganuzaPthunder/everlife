import type { Game, Gender, Look, Result } from './types';
import { CAREERS, salaryAt } from './data';
import { adjust, datingGender, log, makePerson, isSingle, randomFirst } from './helpers';
import { ACCESSORIES, CLOTH_COLORS, randomLook } from './look';
import { LAST } from './names';
import { chance, clamp, money, pick, rand } from './util';

export interface Profile {
  key: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  look: Look;
  job: string;
  jobEmoji: string;
  salary: number;
  education: string;
  bio: string;
  interests: string[];
  vip: boolean;
  /** A prince, princess or duke from the Royal tab. */
  royal?: boolean;
  /** Their family allows them to marry outside the nobility. */
  blessing?: boolean;
  realm?: string;
  /** 0–100 */
  compatibility: number;
  heightCm: number;
  zodiac: string;
}

const BIOS = [
  'Looking for someone to watch sunsets with 🌅',
  'Dog parent. Coffee snob. Terrible at bowling.',
  'I will absolutely steal your fries.',
  'Swipe right if you can beat me at Mario Kart.',
  'Hopeless romantic with a playlist for every mood.',
  'Weekend hiker, weekday overthinker.',
  'Let’s get boba and talk about the stars ✨',
  'I cook a mean adobo. Just saying.',
  'Currently learning guitar (badly).',
  'Plant collector. 47 and counting 🌿',
  'Looking for my player two 🎮',
  'Beach > mountains. Fight me.',
];

const VIP_BIOS = [
  'You’ve probably seen me on a billboard. Let’s keep it lowkey 🤫',
  'Private jet, but I still eat instant noodles at 2 a.m.',
  'I have everything except someone to share it with.',
  'Red carpets are exhausting. Movie night at mine?',
  'Just bought an island. Needs a name. Ideas?',
  'Fame is loud. Looking for something quiet 🌙',
];

const INTERESTS = ['🎮 Gaming', '🎵 Music', '🏀 Sports', '🍜 Food', '✈️ Travel', '📚 Books', '🎨 Art', '🐶 Dogs', '🐱 Cats', '🌿 Plants', '🎬 Movies', '💃 Dancing', '🧘 Yoga', '📸 Photos', '☕ Coffee', '🏖️ Beach', '🌌 Stargazing', '🍳 Cooking'];
const ZODIAC = ['♈ Aries', '♉ Taurus', '♊ Gemini', '♋ Cancer', '♌ Leo', '♍ Virgo', '♎ Libra', '♏ Scorpio', '♐ Sagittarius', '♑ Capricorn', '♒ Aquarius', '♓ Pisces'];

export const VIP_JOBS: { job: string; emoji: string; salary: [number, number] }[] = [
  { job: 'Movie Star', emoji: '🎬', salary: [5, 60] },
  { job: 'Pop Star', emoji: '🎤', salary: [5, 80] },
  { job: 'NBA All-Star', emoji: '🏀', salary: [20, 50] },
  { job: 'Tech Billionaire', emoji: '💻', salary: [50, 500] },
  { job: 'CEO', emoji: '💼', salary: [5, 40] },
  { job: 'Supermodel', emoji: '📸', salary: [3, 30] },
  { job: 'Royal Heir', emoji: '👑', salary: [20, 100] },
  { job: 'Formula 1 Driver', emoji: '🏎️', salary: [10, 60] },
  { job: 'Oscar-winning Director', emoji: '🏆', salary: [5, 30] },
  { job: 'Mega Influencer', emoji: '🤳', salary: [2, 25] },
  { job: 'Soccer Superstar', emoji: '⚽', salary: [20, 120] },
  { job: 'Hotel Heiress', emoji: '🏨', salary: [10, 70] },
];

const ROYAL_BIOS = [
  'Third in line, first to the buffet.',
  'Raised by tutors, saved by horses 🐴',
  'I open hospitals for a living. Ask me anything.',
  'Palace life is quieter than you’d think. Mostly corridors.',
  'Looking for someone who won’t curtsy every time I walk in.',
  'I can waltz, fence and absolutely not cook.',
  'The crown is heavy. The conversation doesn’t have to be.',
  'My family has opinions about everything, including this app.',
];

export const REALMS = ['Aldoria', 'Vestmark', 'Solencia', 'Károlyi', 'Marnovia', 'Belhaven', 'Ostrava', 'Calenthe', 'Rhuvane', 'Sundiata'];
export const ROYAL_TITLES: Record<Gender, string[]> = {
  male: ['Prince', 'Crown Prince', 'Grand Duke', 'Archduke'],
  female: ['Princess', 'Crown Princess', 'Grand Duchess', 'Archduchess'],
};
const ROYAL_INTERESTS = ['🐴 Riding', '⛵ Sailing', '🎻 Opera', '🏹 Archery', '🖼️ Art', '🎾 Tennis', '⛷️ Skiing', '📜 History', '🌍 Charity work', '🥂 State dinners'];

const eduFor = (salary: number) => (salary > 150_000 ? pick(['Master’s degree', 'Doctorate', 'Bachelor’s degree']) : salary > 50_000 ? pick(['Bachelor’s degree', 'Community college']) : pick(['High school', 'Some college', 'Trade school']));

export function makeProfile(g: Game, vip: boolean): Profile {
  const gender = datingGender(g);
  const age = Math.max(g.age >= 18 ? 18 : 16, g.age + rand(vip ? -8 : -5, vip ? 8 : 5));
  const look = randomLook(gender);
  let job: string, jobEmoji: string, salary: number;
  if (vip) {
    const v = pick(VIP_JOBS);
    job = v.job; jobEmoji = v.emoji;
    salary = rand(v.salary[0], v.salary[1]) * 1_000_000;
    look.top = pick(['suit', 'gown', 'leather', 'royal', 'dress', 'kimono']);
    look.acc = { ...look.acc, [pick(['ears', 'neck', 'glasses'] as const)]: pick(['diamonds', 'goldchain', 'aviators', 'pearls', 'pearlnecklace']) };
    if (v.job === 'Royal Heir') look.acc = { ...look.acc, hat: 'crown' };
    look.acc = Object.fromEntries(Object.entries(look.acc).filter(([slot, id]) => ACCESSORIES.some((a) => a.id === id && a.slot === slot)));
  } else if (age < 18) {
    job = 'Student'; jobEmoji = '🎒'; salary = 0;
  } else {
    const pool = CAREERS.filter((c) => !c.special && !c.partTime && c.minAge <= age);
    const c = pick(pool);
    const level = Math.min(c.levels.length - 1, Math.max(0, Math.floor((age - 22) / 8) + rand(-1, 1)));
    job = chance(0.12) ? 'Unemployed' : c.field || c.levels.length === 1 ? c.title : c.levels[level];
    jobEmoji = job === 'Unemployed' ? '🛋️' : c.emoji;
    salary = job === 'Unemployed' ? 0 : salaryAt(c, level);
  }
  look.topColor = pick(CLOTH_COLORS);
  const interests = [...INTERESTS].sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    key: Math.random().toString(36).slice(2),
    firstName: randomFirst(gender),
    lastName: pick(LAST),
    gender, age, look, job, jobEmoji, salary,
    education: vip ? pick(['Harvard dropout', 'Oxford graduate', 'Juilliard alum', 'Self-made', 'Private tutors']) : age < 18 ? 'High school' : eduFor(salary),
    bio: pick(vip ? VIP_BIOS : BIOS),
    interests,
    vip,
    compatibility: rand(35, 99),
    heightCm: rand(gender === 'male' ? 165 : 152, gender === 'male' ? 195 : 182),
    zodiac: pick(ZODIAC),
  };
}

/** A prince or princess for the Royal tab. */
export function makeRoyalProfile(g: Game): Profile {
  const gender = datingGender(g);
  const age = Math.max(18, g.age + rand(-6, 6));
  const look = randomLook(gender);
  look.top = pick(['royal', 'gown', 'ballgown', 'suit', 'tuxedo', 'uniform']);
  look.topColor = pick(['#e0445a', '#2b6be0', '#4b2a86', '#f4c95d', '#f5f0ff']);
  look.acc = { hat: chance(0.6) ? 'crown' : 'tiara', neck: pick(['sash', 'medal', 'pearlnecklace']) };
  const title = pick(ROYAL_TITLES[gender]);
  const realm = pick(REALMS);
  // Most royal families still insist on marrying nobility. A few don't.
  const blessing = chance(0.3);
  return {
    key: Math.random().toString(36).slice(2),
    firstName: randomFirst(gender),
    lastName: `of ${realm}`,  // the house and the realm are the same name
    gender, age, look,
    job: title,
    jobEmoji: '👑',
    salary: rand(8, 120) * 1_000_000,
    education: pick(['Royal Academy', 'Private tutors at the palace', 'Oxford, then the Royal Academy', 'Military academy']),
    bio: pick(ROYAL_BIOS),
    interests: [...ROYAL_INTERESTS].sort(() => Math.random() - 0.5).slice(0, 3),
    vip: true,
    royal: true,
    blessing,
    realm,
    compatibility: rand(40, 99),
    heightCm: rand(gender === 'male' ? 172 : 160, gender === 'male' ? 196 : 184),
    zodiac: pick(ZODIAC),
  };
}

export function datingBlock(g: Game, vip: boolean): string | null {
  if (g.age < (vip ? 18 : 16)) return `Age ${vip ? 18 : 16}+`;
  if (g.prison > 0) return 'In prison';
  if (!isSingle(g)) return 'You’re already taken 💍';
  return null;
}

export function askChance(g: Game, p: Profile) {
  if (p.royal) {
    const royalty = ['royalty'].includes(g.origin) ? 0.35 : 0;
    const standing = g.money >= 5_000_000 ? 0.1 : 0;
    return clamp(0.18 + g.stats.looks / 300 + royalty + standing + (p.compatibility - 60) / 300, 0.05, 0.9);
  }
  const fame = ['royalty', 'celebrity'].includes(g.origin) || g.job?.careerId === 'actor' || g.job?.careerId === 'popstar' ? 0.2 : 0;
  const rich = g.money >= 1_000_000 ? 0.1 : 0;
  const base = p.vip ? 0.12 + g.stats.looks / 280 + fame + rich : 0.3 + g.stats.looks / 220;
  return clamp(base + (p.compatibility - 60) / 250, 0.05, 0.92);
}

/** Ask someone out from the app. On a yes they become your partner. */
export function askOut(g: Game, p: Profile): { ok: boolean; result?: Result } {
  if (datingBlock(g, p.vip)) return { ok: false };
  if (!chance(askChance(g, p))) {
    adjust(g, 'happiness', -2);
    return { ok: false };
  }
  const person = makePerson('partner', p.gender, p.age, p.lastName, rand(55, 80));
  Object.assign(person, {
    firstName: p.firstName, look: p.look, job: p.job, salary: p.salary, education: p.education, bio: p.bio, interests: p.interests, vip: p.vip, royal: p.royal,
  });
  g.relationships.push(person);
  adjust(g, 'happiness', p.vip ? 15 : 8);
  return {
    ok: true,
    result: {
      emoji: p.royal ? '👑' : p.vip ? '⭐' : '💞', title: p.royal ? 'A royal match!' : p.vip ? 'VIP match!' : 'It’s a date!',
      text: `${p.firstName} (${p.age}), ${p.job === 'Student' ? 'a student' : `a ${p.job}${p.salary ? ` earning ${money(p.salary)}/yr` : ''}`}, said yes! We’re officially dating.`,
      celebrate: true,
    },
  };
}

/* ───────── Make a Lover ───────── */

export type LoverStatus = 'regular' | 'vip' | 'royal';

export interface LoverSpec {
  firstName: string;
  gender: Gender;
  age: number;
  status: LoverStatus;
  /** A career id (regular), a VIP job name, or a royal title. */
  job: string;
  realm?: string;
  look: Look;
}

/** The first custom lover costs $1M; each one after that costs double. */
export const loverPrice = (g: Game) => 1_000_000 * 2 ** (g.counters.madeLover ?? 0);

/** Careers a made-to-order lover can have. */
export const loverCareers = () => CAREERS.filter((c) => !c.hidden && !c.partTime);

export function makeLoverBlock(g: Game): string | null {
  if (g.age < 18) return 'Age 18+';
  if (g.prison > 0) return 'In prison';
  if (!isSingle(g)) return 'You’re already taken 💍';
  if (g.money < loverPrice(g)) return 'Can’t afford';
  return null;
}

/** What the lover's job line and salary come out as. */
export function loverJob(spec: Pick<LoverSpec, 'status' | 'job' | 'age' | 'realm'>): { job: string; emoji: string; salary: number; education: string } {
  if (spec.status === 'royal') {
    return { job: `${spec.job} of ${spec.realm ?? REALMS[0]}`, emoji: '👑', salary: 40_000_000, education: 'Royal Academy' };
  }
  if (spec.status === 'vip') {
    const v = VIP_JOBS.find((x) => x.job === spec.job) ?? VIP_JOBS[0];
    return { job: v.job, emoji: v.emoji, salary: Math.round((v.salary[0] + v.salary[1]) / 2) * 1_000_000, education: 'Self-made' };
  }
  if (spec.job === 'unemployed') return { job: 'Unemployed', emoji: '🛋️', salary: 0, education: 'High school' };
  const c = loverCareers().find((x) => x.id === spec.job) ?? loverCareers()[0];
  const level = Math.min(c.levels.length - 1, Math.max(0, Math.floor((spec.age - 22) / 8)));
  const salary = salaryAt(c, level);
  return { job: c.field || c.levels.length === 1 ? c.title : c.levels[level], emoji: c.emoji, salary, education: eduFor(salary) };
}

export function makeLover(g: Game, spec: LoverSpec): Result | undefined {
  if (makeLoverBlock(g)) return;
  const price = loverPrice(g);
  g.money -= price;
  g.counters.madeLover = (g.counters.madeLover ?? 0) + 1;
  const age = Math.max(18, Math.min(90, Math.round(spec.age)));
  const j = loverJob({ ...spec, age });
  const royal = spec.status === 'royal';
  const person = makePerson('partner', spec.gender, age, royal ? `of ${spec.realm ?? REALMS[0]}` : pick(LAST), rand(85, 100));
  Object.assign(person, {
    firstName: spec.firstName.trim() || randomFirst(spec.gender),
    look: structuredClone(spec.look),
    job: j.job, salary: j.salary, education: j.education,
    bio: 'Made just for me ✨', vip: spec.status !== 'regular', royal: royal || undefined,
  });
  g.relationships.push(person);
  adjust(g, 'happiness', 15);
  log(g, `🪄 I made my perfect lover, ${person.firstName} (${age}), for ${money(price)}.`);
  return {
    emoji: '🪄', title: 'Your perfect match!',
    text: `${person.firstName} (${age}), ${j.job === 'Unemployed' ? 'between jobs' : `a ${j.job}`}, is my partner now. The next one would cost ${money(loverPrice(g))}.`,
    celebrate: true,
  };
}
