/* Instruments, sports and school clubs. */

export interface SkillDef { id: string; emoji: string; name: string }

export const INSTRUMENTS: SkillDef[] = [
  { id: 'piano', emoji: '🎹', name: 'Piano' },
  { id: 'guitar', emoji: '🎸', name: 'Guitar' },
  { id: 'violin', emoji: '🎻', name: 'Violin' },
  { id: 'drums', emoji: '🥁', name: 'Drums' },
  { id: 'voice', emoji: '🎤', name: 'Singing' },
  { id: 'sax', emoji: '🎷', name: 'Saxophone' },
  { id: 'trumpet', emoji: '🎺', name: 'Trumpet' },
  { id: 'cello', emoji: '🎼', name: 'Cello' },
  { id: 'ukulele', emoji: '🪕', name: 'Ukulele' },
  { id: 'dj', emoji: '🎧', name: 'DJ decks' },
];

export const SPORTS: SkillDef[] = [
  { id: 'basketball', emoji: '🏀', name: 'Basketball' },
  { id: 'soccer', emoji: '⚽', name: 'Soccer' },
  { id: 'tennis', emoji: '🎾', name: 'Tennis' },
  { id: 'swimming', emoji: '🏊', name: 'Swimming' },
  { id: 'volleyball', emoji: '🏐', name: 'Volleyball' },
  { id: 'baseball', emoji: '⚾', name: 'Baseball' },
  { id: 'boxing', emoji: '🥊', name: 'Boxing' },
  { id: 'gymnastics', emoji: '🤸', name: 'Gymnastics' },
  { id: 'skating', emoji: '⛸️', name: 'Figure skating' },
  { id: 'track', emoji: '🏃', name: 'Track & field' },
  { id: 'badminton', emoji: '🏸', name: 'Badminton' },
  { id: 'golf', emoji: '⛳', name: 'Golf' },
];

export const skillName = (key: string) => {
  const [kind, id] = key.split(':');
  const d = (kind === 'music' ? INSTRUMENTS : SPORTS).find((x) => x.id === id);
  return d ? `${d.emoji} ${d.name}` : key;
};

export interface ClubDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  /** Stat bumps each school year you stay in the club. */
  yearly: Partial<Record<'happiness' | 'health' | 'smarts' | 'looks', number>>;
  /** Counter bumped each year (so clubs count toward dream goals). */
  counter?: string;
  /** Stat checked at tryouts / elections. */
  tryout?: { stat: 'happiness' | 'health' | 'smarts' | 'looks'; label: string };
  moments: string[];
}

export const CLUBS: ClubDef[] = [
  { id: 'drama', emoji: '🎭', name: 'Drama Club', desc: 'Plays, musicals and dramatic exits', yearly: { looks: 1, happiness: 2 }, counter: 'act:acting', tryout: { stat: 'looks', label: 'Auditions' },
    moments: ['Our drama club put on Romeo & Juliet — I got a standing ovation.', 'I forgot my lines in the school play but improvised brilliantly.', 'The drama club did a sold-out musical this year!'] },
  { id: 'sports', emoji: '🏅', name: 'Sports Club', desc: 'Train, compete, win trophies', yearly: { health: 3 }, counter: 'act:sports', tryout: { stat: 'health', label: 'Tryouts' },
    moments: ['Our team made it to the regional finals!', 'I scored the winning point at the big game.', 'We lost the championship by one point. Next year!'] },
  { id: 'council', emoji: '🗳️', name: 'Student Council', desc: 'Lead the student body', yearly: { smarts: 2, looks: 1 }, counter: 'act:volunteer', tryout: { stat: 'looks', label: 'Election' },
    moments: ['The student council organized the best dance the school ever had.', 'I gave a speech at the school assembly.', 'We got the school to add a bubble tea machine.'] },
  { id: 'band', emoji: '🎺', name: 'School Band', desc: 'March, jam and perform', yearly: { happiness: 2, smarts: 1 }, counter: 'act:music',
    moments: ['The school band played at the homecoming game.', 'Our band won the district music festival!', 'I had my first solo in the band concert.'] },
  { id: 'chess', emoji: '♟️', name: 'Chess Club', desc: 'Checkmate, every Tuesday', yearly: { smarts: 3 },
    moments: ['I won the school chess tournament!', 'I beat the chess club captain in 12 moves.', 'The chess club went to the state championship.'] },
  { id: 'science', emoji: '🔬', name: 'Science Club', desc: 'Volcanoes, robots, discoveries', yearly: { smarts: 3 },
    moments: ['My science fair project won first place!', 'The science club built a working rocket.', 'We accidentally set off the fire alarm with an experiment.'] },
  { id: 'art', emoji: '🎨', name: 'Art Club', desc: 'Paint, sketch, create', yearly: { happiness: 3 },
    moments: ['My painting was displayed in the school hallway.', 'The art club painted a giant sunset mural.', 'I won an award at the young artists show.'] },
  { id: 'debate', emoji: '🎙️', name: 'Debate Club', desc: 'Win every argument (politely)', yearly: { smarts: 2, looks: 1 },
    moments: ['I won my first debate tournament!', 'I argued that pineapple belongs on pizza. The judges agreed.', 'Our debate team made it to nationals.'] },
  { id: 'coding', emoji: '💻', name: 'Coding Club', desc: 'Build games and apps', yearly: { smarts: 3 },
    moments: ['Our coding club built a game that went viral at school.', 'I won the school hackathon!', 'I made an app that tells you when the cafeteria has pizza.'] },
  { id: 'cheer', emoji: '📣', name: 'Cheer Squad', desc: 'Pom-poms and pyramids', yearly: { health: 2, looks: 2 }, tryout: { stat: 'health', label: 'Tryouts' },
    moments: ['The cheer squad nailed a massive pyramid at the big game!', 'We won the regional cheer competition.', 'I landed my first back handspring.'] },
  { id: 'dance', emoji: '💃', name: 'Dance Club', desc: 'K-pop, ballet, hip hop', yearly: { health: 2, happiness: 2 },
    moments: ['Our dance club performed at the school festival!', 'I learned a whole K-pop routine in a week.', 'The dance video we made went viral.'] },
  { id: 'book', emoji: '📖', name: 'Book Club', desc: 'Cozy reads and hot takes', yearly: { smarts: 2, happiness: 1 },
    moments: ['The book club read 20 books this year.', 'We had a heated debate about a book’s ending.', 'The book club met the author of our favorite novel!'] },
];

export const MAX_CLUBS = 3;
export const clubOf = (id: string) => CLUBS.find((c) => c.id === id);
