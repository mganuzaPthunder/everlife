import type { Ctx, Game, PendingEvent, Result } from './types';
import {
  adjust, bond, datingAge, datingGender, die, fullName, isSingle, living, log, makePerson, randomFirst,
} from './helpers';
import { PLACES } from './names';
import { careerOf, hire } from './dreams';
import { chance, clamp, money, pick, rand, uid, weightedPick } from './util';

const r = (emoji: string, title: string, text: string): Result => ({ emoji, title, text });
const byId = (g: Game, id: string | number) => g.relationships.find((p) => p.id === id);

interface EventBase {
  id: string;
  minAge: number;
  maxAge: number;
  weight?: number;
  once?: boolean;
  /** 'ok' = can happen in prison too, 'only' = only in prison. */
  prison?: 'ok' | 'only';
  when?: (g: Game) => boolean;
}

interface ChoiceEvent extends EventBase {
  make: (g: Game) => Omit<PendingEvent, 'id'> | null;
  resolve: (g: Game, choice: number, ctx: Ctx) => Result;
}

interface PassiveEvent extends EventBase {
  run: (g: Game) => void;
}

const CHOICE_EVENTS: ChoiceEvent[] = [
  {
    id: 'broccoli', minAge: 2, maxAge: 6, once: true,
    when: (g) => living(g, 'mother').length > 0,
    make: () => ({
      emoji: '🥦', title: 'Dinner time',
      text: 'Your mom put a pile of broccoli on your plate and is watching you closely.',
      choices: ['Eat it', 'Throw it on the floor', 'Hide it in your napkin'], ctx: {},
    }),
    resolve: (g, c) => {
      const mom = living(g, 'mother')[0];
      if (c === 0) { adjust(g, 'health', 3); bond(mom, 4); return r('🥦', 'Clean plate', 'I ate all my broccoli. Mom was proud of me.'); }
      if (c === 1) { bond(mom, -8); adjust(g, 'happiness', 2); return r('😤', 'Food fight', 'I threw my broccoli on the floor. Mom was not amused.'); }
      if (chance(0.5)) { adjust(g, 'happiness', 4); return r('🤫', 'Sneaky', 'I hid my broccoli in my napkin. Nobody noticed!'); }
      bond(mom, -5);
      return r('🙈', 'Busted', 'I tried hiding my broccoli, but Mom caught me.');
    },
  },
  {
    id: 'bully', minAge: 6, maxAge: 17,
    when: (g) => g.education.stage !== 'none',
    make: () => {
      const name = randomFirst(pick(['male', 'female'] as const));
      return {
        emoji: '😠', title: 'School bully',
        text: `${name}, a kid at school, keeps pushing you around and stealing your lunch.`,
        choices: ['Fight back', 'Tell a teacher', 'Ignore them'], ctx: { name },
      };
    },
    resolve: (g, c, ctx) => {
      if (c === 0) {
        if (chance(0.35 + g.stats.health / 200)) { adjust(g, 'happiness', 8); return r('💪', 'Stood my ground', `I fought back and ${ctx.name} never bothered me again.`); }
        adjust(g, 'health', -rand(5, 12)); adjust(g, 'happiness', -6);
        return r('🤕', 'Lost the fight', `I fought ${ctx.name} and lost. I went home with a black eye.`);
      }
      if (c === 1) {
        if (chance(0.6)) { adjust(g, 'happiness', 4); return r('🍎', 'Handled', `I told a teacher and ${ctx.name} got detention.`); }
        adjust(g, 'happiness', -5);
        return r('😒', 'Snitch', `I told a teacher, but ${ctx.name} just started calling me a snitch.`);
      }
      adjust(g, 'happiness', -rand(2, 6));
      return r('😶', 'Ignored', `I ignored ${ctx.name}. It stung, but I survived the year.`);
    },
  },
  {
    id: 'homework', minAge: 8, maxAge: 17,
    when: (g) => g.education.stage !== 'none',
    make: () => {
      const gender = pick(['male', 'female'] as const);
      const name = randomFirst(gender);
      return {
        emoji: '📝', title: 'Copy cat',
        text: `Your classmate ${name} begs to copy your homework.`,
        choices: ['Let them', 'Refuse', 'Tell the teacher'], ctx: { name, gender },
      };
    },
    resolve: (g, c, ctx) => {
      if (c === 0) {
        if (chance(0.2)) { g.education.grades = clamp(g.education.grades - 10); return r('😬', 'Caught', `The teacher noticed ${ctx.name}'s answers matched mine. We both got zeros.`); }
        if (chance(0.5)) {
          const friend = makePerson('friend', ctx.gender === 'male' ? 'male' : 'female', g.age, undefined, rand(55, 75));
          friend.firstName = String(ctx.name);
          g.relationships.push(friend);
          return r('🤝', 'New friend', `I let ${ctx.name} copy my homework. Now we're friends!`);
        }
        return r('📝', 'Helped out', `I let ${ctx.name} copy my homework.`);
      }
      if (c === 1) { adjust(g, 'smarts', 1); return r('🙅', 'Nope', `I told ${ctx.name} to do their own homework.`); }
      adjust(g, 'happiness', -2);
      return r('🍎', 'Teacher’s pet', `I told the teacher. ${ctx.name} hasn't spoken to me since.`);
    },
  },
  {
    id: 'school-play', minAge: 6, maxAge: 17,
    when: (g) => g.education.stage !== 'none',
    make: () => ({
      emoji: '🎭', title: 'School play',
      text: 'Auditions for the school play are this week. The lead role is up for grabs.',
      choices: ['Audition', 'Skip it'], ctx: {},
    }),
    resolve: (g, c) => {
      if (c === 1) return r('🎭', 'Skipped', 'I skipped the school play auditions.');
      if (chance((g.stats.looks + g.stats.smarts) / 220)) { adjust(g, 'happiness', 10); adjust(g, 'looks', 2); return r('🌟', 'Star of the show', 'I landed the lead role and got a standing ovation!'); }
      adjust(g, 'happiness', -4);
      return r('🎭', 'Background tree', 'I auditioned but only got cast as "Tree #3".');
    },
  },
  {
    id: 'stray', minAge: 5, maxAge: 85,
    make: () => {
      const animal = pick(['puppy', 'kitten', 'bunny']);
      return {
        emoji: animal === 'puppy' ? '🐶' : animal === 'kitten' ? '🐱' : '🐰', title: 'A stray friend',
        text: `A shivering stray ${animal} followed you home.`,
        choices: ['Adopt it', 'Take it to a shelter', 'Walk away'], ctx: { animal },
      };
    },
    resolve: (g, c, ctx) => {
      if (c === 0) {
        const pet = pick(['Mochi', 'Biscuit', 'Nova', 'Pickles', 'Luna', 'Waffles', 'Comet']);
        adjust(g, 'happiness', 8);
        return r('🏠', 'New family member', `I adopted the ${ctx.animal} and named it ${pet}.`);
      }
      if (c === 1) { adjust(g, 'happiness', 3); return r('💜', 'Good deed', `I brought the ${ctx.animal} to a shelter.`); }
      adjust(g, 'happiness', -2);
      return r('🚶', 'Walked away', `I walked away from the ${ctx.animal}. I still think about it.`);
    },
  },
  {
    id: 'vape', minAge: 13, maxAge: 25,
    make: () => ({
      emoji: '💨', title: 'Peer pressure',
      text: 'A friend offers you a hit from their vape. Everyone is watching.',
      choices: ['Try it', 'Decline'], ctx: {},
    }),
    resolve: (g, c) => {
      if (c === 1) { adjust(g, 'health', 1); return r('🙅', 'No thanks', 'I turned down the vape.'); }
      adjust(g, 'health', -rand(2, 6)); adjust(g, 'happiness', 2);
      if (chance(0.3)) { adjust(g, 'health', -5); return r('😮‍💨', 'Hooked', 'I tried the vape... and now I can’t stop.'); }
      return r('💨', 'Coughing fit', 'I tried the vape and coughed for five minutes straight.');
    },
  },
  {
    id: 'prom', minAge: 16, maxAge: 18, once: true,
    when: (g) => isSingle(g) && g.education.stage === 'high',
    make: (g) => {
      const gender = datingGender(g);
      const name = randomFirst(gender);
      return {
        emoji: '💃', title: 'Prom night',
        text: `${name} nervously asks if you'll go to prom with them.`,
        choices: ['Say yes', 'Say no'], ctx: { name, gender },
      };
    },
    resolve: (g, c, ctx) => {
      if (c === 1) return r('💔', 'Turned down', `I told ${ctx.name} no. Prom was a quiet night in.`);
      adjust(g, 'happiness', 10);
      if (chance(0.5)) {
        const p = makePerson('partner', ctx.gender === 'male' ? 'male' : 'female', g.age, undefined, rand(60, 80));
        p.firstName = String(ctx.name);
        g.relationships.push(p);
        return r('💞', 'Prom date', `I went to prom with ${ctx.name} and we started dating!`);
      }
      return r('💃', 'Prom date', `I went to prom with ${ctx.name}. We danced all night.`);
    },
  },
  {
    id: 'party', minAge: 14, maxAge: 30,
    make: () => ({
      emoji: '🎉', title: 'Party invite',
      text: 'You got invited to a big party this weekend.',
      choices: ['Go', 'Stay home and study'], ctx: {},
    }),
    resolve: (g, c) => {
      if (c === 1) { adjust(g, 'smarts', 2); return r('📚', 'Quiet night', 'I skipped the party and hit the books.'); }
      adjust(g, 'happiness', rand(4, 10));
      if (chance(0.2)) {
        const f = makePerson('friend', pick(['male', 'female'] as const), g.age + rand(-2, 2), undefined, rand(50, 70));
        g.relationships.push(f);
        return r('🥳', 'Party animal', `I went to the party and made a new friend, ${fullName(f)}.`);
      }
      if (chance(0.2)) { adjust(g, 'health', -5); return r('🤢', 'Rough morning', 'I went to the party and woke up with a brutal hangover.'); }
      return r('🎉', 'Great night', 'I went to the party and had a blast.');
    },
  },
  {
    id: 'driving-test', minAge: 16, maxAge: 30, once: true,
    make: () => ({
      emoji: '🚗', title: 'Driving test',
      text: 'You’re old enough to get your driver’s license.',
      choices: ['Take the test', 'Not yet'], ctx: {},
    }),
    resolve: (g, c) => {
      const retry = () => { g.flags = g.flags.filter((f) => f !== 'driving-test'); };
      if (c === 1) { retry(); return r('🚶', 'Maybe later', 'I decided to wait on getting my license.'); }
      if (chance(0.5 + g.stats.smarts / 250)) { g.flags.push('license'); adjust(g, 'happiness', 8); return r('🪪', 'Licensed!', 'I passed my driving test on the first try!'); }
      retry(); adjust(g, 'happiness', -5);
      return r('🚧', 'Failed', 'I failed my driving test after clipping a cone.');
    },
  },
  {
    id: 'wallet', minAge: 10, maxAge: 90,
    make: () => {
      const amount = rand(4, 40) * 10;
      return {
        emoji: '👛', title: 'Lost wallet',
        text: `You found a wallet on the sidewalk with ${money(amount)} inside and an ID card.`,
        choices: ['Keep the cash', 'Return it'], ctx: { amount },
      };
    },
    resolve: (g, c, ctx) => {
      const amount = Number(ctx.amount);
      if (c === 0) { g.money += amount; adjust(g, 'happiness', 2); return r('💸', 'Finders keepers', `I kept the ${money(amount)} from the wallet.`); }
      adjust(g, 'happiness', 6);
      if (chance(0.3)) { const reward = Math.round(amount / 2); g.money += reward; return r('🎁', 'Rewarded', `I returned the wallet and the owner gave me ${money(reward)} as thanks.`); }
      return r('😇', 'Good samaritan', 'I returned the wallet to its owner.');
    },
  },
  {
    id: 'credit-thief', minAge: 18, maxAge: 70,
    when: (g) => !!g.job && !g.job.partTime,
    make: () => {
      const name = randomFirst(pick(['male', 'female'] as const));
      return {
        emoji: '😤', title: 'Stolen credit',
        text: `Your coworker ${name} presented your project to the boss as their own.`,
        choices: ['Confront them', 'Report to the boss', 'Let it go'], ctx: { name },
      };
    },
    resolve: (g, c, ctx) => {
      const job = g.job;
      if (!job) return r('😶', 'Moved on', 'I let it go.');
      if (c === 0) {
        if (chance(0.5)) { job.performance = clamp(job.performance + 8); return r('💪', 'Owned it', `I confronted ${ctx.name} and they admitted it was my work.`); }
        job.performance = clamp(job.performance - 5); return r('😬', 'Awkward', `I confronted ${ctx.name}. It turned into a shouting match.`);
      }
      if (c === 1) {
        if (chance(0.6)) { job.performance = clamp(job.performance + 10); return r('🏆', 'Vindicated', `I reported ${ctx.name}. The boss believed me.`); }
        job.performance = clamp(job.performance - 8); return r('🙄', 'Not believed', 'I reported it, but my boss thought I was just jealous.');
      }
      adjust(g, 'happiness', -5);
      return r('😶', 'Let it slide', `I let ${ctx.name} take the credit.`);
    },
  },
  {
    id: 'borrow', minAge: 18, maxAge: 90,
    when: (g) => living(g, 'friend', 'sibling').length > 0 && g.money >= 500,
    make: (g) => {
      const who = pick(living(g, 'friend', 'sibling'));
      const amount = Math.min(rand(5, 50) * 100, Math.floor(g.money / 2 / 100) * 100);
      return {
        emoji: '🤲', title: 'Can I borrow some money?',
        text: `${fullName(who)} asks to borrow ${money(amount)} to cover rent.`,
        choices: ['Lend it', 'Refuse'], ctx: { id: who.id, amount },
      };
    },
    resolve: (g, c, ctx) => {
      const p = byId(g, ctx.id);
      const amount = Number(ctx.amount);
      const name = p ? p.firstName : 'They';
      if (c === 1) { bond(p, -12); return r('🙅', 'Refused', `I refused to lend ${name} money.`); }
      g.money -= amount; bond(p, 8);
      if (chance(0.55)) { g.money += amount; return r('🤝', 'Paid back', `I lent ${name} ${money(amount)} and they paid me back.`); }
      return r('💸', 'Gone forever', `I lent ${name} ${money(amount)}. I never saw it again.`);
    },
  },
  {
    id: 'startup', minAge: 25, maxAge: 80,
    when: (g) => g.money >= 5000,
    make: (g) => {
      const amount = Math.max(5000, Math.min(250000, Math.round(g.money * 0.2 / 1000) * 1000));
      const idea = pick(['an AI-powered toothbrush', 'a subscription for artisanal ice cubes', 'a moon-themed coffee chain', 'an app that rates sunsets', 'a clean-energy battery company']);
      return {
        emoji: '📈', title: 'Investment pitch',
        text: `An old classmate wants you to invest ${money(amount)} in ${idea}.`,
        choices: [`Invest ${money(amount)}`, 'Pass'], ctx: { amount, idea },
      };
    },
    resolve: (g, c, ctx) => {
      const amount = Number(ctx.amount);
      if (c === 1) return r('🤔', 'Passed', `I passed on investing in ${ctx.idea}.`);
      const roll = Math.random();
      if (roll < 0.3) { const gain = amount * rand(2, 5); g.money += gain - amount; adjust(g, 'happiness', 12); return r('🚀', 'Jackpot', `I invested in ${ctx.idea} and it took off! I made ${money(gain)}.`); }
      if (roll < 0.55) { const gain = Math.round(amount * 1.3); g.money += gain - amount; return r('📈', 'Solid return', `My investment in ${ctx.idea} returned ${money(gain)}.`); }
      g.money -= amount; adjust(g, 'happiness', -8);
      return r('📉', 'Total loss', `The company behind ${ctx.idea} went bust. I lost ${money(amount)}.`);
    },
  },
  {
    id: 'charity', minAge: 12, maxAge: 90,
    when: (g) => g.money >= 50,
    make: () => ({
      emoji: '🎗️', title: 'Charity drive',
      text: 'A volunteer asks if you’d donate to the local children’s hospital.',
      choices: ['Donate $50', 'Walk by'], ctx: {},
    }),
    resolve: (g, c) => {
      if (c === 1) return r('🚶', 'Walked by', 'I walked past the charity volunteer.');
      g.money -= 50; adjust(g, 'happiness', 4);
      return r('💝', 'Generous', 'I donated $50 to the children’s hospital.');
    },
  },
  {
    id: 'lump', minAge: 35, maxAge: 100, weight: 0.6, prison: 'ok',
    make: () => {
      const cost = rand(5, 30) * 1000;
      return {
        emoji: '🩻', title: 'Doctor’s warning',
        text: `A routine checkup found a lump that needs treatment. It’ll cost ${money(cost)}.`,
        choices: [`Get treatment (${money(cost)})`, 'Ignore it'], ctx: { cost },
      };
    },
    resolve: (g, c, ctx) => {
      if (c === 0) {
        g.money -= Number(ctx.cost);
        if (chance(0.85)) { adjust(g, 'health', 5); adjust(g, 'happiness', 5); return r('💚', 'All clear', 'I got treatment and made a full recovery.'); }
        adjust(g, 'health', -15);
        return r('🏥', 'Tough recovery', 'I got treatment, but the recovery took a lot out of me.');
      }
      const roll = Math.random();
      if (roll < 0.12) {
        log(g, 'I ignored the lump the doctor found.');
        die(g, 'cancer');
        return { ...r('🕯️', 'Too late', 'I ignored the lump. It turned out to be cancer.'), silent: true };
      }
      if (roll < 0.45) { adjust(g, 'health', -30); return r('🤒', 'It got worse', 'I ignored the lump and my health took a serious hit.'); }
      return r('😮‍💨', 'Lucky', 'I ignored the lump. It turned out to be nothing.');
    },
  },
  {
    id: 'midlife', minAge: 40, maxAge: 55, once: true,
    make: (g) => ({
      emoji: '🌀', title: 'Midlife crisis',
      text: 'You wake up feeling like life is passing you by.',
      choices: [g.money >= 60000 ? 'Buy a flashy sports car' : 'Dye your hair a wild color', 'Take up painting', 'Train for a marathon'], ctx: { rich: g.money >= 60000 ? 1 : 0 },
    }),
    resolve: (g, c, ctx) => {
      if (c === 0 && !ctx.rich) {
        g.look = { ...g.look, hairColor: pick(['#ff8fc4', '#8a4fd8', '#3fc1b0', '#e0445a', '#6f8cff']) };
        adjust(g, 'happiness', 8);
        return r('🌈', 'New me', 'I dyed my hair a wild color. I feel twenty again!');
      }
      if (c === 0) {
        g.money -= 60000; adjust(g, 'happiness', 10);
        g.assets.push({ id: uid(), shopId: 'car4', kind: 'car', name: 'Midlife Convertible', emoji: '🏎️', value: 48000, purchasePrice: 60000, age: 0 });
        return r('🏎️', 'Vroom', 'I bought a flashy convertible for $60,000. Worth it.');
      }
      if (c === 1) { adjust(g, 'happiness', 8); adjust(g, 'smarts', 2); return r('🎨', 'Artist', 'I took up painting. My sunsets are getting pretty good.'); }
      adjust(g, 'health', 10);
      if (chance(0.5)) { adjust(g, 'happiness', 10); return r('🏅', 'Finisher', 'I trained hard and finished a full marathon!'); }
      return r('🏃', 'Almost', 'I trained for a marathon but pulled a hamstring at mile 20.');
    },
  },
  {
    id: 'match', minAge: 18, maxAge: 70,
    when: (g) => isSingle(g),
    make: (g) => {
      const gender = datingGender(g);
      const name = randomFirst(gender);
      const age = datingAge(g);
      return {
        emoji: '💘', title: 'It’s a match!',
        text: `You matched with ${name} (${age}) on a dating app. They seem sweet.`,
        choices: ['Ask them out', 'Unmatch'], ctx: { name, gender, age },
      };
    },
    resolve: (g, c, ctx) => {
      if (c === 1) return r('👋', 'Unmatched', `I unmatched with ${ctx.name}.`);
      if (chance(0.3 + g.stats.looks / 200)) {
        const p = makePerson('partner', ctx.gender === 'male' ? 'male' : 'female', Number(ctx.age), undefined, rand(55, 75));
        p.firstName = String(ctx.name);
        g.relationships.push(p);
        adjust(g, 'happiness', 8);
        return r('💞', 'Sparks', `I went on a date with ${ctx.name} and we started seeing each other!`);
      }
      adjust(g, 'happiness', -3);
      return r('🥶', 'No spark', `My date with ${ctx.name} was painfully awkward.`);
    },
  },
  {
    id: 'neighbor-dog', minAge: 18, maxAge: 90,
    make: () => ({
      emoji: '🐕', title: 'Noisy neighbor',
      text: 'Your neighbor’s dog has been barking all night, every night.',
      choices: ['Complain', 'Buy earplugs', 'Bark back'], ctx: {},
    }),
    resolve: (g, c) => {
      if (c === 0) { if (chance(0.6)) return r('🤫', 'Peace at last', 'I complained and the barking stopped.'); adjust(g, 'happiness', -3); return r('😾', 'Feud', 'I complained. Now my neighbor glares at me every morning.'); }
      if (c === 1) { g.money -= 15; adjust(g, 'health', 2); return r('😴', 'Sleeping soundly', 'I bought earplugs and finally got some sleep.'); }
      adjust(g, 'happiness', 5);
      return r('🐺', 'Awooo', 'I barked back at the dog. It was deeply satisfying.');
    },
  },
  {
    id: 'move', minAge: 20, maxAge: 80,
    when: (g) => living(g, 'spouse').length > 0,
    make: (g) => {
      const place = PLACES.find((p) => p.country === g.country) ?? PLACES[0];
      const options = place.cities.filter((c) => c !== g.city);
      if (!options.length) return null;
      const city = pick(options);
      const spouse = living(g, 'spouse')[0];
      return {
        emoji: '🧳', title: 'A fresh start?',
        text: `${spouse.firstName} wants to move to ${city} for a new beginning.`,
        choices: ['Let’s go', 'I want to stay'], ctx: { city, id: spouse.id },
      };
    },
    resolve: (g, c, ctx) => {
      const s = byId(g, ctx.id);
      if (c === 1) { bond(s, -15); return r('🏠', 'Staying put', `I told ${s?.firstName ?? 'my spouse'} I didn’t want to move.`); }
      g.city = String(ctx.city); bond(s, 10); adjust(g, 'happiness', rand(-3, 6));
      return r('🧳', 'New city', `We packed up and moved to ${ctx.city}.`);
    },
  },
  {
    id: 'scam-call', minAge: 60, maxAge: 110,
    make: () => ({
      emoji: '📞', title: 'Urgent call',
      text: 'A caller says your bank account was hacked and asks you to “verify” your details.',
      choices: ['Give them your info', 'Hang up'], ctx: {},
    }),
    resolve: (g, c) => {
      if (c === 1) { adjust(g, 'smarts', 1); return r('☎️', 'Nice try', 'I hung up on the scammer.'); }
      const lost = Math.max(0, Math.round(g.money * 0.3));
      g.money -= lost; adjust(g, 'happiness', -10);
      return r('😱', 'Scammed', `It was a scam. I lost ${money(lost)}.`);
    },
  },
  {
    id: 'recruiter', minAge: 25, maxAge: 60,
    when: (g) => !!g.job && !g.job.partTime,
    make: (g) => ({
      emoji: '📨', title: 'Recruiter',
      text: `A rival company offers you a ${g.job?.title} role with a 20% raise.`,
      choices: ['Take the offer', 'Stay loyal'], ctx: {},
    }),
    resolve: (g, c) => {
      if (!g.job) return r('🤷', 'Nevermind', 'The offer fell through.');
      if (c === 1) { g.job.performance = clamp(g.job.performance + 5); return r('🤝', 'Loyal', 'I turned down the offer. My boss noticed.'); }
      g.job.salary = Math.round(g.job.salary * 1.2); g.job.years = 0; g.job.performance = 55;
      return r('📨', 'New gig', `I switched companies. New salary: ${money(g.job.salary)}.`);
    },
  },
  {
    id: 'kid-college', minAge: 36, maxAge: 90,
    when: (g) => living(g, 'child').some((k) => k.age >= 17 && k.age <= 22) && g.money >= 10000,
    make: (g) => {
      const kid = pick(living(g, 'child').filter((k) => k.age >= 17 && k.age <= 22));
      const amount = Math.min(40000, Math.round(g.money * 0.25 / 1000) * 1000);
      return {
        emoji: '🎓', title: 'Tuition help',
        text: `${kid.firstName} asks if you can help with ${money(amount)} for college.`,
        choices: ['Help them', 'Say no'], ctx: { id: kid.id, amount },
      };
    },
    resolve: (g, c, ctx) => {
      const kid = byId(g, ctx.id);
      if (c === 1) { bond(kid, -15); return r('🙅', 'On your own', `I told ${kid?.firstName} they’d have to pay for college themselves.`); }
      g.money -= Number(ctx.amount); bond(kid, 15); adjust(g, 'happiness', 5);
      return r('🎓', 'Proud parent', `I gave ${kid?.firstName} ${money(Number(ctx.amount))} for college.`);
    },
  },
  {
    id: 'road-rage', minAge: 17, maxAge: 85,
    when: (g) => g.flags.includes('license'),
    make: () => ({
      emoji: '🚦', title: 'Cut off',
      text: 'Someone cuts you off in traffic and flips you off.',
      choices: ['Honk', 'Let it go', 'Chase them'], ctx: {},
    }),
    resolve: (g, c) => {
      if (c === 0) return r('📯', 'HOOONK', 'I leaned on my horn. They didn’t care.');
      if (c === 1) { adjust(g, 'happiness', 2); return r('🧘', 'Zen', 'I took a deep breath and let it go.'); }
      if (chance(0.25)) { adjust(g, 'health', -20); g.money -= 3000; return r('💥', 'Crash', 'I chased them and crashed into a guardrail.'); }
      return r('🚓', 'Pointless', 'I chased them for three blocks, then lost them at a light.');
    },
  },
  {
    id: 'yard-threat', minAge: 18, maxAge: 110, prison: 'only',
    make: () => ({
      emoji: '⛓️', title: 'Prison yard',
      text: 'A gang leader in the yard demands you hand over your commissary.',
      choices: ['Fight', 'Snitch to a guard', 'Hand it over'], ctx: {},
    }),
    resolve: (g, c) => {
      if (c === 0) {
        if (chance(0.4 + g.stats.health / 250)) { adjust(g, 'happiness', 6); return r('💪', 'Respect', 'I fought back. Nobody messes with me now.'); }
        adjust(g, 'health', -15); return r('🤕', 'Beaten', 'I fought and ended up in the infirmary.');
      }
      if (c === 1) { if (chance(0.5)) { g.prison = Math.max(0, g.prison - 1); return r('📉', 'Reduced sentence', 'I snitched and got a year knocked off my sentence.'); } adjust(g, 'health', -10); return r('🐀', 'Snitches...', 'I snitched. The gang found out.'); }
      adjust(g, 'happiness', -5);
      return r('😔', 'Handed over', 'I gave up my commissary.');
    },
  },
];

