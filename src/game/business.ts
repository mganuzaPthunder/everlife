/* Your own business: found it, staff it, advertise it, and live off (or lose) the profits. */

import type { Game, Gender, Look, Result } from './types';
import { CAREERS } from './data';
import { adjust, log, randomFirst } from './helpers';
import { randomLook } from './look';
import { LAST } from './names';
import { chance, clamp, money, pick, rand, uid } from './util';

export interface BusinessType {
  id: string;
  emoji: string;
  name: string;
  /** Yearly revenue per dollar invested, at average popularity and a full team. */
  yield: number;
  /** How many good staff it takes to run well. */
  team: number;
  roles: string[];
}

export const BUSINESS_TYPES: BusinessType[] = [
  { id: 'cafe', emoji: '☕', name: 'Café', yield: 0.34, team: 4, roles: ['Barista', 'Baker', 'Shift Lead', 'Cashier'] },
  { id: 'bubbletea', emoji: '🧋', name: 'Bubble Tea Shop', yield: 0.36, team: 3, roles: ['Tea Maker', 'Cashier', 'Shift Lead'] },
  { id: 'restaurant', emoji: '🍽️', name: 'Restaurant', yield: 0.32, team: 6, roles: ['Head Chef', 'Line Cook', 'Waiter', 'Host', 'Dishwasher'] },
  { id: 'bakery', emoji: '🥐', name: 'Bakery', yield: 0.3, team: 3, roles: ['Pastry Chef', 'Baker', 'Cashier'] },
  { id: 'boutique', emoji: '👗', name: 'Clothing Boutique', yield: 0.3, team: 3, roles: ['Stylist', 'Sales Associate', 'Designer'] },
  { id: 'salon', emoji: '💇', name: 'Beauty Salon', yield: 0.32, team: 4, roles: ['Hair Stylist', 'Nail Artist', 'Makeup Artist', 'Receptionist'] },
  { id: 'gym', emoji: '🏋️', name: 'Gym', yield: 0.28, team: 4, roles: ['Personal Trainer', 'Yoga Instructor', 'Front Desk', 'Cleaner'] },
  { id: 'bookstore', emoji: '📚', name: 'Bookstore', yield: 0.22, team: 3, roles: ['Bookseller', 'Buyer', 'Barista'] },
  { id: 'flowers', emoji: '💐', name: 'Flower Shop', yield: 0.26, team: 2, roles: ['Florist', 'Delivery Driver'] },
  { id: 'tech', emoji: '💻', name: 'Tech Startup', yield: 0.45, team: 6, roles: ['Software Engineer', 'Designer', 'Product Manager', 'Data Scientist', 'Marketer'] },
  { id: 'gamestudio', emoji: '🎮', name: 'Game Studio', yield: 0.42, team: 5, roles: ['Game Developer', 'Artist', 'Sound Designer', 'Producer', 'Tester'] },
  { id: 'label', emoji: '🎤', name: 'Record Label', yield: 0.4, team: 4, roles: ['Producer', 'Talent Scout', 'Sound Engineer', 'Publicist'] },
  { id: 'realestate', emoji: '🏘️', name: 'Real Estate Agency', yield: 0.3, team: 4, roles: ['Real Estate Agent', 'Broker', 'Office Manager'] },
  { id: 'cars', emoji: '🚗', name: 'Car Dealership', yield: 0.27, team: 5, roles: ['Car Salesperson', 'Mechanic', 'Finance Manager', 'Receptionist'] },
  { id: 'hotel', emoji: '🏨', name: 'Hotel', yield: 0.26, team: 7, roles: ['Hotel Manager', 'Receptionist', 'Housekeeper', 'Concierge', 'Chef'] },
  { id: 'fashion', emoji: '✨', name: 'Fashion Brand', yield: 0.4, team: 5, roles: ['Fashion Designer', 'Model', 'Tailor', 'Marketer', 'Photographer'] },
];

export const businessType = (id: string) => BUSINESS_TYPES.find((t) => t.id === id) ?? BUSINESS_TYPES[0];

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  look: Look;
  role: string;
  /** 0–100: how good they are at the job. */
  skill: number;
  salary: number;
  education: string;
  previousJob: string;
  experience: number;
  bio: string;
  hiredAge?: number;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  foundedAge: number;
  invested: number;
  value: number;
  /** 0–100: how well known and loved it is. Drives sales. */
  popularity: number;
  employees: Employee[];
  lastRevenue?: number;
  lastProfit?: number;
}

export const MIN_INVESTMENT = 5_000_000;
export const MAX_STAFF = 12;

