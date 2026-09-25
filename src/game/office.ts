import type { Game, Result, StatKey } from './types';
import { adjust, log, used } from './helpers';
import { FEMALE, LAST, MALE } from './names';
import { chance, clamp, money, pick, rand } from './util';

export interface OfficeChoice {
  label: string;
  stat: StatKey;
  bold?: boolean;
  /** Extraordinary jobs only: a long shot with a huge payoff. */
  legend?: boolean;
  /** Bold failures here can land you in jail. */
  risky?: boolean;
  win: string;
  lose: string;
}

export interface Scenario {
  text: string;
  choices: OfficeChoice[];
}

/* {client} is replaced with a random name. */
const POOLS: Record<string, Scenario[]> = {
  law: [
    {
      text: '{client} is accused of stealing a neighbor’s prize-winning pumpkin the night before the county fair.',
      choices: [
        { label: 'Dig up an alibi witness', stat: 'smarts', win: 'A witness saw {client} stargazing all night. Case dismissed!', lose: 'The witness got the date wrong. The jury wasn’t convinced.' },
        { label: 'Give a dramatic closing speech', stat: 'looks', bold: true, win: 'The jury gave a standing ovation. Not guilty!', lose: 'I knocked over the evidence pumpkin mid-speech. We lost.' },
      ],
    },
    {
      text: 'A giant corporation wants to shut down {client}’s tiny bakery over its “too delicious” croissants.',
      choices: [
        { label: 'Negotiate a quiet settlement', stat: 'smarts', win: 'The corporation backed off and {client} sent me a lifetime of croissants.', lose: 'The settlement fell apart at the last minute.' },
        { label: 'Take it all the way to trial', stat: 'smarts', bold: true, win: 'We won big — it made headlines across the city!', lose: 'Their army of lawyers buried us in paperwork. We lost.' },
      ],
    },
  ],
  medical: [
    {
      text: '{client} comes in with a mysterious rash shaped exactly like a crescent moon.',
      choices: [
        { label: 'Run every test in the book', stat: 'smarts', win: 'The tests found a rare allergy. {client} recovered fast.', lose: 'The tests took so long {client} switched hospitals.' },
        { label: 'Trust your gut diagnosis', stat: 'smarts', bold: true, win: 'My hunch was exactly right. The whole ward was impressed.', lose: 'My diagnosis was completely wrong. Awkward.' },
      ],
    },
    {
      text: 'An emergency arrives at 3 a.m. — {client} needs help right now and the specialist is asleep.',
      choices: [
        { label: 'Wake the specialist', stat: 'smarts', win: 'Together we stabilized {client}. Textbook teamwork.', lose: 'The specialist was grumpy and blamed me for the delay.' },
        { label: 'Handle it yourself', stat: 'health', bold: true, win: 'I handled it flawlessly. {client} is going to be fine.', lose: 'I was exhausted and made a mistake. {client} is okay, but my boss isn’t happy.' },
      ],
    },
  ],
  tech: [
    {
      text: 'The servers crash at midnight right before a huge launch. {client} from the exec team is panicking.',
      choices: [
        { label: 'Roll back safely', stat: 'smarts', win: 'The rollback worked. We launched a day late, but smoothly.', lose: 'The rollback broke something else. Long night.' },
        { label: 'Hotfix it live', stat: 'smarts', bold: true, win: 'My live fix worked perfectly. Launch saved!', lose: 'My hotfix took the entire site down for six hours.' },
      ],
    },
    {
      text: 'Your experiment produces a result nobody expected. {client} wants to know what to do.',
      choices: [
        { label: 'Repeat it carefully', stat: 'smarts', win: 'The repeat confirmed a genuine breakthrough.', lose: 'The repeat showed it was just a dirty test tube.' },
        { label: 'Announce it immediately', stat: 'looks', bold: true, win: 'The announcement went viral in the science world!', lose: 'Turns out it was a measurement error. Very public embarrassment.' },
      ],
    },
  ],
  school: [
    {
      text: '{client} keeps falling asleep in the back of the room.',
      choices: [
        { label: 'Have a gentle talk after class', stat: 'happiness', win: '{client} opened up about working late nights. We made a plan together.', lose: '{client} just shrugged and kept sleeping.' },
        { label: 'Turn the lesson into a game show', stat: 'looks', bold: true, win: 'Everyone was wide awake and cheering. Best day ever.', lose: 'Chaos. Pure chaos. The principal walked in.' },
      ],
    },
  ],
  rescue: [
    {
      text: 'A call comes in: {client}’s cat is stuck on a very tall roof during a thunderstorm.',
      choices: [
        { label: 'Follow the safety protocol', stat: 'smarts', win: 'Slow and steady — the cat was rescued safely.', lose: 'By the time we set up, the cat climbed down on its own and hissed at me.' },
        { label: 'Climb up right now', stat: 'health', bold: true, win: 'I scaled the roof and saved the cat. The neighborhood cheered!', lose: 'I slipped and sprained my wrist. The cat was fine.' },
      ],
    },
    {
      text: 'A suspect bolts from {client}’s shop with a bag of stolen jewelry.',
      choices: [
        { label: 'Radio for backup', stat: 'smarts', win: 'Backup cut them off two blocks away. Clean arrest.', lose: 'Backup took too long and the suspect vanished.' },
        { label: 'Chase on foot', stat: 'health', bold: true, win: 'I tackled them in an alley. Jewelry recovered!', lose: 'I ran out of breath after one block. Embarrassing.' },
      ],
    },
  ],
  business: [
    {
      text: '{client}, a huge potential client, has fifteen minutes for your pitch.',
      choices: [
        { label: 'Present polished slides', stat: 'smarts', win: 'Clear, crisp, convincing. {client} signed the deal.', lose: 'The projector died halfway through.' },
        { label: 'Charm them over a fancy dinner', stat: 'looks', bold: true, win: '{client} loved the dinner and doubled the contract!', lose: 'I spilled wine on {client}’s suit. No deal.' },
      ],
    },
    {
      text: 'The quarterly numbers look bad and {client} from the board wants answers.',
      choices: [
        { label: 'Be honest and bring a plan', stat: 'smarts', win: 'The board appreciated my honesty and approved my plan.', lose: 'The board thought my plan was too cautious.' },
        { label: 'Spin it as a “strategic pivot”', stat: 'looks', bold: true, win: 'The board bought it — and the pivot actually worked!', lose: 'Nobody bought the spin. Tough meeting.' },
      ],
    },
  ],
  creative: [
    {
      text: '{client} needs a brand-new campaign by tomorrow morning.',
      choices: [
        { label: 'Go with a classic, reliable concept', stat: 'smarts', win: '{client} loved it. Reliable wins again.', lose: '{client} said it felt “a little boring.”' },
        { label: 'Try something wild', stat: 'happiness', bold: true, win: 'It was bold, strange, and absolutely brilliant. Award buzz!', lose: 'It was bold, strange, and absolutely hated.' },
      ],
    },
    {
      text: 'You’re booked for a big show and {client}, the producer, wants something unforgettable.',
      choices: [
        { label: 'Stick to what you’ve rehearsed', stat: 'happiness', win: 'A clean, confident performance. {client} booked me again.', lose: 'Solid but forgettable. {client} yawned.' },
        { label: 'Improvise a showstopper', stat: 'looks', bold: true, win: 'The crowd went wild — clips are everywhere online!', lose: 'I forgot where I was going with it. Crickets.' },
      ],
    },
  ],
  service: [
    {
      text: 'A customer named {client} is furious that their order is wrong.',
      choices: [
        { label: 'Apologize and fix it fast', stat: 'happiness', win: '{client} calmed down and left a glowing review.', lose: '{client} still asked to speak to my manager.' },
        { label: 'Crack a joke to lighten the mood', stat: 'looks', bold: true, win: '{client} burst out laughing and tipped big!', lose: '{client} did not find it funny. At all.' },
      ],
    },
    {
      text: 'It’s the busiest rush of the year and {client}, your coworker, called in sick.',
      choices: [
        { label: 'Stay calm and prioritize', stat: 'smarts', win: 'I kept everything running smoothly. The boss noticed.', lose: 'Things got backed up and customers grumbled.' },
        { label: 'Do everything at double speed', stat: 'health', bold: true, win: 'I was a blur of efficiency. Legendary shift!', lose: 'I dropped a whole tray. Everything went sideways.' },
      ],
    },
  ],

  /* ───── Extraordinary careers: three scenarios each, with a Legendary option ───── */
  actor: [
    {
      text: 'The director {client} wants you to cry on cue for the big emotional scene. The whole crew is watching.',
      choices: [
        { label: 'Think of something sad', stat: 'happiness', win: 'One perfect tear rolled down my cheek. {client} whispered “print it.”', lose: 'Nothing came out. We did 34 takes.' },
        { label: 'Rewrite the scene on the spot', stat: 'smarts', bold: true, win: 'My rewrite made the scene iconic. {client} gave me co-writing credit!', lose: '{client} was furious I changed the script.' },
        { label: 'Go full method for weeks', stat: 'looks', legend: true, win: 'My performance got a Best Actor nomination! 🏆 Hollywood can’t stop talking about me.', lose: 'I stayed in character so long I forgot my own name. The studio sent me home.' },
      ],
    },
    {
      text: 'You’re offered a stunt where you jump between two moving trains. {client}, your stunt double, is ready to step in.',
      choices: [
        { label: 'Let the stunt double do it', stat: 'smarts', win: '{client} nailed it and nobody could tell. Smart call.', lose: 'The fans noticed it wasn’t me. #FakeStunt trended.' },
        { label: 'Do it yourself', stat: 'health', bold: true, win: 'I did the jump myself. The behind-the-scenes clip went viral!', lose: 'I twisted my ankle mid-jump. Production shut down for a week.' },
        { label: 'Do it blindfolded for the trailer', stat: 'health', legend: true, win: 'The blindfolded jump became the most-watched trailer of the year! 🎬', lose: 'Blindfolded was a bad idea. I landed in a hay cart.' },
      ],
    },
    {
      text: 'A red-carpet reporter, {client}, asks about your rumored feud with a co-star.',
      choices: [
        { label: 'Smile and change the subject', stat: 'looks', win: 'Graceful and charming. The internet called me “unbothered royalty.”', lose: 'I dodged it so awkwardly that it made things worse.' },
        { label: 'Spill a tiny bit of tea', stat: 'looks', bold: true, win: 'The quote went viral and my movie’s ticket sales tripled!', lose: 'My co-star’s fans came for me online. Brutal week.' },
        { label: 'Announce a surprise movie together', stat: 'smarts', legend: true, win: 'The surprise announcement broke the internet. We’re Hollywood’s new power duo! 🌟', lose: 'My co-star had no idea and publicly denied it.' },
      ],
    },
  ],
  popstar: [
    {
      text: 'Your producer {client} says the new single needs a hook by tonight.',
      choices: [
        { label: 'Use a tried-and-true chord progression', stat: 'smarts', win: 'Catchy and reliable. The single hit the top 40.', lose: 'Critics called it “forgettable elevator music.”' },
        { label: 'Experiment with a weird new sound', stat: 'happiness', bold: true, win: 'The weird sound became the sound of the summer!', lose: 'Nobody understood it. Not even {client}.' },
        { label: 'Drop a surprise album at midnight', stat: 'looks', legend: true, win: 'The surprise album broke streaming records worldwide! 💿 I’m everywhere.', lose: 'The album dropped the same night as a bigger star’s. It vanished.' },
      ],
    },
    {
      text: 'Mid-concert, your in-ear monitor dies in front of 50,000 fans.',
      choices: [
        { label: 'Keep singing from memory', stat: 'smarts', win: 'Nobody even noticed. Total pro.', lose: 'I sang the second verse in the wrong key.' },
        { label: 'Get the crowd to sing it for you', stat: 'looks', bold: true, win: '50,000 people sang my song back to me. I cried. They cried. Iconic.', lose: 'The crowd didn’t know the words to the new song. Silence.' },
        { label: 'Crowd-surf across the stadium', stat: 'health', legend: true, win: 'I crowd-surfed the entire stadium while singing! Legendary moment in music history. 🎤', lose: 'The crowd accidentally dropped me. Tour paused for recovery.' },
      ],
    },
    {
      text: '{client}, a rising artist, asks you for a feature on their debut single.',
      choices: [
        { label: 'Say yes and record a verse', stat: 'happiness', win: 'The collab was sweet and both our fanbases loved it.', lose: 'The song flopped, but at least it was nice to help.' },
        { label: 'Take over as the lead', stat: 'looks', bold: true, win: 'My verse carried the song to #1!', lose: 'Fans said I stole {client}’s spotlight. Bad look.' },
        { label: 'Headline a charity festival together', stat: 'happiness', legend: true, win: 'The festival raised millions and I won Artist of the Year! 🌟', lose: 'It rained the entire festival. Half the stage flooded.' },
      ],
    },
  ],
  influencer: [
    {
      text: 'A brand run by {client} offers you a sponsorship for a very strange energy drink.',
      choices: [
        { label: 'Post an honest review', stat: 'smarts', win: 'My followers loved the honesty. Engagement up!', lose: 'The honest review annoyed {client}. They canceled the deal.' },
        { label: 'Make it a hilarious sketch', stat: 'happiness', bold: true, win: 'The sketch hit 10 million views. {client} doubled the deal!', lose: 'The joke didn’t land. People unfollowed.' },
        { label: 'Launch your own drink brand instead', stat: 'smarts', legend: true, win: 'My own drink sold out in an hour. I’m a mogul now! 🥤', lose: 'My drink tasted like pennies. Warehouse full of cans.' },
      ],
    },
    {
      text: 'An old post of yours resurfaces and people are asking questions.',
      choices: [
        { label: 'Post a sincere apology', stat: 'happiness', win: 'People appreciated the growth. It blew over quickly.', lose: 'The apology felt scripted. Comments were rough.' },
        { label: 'Go live and talk it through', stat: 'looks', bold: true, win: 'The livestream was raw and real. Followers doubled!', lose: 'The livestream went off the rails. Clip everywhere.' },
        { label: 'Log off and launch a comeback docu-series', stat: 'smarts', legend: true, win: 'The comeback series became a streaming hit! I’m bigger than ever. 📱', lose: 'Nobody watched. The internet already moved on.' },
      ],
    },
    {
      text: '{client}, a mega-creator, challenges you to a collab video.',
      choices: [
        { label: 'Film something simple and fun', stat: 'happiness', win: 'Wholesome content. Both audiences loved it.', lose: 'The video was so simple it got buried.' },
        { label: 'Attempt a wild stunt challenge', stat: 'health', bold: true, win: 'The stunt was insane and it trended for a week!', lose: 'I flopped the stunt. Everyone made memes of it.' },
        { label: 'Plan a charity livestream marathon', stat: 'happiness', legend: true, win: 'The 48-hour livestream raised a record amount for charity! 🌟 Verified legend.', lose: 'The Wi-Fi died four hours in.' },
      ],
    },
  ],
  sports: [
    {
      text: 'Championship game. Final seconds. {client}, your coach, looks at you.',
      choices: [
        { label: 'Pass to an open teammate', stat: 'smarts', win: 'The assist won us the game!', lose: 'The pass got intercepted.' },
        { label: 'Take the winning shot yourself', stat: 'health', bold: true, win: 'Buzzer beater! I’m on every highlight reel.', lose: 'Air ball. The whole arena groaned.' },
        { label: 'Call your shot like a legend', stat: 'looks', legend: true, win: 'I pointed to the spot, then made the shot. Greatest moment in league history! 🏆', lose: 'I called my shot... and missed. The memes will outlive me.' },
      ],
    },
    {
      text: 'Your rival {client} trash-talks you before the season opener.',
      choices: [
        { label: 'Stay humble and focused', stat: 'happiness', win: 'I let my game do the talking and dominated.', lose: 'I stayed quiet and played quietly too. Rough game.' },
        { label: 'Fire back on social media', stat: 'looks', bold: true, win: 'My clapback went viral and I backed it up on the field!', lose: 'My clapback aged terribly after we lost.' },
        { label: 'Train in secret at 4 a.m. every day', stat: 'health', legend: true, win: 'I broke the world record in the opener! 🌍 Nobody saw it coming.', lose: 'I overtrained and pulled a hamstring before the game.' },
      ],
    },
    {
      text: 'A sports network wants {client} to film a documentary about your season.',
      choices: [
        { label: 'Keep cameras out of the locker room', stat: 'smarts', win: 'The team stayed focused and we had a great season.', lose: 'The network was annoyed and ran a boring cut.' },
        { label: 'Let them film everything', stat: 'looks', bold: true, win: 'The documentary was a hit and my jersey sold out!', lose: 'They filmed my worst tantrum. It aired.' },
        { label: 'Promise a championship on camera', stat: 'health', legend: true, win: 'I promised a title — and delivered it! The documentary won an Emmy. 🏆', lose: 'We lost in the first round. On camera. Forever.' },
      ],
    },
  ],
  space: [
    {
      text: 'An oxygen sensor alarm goes off on the station. {client} at mission control is on the line.',
      choices: [
        { label: 'Follow the checklist exactly', stat: 'smarts', win: 'By the book, problem solved. Mission control applauded.', lose: 'The checklist was outdated. We lost a day of experiments.' },
        { label: 'Improvise a fix with duct tape', stat: 'smarts', bold: true, win: 'My improvised fix is now official procedure!', lose: 'The duct tape floated away. Mission control sighed.' },
        { label: 'Do an emergency spacewalk', stat: 'health', legend: true, win: 'My spacewalk saved the station. I’m on the cover of every newspaper on Earth! 🚀', lose: 'My tether tangled. I had to be reeled back in like a fish.' },
      ],
    },
    {
      text: 'Your telescope picks up a strange signal. {client} wants to know if it’s worth reporting.',
      choices: [
        { label: 'Double-check the equipment', stat: 'smarts', win: 'It was a real signal from a new pulsar. Solid discovery!', lose: 'It was a microwave in the galley. Oops.' },
        { label: 'Report it to the world', stat: 'looks', bold: true, win: 'The discovery made headlines worldwide!', lose: 'It was interference. Embarrassing press conference.' },
        { label: 'Reply to the signal', stat: 'smarts', legend: true, win: 'Something replied. I’m the first human to talk to... someone. 👽', lose: 'Nothing replied. The world laughed at the “alien ghosting.”' },
      ],
    },
    {
      text: 'The landing module drifts off course during a Moon approach. {client} is your co-pilot.',
      choices: [
        { label: 'Let the autopilot correct it', stat: 'smarts', win: 'The autopilot corrected course. Smooth landing.', lose: 'The autopilot landed us in a crater. Bumpy.' },
        { label: 'Take manual control', stat: 'health', bold: true, win: 'I flew it by hand and landed perfectly!', lose: 'Manual landing was rough. Some equipment broke.' },
        { label: 'Land on the far side of the Moon', stat: 'smarts', legend: true, win: 'First crewed landing on the far side of the Moon! History books forever. 🌕', lose: 'We couldn’t reach mission control for hours. Scary.' },
      ],
    },
  ],
  mafia: [
    {
      text: 'A rival family led by {client} is moving in on your turf.',
      choices: [
        { label: 'Arrange a sit-down', stat: 'smarts', win: 'We agreed on new borders over cannoli. Respect earned.', lose: '{client} walked out of the meeting. Now it’s tense.' },
        { label: 'Send a message', stat: 'health', bold: true, risky: true, win: 'The rivals packed up and left town.', lose: 'It backfired and the cops got involved.' },
        { label: 'Unite all the families under you', stat: 'smarts', legend: true, risky: true, win: 'Every family in the city now answers to me. 🕴️ The Godfather would be proud.', lose: 'The families united — against me.' },
      ],
    },
    {
      text: 'A detective named {client} has been following you for weeks.',
      choices: [
        { label: 'Lay low for a while', stat: 'smarts', win: 'The detective lost interest. Business as usual.', lose: 'Laying low cost me a big deal.' },
        { label: 'Offer the detective a “gift”', stat: 'looks', bold: true, risky: true, win: 'The detective is now on my payroll.', lose: 'The detective was wearing a wire.' },
        { label: 'Go legit and open a restaurant', stat: 'happiness', legend: true, win: 'My restaurant got a Michelin star. Perfect cover — and the pasta is incredible. 🍝', lose: 'The health inspector shut it down on opening night.' },
      ],
    },
    {
      text: 'Your accountant {client} says the books don’t add up.',
      choices: [
        { label: 'Audit everything quietly', stat: 'smarts', win: 'Found the leak and plugged it. Profits up.', lose: 'The audit found nothing. Money still missing.' },
        { label: 'Confront the crew at dinner', stat: 'health', bold: true, risky: true, win: 'The thief confessed over tiramisu. Order restored.', lose: 'Dinner turned into a brawl. Someone called the cops.' },
        { label: 'Launder it through a movie studio', stat: 'smarts', legend: true, risky: true, win: 'The movie accidentally became a blockbuster. Clean money AND an award! 🎬', lose: 'The feds were very interested in my “movie.”' },
      ],
    },
  ],
  politics: [
    {
      text: '{client} brings you a bill to plant a million trees across the country.',
      choices: [
        { label: 'Build a compromise', stat: 'smarts', win: 'It passed with support from both sides!', lose: 'The compromise pleased nobody.' },
        { label: 'Push it through with a big speech', stat: 'looks', bold: true, win: 'My speech went viral and the bill passed in a landslide!', lose: 'The speech flopped and the bill died.' },
        { label: 'Plant a billion trees instead', stat: 'happiness', legend: true, win: 'The Billion Tree Act passed! Future generations will name forests after me. 🌳', lose: 'Critics called it “too many trees.” It stalled in committee.' },
      ],
    },
    {
      text: 'The big televised debate is tonight. Your opponent {client} is a fierce speaker.',
      choices: [
        { label: 'Stick to your talking points', stat: 'smarts', win: 'Calm, clear, presidential. Polls went up.', lose: 'I sounded like a robot. Polls went down.' },
        { label: 'Go on the attack', stat: 'looks', bold: true, win: 'My zinger was the headline of every paper!', lose: 'The attack backfired. {client} looked like the grown-up.' },
        { label: 'Invite {client} to work together', stat: 'happiness', legend: true, win: 'The unity moment made history. My approval hit 90%! 🏛️', lose: '{client} laughed on live TV. Ouch.' },
      ],
    },
    {
      text: 'A natural disaster hits a coastal town. {client}, the local mayor, calls for help.',
      choices: [
        { label: 'Send emergency funding', stat: 'smarts', win: 'The funding arrived fast. The town is rebuilding.', lose: 'Red tape delayed the funds for weeks.' },
        { label: 'Fly there yourself', stat: 'health', bold: true, win: 'Being there in person meant everything. Approval soared.', lose: 'My visit got in the way of rescue crews.' },
        { label: 'Launch a national rebuild program', stat: 'smarts', legend: true, win: 'The rebuild program created a million jobs. I’m being called the greatest leader in a generation! 🌟', lose: 'The program went wildly over budget.' },
      ],
    },
  ],
};

