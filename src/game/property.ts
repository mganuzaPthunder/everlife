import type { Asset, Game, Result } from './types';
import { adjust, log } from './helpers';
import { money } from './util';
import { SHOP } from './data';
import { payFor, type Payer } from './actions';

/* ───────── Where you live, and what it looks like inside ───────── */

export interface District {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  /** Multiplies the asking price. */
  price: number;
  /** How fast it gains value each year, on top of the usual drift. */
  growth: number;
  /** Happiness for living here. */
  joy: number;
  /** Where the pin sits on the 300×200 map. */
  x: number;
  y: number;
}

export const DISTRICTS: District[] = [
  { id: 'downtown', name: 'Downtown', emoji: '🏙️', blurb: 'Everything on your doorstep, sirens at 3am.', price: 1.35, growth: 0.02, joy: 2, x: 150, y: 86 },
  { id: 'oldtown', name: 'Old Town', emoji: '🏛️', blurb: 'Cobbles, cafés and neighbours who have lived here for 40 years.', price: 1.1, growth: 0.015, joy: 4, x: 92, y: 72 },
  { id: 'suburbs', name: 'The Suburbs', emoji: '🏘️', blurb: 'Quiet streets, good schools, very long driveways.', price: 0.85, growth: 0.01, joy: 3, x: 62, y: 140 },
  { id: 'beach', name: 'Beachfront', emoji: '🏖️', blurb: 'Sand in the hallway forever. Worth it.', price: 1.6, growth: 0.025, joy: 8, x: 252, y: 150 },
  { id: 'hills', name: 'The Hills', emoji: '⛰️', blurb: 'Above the city lights. The road up is terrifying in winter.', price: 1.8, growth: 0.03, joy: 6, x: 232, y: 44 },
  { id: 'riverside', name: 'Riverside', emoji: '🌉', blurb: 'Morning mist on the water and a bridge you’ll photograph constantly.', price: 1.2, growth: 0.018, joy: 5, x: 178, y: 152 },
  { id: 'countryside', name: 'Countryside', emoji: '🌾', blurb: 'Space, stars and a 40-minute drive to anything.', price: 0.6, growth: 0.008, joy: 5, x: 40, y: 40 },
];

export const districtOf = (id?: string) => DISTRICTS.find((d) => d.id === id);

export const priceIn = (base: number, districtId: string) =>
  Math.round(base * (districtOf(districtId)?.price ?? 1));

/* ───────── Decor ───────── */

export interface DecorOption { id: string; name: string; price: number; color?: string }
export interface DecorSlot {
  id: string;
  name: string;
  emoji: string;
  /** Only offered on properties big enough for it. */
  minTier?: number;
  options: DecorOption[];
}

/** Studio 0 · house 1 · beach house 2 · mansion 3. */
export const tierOf = (shopId: string) => ({ h1: 0, h2: 1, h3: 2, h4: 3 }[shopId] ?? 0);

