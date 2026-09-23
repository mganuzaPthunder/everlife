import type { Game, Result } from './types';
import type { SceneId } from '../components/Scenes';
import { adjust } from './helpers';
import { OFFICE_TASKS_PER_YEAR, officeTasksLeft } from './office';
import { clamp, money, pick, rand } from './util';

/* ───────── What each job's mini-game looks like ───────── */

export type WorkGame =
  | { kind: 'timing'; title: string; intro: string; steps: string[]; zone: number; speed: number; button: string; scene?: SceneId }
  | { kind: 'simon'; title: string; intro: string; pads: string[] }
  | { kind: 'quiz'; title: string; intro: string; bank: QuizBank }
  | { kind: 'tap'; title: string; intro: string; good: string; bad: string }
  | { kind: 'stealth'; title: string; intro: string; moves: number; button: string }
  /** Tap the misspelled word in a sentence. */
  | { kind: 'proof'; title: string; intro: string; rounds: number }
  /** Find the one that doesn't belong in a grid. */
  | { kind: 'odd'; title: string; intro: string; common: string; odd: string; label: string; rounds: number }
  /** Drop each item into the right bin. */
  | { kind: 'sort'; title: string; intro: string; bins: { id: string; emoji: string; name: string }[]; items: { emoji: string; bin: string }[] }
  /** Put the steps in the right order. */
  | { kind: 'order'; title: string; intro: string; sets: string[][] }
  /** Breathe with the circle. */
  | { kind: 'breath'; title: string; intro: string; rounds: number }
  /** Find the matching book on the shelf. */
  | { kind: 'findbook'; title: string; intro: string; rounds: number }
  /** Dress for the occasion — pick the right outfit for each event. */
  | { kind: 'outfit'; title: string; intro: string; rounds: number };

export type QuizBank = 'diagnose' | 'vet' | 'law' | 'math' | 'kidmath' | 'kind' | 'science' | 'music' | 'sports' | 'geo' | 'food' | 'etiquette' | 'tech';

const timing = (title: string, intro: string, steps: string[], zone = 0.2, speed = 1, button = 'Now!', scene?: SceneId): WorkGame => ({ kind: 'timing', title, intro, steps, zone, speed, button, scene });
export const breath = (title: string, intro: string, rounds = 4): WorkGame => ({ kind: 'breath', title, intro, rounds });
export const findbook = (title: string, intro: string, rounds = 3): WorkGame => ({ kind: 'findbook', title, intro, rounds });
export const outfit = (title: string, intro: string, rounds = 3): WorkGame => ({ kind: 'outfit', title, intro, rounds });
const simon = (title: string, intro: string, pads: string[]): WorkGame => ({ kind: 'simon', title, intro, pads });
const quiz = (title: string, intro: string, bank: QuizBank): WorkGame => ({ kind: 'quiz', title, intro, bank });
const tap = (title: string, intro: string, good: string, bad: string): WorkGame => ({ kind: 'tap', title, intro, good, bad });
const sneak = (title: string, intro: string, moves = 4, button = 'Move'): WorkGame => ({ kind: 'stealth', title, intro, moves, button });
const proof = (title: string, intro: string, rounds = 3): WorkGame => ({ kind: 'proof', title, intro, rounds });
const odd = (title: string, intro: string, common: string, oddEmoji: string, label: string, rounds = 3): WorkGame => ({ kind: 'odd', title, intro, common, odd: oddEmoji, label, rounds });
const sort = (title: string, intro: string, bins: { id: string; emoji: string; name: string }[], items: { emoji: string; bin: string }[]): WorkGame => ({ kind: 'sort', title, intro, bins, items });
const order = (title: string, intro: string, sets: string[][]): WorkGame => ({ kind: 'order', title, intro, sets });

