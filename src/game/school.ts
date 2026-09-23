import type { Game, ReportCard, Result, SchoolStage } from './types';
import { adjust, log, markUsed, used } from './helpers';
import { clamp, pick, rand } from './util';
import type { QuizBank } from './workgames';
import { MAJORS } from './data';

/* ───────── Exams, report cards and graduation ───────── */

export interface Subject { name: string; bank: QuizBank }

const SUBJECTS: Record<string, Subject> = {
  maths: { name: 'Maths', bank: 'kidmath' },
  advmaths: { name: 'Maths', bank: 'math' },
  science: { name: 'Science', bank: 'science' },
  geography: { name: 'Geography', bank: 'geo' },
  music: { name: 'Music', bank: 'music' },
  pe: { name: 'P.E.', bank: 'sports' },
  tech: { name: 'Computing', bank: 'tech' },
  law: { name: 'Law', bank: 'law' },
  biology: { name: 'Biology', bank: 'diagnose' },
  food: { name: 'Food tech', bank: 'food' },
  citizenship: { name: 'Citizenship', bank: 'kind' },
  protocol: { name: 'Protocol', bank: 'etiquette' },
};

/** Which three subjects this year's paper covers. */
export function examSubjects(g: Game): Subject[] {
  const e = g.education;
  if (e.stage === 'royal') return [SUBJECTS.protocol, SUBJECTS.geography, SUBJECTS.citizenship];
  if (e.stage === 'elementary') return [SUBJECTS.maths, SUBJECTS.science, pick([SUBJECTS.geography, SUBJECTS.music, SUBJECTS.pe])];
  if (e.stage === 'high') return [SUBJECTS.advmaths, SUBJECTS.science, pick([SUBJECTS.geography, SUBJECTS.tech, SUBJECTS.food, SUBJECTS.citizenship])];
  // University and graduate school lean on the major.
  const major = MAJORS.find((m) => m.id === e.program?.replace('ba:', ''))?.name ?? '';
  const byMajor: Subject[] = /law/i.test(major) ? [SUBJECTS.law, SUBJECTS.citizenship]
    : /medicine|nurs|biolog/i.test(major) ? [SUBJECTS.biology, SUBJECTS.science]
    : /computer|engineer/i.test(major) ? [SUBJECTS.tech, SUBJECTS.advmaths]
    : /music|art/i.test(major) ? [SUBJECTS.music, SUBJECTS.citizenship]
    : /business|econom/i.test(major) ? [SUBJECTS.advmaths, SUBJECTS.geography]
    : [SUBJECTS.science, SUBJECTS.advmaths];
  return [...byMajor, SUBJECTS.citizenship];
}

export const inSchool = (g: Game) => g.education.stage !== 'none';
export const examsOn = (g: Game) => !g.education.examsOff;

export function examBlock(g: Game): string | null {
  if (!inSchool(g)) return 'Not in school';
  if (g.prison > 0) return 'In prison';
  if (g.education.examsOff) return 'Exams turned off';
  if (used(g, 'school:exam')) return 'Done for this year';
  return null;
}

export function sheetBlock(g: Game): string | null {
  if (!inSchool(g)) return 'Not in school';
  if (g.education.examsOff) return 'Exams turned off';
  if (g.education.reviewSheet) return 'Already have it';
  if (used(g, 'school:exam')) return 'Exams already done';
  return null;
}

/** Pick up this year's review sheet from the school office. */
export function takeReviewSheet(g: Game): Result | undefined {
  if (sheetBlock(g)) return;
  g.education.reviewSheet = true;
  adjust(g, 'smarts', rand(1, 3));
  return {
    emoji: '📄',
    title: 'Review sheet',
    text: 'I picked up the review sheet from the school office. Everything on the exam is somewhere in here — if I actually read it.',
  };
}

