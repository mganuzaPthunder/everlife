import type { Game, Result, StatKey } from './types';
import { adjust, living, log } from './helpers';
import { addFame, totalFollowers } from './social';
import { money } from './util';

export interface QuestReward {
  money?: number;
  fame?: number;
  stats?: Partial<Record<StatKey, number>>;
}

export interface Quest {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** When this quest can show up. */
  when: (g: Game) => boolean;
  /** Progress towards the goal. */
  progress: (g: Game) => { have: number; need: number };
  /** Quest disappears (unfinished) once this is true. */
  expired?: (g: Game) => boolean;
  reward: QuestReward;
}

const count = (have: number, need: number) => ({ have: Math.min(have, need), need });
const friends = (g: Game) => living(g, 'friend').length;
const kids = (g: Game) => living(g, 'child').length;
const hasJob = (g: Game) => !!g.job;
const inSchool = (g: Game) => g.education.stage !== 'none';
const counter = (g: Game, key: string) => g.counters[key] ?? 0;

export const QUESTS: Quest[] = [
  /* ───── Childhood ───── */
  { id: 'first_friend', emoji: '🤝', title: 'Make your first friend', desc: 'Every life needs a best friend.', when: (g) => g.age >= 5 && g.age <= 13 && friends(g) === 0,
    progress: (g) => count(friends(g), 1), expired: (g) => g.age > 16, reward: { money: 50, stats: { happiness: 6 } } },
  { id: 'star_student', emoji: '📚', title: 'Straight-A student', desc: 'Get your grades to 90% or higher.', when: (g) => inSchool(g) && g.age <= 18,
    progress: (g) => count(g.education.grades, 90), expired: (g) => !inSchool(g), reward: { money: 200, stats: { smarts: 4, happiness: 3 } } },
  { id: 'club_kid', emoji: '🎭', title: 'Join two clubs', desc: 'Try new things while you’re young.', when: (g) => inSchool(g) && g.age >= 8 && g.age <= 18,
    progress: (g) => count(g.clubs.length, 2), expired: (g) => !inSchool(g), reward: { money: 100, stats: { happiness: 5 } } },
  { id: 'club_president', emoji: '🏅', title: 'Be elected club president', desc: 'Lead one of your clubs.', when: (g) => g.clubs.length > 0 && g.age <= 22,
    progress: (g) => count(g.clubs.filter((c) => c.president).length, 1), expired: (g) => !inSchool(g), reward: { money: 300, fame: 2, stats: { happiness: 6 } } },
  { id: 'sweet16', emoji: '🎂', title: 'Sweet sixteen', desc: 'Have at least 3 friends by 17.', when: (g) => g.age >= 13 && g.age <= 16,
    progress: (g) => count(friends(g), 3), expired: (g) => g.age > 17, reward: { money: 160, stats: { happiness: 8 } } },

  /* ───── Body & mind ───── */
  { id: 'gym_rat', emoji: '💪', title: 'Gym rat', desc: 'Work out 5 times.', when: (g) => g.age >= 12, progress: (g) => count(counter(g, 'act:gym'), 5), reward: { money: 150, stats: { health: 6 } } },
  { id: 'bookworm', emoji: '🐛', title: 'Bookworm', desc: 'Visit the library 8 times.', when: (g) => g.age >= 6, progress: (g) => count(counter(g, 'act:library'), 8), reward: { money: 150, stats: { smarts: 6 } } },
  { id: 'genius', emoji: '🧠', title: 'Certified genius', desc: 'Reach 95% smarts.', when: (g) => g.age >= 10 && g.stats.smarts >= 60, progress: (g) => count(g.stats.smarts, 95), reward: { money: 1000, fame: 2, stats: { happiness: 5 } } },
  { id: 'heartthrob', emoji: '✨', title: 'Heartthrob', desc: 'Reach 90% looks.', when: (g) => g.age >= 12 && g.stats.looks >= 55, progress: (g) => count(g.stats.looks, 90), reward: { money: 800, fame: 3 } },
  { id: 'perfect_year', emoji: '🌟', title: 'Living the dream', desc: 'Get every stat to 80% or more.', when: (g) => g.age >= 18,
    progress: (g) => count(Object.values(g.stats).filter((v) => v >= 80).length, 4), reward: { money: 2500, fame: 3, stats: { happiness: 8 } } },

  /* ───── Work & money ───── */
  { id: 'first_job', emoji: '💼', title: 'Get your first job', desc: 'Any job counts — even part-time.', when: (g) => g.age >= 13 && g.age <= 25 && !hasJob(g),
    progress: (g) => count(hasJob(g) ? 1 : 0, 1), reward: { money: 500, stats: { happiness: 5 } } },
  { id: 'promotion', emoji: '📈', title: 'Climb the ladder', desc: 'Get promoted twice in one job.', when: (g) => hasJob(g), progress: (g) => count(g.job?.level ?? 0, 2), reward: { money: 2000, stats: { happiness: 6 } } },
  { id: 'graduate', emoji: '🎓', title: 'Earn a degree', desc: 'Finish a bachelor’s degree.', when: (g) => g.age >= 17 && g.age <= 40,
    progress: (g) => count(g.education.degrees.filter((d) => d.startsWith('ba:')).length, 1), reward: { money: 1500, stats: { smarts: 5 } } },
  { id: 'millionaire', emoji: '💰', title: 'Make your first million', desc: 'Have $1,000,000 in the bank.', when: (g) => g.age >= 18,
    progress: (g) => count(Math.max(0, g.money), 1_000_000), reward: { money: 100_000, fame: 4, stats: { happiness: 10 } } },
  { id: 'homeowner', emoji: '🏡', title: 'Buy your own home', desc: 'Own a house of your own.', when: (g) => g.age >= 18,
    progress: (g) => count(g.assets.filter((a) => a.kind === 'house').length, 1), reward: { money: 5000, stats: { happiness: 10 } } },
  { id: 'wheels', emoji: '🚗', title: 'Get your first car', desc: 'Buy any car.', when: (g) => g.age >= 16,
    progress: (g) => count(g.assets.filter((a) => a.kind === 'car').length, 1), reward: { money: 1000, stats: { happiness: 6 } } },

  /* ───── Love & family ───── */
  { id: 'soulmate', emoji: '💍', title: 'Find your person', desc: 'Get married.', when: (g) => g.age >= 18,
    progress: (g) => count(living(g, 'spouse').length, 1), reward: { money: 3000, stats: { happiness: 12 } } },
  { id: 'family', emoji: '👨‍👩‍👧', title: 'Start a family', desc: 'Have two children.', when: (g) => g.age >= 20 && g.age <= 55, progress: (g) => count(kids(g), 2), reward: { money: 4000, stats: { happiness: 10 } } },

  /* ───── Social ───── */
  { id: 'first_post', emoji: '📱', title: 'Go online', desc: 'Make a social account and post once.', when: (g) => g.age >= 10,
    progress: (g) => count(g.socials.reduce((s, a) => s + a.posts, 0), 1), reward: { money: 100, stats: { happiness: 4 } } },
  { id: 'followers_1k', emoji: '🌱', title: 'First 1,000 followers', desc: 'Grow to 1K followers across your apps.', when: (g) => g.socials.length > 0,
    progress: (g) => count(totalFollowers(g), 1000), reward: { money: 500, fame: 2 } },
  { id: 'followers_100k', emoji: '🚀', title: '100K club', desc: 'Reach 100,000 followers.', when: (g) => totalFollowers(g) >= 2000,
    progress: (g) => count(totalFollowers(g), 100_000), reward: { money: 20_000, fame: 6 } },
  { id: 'viral', emoji: '💥', title: 'Go viral', desc: 'Get one post to blow up.', when: (g) => g.socials.length > 0,
    progress: (g) => count(g.socials.reduce((s, a) => s + a.feed.filter((p) => p.viral).length, 0), 1), reward: { money: 1000, fame: 4 } },

  /* ───── Fun & talent ───── */
  { id: 'musician', emoji: '🎼', title: 'Learn an instrument', desc: 'Get any instrument to 60 skill.', when: (g) => g.age >= 6,
    progress: (g) => count(Math.max(0, ...Object.entries(g.skills).filter(([k]) => k.startsWith('music:')).map(([, v]) => v)), 60), reward: { money: 600, stats: { happiness: 6 } } },
  { id: 'athlete', emoji: '🏅', title: 'Master a sport', desc: 'Get any sport to 60 skill.', when: (g) => g.age >= 6,
    progress: (g) => count(Math.max(0, ...Object.entries(g.skills).filter(([k]) => k.startsWith('sport:')).map(([, v]) => v)), 60), reward: { money: 600, stats: { health: 6 } } },
  { id: 'traveler', emoji: '✈️', title: 'See the world', desc: 'Take 3 vacations.', when: (g) => g.age >= 18, progress: (g) => count(counter(g, 'act:vacation'), 3), reward: { money: 1500, stats: { happiness: 8 } } },
  { id: 'good_soul', emoji: '💚', title: 'Give back', desc: 'Volunteer 5 times.', when: (g) => g.age >= 12, progress: (g) => count(counter(g, 'act:volunteer'), 5), reward: { money: 400, fame: 1, stats: { happiness: 8 } } },
  { id: 'retire_rich', emoji: '🏖️', title: 'Retire comfortably', desc: 'Retire with at least $500,000.', when: (g) => g.age >= 55,
    progress: (g) => count(g.retired && g.money >= 500_000 ? 1 : 0, 1), reward: { money: 10_000, stats: { happiness: 12 } } },
];