/* ───────── Founding ───────── */

export function foundBlock(g: Game, invest: number): string | null {
  if (g.business) return 'You already own a business';
  if (g.age < 18) return 'Age 18+';
  if (g.prison > 0) return 'In prison';
  if (invest < MIN_INVESTMENT) return `Invest at least ${money(MIN_INVESTMENT)}`;
  if (g.money < invest) return 'Can’t afford';
  return null;
}

export function foundBusiness(g: Game, name: string, typeId: string, invest: number): Result | undefined {
  const t = businessType(typeId);
  const clean = name.trim().slice(0, 32) || `${g.firstName}’s ${t.name}`;
  if (foundBlock(g, invest)) return;
  g.money -= invest;
  g.business = { id: uid(), name: clean, type: t.id, foundedAge: g.age, invested: invest, value: invest, popularity: 12, employees: [] };
  adjust(g, 'happiness', 12);
  log(g, `🏢 I opened ${clean}, my own ${t.name.toLowerCase()}, with ${money(invest)}.`);
  return { emoji: t.emoji, title: 'Open for business!', text: `${clean} is open. Hire a team and get the word out — popularity is what brings the customers in.`, celebrate: true };
}

/* ───────── Advertising ───────── */

export interface AdChannel { id: string; emoji: string; name: string; price: number; boost: number }

export const AD_CHANNELS: AdChannel[] = [
  { id: 'flyers', emoji: '🪧', name: 'Flyers around town', price: 20_000, boost: 4 },
  { id: 'radio', emoji: '📻', name: 'Radio spot', price: 150_000, boost: 8 },
  { id: 'billboard', emoji: '🏙️', name: 'Billboard downtown', price: 500_000, boost: 12 },
  { id: 'tv', emoji: '📺', name: 'TV commercial', price: 2_000_000, boost: 20 },
];

export function adBlock(g: Game, id: string): string | null {
  const c = AD_CHANNELS.find((x) => x.id === id);
  if (!g.business || !c) return 'No business';
  if (g.yearUses[`ad:${id}`]) return 'Ran this year';
  if (g.money < c.price) return 'Can’t afford';
  return null;
}

export function runAd(g: Game, id: string): Result | undefined {
  const c = AD_CHANNELS.find((x) => x.id === id);
  const b = g.business;
  if (!c || !b || adBlock(g, id)) return;
  g.money -= c.price;
  g.yearUses[`ad:${id}`] = 1;
  const viral = chance(0.08 + c.boost / 200);
  const gain = viral ? c.boost * 2 : c.boost;
  b.popularity = clamp(b.popularity + gain);
  log(g, `${c.emoji} I ran a ${c.name.toLowerCase()} for ${b.name}${viral ? ' and people couldn’t stop talking about it' : ''}.`);
  return {
    emoji: viral ? '🚀' : c.emoji,
    title: viral ? 'The ad took off!' : 'Ad is live',
    text: `${c.name} for ${b.name}: popularity +${gain} (now ${b.popularity}).`,
    celebrate: viral,
  };
}

/** Promoting on your own social accounts: the bigger your following, the bigger the boost. */
export function socialBoost(g: Game, followers: number) {
  const b = g.business;
  if (!b) return 0;
  const gain = Math.round(Math.min(18, 1 + Math.log10(followers + 1) * 2.4));
  b.popularity = clamp(b.popularity + gain);
  return gain;
}

/* ───────── Staff ───────── */

const EDUCATION = ['High school', 'Trade school', 'Some college', 'Community college', 'Bachelor’s degree', 'Master’s degree', 'MBA'];
const BIOS = [
  'Always the first one in and the last to leave.',
  'Great with customers. Terrible with printers.',
  'Looking for a place to grow.',
  'Ten years in the industry and still loves it.',
  'Fresh out of school and hungry to learn.',
  'Left a big company to work somewhere that feels like family.',
  'Bilingual, organised, and makes a mean cup of coffee.',
  'Calm under pressure. Has a spreadsheet for everything.',
  'Will reorganise your storeroom without being asked.',
  'Former competitor. Knows all their secrets.',
  'Moved here for a fresh start.',
  'Quiet, careful, never misses a detail.',
];

