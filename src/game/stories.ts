import type { Game, Person, StoryState } from './types';
import { adjust, bond, living, log, makePerson, randomFirst } from './helpers';
import { chance, pick, rand } from './util';

/* ───────── Storylines that play out over many years ─────────
   A story picks someone (or something) at one age and keeps coming back:
   you meet your best friend at 11, fall out at 14, graduate together at 18. */

interface Beat {
  /** The earliest age this beat can happen. */
  age: number | ((g: Game, st: StoryState) => number);
  /** Extra condition on top of the age. */
  when?: (g: Game, st: StoryState) => boolean;
  run: (g: Game, st: StoryState) => void;
}

export interface Story {
  id: string;
  emoji: string;
  title: string;
  /** When this story is allowed to begin. */
  start: (g: Game) => boolean;
  /** Called once, when the story begins. */
  begin: (g: Game, st: StoryState) => void;
  beats: Beat[];
}

const person = (g: Game, st: StoryState) => g.relationships.find((p) => p.id === st.personId);
const inSchool = (g: Game) => g.education.stage !== 'none';
const has = (st: StoryState, flag: string) => !!st.flags?.includes(flag);
const flag = (st: StoryState, name: string) => { (st.flags ??= []).push(name); };
const startedAt = (st: StoryState, years: number) => st.startedAge + years;

function addFriend(g: Game, age: number, closeness: number): Person {
  const p = makePerson('friend', pick(['male', 'female'] as const), age, undefined, closeness);
  g.relationships.push(p);
  return p;
}

