import type { Career } from './data';
import type { Game, Result } from './types';
import { adjust, log } from './helpers';
import { pick } from './util';

/* ───────── The interview ─────────
   Before anyone hires you, they ask a few questions. Get one wrong and that
   employer won't see you again until next year — but other jobs are still open. */

export interface InterviewQuestion {
  q: string;
  /** The right answer is always first here; the UI shuffles them. */
  options: [string, string, string];
}

type Pool = InterviewQuestion[];

const COMMON: Pool = [
  { q: 'Why do you want to work here?', options: ['I believe in what you do and I want to be good at it.', 'It was the first result I clicked on.', 'My friend said the breaks are long.'] },
  { q: 'What’s your biggest weakness?', options: ['I take on too much, so I’ve been learning to ask for help.', 'Nothing, really. I’m perfect.', 'Mornings. And afternoons.'] },
  { q: 'Where do you see yourself in five years?', options: ['Still here, doing this properly and training the new people.', 'Running this company instead of you.', 'Honestly? Anywhere but here.'] },
  { q: 'Tell us about a time you made a mistake.', options: ['I missed a deadline once, told my manager early, and we fixed it together.', 'I don’t make mistakes.', 'My last team made a lot of mistakes.'] },
  { q: 'How do you handle a difficult colleague?', options: ['Talk to them directly and privately before it grows into something bigger.', 'Complain about them to everyone else.', 'Avoid them until one of us leaves.'] },
  { q: 'We’re very busy this season. How do you cope with pressure?', options: ['I make a list, do the important things first, and say when I need help.', 'I panic, but quietly.', 'I work better when I leave everything to the last minute.'] },
  { q: 'What does good teamwork look like to you?', options: ['Everyone knows who’s doing what, and nobody is left carrying it alone.', 'Everyone does what I say.', 'I prefer to work alone, honestly.'] },
  { q: 'Do you have any questions for us?', options: ['Yes — what does success look like in this role after six months?', 'No, none at all.', 'How quickly can I get promoted?'] },
];

const MEDICAL: Pool = [
  { q: 'A patient is frightened before a procedure. What do you do?', options: ['Explain what’s about to happen in plain words and check they’re happy to go ahead.', 'Get it over with quickly so they can’t worry.', 'Tell them not to be silly.'] },
  { q: 'You notice a colleague about to give the wrong dose. What do you do?', options: ['Stop them immediately and check the chart together.', 'Say nothing — they’re senior to me.', 'Mention it afterwards if anything goes wrong.'] },
  { q: 'What matters most in this job?', options: ['Patient safety, every single time.', 'Getting through the list fastest.', 'Being liked by the staff.'] },
];

const CARE: Pool = [
  { q: 'A child in your care won’t stop crying. What do you try first?', options: ['Get down to their level, stay calm, and find out what’s wrong.', 'Leave them to cry it out.', 'Give them sweets so they stop.'] },
  { q: 'A parent complains about something you did. How do you respond?', options: ['Listen properly, apologise if I got it wrong, and explain what I’ll change.', 'Explain why they’re mistaken.', 'Say nothing and hope they forget.'] },
];

const LAWORDER: Pool = [
  { q: 'A witness changes their story. What do you do?', options: ['Record both versions and check them against the evidence.', 'Use whichever version helps my case.', 'Tell them they’re lying.'] },
  { q: 'You’re offered a gift by someone whose case you’re handling.', options: ['Refuse it and report the offer.', 'Accept it — it would be rude not to.', 'Accept it, but don’t tell anyone.'] },
];

const MONEY: Pool = [
  { q: 'You find a mistake in last quarter’s numbers. What now?', options: ['Flag it straight away with a corrected version.', 'Fix it quietly and hope nobody noticed.', 'Leave it — it’s last quarter’s problem.'] },
  { q: 'A client wants a return nobody can promise. What do you say?', options: ['Be honest about the risk and show them what’s realistic.', 'Promise it — they’ll be happy now.', 'Send them to a colleague.'] },
];

const SERVICE: Pool = [
  { q: 'A customer is shouting about something that isn’t your fault.', options: ['Stay calm, hear them out, and fix what I actually can.', 'Shout back. They started it.', 'Walk away and let someone else deal with it.'] },
  { q: 'It’s the end of your shift but the place is a mess.', options: ['Tidy up so the next shift isn’t buried.', 'Leave — my hours are my hours.', 'Hide the mess in the back.'] },
];

const CREATIVE: Pool = [
  { q: 'A client hates the work you spent a week on.', options: ['Ask what specifically isn’t working and take another run at it.', 'Tell them they don’t understand the work.', 'Redo it exactly how they say without asking why.'] },
  { q: 'Where do your ideas come from?', options: ['Paying attention to things other people walk past.', 'I just wait until inspiration turns up.', 'Mostly from whatever is trending.'] },
];

const TECH: Pool = [
  { q: 'Your change broke the site at 5pm on a Friday.', options: ['Roll it back first, then work out what happened.', 'Start debugging the live site.', 'Go home. It’ll probably fix itself.'] },
  { q: 'You inherit code you think is terrible.', options: ['Learn why it’s like that before I change anything.', 'Rewrite all of it immediately.', 'Refuse to touch it.'] },
];

/** Which extra pool an employer draws from. */
function poolFor(c: Career): Pool {
  const id = c.id;
  if (/doctor|surgeon|nurse|dentist|vet|pharma|paramedic|therapist|psych|midwife|cardio|neuro|pediat/i.test(id)) return MEDICAL;
  if (/teacher|babysit|nanny|counsel|social|care/i.test(id)) return CARE;
  if (/lawyer|judge|police|detective|forensic|security|firefighter/i.test(id)) return LAWORDER;
  if (/account|bank|invest|exec|realtor|econom|financ/i.test(id)) return MONEY;
  if (/dev|engineer|scientist|game|data|tech|architect/i.test(id)) return TECH;
  if (/actor|model|musician|singer|artist|design|journalist|writer|photo|chef|influencer|popstar|dancer|band/i.test(id)) return CREATIVE;
  return SERVICE;
}

export interface Interview {
  careerId: string;
  title: string;
  emoji: string;
  questions: InterviewQuestion[];
}

/** Three questions: two general, one for the trade. */
export function makeInterview(c: Career): Interview {
  const common = [...COMMON].sort(() => Math.random() - 0.5).slice(0, 2);
  const special = pick(poolFor(c));
  const questions = [...common, special].sort(() => Math.random() - 0.5);
  return { careerId: c.id, title: c.title, emoji: c.emoji, questions };
}

/** Employers remember a bad interview until next year. */
export const rejectedUntil = (g: Game, careerId: string) => g.rejections[careerId];
export const canApplyAgain = (g: Game, careerId: string) => {
  const at = g.rejections[careerId];
  return at === undefined || g.age > at;
};

export function failInterview(g: Game, c: Career, wrong: number): Result {
  g.rejections[c.id] = g.age;
  adjust(g, 'happiness', -4);
  log(g, `📭 The ${c.title} interview didn't go my way.`);
  return {
    emoji: '📭',
    title: 'Not this time',
    text: wrong >= 2
      ? `That interview went badly — ${wrong} answers they clearly didn't like. ${c.title} is off the table until next year, but other places are still hiring.`
      : `So close. One answer landed wrong and they went with someone else. I can try ${c.title} again next year, or apply somewhere else today.`,
  };
}