const PASSIVE_EVENTS: PassiveEvent[] = [
  { id: 'first-word', minAge: 1, maxAge: 2, once: true, weight: 4, run: (g) => log(g, `I said my first word: "${pick(['mama', 'dada', 'no', 'ball', 'moon', 'doggy', 'star'])}".`) },
  { id: 'first-steps', minAge: 1, maxAge: 2, once: true, weight: 4, run: (g) => { log(g, 'I took my first wobbly steps!'); adjust(g, 'happiness', 3); } },
  { id: 'chickenpox', minAge: 2, maxAge: 10, once: true, run: (g) => { log(g, 'I caught chickenpox and itched for weeks.'); adjust(g, 'health', -8); } },
  { id: 'flu', minAge: 3, maxAge: 110, prison: 'ok', run: (g) => { log(g, 'I came down with a nasty flu.'); adjust(g, 'health', -rand(2, 6)); } },
  { id: 'found-cash', minAge: 5, maxAge: 90, run: (g) => { const n = rand(5, 60); g.money += n; log(g, `I found ${money(n)} on the ground.`); } },
  { id: 'raffle', minAge: 18, maxAge: 95, weight: 0.4, run: (g) => { const n = rand(1, 25) * 100; g.money += n; adjust(g, 'happiness', 4); log(g, `I won ${money(n)} in a raffle!`); } },
  { id: 'inheritance', minAge: 25, maxAge: 90, weight: 0.15, run: (g) => { const n = rand(10, 90) * 1000; g.money += n; log(g, `A distant relative I never met left me ${money(n)}.`); } },
  { id: 'sprain', minAge: 8, maxAge: 75, run: (g) => { log(g, 'I sprained my ankle tripping on a curb.'); adjust(g, 'health', -5); } },
  { id: 'compliment', minAge: 12, maxAge: 85, run: (g) => { log(g, 'A stranger told me I have a beautiful smile.'); adjust(g, 'happiness', 3); } },
  { id: 'praise', minAge: 6, maxAge: 17, when: (g) => g.education.stage !== 'none', run: (g) => { log(g, 'My teacher praised my work in front of the whole class.'); adjust(g, 'smarts', 2); g.education.grades = clamp(g.education.grades + 5); } },
  { id: 'hip', minAge: 65, maxAge: 110, prison: 'ok', run: (g) => { log(g, 'I slipped in the shower and hurt my hip.'); adjust(g, 'health', -10); } },
  { id: 'good-year', minAge: 5, maxAge: 110, run: (g) => { log(g, pick(['I had a genuinely wonderful year.', 'I watched the most incredible sunset this year.', 'I felt content and at peace this year.'])); adjust(g, 'happiness', 5); } },
  { id: 'prison-library', minAge: 18, maxAge: 110, prison: 'only', run: (g) => { log(g, 'I spent the year reading in the prison library.'); adjust(g, 'smarts', 3); } },
  { id: 'meteor', minAge: 6, maxAge: 110, weight: 0.3, run: (g) => { log(g, 'I saw a meteor shower light up the midnight sky. ✨'); adjust(g, 'happiness', 4); } },
];