export const STORIES: Story[] = [
  /* ───── The best friend you grow up with ───── */
  {
    id: 'bestfriend', emoji: '🤝', title: 'A best friend',
    start: (g) => g.age >= 8 && g.age <= 12 && inSchool(g),
    begin: (g, st) => {
      const p = addFriend(g, g.age + rand(-1, 1), rand(70, 90));
      st.personId = p.id;
      log(g, `🤝 I met ${p.firstName} at school. We were best friends by the end of the week.`);
      adjust(g, 'happiness', 6);
    },
    beats: [
      {
        age: (_g, st) => startedAt(st, 2),
        run: (g, st) => {
          const p = person(g, st);
          if (!p) return;
          log(g, `🏕️ ${p.firstName} and I built a den behind the school and swore to keep it secret forever.`);
          bond(p, 6);
          adjust(g, 'happiness', 5);
        },
      },
      {
        age: (_g, st) => startedAt(st, 4),
        run: (g, st) => {
          const p = person(g, st);
          if (!p) return;
          if (chance(0.55)) {
            flag(st, 'fight');
            log(g, `💔 ${p.firstName} and I fell out over something stupid. We haven't spoken in months.`);
            bond(p, -25);
            adjust(g, 'happiness', -8);
          } else {
            log(g, `😂 ${p.firstName} and I got detention together and laughed the whole way through it.`);
            bond(p, 5);
          }
        },
      },
      {
        age: (_g, st) => startedAt(st, 5),
        run: (g, st) => {
          const p = person(g, st);
          if (!p) return;
          if (has(st, 'fight')) {
            if (p.closeness > 40 || chance(0.6)) {
              log(g, `🫂 ${p.firstName} turned up at my door and apologised. We're okay again.`);
              bond(p, 20);
              adjust(g, 'happiness', 8);
            } else {
              flag(st, 'lost');
              log(g, `🚪 ${p.firstName} and I never really fixed things. We just stopped trying.`);
              adjust(g, 'happiness', -5);
            }
          } else {
            log(g, `🎸 ${p.firstName} and I spent the whole summer doing nothing, and it was perfect.`);
            adjust(g, 'happiness', 6);
          }
        },
      },
      {
        age: 18,
        when: (g, st) => !has(st, 'lost') && !!person(g, st),
        run: (g, st) => {
          const p = person(g, st)!;
          log(g, `🎓 ${p.firstName} and I graduated together. We threw our caps at exactly the same second.`);
          bond(p, 8);
          adjust(g, 'happiness', 10);
        },
      },
      {
        age: (_g, st) => Math.max(26, startedAt(st, 14)),
        when: (g, st) => !has(st, 'lost') && !!person(g, st),
        run: (g, st) => {
          const p = person(g, st)!;
          if (chance(0.5)) {
            flag(st, 'moved');
            log(g, `✈️ ${p.firstName} moved to the other side of the world. We promised to call every week.`);
            bond(p, -6);
            adjust(g, 'happiness', -6);
          } else {
            log(g, `🍻 ${p.firstName} and I still meet every month. Same jokes, older faces.`);
            bond(p, 6);
            adjust(g, 'happiness', 6);
          }
        },
      },
      {
        age: (_g, st) => Math.max(40, startedAt(st, 28)),
        when: (g, st) => !!person(g, st),
        run: (g, st) => {
          const p = person(g, st)!;
          log(g, `🕰️ ${p.firstName} and I have been friends for ${g.age - st.startedAge} years now. Not many people get that.`);
          bond(p, 10);
          adjust(g, 'happiness', 8);
        },
      },
    ],
  },

  /* ───── The rival who pushes you ───── */
  {
    id: 'rival', emoji: '⚔️', title: 'A rival',
    start: (g) => g.age >= 9 && g.age <= 14 && inSchool(g),
    begin: (g, st) => {
      const p = makePerson('friend', pick(['male', 'female'] as const), g.age, undefined, rand(15, 35));
      p.firstName = randomFirst(p.gender);
      g.relationships.push(p);
      st.personId = p.id;
      log(g, `⚔️ ${p.firstName} beat me by one mark in every single test this year. I've decided this is war.`);
      adjust(g, 'smarts', 2);
    },
    beats: [
      {
        age: (_g, st) => startedAt(st, 2),
        run: (g, st) => {
          const p = person(g, st);
          if (!p) return;
          const won = g.stats.smarts >= 60 || chance(0.4);
          log(g, won
            ? `🏆 I finally beat ${p.firstName} in the school competition. They shook my hand very stiffly.`
            : `😤 ${p.firstName} won the school competition again. I stayed up all night studying anyway.`);
          adjust(g, 'smarts', won ? 4 : 2);
          adjust(g, 'happiness', won ? 8 : -3);
          if (won) flag(st, 'won');
        },
      },
      {
        age: (_g, st) => startedAt(st, 5),
        run: (g, st) => {
          const p = person(g, st);
          if (!p) return;
          log(g, `🤝 ${p.firstName} admitted they'd been studying harder because of me. We're… friends now? Sort of.`);
          bond(p, 30);
          adjust(g, 'happiness', 6);
        },
      },
      {
        age: (_g, st) => Math.max(28, startedAt(st, 16)),
        when: (g, st) => !!person(g, st) && !!g.job,
        run: (g, st) => {
          const p = person(g, st)!;
          if (chance(0.5)) {
            log(g, `😳 ${p.firstName} turned up at my work — as my new boss. They said "small world" far too cheerfully.`);
            adjust(g, 'happiness', -5);
          } else {
            log(g, `📰 ${p.firstName} is in the paper again. I'd never admit it, but I'm a little proud of them.`);
            bond(p, 5);
          }
        },
      },
    ],
  },

  /* ───── First love ───── */
  {
    id: 'firstlove', emoji: '💘', title: 'First love',
    start: (g) => g.age >= 14 && g.age <= 17,
    begin: (g, st) => {
      const p = makePerson('friend', g.preference === 'men' ? 'male' : g.preference === 'women' ? 'female' : pick(['male', 'female'] as const), g.age, undefined, rand(45, 70));
      g.relationships.push(p);
      st.personId = p.id;
      log(g, `💘 I could not stop thinking about ${p.firstName} all year. I said roughly four words to them.`);
      adjust(g, 'happiness', 4);
    },
    beats: [
      {
        age: (_g, st) => startedAt(st, 1),
        run: (g, st) => {
          const p = person(g, st);
          if (!p) return;
          if (g.stats.looks + g.stats.happiness > 90 || chance(0.6)) {
            flag(st, 'together');
            p.relation = 'partner';
            bond(p, 20);
            log(g, `🌙 ${p.firstName} asked me out. We walked around until it got dark and neither of us wanted to go home.`);
            adjust(g, 'happiness', 14);
          } else {
            flag(st, 'rejected');
            log(g, `😔 I finally told ${p.firstName} how I felt. They were kind about it, which somehow made it worse.`);
            adjust(g, 'happiness', -10);
          }
        },
      },
      {
        age: (_g, st) => startedAt(st, 3),
        when: (g, st) => has(st, 'together') && !!person(g, st),
        run: (g, st) => {
          const p = person(g, st)!;
          if (chance(0.55)) {
            flag(st, 'ended');
            if (p.relation === 'partner') p.relation = 'friend';
            log(g, `💔 ${p.firstName} and I ended it before we went our separate ways. It was the sensible thing and it hurt anyway.`);
            adjust(g, 'happiness', -12);
          } else {
            log(g, `💞 ${p.firstName} and I are still together, which everyone finds surprising except us.`);
            bond(p, 10);
            adjust(g, 'happiness', 10);
          }
        },
      },
      {
        age: (_g, st) => Math.max(30, startedAt(st, 14)),
        when: (g, st) => has(st, 'ended') && !!person(g, st),
        run: (g, st) => {
          const p = person(g, st)!;
          log(g, `📱 ${p.firstName} messaged me out of nowhere: "I still think about that summer." I stared at it for an hour.`);
          adjust(g, 'happiness', chance(0.5) ? 6 : -4);
        },
      },
    ],
  },

  /* ───── The teacher who believed in you ───── */
  {
    id: 'mentor', emoji: '🧑‍🏫', title: 'A mentor',
    start: (g) => g.age >= 10 && g.age <= 15 && inSchool(g),
    begin: (g, st) => {
      const p = makePerson('friend', pick(['male', 'female'] as const), g.age + rand(20, 35), undefined, rand(45, 65));
      g.relationships.push(p);
      st.personId = p.id;
      log(g, `🧑‍🏫 Mr${p.gender === 'female' ? 's' : ''} ${p.lastName}, my teacher, kept me after class to say I could be really good at this.`);
      adjust(g, 'smarts', 3);
    },
    beats: [
      {
        age: (_g, st) => startedAt(st, 2),
        run: (g, st) => {
          const p = person(g, st);
          if (!p) return;
          log(g, `📚 ${p.lastName} has been giving me extra lessons at lunchtime for a whole year.`);
          adjust(g, 'smarts', 6);
          bond(p, 8);
        },
      },
      {
        age: 18,
        when: (g, st) => !!person(g, st),
        run: (g, st) => {
          const p = person(g, st)!;
          log(g, `✉️ ${p.lastName} wrote me a reference letter. I read it twice and had to sit down.`);
          adjust(g, 'smarts', 4);
          adjust(g, 'happiness', 8);
        },
      },
      {
        age: (_g, st) => Math.max(35, startedAt(st, 22)),
        when: (g, st) => !!person(g, st),
        run: (g, st) => {
          const p = person(g, st)!;
          log(g, `🕯️ I heard ${p.lastName} passed away. Half the town came. Everyone had the same story about them.`);
          p.alive = false;
          adjust(g, 'happiness', -10);
        },
      },
    ],
  },

  /* ───── The family secret ───── */
  {
    id: 'secret', emoji: '🔎', title: 'A family secret',
    start: (g) => g.age >= 11 && g.age <= 15 && living(g, 'mother', 'father').length > 0,
    begin: (g, st) => {
      st.flags = [];
      log(g, `🔎 I heard my parents arguing about someone called "her". They stopped the second I walked in.`);
    },
    beats: [
      {
        age: (_g, st) => startedAt(st, 3),
        run: (g) => {
          log(g, `📦 I found a photo in the attic: my parent, much younger, holding a baby that isn't me.`);
          adjust(g, 'happiness', -4);
        },
      },
      {
        age: (_g, st) => startedAt(st, 6),
        run: (g, st) => {
          const sib = makePerson('sibling', pick(['male', 'female'] as const), g.age + rand(2, 9), g.lastName, rand(20, 45));
          g.relationships.push(sib);
          st.personId = sib.id;
          log(g, `👥 I have a half-sibling. ${sib.firstName} is ${sib.age}, has known about me for years, and wants to meet.`);
          adjust(g, 'happiness', -6);
        },
      },
      {
        age: (_g, st) => startedAt(st, 8),
        when: (g, st) => !!person(g, st),
        run: (g, st) => {
          const p = person(g, st)!;
          log(g, `☕ I finally met ${p.firstName}. We have the same laugh, which nobody warned me about.`);
          bond(p, 30);
          adjust(g, 'happiness', 10);
        },
      },
    ],
  },

  /* ───── The stray that adopted you ───── */
  {
    id: 'stray', emoji: '🐕', title: 'The stray',
    start: (g) => g.age >= 6 && g.age <= 30,
    begin: (g, st) => {
      const pet = pick(['a scruffy dog', 'a one-eared cat', 'a very loud parrot', 'a three-legged dog']);
      const petName = pick(['Biscuit', 'Shadow', 'Noodle', 'Pepper', 'Mango', 'Sock', 'Comet', 'Dumpling']);
      flag(st, petName);
      log(g, `🐾 ${petName}, ${pet}, followed me home and simply moved in. We're keeping ${petName}.`);
      adjust(g, 'happiness', 8);
    },
    beats: [
      {
        age: (_g, st) => startedAt(st, 3),
        run: (g, st) => {
          log(g, `🦴 ${st.flags?.[0]} chewed through something expensive and looked extremely pleased about it.`);
          adjust(g, 'happiness', 4);
        },
      },
      {
        age: (_g, st) => startedAt(st, 7),
        run: (g, st) => {
          log(g, `🌙 ${st.flags?.[0]} is going grey around the face and sleeps in the sunny spot all day.`);
          adjust(g, 'happiness', 3);
        },
      },
      {
        age: (_g, st) => startedAt(st, 11),
        run: (g, st) => {
          log(g, `🕯️ ${st.flags?.[0]} died peacefully. The house is far too quiet.`);
          adjust(g, 'happiness', -14);
          adjust(g, 'health', -2);
        },
      },
    ],
  },
];

