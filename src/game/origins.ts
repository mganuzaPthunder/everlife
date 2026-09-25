import type { StatKey } from './types';

export type OriginId = 'royalty' | 'celebrity' | 'rich' | 'official' | 'normal' | 'poor' | 'homeless';

export interface Origin {
  id: OriginId;
  emoji: string;
  name: string;
  blurb: string;
  /** Weight when "Random" is picked. */
  weight: number;
  /** Jobs the parents might have, with a yearly salary range. */
  parentJobs: { title: string; salary: [number, number] }[];
  /** Pocket money a kid gets when asking parents (per request, before the 1–10 roll). */
  allowance: number;
  /** What adults get when asking parents (per request, before the 1–10 roll). */
  adultGift: number;
  /** Paid out on the 18th birthday. */
  trustFund: number;
  /** Multiplies the chance that parents agree to pay tuition. */
  tuition: number;
  /** Range an adult inherits when a parent dies (in $1,000s). */
  inheritance: [number, number];
  /** Bonus to job and school acceptance. */
  connections: number;
  statShift: Partial<Record<StatKey, number>>;
  /** Free wardrobe items from birth. */
  wardrobe?: string[];
  /** "You'll be born into …" */
  phrase: string;
  birthLine: (country: string) => string;
}

export const ORIGINS: Origin[] = [
  {
    id: 'royalty', phrase: 'the royal family', emoji: '👑', name: 'Royalty', weight: 2,
    blurb: 'Born a prince or princess. Palaces, a crown, and a $10M trust fund — but the whole world is watching.',
    parentJobs: [{ title: 'Monarch', salary: [20_000_000, 40_000_000] }],
    allowance: 5_000, adultGift: 500_000, trustFund: 10_000_000, tuition: 99, inheritance: [50_000, 400_000], connections: 0.3,
    statShift: { happiness: 10, looks: 10 }, wardrobe: ['crown', 'royal'],
    birthLine: (c) => `👑 I was born into the royal family of ${c}!`,
  },
  {
    id: 'celebrity', phrase: 'a celebrity family', emoji: '⭐', name: 'Celebrity parents', weight: 5,
    blurb: 'Your parents are famous. Paparazzi from day one and a $2M trust fund.',
    parentJobs: [{ title: 'Movie Star', salary: [3_000_000, 20_000_000] }, { title: 'Pop Star', salary: [2_000_000, 15_000_000] }, { title: 'Film Director', salary: [1_000_000, 8_000_000] }],
    allowance: 1_000, adultGift: 100_000, trustFund: 2_000_000, tuition: 99, inheritance: [5_000, 60_000], connections: 0.2,
    statShift: { looks: 10, happiness: 5 },
    birthLine: () => '⭐ I was born to famous parents. The paparazzi were outside the hospital.',
  },
  {
    id: 'rich', phrase: 'a wealthy family', emoji: '💎', name: 'Wealthy family', weight: 12,
    blurb: 'A big house, private tutors, and a $500K trust fund.',
    parentJobs: [{ title: 'CEO', salary: [400_000, 3_000_000] }, { title: 'Surgeon', salary: [300_000, 600_000] }, { title: 'Investment Banker', salary: [300_000, 1_500_000] }],
    allowance: 200, adultGift: 20_000, trustFund: 500_000, tuition: 99, inheritance: [800, 8_000], connections: 0.1,
    statShift: { smarts: 5 },
    birthLine: () => '💎 I was born into a wealthy family.',
  },
  {
    id: 'official', phrase: 'a family of public officials', emoji: '🏛️', name: 'Child of an official', weight: 8,
    blurb: 'A parent in government means connections everywhere — easier jobs and schools, and a $150K trust fund.',
    parentJobs: [{ title: 'Senator', salary: [170_000, 250_000] }, { title: 'Mayor', salary: [120_000, 200_000] }, { title: 'Governor', salary: [150_000, 220_000] }, { title: 'Ambassador', salary: [160_000, 240_000] }],
    allowance: 80, adultGift: 5_000, trustFund: 150_000, tuition: 1.6, inheritance: [300, 2_000], connections: 0.25,
    statShift: { smarts: 5 },
    birthLine: () => '🏛️ I was born into a family of public officials.',
  },
  {
    id: 'normal', phrase: 'a normal family', emoji: '🏡', name: 'Normal family', weight: 45,
    blurb: 'A regular, loving family. No head start, no handicap.',
    parentJobs: [{ title: 'Teacher', salary: [45_000, 65_000] }, { title: 'Nurse', salary: [60_000, 85_000] }, { title: 'Accountant', salary: [55_000, 90_000] }, { title: 'Electrician', salary: [50_000, 75_000] }, { title: 'Office Manager', salary: [45_000, 70_000] }],
    allowance: 10, adultGift: 100, trustFund: 0, tuition: 1, inheritance: [5, 150], connections: 0,
    statShift: {},
    birthLine: () => '🏡 I was born into a normal, loving family.',
  },
  {
    id: 'poor', phrase: 'a struggling family', emoji: '🥫', name: 'Struggling family', weight: 20,
    blurb: 'Money is always tight. Parents rarely have anything to spare.',
    parentJobs: [{ title: 'Cashier', salary: [20_000, 28_000] }, { title: 'Warehouse Worker', salary: [24_000, 32_000] }, { title: 'Janitor', salary: [22_000, 30_000] }, { title: 'Unemployed', salary: [0, 0] }],
    allowance: 2, adultGift: 20, trustFund: 0, tuition: 0.4, inheritance: [0, 10], connections: -0.05,
    statShift: { happiness: -5 },
    birthLine: () => '🥫 I was born into a family that struggles to make ends meet.',
  },
  {
    id: 'homeless', phrase: 'a homeless family', emoji: '⛺', name: 'Homeless', weight: 8,
    blurb: 'Born without a home. The hardest start there is — vitality and joy take a hit, and no one can help pay for anything.',
    parentJobs: [{ title: 'Unhoused', salary: [0, 0] }],
    allowance: 0, adultGift: 0, trustFund: 0, tuition: 0, inheritance: [0, 0], connections: -0.1,
    statShift: { health: -15, happiness: -15 },
    birthLine: () => '⛺ I was born into a homeless family, living in a shelter.',
  },
];

export const originOf = (id?: string) => ORIGINS.find((o) => o.id === id) ?? ORIGINS.find((o) => o.id === 'normal')!;

export function randomOrigin(): OriginId {
  const total = ORIGINS.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of ORIGINS) { r -= o.weight; if (r <= 0) return o.id; }
  return 'normal';
}

/** Title shown in the header, e.g. "Princess". */
export function royalTitle(origin: string | undefined, gender: 'male' | 'female') {
  if (origin !== 'royalty') return null;
  return gender === 'male' ? 'Prince' : 'Princess';
}
