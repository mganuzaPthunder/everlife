import type { Game, Gender, Person, Preference, Result, StatKey } from './types';
import { ACTIVITY_STAT } from './activitygames';
import { CAREERS, GRAD_PROGRAMS, MAJORS, SHOP, UNIVERSITY, eduRequirementLabel, salaryAt, type Career } from './data';
import {
  addInLaws, adjust, bond, bump, loseConsortTitle, datingAge, datingGender, die, fullName, isCore, makeEx, hasEdu, isSingle, living, log, makePerson, markUsed, noteUse, repeatFee, used, usesThisYear,
} from './helpers';
import { dreamGuaranteed, dreamOpensProgram, hire } from './dreams';
import { inheritLook, inheritStat, itemName, itemPrice, unownedItems } from './look';
import { originOf } from './origins';
import { addFame } from './social';
import { canApplyAgain } from './interview';
import { royalFree } from './engine';
import { INSTRUMENTS, MAX_CLUBS, SPORTS, clubOf, skillName } from './skills';
import type { Look } from './types';
import { chance, clamp, money, pick, rand, uid } from './util';

const r = (emoji: string, title: string, text: string): Result => ({ emoji, title, text });

/* ───────── Paying for things (yourself, or ask your parents) ───────── */

export type Payer = 'self' | 'parents';

export const canAskParents = (g: Game) => g.age < 25 && living(g, 'mother', 'father').length > 0;

const clamp01 = (n: number) => Math.max(0.03, Math.min(0.97, n));

/** How likely parents are to cover a cost, based on how close you are and how well-off they are. */
export function parentsPayChance(g: Game, amount: number) {
  const parents = living(g, 'mother', 'father');
  if (!parents.length) return 0;
  const closeness = Math.max(...parents.map((p) => p.closeness));
  const wealth = Math.max(1, originOf(g.origin).adultGift);
  const strain = amount / (wealth * 25 + 800);
  return clamp01(0.35 + closeness / 200 + (g.age < 18 ? 0.15 : 0) - strain);
}

/** Ask your parents before doing anything, so you know their answer up front. */
export function askParents(g: Game, amount: number, what: string): { yes: boolean; text: string } {
  const parents = living(g, 'mother', 'father');
  if (!parents.length) return { yes: false, text: 'There’s no parent around to ask.' };
  const p = parents.reduce((a, b) => (a.closeness >= b.closeness ? a : b));
  if (g.yearUses[`askyes:${amount}`]) return { yes: true, text: `${p.firstName} already said they’ll pay ${money(amount)} 💜` };
  if (g.yearUses[`askno:${what}`]) return { yes: false, text: `${p.firstName} already said no to ${what} this year.` };
  if (!chance(parentsPayChance(g, amount))) {
    bond(p, -3);
    noteUse(g, `askno:${what}`);
    return { yes: false, text: `${p.firstName} said ${money(amount)} is too much right now.` };
  }
  bond(p, 2);
  g.yearUses[`askyes:${amount}`] = 1;
  return { yes: true, text: `${p.firstName} said yes and will pay ${money(amount)} 💜` };
}

/** Takes the money, or explains why it didn't work. 'parents' means they already said yes. */
export function payFor(g: Game, amount: number, payer: Payer): { paid: boolean; note?: string; result?: Result } {
  if (amount <= 0) return { paid: true };
  if (payer === 'parents') {
    const parents = living(g, 'mother', 'father');
    if (!parents.length || !g.yearUses[`askyes:${amount}`]) return { paid: false, result: r('🤷', 'Nobody agreed to pay', 'I never got a yes from my parents for that.') };
    delete g.yearUses[`askyes:${amount}`];
    const p = parents.reduce((a, b) => (a.closeness >= b.closeness ? a : b));
    return { paid: true, note: `${p.firstName} paid ${money(amount)} for me 💜` };
  }
  if (g.money < amount) return { paid: false, result: r('💸', 'Not enough money', `That costs ${money(amount)} and I only have ${money(g.money)}.`) };
  g.money -= amount;
  return { paid: true };
}

/* ───────────────────────── Activities ───────────────────────── */

export interface Activity {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  minAge: number;
  cost?: (g: Game) => number;
  prison?: 'ok' | 'only';
  check?: (g: Game) => string | null;
  /** Opens a mini-game instead of resolving instantly. */
  game?: MiniGame;
  /** Can be played again and again in the same year. */
  repeatable?: boolean;
  /** Opens a list of instruments or sports to choose from. */
  picker?: 'music' | 'sports' | 'pray';
  run?: (g: Game) => Result;
}

export type MiniGame = 'lottery' | 'casino' | 'shoplift' | 'heist' | 'escape' | 'dating';

