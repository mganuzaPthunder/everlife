import type { Game } from './types';
import { fullName } from './helpers';
import { money, pick, rand } from './util';
import { fameOf } from './social';

/* ───────── The morning paper ───────── */

const PAPERS = ['The Midnight Herald', 'The Daily Sunset', 'The Evening Star', 'The City Chronicle', 'The Twilight Times'];

const FIRST = ['Mara', 'Dev', 'Ines', 'Bruno', 'Lila', 'Osman', 'Yuki', 'Nadia', 'Tomas', 'Priya', 'Gus', 'Elif', 'Rocco', 'Saoirse', 'Kwame'];
const LAST = ['Vega', 'Okafor', 'Lindqvist', 'Moreau', 'Batista', 'Kovac', 'Reyes', 'Haddad', 'Nakamura', 'Blair', 'Oyelaran', 'Farkas'];
const name = () => `${pick(FIRST)} ${pick(LAST)}`;

/** Headlines anyone might read over breakfast. */
const WORLD: ((g: Game) => string)[] = [
  (g) => `🏦 Masked thieves take ${money(rand(20, 900) * 1000)} from a bank in ${g.city}.`,
  () => `🐋 A whale is spotted swimming up a city river. Nobody can explain it.`,
  (g) => `🚧 The ${g.city} bridge closes for repairs. Everyone is late for everything.`,
  () => `🥐 A bakery runs out of croissants by 7am for the ninth day running.`,
  () => `🎰 One lottery ticket wins ${money(rand(2, 90) * 1_000_000)}. The winner has not come forward.`,
  () => `🌋 A volcano no one had heard of wakes up. Flights are a mess.`,
  () => `🐈 A cat called ${pick(['Biscuit', 'Noodle', 'Admiral', 'Pudding', 'Tofu'])} is elected honorary mayor of a small town.`,
  () => `📉 Stocks fall ${rand(2, 9)}% after a chief executive posts something unwise.`,
  () => `📈 Stocks jump ${rand(2, 11)}% for reasons nobody can properly explain.`,
  () => `🤖 A robot is hired as a waiter and immediately drops ${rand(3, 40)} plates.`,
  () => `⚽ ${name()} scores from the halfway line and the stadium loses its mind.`,
  (g) => `🌧️ ${rand(2, 9)} days of rain forecast for ${g.city}. Bring a coat.`,
  () => `🎬 A film about ${pick(['a talking fridge', 'rival ice skaters', 'a haunted supermarket', 'a dog detective'])} breaks box-office records.`,
  () => `🚀 A rocket launches carrying ${rand(3, 60)} satellites and one very lucky houseplant.`,
  () => `🍕 A pizza place opens at 3am and the queue goes around the block.`,
  () => `🎨 A painting sells for ${money(rand(1, 40) * 1_000_000)}. Critics call it "fine".`,
  () => `🐊 An alligator is found in a swimming pool. It is described as "polite".`,
  () => `💍 Pop star ${name()} announces an engagement to someone they met last week.`,
  () => `🏛️ Politicians argue for ${rand(4, 19)} hours and decide nothing at all.`,
  () => `🔬 Scientists say chocolate is good for you again. The study cost ${money(rand(100, 900) * 1000)}.`,
  () => `🎡 The funfair returns to town with a ferris wheel and suspiciously cheap hot dogs.`,
  () => `🚓 Police chase a runaway shopping trolley for ${rand(2, 14)} blocks.`,
  () => `🦆 Ducks halt traffic on the main road for ${rand(10, 50)} minutes. Nobody honks.`,
  () => `💸 A new tax is announced. It is immediately unpopular.`,
  () => `🏆 ${name()} wins a hot-dog eating contest with ${rand(30, 74)} hot dogs.`,
  () => `🛰️ Something odd is seen in the sky. Officials say it was "probably a balloon".`,
];

/** Headlines that are about the player's own life. */
const PERSONAL: { when: (g: Game) => boolean; line: (g: Game) => string }[] = [
  { when: (g) => fameOf(g) >= 55, line: (g) => `⭐ ${fullName(g)} spotted in ${g.city} — fans blocked the whole street.` },
  { when: (g) => fameOf(g) >= 30 && fameOf(g) < 55, line: (g) => `📸 Who is ${fullName(g)}? The name everyone started saying this year.` },
  { when: (g) => !!g.job?.royal, line: (g) => `👑 ${g.job?.title} ${g.firstName} opens a new hospital wing to gentle applause.` },
  { when: (g) => g.prison > 0, line: (g) => `⛓️ ${fullName(g)} remains behind bars. ${g.prison} year${g.prison === 1 ? '' : 's'} to go.` },
  { when: (g) => g.criminalRecord > 0 && g.prison === 0, line: (g) => `🚔 Police still have questions for ${fullName(g)}.` },
  { when: (g) => g.money >= 5_000_000, line: (g) => `💰 Rich list: ${fullName(g)} enters at number ${rand(12, 90)}.` },
  { when: (g) => !!g.job && g.job.performance >= 85, line: (g) => `🏅 ${g.job?.title} of the year goes to ${fullName(g)}.` },
  { when: (g) => g.age >= 100, line: (g) => `🎂 ${fullName(g)} turns ${g.age}. The mayor sends a cake.` },
  { when: (g) => g.assets.some((a) => a.kind === 'house' && a.value >= 2_000_000), line: (g) => `🏰 House prices soar in ${g.city}. One owner is very pleased.` },
  { when: (g) => g.socials.some((a) => a.followers >= 100_000), line: (g) => `📱 A post by @${g.socials[0]?.handle} is being shared everywhere.` },
];

export const paperName = (g: Game) => PAPERS[(g.id.charCodeAt(0) + g.birthDay) % PAPERS.length];

/** Three headlines for this year's front page. */
export function makePaper(g: Game): string[] {
  const lines: string[] = [];
  const personal = PERSONAL.filter((p) => p.when(g));
  if (personal.length && Math.random() < 0.55) lines.push(pick(personal).line(g));
  const pool = [...WORLD].sort(() => Math.random() - 0.5);
  for (const make of pool) {
    if (lines.length >= 3) break;
    const line = make(g);
    if (!lines.includes(line)) lines.push(line);
  }
  return lines;
}

/** Print this year's paper and keep the last few issues around. */
export function pressNews(g: Game) {
  g.papers.push({ age: g.age, lines: makePaper(g) });
  if (g.papers.length > 6) g.papers.shift();
}

export const paperFor = (g: Game, age: number) => g.papers.find((p) => p.age === age);