const GAMES: Record<string, WorkGame> = {
  neurosurgeon: timing('Brain surgery', 'The zones are tiny. One slip and… let’s not think about it.', ['🧠 Open carefully', '🔬 Find the tumor', '✂️ Remove it', '🪡 Close up'], 0.11, 1.2, 'Now!', 'surgery'),
  cardiologist: simon('Restore the heart rhythm', 'Watch the heartbeat pattern, then tap it back exactly.', ['❤️', '💙', '💜', '💛']),
  doctor: quiz('Diagnose the patient', 'Read the symptoms and pick the right diagnosis before time runs out.', 'diagnose'),
  pediatrician: quiz('Diagnose the little patient', 'Kids can’t always explain. Read the symptoms carefully!', 'diagnose'),
  vet: quiz('Help the animal', 'What’s wrong with this furry (or feathery) patient?', 'vet'),
  lawyer: quiz('OBJECTION!', 'Pick the right objection before the judge moves on.', 'law'),
  accountant: quiz('Balance the books', 'Crunch the numbers before the deadline.', 'math'),
  exec: quiz('Board meeting math', 'Impress the board with quick numbers.', 'math'),
  realtor: quiz('Close the deal', 'Calculate the numbers before the buyer walks.', 'math'),
  receptionist: tap('Answer the phones', 'Pick up the ringing phones ☎️ — ignore the spam calls 🤖!', '☎️', '🤖'),
  counselor: quiz('Session time', 'Choose the kindest, most helpful response.', 'kind'),
  dev: simon('Ship the code', 'Watch the code sequence, then type it back without a bug.', ['{ }', '( )', '< />', '[ ]']),
  gamedev: simon('Build the level', 'Repeat the combo to lay out the new level.', ['🕹️', '👾', '⭐', '🍄']),
  engineer: timing('Place the beams', 'Drop each beam right on the support.', ['🏗️ First beam', '🔩 Bolt it', '🏗️ Second beam', '🌉 Final span'], 0.2, 1, 'Now!', 'beam'),
  architect: timing('Build the model', 'Place each piece right in the zone.', ['📐 Foundation', '🧱 Walls', '🪟 Windows', '🏠 Roof'], 0.2, 1, 'Now!', 'beam'),
  scientist: simon('Mix the formula', 'Repeat the exact mixing order or it explodes. Probably.', ['🧪', '⚗️', '🧬', '🔬']),
  police: tap('Catch the suspects', 'Tap the suspects 🦹 — not the innocent citizens 🧍!', '🦹', '🧍'),
  firefighter: tap('Put out the fires', 'Spray the fires 🔥 — don’t soak the cats 🐱!', '🔥', '🐱'),
  lifeguard: timing('Throw the ring', 'Time your throw to land the float next to the swimmer.', ['🛟 Swimmer 1', '🛟 Swimmer 2', '🛟 Swimmer 3'], 0.2, 1, 'Now!', 'goal'),
  barista: tap('Morning rush', 'Serve the coffee orders ☕ — don’t hand out the spills 💦!', '☕', '💦'),
  fastfood: tap('Lunch rush', 'Serve the burgers 🍔 — don’t serve the burnt ones 🔥!', '🍔', '🔥'),
  cashier: tap('Checkout line', 'Scan the groceries 🛒 — not the random pigeons 🐦!', '🛒', '🐦'),
  bartender: tap('Happy hour', 'Serve the drinks 🍹 — skip the broken glasses 💥!', '🍹', '💥'),
  warehouse: tap('Pack the orders', 'Grab the boxes 📦 — not the bombs 💣!', '📦', '💣'),
  babysitter: tap('Toy cleanup', 'Pick up the toys 🧸 before the baby wakes — avoid the spiders 🕷️!', '🧸', '🕷️'),
  dogwalker: tap('Walk the dogs', 'Catch the pups 🐕 — don’t chase the cats 🐈!', '🐕', '🐈'),
  musician: simon('Play the riff', 'Listen to the riff, then play it back.', ['🎵', '🎶', '🎸', '🥁']),
  popstar: simon('Nail the choreo', 'Copy the dance combo for the crowd!', ['💃', '🎤', '✨', '🕺']),
  actor: timing('Hit your marks', 'Deliver every beat at exactly the right moment.', ['😢 Cry on cue', '😂 Land the joke', '😱 The big scream', '🙇 Take a bow'], 0.2, 1, 'Now!', 'stage'),
  model: timing('Runway walk', 'Strike each pose as the flash goes off.', ['📸 Pose', '💃 Walk', '✨ Turn', '😘 Final pose'], 0.2, 1, 'Now!', 'runway'),
  influencer: tap('Go viral', 'Like the trending posts ❤️ — block the trolls 👹!', '❤️', '👹'),
  athlete: timing('Big game', 'Time every shot perfectly.', ['🏀 Free throw', '⚽ Penalty kick', '🏈 Field goal', '🏆 Game winner'], 0.17, 1.1, 'Shoot!', 'hoop'),
  astronaut: timing('Space mission', 'Fire the thrusters at exactly the right moment.', ['🚀 Liftoff', '🛰️ Dock', '🌕 Land', '🌍 Return home'], 0.15, 1.1, 'Fire!', 'space'),
  mafia: { kind: 'stealth', title: 'The job', intro: 'Move only when the cops look away. Four moves to get the goods.', moves: 4, button: 'Move 🕴️' },
  president: tap('Campaign trail', 'Shake hands with voters 🤝 — dodge the tomatoes 🍅!', '🤝', '🍅'),
  journalist: proof('Edit tomorrow’s front page', 'Read each line and tap the misspelled word before the paper goes to print.'),
  teacher: proof('Grade the essays', 'Find the spelling mistake in each student’s sentence.'),
  dentist: odd('Find the cavity', 'Scan the x-ray and tap the tooth that isn’t healthy.', '🦷', '🦠', 'cavity'),
  nurse: sort('Stock the supply cart', 'Tap the right shelf for each supply.',
    [{ id: 'med', emoji: '💊', name: 'Medicine' }, { id: 'aid', emoji: '🩹', name: 'First aid' }, { id: 'clean', emoji: '🧴', name: 'Cleaning' }],
    [{ emoji: '💊', bin: 'med' }, { emoji: '💉', bin: 'med' }, { emoji: '🩹', bin: 'aid' }, { emoji: '🩺', bin: 'aid' }, { emoji: '🧴', bin: 'clean' }, { emoji: '🧼', bin: 'clean' }, { emoji: '🧻', bin: 'clean' }, { emoji: '🌡️', bin: 'aid' }]),
  chef: order('Cook the signature dish', 'Tap the steps in the right order.', [
    ['🧅 Chop the onions', '🔥 Heat the pan', '🥩 Sear the meat', '🍽️ Plate and garnish'],
    ['💧 Boil the water', '🍝 Add the pasta', '🥫 Toss in the sauce', '🧀 Grate the cheese on top'],
    ['🥚 Crack the eggs', '🥛 Whisk with milk', '🍳 Pour into the pan', '🌿 Fold and serve'],
  ]),
  surgeon: order('Prep for surgery', 'Follow the surgical checklist in order.', [
    ['🧼 Scrub in', '🧤 Gloves on', '💤 Anaesthesia', '🔪 First incision'],
    ['🩻 Check the scan', '✍️ Mark the site', '🧑‍⚕️ Team time-out', '🔪 Begin'],
  ]),
  pilot: order('Pre-flight checklist', 'Run the checklist in the correct order.', [
    ['📋 Walk-around check', '⛽ Fuel check', '🛫 Request clearance', '🎚️ Throttle up'],
    ['🌦️ Check the weather', '🧭 Set the course', '📡 Contact the tower', '🛬 Begin descent'],
  ]),

  designer: simon('Match the palette', 'The client wants these colors in this order.', ['🔴', '🟣', '🔵', '🟡']),

  /* everyday jobs */
  baker: timing('Morning bake', 'Pull each batch out at exactly the right moment.', ['🥖 Baguettes', '🥐 Croissants', '🍰 Cake', '🧁 Cupcakes'], 0.2, 1, 'Now!', 'kitchen'),
  florist: simon('Arrange the bouquet', 'The bride wants the flowers in this exact order.', ['🌹', '🌷', '🌻', '🌸']),
  hairstylist: timing('Big makeover', 'Snip and style at the perfect moment.', ['✂️ Trim', '💨 Blow-dry', '🌀 Curl', '✨ Finish'], 0.2, 1, 'Now!', 'scissors'),
  makeup: timing('Red carpet glam', 'Steady hands for every stroke.', ['👁️ Eyeliner', '💋 Lipstick', '✨ Highlight', '💄 Final touch'], 0.2, 1, 'Now!', 'scissors'),
  tattoo: timing('Fine-line tattoo', 'Steady needle — one shaky line and it’s forever.', ['🖋️ Outline', '🌙 Shading', '⭐ Details', '✨ Final line'], 0.15, 1, 'Now!', 'tattoo'),
  zookeeper: tap('Feeding time', 'Feed the giraffes 🦒 — don’t get near the lions 🦁!', '🦒', '🦁'),
  trainer: timing('Client workout', 'Count each rep at the perfect moment.', ['🏋️ Squat', '💪 Curl', '🤸 Burpee', '🏃 Sprint'], 0.2, 1, 'Now!', 'gym'),
  photographer: timing('Photo shoot', 'Snap the shot at the perfect moment.', ['📸 Portrait', '🌅 Sunset', '🐦 Bird in flight', '💍 The kiss'], 0.2, 1, 'Now!', 'camera'),
  mechanic: simon('Fix the engine', 'Use the tools in the right order.', ['🔧', '🔩', '⚙️', '🪛']),
  flightattendant: tap('Cabin service', 'Serve the passengers 🥤 — avoid the turbulence 🌪️!', '🥤', '🌪️'),
  paramedic: quiz('Emergency call', 'Quick — what’s wrong with the patient?', 'diagnose'),
  electrician: simon('Wire it up', 'Connect the wires in the right order. Don’t get zapped!', ['🔴', '🔵', '🟡', '🟢']),
  librarian: tap('Reshelve the books', 'Grab the books 📚 — confiscate the spaghetti 🍝!', '📚', '🍝'),
  fashiondesigner: simon('Design the collection', 'Match the runway lineup.', ['👗', '👠', '👜', '🧥']),
  stockbroker: tap('Trading floor', 'Buy the rising stocks 📈 — dodge the crashes 📉!', '📈', '📉'),
  pharmacist: quiz('Fill the prescription', 'What does the patient have?', 'diagnose'),
  judge: quiz('Rule on the objection', 'The lawyers are arguing. What’s the right call?', 'law'),

  /* music */
  guitarist: simon('Shred the solo', 'Play the riff back note for note.', ['E', 'A', 'D', 'G']),
  pianist: simon('Concert piece', 'Play the melody back perfectly.', ['C', 'E', 'G', 'B']),
  violinist: simon('Orchestra solo', 'Repeat the phrase on your violin.', ['G', 'D', 'A', 'E']),
  drummer: simon('Drum fill', 'Copy the beat!', ['🥁', '🪘', '🔔', '💥']),
  singer: simon('Hit the notes', 'Sing the melody back.', ['Do', 'Re', 'Mi', 'Fa']),
  saxophonist: simon('Jazz improv', 'Answer the call with the same phrase.', ['🎷', '🎶', '🎵', '✨']),
  dj: tap('Drop the beat', 'Hit the bangers 🔊 — skip the record scratches 💿!', '🔊', '💿'),
  orchestra: simon('Symphony night', 'Follow the conductor’s cues.', ['🎻', '🎺', '🎷', '🥁']),
  musicteacher: quiz('Music class', 'Your student needs help with rhythm math.', 'kidmath'),

  /* sports */
  basketball: timing('Game night', 'Time every shot.', ['🏀 Layup', '🏀 Three-pointer', '🏀 Free throw', '🏆 Buzzer beater'], 0.17, 1.1, 'Shoot!', 'hoop'),
  soccer: timing('Match day', 'Strike at the perfect moment.', ['⚽ Pass', '⚽ Cross', '⚽ Free kick', '🏆 Penalty'], 0.17, 1.1, 'Kick!', 'goal'),
  tennis: timing('Grand Slam match', 'Swing at the perfect moment.', ['🎾 Serve', '🎾 Return', '🎾 Volley', '🏆 Match point'], 0.17, 1.15, 'Swing!'),
  swimmer: timing('Olympic final', 'Perfect timing on every stroke.', ['🏊 Dive', '🔄 Flip turn', '💨 Final lap', '🏁 Touch the wall'], 0.17, 1.1, 'Go!', 'goal'),
  volleyball: timing('Championship set', 'Time every hit.', ['🏐 Serve', '🏐 Set', '🏐 Spike', '🏆 Match point'], 0.2, 1, 'Now!', 'goal'),
  baseball: timing('World Series', 'Swing when the pitch is in the zone.', ['⚾ Fastball', '⚾ Curveball', '⚾ Slider', '🏆 Walk-off'], 0.15, 1.2, 'Swing!', 'goal'),
  boxer: timing('Title fight', 'Land every punch.', ['🥊 Jab', '🥊 Hook', '🥊 Uppercut', '🏆 Knockout'], 0.16, 1.2, 'Punch!', 'punch'),
  gymnast: timing('Olympic routine', 'Stick every landing.', ['🤸 Vault', '🤸 Beam', '🤸 Bars', '🎖️ Floor'], 0.14, 1.1, 'Land!', 'gym'),
  skater: timing('Free skate', 'Land every jump.', ['⛸️ Axel', '⛸️ Lutz', '⛸️ Spin', '🏆 Final pose'], 0.15, 1.1, 'Jump!', 'runway'),
  sprinter: timing('100m final', 'Perfect start and finish.', ['🏃 Blocks', '💨 Drive', '⚡ Top speed', '🏁 Lean'], 0.16, 1.25, 'Go!', 'gym'),
  golfer: timing('Final round', 'Swing with perfect tempo.', ['⛳ Drive', '⛳ Approach', '⛳ Chip', '🏆 Putt'], 0.15, 1, 'Now!', 'goal'),
  coach: tap('Practice drills', 'High-five your players 🙌 — avoid the fumbles 🤦!', '🙌', '🤦'),
};

/* ───────── Task families: every job draws from its signature task + 1–2 families (10+ variants) ───────── */

