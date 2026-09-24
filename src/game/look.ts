import type { AccSlot, BarPrefs, Gender, HairStyle, Look, StatKey } from './types';
import { chance, pick } from './util';

export const SKIN_TONES = ['#ffe3d3', '#f7cba9', '#e6ab84', '#c98b63', '#9c6444', '#6b422c'];

export const HAIR_COLORS = [
  { id: '#2b2230', name: 'Black' },
  { id: '#3b2418', name: 'Dark brown' },
  { id: '#6b4228', name: 'Brown' },
  { id: '#a4442a', name: 'Auburn' },
  { id: '#d8703a', name: 'Ginger' },
  { id: '#e8c27a', name: 'Blonde' },
  { id: '#f4e7c6', name: 'Platinum' },
  { id: '#dcd7e6', name: 'Silver' },
  { id: '#e0445a', name: 'Cherry' },
  { id: '#ff8fc4', name: 'Pink' },
  { id: '#ffb38a', name: 'Peach' },
  { id: '#b79cff', name: 'Lavender' },
  { id: '#8a4fd8', name: 'Purple' },
  { id: '#6f8cff', name: 'Blue' },
  { id: '#3fc1b0', name: 'Teal' },
  { id: '#9be8c8', name: 'Mint' },
];

/** Natural colors turn silver with age; dyed colors stay. */
export const NATURAL_HAIR = [...HAIR_COLORS.slice(0, 7).map((c) => c.id), '#5a3825'];

export const EYE_COLORS = [
  { id: '#4a2e1f', name: 'Brown' },
  { id: '#80602f', name: 'Hazel' },
  { id: '#3f7fd6', name: 'Blue' },
  { id: '#3f9a6a', name: 'Green' },
  { id: '#7d8795', name: 'Gray' },
  { id: '#8a5cf0', name: 'Violet' },
];

export type HairGroup = 'short' | 'trendy' | 'textured' | 'long' | 'updo';

export const HAIR_GROUPS: { id: HairGroup; name: string }[] = [
  { id: 'short', name: 'Short' },
  { id: 'trendy', name: 'Trendy' },
  { id: 'textured', name: 'Textured' },
  { id: 'long', name: 'Long' },
  { id: 'updo', name: 'Updos' },
];

export const HAIR_STYLES: { id: HairStyle; name: string; group: HairGroup }[] = [
  { id: 'short', name: 'Textured', group: 'short' },
  { id: 'sidepart', name: 'Side part', group: 'short' },
  { id: 'curtains', name: '90s curtains', group: 'short' },
  { id: 'messy', name: 'Messy', group: 'short' },
  { id: 'slick', name: 'Slick back', group: 'short' },
  { id: 'pixie', name: 'Pixie', group: 'short' },
  { id: 'buzz', name: 'Buzz cut', group: 'short' },
  { id: 'bald', name: 'Bald', group: 'short' },
  { id: 'undercut', name: 'Undercut', group: 'trendy' },
  { id: 'quiff', name: 'Quiff', group: 'trendy' },
  { id: 'fringe', name: 'K-pop fringe', group: 'trendy' },
  { id: 'fauxhawk', name: 'Fauxhawk', group: 'trendy' },
  { id: 'spiky', name: 'Spiky', group: 'trendy' },
  { id: 'mohawk', name: 'Mohawk', group: 'trendy' },
  { id: 'curly', name: 'Curly', group: 'textured' },
  { id: 'afro', name: 'Afro', group: 'textured' },
  { id: 'twists', name: 'Twists', group: 'textured' },
  { id: 'cornrows', name: 'Cornrows', group: 'textured' },
  { id: 'locs', name: 'Locs', group: 'textured' },
  { id: 'bob', name: 'Bob', group: 'long' },
  { id: 'bangs', name: 'Bangs', group: 'long' },
  { id: 'long', name: 'Long', group: 'long' },
  { id: 'wavy', name: 'Wavy', group: 'long' },
  { id: 'surfer', name: 'Surfer', group: 'long' },
  { id: 'braids', name: 'Braids', group: 'updo' },
  { id: 'ponytail', name: 'Ponytail', group: 'updo' },
  { id: 'pigtails', name: 'Pigtails', group: 'updo' },
  { id: 'buns', name: 'Space buns', group: 'updo' },
  { id: 'topknot', name: 'Top knot', group: 'updo' },
  { id: 'manbun', name: 'Man bun', group: 'updo' },
  /* ── more styles ── */
  { id: 'bowl', name: 'Bowl cut', group: 'short' },
  { id: 'caesar', name: 'Caesar crop', group: 'short' },
  { id: 'shag', name: 'Shag', group: 'trendy' },
  { id: 'mullet', name: 'Mullet', group: 'trendy' },
  { id: 'curtainbangs', name: 'Curtain bangs', group: 'trendy' },
  { id: 'wolfcut', name: 'Wolf cut', group: 'trendy' },
  { id: 'crimped', name: 'Crimped', group: 'textured' },
  { id: 'coils', name: 'Coily bob', group: 'textured' },
  { id: 'hime', name: 'Hime cut', group: 'long' },
  { id: 'mermaid', name: 'Mermaid waves', group: 'long' },
  { id: 'halfup', name: 'Half-up bun', group: 'updo' },
  { id: 'chignon', name: 'Chignon', group: 'updo' },
  { id: 'lowpigtails', name: 'Low bunches', group: 'updo' },
  { id: 'crownbraid', name: 'Crown braid', group: 'updo' },
];

