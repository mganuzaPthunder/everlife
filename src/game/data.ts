export interface Career {
  id: string;
  title: string;
  emoji: string;
  salary: number;
  minAge: number;
  partTime?: boolean;
  /** 'hs', 'ba' (any bachelor's), 'ba:<major>', or a grad program id. An array means any of them. */
  edu?: string | string[];
  minSmarts?: number;
  minLooks?: number;
  minHealth?: number;
  cleanRecord?: boolean;
  needsRecord?: boolean;
  /** Extraordinary careers: hard to break into unless it's your completed dream. */
  special?: boolean;
  /** Needs a trained instrument or sport, e.g. ['music:piano'] (any of them). */
  skill?: string[];
  minSkill?: number;
  /** Which list the job shows up in. */
  field?: 'music' | 'sports';
  /** Not shown in job listings (e.g. royal duties). */
  hidden?: boolean;
  /** Salary multiplier per promotion. */
  growth?: number;
  levels: string[];
}

export const CAREERS: Career[] = [
  { id: 'babysitter', title: 'Babysitter', emoji: '🍼', salary: 4000, minAge: 13, partTime: true, levels: ['Babysitter'] },
  { id: 'dogwalker', title: 'Dog Walker', emoji: '🐕', salary: 5000, minAge: 13, partTime: true, levels: ['Dog Walker'] },
  { id: 'lifeguard', title: 'Lifeguard', emoji: '🛟', salary: 9000, minAge: 15, partTime: true, levels: ['Lifeguard'] },
  { id: 'fastfood', title: 'Fast Food Crew', emoji: '🍔', salary: 11000, minAge: 15, partTime: true, levels: ['Crew Member'] },

  { id: 'cashier', title: 'Cashier', emoji: '🛒', salary: 26000, minAge: 18, levels: ['Cashier', 'Head Cashier', 'Store Supervisor', 'Store Manager'] },
  { id: 'barista', title: 'Barista', emoji: '☕', salary: 27000, minAge: 18, levels: ['Barista', 'Shift Lead', 'Café Manager'] },
  { id: 'warehouse', title: 'Warehouse Associate', emoji: '📦', salary: 33000, minAge: 18, levels: ['Warehouse Associate', 'Forklift Operator', 'Shift Supervisor', 'Warehouse Manager'] },
  { id: 'bartender', title: 'Bartender', emoji: '🍸', salary: 31000, minAge: 21, levels: ['Barback', 'Bartender', 'Head Bartender', 'Bar Manager'] },
  { id: 'musician', title: 'Musician', emoji: '🎸', salary: 22000, minAge: 18, growth: 2.2, levels: ['Street Performer', 'Session Musician', 'Touring Artist', 'Rock Star'] },
  { id: 'model', title: 'Fashion Model', emoji: '📸', salary: 62000, minAge: 18, minLooks: 80, growth: 1.8, levels: ['New Face', 'Runway Model', 'Supermodel'] },
  { id: 'receptionist', title: 'Receptionist', emoji: '🗂️', salary: 34000, minAge: 18, edu: 'hs', levels: ['Receptionist', 'Office Coordinator', 'Office Manager'] },
  { id: 'firefighter', title: 'Firefighter', emoji: '🚒', salary: 54000, minAge: 18, edu: 'hs', levels: ['Firefighter', 'Engineer', 'Captain', 'Fire Chief'] },
  { id: 'police', title: 'Police Officer', emoji: '🚓', salary: 56000, minAge: 21, edu: 'hs', minSmarts: 35, cleanRecord: true, levels: ['Officer', 'Detective', 'Sergeant', 'Lieutenant', 'Police Chief'] },
  { id: 'realtor', title: 'Real Estate Agent', emoji: '🏘️', salary: 48000, minAge: 18, edu: 'hs', minSmarts: 40, levels: ['Agent', 'Senior Agent', 'Broker'] },

  { id: 'teacher', title: 'Teacher', emoji: '🍎', salary: 50000, minAge: 21, edu: 'ba:edu', levels: ['Teacher', 'Department Head', 'Vice Principal', 'Principal'] },
  { id: 'journalist', title: 'Journalist', emoji: '📰', salary: 50000, minAge: 21, edu: 'ba:jour', levels: ['Reporter', 'Correspondent', 'Senior Editor', 'Editor-in-Chief'] },
  { id: 'designer', title: 'Graphic Designer', emoji: '🎨', salary: 54000, minAge: 21, edu: 'ba:art', levels: ['Junior Designer', 'Designer', 'Art Director', 'Creative Director'] },
  { id: 'counselor', title: 'Counselor', emoji: '🛋️', salary: 58000, minAge: 21, edu: 'ba:psych', levels: ['Counselor', 'Senior Counselor', 'Clinical Director'] },
  { id: 'accountant', title: 'Accountant', emoji: '📊', salary: 68000, minAge: 21, edu: 'ba:biz', minSmarts: 50, levels: ['Staff Accountant', 'Senior Accountant', 'Controller', 'CFO'] },
  { id: 'nurse', title: 'Registered Nurse', emoji: '🩺', salary: 74000, minAge: 21, edu: 'ba:nursing', levels: ['Nurse', 'Charge Nurse', 'Nurse Manager', 'Director of Nursing'] },
  { id: 'scientist', title: 'Research Scientist', emoji: '🔬', salary: 82000, minAge: 21, edu: 'ba:bio', minSmarts: 65, levels: ['Research Assistant', 'Scientist', 'Senior Scientist', 'Lab Director'] },
  { id: 'engineer', title: 'Civil Engineer', emoji: '🏗️', salary: 88000, minAge: 21, edu: 'ba:eng', minSmarts: 60, levels: ['Engineer I', 'Engineer II', 'Senior Engineer', 'Principal Engineer'] },
  { id: 'dev', title: 'Software Engineer', emoji: '💻', salary: 105000, minAge: 21, edu: 'ba:cs', minSmarts: 60, levels: ['Junior Developer', 'Software Engineer', 'Senior Engineer', 'Staff Engineer', 'CTO'] },
  { id: 'lawyer', title: 'Lawyer', emoji: '⚖️', salary: 125000, minAge: 24, edu: 'law', minSmarts: 65, levels: ['Associate', 'Senior Associate', 'Partner', 'Managing Partner'] },
  { id: 'exec', title: 'Business Executive', emoji: '💼', salary: 150000, minAge: 24, edu: 'mba', minSmarts: 60, levels: ['Manager', 'Director', 'Vice President', 'CEO'] },
  { id: 'doctor', title: 'Physician', emoji: '🥼', salary: 210000, minAge: 26, edu: 'med', minSmarts: 75, levels: ['Resident', 'Attending Physician', 'Chief of Medicine'] },
  { id: 'pediatrician', title: 'Pediatrician', emoji: '🧸', salary: 190000, minAge: 27, edu: 'med', minSmarts: 70, growth: 1.2, levels: ['Pediatric Resident', 'Pediatrician', 'Chief of Pediatrics'] },
  { id: 'surgeon', title: 'Surgeon', emoji: '😷', salary: 260000, minAge: 28, edu: 'med', minSmarts: 80, growth: 1.2, levels: ['Surgical Resident', 'Surgeon', 'Senior Surgeon', 'Chief of Surgery'] },
  { id: 'cardiologist', title: 'Cardiologist (Heart Doctor)', emoji: '🫀', salary: 280000, minAge: 29, edu: 'med', minSmarts: 80, growth: 1.2, levels: ['Cardiology Fellow', 'Cardiologist', 'Senior Cardiologist', 'Head of Cardiology'] },
  { id: 'neurosurgeon', title: 'Neurosurgeon', emoji: '🧠', salary: 320000, minAge: 30, edu: 'med', minSmarts: 90, growth: 1.2, levels: ['Neurosurgery Resident', 'Neurosurgeon', 'Chief Neurosurgeon'] },
  { id: 'dentist', title: 'Dentist', emoji: '🦷', salary: 165000, minAge: 26, edu: 'dental', minSmarts: 60, growth: 1.25, levels: ['Associate Dentist', 'Dentist', 'Practice Owner'] },
  { id: 'vet', title: 'Veterinarian', emoji: '🐾', salary: 110000, minAge: 26, edu: 'vetschool', minSmarts: 60, levels: ['Associate Vet', 'Veterinarian', 'Head Veterinarian', 'Animal Hospital Owner'] },
  { id: 'pilot', title: 'Airline Pilot', emoji: '✈️', salary: 125000, minAge: 21, edu: 'hs', minSmarts: 65, minHealth: 60, levels: ['First Officer', 'Captain', 'Senior Captain', 'Chief Pilot'] },
  { id: 'chef', title: 'Chef', emoji: '🍳', salary: 38000, minAge: 18, growth: 1.6, levels: ['Line Cook', 'Sous Chef', 'Head Chef', 'Celebrity Chef'] },
  { id: 'architect', title: 'Architect', emoji: '📐', salary: 92000, minAge: 22, edu: 'ba:arch', minSmarts: 55, levels: ['Junior Architect', 'Architect', 'Senior Architect', 'Principal Architect'] },
  { id: 'gamedev', title: 'Game Developer', emoji: '🎮', salary: 98000, minAge: 21, edu: 'ba:cs', minSmarts: 55, levels: ['Junior Game Dev', 'Game Developer', 'Lead Designer', 'Studio Director'] },

  /* ───── Everyday jobs ───── */
  { id: 'baker', title: 'Baker', emoji: '🥐', salary: 30000, minAge: 18, levels: ['Bakery Assistant', 'Baker', 'Head Baker', 'Bakery Owner'] },
  { id: 'florist', title: 'Florist', emoji: '💐', salary: 30000, minAge: 18, levels: ['Flower Arranger', 'Florist', 'Flower Shop Owner'] },
  { id: 'hairstylist', title: 'Hairstylist', emoji: '💇', salary: 34000, minAge: 18, growth: 1.35, levels: ['Salon Assistant', 'Stylist', 'Senior Stylist', 'Celebrity Stylist'] },
  { id: 'makeup', title: 'Makeup Artist', emoji: '💄', salary: 36000, minAge: 18, minLooks: 50, growth: 1.35, levels: ['Makeup Artist', 'Senior MUA', 'Celebrity MUA'] },
  { id: 'tattoo', title: 'Tattoo Artist', emoji: '🖋️', salary: 40000, minAge: 18, levels: ['Apprentice', 'Tattoo Artist', 'Studio Owner'] },
  { id: 'zookeeper', title: 'Zookeeper', emoji: '🦒', salary: 36000, minAge: 18, edu: 'hs', levels: ['Keeper Aide', 'Zookeeper', 'Head Keeper', 'Zoo Director'] },
  { id: 'trainer', title: 'Personal Trainer', emoji: '🏋️', salary: 42000, minAge: 18, minHealth: 70, levels: ['Trainer', 'Senior Trainer', 'Celebrity Trainer'] },
  { id: 'photographer', title: 'Photographer', emoji: '📷', salary: 42000, minAge: 18, levels: ['Assistant', 'Photographer', 'Senior Photographer', 'Magazine Photographer'] },
  { id: 'mechanic', title: 'Mechanic', emoji: '🔧', salary: 45000, minAge: 18, edu: 'hs', levels: ['Apprentice Mechanic', 'Mechanic', 'Master Mechanic', 'Garage Owner'] },
  { id: 'flightattendant', title: 'Flight Attendant', emoji: '🛫', salary: 48000, minAge: 19, edu: 'hs', minLooks: 45, levels: ['Flight Attendant', 'Senior Flight Attendant', 'Purser'] },
  { id: 'paramedic', title: 'Paramedic', emoji: '🚑', salary: 52000, minAge: 19, edu: 'hs', minSmarts: 45, levels: ['EMT', 'Paramedic', 'Lead Paramedic'] },
  { id: 'electrician', title: 'Electrician', emoji: '⚡', salary: 58000, minAge: 18, edu: 'hs', levels: ['Apprentice', 'Electrician', 'Master Electrician'] },
  { id: 'librarian', title: 'Librarian', emoji: '📚', salary: 46000, minAge: 22, edu: 'ba', levels: ['Library Assistant', 'Librarian', 'Head Librarian'] },
  { id: 'fashiondesigner', title: 'Fashion Designer', emoji: '👗', salary: 52000, minAge: 21, edu: 'ba:art', growth: 1.45, levels: ['Design Assistant', 'Fashion Designer', 'Creative Director', 'Fashion House Founder'] },
  { id: 'stockbroker', title: 'Stockbroker', emoji: '📈', salary: 95000, minAge: 22, edu: 'ba:biz', minSmarts: 55, growth: 1.4, levels: ['Junior Trader', 'Stockbroker', 'Senior Trader', 'Hedge Fund Manager'] },
  { id: 'pharmacist', title: 'Pharmacist', emoji: '💊', salary: 128000, minAge: 25, edu: 'pharmacy', minSmarts: 60, levels: ['Pharmacist', 'Senior Pharmacist', 'Pharmacy Director'] },
  { id: 'judge', title: 'Judge', emoji: '👨‍⚖️', salary: 180000, minAge: 40, edu: 'law', minSmarts: 75, cleanRecord: true, growth: 1.15, levels: ['District Judge', 'Appeals Judge', 'Supreme Court Justice'] },

  /* ───── Music (needs instrument skill) ───── */
  { id: 'guitarist', title: 'Guitarist', emoji: '🎸', salary: 30000, minAge: 16, field: 'music', skill: ['music:guitar'], minSkill: 50, growth: 1.8, levels: ['Café Guitarist', 'Session Guitarist', 'Band Guitarist', 'Guitar Legend'] },
  { id: 'pianist', title: 'Pianist', emoji: '🎹', salary: 34000, minAge: 16, field: 'music', skill: ['music:piano'], minSkill: 55, growth: 1.7, levels: ['Lounge Pianist', 'Concert Pianist', 'Principal Pianist', 'Piano Virtuoso'] },
  { id: 'violinist', title: 'Violinist', emoji: '🎻', salary: 36000, minAge: 16, field: 'music', skill: ['music:violin'], minSkill: 55, growth: 1.6, levels: ['Wedding Violinist', 'Orchestra Violinist', 'Concertmaster', 'Violin Virtuoso'] },
  { id: 'drummer', title: 'Drummer', emoji: '🥁', salary: 28000, minAge: 16, field: 'music', skill: ['music:drums'], minSkill: 50, growth: 1.8, levels: ['Garage Drummer', 'Session Drummer', 'Touring Drummer', 'Drum Icon'] },
  { id: 'singer', title: 'Singer', emoji: '🎤', salary: 30000, minAge: 16, field: 'music', skill: ['music:voice'], minSkill: 50, growth: 2, levels: ['Karaoke Host', 'Backup Singer', 'Lead Vocalist', 'Diva'] },
  { id: 'saxophonist', title: 'Jazz Saxophonist', emoji: '🎷', salary: 32000, minAge: 16, field: 'music', skill: ['music:sax'], minSkill: 55, growth: 1.6, levels: ['Jazz Bar Sax', 'Band Saxophonist', 'Jazz Star'] },
  { id: 'dj', title: 'DJ', emoji: '🎧', salary: 30000, minAge: 18, field: 'music', skill: ['music:dj'], minSkill: 50, growth: 2, levels: ['Party DJ', 'Club DJ', 'Festival DJ', 'Superstar DJ'] },
  { id: 'orchestra', title: 'Orchestra Musician', emoji: '🎼', salary: 52000, minAge: 18, field: 'music', skill: ['music:violin', 'music:cello', 'music:trumpet', 'music:sax'], minSkill: 60, levels: ['Section Player', 'Principal', 'Conductor'] },
  { id: 'musicteacher', title: 'Music Teacher', emoji: '🎶', salary: 42000, minAge: 21, field: 'music', skill: ['music:piano', 'music:guitar', 'music:violin', 'music:voice', 'music:ukulele', 'music:cello', 'music:trumpet', 'music:sax', 'music:drums'], minSkill: 40, levels: ['Music Tutor', 'Music Teacher', 'Head of Music'] },

  /* ───── Sports (needs sport skill) ───── */
  { id: 'basketball', title: 'Pro Basketball Player', emoji: '🏀', salary: 90000, minAge: 18, field: 'sports', skill: ['sport:basketball'], minSkill: 60, minHealth: 70, growth: 1.7, levels: ['Rookie', 'Starter', 'All-Star', 'MVP'] },
  { id: 'soccer', title: 'Pro Soccer Player', emoji: '⚽', salary: 85000, minAge: 17, field: 'sports', skill: ['sport:soccer'], minSkill: 60, minHealth: 70, growth: 1.7, levels: ['Youth Squad', 'First Team', 'Captain', 'Ballon d’Or Winner'] },
  { id: 'tennis', title: 'Pro Tennis Player', emoji: '🎾', salary: 70000, minAge: 16, field: 'sports', skill: ['sport:tennis'], minSkill: 60, minHealth: 65, growth: 1.8, levels: ['Qualifier', 'Tour Player', 'Top 10', 'Grand Slam Champion'] },
  { id: 'swimmer', title: 'Olympic Swimmer', emoji: '🏊', salary: 50000, minAge: 16, field: 'sports', skill: ['sport:swimming'], minSkill: 60, minHealth: 70, growth: 1.7, levels: ['National Team', 'Olympian', 'Gold Medalist', 'Swimming Legend'] },
  { id: 'volleyball', title: 'Pro Volleyball Player', emoji: '🏐', salary: 55000, minAge: 17, field: 'sports', skill: ['sport:volleyball'], minSkill: 60, minHealth: 65, growth: 1.5, levels: ['Bench Player', 'Starter', 'Team Captain'] },
  { id: 'baseball', title: 'Pro Baseball Player', emoji: '⚾', salary: 90000, minAge: 18, field: 'sports', skill: ['sport:baseball'], minSkill: 60, minHealth: 65, growth: 1.6, levels: ['Minor Leaguer', 'Major Leaguer', 'All-Star', 'Hall of Famer'] },
  { id: 'boxer', title: 'Pro Boxer', emoji: '🥊', salary: 60000, minAge: 18, field: 'sports', skill: ['sport:boxing'], minSkill: 60, minHealth: 75, growth: 1.9, levels: ['Amateur', 'Contender', 'Champion', 'Undisputed Champion'] },
  { id: 'gymnast', title: 'Olympic Gymnast', emoji: '🤸', salary: 45000, minAge: 15, field: 'sports', skill: ['sport:gymnastics'], minSkill: 65, minHealth: 70, growth: 1.6, levels: ['National Team', 'Olympian', 'Gold Medalist'] },
  { id: 'skater', title: 'Figure Skater', emoji: '⛸️', salary: 45000, minAge: 15, field: 'sports', skill: ['sport:skating'], minSkill: 60, minHealth: 65, growth: 1.6, levels: ['Junior Skater', 'National Champion', 'World Champion'] },
  { id: 'sprinter', title: 'Track Star', emoji: '🏃', salary: 45000, minAge: 17, field: 'sports', skill: ['sport:track'], minSkill: 60, minHealth: 75, growth: 1.6, levels: ['Sprinter', 'National Champion', 'Olympic Champion'] },
  { id: 'golfer', title: 'Pro Golfer', emoji: '⛳', salary: 60000, minAge: 18, field: 'sports', skill: ['sport:golf'], minSkill: 60, growth: 1.8, levels: ['Tour Rookie', 'Tour Pro', 'Major Champion'] },
  { id: 'coach', title: 'Sports Coach', emoji: '📋', salary: 48000, minAge: 21, field: 'sports', skill: ['sport:basketball', 'sport:soccer', 'sport:tennis', 'sport:swimming', 'sport:volleyball', 'sport:baseball', 'sport:boxing', 'sport:gymnastics', 'sport:skating', 'sport:track', 'sport:badminton', 'sport:golf'], minSkill: 40, levels: ['Assistant Coach', 'Head Coach', 'National Team Coach'] },

  /* ───── More specialties ───── */
  { id: 'anesthesiologist', title: 'Anesthesiologist', emoji: '😴', salary: 300000, minAge: 29, edu: 'med', minSmarts: 80, growth: 1.2, levels: ['Anesthesia Resident', 'Anesthesiologist', 'Chief of Anesthesia'] },
  { id: 'radiologist', title: 'Radiologist', emoji: '🩻', salary: 290000, minAge: 29, edu: 'med', minSmarts: 80, growth: 1.2, levels: ['Radiology Resident', 'Radiologist', 'Head of Radiology'] },
  { id: 'psychiatrist', title: 'Psychiatrist', emoji: '🛋️', salary: 240000, minAge: 29, edu: 'med', minSmarts: 75, growth: 1.2, levels: ['Psychiatry Resident', 'Psychiatrist', 'Clinical Director'] },
  { id: 'dermatologist', title: 'Dermatologist', emoji: '🧴', salary: 270000, minAge: 29, edu: 'med', minSmarts: 78, growth: 1.2, levels: ['Derm Resident', 'Dermatologist', 'Practice Owner'] },
  { id: 'oncologist', title: 'Oncologist', emoji: '🎗️', salary: 285000, minAge: 30, edu: 'med', minSmarts: 82, growth: 1.2, levels: ['Oncology Fellow', 'Oncologist', 'Head of Oncology'] },
  { id: 'obgyn', title: 'OB-GYN', emoji: '🤰', salary: 280000, minAge: 29, edu: 'med', minSmarts: 78, growth: 1.2, levels: ['OB Resident', 'OB-GYN', 'Chief of Obstetrics'] },
  { id: 'optometrist', title: 'Optometrist', emoji: '👓', salary: 130000, minAge: 26, edu: 'ba:bio', minSmarts: 65, levels: ['Associate Optometrist', 'Optometrist', 'Practice Owner'] },
  { id: 'physio', title: 'Physical Therapist', emoji: '🦵', salary: 95000, minAge: 24, edu: 'ba:bio', minSmarts: 55, levels: ['PT Assistant', 'Physical Therapist', 'Clinic Director'] },
  { id: 'nutritionist', title: 'Nutritionist', emoji: '🥗', salary: 68000, minAge: 22, edu: 'ba:bio', levels: ['Diet Assistant', 'Nutritionist', 'Head Dietitian'] },
  { id: 'midwife', title: 'Midwife', emoji: '👶', salary: 88000, minAge: 23, edu: 'ba:nursing', levels: ['Student Midwife', 'Midwife', 'Senior Midwife'] },
  { id: 'forensic', title: 'Forensic Scientist', emoji: '🔬', salary: 85000, minAge: 23, edu: 'ba:bio', minSmarts: 70, levels: ['Lab Tech', 'Forensic Scientist', 'Lab Director'] },
  { id: 'marinebio', title: 'Marine Biologist', emoji: '🐬', salary: 78000, minAge: 23, edu: 'ba:bio', minSmarts: 65, levels: ['Field Assistant', 'Marine Biologist', 'Research Lead'] },
  { id: 'astronomer', title: 'Astronomer', emoji: '🔭', salary: 92000, minAge: 24, edu: 'ba:bio', minSmarts: 80, levels: ['Research Assistant', 'Astronomer', 'Observatory Director'] },
  { id: 'meteorologist', title: 'Meteorologist', emoji: '🌦️', salary: 85000, minAge: 23, edu: 'ba:bio', minSmarts: 68, levels: ['Weather Analyst', 'Meteorologist', 'Chief Meteorologist'] },
  { id: 'archaeologist', title: 'Archaeologist', emoji: '🏺', salary: 72000, minAge: 24, edu: 'ba', minSmarts: 70, levels: ['Field Digger', 'Archaeologist', 'Excavation Director'] },
  { id: 'datasci', title: 'Data Scientist', emoji: '📊', salary: 125000, minAge: 22, edu: 'ba:cs', minSmarts: 70, growth: 1.35, levels: ['Data Analyst', 'Data Scientist', 'Lead Data Scientist', 'Chief Data Officer'] },
  { id: 'cyber', title: 'Cybersecurity Analyst', emoji: '🛡️', salary: 118000, minAge: 22, edu: 'ba:cs', minSmarts: 70, growth: 1.35, levels: ['Security Analyst', 'Senior Analyst', 'Security Architect', 'CISO'] },
  { id: 'airesearch', title: 'AI Researcher', emoji: '🤖', salary: 165000, minAge: 25, edu: 'ba:cs', minSmarts: 85, growth: 1.4, levels: ['Research Engineer', 'AI Researcher', 'Principal Scientist', 'Head of AI'] },
  { id: 'robotics', title: 'Robotics Engineer', emoji: '🦾', salary: 115000, minAge: 23, edu: 'ba:eng', minSmarts: 72, growth: 1.3, levels: ['Junior Roboticist', 'Robotics Engineer', 'Lead Roboticist'] },
  { id: 'aerospace', title: 'Aerospace Engineer', emoji: '🛰️', salary: 128000, minAge: 23, edu: 'ba:eng', minSmarts: 78, growth: 1.3, levels: ['Systems Engineer', 'Aerospace Engineer', 'Chief Engineer'] },
  { id: 'interior', title: 'Interior Designer', emoji: '🛋️', salary: 62000, minAge: 21, edu: 'ba:art', growth: 1.35, levels: ['Design Assistant', 'Interior Designer', 'Studio Owner'] },
  { id: 'animator', title: 'Animator', emoji: '🎞️', salary: 78000, minAge: 21, edu: 'ba:art', minSmarts: 60, growth: 1.35, levels: ['Junior Animator', 'Animator', 'Lead Animator', 'Animation Director'] },
  { id: 'videoeditor', title: 'Video Editor', emoji: '🎬', salary: 62000, minAge: 19, growth: 1.35, levels: ['Assistant Editor', 'Video Editor', 'Senior Editor'] },
  { id: 'soundeng', title: 'Sound Engineer', emoji: '🎚️', salary: 68000, minAge: 20, growth: 1.35, levels: ['Studio Assistant', 'Sound Engineer', 'Head Engineer'] },
  { id: 'voiceactor', title: 'Voice Actor', emoji: '🎙️', salary: 55000, minAge: 18, growth: 1.7, levels: ['Background Voice', 'Voice Actor', 'Lead Voice', 'Legendary Voice'] },
  { id: 'stunt', title: 'Stunt Performer', emoji: '🤸‍♂️', salary: 70000, minAge: 19, minHealth: 75, growth: 1.5, levels: ['Stunt Double', 'Stunt Performer', 'Stunt Coordinator'] },
  { id: 'esports', title: 'Esports Pro', emoji: '🕹️', salary: 65000, minAge: 16, special: true, minSmarts: 60, growth: 1.9, levels: ['Amateur', 'Pro Player', 'Team Captain', 'World Champion'] },
  { id: 'chessgm', title: 'Chess Grandmaster', emoji: '♟️', salary: 60000, minAge: 16, special: true, minSmarts: 88, growth: 1.7, levels: ['Master', 'International Master', 'Grandmaster', 'World Champion'] },
  { id: 'magician', title: 'Magician', emoji: '🎩', salary: 42000, minAge: 16, growth: 1.7, levels: ['Street Magician', 'Stage Magician', 'Headliner', 'Vegas Legend'] },
  { id: 'comedian', title: 'Comedian', emoji: '🎤', salary: 38000, minAge: 18, growth: 1.9, levels: ['Open Mic', 'Comedian', 'Touring Comic', 'Netflix Special'] },
  { id: 'author', title: 'Author', emoji: '📖', salary: 45000, minAge: 18, growth: 1.8, levels: ['Unpublished Writer', 'Published Author', 'Bestselling Author', 'Literary Legend'] },
  { id: 'translator', title: 'Translator', emoji: '🗣️', salary: 62000, minAge: 21, edu: 'ba', minSmarts: 65, levels: ['Junior Translator', 'Translator', 'Head Translator'] },
  { id: 'diplomat', title: 'Diplomat', emoji: '🌐', salary: 110000, minAge: 25, edu: 'ba', minSmarts: 72, cleanRecord: true, growth: 1.3, levels: ['Attaché', 'Diplomat', 'Ambassador'] },
  { id: 'detective', title: 'Detective', emoji: '🕵️', salary: 78000, minAge: 25, edu: 'hs', minSmarts: 65, cleanRecord: true, levels: ['Junior Detective', 'Detective', 'Chief Detective'] },
  { id: 'atc', title: 'Air Traffic Controller', emoji: '🗼', salary: 130000, minAge: 22, edu: 'hs', minSmarts: 78, levels: ['Trainee Controller', 'Controller', 'Senior Controller'] },
  { id: 'captain', title: 'Ship Captain', emoji: '⚓', salary: 105000, minAge: 25, edu: 'hs', minHealth: 60, levels: ['Deck Officer', 'First Mate', 'Captain'] },
  { id: 'farmer', title: 'Farmer', emoji: '🌾', salary: 42000, minAge: 18, minHealth: 55, levels: ['Farmhand', 'Farmer', 'Farm Owner', 'Agribusiness Owner'] },
  { id: 'beekeeper', title: 'Beekeeper', emoji: '🐝', salary: 38000, minAge: 18, levels: ['Apprentice', 'Beekeeper', 'Apiary Owner'] },
  { id: 'winemaker', title: 'Winemaker', emoji: '🍷', salary: 72000, minAge: 21, growth: 1.35, levels: ['Cellar Hand', 'Winemaker', 'Head Winemaker', 'Vineyard Owner'] },
  { id: 'pastrychef', title: 'Pastry Chef', emoji: '🧁', salary: 45000, minAge: 18, growth: 1.45, levels: ['Pastry Cook', 'Pastry Chef', 'Head Pastry Chef', 'Patisserie Owner'] },
  { id: 'sommelier', title: 'Sommelier', emoji: '🍾', salary: 68000, minAge: 21, growth: 1.3, levels: ['Wine Steward', 'Sommelier', 'Master Sommelier'] },
  { id: 'barber', title: 'Barber', emoji: '💈', salary: 38000, minAge: 18, growth: 1.3, levels: ['Apprentice Barber', 'Barber', 'Shop Owner'] },
  { id: 'yoga', title: 'Yoga Instructor', emoji: '🧘', salary: 45000, minAge: 18, minHealth: 65, growth: 1.3, levels: ['Assistant', 'Yoga Instructor', 'Studio Owner'] },
  { id: 'socialworker', title: 'Social Worker', emoji: '🫶', salary: 58000, minAge: 22, edu: 'ba:psych', levels: ['Case Assistant', 'Social Worker', 'Supervisor'] },
  { id: 'curator', title: 'Museum Curator', emoji: '🖼️', salary: 72000, minAge: 25, edu: 'ba:art', minSmarts: 68, levels: ['Assistant Curator', 'Curator', 'Museum Director'] },
  { id: 'ranger', title: 'Park Ranger', emoji: '🏞️', salary: 52000, minAge: 20, edu: 'hs', minHealth: 65, levels: ['Seasonal Ranger', 'Park Ranger', 'Chief Ranger'] },
  { id: 'carpenter', title: 'Carpenter', emoji: '🪚', salary: 55000, minAge: 18, levels: ['Apprentice', 'Carpenter', 'Master Carpenter', 'Contractor'] },
  { id: 'plumber', title: 'Plumber', emoji: '🚰', salary: 62000, minAge: 18, edu: 'hs', levels: ['Apprentice', 'Plumber', 'Master Plumber', 'Business Owner'] },

  { id: 'royal', title: 'Royal', emoji: '👑', salary: 2_000_000, minAge: 18, special: true, hidden: true, growth: 3.2, levels: ['Prince', 'Crown Prince', 'King'] },

  { id: 'actor', title: 'Movie Star', emoji: '🎬', salary: 40000, minAge: 16, special: true, minLooks: 70, growth: 1.9, levels: ['Extra', 'Supporting Actor', 'Leading Actor', 'Movie Star', 'Hollywood Legend'] },
  { id: 'popstar', title: 'Pop Star', emoji: '🎤', salary: 35000, minAge: 16, special: true, growth: 2.3, levels: ['Open Mic Singer', 'Opening Act', 'Chart Topper', 'Global Pop Icon'] },
  { id: 'athlete', title: 'Pro Athlete', emoji: '🏆', salary: 90000, minAge: 18, special: true, minHealth: 80, growth: 1.7, levels: ['Rookie', 'Starter', 'All-Star', 'MVP', 'Hall of Famer'] },
  { id: 'influencer', title: 'Influencer', emoji: '🤳', salary: 15000, minAge: 16, special: true, minLooks: 60, growth: 2.4, levels: ['Micro Influencer', 'Rising Creator', 'Verified Creator', 'Mega Influencer'] },
  { id: 'astronaut', title: 'Astronaut', emoji: '🧑‍🚀', salary: 120000, minAge: 26, special: true, edu: ['ba:eng', 'ba:cs', 'ba:bio'], minSmarts: 85, growth: 1.3, levels: ['Astronaut Candidate', 'Astronaut', 'Mission Specialist', 'Mission Commander'] },
  { id: 'mafia', title: 'Mafia Boss', emoji: '🕴️', salary: 60000, minAge: 21, special: true, needsRecord: true, growth: 1.7, levels: ['Associate', 'Soldier', 'Capo', 'Underboss', 'Mafia Boss'] },
  { id: 'president', title: 'President', emoji: '🏛️', salary: 90000, minAge: 35, special: true, edu: ['law', 'mba'], minSmarts: 70, cleanRecord: true, growth: 1.35, levels: ['City Council Member', 'Mayor', 'Governor', 'President'] },
];