export const DECOR: DecorSlot[] = [
  {
    id: 'wall', name: 'Wall colour', emoji: '🎨',
    options: [
      { id: 'cream', name: 'Warm cream', price: 0, color: '#f2e6d4' },
      { id: 'blush', name: 'Blush pink', price: 400, color: '#f6d3e0' },
      { id: 'sage', name: 'Sage green', price: 400, color: '#cfe0ce' },
      { id: 'sky', name: 'Sky blue', price: 400, color: '#cfe0f5' },
      { id: 'lilac', name: 'Lilac', price: 600, color: '#ded0f5' },
      { id: 'charcoal', name: 'Charcoal', price: 800, color: '#4a4658' },
      { id: 'mural', name: 'Sunset mural', price: 3500, color: '#ffb38a' },
    ],
  },
  {
    id: 'floor', name: 'Flooring', emoji: '🪵',
    options: [
      { id: 'carpet', name: 'Grey carpet', price: 0, color: '#8b8798' },
      { id: 'oak', name: 'Oak boards', price: 1200, color: '#b9854f' },
      { id: 'walnut', name: 'Dark walnut', price: 2000, color: '#6b452b' },
      { id: 'marble', name: 'Marble tile', price: 6000, color: '#e8e6f0' },
      { id: 'rug', name: 'Persian rug', price: 3000, color: '#a6435a' },
    ],
  },
  {
    id: 'bed', name: 'Bed', emoji: '🛏️',
    options: [
      { id: 'single', name: 'Single bed', price: 0, color: '#8fb8ff' },
      { id: 'double', name: 'Double bed', price: 900, color: '#7ec4e8' },
      { id: 'king', name: 'King size', price: 2500, color: '#b79cff' },
      { id: 'canopy', name: 'Four-poster', price: 7000, color: '#ff8fc4' },
      { id: 'bunk', name: 'Bunk beds', price: 700, color: '#7ec46a' },
    ],
  },
  {
    id: 'kitchen', name: 'Kitchen', emoji: '🍳',
    options: [
      { id: 'basic', name: 'Basic units', price: 0, color: '#9b95b0' },
      { id: 'island', name: 'Kitchen island', price: 4500, color: '#d8c3a5' },
      { id: 'chef', name: 'Chef’s kitchen', price: 14000, color: '#c9c3e6' },
      { id: 'retro', name: 'Retro diner', price: 6000, color: '#ff8fa8' },
    ],
  },
  {
    id: 'garden', name: 'Garden', emoji: '🌳', minTier: 1,
    options: [
      { id: 'none', name: 'Just grass', price: 0, color: '#5c9c55' },
      { id: 'flowers', name: 'Flower beds', price: 1800, color: '#ff8fc4' },
      { id: 'veg', name: 'Vegetable patch', price: 1200, color: '#7ec46a' },
      { id: 'tree', name: 'Big old tree', price: 3000, color: '#3f7a4a' },
      { id: 'zen', name: 'Zen garden', price: 9000, color: '#cfe0ce' },
    ],
  },
  {
    id: 'living', name: 'Living room', emoji: '🛋️', minTier: 1,
    options: [
      { id: 'loveseat', name: 'Two-seater', price: 0, color: '#8a7fb8' },
      { id: 'corner', name: 'Corner sofa', price: 2200, color: '#6b8fd6' },
      { id: 'leather', name: 'Leather set', price: 5500, color: '#8a5a3a' },
      { id: 'fireplace', name: 'Sofa & fireplace', price: 9000, color: '#c96a4a' },
      { id: 'grand', name: 'Grand piano', price: 28000, color: '#2b2240' },
    ],
  },
  {
    id: 'bath', name: 'Bathroom', emoji: '🛁', minTier: 2,
    options: [
      { id: 'plain', name: 'Plain suite', price: 0, color: '#dfe6f2' },
      { id: 'tub', name: 'Freestanding tub', price: 3500, color: '#bfe9ff' },
      { id: 'spa', name: 'Marble spa', price: 18000, color: '#e8e6f0' },
      { id: 'gold', name: 'Gold fittings', price: 30000, color: '#f4c95d' },
    ],
  },
  {
    id: 'extra', name: 'The extra', emoji: '✨', minTier: 2,
    options: [
      { id: 'none', name: 'Nothing fancy', price: 0 },
      { id: 'pool', name: 'Swimming pool', price: 45000, color: '#7ec4e8' },
      { id: 'cinema', name: 'Home cinema', price: 60000, color: '#4b2a86' },
      { id: 'library', name: 'Library room', price: 25000, color: '#a6704a' },
      { id: 'studio', name: 'Music studio', price: 38000, color: '#ff6fa8' },
    ],
  },
  {
    id: 'pet', name: 'Finishing touch', emoji: '🐾',
    options: [
      { id: 'none', name: 'Nothing yet', price: 0 },
      { id: 'plants', name: 'House plants', price: 300, color: '#7ec46a' },
      { id: 'cat', name: 'A cat', price: 500, color: '#e8a86a' },
      { id: 'dog', name: 'A dog', price: 900, color: '#b9854f' },
      { id: 'fish', name: 'Fish tank', price: 1500, color: '#7ec4e8' },
    ],
  },
];

