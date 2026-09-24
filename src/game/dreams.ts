import type { Game, StatKey, TaskStatus } from './types';
import { CAREERS, degreeName, salaryAt, type Career } from './data';
import { adjust, hasEdu, log, syncCoworkers } from './helpers';
import { STAT_META } from './look';
import { money, rand } from './util';
import { clubOf, skillName } from './skills';

export type DreamTask =
  /** Keep a stat at or above `min` at the end of every year from `from` to `to`. */
  | { kind: 'stat'; stat: StatKey; min: number; from: number; to: number }
  /** Do something `n` times by the end of age `by`. */
  | { kind: 'count'; counter: string; n: number; by: number }
  /** Hold any of these degrees by the end of age `by`. */
  | { kind: 'degree'; any: string[]; by: number }
  | { kind: 'record'; by: number }
  | { kind: 'clean'; until: number }
  /** Reach a trained instrument/sport level, e.g. 'music:piano' 70 by age 18. */
  | { kind: 'skill'; key: string; min: number; by: number }
  /** Be a member of a school club by a certain age. */
  | { kind: 'club'; id: string; by: number };

export interface Dream {
  careerId: string;
  blurb: string;
  extraordinary?: boolean;
  /** Being born with a dream gives a head start on these stats (minimum starting value). */
  boost?: Partial<Record<StatKey, number>>;
  tasks: DreamTask[];
}