export const ACTIVITIES: Activity[] = [
  {
    id: 'gym', emoji: '🏋️', name: 'Gym', desc: 'Get stronger and healthier', minAge: 12, prison: 'ok',
    run: (g) => { adjust(g, 'health', rand(3, 8)); adjust(g, 'looks', rand(1, 3)); return r('🏋️', 'Workout', 'I hit the gym and felt great afterwards.'); },
  },
  {
    id: 'meditate', emoji: '🧘', name: 'Meditate', desc: 'Find some inner peace', minAge: 8, prison: 'ok',
    run: (g) => { adjust(g, 'happiness', rand(3, 8)); adjust(g, 'health', 1); return r('🧘', 'Inner peace', 'I meditated under the stars and felt calmer.'); },
  },
  {
    id: 'library', emoji: '📚', name: 'Library', desc: 'Read and learn', minAge: 5, prison: 'ok',
    run: (g) => { adjust(g, 'smarts', rand(2, 6)); return r('📚', 'Bookworm', `I read ${pick(['a mystery novel', 'a book about black holes', 'a biography', 'a poetry collection', 'a history of the moon landing'])} at the library.`); },
  },
  {
    id: 'doctor', emoji: '🩺', name: 'Doctor', desc: 'Get a checkup', minAge: 0,
    cost: (g) => (g.age < 18 ? 0 : 200),
    run: (g) => { if (g.age >= 18) g.money -= 200; adjust(g, 'health', rand(5, 15)); return r('🩺', 'Checkup', 'I visited the doctor and got a clean bill of health.'); },
  },
  {
    id: 'salon', emoji: '💇', name: 'Salon', desc: 'New hair, new you', minAge: 12, cost: (g) => salonPrice(g),
    run: (g) => { g.money -= salonPrice(g); adjust(g, 'looks', rand(2, 5)); adjust(g, 'happiness', 2); return r('💇', 'Glow up', 'I got pampered at the salon.'); },
  },
  {
    id: 'acting', emoji: '🎭', name: 'Acting Class', desc: 'Learn to own the stage', minAge: 8, cost: (g) => (g.age < 18 ? 0 : 100),
    run: (g) => {
      if (g.age >= 18) g.money -= 100;
      adjust(g, 'looks', rand(1, 3)); adjust(g, 'happiness', rand(2, 5));
      return r('🎭', 'Break a leg', `I took an acting class and performed ${pick(['a dramatic monologue', 'a Shakespeare scene', 'an improv sketch', 'a tearful soap opera scene'])}.`);
    },
  },
  { id: 'music', emoji: '🎹', name: 'Music Lessons', desc: 'Pick an instrument', minAge: 6, picker: 'music' },
  { id: 'sports', emoji: '⚽', name: 'Sports Practice', desc: 'Pick a sport', minAge: 6, picker: 'sports' },
  { id: 'pray', emoji: '🙏', name: 'Pray', desc: 'Ask for a blessing', minAge: 12, prison: 'ok', picker: 'pray' },
  {
    id: 'cooking', emoji: '🍳', name: 'Cooking Class', desc: 'Whip up something tasty', minAge: 8, cost: (g) => (g.age < 18 ? 0 : 60),
    run: (g) => {
      if (g.age >= 18) g.money -= 60;
      adjust(g, 'happiness', rand(2, 5)); adjust(g, 'health', rand(0, 2));
      return r('🍳', 'Chef’s kiss', `I learned to make ${pick(['fluffy pancakes', 'homemade ramen', 'chicken adobo', 'a chocolate soufflé', 'sushi rolls', 'lumpia'])}.`);
    },
  },
  {
    id: 'surgery', emoji: '💉', name: 'Plastic Surgery', desc: 'High reward, some risk', minAge: 18, cost: () => 8000,
    run: (g) => {
      g.money -= 8000;
      if (chance(0.8)) { adjust(g, 'looks', rand(10, 25)); adjust(g, 'happiness', 5); return r('✨', 'Stunning', 'My plastic surgery was a success. I look amazing!'); }
      adjust(g, 'looks', -15); adjust(g, 'happiness', -10);
      return r('😱', 'Botched', 'My plastic surgery was botched. I barely recognize myself.');
    },
  },
  {
    id: 'vacation', emoji: '✈️', name: 'Vacation', desc: 'Get away for a while', minAge: 18, cost: () => 3000,
    run: (g) => {
      g.money -= 3000; adjust(g, 'happiness', rand(10, 20));
      return r('✈️', 'Bon voyage', `I took a vacation to ${pick(['Santorini', 'Kyoto', 'Bali', 'Iceland to see the northern lights', 'Palawan', 'the Amalfi Coast', 'Patagonia'])}.`);
    },
  },
  {
    id: 'club', emoji: '🪩', name: 'Nightclub', desc: 'Dance until sunrise', minAge: 18, cost: () => 60,
    run: (g) => {
      g.money -= 60; adjust(g, 'happiness', rand(3, 8));
      if (isSingle(g) && chance(0.25)) {
        const p = makePerson('partner', datingGender(g), datingAge(g), undefined, rand(45, 70));
        g.relationships.push(p);
        return r('💃', 'Chemistry', `I danced all night with ${fullName(p)} and we started dating!`);
      }
      if (chance(0.25)) {
        const f = makePerson('friend', pick(['male', 'female'] as const), g.age + rand(-4, 4), undefined, rand(45, 65));
        g.relationships.push(f);
        return r('🪩', 'New friend', `I met ${fullName(f)} on the dance floor. We’re friends now.`);
      }
      return r('🪩', 'Night out', 'I danced the night away at the club.');
    },
  },
  {
    id: 'friend', emoji: '🤝', name: 'Make a Friend', desc: 'Meet someone new', minAge: 5,
    run: (g) => {
      if (chance(0.3)) { adjust(g, 'happiness', -2); return r('😶', 'No luck', 'I tried to make a new friend, but it didn’t click.'); }
      const f = makePerson('friend', pick(['male', 'female'] as const), Math.max(5, g.age + rand(-3, 3)), undefined, rand(45, 70));
      g.relationships.push(f);
      adjust(g, 'happiness', 4);
      return r('🤝', 'New friend', `I became friends with ${fullName(f)}.`);
    },
  },
  { id: 'date', emoji: '📱', name: 'Dating App', desc: 'Swipe for love · VIP too', minAge: 16, game: 'dating', repeatable: true },
  {
    id: 'volunteer', emoji: '🌱', name: 'Volunteer', desc: 'Help your community', minAge: 12,
    run: (g) => { adjust(g, 'happiness', rand(3, 7)); return r('🌱', 'Giving back', `I volunteered at ${pick(['an animal shelter', 'a soup kitchen', 'a beach cleanup', 'a community garden'])}.`); },
  },
  { id: 'lottery', emoji: '🎟️', name: 'Lottery', desc: 'Scratch cards & the Mega draw', minAge: 18, cost: () => 5, game: 'lottery', repeatable: true },
  { id: 'casino', emoji: '🎰', name: 'Casino', desc: 'Slots, blackjack, roulette', minAge: 21, cost: () => 100, game: 'casino', repeatable: true },
  { id: 'shoplift', emoji: '🕶️', name: 'Shoplift', desc: 'Sneak past security', minAge: 8, game: 'shoplift' },
  { id: 'heist', emoji: '🏦', name: 'Rob a Bank', desc: 'Sneak, crack, escape', minAge: 18, game: 'heist' },
  { id: 'escape', emoji: '🪜', name: 'Escape Prison', desc: 'Make a run for it', minAge: 18, prison: 'only', game: 'escape' },
];

/** Parents cover the salon until you're 18. */
export const salonPrice = (g: Game) => (g.age < 18 ? 0 : 80);

export const salonTotal = (g: Game) => salonPrice(g) + repeatFee(usesThisYear(g, 'act:salon'));

export function salonBlock(g: Game): string | null {
  if (g.age < 12) return 'Age 12+';
  if (g.prison > 0) return 'In prison';
  if (g.money < salonTotal(g) && !canAskParents(g)) return 'Can’t afford';
  return null;
}

/** Restyle any time; the stat boost and the dream counter only count once a year. */
export function salonVisit(g: Game, look: Look, payer: Payer = 'self'): Result | undefined {
  if (salonBlock(g)) return;
  const pay = payFor(g, salonTotal(g), payer);
  if (!pay.paid) return pay.result;
  noteUse(g, 'act:salon');
  g.look = { ...look };
  if (!used(g, 'act:salon')) {
    markUsed(g, 'act:salon');
    bump(g, 'act:salon');
    adjust(g, 'looks', rand(2, 5));
    adjust(g, 'happiness', 3);
  }
  return r('💇', 'Fresh look', pay.note ? `I got a whole new look at the salon — ${pay.note}` : 'I got a whole new look at the salon.');
}

/** Repeating an activity in the same year costs more each time: free, $100, $200, $400… */
export const activityPrice = (g: Game, a: Activity) => (a.cost?.(g) ?? 0) + repeatFee(usesThisYear(g, `act:${a.id}`));

export function activityBlock(g: Game, a: Activity): string | null {
  if (g.age < a.minAge) return `Age ${a.minAge}+`;
  if (g.prison > 0 && !a.prison) return 'In prison';
  if (g.prison === 0 && a.prison === 'only') return null;
  const price = activityPrice(g, a);
  if (price > 0 && g.money < price && !canAskParents(g)) return 'Can’t afford';
  return a.check?.(g) ?? null;
}

export const visibleActivities = (g: Game) => ACTIVITIES.filter((a) => (a.prison === 'only' ? g.prison > 0 : true));

/** How a mini-game score changes the outcome: a note and a small stat kicker. */
function perfBonus(g: Game, id: string, perf: number | undefined, stat: StatKey | undefined): string | null {
  if (perf === undefined) return null;
  if (perf >= 0.99) { if (stat) adjust(g, stat, 4); return 'flawless — I nailed every bit of it'; }
  if (perf >= 0.7) { if (stat) adjust(g, stat, 2); return 'I did really well'; }
  if (perf >= 0.4) return 'it went okay';
  if (stat) adjust(g, stat, -1);
  return 'honestly, I was terrible at it';
}

