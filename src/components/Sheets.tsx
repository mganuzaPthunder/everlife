import { Fragment, useState } from 'react';
import type { ExamPaper, Game, Look, Person, Result } from '../game/types';
import { CAREERS, SHOP, UNIVERSITY, degreeName, eduRequirementLabel, type Career, type ShopItem } from '../game/data';
import { chooseDream, dreamGuaranteed, dreamOpensProgram } from '../game/dreams';
import { doOfficeTask, drawScenario, officeTasksLeft, scenarioOf, successChance, type OfficeDraw } from '../game/office';
import { Avatar } from './Avatar';
import { WorkGamePlayer } from './Games';
import { activityGame, lessonGame } from '../game/activitygames';
import {
  examBlock, examPaperFor, examSubjects, examTitle, finalYear, finishExam, graduate, graduateBlock,
  lastReport, reportCards, sheetBlock, stageLabel, studySheet, takeReviewSheet, toggleExams,
} from '../game/school';
import { makeInterview, failInterview, type Interview } from '../game/interview';
import { ExamGame, InterviewGame } from './Games';
import { isMuted, setMuted } from '../sound';
import { HouseEditor, LocationPicker } from './Home';
import { buyProperty, districtOf, redecorate } from '../game/property';
import { CasinoView, LotteryView } from './Casino';
import { EscapeGame, HeistGame, ShopliftGame } from './Crime';
import { finishWorkGame, withVoice, workGameFor, workGamesFor, type WorkGame } from '../game/workgames';
import { DatingPhone } from './Dating';
import { ManageUsers } from './Lives';
import { SocialPhone } from './Social';
import { BusinessTab } from './Business';
import { AccountInfo } from './Account';
import { minigamesOff, quickEscape, quickExam, quickHeist, quickWork, toggleMinigames } from '../game/quickplay';
import { QUESTS, acceptQuest, abandonQuest, activeQuests, availableQuests, claimQuest, questOf } from '../game/quests';
import type { LifeMeta, Overview } from '../cloud';
import { originOf } from '../game/origins';
import { royalFree } from '../game/engine';
import { CLUBS, INSTRUMENTS, MAX_CLUBS, SPORTS, clubOf, skillName } from '../game/skills';
import { BarEditor, DreamCard, DreamPicker, LookEditor } from './Editors';
import { avatar, fullName, hasEdu, isCore, living, playableChildren, relationLabel } from '../game/helpers';
import {
  INTERACTIONS, activityBlock, applyJob, askRaise, availablePrograms, buy, buyBlock, careerBlock, doActivity, dropOut, enroll,
  interact, interactionBlock, quitJob, retire, salonBlock, salonPrice, salonVisit, schoolBlock, schoolName, sell, study, takeGed, visibleActivities, workHarder,
  activityPrice, askRoyalFreedom, buyLook, canAskParents, royalAskBlock, clubBlock, joinClub, leaveClub, lessonBlock, lessonTotal, lookCost, mallBlock, parentsPayChance, salonTotal, skillOf, takeLesson, ADOPTION_FEE, adoptBlock, adoptChild, adoptionCandidates, surrender, willBlock, willCandidates, willPrice, writeWill, BLESSINGS, pray, prayBlock, prayerPrice, askParents, askTuition, PREFERENCES, STATUS_PRICE, changeGender, changePreference, statusBlock, type Payer, type LessonKind, type MiniGame, type PayMode, type Program,
} from '../game/actions';
import { used } from '../game/helpers';
import { money } from '../game/util';
import { formatFollowers, totalFollowers } from '../game/social';
import { Bar, Row, Sheet } from './ui';

export type Act = (fn: (g: Game) => Result | undefined | void) => void;
interface Props { game: Game; act: Act; onClose: () => void }

/* ───────── Work: Office + Jobs & School ───────── */

