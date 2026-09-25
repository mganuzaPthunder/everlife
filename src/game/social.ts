import type { Game, Result, SocialAccount } from './types';
import { adjust, log } from './helpers';
import { socialBoost } from './business';
import { chance, clamp, money, pick, rand } from './util';

/* ───────── Fame ───────── */

export const FAME_TIERS = ['Not Known', 'Known', 'Well-Known', 'Popular', 'Famous'] as const;
export type FameTier = (typeof FAME_TIERS)[number];

/** Fame that comes with the job itself. */
function careerFame(g: Game) {
  const job = g.job;
  if (!job) return 0;
  const byId: Record<string, number> = {
    royal: 45, president: 45, actor: 40, popstar: 42, influencer: 35, model: 28, athlete: 32, musician: 18,
    singer: 25, guitarist: 20, pianist: 18, violinist: 16, drummer: 16, dj: 24, saxophonist: 14,
    basketball: 30, soccer: 30, tennis: 28, boxer: 28, swimmer: 24, gymnast: 24, skater: 24, baseball: 28, sprinter: 24, golfer: 24, volleyball: 22,
    astronaut: 30, judge: 18, exec: 14, chef: 16, journalist: 14, fashiondesigner: 18, mafia: 12, doctor: 10, surgeon: 12, neurosurgeon: 14,
  };
  const base = byId[job.careerId] ?? 4;
  return base * (0.6 + 0.2 * Math.min(2, job.level));
}

export const totalFollowers = (g: Game) => g.socials.reduce((s, a) => s + a.followers, 0);

/** Followers matter on a curve: 1K ≈ 12, 100K ≈ 36, 10M ≈ 60. */
const followerFame = (followers: number) => Math.min(60, Math.log10(followers + 1) * 12);

/** Royal, celebrity and official families make you famous before you can even talk. */
const BORN_FAME: Record<string, number> = { royalty: 80, celebrity: 80, official: 60 };
const bornFame = (g: Game) => BORN_FAME[g.origin] ?? 0;

export function fameOf(g: Game) {
  const businessFame = g.business ? g.business.popularity / 5 : 0; // a well-loved business makes you known too
  return clamp(Math.round(followerFame(totalFollowers(g)) + careerFame(g) + bornFame(g) + businessFame + g.fameBonus));
}

export function fameTier(fame: number): FameTier {
  if (fame >= 80) return 'Famous';
  if (fame >= 55) return 'Popular';
  if (fame >= 30) return 'Well-Known';
  if (fame >= 10) return 'Known';
  return 'Not Known';
}

export const addFame = (g: Game, n: number) => { g.fameBonus = clamp(g.fameBonus + n, -20, 60); };

/** 950 → "950", 12_345 → "12.3K", 4_621_100_000 → "4.6B". Never "1000K" — it rolls over to "1M". */
export function formatFollowers(n: number) {
  const units: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (let i = 0; i < units.length; i++) {
    const [size, unit] = units[i];
    if (n < size) continue;
    const v = +(n / size).toFixed(1);
    if (v >= 1000 && i > 0) return `${+(n / units[i - 1][0]).toFixed(1)}${units[i - 1][1]}`;
    return `${v}${unit}`;
  }
  return String(Math.round(n));
}

/** Even the biggest accounts in the world stop somewhere. */
export const MAX_FOLLOWERS = 1_000_000_000;
const capFollowers = (g: Game) => { for (const a of g.socials) a.followers = Math.min(MAX_FOLLOWERS, Math.round(a.followers)); };

/* ───────── The apps ───────── */

export interface PostKind {
  id: string;
  emoji: string;
  name: string;
  /** Stat that decides how well it does. */
  stat: 'looks' | 'happiness' | 'smarts' | 'health';
  minAge?: number;
  /** Can blow up bigger than usual… or backfire. */
  risky?: boolean;
  /** You're singing in it: untrained voices get fewer views, great ones can blow up. */
  singing?: boolean;
  /** Lessons that help (best one counts), e.g. ['music:guitar', 'sport:*']. */
  skills?: string[];
  /** School clubs that help. */
  clubs?: string[];
  lines: string[];
}