export const questOf = (id: string) => QUESTS.find((q) => q.id === id);

/** Quests you can take on right now. */
export function availableQuests(g: Game) {
  return QUESTS.filter((q) => !g.quests.some((s) => s.id === q.id) && q.when(g));
}

export function acceptQuest(g: Game, id: string): Result | undefined {
  const q = questOf(id);
  if (!q || g.quests.some((s) => s.id === id)) return;
  g.quests.push({ id, startedAge: g.age });
  log(g, `🎯 New quest: ${q.title}.`);
  return { emoji: q.emoji, title: 'Quest accepted!', text: `${q.title} — ${q.desc}` };
}

export function abandonQuest(g: Game, id: string): Result | undefined {
  const q = questOf(id);
  if (!q) return;
  g.quests = g.quests.filter((s) => s.id !== id);
  return { emoji: '🚪', title: 'Quest dropped', text: `I gave up on “${q.title}”.` };
}

export function claimQuest(g: Game, id: string): Result | undefined {
  const state = g.quests.find((s) => s.id === id);
  const q = questOf(id);
  if (!state || !q || state.claimed) return;
  const { have, need } = q.progress(g);
  if (have < need) return;
  state.done = true;
  state.claimed = true;
  const parts: string[] = [];
  if (q.reward.money) { g.money += q.reward.money; parts.push(money(q.reward.money)); }
  for (const [k, v] of Object.entries(q.reward.stats ?? {}) as [StatKey, number][]) { adjust(g, k, v); parts.push(`+${v} ${k}`); }
  if (q.reward.fame) { addFame(g, q.reward.fame); parts.push(`+${q.reward.fame} fame`); }
  log(g, `🏆 Quest complete: ${q.title}! (${parts.join(' · ')})`);
  return { emoji: '🏆', title: 'Quest complete!', text: `${q.title} — reward: ${parts.join(' · ')}.`, celebrate: true };
}

/** Drop quests that can no longer be finished, and offer new ones each year. */
export function questYear(g: Game) {
  for (const state of g.quests) {
    if (state.claimed || state.failedAt) continue;
    const q = questOf(state.id);
    if (!q) continue;
    const { have, need } = q.progress(g);
    if (have >= need) state.done = true;
    else if (q.expired?.(g)) {
      state.failedAt = g.age;
      log(g, `⌛ Quest expired: ${q.title}.`);
    }
  }
  g.quests = g.quests.filter((s) => !(s.failedAt && g.age - s.failedAt > 3));
}

export const activeQuests = (g: Game) => g.quests.filter((s) => !s.claimed && !s.failedAt);
export const readyQuests = (g: Game) => activeQuests(g).filter((s) => { const q = questOf(s.id); if (!q) return false; const { have, need } = q.progress(g); return have >= need; });