/** Turn exams on or off for good (well, until you turn them back on). */
export function toggleExams(g: Game): Result | undefined {
  if (!inSchool(g) && g.education.stage === 'none') return;
  const off = !g.education.examsOff;
  g.education.examsOff = off;
  return off
    ? { emoji: '🙅', title: 'Exams off', text: 'I told the school I’m not sitting exams. My report cards will suffer, and valedictorian is off the table — but my afternoons are free.' }
    : { emoji: '📝', title: 'Exams on', text: 'I’m sitting exams again from this year.' };
}

const gradeFor = (score: number) =>
  score >= 95 ? 'A+' : score >= 88 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

const NOTES_GOOD = [
  'A pleasure to teach. Keeps the whole class on their toes.',
  'Excellent work all year. Consistently prepared.',
  'Asks the questions nobody else dares ask.',
  'Outstanding. Should be very proud of this year.',
];
const NOTES_OK = [
  'Solid work. Could push a little harder next year.',
  'Good effort, though easily distracted in the afternoons.',
  'Steady progress. Homework is usually on time.',
  'Capable of more when the topic interests them.',
];
const NOTES_BAD = [
  'Needs to attend more and daydream less.',
  'Struggled this year. Extra help is available.',
  'Homework is rarely finished. We know they can do better.',
  'A difficult year. Let’s start fresh in September.',
];
const NOTES_SKIPPED = [
  'Did not sit this year’s exams. Marks are estimates.',
  'Absent on exam days. The record speaks for itself.',
  'No exam results on file for this year.',
];

function pushReport(g: Game, card: ReportCard) {
  (g.education.reports ??= []).push(card);
  if (g.education.reports.length > 30) g.education.reports.shift();
}

/** Turn a finished exam into a report card. */
export function finishExam(g: Game, marks: { name: string; correct: number; total: number }[]): Result {
  const e = g.education;
  markUsed(g, 'school:exam');
  const reviewed = !!e.reviewSheet;
  e.reviewSheet = false;

  const rawTotal = marks.reduce((s, m) => s + m.total, 0) || 1;
  const rawCorrect = marks.reduce((s, m) => s + m.correct, 0);
  const raw = Math.round((rawCorrect / rawTotal) * 100);
  // The review sheet is worth a real boost — that's the point of fetching it.
  const score = clamp(raw + (reviewed ? 10 : 0) + Math.round((g.stats.smarts - 50) / 10));

  const subjects = marks.map((m) => ({
    name: m.name,
    mark: clamp(Math.round((m.correct / Math.max(1, m.total)) * 100) + (reviewed ? 8 : 0) + rand(-6, 6)),
  }));
  const note = pick(score >= 85 ? NOTES_GOOD : score >= 60 ? NOTES_OK : NOTES_BAD);
  const card: ReportCard = { age: g.age, stage: e.stage, score, grade: gradeFor(score), subjects, note };
  pushReport(g, card);
  (e.exams ??= []).push({ age: g.age, stage: e.stage, score, max: 100, reviewed });

  // Exams pull your overall grades towards the result.
  e.grades = clamp(Math.round(e.grades + (score - e.grades) * 0.55));
  adjust(g, 'smarts', score >= 80 ? rand(2, 5) : score >= 55 ? rand(0, 2) : 0);
  adjust(g, 'happiness', score >= 80 ? 6 : score >= 50 ? 1 : -5);
  log(g, `📋 Report card, age ${g.age}: ${card.grade} (${score}%)${reviewed ? ' — the review sheet paid off' : ''}.`);
  return {
    emoji: '📋',
    title: `Report card · ${card.grade}`,
    text: `${subjects.map((s) => `${s.name} ${s.mark}%`).join(' · ')}. "${note}"`,
    celebrate: score >= 90,
  };
}

