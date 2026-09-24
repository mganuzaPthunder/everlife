# 🌙 LunaLife

A life simulator inspired by BitLife, set beneath a midnight sunset. Be born, grow up, sit your exams, fall in love, build a career, buy a house and decorate it — then carry on as your child when your life ends.

**Play it:** [everlife-by-angel.vercel.app](https://everlife-by-angel.vercel.app)

## What's in it

- **A life from 0 to the end.** Random yearly events with choices, stat drift, illness, prison, retirement and death — then continue as one of your children and keep the family line going.
- **Where you start matters.** Pick your birth: royalty, celebrity parents, wealthy, child of an official, normal, struggling or homeless. It's permanent, and it changes trust funds, connections and how much your parents will cover.
- **Royalty.** Born royal means the Royal Academy instead of school (etiquette, protocol, languages and how to wave), Prince/Princess from birth, royal duties at 18 and the throne later. Famous from the cradle. Ask the King and Queen for permission if you want a normal career — they say yes about half the time.
- **School with teeth.** One exam a year, with a review sheet you can fetch first. Report cards with per-subject marks and a teacher's note. Skip a year and your marks slide and valedictorian is gone. Every stage ends in a graduation ceremony: valedictorian, salutatorian, honours or a plain pass. Exams can be toggled off entirely.
- **Jobs with interviews.** Three questions before anyone hires you. Answer well and the job is yours to win; get one wrong and that employer won't see you again until next year.
- **Visual mini-games everywhere.** Every job task and every activity is illustrated: line the needle up with the vein, cut on the marked line in surgery, flip pancakes, bench-press to lockout, breathe with the circle, find the book on the shelf, sneak past a guard with a visible eyeline, pick the right outfit for a royal banquet.
- **Storylines that span years.** You meet a best friend at 11, fall out at 15, graduate together at 18 and still see them at 40. Also a rival, a first love, a mentor, a family secret and a stray that adopts you.
- **A home you design.** Buy a house by picking a neighbourhood on the city map (the address sets the price and how fast it gains value), then choose wall colour, flooring, bed, kitchen, garden and extras — a pool, home cinema, library or music studio — on a live cutaway of the house.
- **Looks.** 45 hairstyles, 34 outfits, 36 accessories, skin tones, eye colours and lashes. Restyle at the Salon, shop at the Mall, and customise your stat bars.
- **Social & fame.** Four social apps, posts that go viral or backfire, a fame ladder under your name from Not Known to Famous.
- **Money and mischief.** A casino (slots, blackjack, roulette), scratch cards and a Mega draw, shoplifting, a three-stage bank heist and a prison escape.
- **Plus:** music lessons and sports that unlock specialist careers, school clubs, dream careers with age-based goals that guarantee the job, side quests, a dating phone with a VIP tab, a family tree, a tiny newspaper every year, and synthesised click sounds you can mute.

**Multiplayer:** sign up with a username, email and password (scrypt-hashed). Every life has a 6-character code; a friend who enters it sends the owner a permission request. The owner decides between view-only and play, and can revoke access any time in Activities → 👥 Manage Users.

Built with **Vite + React + TypeScript**, plus one Vercel serverless function (`api/rpc.ts`) backed by **Upstash Redis** for accounts, cloud saves and multiplayer.

## Run locally

```bash
npm install
npm run dev
```

`npm run dev` stores everything in `.data/db.json` (git-ignored), so you can play without a database.

## Deploy to Vercel

### 1. Connect the database (required for accounts)

1. In your Vercel project, open **Storage → Create Database → Upstash (Redis)** (free tier is fine) and connect it to the project.
2. Vercel adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) environment variables automatically.
3. Redeploy. Without these variables the site shows "The LunaLife database isn't connected yet."

`vercel.json` pins the function to the `sin1` region — move it closer to your database if you deploy elsewhere.

### 2. Deploy

**Option A — Git:** import the repo in Vercel (**Add New → Project**) and deploy. Vercel auto-detects Vite; build command `npm run build`, output `dist`.

**Option B — CLI:**

```bash
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

## Project layout

```
src/
  game/
    types.ts         – game state shape
    engine.ts        – new life, aging up, school/work years, generations
    events.ts        – random yearly events (choice pop-ups + passive happenings)
    stories.ts       – storylines that play out over many years
    actions.ts       – activities, relationships, jobs, school, assets, paying
    school.ts        – exams, review sheets, report cards, graduation honours
    interview.ts     – job interview questions and rejections
    property.ts      – districts on the map, house decor, buying and redecorating
    news.ts          – the yearly newspaper
    data.ts          – careers, majors, grad programs, shop items
    dreams.ts        – dream careers and their goal checklists
    office.ts        – Office work scenarios per career
    workgames.ts     – which mini-game each job plays + quiz banks
    activitygames.ts – the mini-game behind each activity and lesson
    look.ts          – hair, clothes, accessories and stat-bar palettes
    origins.ts       – birth backgrounds (royalty, homeless, …)
    skills.ts        – instruments, sports and school clubs
    social.ts        – fame and the social apps
    quests.ts        – side quests
    dating.ts        – dating-app profiles (regular + VIP)
    storage.ts       – local saves, graveyard, save migration
  components/
    Avatar.tsx / AvatarParts.tsx – the character, drawn in SVG
    Scenes.tsx       – illustrated mini-game scenes (surgery, banquet, balcony…)
    Games.tsx        – mini-game engines (timing, simon, quiz, exam, interview…)
    Home.tsx         – city map, house cutaway and the decorator
    Sheets.tsx       – Work, Assets, People and Activities sheets
    Casino.tsx / Crime.tsx / Dating.tsx / Social.tsx / Lives.tsx
  sound.ts           – synthesised UI sounds (Web Audio, no files)
  styles.css         – midnight-sunset theme (colours are CSS variables in :root)
  cloud.ts           – session + RPC client
api/rpc.ts           – Vercel serverless entry
server/              – RPC actions (accounts, lives, codes, permissions) and the KV store
```

## Extending

- **New random event:** add to `CHOICE_EVENTS` or `PASSIVE_EVENTS` in `src/game/events.ts`.
- **New storyline:** add a `Story` with its beats to `STORIES` in `src/game/stories.ts`.
- **New job:** add to `CAREERS` in `src/game/data.ts` (optionally a dream in `dreams.ts`, scenarios in `office.ts`, a signature task in `workgames.ts`).
- **New activity:** add to `ACTIVITIES` in `src/game/actions.ts` and give it a mini-game in `activitygames.ts`.
- **New mini-game scene:** add a `SceneId` and its drawing in `src/components/Scenes.tsx`.
- **Retheme:** tweak the variables at the top of `src/styles.css`.