export const slotsFor = (asset: Asset) => DECOR.filter((s) => (s.minTier ?? 0) <= tierOf(asset.shopId));
export const optionOf = (slotId: string, optionId?: string) =>
  DECOR.find((s) => s.id === slotId)?.options.find((o) => o.id === optionId);

/** What's currently chosen (falling back to the free option). */
export function decorOf(asset: Asset, slotId: string): DecorOption {
  const slot = DECOR.find((s) => s.id === slotId)!;
  return slot.options.find((o) => o.id === asset.decor?.[slotId]) ?? slot.options[0];
}

/** The cost of changing to a new set of choices — you only pay for what's new. */
export function decorCost(asset: Asset, picks: Record<string, string>) {
  return slotsFor(asset).reduce((sum, slot) => {
    const next = picks[slot.id];
    if (!next || next === asset.decor?.[slot.id]) return sum;
    return sum + (slot.options.find((o) => o.id === next)?.price ?? 0);
  }, 0);
}

export function redecorate(g: Game, assetId: string, picks: Record<string, string>, payer: Payer = 'self'): Result | undefined {
  const asset = g.assets.find((a) => a.id === assetId);
  if (!asset || asset.kind !== 'house') return;
  const cost = decorCost(asset, picks);
  const pay = payFor(g, cost, payer);
  if (!pay.paid) return pay.result;
  const changed = slotsFor(asset).filter((s) => picks[s.id] && picks[s.id] !== asset.decor?.[s.id]);
  asset.decor = { ...asset.decor, ...picks };
  // A nicer home is worth more and feels better to come home to.
  asset.value = Math.round(asset.value + cost * 0.6);
  adjust(g, 'happiness', Math.min(10, 2 + changed.length * 2));
  if (!changed.length) return;
  const names = changed.map((s) => decorOf(asset, s.id).name.toLowerCase()).join(', ');
  log(g, `🛋️ I redecorated the ${asset.name.toLowerCase()}: ${names}.`);
  return {
    emoji: '🛋️',
    title: 'All done',
    text: cost > 0
      ? `The ${asset.name.toLowerCase()} has ${names}. ${pay.note ? `${pay.note}.` : `That cost ${money(cost)}.`}`
      : `I moved things around in the ${asset.name.toLowerCase()}. Free, and it feels new.`,
  };
}

/** Buying a house, once a district is picked. */
export function buyProperty(g: Game, shopId: string, districtId: string, payer: Payer = 'self'): Result | undefined {
  const item = SHOP.find((s) => s.id === shopId);
  const district = districtOf(districtId);
  if (!item || !district || item.kind !== 'house') return;
  const price = priceIn(item.price, districtId);
  const pay = payFor(g, price, payer);
  if (!pay.paid) return pay.result;
  g.assets.push({
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    shopId: item.id, kind: 'house', name: item.name, emoji: item.emoji,
    value: price, purchasePrice: price, age: 0, location: districtId, decor: {},
  });
  adjust(g, 'happiness', item.happiness + district.joy);
  log(g, `🔑 I bought a ${item.name.toLowerCase()} in ${district.name} for ${money(price)}.`);
  return {
    emoji: '🔑',
    title: 'Home!',
    text: `A ${item.name.toLowerCase()} in ${district.name} ${district.emoji} for ${money(price)}${pay.note ? ` — ${pay.note}` : ''}. Time to decorate.`,
    celebrate: price >= 1_000_000,
  };
}

/** Where you actually live — the priciest house you own. */
export const homeOf = (g: Game) => g.assets.filter((a) => a.kind === 'house').sort((a, b) => b.value - a.value)[0];
