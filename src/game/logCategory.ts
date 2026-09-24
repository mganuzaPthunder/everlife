/* Sorting life-log lines into little labelled cards: CAREER, SCHOOL, SOCIAL, LOVE… */

export interface LogCategory { id: string; label: string; color: string }

const CATS: (LogCategory & { test: RegExp })[] = [
  { id: 'family', label: 'Family', color: '#ffb38a', test: /^(my mother is|i have an older)|born a (girl|boy)|first (word|wobbly steps|steps)|gave birth/i },
  { id: 'social', label: 'Social', color: '#8fb8ff', test: /^(📸|🎵|🎧|🐦|✔️)|followers|went viral|brand deals|my \w+ account|spotify|instastar|tiktalk|chirp/i },
  { id: 'faith', label: 'Faith', color: '#e8e0ff', test: /^🙏|prayed|blessing/i },
  { id: 'health', label: 'Health', color: '#7ec46a', test: /chickenpox|\bflu\b|\bcold\b|sprain|injur|\bsick\b|\bill\b|broke my (arm|leg|wrist)/i },
  { id: 'royal', label: 'Royal', color: '#f4c95d', test: /^(👑|🏰)|royal|palace|the crown|consort|throne/i },
  { id: 'crime', label: 'Crime', color: '#ff7a8a', test: /^(🚨|⛓️|🔓|🕶️|🏃)|prison|arrest|caught|heist|shoplift|police|sentenced|fined|escaped/i },
  { id: 'career', label: 'Career', color: '#7ee0b8', test: /^(📈|💼|🏖️)|\bjob\b|promot|fired|hired|salary|retire|career|boss|\boffice\b|interview|pension|\braise\b|quit my|co-?worker/i },
  { id: 'friends', label: 'Friends', color: '#7ec4e8', test: /^(🤝|🍻|🫂|🕰️|🏕️)|best friend|fell out|friends? for|friendship/i },
  { id: 'school', label: 'School', color: '#b79cff', test: /^(🎒|🎓|📕|📋|📉|🏫)|school|exam|report card|graduat|universit|academy|club|teacher|grades|valedictorian|degree/i },
  // Someone else in the family marrying is family news, not your love life.
  { id: 'family', label: 'Family', color: '#ffb38a', test: /remarried|^💒 my (mother|father|mom|dad|son|daughter|brother|sister)/i },
  { id: 'love', label: 'Love', color: '#ff8fc4', test: /^(💘|💞|💍|💔|💒|🪄)|dating|\bdate\b|married|marry|boyfriend|girlfriend|husband|wife|broke up|divorce|propos|lover|maiden name|in love/i },
  { id: 'family', label: 'Family', color: '#ffb38a', test: /^(👶|👪|🕯️)|baby|born|mother|father|brother|sister|\bson\b|daughter|parents|in-law|step|passed away|family|grandchild|generation/i },
  { id: 'money', label: 'Money', color: '#f4c95d', test: /^(💰|💵|🎰|🎟️|🏠|🏡|🚗)|inherit|trust fund|lottery|casino|jackpot|\$\d|money|bought|sold|house|mortgage|loan/i },
  { id: 'health', label: 'Health', color: '#7ec46a', test: /^(🩺|💉|🏋️|🤒|🧘)|\bsick\b|\bill\b|hospital|doctor|gym|health|surgery|diagnos|meditat/i },
];

const LIFE: LogCategory = { id: 'life', label: 'Life', color: '#c9c3e6' };

export function categoryOf(text: string): LogCategory {
  return CATS.find((c) => c.test.test(text)) ?? LIFE;
}

/** Consecutive lines of the same kind share one card, so a busy year doesn't look crowded. */
export function groupEntries(entries: string[]): { cat: LogCategory; lines: string[] }[] {
  const groups: { cat: LogCategory; lines: string[] }[] = [];
  for (const line of entries) {
    const cat = categoryOf(line);
    const last = groups.at(-1);
    if (last && last.cat.id === cat.id) last.lines.push(line);
    else groups.push({ cat, lines: [line] });
  }
  return groups;
}