export function doActivity(g: Game, id: string, payer: Payer = 'self', perf?: number): Result | undefined {
  const a = ACTIVITIES.find((x) => x.id === id);
  if (!a?.run || activityBlock(g, a)) return;
  // The activity's own price is handled here; a.run() only applies its effects.
  const fee = repeatFee(usesThisYear(g, `act:${a.id}`));
  const own = a.cost?.(g) ?? 0;
  const pay = payFor(g, fee + own, payer);
  if (!pay.paid) return pay.result;
  g.money += own; // a.run() subtracts the activity's own cost itself
  markUsed(g, `act:${a.id}`);
  noteUse(g, `act:${a.id}`);
  bump(g, `act:${a.id}`);
  const res = a.run(g);
  if (!res) return res;
  const bonus = perfBonus(g, a.id, perf, ACTIVITY_STAT[a.id]);
  const extras = [bonus, pay.note].filter(Boolean).join(' · ');
  return extras ? { ...res, text: `${res.text} (${extras})` } : res;
}

/* ───────── Royal duty ───────── */

export function royalAskBlock(g: Game): string | null {
  if (royalFree(g)) return null;
  if (g.age < 14) return 'Age 14+';
  if (!living(g, 'mother', 'father').some((p) => p.job === 'King' || p.job === 'Queen')) return 'No monarch to ask';
  if (used(g, 'royal:ask')) return 'Already asked this year';
  return null;
}

/** "Ask my parents if I can do another job" — the crown says yes about half the time. */
export function askRoyalFreedom(g: Game): Result | undefined {
  if (royalAskBlock(g)) return;
  const monarch = living(g, 'mother', 'father').filter((p) => p.job === 'King' || p.job === 'Queen')
    .reduce((a, b) => (a.closeness >= b.closeness ? a : b));
  markUsed(g, 'royal:ask');
  // A close, well-liked heir gets a kinder answer than a distant one.
  if (chance(0.5 + (monarch.closeness - 60) / 400)) {
    g.flags.push('royalFreed');
    const was = g.job?.royal ? g.job.title : null;
    if (g.job?.royal) g.job = null;
    bond(monarch, 5);
    adjust(g, 'happiness', 12);
    return { ...r('🗝️', 'The crown says yes!', `${monarch.firstName} gave their blessing. ${was ? `I stepped down as ${was} and can` : 'I can'} now choose any career I want.`), celebrate: true };
  }
  bond(monarch, -2);
  adjust(g, 'happiness', -5);
  return r('🏰', 'The crown says no', `${monarch.firstName} says a ${royalTitleFor(g).toLowerCase()} serves the crown, not themselves. I can ask again next year.`);
}

export const royalTitleFor = (g: Game) => g.job?.title ?? (g.gender === 'male' ? 'Prince' : 'Princess');

/* ───────── Your will, and giving up ───────── */

/** Writing or changing your will costs $1M, then double each time after. */
export const willPrice = (g: Game) => 1_000_000 * 2 ** (g.willChanges ?? 0);

/** People you can leave things to: children, your partner, your siblings. */
export const willCandidates = (g: Game) => living(g, 'child', 'spouse', 'partner', 'sibling');

export function willBlock(g: Game, heirs: string[]): string | null {
  if (g.age < 18) return 'Age 18+';
  if (!heirs.length) return 'Pick at least one';
  if (g.money < willPrice(g)) return 'Can’t afford';
  return null;
}

export function writeWill(g: Game, heirs: string[]): Result | undefined {
  const valid = heirs.filter((id) => id === 'charity' || willCandidates(g).some((p) => p.id === id));
  if (willBlock(g, valid)) return;
  const price = willPrice(g);
  g.money -= price;
  g.will = valid;
  g.willChanges = (g.willChanges ?? 0) + 1;
  const names = valid.map((id) => (id === 'charity' ? 'charity' : g.relationships.find((p) => p.id === id)!.firstName));
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
  log(g, `📜 I wrote my will: everything goes to ${list}.`);
  return r('📜', 'Will signed', `When I die, my money and houses will be split ${valid.length > 1 ? `${valid.length} ways between` : 'to'} ${list}. Changing it again will cost ${money(willPrice(g))}.`);
}

export function surrender(g: Game): Result | undefined {
  if (!g.alive) return;
  die(g, 'giving up on life');
}

/* ───────── Prayer ───────── */

/** The first prayer costs $500,000, and each one after that costs double. */
export const prayerPrice = (g: Game) => 500_000 * 2 ** (g.counters.pray ?? 0);

export interface Blessing { id: string; emoji: string; name: string; desc: string }

export const BLESSINGS: Blessing[] = [
  { id: 'smarts', emoji: '🧠', name: 'Smarts', desc: '+30 smarts' },
  { id: 'happiness', emoji: '😊', name: 'Happiness', desc: '+30 happiness' },
  { id: 'health', emoji: '💪', name: 'Health', desc: '+30 health' },
  { id: 'looks', emoji: '✨', name: 'Beauty', desc: '+30 looks' },
  { id: 'fertility', emoji: '👶', name: 'Fertility', desc: 'Trying for a baby almost always works' },
  { id: 'wealth', emoji: '💰', name: 'Wealth', desc: 'A windfall — could be less or more than you gave' },
  { id: 'popularity', emoji: '🌟', name: 'Popularity', desc: 'More fame and a wave of new followers' },
  { id: 'love', emoji: '💞', name: 'Love', desc: 'Find someone, or grow closer to your partner' },
  { id: 'longlife', emoji: '🕊️', name: 'Long life', desc: 'Half the chance of dying each year' },
];

export function prayBlock(g: Game, id?: string): string | null {
  if (g.age < 12) return 'Age 12+';
  if (id === 'fertility' && g.flags.includes('blessed:fertility')) return 'Already blessed';
  if (id === 'longlife' && g.flags.includes('blessed:longlife')) return 'Already blessed';
  if (g.money < prayerPrice(g)) return 'Can’t afford';
  return null;
}

export function pray(g: Game, id: string): Result | undefined {
  const b = BLESSINGS.find((x) => x.id === id);
  if (!b || prayBlock(g, id)) return;
  const price = prayerPrice(g);
  g.money -= price;
  bump(g, 'pray');
  const next = money(prayerPrice(g));
  let text: string;
  switch (id) {
    case 'smarts': case 'happiness': case 'health': case 'looks':
      adjust(g, id, 30);
      text = `I feel ${id === 'smarts' ? 'sharper' : id === 'happiness' ? 'lighter and happier' : id === 'health' ? 'stronger and healthier' : 'more beautiful'} than ever.`;
      break;
    case 'fertility':
      g.flags.push('blessed:fertility');
      text = 'I feel it in my bones: a family is coming whenever I’m ready.';
      break;
    case 'wealth': {
      const gift = Math.round(price * (0.3 + Math.random() * 1.4));
      g.money += gift;
      text = `Out of nowhere, ${money(gift)} came my way.`;
      break;
    }
    case 'popularity': {
      addFame(g, 20);
      for (const a of g.socials) a.followers = Math.round(a.followers * 1.5 + rand(2_000, 20_000));
      text = `People everywhere suddenly know my name${g.socials.length ? ' and my followers are pouring in' : ''}.`;
      break;
    }
    case 'love': {
      const partner = living(g, 'partner', 'spouse')[0];
      if (partner) {
        bond(partner, 30);
        text = `${partner.firstName} and I feel closer than we have in years.`;
      } else {
        const p = makePerson('partner', datingGender(g), datingAge(g), undefined, rand(75, 95));
        g.relationships.push(p);
        text = `I met ${fullName(p)} the very next day, and we started dating.`;
      }
      break;
    }
    default:
      g.flags.push('blessed:longlife');
      text = 'A deep calm settled over me. I feel like I’ll be around for a long, long time.';
  }
  log(g, `🙏 I prayed for ${b.name.toLowerCase()} and gave ${money(price)}.`);
  return { ...r('🙏', `Blessed with ${b.name.toLowerCase()}`, `${text} The next prayer will cost ${next}.`), celebrate: true };
}

/* ───────── Status: gender & who you like ───────── */