export interface SocialApp {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  color: string;
  minAge: number;
  /** What the app calls followers. */
  audience?: string;
  posts: PostKind[];
}

export const SOCIAL_APPS: SocialApp[] = [
  {
    id: 'instastar', emoji: '📸', name: 'Instastar', tagline: 'Photos & aesthetics', color: '#c2418f', minAge: 10,
    posts: [
      { id: 'selfie', emoji: '🤳', name: 'Post a selfie', stat: 'looks', lines: ['Golden hour selfie 🌅', 'New hair, who dis ✨', 'Just woke up like this 😌'] },
      { id: 'outfit', emoji: '👗', name: 'Post an outfit', stat: 'looks', lines: ['Outfit of the day 💅', 'Thrifted this whole look!', 'Sunset colors today 🧡'] },
      { id: 'food', emoji: '🍜', name: 'Post your food', stat: 'happiness', lines: ['Homemade ramen 🍜', 'This cake took 6 hours 🎂', 'Best adobo in town 🤤'] },
      { id: 'pet', emoji: '🐶', name: 'Post your pet', stat: 'happiness', lines: ['He did a little sploot 🐾', 'She knocked over my coffee again ☕', 'Puppy eyes = instant likes 🥺'] },
      { id: 'singreel', emoji: '🎤', name: 'Post a singing reel', stat: 'looks', singing: true, lines: ['Sang this at sunset, be nice 🎤', 'Acoustic version 🌙', 'Couldn’t sleep so I sang instead ✨'] },
      { id: 'sportclip', emoji: '🏅', name: 'Post a sports highlight', stat: 'health', skills: ['sport:*'], clubs: ['sports', 'cheer'], lines: ['Game day 🏅', 'New personal best!! 💪', 'Training never stops 🔥'] },
      { id: 'travel', emoji: '🏖️', name: 'Post a travel pic', stat: 'happiness', lines: ['Beach days 🏖️', 'Found this hidden waterfall 💦', 'Sunset from the rooftop 🌇'] },
      { id: 'thirst', emoji: '🔥', name: 'Post a thirst trap', stat: 'looks', minAge: 18, risky: true, lines: ['Gym mirror, sorry not sorry 💪', 'Beach day 😎', 'Felt cute, might delete later 🔥'] },
    ],
  },
  {
    id: 'tiktalk', emoji: '🎵', name: 'TikTalk', tagline: 'Short videos & trends', color: '#6f8cff', minAge: 10,
    posts: [
      { id: 'dance', emoji: '💃', name: 'Post a dance', stat: 'health', clubs: ['dance', 'cheer'], skills: ['sport:gymnastics', 'sport:skating'], lines: ['Learned the trending dance in one night 💃', 'Dance challenge with my friends!', 'Tried the hardest routine yet 🕺'] },
      { id: 'lipsync', emoji: '🎤', name: 'Post a lip sync', stat: 'looks', lines: ['Lip syncing my comfort song 🎶', 'POV: it’s 2 a.m. and I’m dramatic 🎭', 'Duet with my cat 🐱'] },
      { id: 'singing', emoji: '🎙️', name: 'Post a singing video', stat: 'looks', singing: true, lines: ['Hitting THAT note 🎙️', 'Singing the trending sound, my version 🎶', 'Duet this if you can reach it 😤'] },
      { id: 'comedy', emoji: '😂', name: 'Post a comedy skit', stat: 'happiness', clubs: ['drama'], lines: ['Me explaining my life choices 😂', 'When the teacher says “pop quiz” 💀', 'Siblings be like…'] },
      { id: 'hack', emoji: '💡', name: 'Post a life hack', stat: 'smarts', clubs: ['science', 'coding'], lines: ['This study hack changed my grades 📚', '3 things nobody tells you about money 💸', 'How to fold a shirt in 2 seconds 👕'] },
      { id: 'prank', emoji: '🙃', name: 'Post a prank', stat: 'happiness', risky: true, lines: ['Pranked my whole family 🙃', 'Swapped the sugar for salt 😭', 'Scared my sibling with a rubber snake 🐍'] },
      { id: 'grwm', emoji: '🪞', name: 'Post a get-ready-with-me', stat: 'looks', lines: ['GRWM for a night out ✨', 'Get ready with me: school edition 🎒', 'Doing my makeup in 60 seconds 💄'] },
    ],
  },
  {
    id: 'spotify', emoji: '🎧', name: 'Tunewave', tagline: 'Release your music', color: '#ff8a3d', minAge: 13, audience: 'listeners',
    posts: [
      { id: 'single', emoji: '🎤', name: 'Release a single', stat: 'looks', singing: true, lines: ['New single “Midnight Sunset” out now 🌅', 'Wrote this one in my bedroom 🎤', 'My first single is finally out!! 💿'] },
      { id: 'cover', emoji: '🎶', name: 'Release a cover', stat: 'happiness', singing: true, lines: ['My cover of a classic 🎶', 'Stripped-back cover, just me and a mic 🎙️', 'Covered my comfort song 💜'] },
      { id: 'instrumental', emoji: '🎹', name: 'Release an instrumental', stat: 'smarts', skills: ['music:*'], clubs: ['band'], lines: ['Lo-fi beats to study to 🎹', 'Late-night instrumental 🌙', 'Just the melody this time 🎼'] },
      { id: 'album', emoji: '💿', name: 'Release an album', stat: 'looks', singing: true, minAge: 16, risky: true, lines: ['My debut album is OUT 💿', '12 tracks, 3 years of my life 🎧', 'The album. It’s here. 🌅'] },
    ],
  },
  {
    id: 'chirp', emoji: '🐦', name: 'Chirp', tagline: 'Thoughts in 280 characters', color: '#3fc1b0', minAge: 12,
    posts: [
      { id: 'joke', emoji: '😆', name: 'Post a joke', stat: 'happiness', lines: ['why do i open the fridge like the answer is in there', 'my sleep schedule is a work of fiction', 'coffee is just bean soup. thank you for coming to my talk'] },
      { id: 'thread', emoji: '🧵', name: 'Post a thread', stat: 'smarts', clubs: ['debate', 'book'], lines: ['a thread on how i saved my first $1000 🧵', 'things i wish i knew at 16, a thread', '5 books that rewired my brain 🧵'] },
      { id: 'update', emoji: '✨', name: 'Post an update', stat: 'happiness', lines: ['big news coming soon 👀', 'new chapter, same me ✨', 'grateful for this week 🌙'] },
      { id: 'hottake', emoji: '🌶️', name: 'Post a hot take', stat: 'smarts', risky: true, clubs: ['debate'], lines: ['unpopular opinion: pineapple belongs on pizza 🍍', 'mornings are a scam', 'the sequel was better. fight me'] },
    ],
  },
];