export const salaryAt = (c: Career, level: number) => Math.round(c.salary * Math.pow(c.growth ?? 1.25, level));

const ROYAL_TITLES = { male: ['Prince', 'Crown Prince', 'King'], female: ['Princess', 'Crown Princess', 'Queen'] };
export const royalJobTitle = (gender: 'male' | 'female', level: number) => ROYAL_TITLES[gender][Math.min(2, level)];

export interface Major {
  id: string;
  name: string;
  minSmarts: number;
}

export const MAJORS: Major[] = [
  { id: 'cs', name: 'Computer Science', minSmarts: 55 },
  { id: 'eng', name: 'Engineering', minSmarts: 55 },
  { id: 'bio', name: 'Biology', minSmarts: 50 },
  { id: 'nursing', name: 'Nursing', minSmarts: 40 },
  { id: 'biz', name: 'Business', minSmarts: 35 },
  { id: 'psych', name: 'Psychology', minSmarts: 35 },
  { id: 'edu', name: 'Education', minSmarts: 30 },
  { id: 'jour', name: 'Journalism', minSmarts: 30 },
  { id: 'art', name: 'Fine Arts', minSmarts: 20 },
  { id: 'arch', name: 'Architecture', minSmarts: 50 },
];

export const UNIVERSITY = { years: 4, tuition: 24000 };