export const STATUS_PRICE = 1000;
export const PREFERENCES: { id: Preference; emoji: string; name: string }[] = [
  { id: 'men', emoji: '👨', name: 'Men' },
  { id: 'women', emoji: '👩', name: 'Women' },
  { id: 'everyone', emoji: '🌈', name: 'Everyone' },
];

export function statusBlock(g: Game): string | null {
  if (g.age < 13) return 'Age 13+';
  if (g.prison > 0) return 'In prison';
  if (g.money < STATUS_PRICE && !canAskParents(g)) return 'Can’t afford';
  return null;
}

export function changeGender(g: Game, gender: Gender, payer: Payer = 'self'): Result | undefined {
  if (statusBlock(g) || g.gender === gender) return;
  const pay = payFor(g, STATUS_PRICE, payer);
  if (!pay.paid) return pay.result;
  g.gender = gender;
  adjust(g, 'happiness', rand(5, 12));
  log(g, `${gender === 'male' ? '♂️' : '♀️'} I changed my gender to ${gender}.`);
  return r('🪪', 'A new me', `I’m living as ${gender === 'male' ? 'a man' : 'a woman'} now and I feel more like myself.${pay.note ? ` ${pay.note}` : ''}`);
}

export function changePreference(g: Game, pref: Preference, payer: Payer = 'self'): Result | undefined {
  if (statusBlock(g) || g.preference === pref) return;
  const pay = payFor(g, STATUS_PRICE, payer);
  if (!pay.paid) return pay.result;
  g.preference = pref;
  adjust(g, 'happiness', rand(3, 8));
  const who = PREFERENCES.find((p) => p.id === pref)!;
  log(g, `${who.emoji} I realised I’m into ${who.name.toLowerCase()}.`);
  return r('💘', 'Knowing my heart', `I’m into ${who.name.toLowerCase()} now. My dating matches will change.${pay.note ? ` ${pay.note}` : ''}`);
}

/* ───────── Royal hearts ───────── */

/** Married into the royal family (not born into it). The title lasts until a divorce. */
export const isConsort = (g: Game) => g.origin !== 'royalty' && g.flags.includes('royalByMarriage');

/** Born royal, on royal duty, or married into the family. */
export const isRoyal = (g: Game) =>
  g.origin === 'royalty' || !!g.job?.royal || g.flags.includes('royalByMarriage');

const monarchsOf = (g: Game) => living(g, 'mother', 'father').filter((p) => p.job === 'King' || p.job === 'Queen' || g.origin === 'royalty');

/** Can this royal see someone outside the nobility? */
export function commonerDateBlock(g: Game): string | null {
  if (!isRoyal(g)) return null;
  if (g.flags.includes('royalDateFree')) return null;
  if (!monarchsOf(g).length) return null; // nobody left to object
  return '👑 Your parents haven’t allowed it';
}

export function askCommonerDatingBlock(g: Game): string | null {
  if (!isRoyal(g) || g.flags.includes('royalDateFree')) return 'Already allowed';
  if (!monarchsOf(g).length) return 'Nobody to ask';
  if (used(g, 'royal:dateask')) return 'Asked this year';
  return null;
}

/** Ask the palace for permission to date outside the family. */
export function askCommonerDating(g: Game): Result | undefined {
  if (askCommonerDatingBlock(g)) return;
  const parent = monarchsOf(g).reduce((a, b) => (a.closeness >= b.closeness ? a : b));
  markUsed(g, 'royal:dateask');
  if (chance(0.45 + (parent.closeness - 60) / 300)) {
    g.flags.push('royalDateFree');
    bond(parent, 4);
    adjust(g, 'happiness', 10);
    return { ...r('💌', 'Permission granted', `${parent.firstName} sighed, then smiled: I may court whoever I like, royal or not.`), celebrate: true };
  }
  bond(parent, -2);
  adjust(g, 'happiness', -5);
  return r('🏰', 'The palace says no', `${parent.firstName} says a ${royalTitleFor(g).toLowerCase()} marries within the nobility. I can ask again next year.`);
}

/** Marrying across the palace gates changes one of you. */
export function royalWedding(g: Game, p: Person): string | null {
  if (p.royal && !isRoyal(g)) {
    g.flags.push('royalByMarriage');
    const title = g.gender === 'male' ? 'Prince' : 'Princess';
    g.job = { careerId: 'royal', title: `${title} Consort`, salary: 2_000_000, years: 0, performance: 70, level: 0, partTime: false, royal: true };
    g.look = { ...g.look, acc: { ...g.look.acc, hat: g.gender === 'male' ? 'crown' : 'tiara' } };
    if (!g.wardrobe.includes('royal')) g.wardrobe.push('royal', 'crown', 'tiara');
    addFame(g, 25);
    log(g, `👑 I married into the royal family. They call me ${title} ${g.firstName} now.`);
    return `I’m ${title.toLowerCase()} now — the palace is home.`;
  }
  if (isRoyal(g) && !p.royal) {
    p.royal = true;
    p.job = g.gender === 'male' ? 'Princess Consort' : 'Prince Consort';
    p.look = { ...(p.look ?? {}), acc: { ...(p.look?.acc ?? {}), hat: p.gender === 'male' ? 'crown' : 'tiara' } } as typeof p.look;
    log(g, `👑 ${p.firstName} married into the family and became ${p.job?.toLowerCase()}.`);
    return `${p.firstName} is royalty now too.`;
  }
  return null;
}

/* ───────── Music lessons & sports practice ───────── */

export type LessonKind = 'music' | 'sports';
const skillKey = (kind: LessonKind, id: string) => `${kind === 'music' ? 'music' : 'sport'}:${id}`;
export const lessonPrice = (g: Game, kind: LessonKind) => (kind === 'music' && g.age >= 18 ? 100 : 0);
export const skillOf = (g: Game, key: string) => g.skills[key] ?? 0;

export const lessonTotal = (g: Game, kind: LessonKind, id: string) => lessonPrice(g, kind) + repeatFee(usesThisYear(g, `lesson:${skillKey(kind, id)}`));

export function lessonBlock(g: Game, kind: LessonKind, id: string): string | null {
  if (g.age < 6) return 'Age 6+';
  if (g.prison > 0) return 'In prison';
  if (g.money < lessonTotal(g, kind, id) && !canAskParents(g)) return 'Can’t afford';
  return null;
}

export function takeLesson(g: Game, kind: LessonKind, id: string, payer: Payer = 'self', perf?: number): Result | undefined {
  const list = kind === 'music' ? INSTRUMENTS : SPORTS;
  const d = list.find((x) => x.id === id);
  if (!d || lessonBlock(g, kind, id)) return;
  const key = skillKey(kind, id);
  const pay = payFor(g, lessonTotal(g, kind, id), payer);
  if (!pay.paid) return pay.result;
  markUsed(g, `lesson:${key}`);
  noteUse(g, `lesson:${key}`);
  bump(g, `act:${kind === 'music' ? 'music' : 'sports'}`);
  const talent = kind === 'music' ? g.stats.smarts : g.stats.health;
  const effort = perf === undefined ? 1 : 0.6 + perf * 0.8; // a good practice session teaches you more
  const gain = Math.max(2, Math.round((rand(5, 10) + Math.round(talent / 40)) * effort));
  const before = skillOf(g, key);
  g.skills[key] = clamp(before + gain);
  adjust(g, 'happiness', rand(2, 5));
  if (kind === 'sports') adjust(g, 'health', rand(2, 6));
  else adjust(g, 'smarts', rand(0, 2));
  const how = perf === undefined ? '' : perf >= 0.99 ? ' Perfect session!' : perf >= 0.7 ? ' Good session.' : perf >= 0.4 ? '' : ' I was distracted the whole time.';
  const level = g.skills[key] >= 80 ? 'I’m basically a pro now!' : g.skills[key] >= 50 ? 'I’m getting really good.' : 'Still learning, but improving!';
  return r(d.emoji, kind === 'music' ? `${d.name} lesson` : `${d.name} practice`,
    `${kind === 'music' ? `I practiced ${d.name.toLowerCase()}` : `I trained in ${d.name.toLowerCase()}`}.${how} Skill ${before} → ${g.skills[key]}. ${level}`);
}

