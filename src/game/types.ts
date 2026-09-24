export type Gender = 'male' | 'female';
export type Preference = 'men' | 'women' | 'everyone';
export type StatKey = 'happiness' | 'health' | 'smarts' | 'looks';
export type Stats = Record<StatKey, number>;

export type HairStyle =
  | 'short' | 'sidepart' | 'spiky' | 'curly' | 'afro' | 'mohawk' | 'buzz' | 'bald'
  | 'pixie' | 'bob' | 'bangs' | 'long' | 'wavy' | 'ponytail' | 'pigtails' | 'buns' | 'topknot' | 'braids' | 'locs'
  | 'undercut' | 'quiff' | 'fringe' | 'manbun' | 'fauxhawk' | 'messy' | 'slick' | 'curtains' | 'cornrows' | 'twists' | 'surfer'
  | 'bowl' | 'caesar' | 'shag' | 'mullet' | 'curtainbangs' | 'wolfcut' | 'crimped' | 'waves' | 'coils' | 'hime' | 'mermaid'
  | 'halfup' | 'chignon' | 'lowpigtails' | 'crownbraid';

export type AccSlot = 'hat' | 'glasses' | 'ears' | 'neck' | 'face';

export interface Look {
  skin: string;
  hair: HairStyle;
  hairColor: string;
  eyes: string;
  lashes?: boolean;
  top?: string;
  topColor?: string;
  acc?: Partial<Record<AccSlot, string>>;
}

export type BarStyle = 'classic' | 'slim' | 'chunky' | 'glow';

export interface BarPrefs {
  colors: Record<StatKey, string>;
  style: BarStyle;
}

export type TaskStatus = 'pending' | 'done' | 'failed';

export interface DreamState {
  careerId: string;
  status: TaskStatus[];
  complete: boolean;
  failed: boolean;
  offered: boolean;
}

export type RelationType = 'mother' | 'father' | 'sibling' | 'friend' | 'partner' | 'spouse' | 'child';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  relation: RelationType;
  closeness: number;
  alive: boolean;
  look?: Look;
  job?: string;
  salary?: number;
  education?: string;
  bio?: string;
  interests?: string[];
  /** Famous / VIP person from VIP Dating. */
  vip?: boolean;
  /** Born into a royal house (or married into yours). */
  royal?: boolean;
}

export interface ClubMembership {
  id: string;
  years: number;
  president?: boolean;
}

export interface Job {
  careerId: string;
  title: string;
  salary: number;
  years: number;
  performance: number;
  level: number;
  partTime: boolean;
  /** Royal duties — can't just quit without the family's blessing. */
  royal?: boolean;
}

export type SchoolStage = 'none' | 'elementary' | 'high' | 'university' | 'graduate' | 'royal';

export interface Education {
  stage: SchoolStage;
  yearsLeft: number;
  grades: number;
  program?: string;
  degrees: string[];
  studentLoans: number;
  /** Turned off in the Work tab — no exams, and no shot at valedictorian. */
  examsOff?: boolean;
  /** Picked up this year's review sheet? */
  reviewSheet?: boolean;
  /** The questions that will be on this year's exam — set when you fetch the review sheet. */
  paper?: ExamPaper;
  /** Exam results, newest last. */
  exams?: ExamResult[];
  reports?: ReportCard[];
  /** Years an exam was skipped — valedictorian is off the table after even one. */
  missedExams?: number;
}

export interface ExamResult { age: number; stage: SchoolStage; score: number; max: number; reviewed?: boolean }

/** This year's exam questions. The review sheet is this paper, with the answers on it. */
export interface ExamPaper {
  age: number;
  stage: SchoolStage;
  questions: { subject: string; q: string; a: string; options: string[] }[];
}

export interface ReportCard {
  age: number;
  stage: SchoolStage;
  /** 0–100 for the year. */
  score: number;
  grade: string;
  subjects: { name: string; mark: number }[];
  note: string;
  skipped?: boolean;
}

export interface Ancestor {
  generation: number;
  name: string;
  gender: string;
  age: number;
  career: string;
  origin?: string;
  look?: Look;
  epitaph?: string;
  cause?: string;
}

export interface StoryState {
  id: string;
  startedAge: number;
  step: number;
  /** Who the story is about. */
  personId?: string;
  done?: boolean;
  /** Choices made along the way. */
  flags?: string[];
}

export interface Asset {
  id: string;
  shopId: string;
  kind: 'house' | 'car';
  name: string;
  emoji: string;
  value: number;
  purchasePrice: number;
  age: number;
  /** Which part of town it's in (houses). */
  location?: string;
  /** Everything you picked out for it: wall colour, bed, kitchen, garden… */
  decor?: Record<string, string>;
}

export interface LogYear {
  age: number;
  entries: string[];
}

export type Ctx = Record<string, string | number>;

export interface PendingEvent {
  id: string;
  emoji: string;
  title: string;
  text: string;
  choices: string[];
  ctx: Ctx;
}

export interface Result {
  emoji: string;
  title: string;
  text: string;
  /** Already written to the life log by the action itself. */
  silent?: boolean;
  /** Throw confetti! */
  celebrate?: boolean;
}

export interface Game {
  version: 1;
  id: string;
  generation: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  preference: Preference;
  age: number;
  birthMonth: number;
  birthDay: number;
  country: string;
  city: string;
  stats: Stats;
  money: number;
  education: Education;
  job: Job | null;
  retired: boolean;
  pension: number;
  relationships: Person[];
  assets: Asset[];
  log: LogYear[];
  alive: boolean;
  causeOfDeath?: string;
  pending: PendingEvent[];
  /** Actions already taken this year. */
  used: string[];
  /** One-time events and milestones. */
  flags: string[];
  criminalRecord: number;
  prison: number;
  look: Look;
  bars: BarPrefs;
  dream: DreamState | null;
  /** Lifetime tallies, e.g. 'act:gym' or 'school:study'. */
  counters: Record<string, number>;
  /** Clothes and accessories bought at the mall. */
  wardrobe: string[];
  /** Family you were born into. Can't be changed. */
  origin: string;
  /** Instrument and sport skill, e.g. 'music:piano' → 0–100. */
  skills: Record<string, number>;
  clubs: ClubMembership[];
  /** How many times each activity was done this year (for the doubling fee). */
  yearUses: Record<string, number>;
  /** Fame earned from viral posts, awards and quests. */
  fameBonus: number;
  socials: SocialAccount[];
  quests: QuestState[];
  /** Storylines that play out over several years. */
  stories: StoryState[];
  /** This morning's headlines, one paper per year. */
  papers: { age: number; lines: string[] }[];
  /** The generations before you. */
  ancestors: Ancestor[];
  /** careerId → the age you were turned down, so you can try again next year. */
  rejections: Record<string, number>;
}

export interface SocialAccount {
  app: string;
  handle: string;
  followers: number;
  posts: number;
  verified?: boolean;
  /** Most recent posts, newest first. */
  feed: { age: number; kind: string; text: string; likes: number; viral?: boolean }[];
}

export interface QuestState {
  id: string;
  startedAge: number;
  done?: boolean;
  claimed?: boolean;
  failedAt?: number;
}
