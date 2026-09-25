/* A short written life story for the tombstone: who they were, what they did, who they left behind. */

import type { Game, Person } from './types';
import { degreeName } from './data';
import { isCore, netWorth } from './helpers';
import { originOf } from './origins';
import { fameOf, fameTier, formatFollowers, totalFollowers } from './social';
import { INSTRUMENTS, SPORTS } from './skills';
import { businessType } from './business';
import { money } from './util';

const list = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);
const ordinal = (n: number) => `${n}${[, 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10] || 'th'}`;

/** Personality, read from where their stats ended up. */
function traits(g: Game) {
  const s = g.stats;
  const out: string[] = [];
  if (s.happiness >= 75) out.push('cheerful'); else if (s.happiness <= 30) out.push('often troubled');
  if (s.smarts >= 80) out.push('brilliant'); else if (s.smarts >= 60) out.push('sharp-minded'); else if (s.smarts <= 25) out.push('happiest away from books');
  if (s.looks >= 80) out.push('strikingly charming'); else if (s.looks >= 60) out.push('warm and likeable');
  if (s.health >= 80) out.push('full of energy');
  return out.length ? out : ['quietly steady'];
}

/** Their standout talent from lessons, if any. */
function talent(g: Game) {
  const best = Object.entries(g.skills).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] < 50) return null;
  const [kind, id] = best[0].split(':');
  const d = (kind === 'music' ? INSTRUMENTS : SPORTS).find((x) => x.id === id);
  if (!d) return null;
  const level = best[1] >= 85 ? 'a truly gifted' : 'a talented';
  return kind === 'music' ? (id === 'voice' ? `${level} singer` : `${level} ${d.name.toLowerCase()} player`) : `${level} ${d.name.toLowerCase()} athlete`;
}

/** The last job title the story mentions (hired or promoted), for people who left work before they died. */
function lastJobTitle(g: Game) {
  let title: string | null = null;
  for (const y of g.log) for (const e of y.entries) {
    const m = e.match(/I got hired as an? ([^.!]+?) earning/) ?? e.match(/promoted to ([^.!]+?)!/) ?? e.match(/I became an? ([^—.!]+?) —/);
    if (m) title = m[1].trim();
  }
  return title;
}

const logHas = (g: Game, re: RegExp) => g.log.some((y) => y.entries.some((e) => re.test(e)));
const firstAge = (g: Game, re: RegExp) => g.log.find((y) => y.entries.some((e) => re.test(e)))?.age;

export function biography(g: Game): string[] {
  const he = g.gender === 'male' ? 'He' : 'She';
  const his = g.gender === 'male' ? 'his' : 'her';
  const name = g.firstName;
  const people = g.relationships.filter(isCore);
  const paras: string[] = [];

  // Beginnings and personality
  const origin = originOf(g.origin);
  const gen = g.generation > 1 ? `, the ${ordinal(g.generation)} generation of the ${g.lastName} family,` : '';
  const t = traits(g);
  const gift = talent(g);
  paras.push(`${name}${gen} was born into ${origin.phrase} in ${g.city}, ${g.country}. ${he} grew up to be ${list(t)}${gift ? `, and ${gift}` : ''}.`);

  // School and work (each item is something they did; the sentence supplies "She"/"He")
  const work: string[] = [];
  const degrees = g.education.degrees.filter((d) => d !== 'hs' && d !== 'royal');
  if (degrees.length) work.push(`earned ${list(degrees.map((d) => `a ${degreeName(d).replace(/^Bachelor's in /, 'degree in ')}`))}`);
  else if (g.education.degrees.includes('royal')) work.push('was schooled at the Royal Academy');
  else if (g.education.degrees.includes('hs')) work.push('finished high school');
  if (logHas(g, /valedictorian/i)) work.push(`graduated top of ${his} class`);
  const lastTitle = lastJobTitle(g);
  if (g.job?.royal) work.push(`served the crown as ${g.job.title}`);
  else if (g.job) work.push(`worked as a ${g.job.title}${g.job.years >= 5 ? ` for ${g.job.years} years` : ''}`);
  else if (lastTitle) work.push(`${g.retired ? 'retired as' : 'worked as'} a ${lastTitle}`);
  else if (g.retired) work.push('retired after a long working life');
  if (g.business) work.push(`founded ${g.business.name}, a ${businessType(g.business.type).name.toLowerCase()} worth ${money(g.business.value)}`);
  if (g.dream) work.push(logHas(g, /dream.*came true/i) ? 'lived out a lifelong dream' : `never quite reached ${his} dream career`);
  if (work.length) paras.push(`${he} ${list(work)}.`);

  // Love and family
  const family: string[] = [];
  const spouse = people.find((p) => p.relation === 'spouse');
  const exes = g.relationships.filter((p) => p.ex && (p.relation === 'spouse')).length;
  const kids = people.filter((p) => p.relation === 'child');
  if (spouse) family.push(`${spouse.alive ? 'was married to' : 'was widowed by'} ${spouse.firstName}`);
  if (exes) family.push(`went through ${exes === 1 ? 'a divorce' : `${exes} divorces`}`);
  if (kids.length) family.push(`raised ${kids.length === 1 ? `one child, ${kids[0].firstName}` : `${kids.length} children: ${list(kids.map((k) => k.firstName))}`}`);
  const childrenInLaw = g.relationships.filter((p) => p.kin === 'in-law' && p.relation === 'child' && !p.ex).map((p) => p.firstName);
  if (childrenInLaw.length) family.push(`welcomed ${list(childrenInLaw)} into the family`);
  if (!family.length && g.age >= 30) family.push('walked through life mostly on ' + his + ' own terms');
  if (family.length) paras.push(`${name} ${list(family)}.`);

  // Fame, trouble, faith and the unusual
  const notable: string[] = [];
  const fame = fameTier(fameOf(g));
  const followers = totalFollowers(g);
  if (fame === 'Famous' || fame === 'Popular') notable.push(`was ${fame === 'Famous' ? 'famous' : 'well known'}${followers >= 1000 ? `, with ${formatFollowers(followers)} followers` : ''}`);
  if (g.flags.includes('royalByMarriage') && g.origin !== 'royalty') notable.push('married into the royal family');
  if (g.flags.includes('convictedMurder')) notable.push('was convicted of murder');
  else if (g.criminalRecord > 0) notable.push(firstAge(g, /sentenced/i) ? `spent time in prison` : 'had a few run-ins with the law');
  if (g.counters.murders && !g.flags.includes('convictedMurder')) notable.push('took a dark secret to the grave');
  if (g.counters.pray) notable.push(`prayed for ${g.counters.pray === 1 ? 'a blessing' : `${g.counters.pray} blessings`}`);
  if (logHas(g, /won \$|jackpot|lottery/i)) notable.push('once struck it lucky');
  if (notable.length) paras.push(`${he} ${list(notable)}.`);

  // The end, and what was left behind
  const worth = netWorth(g);
  const heirs = (g.will ?? []).map((id) => (id === 'charity' ? 'charity' : g.relationships.find((p: Person) => p.id === id)?.firstName)).filter(Boolean) as string[];
  const legacy = g.age < 18 ? '' : `, leaving ${worth > 0 ? money(worth) : 'little behind'}${heirs.length ? ` to ${list(heirs)}` : ''}`;
  paras.push(`${name} died at ${g.age} from ${g.causeOfDeath ?? 'unknown causes'}${legacy}.`);
  return paras;
}