/* ───────── School clubs ───────── */

export function clubBlock(g: Game, id: string): string | null {
  if (g.education.stage === 'none') return 'Only while in school';
  if (g.age < 8) return 'Age 8+';
  if (g.clubs.some((m) => m.id === id)) return 'Already a member';
  if (g.clubs.length >= MAX_CLUBS) return `Max ${MAX_CLUBS} clubs`;
  if (used(g, `club:${id}`)) return 'Tried this year';
  return null;
}

export function joinClub(g: Game, id: string): Result | undefined {
  const c = clubOf(id);
  if (!c || clubBlock(g, id)) return;
  markUsed(g, `club:${id}`);
  if (c.tryout && !chance(0.35 + g.stats[c.tryout.stat] / 150)) {
    adjust(g, 'happiness', -4);
    return r('😔', `${c.tryout.label} didn’t go well`, `I tried to join the ${c.name}, but didn’t make it this year.`);
  }
  g.clubs.push({ id, years: 0 });
  if (!g.flags.includes(`club:${id}`)) g.flags.push(`club:${id}`);
  adjust(g, 'happiness', 5);
  return r(c.emoji, 'Welcome to the club!', `I joined the ${c.name}.`);
}

export function leaveClub(g: Game, id: string): Result | undefined {
  const c = clubOf(id);
  if (!c || !g.clubs.some((m) => m.id === id)) return;
  g.clubs = g.clubs.filter((m) => m.id !== id);
  return r('👋', 'Left the club', `I quit the ${c.name}.`);
}

/* ───────── Playable gambling & crime ───────── */

/** Called when a crime mini-game begins: it counts as this year's attempt. */
export function startMiniGame(g: Game, id: MiniGame): boolean {
  const a = ACTIVITIES.find((x) => x.id === id);
  if (!a || activityBlock(g, a)) return false;
  if (!a.repeatable) markUsed(g, `act:${a.id}`);
  bump(g, `act:${a.id}`);
  return true;
}

export function payBet(g: Game, delta: number) {
  g.money += delta;
}

export function leaveCasino(g: Game, net: number, rounds: number) {
  if (rounds === 0) return;
  adjust(g, 'happiness', net > 0 ? 6 : net < 0 ? -4 : 1);
  log(g, net > 0 ? `🎰 I walked out of the casino ${money(net)} richer!` : net < 0 ? `🎰 I lost ${money(-net)} at the casino.` : '🎰 I broke even at the casino.');
}

export function lotteryWin(g: Game, prize: number, what: string): Result {
  g.money += prize;
  const big = prize >= 1_000_000;
  adjust(g, 'happiness', big ? 40 : prize >= 1000 ? 10 : 3);
  return { emoji: big ? '🤑' : '🎟️', title: big ? 'JACKPOT!!!' : 'Winner!', text: `I won ${money(prize)} on ${what}!`, celebrate: prize >= 1000 };
}

const SHOP_LOOT: Record<string, { name: string; value: number }> = {
  candy: { name: 'a candy bar', value: 0 },
  shades: { name: 'a pair of designer sunglasses', value: 150 },
  bag: { name: 'a designer handbag', value: 900 },
};

export function shopliftResult(g: Game, success: boolean, itemId: string): Result {
  const item = SHOP_LOOT[itemId] ?? SHOP_LOOT.candy;
  if (success) {
    adjust(g, 'happiness', 4);
    if (item.value) g.money += item.value;
    return r('🕶️', 'Got away!', `I snuck out with ${item.name}${item.value ? ` and resold the loot for ${money(item.value)}` : ''}.`);
  }
  if (g.age < 18) {
    for (const p of living(g, 'mother', 'father')) bond(p, -10);
    adjust(g, 'happiness', -5);
    return r('🚨', 'Grounded', `Security caught me stealing ${item.name}. My parents grounded me.`);
  }
  g.money -= 500; g.criminalRecord++; adjust(g, 'happiness', -6);
  return r('🚨', 'Caught', `Security caught me stealing ${item.name}. I was fined $500.`);
}

function sendToPrison(g: Game, years: number) {
  g.prison = years; g.criminalRecord++; adjust(g, 'happiness', -20);
  if (g.job) log(g, `I lost my job as ${g.job.title}.`);
  g.job = null;
  if (g.education.stage !== 'none') Object.assign(g.education, { stage: 'none', program: undefined });
}

export function heistResult(g: Game, outcome: 'caught' | 'escaped' | 'empty', loot: number): Result {
  if (outcome === 'escaped' && loot > 0) {
    g.money += loot; adjust(g, 'happiness', 15);
    return { emoji: '💰', title: 'Clean getaway!', text: `We pulled off the heist and escaped with ${money(loot)}!`, celebrate: true };
  }
  if (outcome === 'empty') {
    adjust(g, 'happiness', -3);
    return r('🏃', 'Escaped… empty-handed', 'The alarm went off, but I slipped away with nothing. Close one.');
  }
  const years = rand(3, 10);
  sendToPrison(g, years);
  return r('⛓️', 'Busted', `The heist failed. I was sentenced to ${years} years in prison.`);
}

export function escapeResult(g: Game, success: boolean): Result {
  if (success) {
    g.prison = 0; adjust(g, 'happiness', 20);
    return { emoji: '🏃', title: 'Free!', text: 'I escaped from prison under the cover of night!', celebrate: true };
  }
  g.prison += 2; adjust(g, 'health', -5);
  return r('🚨', 'Caught', 'The guards caught me. Two more years were added to my sentence.');
}

/* ───────────────────────── Relationships ───────────────────────── */

export interface Interaction {
  id: string;
  emoji: string;
  label: string;
  show: (g: Game, p: Person) => boolean;
  check?: (g: Game, p: Person) => string | null;
  run: (g: Game, p: Person) => Result;
}

const isParent = (p: Person) => isCore(p) && (p.relation === 'mother' || p.relation === 'father');
/** Is this person someone you'd date, going by who you like? */
const likes = (g: Game, p: Person) => g.preference === 'everyone' || (g.preference === 'men') === (p.gender === 'male');
const isRomantic = (p: Person) => isCore(p) && (p.relation === 'partner' || p.relation === 'spouse');

