import type { Game, ReportCard, Result, SchoolStage } from './types';
import { adjust, log, markUsed, used } from './helpers';
import { clamp, pick, rand } from './util';
import type { ExamPaper } from './types';
import { makeQuestion, type QuizBank } from './workgames';
import { GRAD_PROGRAMS, MAJORS } from './data';

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
  // The third subject rotates by year, so what the Work tab promises is what you sit.
  if (e.stage === 'elementary') {
    const rotation = [SUBJECTS.geography, SUBJECTS.music, SUBJECTS.pe];
    return [SUBJECTS.maths, SUBJECTS.science, rotation[g.age % rotation.length]];
  }
  if (e.stage === 'high') {
    const rotation = [SUBJECTS.geography, SUBJECTS.tech, SUBJECTS.food, SUBJECTS.citizenship];
    return [SUBJECTS.advmaths, SUBJECTS.science, rotation[g.age % rotation.length]];
  }
  // University and graduate school test the course you actually signed up for.
  return COURSE_PAPERS[e.program ?? ''] ?? [SUBJECTS.science, SUBJECTS.advmaths, SUBJECTS.citizenship];
}

/** Each major and graduate programme sits its own paper. */
const COURSE_PAPERS: Record<string, Subject[]> = {
  cs: [SUBJECTS.tech, SUBJECTS.advmaths, SUBJECTS.science],
  eng: [SUBJECTS.advmaths, SUBJECTS.science, SUBJECTS.tech],
  bio: [SUBJECTS.biology, SUBJECTS.science, SUBJECTS.advmaths],
  nursing: [SUBJECTS.biology, SUBJECTS.science, SUBJECTS.citizenship],
  biz: [SUBJECTS.advmaths, SUBJECTS.geography, SUBJECTS.citizenship],
  psych: [SUBJECTS.citizenship, SUBJECTS.biology, SUBJECTS.science],
  edu: [SUBJECTS.citizenship, SUBJECTS.advmaths, SUBJECTS.science],
  jour: [SUBJECTS.geography, SUBJECTS.citizenship, SUBJECTS.science],
  art: [SUBJECTS.music, SUBJECTS.citizenship, SUBJECTS.geography],
  arch: [SUBJECTS.advmaths, SUBJECTS.tech, SUBJECTS.science],
  law: [SUBJECTS.law, SUBJECTS.citizenship, SUBJECTS.geography],
  med: [SUBJECTS.biology, SUBJECTS.science, SUBJECTS.citizenship],
  mba: [SUBJECTS.advmaths, SUBJECTS.geography, SUBJECTS.citizenship],
  dental: [SUBJECTS.biology, SUBJECTS.science, SUBJECTS.advmaths],
  pharmacy: [SUBJECTS.biology, SUBJECTS.science, SUBJECTS.advmaths],
  vetschool: [SUBJECTS.biology, SUBJECTS.science, SUBJECTS.citizenship],
};

/** What this year's paper is called — the last one in a stage is the final exam. */
export const stageLabel = (stage: SchoolStage) =>
  stage === 'elementary' ? 'elementary' : stage === 'high' ? 'high school'
  : stage === 'university' ? 'university' : stage === 'royal' ? 'the Royal Academy' : 'graduate school';

export const finalYear = (g: Game) => inSchool(g) && g.education.yearsLeft <= 0;

export const examTitle = (g: Game) =>
  finalYear(g) ? `Final exam · ${stageLabel(g.education.stage)}` : 'Exam day';

const PER_SUBJECT = 2;

/** Set this year's paper: the same questions the review sheet gives you the answers to. */
export function buildPaper(g: Game): ExamPaper {
  const questions: ExamPaper['questions'] = [];
  for (const subject of examSubjects(g)) {
    for (let n = 0, tries = 0; n < PER_SUBJECT && tries < 20; tries++) {
      const q = makeQuestion(subject.bank);
      if (questions.some((x) => x.q === q.q)) continue;
      questions.push({ subject: subject.name, q: q.q, a: q.a, options: q.options });
      n++;
    }
  }
  return { age: g.age, stage: g.education.stage, questions };
}

/** The paper you'll actually sit: the one you studied, or a fresh one you've never seen. */
export function examPaperFor(g: Game): ExamPaper {
  const held = g.education.paper;
  if (held && held.age === g.age && held.stage === g.education.stage) return held;
  return buildPaper(g);
}