export const DREAMS: Dream[] = [
  {
    careerId: 'doctor', blurb: 'Save lives in a white coat.', boost: { smarts: 70 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 90, from: 6, to: 17 },
      { kind: 'count', counter: 'school:study', n: 6, by: 22 },
      { kind: 'degree', any: ['ba:bio', 'ba:nursing'], by: 23 },
      { kind: 'degree', any: ['med'], by: 28 },
    ],
  },
  {
    careerId: 'surgeon', blurb: 'Steady hands in the operating room.', boost: { smarts: 70, health: 60 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 85, from: 8, to: 17 },
      { kind: 'count', counter: 'school:study', n: 6, by: 22 },
      { kind: 'degree', any: ['ba:bio'], by: 23 },
      { kind: 'degree', any: ['med'], by: 28 },
      { kind: 'stat', stat: 'health', min: 70, from: 18, to: 28 },
    ],
  },
  {
    careerId: 'cardiologist', blurb: 'Keep hearts beating strong.', boost: { smarts: 70 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 85, from: 8, to: 17 },
      { kind: 'count', counter: 'act:gym', n: 5, by: 22 },
      { kind: 'degree', any: ['ba:bio', 'ba:nursing'], by: 23 },
      { kind: 'degree', any: ['med'], by: 28 },
    ],
  },
  {
    careerId: 'vet', blurb: 'Heal every puppy, kitten, and parrot.', boost: { smarts: 55 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 70, from: 10, to: 17 },
      { kind: 'count', counter: 'act:volunteer', n: 5, by: 20 },
      { kind: 'degree', any: ['ba:bio'], by: 23 },
      { kind: 'degree', any: ['vetschool'], by: 28 },
    ],
  },
  {
    careerId: 'pilot', blurb: 'Fly above the clouds at sunset.', boost: { health: 65 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 65, from: 12, to: 18 },
      { kind: 'stat', stat: 'health', min: 70, from: 14, to: 20 },
      { kind: 'degree', any: ['hs'], by: 19 },
    ],
  },
  {
    careerId: 'chef', blurb: 'Cook your way to a celebrity kitchen.',
    tasks: [
      { kind: 'count', counter: 'act:cooking', n: 6, by: 20 },
      { kind: 'stat', stat: 'happiness', min: 55, from: 12, to: 20 },
    ],
  },
  {
    careerId: 'lawyer', blurb: 'Win cases and argue for justice.', boost: { smarts: 60 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 80, from: 8, to: 17 },
      { kind: 'count', counter: 'act:library', n: 6, by: 18 },
      { kind: 'degree', any: ['ba'], by: 23 },
      { kind: 'degree', any: ['law'], by: 27 },
    ],
  },
  {
    careerId: 'dev', blurb: 'Build apps the whole world uses.', boost: { smarts: 55 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 75, from: 10, to: 17 },
      { kind: 'count', counter: 'act:library', n: 5, by: 16 },
      { kind: 'degree', any: ['ba:cs'], by: 23 },
    ],
  },
  {
    careerId: 'engineer', blurb: 'Design bridges and skylines.', boost: { smarts: 55 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 75, from: 10, to: 17 },
      { kind: 'count', counter: 'school:study', n: 4, by: 22 },
      { kind: 'degree', any: ['ba:eng'], by: 23 },
    ],
  },
  {
    careerId: 'scientist', blurb: 'Discover something no one has seen before.', boost: { smarts: 60 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 80, from: 8, to: 18 },
      { kind: 'count', counter: 'act:library', n: 8, by: 20 },
      { kind: 'degree', any: ['ba:bio'], by: 23 },
    ],
  },
  {
    careerId: 'nurse', blurb: 'Care for people when they need it most.',
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 60, from: 10, to: 17 },
      { kind: 'count', counter: 'act:volunteer', n: 4, by: 20 },
      { kind: 'degree', any: ['ba:nursing'], by: 23 },
    ],
  },
  {
    careerId: 'teacher', blurb: 'Inspire the next generation.',
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 60, from: 8, to: 17 },
      { kind: 'stat', stat: 'happiness', min: 50, from: 12, to: 20 },
      { kind: 'count', counter: 'act:volunteer', n: 3, by: 20 },
      { kind: 'degree', any: ['ba:edu'], by: 23 },
    ],
  },
  {
    careerId: 'exec', blurb: 'Run a company from the corner office.', boost: { smarts: 55 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 70, from: 10, to: 17 },
      { kind: 'degree', any: ['ba:biz'], by: 23 },
      { kind: 'count', counter: 'job:harder', n: 3, by: 28 },
      { kind: 'degree', any: ['mba'], by: 28 },
    ],
  },
  {
    careerId: 'accountant', blurb: 'Make the numbers sing.',
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 65, from: 10, to: 17 },
      { kind: 'count', counter: 'school:study', n: 4, by: 22 },
      { kind: 'degree', any: ['ba:biz'], by: 23 },
    ],
  },
  {
    careerId: 'designer', blurb: 'Turn ideas into beautiful things.',
    tasks: [
      { kind: 'stat', stat: 'happiness', min: 50, from: 10, to: 18 },
      { kind: 'count', counter: 'act:library', n: 4, by: 18 },
      { kind: 'degree', any: ['ba:art'], by: 23 },
    ],
  },
  {
    careerId: 'journalist', blurb: 'Chase the story and tell the truth.',
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 55, from: 10, to: 17 },
      { kind: 'count', counter: 'act:library', n: 6, by: 20 },
      { kind: 'degree', any: ['ba:jour'], by: 23 },
    ],
  },
  {
    careerId: 'police', blurb: 'Protect and serve your city.', boost: { health: 70 },
    tasks: [
      { kind: 'stat', stat: 'health', min: 65, from: 12, to: 20 },
      { kind: 'count', counter: 'act:gym', n: 5, by: 21 },
      { kind: 'degree', any: ['hs'], by: 19 },
      { kind: 'clean', until: 21 },
    ],
  },
  {
    careerId: 'firefighter', blurb: 'Run toward the fire, not away.', boost: { health: 70 },
    tasks: [
      { kind: 'stat', stat: 'health', min: 75, from: 12, to: 20 },
      { kind: 'count', counter: 'act:gym', n: 6, by: 20 },
      { kind: 'count', counter: 'act:volunteer', n: 2, by: 20 },
      { kind: 'degree', any: ['hs'], by: 19 },
    ],
  },
  {
    careerId: 'model', blurb: 'Own the runway.', boost: { looks: 75 },
    tasks: [
      { kind: 'stat', stat: 'looks', min: 80, from: 14, to: 20 },
      { kind: 'count', counter: 'act:salon', n: 4, by: 18 },
      { kind: 'count', counter: 'act:gym', n: 3, by: 18 },
    ],
  },
  {
    careerId: 'musician', blurb: 'Play your heart out on stage.',
    tasks: [
      { kind: 'count', counter: 'act:music', n: 6, by: 18 },
      { kind: 'stat', stat: 'happiness', min: 55, from: 12, to: 18 },
    ],
  },

  /* ───── Talent dreams ───── */
  { careerId: 'pianist', blurb: 'Play Carnegie Hall one day.', boost: { smarts: 55 }, tasks: [
    { kind: 'skill', key: 'music:piano', min: 70, by: 18 }, { kind: 'club', id: 'band', by: 17 }, { kind: 'stat', stat: 'happiness', min: 50, from: 10, to: 18 } ] },
  { careerId: 'guitarist', blurb: 'Shred solos in front of stadiums.', tasks: [
    { kind: 'skill', key: 'music:guitar', min: 65, by: 18 }, { kind: 'count', counter: 'act:music', n: 6, by: 18 }, { kind: 'stat', stat: 'happiness', min: 50, from: 12, to: 18 } ] },
  { careerId: 'singer', blurb: 'Your voice on every playlist.', boost: { looks: 55 }, tasks: [
    { kind: 'skill', key: 'music:voice', min: 65, by: 18 }, { kind: 'club', id: 'drama', by: 17 }, { kind: 'stat', stat: 'looks', min: 55, from: 14, to: 18 } ] },
  { careerId: 'violinist', blurb: 'First chair in the symphony.', boost: { smarts: 55 }, tasks: [
    { kind: 'skill', key: 'music:violin', min: 70, by: 18 }, { kind: 'club', id: 'band', by: 17 }, { kind: 'stat', stat: 'smarts', min: 60, from: 10, to: 17 } ] },
  { careerId: 'drummer', blurb: 'Keep the whole band in time.', tasks: [
    { kind: 'skill', key: 'music:drums', min: 65, by: 18 }, { kind: 'stat', stat: 'health', min: 55, from: 12, to: 18 } ] },
  { careerId: 'dj', blurb: 'Headline festivals at sunset.', tasks: [
    { kind: 'skill', key: 'music:dj', min: 60, by: 20 }, { kind: 'count', counter: 'act:club', n: 3, by: 22 }, { kind: 'stat', stat: 'happiness', min: 55, from: 16, to: 22 } ] },
  { careerId: 'basketball', blurb: 'Dunk your way to the pros.', boost: { health: 70 }, tasks: [
    { kind: 'skill', key: 'sport:basketball', min: 70, by: 18 }, { kind: 'club', id: 'sports', by: 16 }, { kind: 'stat', stat: 'health', min: 75, from: 10, to: 18 } ] },
  { careerId: 'soccer', blurb: 'Score in the World Cup final.', boost: { health: 70 }, tasks: [
    { kind: 'skill', key: 'sport:soccer', min: 70, by: 18 }, { kind: 'club', id: 'sports', by: 16 }, { kind: 'stat', stat: 'health', min: 75, from: 10, to: 18 } ] },
  { careerId: 'tennis', blurb: 'Lift a Grand Slam trophy.', boost: { health: 65 }, tasks: [
    { kind: 'skill', key: 'sport:tennis', min: 70, by: 17 }, { kind: 'stat', stat: 'health', min: 70, from: 10, to: 17 } ] },
  { careerId: 'swimmer', blurb: 'Olympic gold in the pool.', boost: { health: 75 }, tasks: [
    { kind: 'skill', key: 'sport:swimming', min: 70, by: 17 }, { kind: 'count', counter: 'act:gym', n: 4, by: 17 }, { kind: 'stat', stat: 'health', min: 75, from: 8, to: 17 } ] },
  { careerId: 'gymnast', blurb: 'Stick the perfect 10.', boost: { health: 75 }, tasks: [
    { kind: 'skill', key: 'sport:gymnastics', min: 75, by: 16 }, { kind: 'club', id: 'cheer', by: 15 }, { kind: 'stat', stat: 'health', min: 75, from: 8, to: 16 } ] },
  { careerId: 'boxer', blurb: 'Become the undisputed champ.', boost: { health: 75 }, tasks: [
    { kind: 'skill', key: 'sport:boxing', min: 70, by: 19 }, { kind: 'count', counter: 'act:gym', n: 6, by: 19 }, { kind: 'stat', stat: 'health', min: 80, from: 14, to: 19 } ] },
  { careerId: 'skater', blurb: 'Land the quad at the Olympics.', boost: { health: 70 }, tasks: [
    { kind: 'skill', key: 'sport:skating', min: 70, by: 16 }, { kind: 'club', id: 'dance', by: 15 }, { kind: 'stat', stat: 'health', min: 70, from: 8, to: 16 } ] },
  { careerId: 'sprinter', blurb: 'Fastest human alive.', boost: { health: 75 }, tasks: [
    { kind: 'skill', key: 'sport:track', min: 70, by: 18 }, { kind: 'stat', stat: 'health', min: 80, from: 12, to: 18 } ] },

  /* ───── More careers ───── */
  { careerId: 'pediatrician', blurb: 'Keep every kid healthy and smiling.', boost: { smarts: 65 }, tasks: [
    { kind: 'stat', stat: 'smarts', min: 80, from: 8, to: 17 }, { kind: 'count', counter: 'act:volunteer', n: 3, by: 20 }, { kind: 'degree', any: ['ba:bio', 'ba:nursing'], by: 23 }, { kind: 'degree', any: ['med'], by: 28 } ] },
  { careerId: 'neurosurgeon', blurb: 'The most delicate hands in medicine.', boost: { smarts: 75 }, tasks: [
    { kind: 'stat', stat: 'smarts', min: 92, from: 8, to: 17 }, { kind: 'club', id: 'science', by: 16 }, { kind: 'degree', any: ['ba:bio'], by: 23 }, { kind: 'degree', any: ['med'], by: 28 } ] },
  { careerId: 'dentist', blurb: 'Brighten smiles all day.', boost: { smarts: 55 }, tasks: [
    { kind: 'stat', stat: 'smarts', min: 70, from: 10, to: 17 }, { kind: 'degree', any: ['ba:bio'], by: 23 }, { kind: 'degree', any: ['dental'], by: 28 } ] },
  { careerId: 'pharmacist', blurb: 'Know every medicine by heart.', tasks: [
    { kind: 'stat', stat: 'smarts', min: 65, from: 10, to: 17 }, { kind: 'club', id: 'science', by: 17 }, { kind: 'degree', any: ['ba:bio'], by: 23 }, { kind: 'degree', any: ['pharmacy'], by: 27 } ] },
  { careerId: 'judge', blurb: 'The final word in the courtroom.', boost: { smarts: 60 }, tasks: [
    { kind: 'stat', stat: 'smarts', min: 75, from: 10, to: 17 }, { kind: 'club', id: 'debate', by: 17 }, { kind: 'degree', any: ['law'], by: 30 }, { kind: 'clean', until: 40 } ] },
  { careerId: 'architect', blurb: 'Design the skyline of tomorrow.', tasks: [
    { kind: 'stat', stat: 'smarts', min: 65, from: 10, to: 17 }, { kind: 'club', id: 'art', by: 17 }, { kind: 'degree', any: ['ba:arch'], by: 23 } ] },
  { careerId: 'gamedev', blurb: 'Make the game everyone’s playing.', tasks: [
    { kind: 'stat', stat: 'smarts', min: 65, from: 10, to: 17 }, { kind: 'club', id: 'coding', by: 17 }, { kind: 'degree', any: ['ba:cs'], by: 23 } ] },
  { careerId: 'photographer', blurb: 'Capture the perfect sunset.', tasks: [
    { kind: 'club', id: 'art', by: 17 }, { kind: 'stat', stat: 'happiness', min: 55, from: 12, to: 20 }, { kind: 'count', counter: 'act:volunteer', n: 2, by: 20 } ] },
  { careerId: 'fashiondesigner', blurb: 'Your label on every runway.', boost: { looks: 55 }, tasks: [
    { kind: 'club', id: 'art', by: 17 }, { kind: 'count', counter: 'act:salon', n: 3, by: 20 }, { kind: 'degree', any: ['ba:art'], by: 23 } ] },
  { careerId: 'zookeeper', blurb: 'Best friends with giraffes.', tasks: [
    { kind: 'count', counter: 'act:volunteer', n: 5, by: 19 }, { kind: 'stat', stat: 'health', min: 60, from: 12, to: 19 }, { kind: 'degree', any: ['hs'], by: 19 } ] },
  { careerId: 'flightattendant', blurb: 'See the whole world from 35,000 feet.', boost: { looks: 55 }, tasks: [
    { kind: 'stat', stat: 'looks', min: 55, from: 14, to: 19 }, { kind: 'stat', stat: 'happiness', min: 55, from: 14, to: 19 }, { kind: 'degree', any: ['hs'], by: 19 } ] },
  { careerId: 'stockbroker', blurb: 'Ring the bell on Wall Street.', boost: { smarts: 60 }, tasks: [
    { kind: 'stat', stat: 'smarts', min: 70, from: 10, to: 17 }, { kind: 'club', id: 'chess', by: 17 }, { kind: 'degree', any: ['ba:biz'], by: 23 } ] },
  { careerId: 'baker', blurb: 'The town’s favorite bakery.', tasks: [
    { kind: 'count', counter: 'act:cooking', n: 5, by: 19 }, { kind: 'stat', stat: 'happiness', min: 55, from: 12, to: 19 } ] },
  { careerId: 'hairstylist', blurb: 'Celebrity glow-ups on speed dial.', boost: { looks: 55 }, tasks: [
    { kind: 'count', counter: 'act:salon', n: 5, by: 19 }, { kind: 'stat', stat: 'looks', min: 55, from: 14, to: 19 } ] },
  { careerId: 'trainer', blurb: 'Get the stars in shape.', boost: { health: 70 }, tasks: [
    { kind: 'count', counter: 'act:gym', n: 7, by: 20 }, { kind: 'club', id: 'sports', by: 17 }, { kind: 'stat', stat: 'health', min: 75, from: 14, to: 20 } ] },
  { careerId: 'paramedic', blurb: 'First on the scene, every time.', boost: { health: 60 }, tasks: [
    { kind: 'stat', stat: 'health', min: 65, from: 14, to: 19 }, { kind: 'count', counter: 'act:volunteer', n: 3, by: 19 }, { kind: 'degree', any: ['hs'], by: 19 } ] },
  { careerId: 'mechanic', blurb: 'Nothing you can’t fix.', tasks: [
    { kind: 'club', id: 'science', by: 17 }, { kind: 'degree', any: ['hs'], by: 19 } ] },

  {
    careerId: 'actor', extraordinary: true, blurb: 'See your name on the big screen.', boost: { looks: 65 },
    tasks: [
      { kind: 'stat', stat: 'looks', min: 70, from: 14, to: 22 },
      { kind: 'count', counter: 'act:acting', n: 6, by: 20 },
      { kind: 'stat', stat: 'happiness', min: 50, from: 16, to: 22 },
    ],
  },
  {
    careerId: 'popstar', extraordinary: true, blurb: 'Sell out stadiums worldwide.', boost: { looks: 55 },
    tasks: [
      { kind: 'count', counter: 'act:music', n: 8, by: 18 },
      { kind: 'stat', stat: 'happiness', min: 60, from: 12, to: 20 },
      { kind: 'stat', stat: 'looks', min: 60, from: 15, to: 20 },
    ],
  },
  {
    careerId: 'athlete', extraordinary: true, blurb: 'Go pro and chase championships.', boost: { health: 80 },
    tasks: [
      { kind: 'stat', stat: 'health', min: 85, from: 8, to: 20 },
      { kind: 'count', counter: 'act:sports', n: 8, by: 18 },
      { kind: 'count', counter: 'act:gym', n: 5, by: 20 },
    ],
  },
  {
    careerId: 'influencer', extraordinary: true, blurb: 'Millions of followers, one post at a time.', boost: { looks: 60 },
    tasks: [
      { kind: 'stat', stat: 'looks', min: 65, from: 13, to: 20 },
      { kind: 'count', counter: 'act:salon', n: 5, by: 20 },
      { kind: 'count', counter: 'act:club', n: 3, by: 24 },
    ],
  },
  {
    careerId: 'astronaut', extraordinary: true, blurb: 'Walk among the stars — literally.', boost: { smarts: 70, health: 70 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 85, from: 10, to: 20 },
      { kind: 'degree', any: ['ba:eng', 'ba:cs', 'ba:bio'], by: 24 },
      { kind: 'stat', stat: 'health', min: 80, from: 18, to: 26 },
      { kind: 'count', counter: 'act:gym', n: 6, by: 26 },
    ],
  },
  {
    careerId: 'mafia', extraordinary: true, blurb: 'Rule the underworld. Trust no one.', boost: { health: 60 },
    tasks: [
      { kind: 'count', counter: 'act:shoplift', n: 5, by: 18 },
      { kind: 'record', by: 21 },
      { kind: 'stat', stat: 'health', min: 60, from: 16, to: 21 },
    ],
  },
  {
    careerId: 'president', extraordinary: true, blurb: 'Lead the whole nation.', boost: { smarts: 60 },
    tasks: [
      { kind: 'stat', stat: 'smarts', min: 80, from: 10, to: 22 },
      { kind: 'count', counter: 'act:volunteer', n: 8, by: 30 },
      { kind: 'degree', any: ['law', 'mba'], by: 32 },
      { kind: 'clean', until: 35 },
    ],
  },
];