export const INTERACTIONS: Interaction[] = [
  {
    id: 'time', emoji: '🌅', label: 'Spend time together', show: () => true,
    run: (g, p) => {
      bond(p, rand(6, 14)); adjust(g, 'happiness', 2);
      return r('🌅', 'Quality time', `I ${pick(['watched the sunset', 'went stargazing', 'grabbed boba', 'went for a long walk', 'cooked dinner'])} with ${p.firstName}.`);
    },
  },
  {
    id: 'talk', emoji: '💬', label: 'Have a conversation', show: () => true,
    run: (_g, p) => { bond(p, rand(2, 7)); return r('💬', 'Heart to heart', `I had a nice long talk with ${p.firstName}.`); },
  },
  {
    id: 'compliment', emoji: '🌸', label: 'Compliment', show: (g) => g.age >= 3,
    run: (_g, p) => {
      if (chance(0.85)) { bond(p, rand(3, 8)); return r('🌸', 'Flattered', `I complimented ${p.firstName}. They smiled for the rest of the day.`); }
      bond(p, -3);
      return r('🙄', 'Misread', `I complimented ${p.firstName}, but they thought I was being sarcastic.`);
    },
  },
  {
    id: 'gift', emoji: '🎁', label: 'Give a gift ($100)', show: (g) => g.age >= 8,
    check: (g) => (g.money < 100 ? 'Can’t afford' : null),
    run: (g, p) => { g.money -= 100; bond(p, rand(8, 15)); return r('🎁', 'Thoughtful', `I gave ${p.firstName} ${pick(['a scented candle', 'a book', 'a star map print', 'a cozy sweater', 'concert tickets'])}.`); },
  },
  {
    id: 'money', emoji: '💵', label: 'Ask for money', show: (g, p) => g.age >= 5 && (isParent(p) || isRomantic(p)),
    run: (g, p) => {
      if (isRomantic(p)) {
        if (!p.salary) return r('🤷', 'Empty pockets', `${p.firstName} doesn’t have any money to give.`);
        if (!chance(p.closeness / 120)) { bond(p, -5); return r('🙅', 'Denied', `${p.firstName} said no.`); }
        // VIP partners have no limit.
        const amount = Math.round(p.salary * (p.vip ? rand(5, 25) : rand(1, 5)) / 100);
        g.money += amount;
        return { ...r(p.vip ? '💸' : '💵', p.vip ? 'No limit!' : 'Generous', `${p.firstName} gave me ${money(amount)}${p.vip ? ' without even blinking' : ''}.`), celebrate: amount >= 100_000 };
      }
      const o = originOf(g.origin);
      const base = g.age < 18 ? o.allowance : o.adultGift;
      if (!base) return r('🫶', 'Nothing to give', `${p.firstName} wishes they could help, but they have nothing to spare.`);
      if (chance(p.closeness / 130)) {
        const amount = rand(1, 10) * base;
        g.money += amount;
        return r('💵', 'Generous', `${p.firstName} gave me ${money(amount)}.`);
      }
      bond(p, -4);
      return r('🙅', 'Denied', `I asked ${p.firstName} for money. They said no.`);
    },
  },
  {
    id: 'freedom', emoji: '🗝️', label: 'Ask to choose my own career',
    show: (g, p) => isParent(p) && g.age >= 14 && !royalFree(g) && (p.job === 'King' || p.job === 'Queen'),
    run: (g, p) => {
      if (chance(0.5)) {
        g.flags.push('royalFreed');
        const was = g.job?.royal ? g.job.title : null;
        if (g.job?.royal) g.job = null;
        bond(p, 5); adjust(g, 'happiness', 12);
        return { ...r('🗝️', 'Blessing granted!', `${p.firstName} agreed! ${was ? `I stepped down as ${was} and` : 'I'} can now pursue any career I want.`), celebrate: true };
      }
      bond(p, -3); adjust(g, 'happiness', -4);
      return r('🏰', 'Royal duty calls', `${p.firstName} said a royal must honor their duty. Maybe they’ll change their mind next year.`);
    },
  },
  {
    id: 'argue', emoji: '💢', label: 'Start an argument', show: (g) => g.age >= 4,
    run: (g, p) => {
      bond(p, -rand(5, 15));
      if (chance(0.3)) { adjust(g, 'happiness', 3); return r('💢', 'Vented', `I argued with ${p.firstName}. Honestly, it felt good to vent.`); }
      adjust(g, 'happiness', -3);
      return r('💢', 'Argument', `I got into a heated argument with ${p.firstName}.`);
    },
  },
  {
    id: 'propose', emoji: '💍', label: 'Propose', show: (g, p) => isCore(p) && p.relation === 'partner' && g.age >= 18 && p.age >= 18,
    run: (g, p) => {
      if (chance(p.closeness / 100)) {
        p.relation = 'spouse'; bond(p, 10); adjust(g, 'happiness', 15);
        addInLaws(g, p); // before the wedding makes a commoner spouse royal
        const crowned = royalWedding(g, p);
        return { ...r('💍', 'Married!', `${p.firstName} said yes! We got married under a sky full of stars.${crowned ? ` ${crowned}` : ''}`), celebrate: true };
      }
      bond(p, -20); adjust(g, 'happiness', -10);
      return r('💔', 'Rejected', `I proposed to ${p.firstName}, but they said they weren’t ready.`);
    },
  },
  {
    id: 'baby', emoji: '👶', label: 'Try for a baby', show: (g, p) => isRomantic(p) && g.age >= 18 && g.age <= 50 && p.age <= 50,
    run: (g, p) => {
      if (!chance(g.flags.includes('blessed:fertility') ? 0.9 : 0.4)) return r('🍼', 'Not this time', `${p.firstName} and I tried for a baby, but no luck this year.`);
      const kid = makePerson('child', pick(['male', 'female'] as const), 0, g.lastName, 90);
      kid.look = inheritLook(kid.gender, g.look, p.look);
      kid.born = { smarts: inheritStat(g.stats.smarts), looks: inheritStat(g.stats.looks), health: inheritStat(g.stats.health) };
      g.relationships.push(kid);
      bond(p, 10); adjust(g, 'happiness', 12);
      return { ...r('👶', 'It’s a baby!', `${p.firstName} and I welcomed a baby ${kid.gender === 'male' ? 'boy' : 'girl'} named ${kid.firstName}!`), celebrate: true };
    },
  },
  {
    id: 'askout', emoji: '💘', label: 'Ask out on a date',
    show: (g, p) => isCore(p) && p.relation === 'coworker' && g.age >= 16 && p.age >= 16 && likes(g, p),
    check: (g) => (isSingle(g) ? null : 'You’re already taken'),
    run: (g, p) => {
      if (chance(0.15 + p.closeness / 150 + g.stats.looks / 400)) {
        p.relation = 'partner';
        p.via = undefined;
        bond(p, 15); adjust(g, 'happiness', 10);
        return { ...r('💘', 'Office romance!', `I asked ${p.firstName} out after work, and they said yes! We’re dating now.`), celebrate: true };
      }
      bond(p, -12); adjust(g, 'happiness', -5);
      return r('😬', 'Awkward', `${p.firstName} said they’d rather keep things professional. Tomorrow’s meeting will be awkward.`);
    },
  },
  {
    id: 'breakup', emoji: '💔', label: 'Break up', show: (_g, p) => isCore(p) && p.relation === 'partner',
    run: (g, p) => { makeEx(g, p); adjust(g, 'happiness', -5); return r('💔', 'Broken up', `I broke up with ${p.firstName}.`); },
  },
  {
    id: 'divorce', emoji: '📄', label: 'Divorce', show: (_g, p) => isCore(p) && p.relation === 'spouse',
    run: (g, p) => {
      makeEx(g, p);
      if (g.money > 0) g.money = Math.round(g.money / 2);
      adjust(g, 'happiness', -10);
      const lost = loseConsortTitle(g);
      return r('📄', 'Divorced', `I divorced ${p.firstName}. They got half of my money.${lost ? ` ${lost}` : ''}`);
    },
  },
  {
    id: 'unfriend', emoji: '👋', label: 'End friendship', show: (_g, p) => isCore(p) && p.relation === 'friend',
    run: (g, p) => { makeEx(g, p); return r('👋', 'Goodbye', `I ended my friendship with ${p.firstName}.`); },
  },
];

export function interactionBlock(g: Game, p: Person, i: Interaction): string | null {
  if (g.prison > 0 && i.id !== 'talk') return 'In prison';
  if (used(g, `rel:${p.id}:${i.id}`)) return 'Done this year';
  return i.check?.(g, p) ?? null;
}