export function makeCandidate(g: Game): Employee {
  const t = businessType(g.business?.type ?? 'cafe');
  const gender = pick(['male', 'female'] as const);
  const age = rand(18, 62);
  const experience = Math.max(0, Math.min(age - 18, rand(0, 25)));
  const skill = clamp(Math.round(rand(20, 70) + experience * 1.2 + rand(-10, 10)));
  const eduIdx = Math.min(EDUCATION.length - 1, Math.max(0, Math.floor(skill / 16) + rand(-1, 1)));
  const prev = pick(CAREERS.filter((c) => !c.hidden && !c.special && c.minAge <= age));
  return {
    id: uid(), firstName: randomFirst(gender), lastName: pick(LAST), gender, age, look: randomLook(gender),
    role: pick(t.roles), skill, salary: Math.round((24_000 + skill * 900 + experience * 1_200) / 500) * 500,
    education: EDUCATION[eduIdx], previousJob: experience ? prev.levels[0] : 'First job', experience, bio: pick(BIOS),
  };
}

export function hireBlock(g: Game): string | null {
  if (!g.business) return 'No business';
  if (g.business.employees.length >= MAX_STAFF) return `Team is full (${MAX_STAFF})`;
  return null;
}

export function hire(g: Game, e: Employee): Result | undefined {
  const b = g.business;
  if (!b || hireBlock(g) || b.employees.some((x) => x.id === e.id)) return;
  b.employees.push({ ...e, hiredAge: g.age });
  log(g, `🤝 I hired ${e.firstName} ${e.lastName} as a ${e.role} at ${b.name}.`);
  return { emoji: '🤝', title: 'Welcome aboard!', text: `${e.firstName} joins ${b.name} as a ${e.role} for ${money(e.salary)}/yr.` };
}

export function fire(g: Game, id: string): Result | undefined {
  const b = g.business;
  const e = b?.employees.find((x) => x.id === id);
  if (!b || !e) return;
  b.employees = b.employees.filter((x) => x.id !== id);
  log(g, `📦 I let ${e.firstName} ${e.lastName} go from ${b.name}.`);
  return { emoji: '📦', title: 'Let go', text: `${e.firstName} no longer works at ${b.name}.` };
}

/* ───────── Money ───────── */

export const payroll = (b: Business) => b.employees.reduce((s, e) => s + e.salary, 0);
/** Rent, stock and bills: a slice of what you've put in. */
export const upkeep = (b: Business) => Math.round(b.invested * 0.06);

/** How well the team covers the work: 0.35 with nobody, up to 1.5 with a strong, full team. */
export function staffFactor(b: Business) {
  const t = businessType(b.type);
  const strength = b.employees.reduce((s, e) => s + e.skill / 100, 0);
  return Math.min(1.5, 0.35 + (strength / t.team) * 0.85);
}

/** A rough guess at this year's takings, for the dashboard. */
export const expectedRevenue = (b: Business) =>
  Math.round(b.invested * businessType(b.type).yield * (0.3 + b.popularity / 70) * staffFactor(b));

export function investMore(g: Game, amount: number): Result | undefined {
  const b = g.business;
  if (!b || amount <= 0 || g.money < amount) return;
  g.money -= amount;
  b.invested += amount;
  b.value += amount;
  log(g, `💰 I put ${money(amount)} more into ${b.name}.`);
  return { emoji: '💰', title: 'Expanded', text: `${b.name} now has ${money(b.invested)} invested in it.` };
}

export function sellBusiness(g: Game): Result | undefined {
  const b = g.business;
  if (!b) return;
  const price = Math.max(0, Math.round(b.value));
  g.money += price;
  g.business = undefined;
  log(g, `🤝 I sold ${b.name} for ${money(price)}.`);
  return { emoji: '🤝', title: 'Sold!', text: `I sold ${b.name} for ${money(price)}.`, celebrate: price > b.invested };
}

/** Once a year: customers come (or don't), staff get paid, word of mouth fades. */
export function businessYear(g: Game) {
  const b = g.business;
  if (!b) return;
  for (const e of b.employees) { e.age++; e.skill = clamp(e.skill + rand(0, 3)); }
  const revenue = Math.round(expectedRevenue(b) * (0.8 + Math.random() * 0.4));
  const profit = revenue - payroll(b) - upkeep(b);
  g.money += profit;
  b.lastRevenue = revenue;
  b.lastProfit = profit;
  // Busy, well-run places get talked about; quiet ones are forgotten.
  b.popularity = clamp(b.popularity - rand(4, 8) + (staffFactor(b) > 1 ? 2 : 0));
  b.value = Math.max(0, Math.round(b.value * 0.95 + profit * 2.5));
  log(g, `🏢 ${b.name} took ${money(revenue)} and ${profit >= 0 ? `made ${money(profit)} profit` : `lost ${money(-profit)}`} this year.`);
  if (profit < 0) adjust(g, 'happiness', -4);
  else if (profit > b.invested * 0.1) adjust(g, 'happiness', 4);
}