const FAMILIES: Record<string, WorkGame[]> = {
  medical: [
    sort('Sort the pharmacy', 'Put every item on the right shelf.',
      [{ id: 'pill', emoji: '💊', name: 'Pills' }, { id: 'cold', emoji: '🧊', name: 'Cold storage' }, { id: 'tool', emoji: '🔧', name: 'Equipment' }],
      [{ emoji: '💊', bin: 'pill' }, { emoji: '🟡', bin: 'pill' }, { emoji: '💉', bin: 'cold' }, { emoji: '🧪', bin: 'cold' }, { emoji: '🩺', bin: 'tool' }, { emoji: '🔬', bin: 'tool' }, { emoji: '🌡️', bin: 'tool' }]),
    odd('Read the x-ray', 'One bone has a hairline fracture. Tap it.', '🦴', '🦵', 'fracture'),
    proof('Check the patient chart', 'The chart has typos. Tap the misspelled word.'),
    order('Emergency protocol', 'Put the emergency steps in order.', [
      ['📞 Call for help', '🫀 Check the pulse', '🚑 Start CPR', '⚡ Use the defibrillator'],
      ['🧼 Wash hands', '🧤 Put on gloves', '🩹 Clean the wound', '🎗️ Bandage it'],
    ]),
    timing('Stitch the wound', 'Place each stitch right in the zone.', ['🪡 Stitch 1', '🪡 Stitch 2', '🪡 Stitch 3', '🩹 Bandage'], 0.2, 1, 'Now!', 'surgery'),
    simon('Read the heart monitor', 'Repeat the rhythm you see on the monitor.', ['💓', '💗', '💖', '💘']),
    quiz('Morning rounds', 'Diagnose each patient on your rounds.', 'diagnose'),
    tap('Flu shot clinic', 'Vaccinate the patients 💉 — don’t poke the teddy bears 🧸!', '💉', '🧸'),
    tap('Germ patrol', 'Zap the germs 🦠 — leave the good cells 🔵 alone!', '🦠', '🔵'),
    timing('Draw blood', 'Find the vein on the first try.', ['🩸 Left arm', '🩸 Right arm', '🩸 Finger prick'], 0.16, 1, 'Now!', 'injection'),
    simon('Sort the medicine', 'Hand out the pills in the right order.', ['💊', '🟡', '🔵', '🟣']),
    quiz('Science check-up', 'The med students have questions for you.', 'science'),
    timing('Set the broken bone', 'Line up the bone perfectly.', ['🦴 Align', '🦴 Hold', '🩼 Cast', '✅ X-ray'], 0.2, 1, 'Now!', 'surgery'),
    tap('Busy ER', 'Help the patients 🤒 — ignore the prank calls 🤡!', '🤒', '🤡'),
  ],
  rescue: [
    order('Emergency response', 'Put the response steps in order.', [
      ['📞 Take the call', '🚨 Sirens on', '🧯 Handle the scene', '📝 File the report'],
      ['🔍 Assess the danger', '🙋 Get people out', '💦 Put it out', '🚑 Check for injuries'],
    ]),
    odd('Scan the crowd', 'One person needs help. Tap them.', '🧍', '🆘', 'person in trouble'),
    tap('Rescue mission', 'Save the people 🙋 — dodge the falling debris 🪨!', '🙋', '🪨'),
    timing('Ladder climb', 'Plant each foot at the right moment.', ['🪜 Rung 1', '🪜 Rung 2', '🪜 Rung 3', '🙌 Grab them!'], 0.2, 1, 'Now!', 'beam'),
    sneak('Stakeout', 'Get closer to the suspect only when they’re not looking.', 4, 'Creep 👀'),
    simon('Radio codes', 'Repeat the dispatch code exactly.', ['🔴', '🔵', '🟢', '🟡']),
    quiz('First aid test', 'What’s wrong with this person?', 'diagnose'),
    tap('Traffic control', 'Wave through the cars 🚗 — stop the speeders 🏎️!', '🚗', '🏎️'),
    timing('Hose control', 'Aim the water at the flames.', ['💦 Window 1', '💦 Window 2', '💦 Roof', '🔥 Out!'], 0.2, 1, 'Now!', 'kitchen'),
    tap('Catch the escaped animals', 'Grab the pets 🐶 — not the skunks 🦨!', '🐶', '🦨'),
    timing('High-speed chase', 'Take each turn perfectly.', ['🚓 Left turn', '🚓 Right turn', '🚓 Bridge', '🛑 Cut them off'], 0.17, 1.15, 'Now!', 'plane'),
    quiz('Map it out', 'Where does this emergency call come from?', 'geo'),
  ],
  law: [
    proof('Proofread the contract', 'One word is misspelled in every clause. Tap it.'),
    order('Trial order', 'Put the stages of the trial in order.', [
      ['⚖️ Opening statement', '👥 Witnesses', '🔍 Cross-examination', '🙇 Closing argument'],
      ['📄 File the motion', '📅 Set a hearing', '🗣️ Argue the case', '🔨 Verdict'],
    ]),
    odd('Spot the forgery', 'One signature doesn’t match. Tap it.', '✍️', '🖊️', 'forged signature'),
    quiz('Courtroom showdown', 'Object at the right time!', 'law'),
    simon('Cite the precedent', 'Repeat the case files in order.', ['📁', '📂', '🗂️', '📜']),
    tap('Evidence room', 'Grab the evidence 🔍 — not the coffee cups ☕!', '🔍', '☕'),
    timing('Closing argument', 'Pause for effect at exactly the right moments.', ['🎤 Opening line', '⏸️ Dramatic pause', '👉 The reveal', '🙇 Rest your case'], 0.2, 1, 'Now!', 'stage'),
    quiz('Contract math', 'Calculate the settlement numbers.', 'math'),
    tap('Paperwork avalanche', 'Sign the contracts ✍️ — shred the forgeries 🥸!', '✍️', '🥸'),
    simon('Gavel rhythm', 'Order in the court! Repeat the pattern.', ['🔨', '⚖️', '📜', '🏛️']),
    quiz('Client counseling', 'Your client is stressed. Pick the kindest reply.', 'kind'),
    timing('Cross-examination', 'Strike when the witness slips up.', ['❓ Question 1', '❓ Question 2', '❓ Question 3', '💥 Gotcha!'], 0.2, 1, 'Now!', 'stage'),
    quiz('International case', 'Which country is this case about?', 'geo'),
  ],
  tech: [
    odd('Find the bug', 'One line of code is broken. Tap it.', '🟩', '🟥', 'broken line'),
    proof('Fix the documentation', 'The docs have typos. Tap the misspelled word.'),
    order('Ship it properly', 'Put the release steps in order.', [
      ['💻 Write the code', '🧪 Run the tests', '👀 Code review', '🚀 Deploy'],
      ['🐛 Reproduce the bug', '🔍 Find the cause', '🔧 Fix it', '✅ Add a test'],
    ]),
    simon('Debug the code', 'Repeat the fix sequence.', ['{ }', '( )', '< />', '[ ]']),
    tap('Squash the bugs', 'Squash the bugs 🐛 — don’t delete the features ✨!', '🐛', '✨'),
    quiz('Tech trivia', 'Your coworker is quizzing you.', 'tech'),
    timing('Deploy on time', 'Push each release at the right moment.', ['🚀 Build', '🧪 Test', '📦 Ship', '✅ Live'], 0.2, 1, 'Now!', 'lab'),
    quiz('Budget the project', 'Crunch the project numbers.', 'math'),
    simon('Circuit board', 'Wire the circuit in order.', ['🔴', '🟢', '🔵', '🟡']),
    tap('Server fires', 'Reboot the crashing servers 🔥 — leave the healthy ones 🟢!', '🔥', '🟢'),
    timing('Build the prototype', 'Assemble each part perfectly.', ['🔩 Frame', '⚙️ Gears', '🔋 Power', '💡 Switch on'], 0.2, 1, 'Now!', 'beam'),
    quiz('Lab report', 'Answer the science questions.', 'science'),
    simon('Password pattern', 'Enter the security pattern.', ['🔑', '🔒', '🛡️', '🧬']),
  ],
  business: [
    proof('Proofread the pitch deck', 'Investors are watching — tap the typo.'),
    order('Close the deal', 'Put the sales steps in order.', [
      ['📞 First contact', '📊 The pitch', '🤝 Negotiate', '✍️ Sign the contract'],
    ]),
    quiz('Quarterly report', 'Get the numbers right.', 'math'),
    tap('Stock ticker', 'Buy the green stocks 📈 — sell before the red ones 📉!', '📈', '📉'),
    simon('Meeting agenda', 'Run the meeting in the right order.', ['📊', '💼', '📅', '☕']),
    timing('Handshake deal', 'Seal each deal with perfect timing.', ['🤝 Intro', '💬 Pitch', '📝 Terms', '✍️ Sign'], 0.2, 1, 'Now!', 'stage'),
    tap('Inbox zero', 'Answer the important emails 📧 — delete the spam 🗑️!', '📧', '🗑️'),
    quiz('Global expansion', 'Where is the new office opening?', 'geo'),
    timing('Presentation', 'Click to the next slide at just the right moment.', ['📊 Slide 1', '📈 Slide 2', '💡 Slide 3', '🎉 Q&A'], 0.2, 1, 'Now!', 'stage'),
    simon('Filing system', 'File the folders in order.', ['📁', '📂', '🗃️', '🗄️']),
    tap('Networking event', 'Collect the business cards 💳 — avoid the pushy salespeople 🗣️!', '💳', '🗣️'),
    quiz('Client call', 'Say the right thing to the upset client.', 'kind'),
  ],
  school: [
    proof('Mark the spelling test', 'Tap the word each student spelled wrong.'),
    sort('Tidy the classroom', 'Put everything back where it belongs.',
      [{ id: 'book', emoji: '📚', name: 'Books' }, { id: 'art', emoji: '🎨', name: 'Art supplies' }, { id: 'sport', emoji: '🏀', name: 'Sports gear' }],
      [{ emoji: '📕', bin: 'book' }, { emoji: '📗', bin: 'book' }, { emoji: '🖍️', bin: 'art' }, { emoji: '🖌️', bin: 'art' }, { emoji: '⚽', bin: 'sport' }, { emoji: '🏐', bin: 'sport' }]),
    order('Plan the lesson', 'Put the lesson plan in order.', [
      ['👋 Greet the class', '📖 Teach the lesson', '✏️ Practice time', '📝 Give homework'],
    ]),
    quiz('Math class', 'Answer the students’ questions.', 'kidmath'),
    quiz('Science class', 'Teach today’s science lesson.', 'science'),
    tap('Hall monitor', 'Send students to class 🧑‍🎓 — confiscate the phones 📱!', '🧑‍🎓', '📱'),
    simon('Attendance', 'Call out the seating chart in order.', ['🍎', '📚', '✏️', '🎒']),
    timing('Grade the papers', 'Stamp each paper at the right moment.', ['📝 A+', '📝 B', '📝 A', '⭐ Gold star'], 0.2, 1, 'Now!', 'lab'),
    quiz('Geography bee', 'Help run the school geography bee.', 'geo'),
    tap('Field trip', 'Count the kids 👧 — don’t count the pigeons 🐦!', '👧', '🐦'),
    quiz('Office hours', 'A student needs advice. Be kind!', 'kind'),
    simon('Story time', 'Act out the story in the right order.', ['🐻', '🦊', '🐰', '🦉']),
    timing('Recess bell', 'Ring the bell right on time.', ['🔔 Recess', '🔔 Lunch', '🔔 Home time'], 0.2, 1, 'Now!', 'stage'),
  ],
  creative: [
    proof('Proof the caption', 'The caption has a typo. Tap the wrong word.'),
    odd('Pick the best shot', 'One photo is out of focus. Tap it.', '🖼️', '🌫️', 'blurry photo'),
    order('Design process', 'Put the creative process in order.', [
      ['💡 Brainstorm', '✏️ Sketch', '🎨 Add color', '📤 Deliver to the client'],
      ['📋 Client brief', '🔍 Research', '🖥️ Design', '✅ Final approval'],
    ]),
    simon('Color palette', 'Match the palette in order.', ['🔴', '🟣', '🔵', '🟡']),
    timing('Perfect shot', 'Snap at the perfect moment.', ['📸 Sunrise', '📸 Portrait', '📸 Action', '📸 Golden hour'], 0.2, 1, 'Now!', 'camera'),
    tap('Brainstorm', 'Grab the good ideas 💡 — toss the clichés 🥱!', '💡', '🥱'),
    quiz('Deadline math', 'Figure out the budget for the shoot.', 'math'),
    simon('Storyboard', 'Arrange the scenes in order.', ['🎬', '🌅', '💥', '🎉']),
    timing('Ink the lines', 'Steady hand for every line.', ['🖋️ Line 1', '🖋️ Line 2', '🖋️ Curve', '✨ Signature'], 0.16, 1, 'Now!', 'tattoo'),
    tap('Photo edit', 'Keep the good photos 🖼️ — delete the blurry ones 🌫️!', '🖼️', '🌫️'),
    quiz('World inspiration', 'Where is the photo shoot?', 'geo'),
    simon('Fashion line', 'Arrange the runway looks.', ['👗', '👠', '👜', '🧥']),
    timing('Gallery opening', 'Hang each painting at the right spot.', ['🖼️ Left', '🖼️ Center', '🖼️ Right', '🎉 Open doors'], 0.2, 1, 'Now!', 'camera'),
  ],
  beauty: [
    timing('Precision cut', 'Snip at exactly the right moment.', ['✂️ Fringe', '✂️ Layers', '✂️ Ends', '💨 Style'], 0.2, 1, 'Now!', 'scissors'),
    simon('Nail art', 'Paint the nails in the right color order.', ['💅', '🌸', '✨', '💖']),
    tap('Salon rush', 'Serve the clients 💇 — dodge the flying hairspray 💨!', '💇', '💨'),
    timing('Winged eyeliner', 'Perfect wings every time.', ['👁️ Left wing', '👁️ Right wing', '✨ Glitter', '💋 Lips'], 0.15, 1, 'Now!', 'scissors'),
    simon('Braid pattern', 'Repeat the braid pattern.', ['🎀', '💫', '🌸', '⭐']),
    quiz('Client chat', 'Keep your client happy.', 'kind'),
    tap('Product shelf', 'Stock the good products 🧴 — toss the expired ones 🤢!', '🧴', '🤢'),
    timing('Blow-dry', 'Keep the dryer steady.', ['💨 Roots', '💨 Mid', '💨 Ends', '✨ Shine'], 0.2, 1, 'Now!', 'scissors'),
    simon('Color mixing', 'Mix the hair dye in order.', ['🟠', '🟣', '🔴', '🟡']),
    quiz('Fashion week', 'Which city is hosting the show?', 'geo'),
  ],
  food: [
    sort('Put away the delivery', 'Sort the ingredients into the right place.',
      [{ id: 'fridge', emoji: '🧊', name: 'Fridge' }, { id: 'pantry', emoji: '🥫', name: 'Pantry' }, { id: 'produce', emoji: '🥬', name: 'Produce' }],
      [{ emoji: '🥛', bin: 'fridge' }, { emoji: '🧀', bin: 'fridge' }, { emoji: '🥫', bin: 'pantry' }, { emoji: '🍝', bin: 'pantry' }, { emoji: '🥬', bin: 'produce' }, { emoji: '🥕', bin: 'produce' }, { emoji: '🍎', bin: 'produce' }]),
    order('Follow the recipe', 'Tap the steps in the right order.', [
      ['📖 Read the recipe', '🥣 Mix the batter', '🔥 Bake it', '🎂 Decorate'],
      ['🧅 Prep the veg', '🍲 Start the broth', '🍜 Add noodles', '🥢 Serve hot'],
    ]),
    odd('Check the fridge', 'One thing has gone bad. Tap it.', '🥬', '🤢', 'spoiled item'),
    timing('Flip it!', 'Flip at the perfect moment.', ['🥞 Pancake', '🍳 Egg', '🥩 Steak', '🍔 Burger'], 0.2, 1, 'Now!', 'kitchen'),
    simon('Recipe order', 'Add the ingredients in order.', ['🧂', '🧈', '🥚', '🍯']),
    tap('Order up!', 'Serve the orders 🍽️ — don’t serve the burnt food 🔥!', '🍽️', '🔥'),
    quiz('Food critic', 'The critic asks tricky food questions.', 'food'),
    timing('Pour the drink', 'Stop pouring right at the line.', ['☕ Latte', '🍵 Tea', '🥤 Smoothie', '🍹 Mocktail'], 0.2, 1, 'Now!', 'kitchen'),
    tap('Kitchen chaos', 'Catch the ingredients 🥕 — swat the flies 🪰!', '🥕', '🪰'),
    simon('Plating', 'Plate the dish in the right order.', ['🍚', '🥩', '🥦', '🌿']),
    quiz('Split the bill', 'Do the math for the table.', 'math'),
    timing('Slice and dice', 'Chop at a steady rhythm.', ['🔪 Onion', '🔪 Carrot', '🔪 Pepper', '🔪 Herbs'], 0.2, 1, 'Now!', 'kitchen'),
    tap('Taste test', 'Keep the tasty ones 😋 — toss the gross ones 🤮!', '😋', '🤮'),
  ],
  service: [
    sort('Sort the mail', 'Send each item to the right bin.',
      [{ id: 'letter', emoji: '✉️', name: 'Letters' }, { id: 'parcel', emoji: '📦', name: 'Parcels' }, { id: 'bin', emoji: '🗑️', name: 'Junk' }],
      [{ emoji: '✉️', bin: 'letter' }, { emoji: '💌', bin: 'letter' }, { emoji: '📦', bin: 'parcel' }, { emoji: '🎁', bin: 'parcel' }, { emoji: '🗞️', bin: 'bin' }, { emoji: '🍕', bin: 'bin' }]),
    odd('Check the shelf', 'One product is damaged. Tap it.', '🥫', '💥', 'damaged item'),
    proof('Fix the sign', 'The new sign has a typo. Tap the wrong word.'),
    tap('Rush hour', 'Help the customers 🙋 — skip the rude ones 😤!', '🙋', '😤'),
    quiz('Make change', 'Count the change correctly.', 'math'),
    simon('Restock the shelves', 'Put things back in order.', ['📦', '🧃', '🥫', '🍞']),
    timing('Scan it', 'Scan each item right on the beep.', ['🛒 Milk', '🛒 Bread', '🛒 Eggs', '🛒 Snacks'], 0.2, 1, 'Now!', 'kitchen'),
    tap('Lost and found', 'Return the lost items 🧸 — ignore the junk 🗑️!', '🧸', '🗑️'),
    quiz('Customer service', 'An angry customer! Say the right thing.', 'kind'),
    simon('Delivery route', 'Deliver the packages in order.', ['🏠', '🏢', '🏫', '🏥']),
    timing('Wrap the gift', 'Fold and tape at the right moments.', ['🎁 Fold', '🎁 Tape', '🎀 Ribbon', '✨ Bow'], 0.2, 1, 'Now!', 'kitchen'),
    tap('Cleanup time', 'Wipe the spills 💧 — don’t knock over the vases 🏺!', '💧', '🏺'),
    quiz('Where to?', 'A tourist asks which country a city is in.', 'geo'),
  ],
  trades: [
    odd('Safety inspection', 'One wire is frayed. Tap it.', '🟦', '🟥', 'frayed wire'),
    order('Do it by the book', 'Put the job steps in order.', [
      ['⚡ Switch off the power', '🔧 Open the panel', '🔌 Replace the part', '✅ Test it'],
    ]),
    simon('Toolbox', 'Use the tools in the right order.', ['🔧', '🔩', '⚙️', '🪛']),
    timing('Hammer time', 'Hit each nail on the head.', ['🔨 Nail 1', '🔨 Nail 2', '🔨 Nail 3', '🔨 Nail 4'], 0.2, 1, 'Now!', 'beam'),
    tap('Fix the leaks', 'Plug the leaks 💧 — don’t touch the live wires ⚡!', '💧', '⚡'),
    quiz('Measure twice', 'Do the math before you cut.', 'math'),
    simon('Wiring', 'Connect the wires in order.', ['🔴', '🔵', '🟡', '🟢']),
    timing('Weld the seam', 'Keep the torch steady.', ['🔥 Start', '🔥 Middle', '🔥 End', '✅ Inspect'], 0.16, 1, 'Now!', 'tattoo'),
    tap('Parts delivery', 'Grab the right parts ⚙️ — not the broken ones 💔!', '⚙️', '💔'),
    quiz('Tech check', 'Answer the equipment questions.', 'tech'),
    timing('Tighten the bolts', 'Torque each bolt perfectly.', ['🔩 Bolt 1', '🔩 Bolt 2', '🔩 Bolt 3'], 0.2, 1, 'Now!', 'beam'),
    simon('Engine start', 'Follow the startup sequence.', ['🔑', '⛽', '🔋', '🚗']),
  ],
  animals: [
    odd('Health check', 'One animal looks unwell. Tap it.', '🐕', '🤒', 'sick animal'),
    sort('Feeding time', 'Give each animal the right food.',
      [{ id: 'meat', emoji: '🥩', name: 'Carnivores' }, { id: 'plant', emoji: '🥬', name: 'Herbivores' }, { id: 'seed', emoji: '🌰', name: 'Birds' }],
      [{ emoji: '🦁', bin: 'meat' }, { emoji: '🐯', bin: 'meat' }, { emoji: '🐘', bin: 'plant' }, { emoji: '🦒', bin: 'plant' }, { emoji: '🦜', bin: 'seed' }, { emoji: '🐦', bin: 'seed' }]),
    quiz('Animal check-up', 'What’s wrong with the animal?', 'vet'),
    tap('Feeding time', 'Feed the hungry animals 🐼 — avoid the grumpy ones 🦁!', '🐼', '🦁'),
    simon('Training tricks', 'Teach the tricks in order.', ['🐕', '🦴', '🎾', '🐾']),
    timing('Catch the runaway', 'Throw the net at the right moment.', ['🥅 Bunny', '🥅 Parrot', '🥅 Ferret', '🥅 Goat'], 0.2, 1, 'Now!', 'goal'),
    tap('Bath time', 'Wash the muddy pups 🐶 — dodge the shaking water 💦!', '🐶', '💦'),
    simon('Habitat cleanup', 'Clean each habitat in order.', ['🐧', '🦒', '🐘', '🦜']),
    timing('Nail trim', 'Clip carefully at the right moment.', ['✂️ Paw 1', '✂️ Paw 2', '✂️ Paw 3', '✂️ Paw 4'], 0.16, 1, 'Now!', 'scissors'),
    tap('Egg hatchery', 'Collect the eggs 🥚 — not the snakes 🐍!', '🥚', '🐍'),
    quiz('Pet owner chat', 'Comfort a worried pet owner.', 'kind'),
    quiz('Science of animals', 'Answer the biology questions.', 'science'),
  ],
  music: [
    simon('Learn the song', 'Repeat the melody.', ['🎵', '🎶', '🎼', '🎹']),
    timing('Keep the beat', 'Hit every beat on time.', ['🥁 Beat 1', '🥁 Beat 2', '🥁 Beat 3', '🥁 Beat 4'], 0.2, 1, 'Now!', 'stage'),
    tap('Crowd work', 'High-five the fans 🙌 — dodge the thrown shoes 👟!', '🙌', '👟'),
    quiz('Music theory', 'The band quizzes you backstage.', 'music'),
    simon('Encore!', 'Play the crowd’s favorite riff.', ['🎸', '🎤', '🎹', '🥁']),
    timing('Hit the high note', 'Hold the note for exactly the right time.', ['🎤 Do', '🎤 Mi', '🎤 Sol', '🎤 High C'], 0.16, 1, 'Now!', 'stage'),
    tap('Sound check', 'Fix the feedback 🔊 — don’t unplug the amps 🔌!', '🔊', '🔌'),
    simon('Setlist', 'Play the setlist in order.', ['1️⃣', '2️⃣', '3️⃣', '4️⃣']),
    timing('Tune up', 'Tune each string right on pitch.', ['🎻 G', '🎻 D', '🎻 A', '🎻 E'], 0.15, 1, 'Now!', 'stage'),
    quiz('World tour', 'Which country is the next tour stop in?', 'geo'),
  ],
  sports: [
    timing('Training session', 'Nail every rep.', ['🏋️ Lift', '🏃 Sprint', '🤸 Jump', '🧘 Stretch'], 0.2, 1, 'Now!', 'gym'),
    tap('Catch the balls', 'Catch the balls ⚽ — duck the flying shoes 👟!', '⚽', '👟'),
    simon('Play call', 'Run the play in the right order.', ['⬆️', '⬅️', '➡️', '⬇️']),
    quiz('Rulebook', 'The ref quizzes you on the rules.', 'sports'),
    timing('Penalty shootout', 'Pick your moment.', ['🥅 Kick 1', '🥅 Kick 2', '🥅 Kick 3', '🏆 Winner'], 0.16, 1.15, 'Now!', 'goal'),
    tap('Autograph line', 'Sign for the fans ✍️ — avoid the paparazzi 📸!', '✍️', '📸'),
    simon('Warm-up drill', 'Copy the coach’s drill.', ['👟', '🤾', '🏐', '💪']),
    timing('Relay handoff', 'Pass the baton at the perfect moment.', ['🏃 Leg 1', '🏃 Leg 2', '🏃 Leg 3', '🏁 Anchor'], 0.2, 1, 'Now!', 'gym'),
    tap('Hydration break', 'Grab the water 💧 — not the soda 🥤!', '💧', '🥤'),
    quiz('Away game', 'Which country is the championship in?', 'geo'),
  ],
  fame: [
    tap('Red carpet', 'Smile for the fans 📸 — dodge the paparazzi drones 🛸!', '📸', '🛸'),
    timing('Strike a pose', 'Pose right as the flash goes off.', ['✨ Pose 1', '✨ Pose 2', '✨ Pose 3', '😘 Final'], 0.2, 1, 'Now!', 'runway'),
    simon('Dance challenge', 'Nail the viral dance.', ['💃', '🕺', '👯', '✨']),
    tap('Comment section', 'Like the nice comments 💖 — block the haters 👹!', '💖', '👹'),
    quiz('Interview prep', 'Answer the interviewer kindly.', 'kind'),
    timing('Hit your mark', 'Land every scene.', ['🎬 Scene 1', '🎬 Scene 2', '🎬 Stunt', '🎬 Wrap']),
    simon('Memorize lines', 'Repeat the script in order.', ['📜', '🎭', '💬', '🎬']),
    tap('Fan mail', 'Open the fan letters 💌 — not the bills 🧾!', '💌', '🧾'),
    quiz('World premiere', 'Which country is the premiere in?', 'geo'),
    timing('Award speech', 'Deliver every line on time.', ['🏆 Thank you', '🎤 My family', '😭 Tears', '🙇 Bow'], 0.2, 1, 'Now!', 'stage'),
  ],
  travel: [
    timing('Smooth landing', 'Touch down perfectly.', ['✈️ Approach', '🛬 Flare', '🛞 Touchdown', '🛑 Brake'], 0.2, 1, 'Now!', 'plane'),
    quiz('Destination quiz', 'Where are we flying?', 'geo'),
    tap('Cabin service', 'Serve the passengers 🥤 — avoid the turbulence 🌪️!', '🥤', '🌪️'),
    simon('Pre-flight checklist', 'Check the systems in order.', ['⛽', '🧭', '📡', '🛫']),
    timing('Turbulence', 'Keep the wings level.', ['🌪️ Bump 1', '🌪️ Bump 2', '🌪️ Bump 3'], 0.2, 1, 'Now!', 'plane'),
    tap('Baggage claim', 'Grab the right bags 🧳 — not the cat carrier 🐈!', '🧳', '🐈'),
    simon('Safety demo', 'Do the safety demo in order.', ['🪢', '🦺', '😷', '🚪']),
    quiz('Currency exchange', 'Help a passenger with the math.', 'math'),
    timing('Taxi to the gate', 'Take each turn smoothly.', ['⬅️ Taxiway A', '➡️ Taxiway B', '⬆️ Gate', '🅿️ Park'], 0.2, 1, 'Now!', 'plane'),
    tap('Snack cart', 'Hand out the snacks 🥨 — don’t spill the coffee ☕!', '🥨', '☕'),
  ],
  crime: [
    sneak('The job', 'Move only when the cops look away.', 4, 'Move 🕴️'),
    sneak('The vault', 'Slip past the night guard.', 5, 'Sneak 🦹'),
    timing('Crack the safe', 'Stop the dial on each number.', ['🔐 First', '🔐 Second', '🔐 Third'], 0.15, 1, 'Now!', 'dial'),
    tap('Collect the debts', 'Collect the envelopes 💰 — avoid the undercover cops 👮!', '💰', '👮'),
    simon('Secret handshake', 'Repeat the family handshake.', ['✊', '🤞', '👌', '🤙']),
    quiz('Count the money', 'Make sure nobody skimmed off the top.', 'math'),
    timing('Getaway drive', 'Take every turn perfectly.', ['🚗 Alley', '🚗 Bridge', '🚗 Tunnel', '🏁 Safehouse'], 0.16, 1.2, 'Now!', 'plane'),
    tap('Burn the evidence', 'Burn the papers 📄 — not the cash 💵!', '📄', '💵'),
    sneak('Wiretap', 'Plant the bug while the target isn’t looking.', 3, 'Plant 🎧'),
    quiz('Overseas deal', 'Where is the shipment coming from?', 'geo'),
  ],
  politics: [
    tap('Campaign trail', 'Shake hands 🤝 — dodge the tomatoes 🍅!', '🤝', '🍅'),
    quiz('Debate prep', 'Stay calm and kind in the debate.', 'kind'),
    quiz('Budget session', 'Balance the city budget.', 'math'),
    quiz('Foreign affairs', 'Which country is visiting?', 'geo'),
    simon('Vote count', 'Tally the districts in order.', ['🗳️', '📊', '🏛️', '✅']),
    timing('Ribbon cutting', 'Cut the ribbon on cue.', ['✂️ New park', '✂️ New school', '✂️ New bridge'], 0.2, 1, 'Now!', 'stage'),
    tap('Sign the bills', 'Sign the good laws ✍️ — veto the silly ones 🤪!', '✍️', '🤪'),
    simon('Press conference', 'Answer the reporters in order.', ['🎤', '📰', '📺', '📱']),
    timing('Big speech', 'Pause for applause at the right moment.', ['🎤 Intro', '👏 Applause', '💡 The plan', '🇺🇳 Close'], 0.2, 1, 'Now!', 'stage'),
    tap('Town hall', 'Listen to the voters 🙋 — ignore the trolls 👹!', '🙋', '👹'),
  ],
  royal: [
    outfit('Dress for the occasion', 'The palace dresser laid out four looks. Pick the right one for each event.', 4),
    timing('Host the banquet', 'Set each dish down in front of the right guest.', ['🍲 The soup', '🍖 The main course', '🍰 The dessert', '🥂 The toast'], 0.2, 1, 'Serve!', 'banquet'),
    timing('Wave from the balcony', 'Turn and wave where the crowd is loudest.', ['👋 First wave', '👋 To the left', '👋 To the right', '👑 One more'], 0.2, 1, 'Wave!', 'balcony'),
    timing('The coronation', 'Lower the crown onto the heir — perfectly straight.', ['👑 Lift the crown', '👑 Line it up', '👑 Crown them'], 0.16, 1, 'Crown!', 'throne'),
    timing('Pour for the ambassador', 'Fill the glass at the right seat without a drop spilled.', ['🥂 Ambassador', '🥂 The duchess', '🥂 The general'], 0.18, 1, 'Pour!', 'banquet'),
    outfit('The royal wardrobe', 'A last-minute change of plans — what do you wear?', 3),
    order('State dinner', 'Seat the guests and run the evening in the right order.', [
      ['🥂 Welcome toast', '🍲 First course', '🍖 Main course', '🎻 Music and dancing'],
      ['👑 Announce the guests', '🤝 Greet the ambassadors', '📜 Read the speech', '📸 Official photo'],
    ]),
    proof('Approve the royal decree', 'The scribe made a typo. Tap the wrong word.'),
    odd('Inspect the guard', 'One guard is out of uniform. Tap them.', '💂', '🕺', 'out of place'),
    tap('Royal wave', 'Wave to the crowds 👋 — dodge the paparazzi 📸!', '👋', '📸'),
    quiz('Royal etiquette', 'Mind your manners at the state dinner.', 'etiquette'),
    timing('Ribbon cutting', 'Cut the ribbon with royal grace.', ['✂️ Hospital', '✂️ Museum', '✂️ Bridge']),
    simon('The royal waltz', 'Lead the ball with the right steps.', ['👑', '💃', '🕺', '✨']),
    quiz('State visit', 'Which country’s leader is visiting the palace?', 'geo'),
    timing('Knighting ceremony', 'Tap the sword on each shoulder.', ['⚔️ Left shoulder', '⚔️ Right shoulder', '🎖️ Arise, Sir!'], 0.2, 1, 'Now!', 'stage'),
    tap('Royal correspondence', 'Sign the royal letters 📜 — not the fan fiction 📖!', '📜', '📖'),
    simon('Banquet courses', 'Serve the courses in the proper order.', ['🥣', '🐟', '🍖', '🍰']),
    sneak('Sneak out of the palace', 'Slip past the guards for a night out as a normal person.', 4, 'Tiptoe 👑'),
    timing('Polo match', 'Swing the mallet at the right moment.', ['🐎 Chukker 1', '🐎 Chukker 2', '🐎 Chukker 3', '🏆 Winning goal'], 0.2, 1, 'Now!', 'goal'),
    quiz('Charity gala', 'Say something kind to the guests.', 'kind'),
  ],
  care: [
    quiz('Session time', 'Choose the kindest response.', 'kind'),
    tap('Calm the room', 'Offer tissues 🧻 — skip the loud noises 📢!', '🧻', '📢'),
    simon('Breathing exercise', 'Guide the breathing in order.', ['🌬️', '🫁', '😌', '🧘']),
    timing('Mindful moment', 'Breathe in and out on cue.', ['🌬️ In', '😮‍💨 Out', '🌬️ In', '😌 Relax'], 0.2, 1, 'Now!', 'lab'),
    quiz('Group therapy', 'Help the group with kindness.', 'kind'),
    simon('Journal prompts', 'Hand out the prompts in order.', ['📓', '✏️', '💭', '💖']),
    tap('Gratitude jar', 'Collect the happy notes 💌 — toss the grumpy ones 😾!', '💌', '😾'),
    quiz('Science of the brain', 'Answer the neuroscience questions.', 'science'),
    timing('Guided meditation', 'Ring the bell right on time.', ['🔔 Begin', '🔔 Middle', '🔔 End'], 0.2, 1, 'Now!', 'lab'),
    tap('Support group', 'Welcome the new members 🙋 — shoo the salespeople 🗣️!', '🙋', '🗣️'),
  ],
  space: [
    timing('Space mission', 'Fire the thrusters at the right moment.', ['🚀 Liftoff', '🛰️ Dock', '🌕 Land', '🌍 Return'], 0.15, 1.1),
    simon('Launch sequence', 'Follow mission control’s sequence.', ['🔴', '🟠', '🟢', '🔵']),
    tap('Space debris', 'Collect the samples 🪨 — dodge the debris ☄️!', '🪨', '☄️'),
    quiz('Science officer', 'Answer mission control’s science questions.', 'science'),
    timing('Spacewalk', 'Grab each handhold.', ['🧑‍🚀 Hold 1', '🧑‍🚀 Hold 2', '🧑‍🚀 Hold 3', '🔧 Fix it'], 0.2, 1, 'Now!', 'space'),
    simon('Star map', 'Plot the constellations in order.', ['⭐', '🌟', '✨', '💫']),
    tap('Alien signals', 'Record the signals 📡 — ignore the static 📺!', '📡', '📺'),
    quiz('Tech check', 'Check the ship’s systems.', 'tech'),
    timing('Re-entry', 'Angle the capsule perfectly.', ['🔥 Heat shield', '🪂 Chutes', '🌊 Splashdown'], 0.15, 1, 'Now!', 'space'),
    simon('Robot arm', 'Move the robot arm in order.', ['⬆️', '⬅️', '➡️', '⬇️']),
  ],
};