export const dreamOf = (careerId: string) => DREAMS.find((d) => d.careerId === careerId);
export const careerOf = (careerId: string) => CAREERS.find((c) => c.id === careerId);

const COUNTER_LABELS: Record<string, string> = {
  'act:library': 'Visit the library',
  'act:gym': 'Go to the gym',
  'act:volunteer': 'Volunteer',
  'act:salon': 'Visit the salon',
  'act:club': 'Go to a nightclub',
  'act:acting': 'Take an acting class',
  'act:music': 'Take music lessons',
  'act:sports': 'Practice sports',
  'act:shoplift': 'Shoplift',
  'act:cooking': 'Take a cooking class',
  'school:study': 'Study harder in school',
  'job:harder': 'Work harder at a job',
};

export function taskLabel(t: DreamTask): string {
  switch (t.kind) {
    case 'stat': {
      const s = STAT_META.find((m) => m.key === t.stat)!;
      return `Ages ${t.from}–${t.to}: keep ${s.label} at ${t.min}%+`;
    }
    case 'count': return `${COUNTER_LABELS[t.counter] ?? t.counter} ${t.n}× by age ${t.by}`;
    case 'degree': {
      if (t.any.includes('hs')) return `Graduate high school by age ${t.by}`;
      if (t.any.includes('ba')) return `Earn any bachelor’s degree by age ${t.by}`;
      if (t.any.every((d) => d.startsWith('ba:'))) return `Earn a ${t.any.map((d) => degreeName(d).replace('Bachelor\'s in ', '')).join(' or ')} degree by age ${t.by}`;
      return `Graduate from ${t.any.map(degreeName).join(' or ')} by age ${t.by}`;
    }
    case 'record': return `Get a criminal record by age ${t.by}`;
    case 'clean': return `Stay out of trouble until age ${t.until}`;
    case 'skill': return `Reach ${skillName(t.key)} skill ${t.min} by age ${t.by}`;
    case 'club': return `Join the ${clubOf(t.id)?.name ?? t.id} by age ${t.by}`;
  }
}

