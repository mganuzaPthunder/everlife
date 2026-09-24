import type { WorkGame } from './workgames';
import type { PadSound } from '../sound';
import type { StatKey } from './types';
import type { SceneId } from '../components/Scenes';

/* ───────── Every activity gets a little visual mini-game ───────── */

const timing = (title: string, intro: string, steps: string[], zone: number, speed: number, button: string, scene: SceneId): WorkGame =>
  ({ kind: 'timing', title, intro, steps, zone, speed, button, scene });
const simon = (title: string, intro: string, pads: string[], sound?: PadSound): WorkGame => ({ kind: 'simon', title, intro, pads, sound });
const odd = (title: string, intro: string, common: string, oddEmoji: string, label: string, rounds = 3): WorkGame =>
  ({ kind: 'odd', title, intro, common, odd: oddEmoji, label, rounds });
const sort = (title: string, intro: string, bins: { id: string; emoji: string; name: string }[], items: { emoji: string; bin: string }[]): WorkGame =>
  ({ kind: 'sort', title, intro, bins, items });

export const ACTIVITY_GAMES: Record<string, WorkGame> = {
  gym: timing('At the gym', 'Push the bar all the way up, then call the rep at full extension.',
    ['🏋️ Warm-up set', '🏋️ Bench press', '🏋️ Heavy set', '💪 Last rep'], 0.22, 1, 'Rep!', 'gym'),
  meditate: { kind: 'breath', title: 'Ten quiet minutes', intro: 'Breathe in as the circle grows. Tap when it’s at its fullest.', rounds: 4 },
  library: { kind: 'findbook', title: 'At the library', intro: 'Find the book you came for on the shelf.', rounds: 3 },
  doctor: timing('At the clinic', 'Checkup day. Look away if you don’t like needles — the nurse needs the vein.',
    ['💉 Flu shot', '🩸 Blood test', '🩹 All done'], 0.2, 1, 'Now!', 'injection'),
  acting: timing('Acting class', 'Step into the spotlight exactly on your cue.',
    ['🎭 The monologue', '😢 Cry on cue', '😂 The punchline', '🙇 Take a bow'], 0.22, 1, 'Action!', 'stage'),
  cooking: timing('Cooking class', 'Flip each one at the top of the arc.',
    ['🥞 Pancake', '🍳 Omelette', '🥩 Steak', '🍽️ Plate it up'], 0.22, 1, 'Flip!', 'kitchen'),
  surgery: timing('In the surgeon’s chair', 'You’re awake for this one. Every cut has to land on the marked line.',
    ['🔪 First incision', '✨ Reshape', '🪡 Close up'], 0.15, 1.1, 'Cut!', 'surgery'),
  club: simon('On the dance floor', 'Watch the combo light up, then dance it back.', ['💃', '🕺', '✨', '🪩']),
  friend: odd('Meeting someone new', 'Someone in the crowd is waving at you. Tap them before they give up!', '🧍', '🙋', 'waving'),
  vacation: sort('Pack your bags', 'Drop each thing where it belongs before the taxi comes.',
    [{ id: 'case', emoji: '🧳', name: 'Suitcase' }, { id: 'bag', emoji: '🎒', name: 'Carry-on' }],
    [{ emoji: '👕', bin: 'case' }, { emoji: '🛂', bin: 'bag' }, { emoji: '👟', bin: 'case' }, { emoji: '🎧', bin: 'bag' },
      { emoji: '🩴', bin: 'case' }, { emoji: '📱', bin: 'bag' }, { emoji: '🧴', bin: 'case' }, { emoji: '💳', bin: 'bag' }]),
  volunteer: sort('Sort the donations', 'The van just arrived. Put everything in the right box.',
    [{ id: 'food', emoji: '🥫', name: 'Food' }, { id: 'clothes', emoji: '👕', name: 'Clothes' }, { id: 'books', emoji: '📚', name: 'Books' }],
    [{ emoji: '🍞', bin: 'food' }, { emoji: '🧥', bin: 'clothes' }, { emoji: '📖', bin: 'books' }, { emoji: '🥫', bin: 'food' },
      { emoji: '👖', bin: 'clothes' }, { emoji: '📒', bin: 'books' }, { emoji: '🍎', bin: 'food' }, { emoji: '🧦', bin: 'clothes' }, { emoji: '📚', bin: 'books' }]),
};