export interface GradProgram {
  id: string;
  name: string;
  years: number;
  tuition: number;
  minSmarts: number;
  /** Any of these degrees qualifies. 'ba' means any bachelor's. */
  requires: string[];
}

export const GRAD_PROGRAMS: GradProgram[] = [
  { id: 'law', name: 'Law School', years: 3, tuition: 48000, minSmarts: 60, requires: ['ba'] },
  { id: 'med', name: 'Medical School', years: 4, tuition: 58000, minSmarts: 70, requires: ['ba:bio', 'ba:nursing'] },
  { id: 'mba', name: 'MBA', years: 2, tuition: 62000, minSmarts: 50, requires: ['ba'] },
  { id: 'dental', name: 'Dental School', years: 4, tuition: 55000, minSmarts: 65, requires: ['ba:bio'] },
  { id: 'pharmacy', name: 'Pharmacy School', years: 3, tuition: 45000, minSmarts: 60, requires: ['ba:bio'] },
  { id: 'vetschool', name: 'Vet School', years: 4, tuition: 50000, minSmarts: 60, requires: ['ba:bio'] },
];

export function degreeName(id: string): string {
  if (id === 'hs') return 'High School Diploma';
  if (id === 'royal') return 'Royal Academy Diploma';
  if (id.startsWith('ba:')) return `Bachelor's in ${MAJORS.find((m) => m.id === id.slice(3))?.name ?? 'Arts'}`;
  return GRAD_PROGRAMS.find((p) => p.id === id)?.name ?? id;
}