const POOL_OF: Record<string, string> = {
  lawyer: 'law', president: 'politics',
  doctor: 'medical', nurse: 'medical', counselor: 'medical', pediatrician: 'medical', surgeon: 'medical', cardiologist: 'medical',
  neurosurgeon: 'medical', dentist: 'medical', vet: 'medical', pilot: 'rescue', chef: 'service', architect: 'tech', gamedev: 'tech',
  dev: 'tech', engineer: 'tech', scientist: 'tech',
  teacher: 'school',
  police: 'rescue', firefighter: 'rescue', lifeguard: 'rescue',
  exec: 'business', accountant: 'business', realtor: 'business', receptionist: 'business',
  designer: 'creative', journalist: 'creative', musician: 'creative', model: 'creative',
  actor: 'actor', popstar: 'popstar', influencer: 'influencer',
  baker: 'service', florist: 'service', hairstylist: 'creative', makeup: 'creative', tattoo: 'creative', zookeeper: 'rescue', trainer: 'sports',
  photographer: 'creative', mechanic: 'service', flightattendant: 'service', paramedic: 'medical', electrician: 'service', librarian: 'school',
  fashiondesigner: 'creative', stockbroker: 'business', pharmacist: 'medical', judge: 'law',
  guitarist: 'creative', pianist: 'creative', violinist: 'creative', drummer: 'creative', singer: 'creative', saxophonist: 'creative', dj: 'creative',
  orchestra: 'creative', musicteacher: 'school',
  basketball: 'sports', soccer: 'sports', tennis: 'sports', swimmer: 'sports', volleyball: 'sports', baseball: 'sports', boxer: 'sports',
  gymnast: 'sports', skater: 'sports', sprinter: 'sports', golfer: 'sports', coach: 'sports',
  anesthesiologist: 'medical', radiologist: 'medical', psychiatrist: 'medical', dermatologist: 'medical', oncologist: 'medical', obgyn: 'medical',
  optometrist: 'medical', physio: 'medical', nutritionist: 'medical', midwife: 'medical', forensic: 'tech', marinebio: 'tech', astronomer: 'space',
  meteorologist: 'tech', archaeologist: 'tech', datasci: 'tech', cyber: 'tech', airesearch: 'tech', robotics: 'tech', aerospace: 'space',
  interior: 'creative', animator: 'creative', videoeditor: 'creative', soundeng: 'creative', voiceactor: 'creative', stunt: 'sports',
  esports: 'sports', chessgm: 'business', magician: 'creative', comedian: 'creative', author: 'creative', translator: 'business', diplomat: 'politics',
  detective: 'rescue', atc: 'rescue', captain: 'rescue', farmer: 'service', beekeeper: 'service', winemaker: 'service', pastrychef: 'service',
  sommelier: 'service', barber: 'creative', yoga: 'medical', socialworker: 'medical', curator: 'creative', ranger: 'rescue', carpenter: 'service', plumber: 'service',
  cashier: 'service', barista: 'service', bartender: 'service', fastfood: 'service', babysitter: 'service', dogwalker: 'service', warehouse: 'service',
  athlete: 'sports', astronaut: 'space', mafia: 'mafia',
};