/** The stat a good performance gives a little extra of. */
export const ACTIVITY_STAT: Record<string, StatKey> = {
  gym: 'health', meditate: 'happiness', library: 'smarts', doctor: 'health', acting: 'looks',
  cooking: 'smarts', surgery: 'looks', club: 'happiness', friend: 'happiness', vacation: 'happiness', volunteer: 'happiness',
};

export const activityGame = (id: string): WorkGame | undefined => ACTIVITY_GAMES[id];

/* ───────── Lessons ───────── */

/** Pad icons and the instrument sound for each music lesson (ids match skills.ts). */
const INSTRUMENT_PADS: Record<string, { pads: string[]; sound: PadSound }> = {
  piano: { pads: ['🎹', '🎵', '🎶', '🎼'], sound: 'piano' },
  guitar: { pads: ['🎸', '🎵', '🎶', '🤘'], sound: 'guitar' },
  violin: { pads: ['🎻', '🎵', '🎶', '🎼'], sound: 'violin' },
  drums: { pads: ['🥁', '🪘', '🔔', '💥'], sound: 'drums' },
  voice: { pads: ['🎤 Ah', '🎵 Oh', '🎶 Ee', '✨ Oo'], sound: 'voice' },
  sax: { pads: ['🎷', '🎵', '🎶', '🎼'], sound: 'sax' },
  trumpet: { pads: ['🎺', '🎵', '🎶', '🎼'], sound: 'trumpet' },
  cello: { pads: ['🎻', '🎵', '🎶', '🎼'], sound: 'cello' },
  ukulele: { pads: ['🪕', '🎵', '🎶', '🌺'], sound: 'ukulele' },
  dj: { pads: ['🔊 Drop', '🎛️ Stab', '💿 Scratch', '📯 Horn'], sound: 'dj' },
};

const SPORT_SCENES: Record<string, { scene: 'goal' | 'hoop' | 'punch' | 'runway' | 'gym'; steps: string[]; button: string }> = {
  soccer: { scene: 'goal', steps: ['⚽ Bottom left', '⚽ Top right', '⚽ The winner'], button: 'Kick!' },
  basketball: { scene: 'hoop', steps: ['🏀 Free throw', '🏀 Three-pointer', '🏀 Buzzer beater'], button: 'Shoot!' },
  boxing: { scene: 'punch', steps: ['🥊 Jab', '🥊 Hook', '🥊 Uppercut'], button: 'Punch!' },
  martial: { scene: 'punch', steps: ['🥋 Strike', '🥋 Block', '🥋 Finish'], button: 'Now!' },
  tennis: { scene: 'goal', steps: ['🎾 Serve', '🎾 Backhand', '🎾 Match point'], button: 'Hit!' },
  swimming: { scene: 'goal', steps: ['🏊 Dive', '🏊 Turn', '🏊 Touch the wall'], button: 'Go!' },
  dance: { scene: 'runway', steps: ['💃 Routine', '✨ The spin', '🎶 Finale'], button: 'Now!' },
  gymnastics: { scene: 'gym', steps: ['🤸 Vault', '🤸 Beam', '🎖️ Landing'], button: 'Go!' },
  running: { scene: 'goal', steps: ['🏃 Start', '🏃 Final bend', '🏁 The line'], button: 'Go!' },
  skating: { scene: 'runway', steps: ['⛸️ Jump', '⛸️ Spin', '🏆 Final pose'], button: 'Jump!' },
};

export function lessonGame(kind: 'music' | 'sports', id: string, name: string): WorkGame {
  if (kind === 'music') {
    const inst = INSTRUMENT_PADS[id] ?? { pads: ['🎵', '🎶', '🎼', '✨'], sound: 'piano' as const };
    const intro = id === 'drums' ? 'Listen to the beat, then drum it back.' : id === 'voice' ? 'Listen to the melody, then sing it back.' : 'Listen to the phrase, then play it back note for note.';
    return simon(`${name} practice`, intro, inst.pads, inst.sound);
  }
  const s = SPORT_SCENES[id] ?? { scene: 'goal' as const, steps: ['🏅 Drill 1', '🏅 Drill 2', '🏆 The big one'], button: 'Now!' };
  return timing(`${name} practice`, 'Coach is watching. Time each one right.', s.steps, 0.22, 1, s.button, s.scene);
}