export function taskProgress(g: Game, t: DreamTask): string | null {
  if (t.kind === 'stat') return `now ${g.stats[t.stat]}%`;
  if (t.kind === 'count') return `${Math.min(t.n, g.counters[t.counter] ?? 0)}/${t.n}`;
  if (t.kind === 'skill') return `${g.skills[t.key] ?? 0}/${t.min}`;
  return null;
}

/** Tasks whose deadline has already passed get judged on the current state. */
function judgePast(g: Game, t: DreamTask): TaskStatus {
  switch (t.kind) {
    case 'stat': return g.age > t.to ? (g.stats[t.stat] >= t.min ? 'done' : 'failed') : 'pending';
    case 'count': return (g.counters[t.counter] ?? 0) >= t.n ? 'done' : g.age > t.by ? 'failed' : 'pending';
    case 'degree': return hasEdu(g, t.any) ? 'done' : g.age > t.by ? 'failed' : 'pending';
    case 'record': return g.criminalRecord > 0 ? 'done' : g.age > t.by ? 'failed' : 'pending';
    case 'clean': return g.criminalRecord > 0 ? 'failed' : g.age > t.until ? 'done' : 'pending';
    case 'skill': return (g.skills[t.key] ?? 0) >= t.min ? 'done' : g.age > t.by ? 'failed' : 'pending';
    case 'club': return inClub(g, t.id) ? 'done' : g.age > t.by ? 'failed' : 'pending';
  }
}