export const storyOf = (id: string) => STORIES.find((s) => s.id === id);

const beatAge = (b: Beat, g: Game, st: StoryState) => (typeof b.age === 'function' ? b.age(g, st) : b.age);

/** Move every running story on by a year, and now and then start a new one. */
export function storyYear(g: Game) {
  for (const st of g.stories) {
    if (st.done) continue;
    const story = storyOf(st.id);
    if (!story) { st.done = true; continue; }
    const beat = story.beats[st.step];
    if (!beat) { st.done = true; continue; }
    if (g.age < beatAge(beat, g, st)) continue;
    if (beat.when && !beat.when(g, st)) {
      // The moment has passed — skip this beat rather than blocking the story forever.
      if (g.age > beatAge(beat, g, st) + 3) st.step++;
      continue;
    }
    beat.run(g, st);
    st.step++;
    if (st.step >= story.beats.length) st.done = true;
    return; // at most one story beat a year, so a life never feels crowded
  }

  // Room for a new storyline?
  const running = g.stories.filter((s) => !s.done).length;
  if (running >= 2 || g.prison > 0) return;
  const options = STORIES.filter((s) => !g.stories.some((st) => st.id === s.id) && s.start(g));
  if (!options.length || !chance(0.55)) return;
  const story = pick(options);
  const st: StoryState = { id: story.id, startedAge: g.age, step: 0 };
  g.stories.push(st);
  story.begin(g, st);
}

/** For the storyline list in the app. */
export const activeStories = (g: Game) => g.stories.filter((s) => !s.done);