const COOLDOWN = 3;
const seenKey = (id: string, age: number) => `seen:${id}:${age}`;

function eligible(g: Game, e: EventBase) {
  if (g.age < e.minAge || g.age > e.maxAge) return false;
  for (let a = g.age - COOLDOWN + 1; a <= g.age; a++) if (g.flags.includes(seenKey(e.id, a))) return false;
  if (e.once && g.flags.includes(e.id)) return false;
  if (g.prison > 0 ? !e.prison : e.prison === 'only') return false;
  return !e.when || e.when(g);
}

/** Roll this year's random events: passive ones apply now, choice ones are queued for the player. */
export function rollEvents(g: Game) {
  if (chance(0.5)) {
    const e = weightedPick(PASSIVE_EVENTS.filter((e) => eligible(g, e)));
    if (e) {
      if (e.once) g.flags.push(e.id);
      e.run(g);
    }
  }
  if (g.age < 2) return;
  const count = chance(0.7) ? (chance(0.3) ? 2 : 1) : 0;
  for (let i = 0; i < count; i++) {
    const e = weightedPick(CHOICE_EVENTS.filter((e) => eligible(g, e) && !g.pending.some((p) => p.id === e.id)));
    if (!e) break;
    const made = e.make(g);
    if (!made) continue;
    if (e.once) g.flags.push(e.id);
    g.flags = g.flags.filter((f) => !f.startsWith('seen:') || Number(f.split(':')[2]) > g.age - COOLDOWN);
    g.flags.push(seenKey(e.id, g.age));
    g.pending.push({ id: e.id, ...made });
  }
}