const FAMILY_OF: Record<string, string[]> = {
  anesthesiologist: ['medical'], radiologist: ['medical'], psychiatrist: ['medical', 'care'], dermatologist: ['medical'], oncologist: ['medical'],
  obgyn: ['medical'], optometrist: ['medical'], physio: ['medical', 'sports'], nutritionist: ['medical', 'food'], midwife: ['medical'],
  forensic: ['tech', 'law'], marinebio: ['animals', 'tech'], astronomer: ['space', 'tech'], meteorologist: ['tech'], archaeologist: ['tech', 'creative'],
  datasci: ['tech'], cyber: ['tech'], airesearch: ['tech'], robotics: ['tech'], aerospace: ['tech', 'space'],
  interior: ['creative'], animator: ['creative'], videoeditor: ['creative'], soundeng: ['creative', 'music'], voiceactor: ['creative', 'fame'],
  stunt: ['sports', 'fame'], esports: ['tech', 'fame'], chessgm: ['tech'], magician: ['fame'], comedian: ['fame'], author: ['creative', 'school'],
  translator: ['school', 'business'], diplomat: ['politics'], detective: ['law', 'rescue'], atc: ['travel'], captain: ['travel'],
  farmer: ['animals', 'trades'], beekeeper: ['animals'], winemaker: ['food'], pastrychef: ['food'], sommelier: ['food'], barber: ['beauty'],
  yoga: ['care', 'sports'], socialworker: ['care'], curator: ['creative', 'school'], ranger: ['animals', 'rescue'], carpenter: ['trades'], plumber: ['trades'],
  doctor: ['medical'], nurse: ['medical', 'care'], pediatrician: ['medical'], surgeon: ['medical'], cardiologist: ['medical'], neurosurgeon: ['medical'],
  dentist: ['medical'], pharmacist: ['medical'], paramedic: ['medical', 'rescue'], counselor: ['care'], vet: ['animals', 'medical'],
  zookeeper: ['animals'], dogwalker: ['animals'], police: ['rescue'], firefighter: ['rescue'], lifeguard: ['rescue'],
  lawyer: ['law'], judge: ['law'], dev: ['tech'], gamedev: ['tech'], engineer: ['tech'], architect: ['tech', 'creative'], scientist: ['tech'],
  exec: ['business'], accountant: ['business'], realtor: ['business'], receptionist: ['business', 'service'], stockbroker: ['business'],
  teacher: ['school'], librarian: ['school'], musicteacher: ['school', 'music'], coach: ['sports', 'school'],
  designer: ['creative'], journalist: ['creative'], photographer: ['creative'], fashiondesigner: ['creative', 'beauty'], tattoo: ['creative'],
  hairstylist: ['beauty'], makeup: ['beauty'], model: ['fame', 'beauty'],
  chef: ['food'], baker: ['food'], barista: ['food'], fastfood: ['food'], bartender: ['food'],
  cashier: ['service'], warehouse: ['service', 'trades'], babysitter: ['service'], florist: ['service'], flightattendant: ['travel', 'service'],
  mechanic: ['trades'], electrician: ['trades'],
  musician: ['music'], guitarist: ['music'], pianist: ['music'], violinist: ['music'], drummer: ['music'], singer: ['music', 'fame'],
  saxophonist: ['music'], dj: ['music'], orchestra: ['music'], popstar: ['music', 'fame'],
  athlete: ['sports'], basketball: ['sports'], soccer: ['sports'], tennis: ['sports'], swimmer: ['sports'], volleyball: ['sports'], baseball: ['sports'],
  boxer: ['sports'], gymnast: ['sports'], skater: ['sports'], sprinter: ['sports'], golfer: ['sports'], trainer: ['sports'],
  actor: ['fame'], influencer: ['fame'], pilot: ['travel'], astronaut: ['space'], mafia: ['crime'], president: ['politics'], royal: ['royal'],
};