export const OFFICE_TASKS_PER_YEAR = 3;

export const officeTasksLeft = (g: Game) =>
  OFFICE_TASKS_PER_YEAR - Array.from({ length: OFFICE_TASKS_PER_YEAR }, (_, i) => used(g, `office:${i}`)).filter(Boolean).length;

export interface OfficeDraw {
  pool: string;
  index: number;
  client: string;
}

export function drawScenario(careerId: string): OfficeDraw {
  const pool = POOL_OF[careerId] ?? 'service';
  const client = `${pick([...MALE, ...FEMALE])} ${pick(LAST)}`;
  return { pool, index: rand(0, POOLS[pool].length - 1), client };
}

export function scenarioOf(d: OfficeDraw): Scenario {
  const s = POOLS[d.pool][d.index];
  const fill = (t: string) => t.split('{client}').join(d.client);
  return { text: fill(s.text), choices: s.choices.map((c) => ({ ...c, win: fill(c.win), lose: fill(c.lose) })) };
}

export function successChance(g: Game, c: OfficeChoice) {
  const perf = g.job ? (g.job.performance - 50) / 400 : 0;
  const base = c.legend ? 0.18 : c.bold ? 0.4 : 0.7;
  return clamp(base + (g.stats[c.stat] - 50) / (c.legend ? 250 : 160) + perf, c.legend ? 0.05 : 0.1, c.legend ? 0.45 : 0.95);
}