export function OccupationSheet({ game, act, onClose }: Props) {
  const [tab, setTab] = useState<'office' | 'jobs' | 'school' | 'business'>(game.job ? 'office' : game.education.stage !== 'none' || game.age < 16 ? 'school' : 'jobs');
  const [jobCat, setJobCat] = useState<'parttime' | 'fulltime' | 'music' | 'sports' | 'extra'>(game.age < 18 ? 'parttime' : 'fulltime');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [clubsOpen, setClubsOpen] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [tuitionAnswer, setTuitionAnswer] = useState<{ yes: boolean; text: string } | null>(null);
  const [majors, setMajors] = useState(false);
  const [draw, setDraw] = useState<OfficeDraw | null>(null);
  const [playing, setPlaying] = useState<WorkGame | null>(null);
  const [exam, setExam] = useState<ExamPaper | null>(null);
  const [studying, setStudying] = useState(false);
  const [reports, setReports] = useState(false);
  const [interview, setInterview] = useState<{ career: Career; paper: Interview } | null>(null);
  const e = game.education;
  const job = game.job;

  if (program) {
    const total = program.tuition * program.years;
    const guaranteed = dreamOpensProgram(game, program.kind === 'university' ? `ba:${program.id}` : program.id);
    const run = (pay: PayMode) => { act((g) => enroll(g, program.kind, program.id, pay)); setProgram(null); setMajors(false); };
    return (
      <Sheet title={program.name} onClose={onClose} onBack={() => setProgram(null)}>
        <div className="card">
          <h4>{program.kind === 'university' ? `Bachelor's in ${program.name}` : program.name}</h4>
          <p className="sub">{program.years} years · {money(program.tuition)}/year · {money(total)} total</p>
          <p className="sub">{guaranteed ? '🌠 Your dream guarantees acceptance!' : `Recommended wisdom: ${program.minSmarts}+ (you have ${game.stats.smarts})`}</p>
        </div>
        <p className="section-title">How will you pay?</p>
        <Row emoji="🏦" title="Student loans" sub="Repaid from your savings later, with interest" onClick={() => run('loans')} />
        {tuitionAnswer?.yes ? (
          <Row emoji="💜" title="Enroll — my parents are paying" sub={tuitionAnswer.text} onClick={() => run('parents')} />
        ) : (
          <Row emoji={tuitionAnswer ? '🙅' : '👪'} title="Ask my parents"
            sub={tuitionAnswer ? tuitionAnswer.text : originOf(game.origin).tuition >= 99 ? 'Your family will happily pay 💎' : originOf(game.origin).tuition === 0 ? 'Your family can’t afford it' : 'They might say no — you’ll hear before applying'}
            onClick={() => {
              let reply: { yes: boolean; text: string } | null = null;
              act((g) => { reply = askTuition(g, program.id); });
              setTuitionAnswer(reply);
            }}
            disabled={!!tuitionAnswer || originOf(game.origin).tuition === 0 || !living(game, 'mother', 'father').length} />
        )}
        <Row emoji="💵" title="Pay upfront" sub={money(total)} onClick={() => run('cash')} disabled={game.money < total} />
      </Sheet>
    );
  }

  const programs = availablePrograms(game);
  const enrollBlock = schoolBlock(game);
  const programRow = (p: Program) => {
    const block = enrollBlock ?? (used(game, `enroll:${p.id}`) ? 'Applied this year' : null);
    return (
      <Row key={`${p.kind}:${p.id}`} emoji={p.kind === 'graduate' ? '🏛️' : '📘'} title={p.name}
        sub={block ?? `${p.years} years · wisdom ${p.minSmarts}+`}
        side={money(p.tuition)} sideSub="/ year" onClick={() => { setTuitionAnswer(null); setProgram(p); }} disabled={!!block} />
    );
  };

  if (majors) {
    return (
      <Sheet title="Choose a major" onClose={onClose} onBack={() => setMajors(false)}>
        <p className="note" style={{ marginBottom: 12 }}>A bachelor’s takes {UNIVERSITY.years} years. Your smarts: {game.stats.smarts}.</p>
        {programs.filter((p) => p.kind === 'university').map(programRow)}
      </Sheet>
    );
  }

  const grad = programs.filter((p) => p.kind === 'graduate');
  const hasMajors = programs.some((p) => p.kind === 'university');
  const careerRow = (c: Career) => {
    const block = careerBlock(game, c);
    const dream = dreamGuaranteed(game, c.id);
    const req = [
      c.edu && eduRequirementLabel(c.edu),
      c.minLooks && `Charm ${c.minLooks}+`,
      c.minHealth && `Wellness ${c.minHealth}+`,
      c.skill && `${c.skill.length > 1 ? 'Any instrument/sport' : skillName(c.skill[0])} ${c.minSkill}+`,
      c.special && !dream && 'Very hard to break into',
    ].filter(Boolean).join(' · ');
    return (
      <Row key={c.id} emoji={c.emoji} title={c.title} sub={block ?? (dream ? '🌟 Dream job — guaranteed!' : req ? `${req} · interview` : 'Interview required')}
        side={money(c.salary)} sideSub="/ year" disabled={!!block}
        onClick={() => (dream
          // A guaranteed dream job skips the interview — you already proved yourself.
          ? act((g) => applyJob(g, c.id))
          : minigamesOff(game) ? act((g) => applyJob(g, c.id))
          : setInterview({ career: c, paper: makeInterview(c) }))} />
    );
  };

  const tabs = (
    <div className="seg work-tabs">
      <button type="button" className={tab === 'office' ? 'on' : ''} onClick={() => setTab('office')}>🏢 Office</button>
      <button type="button" className={tab === 'jobs' ? 'on' : ''} onClick={() => setTab('jobs')}>💼 Jobs</button>
      <button type="button" className={tab === 'school' ? 'on' : ''} onClick={() => setTab('school')}>🎒 School</button>
      <button type="button" className={tab === 'business' ? 'on' : ''} onClick={() => setTab('business')}>🏗️ Make Own</button>
    </div>
  );

  if (exam) {
    return (
      <ExamGame paper={exam} title={examTitle(game)} reviewed={!!game.education.reviewSheet} onClose={() => setExam(null)}
        onDone={(marks) => { setExam(null); act((g) => finishExam(g, marks)); }} />
    );
  }

  // The review sheet is this year's paper with the answers filled in.
  const sheet = studySheet(game);
  if (studying && sheet) {
    const bySubject = sheet.questions.reduce<Record<string, typeof sheet.questions>>((map, q) => {
      (map[q.subject] ??= []).push(q);
      return map;
    }, {});
    return (
      <Sheet title="📄 Review sheet" onClose={onClose} onBack={() => setStudying(false)}>
        <p className="note" style={{ marginBottom: 12 }}>
          These are the {sheet.questions.length} questions on this year’s exam, with the answers.
          Read it as long as you like — once the exam starts you can’t come back here.
        </p>
        {Object.entries(bySubject).map(([subject, questions]) => (
          <div className="study-block" key={subject}>
            <p className="section-title">{subject}</p>
            {questions.map((q) => (
              <div className="study-q" key={q.q}>
                <p className="study-ask">{q.q}</p>
                <p className="study-answer"><span>✓</span> {q.a}</p>
              </div>
            ))}
          </div>
        ))}
        <div className="sticky-cta">
          <button className="btn primary block" onClick={() => { setStudying(false); if (minigamesOff(game)) act(quickExam); else setExam(examPaperFor(game)); }}>
            📝 I’m ready — take the exam
          </button>
        </div>
      </Sheet>
    );
  }

  if (interview) {
    return (
      <InterviewGame interview={interview.paper} onClose={() => setInterview(null)}
        onDone={(wrong) => {
          const { career } = interview;
          setInterview(null);
          act((g) => (wrong === 0 ? applyJob(g, career.id, true) : failInterview(g, career, wrong)));
        }} />
    );
  }

  if (reports) {
    const cards = [...reportCards(game)].reverse();
    return (
      <Sheet title="📋 Report cards" onClose={onClose} onBack={() => setReports(false)}>
        {cards.length === 0 && <p className="note">No report cards yet.</p>}
        {cards.map((card) => (
          <div className={`card report-card ${card.skipped ? 'skipped' : ''}`} key={`${card.age}-${card.stage}`}>
            <div className="report-top">
              <span className={`report-grade ${card.skipped ? 'skip' : ''}`}>{card.grade}</span>
              <span>
                <b>Age {card.age} · {card.stage === 'royal' ? 'Royal Academy' : card.stage}</b>
                <small>{card.score}% overall</small>
              </span>
            </div>
            <div className="report-subjects">
              {card.subjects.map((sub) => (
                <div className="report-sub" key={sub.name}>
                  <span>{sub.name}</span>
                  <Bar value={sub.mark} kind="smarts" />
                  <b>{sub.mark}%</b>
                </div>
              ))}
            </div>
            <p className="report-note">“{card.note}”</p>
          </div>
        ))}
      </Sheet>
    );
  }

  if (clubsOpen) {
    return (
      <Sheet title="School clubs" onClose={onClose} onBack={() => setClubsOpen(false)}>
        <p className="note" style={{ marginBottom: 12 }}>Join up to {MAX_CLUBS}. Each year in a club boosts your stats, and after two years you might be elected president!</p>
        {CLUBS.map((c) => {
          const block = clubBlock(game, c.id);
          return (
            <Row key={c.id} emoji={c.emoji} title={c.name} sub={block ?? `${c.desc}${c.tryout ? ` · ${c.tryout.label}` : ''}`}
              onClick={() => act((g) => joinClub(g, c.id))} disabled={!!block} />
          );
        })}
      </Sheet>
    );
  }

  if (tab === 'business') {
    return (
      <Sheet title="Career" onClose={onClose}>
        {tabs}
        <BusinessTab game={game} act={act} />
      </Sheet>
    );
  }

  if (tab === 'office') {
    const left = officeTasksLeft(game);
    const scenario = draw && scenarioOf(draw);
    return (
      <Sheet title="Career" onClose={onClose}>
        {tabs}
        {game.prison > 0 && <div className="card"><h4>⛓️ In prison</h4><p className="sub">{game.prison} year{game.prison > 1 ? 's' : ''} left on your sentence.</p></div>}
        {!job && game.prison === 0 && (
          <div className="card">
            <h4>🏢 No office yet</h4>
            <p className="sub">{game.retired ? `You’re retired with a ${money(game.pension)} pension. Enjoy it!` : 'Get a job in the Jobs & School tab, then come back here to do your work.'}</p>
          </div>
        )}
        {job && (
          <>
            <div className="card">
              <h4>{CAREERS.find((c) => c.id === job.careerId)?.emoji} {job.title}</h4>
              <p className="sub">{money(job.salary)} / year · {job.years} year{job.years === 1 ? '' : 's'}{job.partTime ? ' · Part-time' : ''}</p>
              <div className="stat" style={{ marginTop: 10 }}>
                <span className="lbl">Performance</span><Bar value={job.performance} kind="smarts" /><span className="num">{job.performance}%</span>
              </div>
              <div className="actions">
                <button className="btn small" onClick={() => act(workHarder)} disabled={used(game, 'job:harder')}>💪 Work harder</button>
                <button className="btn small" onClick={() => act(askRaise)} disabled={used(game, 'job:raise')}>💰 Ask for raise</button>
                {!job.partTime && !job.royal && game.age >= 60 && <button className="btn small" onClick={() => act(retire)}>🏖️ Retire</button>}
                <button className="btn small danger" onClick={() => { setDraw(null); act(quitJob); }}>{job.royal ? 'Abdicate' : 'Quit'}</button>
              </div>
            </div>

            <div className="section-row">
              <p className="section-title">Today at work</p>
              <span className="tag pink">{left} task{left === 1 ? '' : 's'} left this year</span>
            </div>

            {scenario ? (
              <div className="card task-card">
                <p className="task-text">{scenario.text}</p>
                <div className="choices" style={{ display: 'grid', gap: 10 }}>
                  {scenario.choices.map((c, i) => {
                    const pct = Math.round(successChance(game, c) * 100);
                    return (
                       <button key={i} className={`btn office-choice ${c.legend ? 'legend' : ''}`} onClick={() => { act((g) => doOfficeTask(g, draw, i)); setDraw(null); }}>
                        <span>{c.label}</span>
                        <small>
                          <span className={`tag ${c.legend ? 'gold' : c.bold ? 'pink' : ''}`}>{c.legend ? '🌟 Legendary' : c.bold ? '🔥 Bold' : '🛡️ Safe'}</span>
                          {' '}uses {c.stat} · {pct}% chance · {c.legend ? 'huge raise or a painful cut' : c.bold ? 'big raise or big cut' : 'small raise or small cut'}{c.risky ? ' · 🚨 risky' : ''}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : left > 0 ? (
              <div className="work-choices">
                <button className="btn primary block work-play" onClick={() => (minigamesOff(game) ? act(quickWork) : setPlaying(withVoice(workGameFor(job.careerId), game.gender)))}>
                  <span className="big-emoji">🎮</span>
                  <span><b>Do your job</b><small>A random task from {workGamesFor(job.careerId).length} kinds of {job.title.toLowerCase()} work</small></span>
                </button>
                <button className="btn block" onClick={() => setDraw(drawScenario(job.careerId))}>🗂️ Handle a situation</button>
              </div>
            ) : (
              <button className="btn block" disabled>🌙 You’re done for this year — age up for more</button>
            )}
          </>
        )}
        {playing && job && (
          <WorkGamePlayer def={playing} look={game.look} onClose={() => setPlaying(null)}
            onFinish={(score, max) => { const title = playing.title; setPlaying(null); act((g) => finishWorkGame(g, score, max, title)); }} />
        )}
      </Sheet>
    );
  }

  if (tab === 'jobs') {
    const cats = [
      { id: 'parttime', name: 'Part-time', list: CAREERS.filter((c) => c.partTime) },
      { id: 'fulltime', name: 'Full-time', list: CAREERS.filter((c) => !c.partTime && !c.special && !c.field) },
      { id: 'music', name: '🎵 Music', list: CAREERS.filter((c) => c.field === 'music') },
      { id: 'sports', name: '🏅 Sports', list: CAREERS.filter((c) => c.field === 'sports') },
      { id: 'extra', name: '✨ Extra', list: CAREERS.filter((c) => c.special && !c.hidden) },
    ] as const;
    const current = cats.find((c) => c.id === jobCat)!;
    const shown = current.list.filter((c) => !onlyEligible || !careerBlock(game, c) || careerBlock(game, c) === 'Current job');
    return (
      <Sheet title="Career" onClose={onClose}>
        {tabs}
        {!royalFree(game) && (
          <div className="card royal-card">
            <h4>👑 Born to the crown</h4>
            <p className="sub">
              As {game.gender === 'male' ? 'a prince' : 'a princess'} of {game.country} your place is already decided: royal duties from your 18th birthday,
              and one day the throne. Every other job is closed to you — unless the King and Queen say otherwise.
            </p>
            <button className="btn small block" style={{ marginTop: 10 }} disabled={!!royalAskBlock(game)}
              onClick={() => act(askRoyalFreedom)}>
              {royalAskBlock(game) ?? '🗝️ Ask my parents if I can do other jobs'}
            </button>
          </div>
        )}
        {game.age < 13 ? (
          <p className="note">You can start working part-time at 13. 🍼</p>
        ) : game.prison > 0 ? (
          <div className="card"><h4>⛓️ In prison</h4><p className="sub">No job hunting from a cell.</p></div>
        ) : (
          <>
            <div className="chips cat-chips">
              {cats.map((c) => <button key={c.id} type="button" className={`chip ${jobCat === c.id ? 'on' : ''}`} onClick={() => setJobCat(c.id)}>{c.name}</button>)}
            </div>
            <label className="toggle-row">
              <input type="checkbox" checked={onlyEligible} onChange={(ev) => setOnlyEligible(ev.target.checked)} />
              <span>Only show jobs I can apply for</span>
            </label>
            {jobCat === 'music' && <p className="note" style={{ marginBottom: 10 }}>Train an instrument in Activities → 🎹 Music Lessons to unlock these.</p>}
            {jobCat === 'sports' && <p className="note" style={{ marginBottom: 10 }}>Train a sport in Activities → ⚽ Sports Practice to unlock these.</p>}
            {shown.length === 0 && <p className="note">Nothing you qualify for here yet.</p>}
            {shown.map(careerRow)}
          </>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Career" onClose={onClose}>
      {tabs}
      {game.age < 5 && <p className="note">You’re a little too young for school. Enjoy being tiny! 🍼</p>}

      {game.age >= 5 && (
        <>
          <p className="section-title">Education</p>
          {e.stage !== 'none' ? (
            <div className={`card ${e.stage === 'royal' ? 'royal-card' : ''}`}>
              <h4>{e.stage === 'royal' ? '👑' : '🎒'} {schoolName(game)}</h4>
              <p className="sub">
                {finalYear(game) ? '🎓 Final year' : `${e.yearsLeft} year${e.yearsLeft === 1 ? '' : 's'} left`}
                {e.stage === 'royal' ? ' · etiquette, languages, protocol and how to wave' : ''}
              </p>
              <div className="stat" style={{ marginTop: 10 }}>
                <span className="lbl">{e.stage === 'royal' ? 'Poise' : 'Grades'}</span><Bar value={e.grades} kind="smarts" /><span className="num">{e.grades}%</span>
              </div>
              <div className="actions">
                <button className="btn small" onClick={() => act(study)} disabled={used(game, 'school:study')}>📖 Study harder</button>
                <button className={`btn small ${graduateBlock(game) ? '' : 'primary'}`} disabled={!!graduateBlock(game)} onClick={() => act(graduate)}>
                  {graduateBlock(game) ?? '🎓 Graduate'}
                </button>
                {(e.stage === 'university' || e.stage === 'graduate') && (
                  <button className="btn small danger" onClick={() => act(dropOut)}>Drop out</button>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <h4>🎓 {e.degrees.length ? degreeName(e.degrees[e.degrees.length - 1]) : 'No diploma'}</h4>
              {e.degrees.length > 1 && <p className="sub">Also: {e.degrees.slice(0, -1).map(degreeName).join(', ')}</p>}
              {e.studentLoans > 0 && <p className="sub">Student loans: {money(e.studentLoans)}</p>}
              {game.age >= 18 && !hasEdu(game, 'hs') && (
                <div className="actions">
                  <button className="btn small" onClick={() => act(takeGed)} disabled={used(game, 'school:ged') || game.money < 200}>📜 Take the GED ($200)</button>
                </div>
              )}
            </div>
          )}

          {e.stage !== 'none' && (
            <div className="card exam-card">
              <div className="section-row" style={{ marginTop: 0 }}>
                <h4 style={{ margin: 0 }}>📝 Exams</h4>
                <button className="btn tiny" onClick={() => act(toggleExams)}>{e.examsOff ? '🔇 Exams off' : '🔔 Exams on'}</button>
              </div>
              {e.examsOff ? (
                <p className="sub">You’re skipping exams. Report cards will be estimates, grades slide every year, and you can’t be valedictorian.</p>
              ) : (
                <>
                  <p className="sub">
                    One paper a year, and you can’t walk out of it once it starts. Fetch the review sheet first —
                    it’s this year’s questions with the answers on them. You can’t graduate without sitting the final one.
                    {(e.missedExams ?? 0) > 0 && ` You’ve missed ${e.missedExams} year${e.missedExams === 1 ? '' : 's'}, so valedictorian is out.`}
                  </p>
                  <p className="sub">This year’s paper: {examSubjects(game).map((x) => x.name).join(' · ')}.</p>
                  <div className="actions">
                    {sheet ? (
                      <button className="btn small" onClick={() => setStudying(true)}>📖 Study the review sheet</button>
                    ) : (
                      <button className="btn small" disabled={!!sheetBlock(game)}
                        onClick={() => { act(takeReviewSheet); setStudying(true); }}>
                        {sheetBlock(game) ?? '📄 Get the review sheet'}
                      </button>
                    )}
                    <button className="btn small primary" disabled={!!examBlock(game)} onClick={() => (minigamesOff(game) ? act(quickExam) : setExam(examPaperFor(game)))}>
                      {examBlock(game) ?? (finalYear(game) ? `📝 Take the final ${stageLabel(e.stage) === 'the Royal Academy' ? 'academy' : stageLabel(e.stage)} exam` : '📝 Take the exam')}
                    </button>
                  </div>
                </>
              )}
              {lastReport(game) && (
                <button type="button" className="report-mini" onClick={() => setReports(true)}>
                  <span className={`report-grade ${lastReport(game)!.skipped ? 'skip' : ''}`}>{lastReport(game)!.grade}</span>
                  <span className="report-mini-main">
                    <b>Latest report card · age {lastReport(game)!.age}</b>
                    <small>{lastReport(game)!.subjects.map((x) => `${x.name} ${x.mark}%`).join(' · ')}</small>
                  </span>
                  <span className="tag pink">All {reportCards(game).length}</span>
                </button>
              )}
            </div>
          )}

          {e.stage !== 'none' && game.age >= 8 && (
            <>
              <div className="section-row">
                <p className="section-title">Clubs</p>
                <span className="tag">{game.clubs.length}/{MAX_CLUBS}</span>
              </div>
              {game.clubs.map((m) => {
                const c = clubOf(m.id)!;
                return (
                  <div className="row" key={m.id}>
                    <span className="emoji">{c.emoji}</span>
                    <span className="main"><b>{c.name}{m.president ? ' · 🏅 President' : ''}</b><small>{m.years} year{m.years === 1 ? '' : 's'} as a member</small></span>
                    <button className="btn small danger" onClick={() => act((g) => leaveClub(g, m.id))}>Leave</button>
                  </div>
                );
              })}
              {game.clubs.length < MAX_CLUBS && <button className="btn block" style={{ marginTop: 8 }} onClick={() => setClubsOpen(true)}>➕ Join a club</button>}
            </>
          )}

          {programs.length > 0 && (
            <>
              <p className="section-title">Enroll</p>
              {grad.map(programRow)}
              {hasMajors && (
                <Row emoji="🎓" title="Go to university" sub={enrollBlock ?? `Choose from ${programs.length - grad.length} majors`}
                  side={money(UNIVERSITY.tuition)} sideSub="/ year" onClick={() => setMajors(true)} disabled={!!enrollBlock} />
              )}
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

/* ───────── Assets ───────── */

export function AssetsSheet({ game, act, onClose }: Props) {
  const [pay, setPay] = useState<PayAsk | null>(null);
  const [buying, setBuying] = useState<ShopItem | null>(null);
  const [decorating, setDecorating] = useState<string | null>(null);
  const charge = (amount: number, label: string, run: (payer: Payer) => void) => {
    if (amount <= 0 || !canAskParents(game)) { run('self'); return; }
    setPay({ amount, label, run });
  };

  // Houses are bought on the map, so you choose the neighbourhood first.
  if (buying) {
    return (
      <>
        <LocationPicker item={buying} game={game} onClose={onClose} onBack={() => setBuying(null)}
          onBuy={(districtId, price) => {
            const item = buying;
            setBuying(null);
            charge(price, `a ${item.name.toLowerCase()} in ${districtOf(districtId)?.name}`,
              (payer) => act((g) => buyProperty(g, item.id, districtId, payer)));
          }} />
        {pay && <PayModal game={game} act={act} ask={pay} onClose={() => setPay(null)} />}
      </>
    );
  }

  const house = game.assets.find((a) => a.id === decorating);
  if (house) {
    return (
      <>
        <HouseEditor game={game} asset={house} onClose={onClose} onBack={() => setDecorating(null)}
          onApply={(picks, cost) => {
            setDecorating(null);
            charge(cost, 'the redecorating', (payer) => act((g) => redecorate(g, house.id, picks, payer)));
          }} />
        {pay && <PayModal game={game} act={act} ask={pay} onClose={() => setPay(null)} />}
      </>
    );
  }

  return (
    <Sheet title="Wealth" onClose={onClose}>
      <div className="card">
        <h4>💳 Bank balance</h4>
        <p className="sub">{money(game.money)}{game.education.studentLoans > 0 ? ` · Student loans ${money(game.education.studentLoans)}` : ''}</p>
      </div>

      <p className="section-title">Owned</p>
      {game.assets.length === 0 && <p className="note">You don’t own anything yet.</p>}
      {game.assets.map((a) => {
        const diff = a.value - a.purchasePrice;
        return (
          <div className="row" key={a.id}>
            <span className="emoji">{a.emoji}</span>
            <span className="main">
              <b>{a.name}</b>
              <small>
                {a.kind === 'house' && districtOf(a.location) ? `${districtOf(a.location)!.emoji} ${districtOf(a.location)!.name} · ` : ''}
                Worth {money(a.value)} · {diff >= 0 ? '▲' : '▼'} {money(Math.abs(diff))}
              </small>
            </span>
            {a.kind === 'house' && <button className="btn small" onClick={() => setDecorating(a.id)}>🛋️ Decorate</button>}
            <button className="btn small" onClick={() => act((g) => sell(g, a.id))} disabled={game.prison > 0}>Sell</button>
          </div>
        );
      })}

      {pay && <PayModal game={game} act={act} ask={pay} onClose={() => setPay(null)} />}
      {(['house', 'car'] as const).map((kind) => (
        <div key={kind}>
          <p className="section-title">{kind === 'house' ? 'Real estate' : 'Cars'}</p>
          {SHOP.filter((s) => s.kind === kind).map((s) => {
            const block = buyBlock(game, s.price);
            return (
              <Row key={s.id} emoji={s.emoji} title={s.name} sub={block ?? (s.kind === 'house' ? 'Pick a neighbourhood on the map' : `+${s.happiness} joy`)}
                side={money(s.price)} sideSub={s.kind === 'house' ? 'from' : undefined} disabled={!!block}
                onClick={() => (s.kind === 'house'
                  ? setBuying(s)
                  : charge(s.price, `a ${s.name.toLowerCase()}`, (payer) => act((g) => buy(g, s.id, payer))))} />
            );
          })}
        </div>
      ))}
    </Sheet>
  );
}

/* ───────── Relationships ───────── */

const ORDER = ['spouse', 'partner', 'mother', 'father', 'sibling', 'child', 'friend', 'coworker'];

export function RelationshipsSheet({ game, act, onClose, onLiveAs }: Props & { onLiveAs?: (childId: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmLiveAs, setConfirmLiveAs] = useState(false);
  const [tab, setTab] = useState<RelTab>(() => REL_TABS.find((t) => game.relationships.some((p) => TAB_OF[p.relation] === t.id && p.alive))?.id ?? 'parents');
  const person = game.relationships.find((p) => p.id === selected);

  if (person) {
    const options = INTERACTIONS.filter((i) => person.alive && i.show(game, person));
    return (
      <Sheet title={person.firstName} onClose={onClose} onBack={() => { setSelected(null); setConfirmLiveAs(false); }}>
        <div className="card">
          <div className="person-head">
            <span className="avatar sm"><Avatar look={person.look} age={person.age} alive={person.alive} fallback={avatar(person.gender, person.age)} /></span>
            <h4>{fullName(person)}</h4>
          </div>
          <p className="sub">{relationLabel(person)}{person.adopted ? ' · adopted' : ''} · {person.alive ? `Age ${person.age}` : `Died at ${person.age}`}{person.vip ? ' · 👑 VIP' : ''}</p>
          {(person.job || person.bio) && (
            <div className="facts-mini" style={{ marginTop: 8 }}>
              {person.job && <span>💼 {person.job}</span>}
              {person.salary ? <span>💰 {money(person.salary)}/yr</span> : null}
              {person.education && <span>🎓 {person.education}</span>}
            </div>
          )}
          {person.bio && <p className="sub" style={{ marginTop: 6 }}>“{person.bio}”</p>}
          {person.alive && (
            <div className="stat" style={{ marginTop: 10 }}>
              <span className="lbl">Relationship</span><Bar value={person.closeness} kind="closeness" /><span className="num">{person.closeness}%</span>
            </div>
          )}
        </div>
        {person.alive && <p className="section-title">Interact</p>}
        {options.map((i) => {
          const block = interactionBlock(game, person, i);
          return (
            <Row key={i.id} emoji={i.emoji} title={i.label} sub={block ?? undefined} disabled={!!block}
              onClick={() => act((g) => interact(g, person.id, i.id))} />
          );
        })}
        {!person.alive && <p className="note">Gone, but never forgotten. 🕯️</p>}
        {onLiveAs && playableChildren(game).some((p) => p.id === person.id) && (
          <>
            <p className="section-title">🌙 Their life</p>
            {!confirmLiveAs ? (
              <button className="btn block" onClick={() => setConfirmLiveAs(true)}>🌙 Live as {person.firstName}</button>
            ) : (
              <div className="card">
                <p className="sub" style={{ marginBottom: 10 }}>
                  Start a new life as {person.firstName} ({person.age}). {game.firstName} stays alive and saved in Lives &amp; Graveyard, so you can switch back any time.
                </p>
                <div className="actions">
                  <button className="btn small primary" onClick={() => { setConfirmLiveAs(false); onLiveAs(person.id); }}>Live as {person.firstName}</button>
                  <button className="btn small" onClick={() => setConfirmLiveAs(false)}>Never mind</button>
                </div>
              </div>
            )}
          </>
        )}
      </Sheet>
    );
  }

  const inTab = game.relationships.filter((p) => TAB_OF[p.relation] === tab);
  // Your own people first, then step-family and in-laws, then exes, then those who have passed.
  const rank = (p: Person) => (!p.alive ? 3 : p.ex ? 2 : p.kin ? 1 : 0);
  const people = [...inTab].sort((a, b) => rank(a) - rank(b) || ORDER.indexOf(a.relation) - ORDER.indexOf(b.relation) || b.closeness - a.closeness);
  const heading = ['', 'Step-family & in-laws', 'Exes', 'Remembered'];

  return (
    <Sheet title="Relationships" onClose={onClose}>
      <div className="seg" role="tablist" style={{ marginBottom: 12, gridAutoFlow: 'row', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))' }}>
        {REL_TABS.map((t) => {
          const n = game.relationships.filter((p) => TAB_OF[p.relation] === t.id && p.alive).length;
          return (
            <button key={t.id} type="button" className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              {t.emoji} {t.name}{n ? ` · ${n}` : ''}
            </button>
          );
        })}
      </div>
      {people.length === 0 && <p className="note">{REL_TABS.find((t) => t.id === tab)!.empty}</p>}
      {people.map((p, i) => {
        const r = rank(p);
        const newGroup = r > 0 && (i === 0 || rank(people[i - 1]) !== r);
        return (
          <Fragment key={p.id}>
            {newGroup && <p className="section-title">{heading[r]}</p>}
            <button className={`row ${p.alive ? '' : 'dead'}`} onClick={() => setSelected(p.id)}>
              <span className="emoji face"><Avatar look={p.look} age={p.age} alive={p.alive} fallback={avatar(p.gender, p.age)} /></span>
              <span className="main">
                <b>{fullName(p)}</b>
                <small>{relationLabel(p)}{linkName(game, p)} · {p.alive ? `Age ${p.age}` : 'Deceased'}</small>
                {p.alive && <span style={{ display: 'block', marginTop: 6 }}><Bar value={p.closeness} kind="closeness" /></span>}
              </span>
              <span className="side muted">›</span>
            </button>
          </Fragment>
        );
      })}
    </Sheet>
  );
}

type RelTab = 'children' | 'parents' | 'siblings' | 'friends' | 'coworkers' | 'lovers';
const TAB_OF: Record<Person['relation'], RelTab> = {
  child: 'children', mother: 'parents', father: 'parents', sibling: 'siblings', friend: 'friends', partner: 'lovers', spouse: 'lovers', coworker: 'coworkers',
};
const REL_TABS: { id: RelTab; emoji: string; name: string; empty: string }[] = [
  { id: 'children', emoji: '🧒', name: 'Children', empty: 'No children yet.' },
  { id: 'parents', emoji: '👪', name: 'Parents', empty: 'No parents around.' },
  { id: 'siblings', emoji: '🧑‍🤝‍🧑', name: 'Siblings', empty: 'No brothers or sisters.' },
  { id: 'friends', emoji: '🤝', name: 'Friends', empty: 'No friends yet. Try making one in Activities.' },
  { id: 'coworkers', emoji: '💼', name: 'Co-workers', empty: 'No co-workers — get a job to meet some.' },
  { id: 'lovers', emoji: '💞', name: 'Lovers', empty: 'Nobody special yet. Try the dating app in Activities.' },
];

/** "(Mateo’s wife)" — who links an in-law or step relative to you. */
function linkName(g: Game, p: Person) {
  if (!p.via || p.relation === 'spouse' || p.relation === 'partner') return '';
  const link = g.relationships.find((x) => x.id === p.via);
  return link ? ` · via ${link.firstName}` : '';
}

/* ───────── Activities ───────── */

export interface PayAsk { amount: number; label: string; run: (payer: Payer) => void }

function PayModal({ game, act, ask, onClose }: { game: Game; act: Act; ask: PayAsk; onClose: () => void }) {
  const chance = Math.round(parentsPayChance(game, ask.amount) * 100);
  // The parents answer first, so you never play a whole activity only to hear "no".
  const [answer, setAnswer] = useState<{ yes: boolean; text: string } | null>(null);
  const askThem = () => {
    let reply: { yes: boolean; text: string } | null = null;
    act((g) => { reply = askParents(g, ask.amount, ask.label); });
    setAnswer(reply);
  };
  return (
    <div className="overlay center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="big">{answer ? (answer.yes ? '💜' : '🙅') : '💳'}</div>
        <h2>{money(ask.amount)} for {ask.label}</h2>
        <p>{answer ? answer.text : 'Who’s paying?'}</p>
        <div className="choices">
          {answer?.yes ? (
            <button className="btn primary" onClick={() => { ask.run('parents'); onClose(); }}>✨ Let’s go</button>
          ) : (
            <>
              <button className="btn primary" disabled={game.money < ask.amount} onClick={() => { ask.run('self'); onClose(); }}>
                💵 Pay myself · {money(game.money)} in the bank
              </button>
              {!answer && (
                <button className="btn" onClick={askThem}>
                  👪 Ask my parents · {chance}% chance
                </button>
              )}
            </>
          )}
          <button className="btn" onClick={onClose}>Never mind</button>
        </div>
      </div>
    </div>
  );
}

interface ActivityPlay { id: string; payer: Payer; def: WorkGame; lesson?: LessonKind }

/** Everyone you came from, and everyone who comes after you. */
function FamilyTree({ game, onClose, onBack }: { game: Game; onClose: () => void; onBack: () => void }) {
  const core = game.relationships.filter(isCore);
  const parents = core.filter((p) => p.relation === 'mother' || p.relation === 'father');
  const siblings = core.filter((p) => p.relation === 'sibling');
  const partners = core.filter((p) => p.relation === 'spouse' || p.relation === 'partner');
  const kids = core.filter((p) => p.relation === 'child');
  const node = (p: { id: string; firstName: string; lastName: string; age: number; alive: boolean; look?: Look; relation?: string }, label?: string) => (
    <div className={`tree-node ${p.alive ? '' : 'gone'}`} key={p.id}>
      <span className="tree-face"><Avatar look={p.look} age={p.age} alive={p.alive} fallback="🙂" /></span>
      <b>{p.firstName}</b>
      <small>{label ?? relationLabel(p as never)} · {p.alive ? p.age : '🕯️'}</small>
    </div>
  );

  return (
    <Sheet title="👪 Family Tree" onClose={onClose} onBack={onBack}>
      <p className="note" style={{ marginBottom: 12 }}>
        Generation {game.generation} of the {game.lastName} family.
        {game.ancestors.length > 0 ? ` ${game.ancestors.length} generation${game.ancestors.length === 1 ? '' : 's'} came before you.` : ''}
      </p>

      {game.ancestors.length > 0 && (
        <>
          <p className="section-title">Ancestors</p>
          <div className="tree-row">
            {game.ancestors.map((a) => (
              <div className="tree-node gone" key={`${a.generation}${a.name}`}>
                <span className="tree-face"><Avatar look={a.look} age={a.age} /></span>
                <b>{a.name.split(' ')[0]}</b>
                <small>Gen {a.generation} · {a.career}</small>
                <small className="tree-note">Died at {a.age}{a.cause ? ` · ${a.cause}` : ''}</small>
              </div>
            ))}
          </div>
        </>
      )}

      {parents.length > 0 && (
        <>
          <p className="section-title">Parents</p>
          <div className="tree-row">{parents.map((p) => node(p))}</div>
        </>
      )}

      <p className="section-title">You</p>
      <div className="tree-row">
        <div className="tree-node me">
          <span className="tree-face"><Avatar look={game.look} age={game.age} alive={game.alive} mood={game.stats.happiness} /></span>
          <b>{game.firstName}</b>
          <small>Gen {game.generation} · {game.age}</small>
        </div>
        {partners.map((p) => node(p))}
      </div>

      {siblings.length > 0 && (
        <>
          <p className="section-title">Siblings</p>
          <div className="tree-row">{siblings.map((p) => node(p))}</div>
        </>
      )}

      {kids.length > 0 ? (
        <>
          <p className="section-title">Children</p>
          <div className="tree-row">{kids.map((p) => node(p))}</div>
          <p className="note">When you die you can carry on as one of your children — the family line keeps going.</p>
        </>
      ) : (
        <p className="note" style={{ marginTop: 12 }}>No children yet. Have one and your family line can continue after you're gone.</p>
      )}
    </Sheet>
  );
}

/** Click sounds on or off — lives here so the header stays uncluttered. */
function SoundTile() {
  const [off, setOff] = useState(isMuted());
  return (
    <button className="tile" onClick={() => { setMuted(!off); setOff(!off); }}>
      <span className="e">{off ? '🔇' : '🔊'}</span>
      <b>Sound</b>
      <small>Little clicks, chimes and fanfares</small>
      <span className={`tag ${off ? '' : 'pink'}`}>{off ? 'Off' : 'On'}</span>
    </button>
  );
}

export function ActivitiesSheet({ game, act, onClose, onOpenLives, lifeMeta, onLeaveLife, overview = null, onLogout }: Props & { onOpenLives: () => void; lifeMeta: LifeMeta | null; onLeaveLife: () => void; overview?: Overview | null; onLogout?: () => void }) {
  const [view, setView] = useState<'list' | 'salon' | 'dream' | 'pickDream' | 'bars' | 'mall' | 'music' | 'sports' | 'users' | 'quests' | 'social' | 'family' | 'status' | 'pray' | 'settings' | 'account' | 'will' | 'adopt' | MiniGame>('list');
  const [pay, setPay] = useState<PayAsk | null>(null);
  const [look, setLook] = useState<Look>(game.look);
  const [play, setPlay] = useState<ActivityPlay | null>(null);
  const [willPicks, setWillPicks] = useState<string[]>(game.will ?? []);
  const [confirmSurrender, setConfirmSurrender] = useState(false);
  const [kids, setKids] = useState(() => adoptionCandidates());
  // Screens opened from Settings go back to Settings; everything else goes back to the list.
  const back = () => setView(view === 'bars' || view === 'status' || view === 'users' || view === 'account' ? 'settings' : 'list');

  /** Play the activity's mini-game, then apply it with how well it went. */
  const finishPlay = (score: number, max: number) => {
    const p = play;
    setPlay(null);
    if (!p) return;
    const perf = max > 0 ? score / max : 1;
    act((g) => (p.lesson ? takeLesson(g, p.lesson, p.id, p.payer, perf) : doActivity(g, p.id, p.payer, perf)));
  };

  /** Charge straight away, or offer "ask my parents" when that's possible. */
  const charge = (amount: number, label: string, run: (payer: Payer) => void) => {
    if (amount <= 0 || !canAskParents(game)) { run('self'); return; }
    setPay({ amount, label, run });
  };

  /** Every view needs this — a "who's paying?" ask can come from the mall, the salon or a lesson. */
  const payModal = pay ? <PayModal game={game} act={act} ask={pay} onClose={() => setPay(null)} /> : null;

  if (play) return <WorkGamePlayer def={play.def} look={game.look} onClose={() => setPlay(null)} onFinish={finishPlay} />;
  if (view === 'family') return <FamilyTree game={game} onClose={onClose} onBack={back} />;
  if (view === 'social') return <SocialPhone game={game} act={act} onClose={back} />;
  if (view === 'quests') {
    const active = activeQuests(game);
    const offers = availableQuests(game).slice(0, 6);
    return (
      <Sheet title="🎯 Quests" onClose={onClose} onBack={back}>
        <p className="note" style={{ marginBottom: 12 }}>Little goals for this life. Finish one and claim your reward!</p>
        <p className="section-title">In progress</p>
        {active.length === 0 && <p className="note">No quests yet — pick one below.</p>}
        {active.map((st) => {
          const q = questOf(st.id)!;
          const { have, need } = q.progress(game);
          const ready = have >= need;
          const pct = Math.round((have / need) * 100);
          return (
            <div className={`card quest-card ${ready ? 'ready' : ''}`} key={st.id}>
              <h4>{q.emoji} {q.title}</h4>
              <p className="sub">{q.desc}</p>
              <div className="quest-progress">
                <span className="lbl">{have.toLocaleString()} / {need.toLocaleString()}</span>
                <span className="num">{pct}%</span>
                <Bar value={pct} kind="skill" />
              </div>
              <div className="actions">
                {ready
                  ? <button className="btn small primary" onClick={() => act((g) => claimQuest(g, st.id))}>🏆 Claim reward</button>
                  : <button className="btn small danger" onClick={() => act((g) => abandonQuest(g, st.id))}>Give up</button>}
                <span className="tag gold">{[q.reward.money && money(q.reward.money), q.reward.fame && `+${q.reward.fame} fame`].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
          );
        })}
        <p className="section-title">Available</p>
        {offers.length === 0 && <p className="note">Nothing new right now. Come back as you grow up!</p>}
        {offers.map((q) => (
          <Row key={q.id} emoji={q.emoji} title={q.title} sub={q.desc}
            side={q.reward.money ? money(q.reward.money) : '⭐'} onClick={() => act((g) => acceptQuest(g, q.id))} />
        ))}
        <p className="section-title">Finished</p>
        {game.quests.filter((s) => s.claimed).length === 0 && <p className="note">None yet.</p>}
        {game.quests.filter((s) => s.claimed).map((s) => {
          const q = questOf(s.id);
          return q ? <Row key={s.id} emoji="✅" title={q.title} sub={`Completed at age ${s.startedAge}+`} /> : null;
        })}
      </Sheet>
    );
  }
  if (view === 'account') {
    return (
      <Sheet title="👤 Account" onClose={onClose} onBack={back}>
        <AccountInfo game={game} lifeMeta={lifeMeta} overview={overview} onLogout={() => { onClose(); onLogout?.(); }} />
      </Sheet>
    );
  }
  if (view === 'settings') {
    const off = minigamesOff(game);
    return (
      <Sheet title="⚙️ Settings" onClose={onClose} onBack={back}>
        <div className="grid">
          <button className="tile" onClick={() => setView('account')}>
            <span className="e">👤</span>
            <b>Account</b>
            <small>Username, email, your lives</small>
            <span className="tag pink">View</span>
          </button>
        <button className="tile" onClick={() => setView('bars')}>
          <span className="e">🎨</span>
          <b>Stat Bars</b>
          <small>Colors & style</small>
          <span className="tag pink">Customize</span>
        </button>
        <button className="tile" onClick={() => setView('status')}>
          <span className="e">🪪</span>
          <b>Status</b>
          <small>Your gender & who you like</small>
          <span className="tag pink">{game.gender === 'male' ? 'Male' : 'Female'} · likes {game.preference}</span>
        </button>
        <button className="tile" onClick={() => setView('users')}>
          <span className="e">👥</span>
          <b>{lifeMeta?.role === 'guest' ? 'Shared Life' : 'Manage Users'}</b>
          <small>{lifeMeta?.role === 'guest' ? `@${lifeMeta.owner}’s life` : 'Life code & who can play'}</small>
          <span className="tag pink">{lifeMeta?.role === 'guest' ? 'Guest' : 'Owner'}</span>
        </button>
          <SoundTile />
          <button className="tile" onClick={() => act(toggleMinigames)}>
            <span className="e">{off ? '⚡' : '🎮'}</span>
            <b>Remove mini-games</b>
            <small>{off ? 'Off — everything happens instantly. Tap to bring them back.' : 'Skip the games for activities, lessons, work, exams and more'}</small>
            <span className={`tag ${off ? 'pink' : ''}`}>{off ? 'Removed' : 'Playing'}</span>
          </button>
        </div>
      </Sheet>
    );
  }
  if (view === 'pray') {
    const price = prayerPrice(game);
    const prayed = game.counters.pray ?? 0;
    return (
      <Sheet title="🙏 Pray" onClose={onClose} onBack={back}>
        <p className="note" style={{ marginBottom: 12 }}>
          Ask for one blessing. This prayer costs <b>{money(price)}</b>, and every prayer after it costs double.
          {prayed > 0 && ` You’ve prayed ${prayed} time${prayed === 1 ? '' : 's'} this life.`}
          {' '}You have {money(game.money)}.
        </p>
        {BLESSINGS.map((b) => {
          const block = prayBlock(game, b.id);
          return (
            <Row key={b.id} emoji={b.emoji} title={b.name} sub={b.desc}
              side={block ?? money(price)} disabled={!!block}
              onClick={() => { act((g) => pray(g, b.id)); }} />
          );
        })}
      </Sheet>
    );
  }
  // Surrender lives in both Status and the Will screen.
  const surrenderSection = (
    <>
      <p className="section-title">🏳️ Surrender</p>
      {!confirmSurrender ? (
        <button className="btn danger block" onClick={() => setConfirmSurrender(true)}>🏳️ Surrender this life</button>
      ) : (
        <div className="card">
          <p className="sub" style={{ marginBottom: 10 }}>{game.firstName} will die right now. This can’t be undone.{living(game, 'child').length ? ' You can carry on as one of your children.' : ''}</p>
          <div className="actions">
            <button className="btn small danger" onClick={() => { setConfirmSurrender(false); act((g) => surrender(g)); }}>Yes, surrender</button>
            <button className="btn small" onClick={() => setConfirmSurrender(false)}>Never mind</button>
          </div>
        </div>
      )}
    </>
  );

  if (view === 'adopt') {
    const block = adoptBlock(game);
    return (
      <Sheet title="🧸 Adoption Center" onClose={onClose} onBack={back}>
        {payModal}
        <p className="note" style={{ marginBottom: 12 }}>
          These children are waiting for a family. Adopting costs a <b>{money(ADOPTION_FEE)}</b> agency fee. They join as your own child and take the family name.
        </p>
        {kids.map((k) => (
          <div className="card adopt-kid" key={k.id}>
            <div className="person-head">
              <span className="avatar sm"><Avatar look={k.look} age={k.age} fallback={avatar(k.gender, k.age)} /></span>
              <div>
                <h4>{k.firstName}</h4>
                <p className="sub">{k.gender === 'male' ? 'Boy' : 'Girl'} · {k.age === 0 ? 'newborn' : `age ${k.age}`}</p>
              </div>
            </div>
            <p className="sub" style={{ marginTop: 8 }}>✨ {k.trait}</p>
            <p className="sub">“{k.story}”</p>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="btn small primary" disabled={!!block} onClick={() => { act((g) => adoptChild(g, k)); setKids((ks) => ks.filter((x) => x.id !== k.id)); }}>
                {block ?? `🧸 Adopt ${k.firstName} · ${money(ADOPTION_FEE)}`}
              </button>
            </div>
          </div>
        ))}
        {kids.length === 0 && <p className="note">Everyone here has found a home for now.</p>}
        <button className="btn block" style={{ marginTop: 8 }} onClick={() => setKids(adoptionCandidates())}>🔄 Meet other children</button>
      </Sheet>
    );
  }
  if (view === 'will') {
    return (
      <Sheet title="📜 Will" onClose={onClose} onBack={back}>
        <p className="section-title">Who inherits</p>
        <p className="note" style={{ marginBottom: 8 }}>
          Tick everyone who should inherit. When I die, my money and houses are split equally between them.
          {' '}{game.will?.length ? `Changing it costs ${money(willPrice(game))}.` : `Writing it costs ${money(willPrice(game))}, and every change after that costs double.`}
          {' '}With no will, it’s split between my children.
        </p>
        {[...willCandidates(game).map((p) => ({ id: p.id, emoji: p.relation === 'child' ? '🧒' : p.relation === 'sibling' ? '🧑‍🤝‍🧑' : '💍', name: fullName(p), sub: relationLabel(p) })),
          { id: 'charity', emoji: '🎗️', name: 'Charity', sub: 'Give to a good cause' }].map((h) => {
          const on = willPicks.includes(h.id);
          return (
            <Row key={h.id} emoji={h.emoji} title={h.name}
              sub={`${h.sub}${game.will?.includes(h.id) ? ' · in my will now' : ''}`}
              side={on ? '☑️' : '⬜'}
              onClick={() => setWillPicks(on ? willPicks.filter((x) => x !== h.id) : [...willPicks, h.id])} />
          );
        })}
        {(() => {
          const same = willPicks.length === (game.will?.length ?? 0) && willPicks.every((id) => game.will?.includes(id));
          const wb = willBlock(game, willPicks);
          return (
            <button className="btn primary block" style={{ marginTop: 8 }} disabled={same || !!wb}
              onClick={() => act((g) => writeWill(g, willPicks))}>
              {same ? (game.will?.length ? '📜 This is my will' : '📜 Pick who inherits')
                : wb ?? `📜 Sign my will (${willPicks.length} ${willPicks.length === 1 ? 'person' : 'ways'}) · ${money(willPrice(game))}`}
            </button>
          );
        })()}

        {surrenderSection}
      </Sheet>
    );
  }
  if (view === 'status') {
    const block = statusBlock(game);
    const price = money(STATUS_PRICE);
    return (
      <Sheet title="🪪 Status" onClose={onClose} onBack={back}>
        {payModal}
        <p className="note" style={{ marginBottom: 12 }}>Changing your gender or who you like costs {price} each.{block ? ` (${block})` : ''}</p>
        <p className="section-title">My gender</p>
        {(['female', 'male'] as const).map((gd) => {
          const current = game.gender === gd;
          return (
            <Row key={gd} emoji={gd === 'male' ? '🙋‍♂️' : '🙋‍♀️'} title={gd === 'male' ? 'Male' : 'Female'}
              sub={current ? 'This is me now' : undefined} side={current ? '✓' : price}
              disabled={current || !!block}
              onClick={() => charge(STATUS_PRICE, 'a gender change', (payer) => act((g) => changeGender(g, gd, payer)))} />
          );
        })}
        <p className="section-title">Who I like</p>
        {PREFERENCES.map((pr) => {
          const current = game.preference === pr.id;
          return (
            <Row key={pr.id} emoji={pr.emoji} title={pr.name}
              sub={current ? 'Who I date now' : undefined} side={current ? '✓' : price}
              disabled={current || !!block}
              onClick={() => charge(STATUS_PRICE, 'changing who I like', (payer) => act((g) => changePreference(g, pr.id, payer)))} />
          );
        })}

        {surrenderSection}
      </Sheet>
    );
  }
  if (view === 'dating') return <DatingPhone game={game} act={act} onClose={back} />;
  if (view === 'users') {
    return (
      <Sheet title="👥 Manage Users" onClose={onClose} onBack={back}>
        <ManageUsers lifeMeta={lifeMeta} lifeName={game.firstName} onLeave={onLeaveLife} />
      </Sheet>
    );
  }
  if (view === 'music' || view === 'sports') {
    const kind = view;
    const list = kind === 'music' ? INSTRUMENTS : SPORTS;
    return (
      <Sheet title={kind === 'music' ? '🎹 Music Lessons' : '⚽ Sports Practice'} onClose={onClose} onBack={back}>
        <p className="note" style={{ marginBottom: 12 }}>
          {kind === 'music' ? 'Pick an instrument.' : 'Pick a sport.'} The first session each year is free — repeats cost more and more.
          {' '}Reach the skill level to unlock {kind === 'music' ? 'music' : 'sports'} jobs!
        </p>
        {payModal}
        <div className="skill-list">
          {list.map((d) => {
            const key = `${kind === 'music' ? 'music' : 'sport'}:${d.id}`;
            const lvl = skillOf(game, key);
            const block = lessonBlock(game, kind, d.id);
            const price = lessonTotal(game, kind, d.id);
            return (
              <button key={d.id} className="skill-row" disabled={!!block}
                onClick={() => charge(price, `a ${d.name.toLowerCase()} ${kind === 'music' ? 'lesson' : 'session'}`,
                  (payer) => (minigamesOff(game)
                    ? act((g) => takeLesson(g, kind, d.id, payer))
                    : setPlay({ id: d.id, payer, lesson: kind, def: withVoice(lessonGame(kind, d.id, d.name), game.gender) })))}>
                <span className="skill-emoji">{d.emoji}</span>
                <span className="skill-main">
                  <b>{d.name}</b>
                  <span className="skill-bar"><Bar value={lvl} kind="skill" /><small>{lvl}</small></span>
                </span>
                <span className={`tag ${block ? '' : price ? 'gold' : 'pink'}`}>{block ?? (price ? money(price) : kind === 'music' ? 'Lesson' : 'Train')}</span>
              </button>
            );
          })}
        </div>
      </Sheet>
    );
  }
  if (view === 'lottery') return <LotteryView game={game} act={act} onClose={back} />;
  if (view === 'casino') return <CasinoView game={game} act={act} onClose={back} />;
  if (view === 'shoplift') return <ShopliftGame act={act} onClose={back} quick={minigamesOff(game)} />;
  if (view === 'heist') return <HeistGame act={act} onClose={back} />;
  if (view === 'escape') return <EscapeGame act={act} onClose={back} />;

  if (view === 'mall') {
    const cost = lookCost(game, look);
    const block = mallBlock(game);
    const changed = JSON.stringify([look.top, look.topColor, look.acc]) !== JSON.stringify([game.look.top, game.look.topColor, game.look.acc]);
    return (
      <Sheet title="🛍️ Shopping Mall" onClose={onClose} onBack={back}>
        <p className="note" style={{ marginBottom: 12 }}>Tap anything to try it on. Colors are free! · Bank {money(game.money)}</p>
        {payModal}
        <LookEditor look={look} onChange={setLook} age={game.age} tabs={['outfit', 'acc']} wardrobe={game.wardrobe} shop />
        <div className="sticky-cta">
          <button className="btn primary block" disabled={!!block || !changed || (cost > game.money && !canAskParents(game))}
            onClick={() => charge(cost, 'these clothes', (payer) => { act((g) => buyLook(g, look, payer)); back(); })}>
            {block ?? (!changed ? 'Try something on ✨' : cost > game.money && !canAskParents(game) ? `Need ${money(cost)}` : cost ? `🛍️ Buy & wear · ${money(cost)}` : '👕 Wear this look')}
          </button>
        </div>
      </Sheet>
    );
  }

  if (view === 'salon') {
    const block = salonBlock(game);
    return (
      <Sheet title="Salon" onClose={onClose} onBack={back}>
        {payModal}
        <LookEditor look={look} onChange={setLook} age={game.age} tabs={['hair', 'face']} />
        <button className="btn primary block" style={{ marginTop: 18 }} disabled={!!block}
          onClick={() => charge(salonTotal(game), 'the salon', (payer) => { act((g) => salonVisit(g, look, payer)); back(); })}>
          {block ?? `💇 Book appointment · ${salonTotal(game) ? money(salonTotal(game)) : 'Free'}`}
        </button>
      </Sheet>
    );
  }
  if (view === 'dream') {
    return (
      <Sheet title="Dream career" onClose={onClose} onBack={back}>
        <DreamCard game={game} />
        <button className="btn block" style={{ marginTop: 14 }} onClick={() => setView('pickDream')}>
          {game.dream ? '🔁 Change my dream' : '🌠 Choose a dream'}
        </button>
      </Sheet>
    );
  }
  if (view === 'pickDream') {
    return (
      <Sheet title="Choose a dream" onClose={onClose} onBack={() => setView('dream')}>
        <DreamPicker current={game.dream?.careerId ?? null} game={game} onPick={(id) => {
          if (game.dream && id !== game.dream.careerId && !window.confirm('Changing your dream resets its progress. Continue?')) return;
          act((g) => { chooseDream(g, id); });
          setView('dream');
        }} />
      </Sheet>
    );
  }
  if (view === 'bars') {
    return (
      <Sheet title="Stat bar style" onClose={onClose} onBack={back}>
        <BarEditor prefs={game.bars} onChange={(bars) => act((g) => { g.bars = bars; })} />
      </Sheet>
    );
  }

  const dreamCareer = game.dream && CAREERS.find((c) => c.id === game.dream?.careerId);
  return (
    <Sheet title="Activities" onClose={onClose}>
      <div className="grid" style={{ marginBottom: 18 }}>
        <button className="tile" onClick={() => setView('dream')}>
          <span className="e">{dreamCareer?.emoji ?? '🌠'}</span>
          <b>Dream Career</b>
          <small>{dreamCareer ? dreamCareer.title : 'Not sure yet'}</small>
          <span className="tag pink">{game.dream?.complete ? 'Guaranteed' : game.dream?.failed ? 'Off track' : game.dream ? 'On track' : 'Choose'}</span>
        </button>
        <button className="tile" onClick={() => { setLook(game.look); setView('mall'); }} disabled={!!mallBlock(game)}>
          <span className="e">🛍️</span>
          <b>Shopping Mall</b>
          <small>Clothes & accessories</small>
          <span className={`tag ${mallBlock(game) ? '' : 'pink'}`}>{mallBlock(game) ?? 'Shop'}</span>
        </button>
        <button className="tile" onClick={() => setView('social')}>
          <span className="e">📱</span>
          <b>Social Apps</b>
          <small>Post & gain followers</small>
          <span className="tag pink">{formatFollowers(totalFollowers(game))} followers</span>
        </button>
        <button className="tile" onClick={() => setView('quests')}>
          <span className="e">🎯</span>
          <b>Quests</b>
          <small>Little goals & rewards</small>
          <span className="tag pink">{activeQuests(game).length} active</span>
        </button>
        <button className="tile" onClick={onOpenLives}>
          <span className="e">🪦</span>
          <b>Lives & Graveyard</b>
          <small>Switch lives, start a new one, visit past lives</small>
          <span className="tag pink">Open</span>
        </button>
        <button className="tile" onClick={() => setView('family')}>
          <span className="e">👪</span>
          <b>Family Tree</b>
          <small>Your parents, your children, your ancestors</small>
          <span className="tag pink">Gen {game.generation}</span>
        </button>
        <button className="tile" onClick={() => { setWillPicks(game.will ?? []); setView('will'); }}>
          <span className="e">📜</span>
          <b>Will</b>
          <small>Who gets your money and houses</small>
          <span className="tag pink">{game.will?.length ? `${game.will.length} ${game.will.length === 1 ? 'heir' : 'heirs'}` : 'Not written'}</span>
        </button>
        <button className="tile" onClick={() => setView('settings')}>
          <span className="e">⚙️</span>
          <b>Settings</b>
          <small>Stat bars, status, users, sound, mini-games</small>
          <span className="tag pink">Open</span>
        </button>
      </div>

      {payModal}
      {game.prison > 0 && <p className="note" style={{ marginBottom: 12 }}>⛓️ You’re in prison. Only a few activities are available.</p>}
      <div className="grid">
        {visibleActivities(game).map((a) => {
          const isSalon = a.id === 'salon';
          const block = isSalon ? salonBlock(game) : activityBlock(game, a);
          const cost = isSalon ? salonTotal(game) : activityPrice(game, a);
          return (
            <button key={a.id} className="tile" disabled={!!block}
              onClick={() => (isSalon ? (setLook(game.look), setView('salon'))
                : a.game && minigamesOff(game) && (a.game === 'heist' || a.game === 'escape') ? act(a.game === 'heist' ? quickHeist : quickEscape)
                : a.game ? setView(a.game)
                : a.picker ? setView(a.picker)
                : activityGame(a.id) && !minigamesOff(game) ? charge(cost, a.name.toLowerCase(), (payer) => setPlay({ id: a.id, payer, def: activityGame(a.id)! }))
                : charge(cost, a.name.toLowerCase(), (payer) => act((g) => doActivity(g, a.id, payer))))}>
              <span className="e">{a.emoji}</span>
              <b>{a.name}</b>
              <small>{a.desc}</small>
              <span className={`tag ${block ? '' : a.game || cost ? 'gold' : 'pink'}`}>
                {block ?? (a.game ? (a.id === 'date' ? '📱 Open' : minigamesOff(game) && a.id !== 'casino' && a.id !== 'lottery' ? '⚡ Go' : '🎮 Play') : a.id === 'pray' ? money(prayerPrice(game)) : a.picker ? 'Choose' : cost ? money(cost) : activityGame(a.id) && !minigamesOff(game) ? '🎮 Play' : 'Free')}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