/** Shows up on every app once you own a business. */
export const PROMO_POST: PostKind = {
  id: 'promo', emoji: '🏢', name: 'Promote my business', stat: 'smarts',
  lines: ['Come visit {biz} this weekend! ✨', 'Big news from {biz} 👀', 'Proud of what we’re building at {biz} 💜', 'Tag a friend who needs to try {biz}!'],
};

/** The post kinds you can pick on an app right now. */
export const postKindsFor = (g: Game, app: SocialApp) => (g.business ? [...app.posts, PROMO_POST] : app.posts);

export const appOf = (id: string) => SOCIAL_APPS.find((a) => a.id === id)!;
export const accountOf = (g: Game, appId: string) => g.socials.find((s) => s.app === appId);

export const POSTS_PER_YEAR = 3;
export const postsLeft = (g: Game, appId: string) => POSTS_PER_YEAR - (g.yearUses[`post:${appId}`] ?? 0);

export function suggestHandle(g: Game, app: SocialApp) {
  const base = `${g.firstName}${g.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tail = app.id === 'chirp' ? '' : pick(['', '_', String(rand(2, 99)), 'official', 'xo']);
  return (base + tail).slice(0, 18);
}

export function joinApp(g: Game, appId: string, handle: string): Result | undefined {
  const app = appOf(appId);
  if (!app || accountOf(g, appId) || g.age < app.minAge) return;
  const clean = handle.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 18) || suggestHandle(g, app);
  // Fans from your biggest account come looking for you — and famous people get followed on sight.
  const fame = fameOf(g);
  const fans = Math.round(biggestAccount(g) * (0.03 + Math.random() * 0.07))
    + (fame >= 80 ? rand(5_000, 40_000) : fame >= 55 ? rand(800, 6_000) : fame >= 30 ? rand(50, 400) : 0);
  g.socials.push({ app: appId, handle: clean, followers: rand(0, 12) + fans, posts: 0, feed: [] });
  adjust(g, 'happiness', 2);
  capFollowers(g);
  log(g, `${app.emoji} I made a ${app.name} account: @${clean}`);
  return { emoji: app.emoji, title: `Welcome to ${app.name}!`, text: `I'm @${clean} now. Time to post something!` };
}