const inClub = (g: Game, id: string) => g.clubs.some((m) => m.id === id) || g.flags.includes(`club:${id}`);

export function chooseDream(g: Game, careerId: string | null, opts: { boost?: boolean } = {}) {
  const def = careerId ? dreamOf(careerId) : undefined;
  if (!def) {
    if (g.dream) log(g, 'I’m not sure what I want to be anymore. That’s okay.');
    g.dream = null;
    return;
  }
  const status = def.tasks.map((t) => judgePast(g, t));
  g.dream = { careerId: def.careerId, status, complete: false, failed: status.includes('failed'), offered: false };
  if (opts.boost && def.boost) {
    for (const [k, min] of Object.entries(def.boost) as [StatKey, number][]) g.stats[k] = Math.max(g.stats[k], rand(min, 100));
  }
  log(g, `🌠 I dream of becoming a ${careerOf(def.careerId)?.title}.`);
  evaluateDream(g, false);
}

/**
 * Update task progress. `yearEnd` is true right before the player ages up,
 * which is when "keep a stat above X" tasks are checked.
 */
export function evaluateDream(g: Game, yearEnd: boolean) {
  const d = g.dream;
  const def = d && dreamOf(d.careerId);
  if (!d || !def || d.complete) return;
  const title = careerOf(d.careerId)?.title;

  def.tasks.forEach((t, i) => {
    if (d.status[i] !== 'pending') return;
    let next: TaskStatus = 'pending';
    switch (t.kind) {
      case 'stat':
        if (!yearEnd || g.age < t.from) break;
        if (g.stats[t.stat] < t.min) next = 'failed';
        else if (g.age >= t.to) next = 'done';
        break;
      case 'count':
        if ((g.counters[t.counter] ?? 0) >= t.n) next = 'done';
        else if (yearEnd && g.age >= t.by) next = 'failed';
        break;
      case 'degree':
        if (hasEdu(g, t.any)) next = 'done';
        else if (yearEnd && g.age >= t.by) next = 'failed';
        break;
      case 'record':
        if (g.criminalRecord > 0) next = 'done';
        else if (yearEnd && g.age >= t.by) next = 'failed';
        break;
      case 'clean':
        if (g.criminalRecord > 0) next = 'failed';
        else if (yearEnd && g.age >= t.until) next = 'done';
        break;
      case 'skill':
        if ((g.skills[t.key] ?? 0) >= t.min) next = 'done';
        else if (yearEnd && g.age >= t.by) next = 'failed';
        break;
      case 'club':
        if (inClub(g, t.id)) next = 'done';
        else if (yearEnd && g.age >= t.by) next = 'failed';
        break;
    }
    if (next === 'pending') return;
    d.status[i] = next;
    if (next === 'failed' && !d.failed) {
      d.failed = true;
      log(g, `💔 I missed a step toward becoming a ${title}: ${taskLabel(t).toLowerCase()}. It’s no longer guaranteed.`);
    } else if (next === 'done') {
      log(g, `⭐ Dream step complete: ${taskLabel(t)}.`);
    }
  });

  if (!d.failed && d.status.every((s) => s === 'done')) {
    d.complete = true;
    adjust(g, 'happiness', 10);
    log(g, `🌟 I finished every step toward becoming a ${title}. My dream job is guaranteed!`);
  }
}

