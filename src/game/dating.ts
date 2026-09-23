import type { Game, Gender, Look, Result } from './types';
import { CAREERS, salaryAt } from './data';
import { adjust, datingGender, makePerson, isSingle, randomFirst } from './helpers';
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

const VIP_JOBS: { job: string; emoji: string; salary: [number, number] }[] = [
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

export function datingBlock(g: Game, vip: boolean): string | null {
  if (g.age < (vip ? 18 : 16)) return `Age ${vip ? 18 : 16}+`;
  if (g.prison > 0) return 'In prison';
  if (!isSingle(g)) return 'You’re already taken 💍';
  return null;
}

export function askChance(g: Game, p: Profile) {
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
    firstName: p.firstName, look: p.look, job: p.job, salary: p.salary, education: p.education, bio: p.bio, interests: p.interests, vip: p.vip,
  });
  g.relationships.push(person);
  adjust(g, 'happiness', p.vip ? 15 : 8);
  return {
    ok: true,
    result: {
      emoji: p.vip ? '👑' : '💞', title: p.vip ? 'VIP match!' : 'It’s a date!',
      text: `${p.firstName} (${p.age}), ${p.job === 'Student' ? 'a student' : `a ${p.job}${p.salary ? ` earning ${money(p.salary)}/yr` : ''}`}, said yes! We’re officially dating.`,
      celebrate: true,
    },
  };
}
