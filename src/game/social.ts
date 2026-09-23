import type { Game, Result, SocialAccount } from './types';
import { adjust, log } from './helpers';
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

/** Being born into the royal family makes you famous before you can even talk. */
const bornRoyalFame = (g: Game) => (g.origin === 'royalty' ? 45 : 0);

export function fameOf(g: Game) {
  return clamp(Math.round(followerFame(totalFollowers(g)) + careerFame(g) + bornRoyalFame(g) + g.fameBonus));
}

export function fameTier(fame: number): FameTier {
  if (fame >= 80) return 'Famous';
  if (fame >= 55) return 'Popular';
  if (fame >= 30) return 'Well-Known';
  if (fame >= 10) return 'Known';
  return 'Not Known';
}

export const addFame = (g: Game, n: number) => { g.fameBonus = clamp(g.fameBonus + n, -20, 60); };

export const formatFollowers = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${+(n / 1_000).toFixed(1)}K` : String(n);

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
  lines: string[];
}

export interface SocialApp {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  color: string;
  minAge: number;
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
      { id: 'travel', emoji: '🏖️', name: 'Post a travel pic', stat: 'happiness', lines: ['Beach days 🏖️', 'Found this hidden waterfall 💦', 'Sunset from the rooftop 🌇'] },
      { id: 'thirst', emoji: '🔥', name: 'Post a thirst trap', stat: 'looks', minAge: 18, risky: true, lines: ['Gym mirror, sorry not sorry 💪', 'Beach day 😎', 'Felt cute, might delete later 🔥'] },
    ],
  },
  {
    id: 'tiktalk', emoji: '🎵', name: 'TikTalk', tagline: 'Short videos & trends', color: '#6f8cff', minAge: 10,
    posts: [
      { id: 'dance', emoji: '💃', name: 'Post a dance', stat: 'health', lines: ['Learned the trending dance in one night 💃', 'Dance challenge with my friends!', 'Tried the hardest routine yet 🕺'] },
      { id: 'lipsync', emoji: '🎤', name: 'Post a lip sync', stat: 'looks', lines: ['Lip syncing my comfort song 🎶', 'POV: it’s 2 a.m. and I’m dramatic 🎭', 'Duet with my cat 🐱'] },
      { id: 'comedy', emoji: '😂', name: 'Post a comedy skit', stat: 'happiness', lines: ['Me explaining my life choices 😂', 'When the teacher says “pop quiz” 💀', 'Siblings be like…'] },
      { id: 'hack', emoji: '💡', name: 'Post a life hack', stat: 'smarts', lines: ['This study hack changed my grades 📚', '3 things nobody tells you about money 💸', 'How to fold a shirt in 2 seconds 👕'] },
      { id: 'prank', emoji: '🙃', name: 'Post a prank', stat: 'happiness', risky: true, lines: ['Pranked my whole family 🙃', 'Swapped the sugar for salt 😭', 'Scared my sibling with a rubber snake 🐍'] },
      { id: 'grwm', emoji: '🪞', name: 'Post a get-ready-with-me', stat: 'looks', lines: ['GRWM for a night out ✨', 'Get ready with me: school edition 🎒', 'Doing my makeup in 60 seconds 💄'] },
    ],
  },
  {
    id: 'suntube', emoji: '▶️', name: 'SunTube', tagline: 'Long videos', color: '#e0445a', minAge: 12,
    posts: [
      { id: 'vlog', emoji: '🎥', name: 'Post a vlog', stat: 'happiness', lines: ['A day in my life 🎥', 'Weekend vlog: chaos edition', 'Vlogging my whole week!'] },
      { id: 'tutorial', emoji: '📚', name: 'Post a tutorial', stat: 'smarts', lines: ['How I study for exams 📚', 'Beginner guitar tutorial 🎸', 'Cooking tutorial: 5-minute meals 🍳'] },
      { id: 'gaming', emoji: '🎮', name: 'Post a gaming video', stat: 'smarts', lines: ['Beat the final boss with 1 HP 🎮', 'Ranked grind stream highlights 🕹️', 'Speedrun attempt #47'] },
      { id: 'cover', emoji: '🎶', name: 'Post a music cover', stat: 'happiness', lines: ['Covering my favorite song 🎶', 'Piano cover at midnight 🎹', 'Singing in the car 🚗'] },
      { id: 'story', emoji: '🗣️', name: 'Post a story time', stat: 'happiness', lines: ['Story time: my worst first date 😅', 'The time I got lost abroad ✈️', 'How I almost missed graduation 🎓'] },
    ],
  },
  {
    id: 'chirp', emoji: '🐦', name: 'Chirp', tagline: 'Thoughts in 280 characters', color: '#3fc1b0', minAge: 12,
    posts: [
      { id: 'joke', emoji: '😆', name: 'Post a joke', stat: 'happiness', lines: ['why do i open the fridge like the answer is in there', 'my sleep schedule is a work of fiction', 'coffee is just bean soup. thank you for coming to my talk'] },
      { id: 'thread', emoji: '🧵', name: 'Post a thread', stat: 'smarts', lines: ['a thread on how i saved my first $1000 🧵', 'things i wish i knew at 16, a thread', '5 books that rewired my brain 🧵'] },
      { id: 'update', emoji: '✨', name: 'Post an update', stat: 'happiness', lines: ['big news coming soon 👀', 'new chapter, same me ✨', 'grateful for this week 🌙'] },
      { id: 'hottake', emoji: '🌶️', name: 'Post a hot take', stat: 'smarts', risky: true, lines: ['unpopular opinion: pineapple belongs on pizza 🍍', 'mornings are a scam', 'the sequel was better. fight me'] },
    ],
  },
];

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
  g.socials.push({ app: appId, handle: clean, followers: rand(0, 12), posts: 0, feed: [] });
  adjust(g, 'happiness', 2);
  log(g, `${app.emoji} I made a ${app.name} account: @${clean}`);
  return { emoji: app.emoji, title: `Welcome to ${app.name}!`, text: `I'm @${clean} now. Time to post something!` };
}