export function doOfficeTask(g: Game, d: OfficeDraw, choiceIndex: number): Result | undefined {
  const job = g.job;
  const left = officeTasksLeft(g);
  if (!job || g.prison > 0 || left <= 0) return;
  g.used.push(`office:${OFFICE_TASKS_PER_YEAR - left}`);

  const c = scenarioOf(d).choices[choiceIndex];
  const before = job.salary;
  if (chance(successChance(g, c))) {
    const pct = c.legend ? rand(15, 25) : c.bold ? rand(5, 9) : rand(2, 4);
    job.salary = Math.round(job.salary * (1 + pct / 100));
    job.performance = clamp(job.performance + (c.legend ? 20 : c.bold ? 12 : 6));
    adjust(g, 'happiness', c.legend ? 12 : 3);
    return { emoji: c.legend ? '🌟' : '📈', title: c.legend ? 'LEGENDARY!' : 'Nailed it!', text: `${c.win} Salary ${money(before)} → ${money(job.salary)} (+${pct}%).`, celebrate: c.legend };
  }

  const pct = c.legend ? rand(6, 9) : c.bold ? rand(3, 5) : rand(1, 2);
  job.salary = Math.round(job.salary * (1 - pct / 100));
  job.performance = clamp(job.performance - (c.legend ? 14 : c.bold ? 10 : 4));
  adjust(g, 'happiness', c.legend ? -6 : -3);
  if (c.risky && chance(0.25)) {
    const title = job.title;
    g.job = null;
    g.prison = rand(2, 5);
    g.criminalRecord++;
    log(g, `${c.lose} I lost my position as ${title}.`);
    return { emoji: '⛓️', title: 'Busted', text: `I was arrested and sentenced to ${g.prison} years in prison.` };
  }
  return { emoji: '📉', title: 'Rough day', text: `${c.lose} Salary ${money(before)} → ${money(job.salary)} (−${pct}%).` };
}