export function interact(g: Game, personId: string, id: string): Result | undefined {
  const p = g.relationships.find((x) => x.id === personId);
  const i = INTERACTIONS.find((x) => x.id === id);
  if (!p || !i || !p.alive || interactionBlock(g, p, i)) return;
  markUsed(g, `rel:${p.id}:${i.id}`);
  return i.run(g, p);
}


/* ───────────────────────── Career ───────────────────────── */

const bestSkillKey = (g: Game, keys: string[]) => keys.reduce((a, b) => (skillOf(g, b) > skillOf(g, a) ? b : a), keys[0]);
const bestSkill = (g: Game, keys: string[]) => skillOf(g, bestSkillKey(g, keys));

export function careerBlock(g: Game, c: Career): string | null {
  if (c.hidden) return 'Not available';
  if (!canApplyAgain(g, c.id)) return 'Turned down — try next year';
  if (!royalFree(g)) return '👑 Royal duty — ask your parents first';
  if (isConsort(g)) return '👑 Consort duty — only a divorce ends it';
  if (g.prison > 0) return 'In prison';
  if (g.age < c.minAge) return `Age ${c.minAge}+`;
  if (!c.partTime && !c.field && g.education.stage !== 'none') return 'Finish school first';
  if (c.field && g.education.stage !== 'none' && g.job && !g.job.partTime) return 'Have a full-time job';
  if (c.partTime && g.age >= 18 && g.job && !g.job.partTime) return 'Have a full-time job';
  if (c.edu && !hasEdu(g, c.edu)) return eduRequirementLabel(c.edu);
  if (c.cleanRecord && g.criminalRecord > 0) return 'Criminal record';
  if (c.needsRecord && g.criminalRecord === 0 && !dreamGuaranteed(g, c.id)) return 'Needs street cred';
  if (c.minHealth && g.stats.health < c.minHealth - 25) return `Health ${c.minHealth}+`;
  if (c.skill && bestSkill(g, c.skill) < (c.minSkill ?? 0)) return `${skillName(bestSkillKey(g, c.skill))} skill ${c.minSkill}+`;
  if (g.job?.careerId === c.id) return 'Current job';
  if (used(g, `apply:${c.id}`)) return 'Applied this year';
  return null;
}

export function applyJob(g: Game, id: string, interviewed = false): Result | undefined {
  const c = CAREERS.find((x) => x.id === id);
  if (!c || careerBlock(g, c)) return;
  markUsed(g, `apply:${c.id}`);
  let p = 0.6 + (g.stats.smarts - (c.minSmarts ?? 0)) / 200;
  if (c.minSmarts && g.stats.smarts < c.minSmarts) p = 0.1;
  if (c.minLooks) p = g.stats.looks >= c.minLooks ? 0.6 : 0.05;
  if (c.minHealth && g.stats.health < c.minHealth) p = 0.05;
  if (c.skill) p = 0.45 + (bestSkill(g, c.skill) - (c.minSkill ?? 0)) / 80 - (c.minHealth && g.stats.health < c.minHealth ? 0.3 : 0);
  if (c.special) p = Math.min(p, c.needsRecord ? 0.35 : 0.08);
  p += originOf(g.origin).connections;
  if (g.criminalRecord > 0 && !c.needsRecord) p -= 0.2;
  const guaranteed = dreamGuaranteed(g, c.id);
  if (interviewed) p += 0.3; // a good interview counts for a lot
  if (guaranteed) p = 1;
  if (!chance(clamp(p, 0.03, 1))) {
    adjust(g, 'happiness', -3);
    return r('📭', 'Rejected', c.special
      ? `I tried to break in as a ${c.title}, but it’s a tough world. Maybe making it my dream would help.`
      : `I applied to be a ${c.title}, but they went with someone else.`);
  }
  const prev = g.job;
  hire(g, c);
  adjust(g, 'happiness', 6);
  const quit = prev ? ` I quit my job as ${prev.title}.` : '';
  const dream = guaranteed ? ' My dream came true! 🌟' : '';
  return r(c.emoji, 'Hired!', `I got hired as a ${c.levels[0]} earning ${money(salaryAt(c, 0))} a year.${quit}${dream}`);
}

export function workHarder(g: Game): Result | undefined {
  if (!g.job || used(g, 'job:harder')) return;
  markUsed(g, 'job:harder');
  bump(g, 'job:harder');
  g.job.performance = clamp(g.job.performance + rand(6, 15));
  adjust(g, 'happiness', -2);
  return r('💪', 'Hustle', 'I put in extra hours at work this year.');
}

export function askRaise(g: Game): Result | undefined {
  const job = g.job;
  if (!job || used(g, 'job:raise')) return;
  markUsed(g, 'job:raise');
  if (chance(job.performance / 150)) {
    job.salary = Math.round(job.salary * 1.08);
    adjust(g, 'happiness', 5);
    return r('💰', 'Raise granted', `My boss gave me a raise. I now make ${money(job.salary)}.`);
  }
  job.performance = clamp(job.performance - 5);
  return r('🙅', 'Denied', 'I asked for a raise. My boss laughed.');
}

export function quitJob(g: Game): Result | undefined {
  if (!g.job) return;
  if (g.job.royal && isConsort(g)) {
    return r('🏰', 'Bound by marriage', 'My title comes with my marriage. The only way to give it up is a divorce.');
  }
  if (g.job.royal) {
    const parents = living(g, 'mother', 'father');
    if (!royalFree(g) && parents.length) return r('🏰', 'The palace says no', 'A royal can’t just quit. I’d have to ask my parents for their blessing first.');
    g.flags.push('royalFreed');
    const title = g.job.title;
    g.job = null;
    adjust(g, 'happiness', 5);
    return { ...r('🏰', 'Abdicated', `I gave up my title as ${title}. From now on I choose my own path.`), celebrate: true };
  }
  const title = g.job.title;
  g.job = null;
  return r('👋', 'Quit', `I quit my job as ${title}.`);
}

export function retire(g: Game): Result | undefined {
  if (!g.job || g.job.partTime || g.age < 60) return;
  g.pension = Math.round(g.job.salary * Math.min(0.5, 0.2 + g.job.years * 0.015));
  const title = g.job.title;
  g.job = null;
  g.retired = true;
  adjust(g, 'happiness', 10);
  return r('🏖️', 'Retired', `I retired from my job as ${title}. My pension is ${money(g.pension)} a year.`);
}

/* ───────────────────────── Education ───────────────────────── */

export type PayMode = 'loans' | 'cash' | 'parents';

export interface Program {
  kind: 'university' | 'graduate';
  id: string;
  name: string;
  years: number;
  tuition: number;
  minSmarts: number;
}

export function availablePrograms(g: Game): Program[] {
  if (g.age < 18 || !hasEdu(g, 'hs')) return [];
  const uni = MAJORS.filter((m) => !g.education.degrees.includes(`ba:${m.id}`)).map<Program>((m) => ({
    kind: 'university', id: m.id, name: m.name, years: UNIVERSITY.years, tuition: UNIVERSITY.tuition, minSmarts: m.minSmarts,
  }));
  const grad = GRAD_PROGRAMS.filter((p) => !g.education.degrees.includes(p.id) && p.requires.some((req) => hasEdu(g, req))).map<Program>((p) => ({
    kind: 'graduate', id: p.id, name: p.name, years: p.years, tuition: p.tuition, minSmarts: p.minSmarts,
  }));
  return [...grad, ...uni];
}

export function schoolBlock(g: Game): string | null {
  if (g.prison > 0) return 'In prison';
  if (!royalFree(g)) return '👑 Royals are taught at the palace';
  if (g.education.stage !== 'none') return 'Already enrolled';
  if (g.job && !g.job.partTime && !g.job.royal) return 'Quit your full-time job first';
  return null;
}