export function resolveEvent(g: Game, choice: number): Result | undefined {
  const pending = g.pending[0];
  if (!pending) return;
  if (pending.id === 'dream-offer') {
    g.pending.shift();
    const c = careerOf(String(pending.ctx.careerId));
    if (!c) return;
    if (choice === 1) return r('🌙', 'Maybe later', `I turned down the ${c.title} offer for now. It’s still guaranteed if I apply.`);
    const prev = g.job;
    hire(g, c);
    adjust(g, 'happiness', 20);
    return { ...r('🌟', 'Dream come true!', `I became a ${c.levels[0]} — my dream of being a ${c.title} came true!${prev ? ` I left my job as ${prev.title}.` : ''}`), celebrate: true };
  }
  if (pending.id === 'married-name') {
    g.pending.shift();
    const spouse = g.relationships.find((p) => p.id === pending.ctx.spouseId);
    if (!spouse) return;
    if (choice === 1) return r('💍', 'Still me', `I kept my maiden name, ${g.firstName} ${g.lastName}.`);
    g.maidenName ??= g.lastName;
    g.lastName = spouse.lastName;
    return r('💍', 'A new name', `I took ${spouse.firstName}’s last name. I’m ${g.firstName} ${g.lastName} now.`);
  }
  if (pending.id === 'graduation') {
    g.pending.shift();
    const honour = String(pending.ctx.honour ?? 'pass');
    return {
      emoji: honour === 'valedictorian' ? '🏆' : '🎓',
      title: pending.title,
      text: pending.text,
      celebrate: honour === 'valedictorian' || honour === 'salutatorian',
    };
  }
  const def = CHOICE_EVENTS.find((e) => e.id === pending.id);
  g.pending.shift();
  return def?.resolve(g, choice, pending.ctx);
}