/** The review sheet you can read before the exam — only if you fetched one. */
export const studySheet = (g: Game) => {
  const held = g.education.paper;
  return g.education.reviewSheet && held && held.age === g.age && held.stage === g.education.stage ? held : undefined;
};

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

/** Pick up this year's review sheet — the exam paper, with the answers written on it.
 *  No result card: the sheet itself opens straight away. */
export function takeReviewSheet(g: Game): Result | undefined {
  if (sheetBlock(g)) return;
  const paper = buildPaper(g);
  g.education.paper = paper;
  g.education.reviewSheet = true;
  adjust(g, 'smarts', rand(1, 3));
  log(g, `📄 I picked up the review sheet — all ${paper.questions.length} questions from this year's exam, with the answers.`);
  return undefined;
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
  e.paper = undefined;

  const rawTotal = marks.reduce((s, m) => s + m.total, 0) || 1;
  const rawCorrect = marks.reduce((s, m) => s + m.correct, 0);
  const raw = Math.round((rawCorrect / rawTotal) * 100);
  // The review sheet is worth a real boost — that's the point of fetching it.
  const score = clamp(raw + (reviewed ? 4 : 0) + Math.round((g.stats.smarts - 50) / 10));

  const subjects = marks.map((m) => ({
    name: m.name,
    mark: clamp(Math.round((m.correct / Math.max(1, m.total)) * 100) + (reviewed ? 4 : 0) + rand(-6, 6)),
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

/** A school year that ended without an exam. No report card — there's nothing to report. */
export function missExamYear(g: Game) {
  const e = g.education;
  if (!inSchool(g)) return;
  e.missedExams = (e.missedExams ?? 0) + 1;
  e.reviewSheet = false;
  e.paper = undefined;
  e.grades = clamp(Math.round(e.grades - rand(8, 16)));
  adjust(g, 'happiness', e.examsOff ? 2 : -3);
  // This runs as the new year begins, so the exam it's talking about was last year's.
  log(g, e.examsOff
    ? '📕 No exams for me last year. My grades slipped a little.'
    : `📕 I skipped last year's exam at ${stageLabel(e.stage) === 'the Royal Academy' ? 'the academy' : stageLabel(e.stage)}. My grades slipped.`);
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
  // Sitting every paper in the stage is the price of the top spot.
  const perfect = cards.length > 0 && (e.missedExams ?? 0) === 0 && !e.examsOff;
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

/** Why you can't graduate yet — or null if the cap is ready to throw. */
export function graduateBlock(g: Game): string | null {
  const e = g.education;
  if (!inSchool(g)) return 'Not in school';
  if (g.prison > 0) return 'In prison';
  if (e.yearsLeft > 0) return `Wait ${e.yearsLeft} more year${e.yearsLeft === 1 ? '' : 's'}`;
  if (!e.examsOff && !used(g, 'school:exam')) return `Sit the final ${stageLabel(e.stage) === 'the Royal Academy' ? 'academy' : stageLabel(e.stage)} exam first`;
  return null;
}

/** Walk the stage: hold the ceremony, take the diploma, move on to whatever's next. */
export function graduate(g: Game): Result | undefined {
  const e = g.education;
  if (graduateBlock(g)) return;
  const stage = e.stage;
  const grad = holdGraduation(g, stage);

  e.missedExams = 0;
  if (stage === 'elementary') {
    Object.assign(e, { stage: 'high', yearsLeft: 6 });
    log(g, '🏫 I started high school.');
  } else if (stage === 'royal') {
    e.degrees.push('royal', 'hs');
    log(g, '👑 My royal education is complete. The palace is very proud.');
    e.stage = 'none';
  } else if (stage === 'high') {
    if (grad.honour !== 'fail') {
      e.degrees.push('hs');
      log(g, 'I can apply to university or look for a job from the Work tab.');
    } else {
      log(g, 'I could still earn a GED.');
    }
    e.stage = 'none';
  } else if (stage === 'university') {
    e.degrees.push(`ba:${e.program}`);
    log(g, `🎓 I graduated from university with a degree in ${MAJORS.find((m) => m.id === e.program)?.name}.`);
    Object.assign(e, { stage: 'none', program: undefined });
  } else {
    if (e.program) e.degrees.push(e.program);
    log(g, `🎓 I finished ${GRAD_PROGRAMS.find((p) => p.id === e.program)?.name ?? 'graduate school'}.`);
    Object.assign(e, { stage: 'none', program: undefined });
  }
  return undefined; // the ceremony modal does the talking
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