/** Famous people blow up far more easily. */
const fameBoost = (fame: number) => (fame >= 80 ? 0.35 : fame >= 55 ? 0.2 : fame >= 30 ? 0.08 : fame / 900);

const biggestAccount = (g: Game) => Math.max(0, ...g.socials.map((a) => a.followers));

/** Your best level (0–100) in the lessons a post uses. 'music:*' means any instrument. */
function bestLesson(g: Game, keys: string[]) {
  let best = 0;
  for (const k of keys) {
    const v = k.endsWith(':*')
      ? Math.max(0, ...Object.entries(g.skills).filter(([s]) => s.startsWith(k.slice(0, -1))).map(([, n]) => n))
      : g.skills[k] ?? 0;
    best = Math.max(best, v);
  }
  return best;
}

export const singingSkill = (g: Game) => g.skills['music:voice'] ?? 0;

/** How much your lessons and clubs help a post: a reach multiplier and extra viral chance. */
export function training(g: Game, kind: PostKind) {
  let mult = 1;
  let viral = 0;
  if (kind.singing) {
    const v = singingSkill(g);
    // No lessons → people scroll past. Trained voices get heard.
    mult = v < 20 ? 0.35 : 0.4 + (v / 100) * 1.4;
    if (v < 20) viral -= 0.06;
    else if (v >= 70) viral += 0.2 + (v - 70) / 100;
    else if (v >= 50) viral += 0.06;
  }
  if (kind.skills) {
    const s = bestLesson(g, kind.skills);
    mult *= 0.8 + (s / 100) * 0.8;
    viral += s / 500;
  }
  const clubs = kind.clubs?.filter((id) => g.clubs.some((m) => m.id === id)).length ?? 0;
  mult *= 1 + 0.25 * clubs;
  viral += 0.03 * clubs;
  return { mult, viral };
}

/** A short hint for the post picker. */
export function trainingHint(g: Game, kind: PostKind): string | null {
  if (kind.singing) {
    const v = singingSkill(g);
    if (v < 20) return '⚠️ No singing lessons — fewer views';
    if (v >= 70) return `🎤 Singing ${v} — high chance to blow up`;
    return `🎤 Singing ${v} — more lessons, more views`;
  }
  const clubs = kind.clubs?.filter((id) => g.clubs.some((m) => m.id === id)) ?? [];
  const s = kind.skills ? bestLesson(g, kind.skills) : 0;
  if (s >= 30 || clubs.length) return `📚 Boosted by your ${[s >= 30 && 'lessons', clubs.length && 'club'].filter(Boolean).join(' & ')}`;
  return null;
}

/** How many followers a post brings in. */
function reach(g: Game, acc: SocialAccount, kind: PostKind) {
  const skill = g.stats[kind.stat];
  const base = 8 + skill / 2 + fameOf(g) / 2;
  const audience = Math.pow(acc.followers + 20, 0.72);
  return Math.max(1, Math.round((base + audience) * (0.5 + Math.random()) * training(g, kind).mult));
}

/** Blowing up on one app sends people to your others. */
function spillover(g: Game, from: SocialAccount, gained: number) {
  let total = 0;
  for (const other of g.socials) {
    if (other === from) continue;
    const n = Math.round(gained * (0.1 + Math.random() * 0.15));
    other.followers += n;
    total += n;
  }
  return total;
}

