/* "Remove mini-games": the same outcomes, decided instantly instead of by playing. */

import type { Game, Result } from './types';
import { escapeResult, heistResult, shopliftResult, startMiniGame } from './actions';
import { finishWorkGame, workGameFor } from './workgames';
import { examSubjects, finishExam } from './school';
import { chance, clamp, rand } from './util';

export const minigamesOff = (g: Game) => g.flags.includes('noMinigames');

export function toggleMinigames(g: Game): Result {
  const off = minigamesOff(g);
  g.flags = off ? g.flags.filter((f) => f !== 'noMinigames') : [...g.flags, 'noMinigames'];
  return off
    ? { emoji: '🎮', title: 'Mini-games are back', text: 'Activities, lessons, work, exams and interviews will ask you to play again.' }
    : { emoji: '⚡', title: 'Mini-games removed', text: 'Everything happens instantly now. Turn them back on any time in Settings.' };
}

/** A work task done without the game: good workers usually do good work. */
export function quickWork(g: Game): Result | undefined {
  if (!g.job) return;
  const task = workGameFor(g.job.careerId);
  const p = clamp(0.3 + g.stats.smarts / 250 + g.job.performance / 400 + Math.random() * 0.25, 0, 1);
  return finishWorkGame(g, Math.round(p * 10), 10, task.title);
}

/** An exam sat without the paper: marks follow your smarts, and the review sheet helps. */
export function quickExam(g: Game): Result {
  const reviewed = !!g.education.reviewSheet;
  const p = clamp(0.3 + g.stats.smarts / 120 + (reviewed ? 0.15 : 0), 0.05, 0.98);
  const marks = examSubjects(g).map((s) => {
    const total = 5;
    let correct = 0;
    for (let i = 0; i < total; i++) if (chance(p)) correct++;
    return { name: s.name, correct, total };
  });
  return finishExam(g, marks);
}

const SHOPLIFT_ODDS: Record<string, number> = { candy: 0.75, shades: 0.55, bag: 0.35 };

export function quickShoplift(g: Game, itemId: string): Result | undefined {
  if (!startMiniGame(g, 'shoplift')) return;
  return shopliftResult(g, chance(SHOPLIFT_ODDS[itemId] ?? 0.5), itemId);
}

export function quickHeist(g: Game): Result | undefined {
  if (!startMiniGame(g, 'heist')) return;
  const roll = Math.random();
  if (roll < 0.45) return heistResult(g, 'caught', 0);
  if (roll < 0.65) return heistResult(g, 'empty', 0);
  return heistResult(g, 'escaped', rand(4, 48) * 10_000); // about what the vault game pays
}

export function quickEscape(g: Game): Result | undefined {
  if (!startMiniGame(g, 'escape')) return;
  return escapeResult(g, chance(0.3));
}