/** Every task a job can hand out — always at least 10. */
export function workGamesFor(careerId: string): WorkGame[] {
  const own = GAMES[careerId] ? [GAMES[careerId]] : [];
  const fam = (FAMILY_OF[careerId] ?? ['service']).flatMap((f) => FAMILIES[f] ?? []);
  const seen = new Set<string>();
  return [...own, ...fam].filter((w) => (seen.has(w.title) ? false : (seen.add(w.title), true)));
}

/** Pick one of the job's tasks at random. */
export const workGameFor = (careerId: string): WorkGame => pick(workGamesFor(careerId));

/* ───────── Quiz questions ───────── */

export interface Question { q: string; a: string; options: string[] }

const DIAGNOSE: [string, string][] = [
  ['Fever, cough, and body aches for a week.', 'Flu'],
  ['Sneezing and itchy eyes every spring near flowers.', 'Allergies'],
  ['Itchy red spots all over and a mild fever (it’s a kid!).', 'Chickenpox'],
  ['Swollen wrist after falling off a skateboard.', 'Sprain'],
  ['Red, itchy eye that’s crusty in the morning.', 'Pink eye'],
  ['Very sore throat with white spots on the tonsils.', 'Strep throat'],
  ['Painful red skin after a long day at the beach.', 'Sunburn'],
  ['Sharp pain in the lower right belly and a fever.', 'Appendicitis'],
  ['Pounding headache, nausea, and bright lights hurt.', 'Migraine'],
  ['Always thirsty, always tired, and peeing a lot.', 'Diabetes'],
];