/* ───────── Clothes & accessories ───────── */

export const CLOTH_COLORS = [
  '#6b3fc4', '#ff6fa8', '#2b2f6b', '#3fc1b0', '#e0445a', '#f4c95d', '#f5f0ff', '#2b2230', '#7ec46a', '#ffb38a', '#8fb8ff', '#a4442a',
];

export interface Item {
  id: string;
  name: string;
  price: number;
  /** Free from the start. */
  starter?: boolean;
}

export const TOPS: Item[] = [
  { id: 'tee', name: 'T-shirt', price: 0, starter: true },
  { id: 'hoodie', name: 'Hoodie', price: 0, starter: true },
  { id: 'sweater', name: 'Sweater', price: 0, starter: true },
  { id: 'overalls', name: 'Overalls', price: 0, starter: true },
  { id: 'tank', name: 'Tank top', price: 0, starter: true },
  { id: 'shirt', name: 'Collared shirt', price: 60 },
  { id: 'turtleneck', name: 'Turtleneck', price: 80 },
  { id: 'jersey', name: 'Jersey', price: 90 },
  { id: 'labcoat', name: 'Lab coat', price: 120 },
  { id: 'varsity', name: 'Varsity jacket', price: 150 },
  { id: 'puffer', name: 'Puffer jacket', price: 200 },
  { id: 'dress', name: 'Sundress', price: 250 },
  { id: 'kimono', name: 'Kimono', price: 300 },
  { id: 'leather', name: 'Leather jacket', price: 350 },
  { id: 'suit', name: 'Suit & tie', price: 800 },
  { id: 'gown', name: 'Sparkly gown', price: 1500 },
  { id: 'spacesuit', name: 'Space suit', price: 5000 },
  { id: 'royal', name: 'Royal cape', price: 25000 },
  /* ── more to wear ── */
  { id: 'pajamas', name: 'Pyjamas', price: 40 },
  { id: 'croptop', name: 'Crop top', price: 45 },
  { id: 'apron', name: 'Apron', price: 45 },
  { id: 'swimsuit', name: 'Swimsuit', price: 55 },
  { id: 'cardigan', name: 'Cardigan', price: 70 },
  { id: 'tracksuit', name: 'Tracksuit', price: 95 },
  { id: 'scrubs', name: 'Scrubs', price: 100 },
  { id: 'raincoat', name: 'Raincoat', price: 115 },
  { id: 'denim', name: 'Denim jacket', price: 130 },
  { id: 'tutu', name: 'Tutu', price: 140 },
  { id: 'blazer', name: 'Blazer', price: 190 },
  { id: 'wintercoat', name: 'Winter coat', price: 280 },
  { id: 'uniform', name: 'Dress uniform', price: 900 },
  { id: 'tuxedo', name: 'Tuxedo', price: 1200 },
  { id: 'wedding', name: 'Wedding dress', price: 4000 },
  { id: 'ballgown', name: 'Ball gown', price: 6000 },
];