export function makePost(g: Game, appId: string, kindId: string): Result | undefined {
  const app = appOf(appId);
  const acc = accountOf(g, appId);
  const kind = app && postKindsFor(g, app).find((p) => p.id === kindId);
  if (!app || !acc || !kind || postsLeft(g, appId) <= 0 || g.age < (kind.minAge ?? 0)) return;
  g.yearUses[`post:${appId}`] = (g.yearUses[`post:${appId}`] ?? 0) + 1;
  acc.posts++;
  const text = pick(kind.lines).replace('{biz}', g.business?.name ?? 'my business');

  // Risky posts can backfire.
  if (kind.risky && chance(0.22)) {
    const lost = Math.round(acc.followers * (0.05 + Math.random() * 0.15)) + rand(1, 20);
    acc.followers = Math.max(0, acc.followers - lost);
    adjust(g, 'happiness', -6);
    addFame(g, -1);
    acc.feed.unshift({ age: g.age, kind: kind.id, text, likes: rand(0, 30) });
    acc.feed = acc.feed.slice(0, 12);
    log(g, `${app.emoji} My post flopped badly and I lost ${formatFollowers(lost)} followers.`);
    return { emoji: '😬', title: 'That backfired', text: `“${text}” got ratioed. I lost ${formatFollowers(lost)} followers.` };
  }

  const viral = chance(0.08 + (kind.risky ? 0.06 : 0) + g.stats.looks / 1200 + fameBoost(fameOf(g)) + training(g, kind).viral);
  const gained = viral ? reach(g, acc, kind) * rand(8, 30) : reach(g, acc, kind);
  acc.followers += gained;
  const spilled = viral ? spillover(g, acc, gained) : 0;
  capFollowers(g);
  const likes = Math.round(gained * (2 + Math.random() * 4));
  acc.feed.unshift({ age: g.age, kind: kind.id, text, likes, viral });
  acc.feed = acc.feed.slice(0, 12);
  adjust(g, 'happiness', viral ? 8 : 2);
  if (viral) addFame(g, 3);
  if (!acc.verified && acc.followers >= 100_000) {
    acc.verified = true;
    addFame(g, 4);
    log(g, `✔️ My ${app.name} account got verified!`);
  }
  const aud = app.audience ?? 'followers';
  const what = kind.name.replace(/^(Post|Release) /, '');
  log(g, `${app.emoji} I ${app.id === 'spotify' ? 'released' : 'posted'} ${what} on ${app.name}${viral ? ' and it went VIRAL!' : ''} (+${formatFollowers(gained)} ${aud})`);
  const flop = kind.singing && singingSkill(g) < 20 && !viral ? ' People said I should take singing lessons…' : '';
  const cross = spilled > 0 ? ` Fans found my other accounts too (+${formatFollowers(spilled)}).` : '';
  const promo = kind.id === 'promo' && g.business ? ` ${g.business.name} got +${socialBoost(g, acc.followers) * (viral ? 2 : 1)} popularity.` : '';
  return {
    emoji: viral ? '🚀' : kind.emoji,
    title: viral ? 'IT WENT VIRAL!' : app.id === 'spotify' ? 'Released!' : 'Posted!',
    text: `“${text}” got ${formatFollowers(likes)} ${app.id === 'spotify' ? 'streams' : 'likes'} and ${formatFollowers(gained)} new ${aud}. You now have ${formatFollowers(acc.followers)} on ${app.name}.${flop}${cross}${promo}`,
    celebrate: viral,
  };
}

/** Yearly brand-deal money for big accounts. */
export function socialIncome(g: Game) {
  const followers = totalFollowers(g);
  if (followers < 10_000) return 0;
  return Math.round(followers * 0.35);
}

export function socialYear(g: Game) {
  for (const acc of g.socials) {
    // Accounts drift down a little if you don't post.
    const posted = g.yearUses[`post:${acc.app}`] ?? 0;
    if (!posted && acc.followers > 50) acc.followers = Math.round(acc.followers * 0.94);
  }
  // Being famous on one app makes you famous on the others.
  const top = biggestAccount(g);
  if (top >= 100_000) {
    for (const acc of g.socials) {
      if (acc.followers < top) acc.followers += Math.round((top - acc.followers) * (0.03 + Math.random() * 0.05));
    }
  }
  capFollowers(g);
  const income = socialIncome(g);
  if (income > 0) {
    g.money += income;
    log(g, `💼 Brand deals on social media earned me ${money(income)} this year.`);
  }
}