export function eduRequirementLabel(req: string | string[]): string {
  if (Array.isArray(req)) return req.map(eduShortLabel).join(' or ') + ' degree';
  if (req === 'hs') return 'High school diploma';
  if (req === 'ba') return "Any bachelor's degree";
  if (req.startsWith('ba:')) return `${MAJORS.find((m) => m.id === req.slice(3))?.name} degree`;
  return `${GRAD_PROGRAMS.find((p) => p.id === req)?.name} degree`;
}

function eduShortLabel(req: string): string {
  if (req === 'ba') return "Bachelor's";
  if (req.startsWith('ba:')) return MAJORS.find((m) => m.id === req.slice(3))?.name ?? req;
  return GRAD_PROGRAMS.find((p) => p.id === req)?.name.replace(' School', '') ?? req;
}

export interface ShopItem {
  id: string;
  kind: 'house' | 'car';
  name: string;
  emoji: string;
  price: number;
  happiness: number;
}

export const SHOP: ShopItem[] = [
  { id: 'car1', kind: 'car', name: 'Used Hatchback', emoji: '🚗', price: 6000, happiness: 2 },
  { id: 'car2', kind: 'car', name: 'Family Sedan', emoji: '🚙', price: 26000, happiness: 3 },
  { id: 'car3', kind: 'car', name: 'Electric SUV', emoji: '🚘', price: 52000, happiness: 5 },
  { id: 'car4', kind: 'car', name: 'Sports Coupe', emoji: '🏎️', price: 110000, happiness: 8 },
  { id: 'car5', kind: 'car', name: 'Hypercar', emoji: '🚀', price: 450000, happiness: 12 },
  { id: 'h1', kind: 'house', name: 'Studio Condo', emoji: '🏢', price: 180000, happiness: 5 },
  { id: 'h2', kind: 'house', name: 'Suburban House', emoji: '🏡', price: 420000, happiness: 8 },
  { id: 'h3', kind: 'house', name: 'Beach House', emoji: '🏖️', price: 1200000, happiness: 12 },
  { id: 'h4', kind: 'house', name: 'Hilltop Mansion', emoji: '🏰', price: 4500000, happiness: 18 },
];