/** Ask your parents about tuition before applying, so you know where you stand. */
export function askTuition(g: Game, id: string): { yes: boolean; text: string } {
  const parents = living(g, 'mother', 'father');
  const family = originOf(g.origin).tuition;
  if (!family || !parents.length) return { yes: false, text: 'My family can’t afford tuition.' };
  if (g.yearUses[`tuitionyes:${id}`]) return { yes: true, text: 'My parents already said they’ll pay my tuition! 💜' };
  if (g.yearUses[`tuitionno:${id}`]) return { yes: false, text: 'They already said no to this one this year.' };
  const best = Math.max(0, ...parents.map((x) => x.closeness));
  if (!chance((best / 140) * family)) {
    noteUse(g, `tuitionno:${id}`);
    return { yes: false, text: 'My parents said they can’t pay for this.' };
  }
  g.yearUses[`tuitionyes:${id}`] = 1;
  return { yes: true, text: 'My parents said yes — they’ll pay my tuition! 💜' };
}

export function enroll(g: Game, kind: Program['kind'], id: string, pay: PayMode): Result | undefined {
  const prog = availablePrograms(g).find((p) => p.kind === kind && p.id === id);
  if (!prog || schoolBlock(g) || used(g, `enroll:${id}`)) return;
  markUsed(g, `enroll:${id}`);
  const total = prog.tuition * prog.years;

  let p = g.stats.smarts >= prog.minSmarts ? 0.75 + (g.stats.smarts - prog.minSmarts) / 200 : 0.2 * (g.stats.smarts / prog.minSmarts);
  p += originOf(g.origin).connections;
  if (dreamOpensProgram(g, prog.kind === 'university' ? `ba:${prog.id}` : prog.id)) p = 1;
  if (!chance(clamp(p, 0.02, 1))) {
    adjust(g, 'happiness', -6);
    return r('📭', 'Rejected', `My application to ${prog.kind === 'university' ? `study ${prog.name}` : prog.name} was rejected.`);
  }

  if (pay === 'cash') {
    if (g.money < total) return r('💸', 'Not enough', `I can’t afford ${money(total)} in tuition.`);
    g.money -= total;
  } else if (pay === 'parents') {
    if (!g.yearUses[`tuitionyes:${id}`]) return r('🙅', 'Parents said no', 'My parents never agreed to pay my tuition. I didn’t enroll.');
    delete g.yearUses[`tuitionyes:${id}`];
  } else {
    g.education.studentLoans += total;
  }

  Object.assign(g.education, {
    stage: prog.kind, program: prog.id, yearsLeft: prog.years, grades: clamp(g.stats.smarts + rand(-10, 10)),
    missedExams: 0, reviewSheet: false, paper: undefined,
  });
  adjust(g, 'happiness', 6);
  const how = pay === 'loans' ? ` I took out ${money(total)} in student loans.` : pay === 'parents' ? ' My parents are paying!' : '';
  return r('🎓', 'Accepted!', `I enrolled in ${prog.kind === 'university' ? `university to study ${prog.name}` : prog.name}.${how}`);
}

export function study(g: Game): Result | undefined {
  if (g.education.stage === 'none' || used(g, 'school:study')) return;
  markUsed(g, 'school:study');
  bump(g, 'school:study');
  g.education.grades = clamp(g.education.grades + rand(5, 12));
  adjust(g, 'smarts', rand(1, 3));
  adjust(g, 'happiness', -2);
  return r('📖', 'Studious', 'I studied harder than ever this year.');
}

export function dropOut(g: Game): Result | undefined {
  const e = g.education;
  if (e.stage !== 'university' && e.stage !== 'graduate') return;
  Object.assign(e, { stage: 'none', program: undefined, yearsLeft: 0 });
  adjust(g, 'happiness', 3);
  return r('🚪', 'Dropped out', 'I dropped out of school.');
}

export function takeGed(g: Game): Result | undefined {
  if (g.age < 18 || hasEdu(g, 'hs') || g.education.stage !== 'none' || g.money < 200 || used(g, 'school:ged')) return;
  markUsed(g, 'school:ged');
  g.money -= 200;
  if (chance(0.2 + g.stats.smarts / 100)) {
    g.education.degrees.push('hs');
    adjust(g, 'happiness', 8);
    return r('📜', 'Passed', 'I passed the GED exam and earned my high school equivalency!');
  }
  return r('📜', 'Failed', 'I failed the GED exam. I can try again next year.');
}

export const schoolName = (g: Game) => {
  const e = g.education;
  if (e.stage === 'royal') return 'Royal Academy';
  if (e.stage === 'elementary') return 'Elementary School';
  if (e.stage === 'high') return 'High School';
  if (e.stage === 'university') return `University · ${MAJORS.find((m) => m.id === e.program)?.name}`;
  if (e.stage === 'graduate') return GRAD_PROGRAMS.find((p) => p.id === e.program)?.name ?? 'Graduate School';
  return '';
};


/* ───────────────────────── Assets ───────────────────────── */

export function buyBlock(g: Game, price: number, payer: Payer = 'self'): string | null {
  if (g.age < 16) return 'Age 16+';
  if (g.prison > 0) return 'In prison';
  if (payer === 'self' && g.money < price && !canAskParents(g)) return 'Can’t afford';
  return null;
}

export function buy(g: Game, shopId: string, payer: Payer = 'self'): Result | undefined {
  const item = SHOP.find((s) => s.id === shopId);
  if (!item || buyBlock(g, item.price, payer)) return;
  const pay = payFor(g, item.price, payer);
  if (!pay.paid) return pay.result;
  g.assets.push({ id: uid(), shopId: item.id, kind: item.kind, name: item.name, emoji: item.emoji, value: item.price, purchasePrice: item.price, age: 0 });
  adjust(g, 'happiness', item.happiness);
  return r(item.emoji, 'Purchased', `I bought a ${item.name} for ${money(item.price)}.`);
}

export function sell(g: Game, assetId: string): Result | undefined {
  const a = g.assets.find((x) => x.id === assetId);
  if (!a || g.prison > 0) return;
  g.assets = g.assets.filter((x) => x.id !== assetId);
  g.money += a.value;
  return r('🤝', 'Sold', `I sold my ${a.name} for ${money(a.value)}.`);
}

/* ───────── Shopping mall ───────── */

export function mallBlock(g: Game): string | null {
  if (g.age < 6) return 'Age 6+';
  if (g.prison > 0) return 'In prison';
  return null;
}

export const lookCost = (g: Game, look: Look) => unownedItems(look, g.wardrobe).reduce((s, id) => s + itemPrice(id), 0);

export function buyLook(g: Game, look: Look, payer: Payer = 'self'): Result | undefined {
  if (mallBlock(g)) return;
  const items = unownedItems(look, g.wardrobe);
  const cost = items.reduce((s, id) => s + itemPrice(id), 0);
  const pay = payFor(g, cost, payer);
  if (!pay.paid) return pay.result;
  g.wardrobe.push(...items);
  g.look = { ...g.look, top: look.top, topColor: look.topColor, acc: { ...look.acc } };
  if (!items.length) return;
  adjust(g, 'happiness', Math.min(12, 3 + items.length * 2));
  if (!used(g, 'act:mall')) { markUsed(g, 'act:mall'); adjust(g, 'looks', rand(1, 3)); }
  const names = items.map(itemName).join(', ');
  return { emoji: '🛍️', title: 'Shopping spree!', text: `I got ${names} at the mall${pay.note ? ` — ${pay.note}` : ` for ${money(cost)}`}.`, celebrate: cost >= 10000 };
}