export const ACC_SLOTS: { id: AccSlot; name: string }[] = [
  { id: 'hat', name: 'Hats' },
  { id: 'glasses', name: 'Glasses' },
  { id: 'ears', name: 'Ears' },
  { id: 'neck', name: 'Neck' },
  { id: 'face', name: 'Face' },
];

export const ACCESSORIES: (Item & { slot: AccSlot })[] = [
  { id: 'bow', slot: 'hat', name: 'Bow', price: 0, starter: true },
  { id: 'beanie', slot: 'hat', name: 'Beanie', price: 25 },
  { id: 'cap', slot: 'hat', name: 'Cap', price: 30 },
  { id: 'catears', slot: 'hat', name: 'Cat ears', price: 40 },
  { id: 'bunnyears', slot: 'hat', name: 'Bunny ears', price: 40 },
  { id: 'beret', slot: 'hat', name: 'Beret', price: 50 },
  { id: 'flowercrown', slot: 'hat', name: 'Flower crown', price: 60 },
  { id: 'witch', slot: 'hat', name: 'Witch hat', price: 70 },
  { id: 'cowboy', slot: 'hat', name: 'Cowboy hat', price: 80 },
  { id: 'headphones', slot: 'hat', name: 'Headphones', price: 150 },
  { id: 'halo', slot: 'hat', name: 'Halo', price: 500 },
  { id: 'crown', slot: 'hat', name: 'Crown', price: 10000 },
  { id: 'round', slot: 'glasses', name: 'Round glasses', price: 0, starter: true },
  { id: 'nerd', slot: 'glasses', name: 'Square frames', price: 40 },
  { id: 'heartshades', slot: 'glasses', name: 'Heart shades', price: 45 },
  { id: 'starshades', slot: 'glasses', name: 'Star shades', price: 45 },
  { id: 'aviators', slot: 'glasses', name: 'Aviators', price: 120 },
  { id: 'monocle', slot: 'glasses', name: 'Monocle', price: 300 },
  { id: 'studs', slot: 'ears', name: 'Gold studs', price: 0, starter: true },
  { id: 'hoops', slot: 'ears', name: 'Hoops', price: 60 },
  { id: 'starrings', slot: 'ears', name: 'Star earrings', price: 80 },
  { id: 'pearls', slot: 'ears', name: 'Pearl earrings', price: 400 },
  { id: 'diamonds', slot: 'ears', name: 'Diamond earrings', price: 3000 },
  { id: 'bowtie', slot: 'neck', name: 'Bow tie', price: 35 },
  { id: 'choker', slot: 'neck', name: 'Choker', price: 30 },
  { id: 'scarf', slot: 'neck', name: 'Scarf', price: 45 },
  { id: 'pearlnecklace', slot: 'neck', name: 'Pearl necklace', price: 600 },
  { id: 'goldchain', slot: 'neck', name: 'Gold chain', price: 2000 },
  { id: 'freckles', slot: 'face', name: 'Freckles', price: 0, starter: true },
  { id: 'beautymark', slot: 'face', name: 'Beauty mark', price: 0, starter: true },
  { id: 'heartsticker', slot: 'face', name: 'Heart sticker', price: 10 },
  { id: 'starsticker', slot: 'face', name: 'Star sticker', price: 10 },
  { id: 'bandaid', slot: 'face', name: 'Band-aid', price: 5 },
  { id: 'facepaint', slot: 'face', name: 'Rainbow paint', price: 15 },
  /* ── more to try on ── */
  { id: 'bandana', slot: 'hat', name: 'Bandana', price: 25 },
  { id: 'earmuffs', slot: 'hat', name: 'Earmuffs', price: 45 },
  { id: 'sunhat', slot: 'hat', name: 'Sun hat', price: 55 },
  { id: 'headband', slot: 'hat', name: 'Ribbon headband', price: 30 },
  { id: 'veil', slot: 'hat', name: 'Wedding veil', price: 900 },
  { id: 'tiara', slot: 'hat', name: 'Tiara', price: 6000 },
  { id: 'shades', slot: 'glasses', name: 'Black shades', price: 60 },
  { id: 'mask', slot: 'glasses', name: 'Masquerade mask', price: 90 },
  { id: 'tie', slot: 'neck', name: 'Necktie', price: 40 },
  { id: 'locket', slot: 'neck', name: 'Locket', price: 250 },
  { id: 'medal', slot: 'neck', name: 'Royal medal', price: 1500 },
  { id: 'sash', slot: 'neck', name: 'Royal sash', price: 3000 },
  { id: 'glitter', slot: 'face', name: 'Glitter', price: 20 },
  { id: 'moustache', slot: 'face', name: 'Moustache', price: 25 },
];