/** Called at the start of a new year when last year's exam was never sat. */
export function skipExamYear(g: Game) {
  const e = g.education;
  if (!inSchool(g)) return;
  e.missedExams = (e.missedExams ?? 0) + 1;
  e.reviewSheet = false;
  const missedAge = Math.max(0, g.age - 1); // the year that just ended
  const score = clamp(Math.round(e.grades * 0.55) + rand(-5, 5));
  const subjects = examSubjects(g).map((s) => ({ name: s.name, mark: clamp(score + rand(-10, 10)) }));
  pushReport(g, { age: missedAge, stage: e.stage, score, grade: gradeFor(score), subjects, note: pick(NOTES_SKIPPED), skipped: true });
  e.grades = clamp(Math.round(e.grades - rand(8, 16)));
  adjust(g, 'happiness', e.examsOff ? 2 : -3);
  log(g, `📋 Report card for age ${missedAge}: ${gradeFor(score)} (${score}%) — no exam results on file.`);
}

/* ───────── Graduation ───────── */

export type Honour = 'valedictorian' | 'salutatorian' | 'honours' | 'pass' | 'fail';

export interface Graduation {
  stage: SchoolStage;
  honour: Honour;
  average: number;
  title: string;
  note: string;
}

const stageName = (s: SchoolStage) =>
  s === 'elementary' ? 'elementary school' : s === 'high' ? 'high school' : s === 'university' ? 'university' : s === 'royal' ? 'the Royal Academy' : 'graduate school';

/** Work out how the ceremony goes, based on the report cards for this stage. */
export function graduationFor(g: Game, stage: SchoolStage): Graduation {
  const e = g.education;
  const cards = (e.reports ?? []).filter((c) => c.stage === stage);
  const average = cards.length ? Math.round(cards.reduce((s, c) => s + c.score, 0) / cards.length) : e.grades;
  const perfect = cards.length > 0 && cards.every((c) => !c.skipped) && !e.examsOff;
  const honour: Honour =
    average < 40 ? 'fail'
    : perfect && average >= 90 ? 'valedictorian'
    : perfect && average >= 82 ? 'salutatorian'
    : average >= 72 ? 'honours'
    : 'pass';
  const title = honour === 'valedictorian' ? 'Valedictorian'
    : honour === 'salutatorian' ? 'Salutatorian'
    : honour === 'honours' ? 'Graduated with honours'
    : honour === 'pass' ? 'Graduated' : 'Did not graduate';
  const note = honour === 'valedictorian' ? `I gave the valedictorian speech at ${stageName(stage)}. I only cried a little.`
    : honour === 'salutatorian' ? `I was salutatorian — second in the whole year. I'd have liked first, but I'll take it.`
    : honour === 'honours' ? `I graduated from ${stageName(stage)} with honours.`
    : honour === 'pass' ? `I graduated from ${stageName(stage)}. Nobody asked about my marks.`
    : `I didn't make it through ${stageName(stage)}. There's always another way.`;
  return { stage, honour, average, title, note };
}

/** The ceremony itself: a card in the log, some stats, and a modal for the player. */
export function holdGraduation(g: Game, stage: SchoolStage) {
  const grad = graduationFor(g, stage);
  log(g, `🎓 ${grad.note}`);
  if (grad.honour === 'valedictorian') {
    adjust(g, 'happiness', 18);
    adjust(g, 'smarts', 5);
    g.flags.push(`valedictorian:${stage}`);
  } else if (grad.honour === 'salutatorian') {
    adjust(g, 'happiness', 12);
    adjust(g, 'smarts', 3);
  } else if (grad.honour === 'honours') {
    adjust(g, 'happiness', 9);
  } else if (grad.honour === 'fail') {
    adjust(g, 'happiness', -10);
  } else {
    adjust(g, 'happiness', 6);
  }
  g.pending.push({
    id: 'graduation',
    emoji: grad.honour === 'valedictorian' ? '🏆' : '🎓',
    title: `${grad.title}!`,
    text: `${grad.note} Final average: ${grad.average}%.`,
    choices: ['🎓 Throw the cap'],
    ctx: { stage, honour: grad.honour, average: grad.average },
  });
  return grad;
}

export const reportCards = (g: Game) => g.education.reports ?? [];
export const lastReport = (g: Game) => reportCards(g).at(-1);
export const valedictorianOf = (g: Game) => g.flags.filter((f) => f.startsWith('valedictorian:')).map((f) => f.split(':')[1]);