const VET: [string, string][] = [
  ['A dog ate an entire chocolate bar.', 'Chocolate poisoning'],
  ['A cat keeps coughing up fur.', 'Hairballs'],
  ['A puppy is scratching nonstop and has tiny jumping bugs.', 'Fleas'],
  ['A rabbit stopped eating and its front teeth are super long.', 'Overgrown teeth'],
  ['A parrot keeps plucking out its own feathers.', 'Stress'],
  ['A puppy has a round belly and wiggly things in its poop.', 'Worms'],
  ['A horse is limping and one hoof feels hot.', 'Hoof abscess'],
];

const LAW: [string, string][] = [
  ['Opposing counsel asks: “You were angry, weren’t you?”', 'Leading question'],
  ['The witness says: “My neighbor told me he did it.”', 'Hearsay'],
  ['Counsel asks the exact same question for the fifth time.', 'Asked and answered'],
  ['Counsel starts yelling insults at the witness.', 'Badgering the witness'],
  ['Counsel asks about the defendant’s favorite ice cream.', 'Irrelevant'],
  ['A witness “saw” the thief’s eye color from 100 meters away at midnight.', 'Lack of foundation'],
];

const KIND: Question[] = [
  { q: 'A client says: “I failed my big exam.”', a: 'That sounds really hard. Want to talk it through?', options: ['That sounds really hard. Want to talk it through?', 'Just study harder next time.', 'Exams don’t matter anyway.', 'I failed mine too, lol.'] },
  { q: 'A client says: “My best friend moved away.”', a: 'It makes sense to miss them. How are you staying in touch?', options: ['It makes sense to miss them. How are you staying in touch?', 'Just make new friends.', 'Friends come and go.', 'At least you have more free time!'] },
  { q: 'A client says: “I feel nervous all the time.”', a: 'Let’s notice when it happens and try some breathing together.', options: ['Let’s notice when it happens and try some breathing together.', 'Stop worrying so much.', 'Everyone feels that way.', 'Have you tried just relaxing?'] },
  { q: 'A client says: “I got the job I wanted!”', a: 'That’s wonderful! How does it feel?', options: ['That’s wonderful! How does it feel?', 'Hope it pays well.', 'Don’t get too excited.', 'Okay. Next topic.'] },
];