export const itemPrice = (id: string) => [...TOPS, ...ACCESSORIES].find((i) => i.id === id)?.price ?? 0;
export const itemName = (id: string) => [...TOPS, ...ACCESSORIES].find((i) => i.id === id)?.name ?? id;
export const isStarter = (id: string) => !![...TOPS, ...ACCESSORIES].find((i) => i.id === id)?.starter;

/** Items in a look that the person doesn't own yet. */
export function unownedItems(look: Look, wardrobe: string[]) {
  const ids = [look.top ?? 'tee', ...Object.values(look.acc ?? {})].filter((x): x is string => !!x);
  return ids.filter((id) => !isStarter(id) && !wardrobe.includes(id));
}

export function randomLook(gender: Gender): Look {
  const styles: HairStyle[] = gender === 'male'
    ? ['short', 'sidepart', 'curtains', 'messy', 'undercut', 'quiff', 'fringe', 'fauxhawk', 'spiky', 'curly', 'afro', 'twists', 'cornrows', 'buzz', 'locs', 'surfer', 'manbun', 'slick']
    : ['long', 'wavy', 'bob', 'bangs', 'ponytail', 'pixie', 'curly', 'afro', 'braids', 'buns', 'topknot', 'pigtails', 'locs', 'twists', 'fringe'];
  return {
    skin: pick(SKIN_TONES),
    hair: pick(styles),
    hairColor: chance(0.9) ? pick(NATURAL_HAIR) : pick(HAIR_COLORS).id,
    eyes: pick(EYE_COLORS).id,
    lashes: gender === 'female' ? chance(0.8) : chance(0.1),
    top: pick(['tee', 'hoodie', 'sweater', 'overalls', 'tank']),
    topColor: pick(CLOTH_COLORS),
    acc: {},
  };
}

export const BAR_PALETTES = [
  { id: 'sunset', name: 'Sunset', css: 'linear-gradient(90deg, #ff6fa8, #ffb38a)' },
  { id: 'lagoon', name: 'Lagoon', css: 'linear-gradient(90deg, #5ee7df, #7b8cff)' },
  { id: 'orchid', name: 'Orchid', css: 'linear-gradient(90deg, #8f7bff, #d38cff)' },
  { id: 'rose', name: 'Rose', css: 'linear-gradient(90deg, #c2418f, #ff8ad1)' },
  { id: 'aurora', name: 'Aurora', css: 'linear-gradient(90deg, #7ef0c1, #5ee7df, #8f7bff)' },
  { id: 'ember', name: 'Ember', css: 'linear-gradient(90deg, #ff7a59, #ffd37a)' },
  { id: 'moon', name: 'Moonlight', css: 'linear-gradient(90deg, #a9a2d6, #ffffff)' },
  { id: 'nebula', name: 'Nebula', css: 'linear-gradient(90deg, #5b34b0, #c2418f, #ff6fa8)' },
];

export const BAR_STYLES = [
  { id: 'classic', name: 'Classic' },
  { id: 'slim', name: 'Slim' },
  { id: 'chunky', name: 'Chunky' },
  { id: 'glow', name: 'Glow' },
] as const;

export const DEFAULT_BARS: BarPrefs = {
  colors: { happiness: 'sunset', health: 'lagoon', smarts: 'orchid', looks: 'rose' },
  style: 'classic',
};

export const paletteCss = (id: string) => (BAR_PALETTES.find((p) => p.id === id) ?? BAR_PALETTES[0]).css;

export const STAT_META: { key: StatKey; label: string; emoji: string }[] = [
  { key: 'happiness', label: 'Happiness', emoji: '😊' },
  { key: 'health', label: 'Health', emoji: '❤️' },
  { key: 'smarts', label: 'Smarts', emoji: '🧠' },
  { key: 'looks', label: 'Looks', emoji: '✨' },
];