/** How many followers a post brings in. */
function reach(g: Game, acc: SocialAccount, kind: PostKind) {
  const skill = g.stats[kind.stat];
  const base = 8 + skill / 2 + fameOf(g) / 2;
  const audience = Math.pow(acc.followers + 20, 0.72);
  return Math.max(1, Math.round((base + audience) * (0.5 + Math.random())));
}

export function makePost(g: Game, appId: string, kindId: string): Result | undefined {
  const app = appOf(appId);
  const acc = accountOf(g, appId);
  const kind = app?.posts.find((p) => p.id === kindId);
  if (!app || !acc || !kind || postsLeft(g, appId) <= 0 || g.age < (kind.minAge ?? 0)) return;
  g.yearUses[`post:${appId}`] = (g.yearUses[`post:${appId}`] ?? 0) + 1;
  acc.posts++;
  const text = pick(kind.lines);

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

  const viral = chance(0.08 + (kind.risky ? 0.06 : 0) + g.stats.looks / 1200 + fameOf(g) / 900);
  const gained = viral ? reach(g, acc, kind) * rand(8, 30) : reach(g, acc, kind);
  acc.followers += gained;
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
  log(g, `${app.emoji} I posted ${kind.name.replace('Post ', '').replace('a ', 'a ')} on ${app.name}${viral ? ' and it went VIRAL!' : ''} (+${formatFollowers(gained)} followers)`);
  return {
    emoji: viral ? '🚀' : kind.emoji,
    title: viral ? 'IT WENT VIRAL!' : 'Posted!',
    text: `“${text}” got ${formatFollowers(likes)} likes and ${formatFollowers(gained)} new followers. You now have ${formatFollowers(acc.followers)} on ${app.name}.`,
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
  const income = socialIncome(g);
  if (income > 0) {
    g.money += income;
    log(g, `💼 Brand deals on social media earned me ${money(income)} this year.`);
  }
}