const SCIENCE: [string, string][] = [
  ['What gas do plants breathe in?', 'Carbon dioxide'], ['Which planet is the Red Planet?', 'Mars'], ['What is H₂O?', 'Water'],
  ['What force keeps us on the ground?', 'Gravity'], ['Which organ pumps blood?', 'The heart'], ['What is the closest star to Earth?', 'The Sun'],
  ['What’s the hardest natural substance?', 'Diamond'], ['Which part of a cell holds DNA?', 'The nucleus'], ['What do bees make?', 'Honey'],
];
const MUSIC: [string, string][] = [
  ['How many lines are on a music staff?', 'Five'], ['How many keys on a standard piano?', '88'], ['How many strings on a standard guitar?', 'Six'],
  ['What does “forte” mean?', 'Loud'], ['What does “piano” mean in music?', 'Soft'], ['How many beats in a whole note (4/4)?', 'Four'],
  ['Which clef is used for high notes?', 'Treble clef'], ['Which family is the trumpet in?', 'Brass'],
];
const SPORTSQ: [string, string][] = [
  ['Points for a basketball three-pointer?', 'Three'], ['Players per soccer team on the field?', 'Eleven'], ['Length of an Olympic pool?', '50 meters'],
  ['What is zero called in tennis?', 'Love'], ['How many rings on the Olympic flag?', 'Five'], ['How long is a marathon?', '42.2 km'],
  ['What sport uses a shuttlecock?', 'Badminton'], ['How many holes on a full golf course?', 'Eighteen'],
];
const GEO: [string, string][] = [
  ['Capital of Japan?', 'Tokyo'], ['Capital of France?', 'Paris'], ['Capital of the Philippines?', 'Manila'], ['Capital of Australia?', 'Canberra'],
  ['Capital of Canada?', 'Ottawa'], ['Capital of Brazil?', 'Brasília'], ['Capital of Italy?', 'Rome'], ['Capital of Egypt?', 'Cairo'], ['Capital of South Korea?', 'Seoul'],
];
const FOOD: [string, string][] = [
  ['Main ingredient in guacamole?', 'Avocado'], ['What makes bread rise?', 'Yeast'], ['Adobo is a famous dish from…', 'The Philippines'],
  ['What gives chocolate its flavor?', 'Cocoa'], ['A soufflé is mostly…', 'Whipped egg whites'], ['The most expensive spice is…', 'Saffron'],
  ['Sushi rice is seasoned with…', 'Rice vinegar'], ['Pesto is made mostly from…', 'Basil'],
];
const ETIQUETTE: [string, string][] = [
  ['Where does the dessert fork go?', 'Above the plate'], ['How do you address a king or queen?', 'Your Majesty'], ['How do you address a prince?', 'Your Royal Highness'],
  ['When may guests start eating at a royal dinner?', 'After the monarch starts'], ['How do you hold a teacup?', 'By the handle'],
  ['Where does your napkin go if you leave the table briefly?', 'On your chair'], ['Which glass is for water?', 'The largest goblet'], ['How do you greet the monarch?', 'A curtsy or a bow'],
];
const TECH: [string, string][] = [
  ['What does CPU stand for?', 'Central Processing Unit'], ['How many bits in a byte?', 'Eight'], ['Binary uses which digits?', '0 and 1'],
  ['What does “www” stand for?', 'World Wide Web'], ['What does AI stand for?', 'Artificial Intelligence'], ['What does RAM stand for?', 'Random Access Memory'],
  ['What does HTML stand for?', 'HyperText Markup Language'], ['What does USB stand for?', 'Universal Serial Bus'],
];