export const dreamGuaranteed = (g: Game, careerId: string) => !!g.dream?.complete && g.dream.careerId === careerId;

/** While a dream is on track, schools required for it always accept you. */
export function dreamOpensProgram(g: Game, degreeId: string) {
  const d = g.dream;
  const def = d && dreamOf(d.careerId);
  if (!d || !def || d.failed) return false;
  return def.tasks.some((t) => t.kind === 'degree' && t.any.some((a) => a === degreeId || (a === 'ba' && degreeId.startsWith('ba:'))));
}

export function meetsBasics(g: Game, c: Career) {
  return g.age >= c.minAge && g.prison === 0 && g.education.stage === 'none' && hasEdu(g, c.edu);
}

export function hire(g: Game, c: Career, level = 0) {
  g.job = { careerId: c.id, title: c.levels[level], salary: salaryAt(c, level), years: 0, performance: 55, level, partTime: !!c.partTime };
  g.retired = false;
  syncCoworkers(g);
}

/** Once a dream is complete and the basics are met, the job offer arrives on its own. */
export function maybeOfferDream(g: Game) {
  const d = g.dream;
  if (!d?.complete || d.offered) return;
  const c = careerOf(d.careerId);
  if (!c || g.job?.careerId === c.id || !meetsBasics(g, c)) return;
  d.offered = true;
  g.pending.unshift({
    id: 'dream-offer', emoji: c.emoji, title: 'Your dream is calling!',
    text: `You’ve been offered a job as a ${c.levels[0]} (${c.title}) starting at ${money(salaryAt(c, 0))} a year.`,
    choices: ['Accept the offer', 'Not right now'], ctx: { careerId: c.id },
  });
}