function fromPairs(pairs: [string, string][]): Question {
  const [q, a] = pick(pairs);
  const others = [...new Set(pairs.map((p) => p[1]))].filter((x) => x !== a).sort(() => Math.random() - 0.5).slice(0, 3);
  return { q, a, options: [a, ...others].sort(() => Math.random() - 0.5) };
}

function numberQuestion(q: string, a: number, fmt = (n: number) => String(n)): Question {
  const opts = new Set([a]);
  while (opts.size < 4) {
    const off = pick([-1, 1]) * rand(1, Math.max(3, Math.round(Math.abs(a) * 0.25)));
    if (a + off >= 0) opts.add(a + off);
  }
  return { q, a: fmt(a), options: [...opts].sort(() => Math.random() - 0.5).map(fmt) };
}

export function makeQuestion(bank: QuizBank): Question {
  switch (bank) {
    case 'diagnose': return fromPairs(DIAGNOSE);
    case 'vet': return fromPairs(VET);
    case 'law': return fromPairs(LAW);
    case 'science': return fromPairs(SCIENCE);
    case 'music': return fromPairs(MUSIC);
    case 'sports': return fromPairs(SPORTSQ);
    case 'geo': return fromPairs(GEO);
    case 'food': return fromPairs(FOOD);
    case 'etiquette': return fromPairs(ETIQUETTE);
    case 'tech': return fromPairs(TECH);
    case 'kind': { const k = pick(KIND); return { ...k, options: [...k.options].sort(() => Math.random() - 0.5) }; }
    case 'kidmath': {
      const a = rand(3, 12), b = rand(3, 12);
      return pick([() => numberQuestion(`A student asks: what is ${a} × ${b}?`, a * b), () => numberQuestion(`A student asks: what is ${a * b} ÷ ${a}?`, b), () => numberQuestion(`A student asks: what is ${a * 7} + ${b * 9}?`, a * 7 + b * 9)])();
    }
    case 'math': {
      const fmt = (n: number) => money(n);
      const base = rand(4, 60) * 50;
      return pick([
        () => numberQuestion(`What’s 15% of ${money(base)}?`, Math.round(base * 0.15), fmt),
        () => { const x = rand(12, 90) * 100, y = rand(5, 60) * 100; return numberQuestion(`Revenue ${money(x + y)} minus costs ${money(y)} is…`, x, fmt); },
        () => { const x = rand(3, 9), y = rand(11, 99) * 10; return numberQuestion(`${x} payments of ${money(y)} add up to…`, x * y, fmt); },
      ])();
    }
  }
}

/* ───────── Sentences with one misspelled word (for proofreading tasks) ───────── */

export interface ProofLine { text: string; wrong: string; right: string }

export const PROOF_LINES: ProofLine[] = [
  { text: 'The mayor will recieve the award on Friday evening.', wrong: 'recieve', right: 'receive' },
  { text: 'Our team made a seperate plan for the weekend storm.', wrong: 'seperate', right: 'separate' },
  { text: 'It was definately the best concert of the year.', wrong: 'definately', right: 'definitely' },
  { text: 'The new libary opens downtown next month.', wrong: 'libary', right: 'library' },
  { text: 'She recieved a standing ovation after the speech.', wrong: 'recieved', right: 'received' },
  { text: 'The comittee voted to plant a thousand trees.', wrong: 'comittee', right: 'committee' },
  { text: 'Tomorrow will be a beatiful day at the beach.', wrong: 'beatiful', right: 'beautiful' },
  { text: 'The restraunt on the corner serves the best ramen.', wrong: 'restraunt', right: 'restaurant' },
  { text: 'He was truely surprised by the birthday party.', wrong: 'truely', right: 'truly' },
  { text: 'The goverment announced a new park this morning.', wrong: 'goverment', right: 'government' },
  { text: 'Their going to announce the winner at midnight.', wrong: 'Their', right: 'They’re' },
  { text: 'The weather forcast says rain all weekend.', wrong: 'forcast', right: 'forecast' },
  { text: 'We recomend booking your tickets early.', wrong: 'recomend', right: 'recommend' },
  { text: 'The athelete broke the world record yesterday.', wrong: 'athelete', right: 'athlete' },
  { text: 'A calender of events is posted at the entrance.', wrong: 'calender', right: 'calendar' },
  { text: 'The princess wore a magnificant gown to the ball.', wrong: 'magnificant', right: 'magnificent' },
  { text: 'Please seperate the recycling from the trash.', wrong: 'seperate', right: 'separate' },
  { text: 'The experiment was a compleat success.', wrong: 'compleat', right: 'complete' },
];

export const proofRound = () => pick(PROOF_LINES);

/* ───────── Finishing a mini-game at work ───────── */

export function finishWorkGame(g: Game, score: number, max: number, title: string): Result | undefined {
  const job = g.job;
  const left = officeTasksLeft(g);
  if (!job || g.prison > 0 || left <= 0) return;
  g.used.push(`office:${OFFICE_TASKS_PER_YEAR - left}`);
  const ratio = max > 0 ? score / max : 0;
  const before = job.salary;

  if (ratio >= 0.99) {
    const pct = rand(6, 10);
    job.salary = Math.round(job.salary * (1 + pct / 100));
    job.performance = clamp(job.performance + 15);
    adjust(g, 'happiness', 8);
    return { emoji: '🏆', title: 'PERFECT!', text: `${title}: flawless work (${score}/${max}). Salary ${money(before)} → ${money(job.salary)} (+${pct}%).`, celebrate: true };
  }
  if (ratio >= 0.6) {
    const pct = rand(2, 4);
    job.salary = Math.round(job.salary * (1 + pct / 100));
    job.performance = clamp(job.performance + 6);
    adjust(g, 'happiness', 3);
    return { emoji: '📈', title: 'Good job!', text: `${title}: solid work (${score}/${max}). Salary ${money(before)} → ${money(job.salary)} (+${pct}%).` };
  }
  const pct = rand(1, 3);
  job.salary = Math.round(job.salary * (1 - pct / 100));
  job.performance = clamp(job.performance - 8);
  adjust(g, 'happiness', -3);
  return { emoji: '📉', title: 'Rough day', text: `${title}: it didn’t go well (${score}/${max}). Salary ${money(before)} → ${money(job.salary)} (−${pct}%).` };
}

