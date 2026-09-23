import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { makeQuestion, proofRound, type ProofLine, type QuizBank, type WorkGame } from '../game/workgames';
import { AimScene, BreathScene, ShelfScene, SneakScene, type SceneId } from './Scenes';
import { blip, judge, note } from '../sound';
import { Avatar } from './Avatar';
import { itemName } from '../game/look';
import type { Look } from '../game/types';
import type { Interview } from '../game/interview';

/* ───────── Shared bits ───────── */

/** Timers that are cleaned up automatically when the component unmounts. */
function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((id) => clearTimeout(id)), []);
  return (fn: () => void, ms: number) => { ids.current.push(window.setTimeout(fn, ms)); };
}

export function GameShell({ title, onClose, children }: { title: string; onClose?: () => void; children: ReactNode }) {
  return (
    <div className="overlay center game-overlay">
      <div className="game-panel" role="dialog" aria-label={title}>
        <div className="game-head">
          <h2>{title}</h2>
          {onClose && <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

function Dots({ total, results }: { total: number; results: (boolean | undefined)[] }) {
  return (
    <div className="dots">
      {Array.from({ length: total }, (_, i) => <span key={i} className={results[i] === undefined ? '' : results[i] ? 'hit' : 'miss'} />)}
    </div>
  );
}

/* ───────── Timing: stop the needle in the zone ───────── */

export function TimingGame({ steps, zone, speed, button, scene, onDone }: { steps: string[]; zone: number; speed: number; button: string; scene?: SceneId; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const center = useMemo(() => 0.18 + Math.random() * 0.64, [round]);
  const width = zone * Math.pow(0.9, round);

  useEffect(() => {
    if (feedback !== null) return;
    let raf = 0;
    const start = performance.now();
    const period = 1300 / (speed * (1 + round * 0.12));
    const tick = (t: number) => {
      const x = ((t - start) % (period * 2)) / period;
      posRef.current = x < 1 ? x : 2 - x;
      setPos(posRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [round, feedback, speed]);

  const stop = () => {
    if (feedback !== null) return;
    const hit = Math.abs(posRef.current - center) <= width / 2;
    judge(hit);
    const next = [...results, hit];
    setFeedback(hit);
    setResults(next);
    later(() => {
      if (next.length >= steps.length) onDone(next.filter(Boolean).length, steps.length);
      else { setRound((r) => r + 1); setFeedback(null); }
    }, 750);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); stop(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="game-body">
      <Dots total={steps.length} results={results} />
      <p className="game-step">{steps[round]}</p>
      {scene ? (
        <div className="scene-wrap" onClick={stop}>
          <AimScene scene={scene} pos={pos} zone={{ center, width }} state={feedback === null ? 'idle' : feedback ? 'hit' : 'miss'} />
        </div>
      ) : (
        <div className="track" onClick={stop}>
          <div className="zone" style={{ left: `${(center - width / 2) * 100}%`, width: `${width * 100}%` }} />
          <div className={`needle ${feedback === null ? '' : feedback ? 'good' : 'bad'}`} style={{ left: `${pos * 100}%` }} />
        </div>
      )}
      <p className="game-feedback">{feedback === null ? 'Tap when you line up with the green zone!' : feedback ? '✨ Perfect!' : '💥 Missed!'}</p>
      <button className="btn primary block big-btn" onClick={stop} disabled={feedback !== null}>{button}</button>
    </div>
  );
}

/* ───────── Simon: repeat the sequence ───────── */

const SIMON_LENGTHS = [3, 4, 5];
const randomSeq = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 4));

export function SimonGame({ pads, onDone }: { pads: string[]; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState(() => randomSeq(SIMON_LENGTHS[0]));
  const [phase, setPhase] = useState<'show' | 'input' | 'right' | 'wrong'>('show');
  const [lit, setLit] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (phase !== 'show') return;
    seq.forEach((p, i) => {
      later(() => setLit(p), 600 + i * 650);
      later(() => setLit(null), 600 + i * 650 + 420);
    });
    later(() => setPhase('input'), 600 + seq.length * 650);
  }, [phase, seq]);

  const press = (p: number) => {
    if (phase !== 'input') return;
    note(p);
    setLit(p);
    later(() => setLit(null), 180);
    if (p !== seq[idx]) {
      blip('bad');
      setPhase('wrong');
      later(() => onDone(round, SIMON_LENGTHS.length), 900);
      return;
    }
    if (idx + 1 < seq.length) { setIdx(idx + 1); return; }
    setPhase('right');
    later(() => {
      if (round + 1 >= SIMON_LENGTHS.length) onDone(SIMON_LENGTHS.length, SIMON_LENGTHS.length);
      else { setRound(round + 1); setSeq(randomSeq(SIMON_LENGTHS[round + 1])); setIdx(0); setPhase('show'); }
    }, 750);
  };

  const status = { show: '👀 Watch closely…', input: `Your turn! (${idx}/${seq.length})`, right: '✨ Nailed it!', wrong: '💥 Wrong one!' }[phase];
  return (
    <div className="game-body">
      <Dots total={SIMON_LENGTHS.length} results={Array.from({ length: SIMON_LENGTHS.length }, (_, i) => (i < round ? true : i === round && phase === 'wrong' ? false : undefined))} />
      <p className="game-feedback">{status}</p>
      <div className="simon">
        {pads.map((p, i) => (
          <button key={i} className={`pad ${lit === i ? 'lit' : ''}`} onClick={() => press(i)} disabled={phase !== 'input'}>{p}</button>
        ))}
      </div>
    </div>
  );
}

/* ───────── Quiz: pick the right answer ───────── */

const QUIZ_LEN = 3;
const QUIZ_TIME = 12;

export function QuizGame({ bank, onDone }: { bank: QuizBank; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const [questions] = useState(() => {
    const qs: ReturnType<typeof makeQuestion>[] = [];
    for (let tries = 0; qs.length < QUIZ_LEN && tries < 30; tries++) {
      const q = makeQuestion(bank);
      if (!qs.some((x) => x.q === q.q)) qs.push(q);
    }
    return qs;
  });
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [time, setTime] = useState(QUIZ_TIME);
  const q = questions[i];

  const choose = (o: string) => {
    if (picked !== null) return;
    const ok = o === q.a;
    judge(ok);
    const next = [...results, ok];
    setPicked(o);
    setResults(next);
    later(() => {
      if (i + 1 >= questions.length) onDone(next.filter(Boolean).length, questions.length);
      else { setI(i + 1); setPicked(null); setTime(QUIZ_TIME); }
    }, 1000);
  };

  useEffect(() => {
    if (picked !== null) return;
    if (time <= 0) { choose('__timeout__'); return; }
    const id = setTimeout(() => setTime((t) => +(t - 0.1).toFixed(1)), 100);
    return () => clearTimeout(id);
  }, [time, picked]);

  return (
    <div className="game-body">
      <Dots total={questions.length} results={results} />
      <div className="timer"><i style={{ width: `${(time / QUIZ_TIME) * 100}%` }} /></div>
      <p className="quiz-q">{q.q}</p>
      <div className="quiz-options">
        {q.options.map((o) => (
          <button key={o} className={`btn quiz-opt ${picked === null ? '' : o === q.a ? 'right' : o === picked ? 'wrong' : 'dim'}`} onClick={() => choose(o)}>{o}</button>
        ))}
      </div>
      {picked === '__timeout__' && <p className="game-feedback">⏰ Too slow!</p>}
    </div>
  );
}

/* ───────── Tap: hit the good ones, avoid the bad ones ───────── */

interface Target { id: number; cell: number; good: boolean }
const TAP_TIME = 12000;

export function TapGame({ good, bad, onDone }: { good: string; bad: string; onDone: (score: number, max: number) => void }) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [hits, setHits] = useState(0);
  const [oops, setOops] = useState(0);
  const [left, setLeft] = useState(TAP_TIME / 1000);
  const stats = useRef({ hits: 0, oops: 0, spawned: 0, id: 0 });
  const done = useRef(false);
  const live = useRef<Target[]>([]);
  const update = (ts: Target[]) => { live.current = ts; setTargets(ts); };

  useEffect(() => {
    const spawn = setInterval(() => {
      const ts = live.current;
      const free = Array.from({ length: 9 }, (_, i) => i).filter((c) => !ts.some((t) => t.cell === c));
      if (!free.length) return;
      const isGood = Math.random() < 0.72;
      if (isGood) stats.current.spawned++;
      const t = { id: ++stats.current.id, cell: free[Math.floor(Math.random() * free.length)], good: isGood };
      update([...ts, t]);
      setTimeout(() => update(live.current.filter((x) => x.id !== t.id)), 1150);
    }, 620);
    const clock = setInterval(() => setLeft((l) => Math.max(0, +(l - 0.1).toFixed(1))), 100);
    const end = setTimeout(() => {
      done.current = true;
      const s = stats.current;
      onDone(Math.max(0, s.hits - s.oops), Math.max(1, s.spawned));
    }, TAP_TIME);
    return () => { clearInterval(spawn); clearInterval(clock); clearTimeout(end); };
  }, []);

  const hit = (t: Target) => {
    if (done.current || !live.current.some((x) => x.id === t.id)) return;
    update(live.current.filter((x) => x.id !== t.id));
    judge(t.good);
    if (t.good) { stats.current.hits++; setHits((h) => h + 1); }
    else { stats.current.oops++; setOops((o) => o + 1); }
  };

  return (
    <div className="game-body">
      <div className="tap-stats"><span>✅ {hits}</span><span>⏱️ {left.toFixed(1)}s</span><span>❌ {oops}</span></div>
      <div className="tap-grid">
        {Array.from({ length: 9 }, (_, cell) => {
          const t = targets.find((x) => x.cell === cell);
          return (
            <button key={cell} className={`tap-cell ${t ? 'on' : ''}`} onClick={() => t && hit(t)}>
              {t && <span className="pop">{t.good ? good : bad}</span>}
            </button>
          );
        })}
      </div>
      <p className="game-feedback">Tap {good} · avoid {bad}</p>
    </div>
  );
}

/* ───────── Stealth: only move when they look away ───────── */

type Guard = 'away' | 'turning' | 'watching';

export function StealthGame({ moves, button, guard = '👮', hard = false, place = 'shop', onDone }: {
  moves: number; button: string; guard?: string; hard?: boolean; place?: 'shop' | 'bank' | 'prison'; onDone: (success: boolean) => void;
}) {
  const later = useTimers();
  const [state, setState] = useState<Guard>('watching');
  const [progress, setProgress] = useState(0);
  const [over, setOver] = useState<null | 'caught' | 'win' | 'slow'>(null);
  const [cool, setCool] = useState(false);
  const [left, setLeft] = useState(16);
  const overRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let id = 0;
    const cycle = (s: Guard) => {
      if (cancelled || overRef.current) return;
      setState(s);
      const ms = s === 'away' ? (hard ? 500 : 700) + Math.random() * (hard ? 600 : 900)
        : s === 'turning' ? 380 : 700 + Math.random() * 900;
      id = window.setTimeout(() => cycle(s === 'away' ? 'turning' : s === 'turning' ? 'watching' : 'away'), ms);
    };
    id = window.setTimeout(() => cycle('away'), 900);
    const clock = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => { cancelled = true; clearTimeout(id); clearInterval(clock); };
  }, [hard]);

  const finish = (result: 'caught' | 'win' | 'slow') => {
    if (overRef.current) return;
    overRef.current = true;
    blip(result === 'win' ? 'win' : 'lose');
    setOver(result);
    later(() => onDone(result === 'win'), 1100);
  };

  useEffect(() => { if (left <= 0 && !overRef.current) finish('slow'); }, [left]);

  const move = () => {
    if (over || cool) return;
    if (state === 'watching') return finish('caught');
    blip('tap');
    const p = progress + 1;
    setProgress(p);
    if (p >= moves) return finish('win');
    setCool(true);
    later(() => setCool(false), 380);
  };

  const face = state === 'watching' ? '👀 WATCHING' : state === 'turning' ? '⚠️ turning…' : '🙈 looking away';
  return (
    <div className="game-body">
      <div className={`guard ${state}`}>
        <span className="guard-emoji">{guard}</span>
        <span className="guard-state">{face}</span>
      </div>
      <div className="scene-wrap" onClick={move}><SneakScene state={state} progress={progress} moves={moves} place={place} /></div>
      <p className="game-feedback">
        {over === 'caught' ? '🚨 CAUGHT!' : over === 'win' ? '✨ Made it!' : over === 'slow' ? '⏰ Out of time!' : `⏱️ ${left}s · move only when they look away`}
      </p>
      <button className={`btn primary block big-btn ${state === 'watching' ? 'danger-glow' : ''}`} onClick={move} disabled={!!over || cool}>{button}</button>
    </div>
  );
}

/* ───────── Proofread: tap the misspelled word ───────── */

export function ProofGame({ rounds, onDone }: { rounds: number; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const [lines] = useState<ProofLine[]>(() => {
    const out: ProofLine[] = [];
    for (let i = 0; out.length < rounds && i < 40; i++) {
      const l = proofRound();
      if (!out.some((x) => x.text === l.text)) out.push(l);
    }
    return out;
  });
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const line = lines[i];
  const words = line.text.split(' ');
  const strip = (w: string) => w.replace(/[.,!?]/g, '');

  const choose = (idx: number) => {
    if (picked !== null) return;
    const ok = strip(words[idx]) === line.wrong;
    judge(ok);
    const next = [...results, ok];
    setPicked(idx);
    setResults(next);
    later(() => {
      if (next.length >= lines.length) onDone(next.filter(Boolean).length, lines.length);
      else { setI(i + 1); setPicked(null); }
    }, 1400);
  };

  return (
    <div className="game-body">
      <Dots total={lines.length} results={results} />
      <div className="paper">
        <div className="paper-head">📰 Draft {i + 1}</div>
        <p className="paper-text">
          {words.map((w, idx) => (
            <button key={idx} className={`word ${picked === null ? '' : strip(w) === line.wrong ? 'right' : picked === idx ? 'wrong' : ''}`} onClick={() => choose(idx)}>{w}</button>
          ))}
        </p>
      </div>
      <p className="game-feedback">
        {picked === null ? 'Tap the misspelled word' : strip(words[picked]) === line.wrong ? `✅ Yes! “${line.wrong}” → “${line.right}”` : `❌ It was “${line.wrong}” → “${line.right}”`}
      </p>
    </div>
  );
}

/* ───────── Odd one out ───────── */

export function OddGame({ common, odd, label, rounds, onDone }: { common: string; odd: string; label: string; rounds: number; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const size = 12;
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(() => Math.floor(Math.random() * size));
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  const choose = (idx: number) => {
    if (picked !== null) return;
    const ok = idx === target;
    judge(ok);
    const next = [...results, ok];
    setPicked(idx);
    setResults(next);
    later(() => {
      if (next.length >= rounds) onDone(next.filter(Boolean).length, rounds);
      else { setRound(round + 1); setTarget(Math.floor(Math.random() * size)); setPicked(null); }
    }, 900);
  };

  return (
    <div className="game-body">
      <Dots total={rounds} results={results} />
      <p className="game-step">Find the {label}</p>
      <div className="odd-grid">
        {Array.from({ length: size }, (_, i) => (
          <button key={`${round}-${i}`} className={`odd-cell ${picked === null ? '' : i === target ? 'right' : picked === i ? 'wrong' : ''}`} onClick={() => choose(i)}>
            {i === target ? odd : common}
          </button>
        ))}
      </div>
      <p className="game-feedback">{picked === null ? 'Look closely…' : picked === target ? '✅ Found it!' : '❌ That one was fine.'}</p>
    </div>
  );
}

/* ───────── Sort into bins ───────── */

export function SortGame({ bins, items, onDone }: { bins: { id: string; emoji: string; name: string }[]; items: { emoji: string; bin: string }[]; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const [queue] = useState(() => [...items].sort(() => Math.random() - 0.5));
  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const item = queue[i];

  const drop = (binId: string) => {
    if (flash) return;
    const ok = binId === item.bin;
    judge(ok);
    const next = [...results, ok];
    setResults(next);
    setFlash(ok ? 'right' : 'wrong');
    later(() => {
      setFlash(null);
      if (next.length >= queue.length) onDone(next.filter(Boolean).length, queue.length);
      else setI(i + 1);
    }, 500);
  };

  return (
    <div className="game-body">
      <Dots total={queue.length} results={results} />
      <div className={`sort-item ${flash ?? ''}`}>{item.emoji}</div>
      <p className="game-feedback">{flash === 'right' ? '✅ Correct!' : flash === 'wrong' ? '❌ Wrong shelf!' : 'Where does this go?'}</p>
      <div className="bins">
        {bins.map((b) => (
          <button key={b.id} className="bin" onClick={() => drop(b.id)}>
            <span className="bin-emoji">{b.emoji}</span>
            <small>{b.name}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────── Put the steps in order ───────── */

export function OrderGame({ sets, onDone }: { sets: string[][]; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const [steps] = useState(() => sets[Math.floor(Math.random() * sets.length)]);
  const [shuffled] = useState(() => [...steps].sort(() => Math.random() - 0.5));
  const [chosen, setChosen] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const tap = (step: string) => {
    if (chosen.includes(step) || wrong) return;
    if (step === steps[chosen.length]) {
      note(chosen.length);
      const next = [...chosen, step];
      setChosen(next);
      if (next.length === steps.length) later(() => onDone(Math.max(0, steps.length - mistakes), steps.length), 700);
    } else {
      blip('bad');
      setWrong(step);
      setMistakes((m) => m + 1);
      later(() => setWrong(null), 600);
    }
  };

  return (
    <div className="game-body">
      <Dots total={steps.length} results={chosen.map(() => true)} />
      <p className="game-step">Step {Math.min(chosen.length + 1, steps.length)} of {steps.length}</p>
      <ol className="order-done">
        {chosen.map((c, i) => <li key={c}><span className="num-badge">{i + 1}</span>{c}</li>)}
      </ol>
      <div className="order-options">
        {shuffled.filter((s) => !chosen.includes(s)).map((s) => (
          <button key={s} className={`btn order-opt ${wrong === s ? 'shake' : ''}`} onClick={() => tap(s)}>{s}</button>
        ))}
      </div>
      <p className="game-feedback">{wrong ? '❌ Not yet — something comes first!' : chosen.length === steps.length ? '✅ Perfect order!' : 'Tap what comes next'}</p>
    </div>
  );
}

/* ───────── Breathe: tap at the top of each breath ───────── */

export function BreathGame({ rounds, onDone }: { rounds: number; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const [scale, setScale] = useState(0);
  const scaleRef = useRef(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [state, setState] = useState<'idle' | 'hit' | 'miss'>('idle');

  useEffect(() => {
    if (state !== 'idle') return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const x = ((t - start) % 3400) / 3400;
      scaleRef.current = (1 - Math.cos(x * Math.PI * 2)) / 2;
      setScale(scaleRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const breathe = () => {
    if (state !== 'idle') return;
    const ok = scaleRef.current > 0.82;
    judge(ok);
    const next = [...results, ok];
    setResults(next);
    setState(ok ? 'hit' : 'miss');
    later(() => {
      if (next.length >= rounds) onDone(next.filter(Boolean).length, rounds);
      else setState('idle');
    }, 800);
  };

  return (
    <div className="game-body">
      <Dots total={rounds} results={results} />
      <div className="scene-wrap" onClick={breathe}><BreathScene scale={scale} state={state} /></div>
      <p className="game-feedback">{state === 'hit' ? '🌬️ Beautiful breath' : state === 'miss' ? '😮‍💨 Too early' : 'Tap when the circle is at its biggest'}</p>
      <button className="btn primary block big-btn" onClick={breathe} disabled={state !== 'idle'}>Breathe out</button>
    </div>
  );
}

/* ───────── Find the right book on the shelf ───────── */

const BOOK_COLORS = ['#c2418f', '#6f8cff', '#7ef0c1', '#f4c95d', '#e0445a', '#b79cff', '#3fc1b0', '#ff9a4d', '#8a5cf0', '#5ee7df', '#ffb38a', '#9be8c8'];
const BOOK_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'];

export function FindBookGame({ rounds, onDone }: { rounds: number; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const deal = () => {
    const colors = [...BOOK_COLORS].sort(() => Math.random() - 0.5).slice(0, 12);
    const labels = [...BOOK_LABELS].sort(() => Math.random() - 0.5);
    return colors.map((color, i) => ({ color, label: labels[i] }));
  };
  const [books, setBooks] = useState(deal);
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 12));
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  const pick = (i: number) => {
    if (picked !== null) return;
    const ok = i === target;
    judge(ok);
    const next = [...results, ok];
    setPicked(i);
    setResults(next);
    later(() => {
      if (next.length >= rounds) onDone(next.filter(Boolean).length, rounds);
      else { setBooks(deal()); setTarget(Math.floor(Math.random() * 12)); setPicked(null); }
    }, 900);
  };

  const want = books[target];
  return (
    <div className="game-body">
      <Dots total={rounds} results={results} />
      <p className="game-step">Find shelf mark <span className="book-chip" style={{ background: want.color }}>{want.label}</span></p>
      <div className="scene-wrap"><ShelfScene books={books} onPick={pick} picked={picked} target={target} /></div>
      <p className="game-feedback">{picked === null ? 'Tap the matching book spine' : picked === target ? '✅ Shelved correctly!' : '❌ That’s a different book.'}</p>
    </div>
  );
}

/* ───────── Work: intro → play → result ───────── */

/* ───────── Dress for the occasion ───────── */

interface Occasion { name: string; emoji: string; right: string[]; wrong: string[] }

const OCCASIONS: Occasion[] = [
  { name: 'A state ball at the palace', emoji: '💃', right: ['ballgown', 'tuxedo', 'gown'], wrong: ['tracksuit', 'swimsuit', 'pajamas', 'apron', 'jersey'] },
  { name: 'A military parade', emoji: '🎖️', right: ['uniform'], wrong: ['swimsuit', 'tutu', 'pajamas', 'croptop', 'hoodie'] },
  { name: 'A garden party in June', emoji: '🌸', right: ['dress', 'sundress', 'kimono'], wrong: ['wintercoat', 'swimsuit', 'pajamas', 'scrubs'] },
  { name: 'Opening a new hospital wing', emoji: '🏥', right: ['suit', 'blazer', 'shirt'], wrong: ['swimsuit', 'tutu', 'pajamas', 'tank'] },
  { name: 'A state funeral', emoji: '🕯️', right: ['tuxedo', 'suit'], wrong: ['tutu', 'swimsuit', 'jersey', 'croptop', 'tracksuit'] },
  { name: 'The charity fun run', emoji: '🏃', right: ['tracksuit', 'jersey'], wrong: ['ballgown', 'tuxedo', 'wintercoat', 'wedding'] },
  { name: 'A beach visit with the press', emoji: '🏖️', right: ['swimsuit'], wrong: ['tuxedo', 'wintercoat', 'ballgown', 'labcoat'] },
  { name: 'A winter walkabout', emoji: '❄️', right: ['wintercoat', 'puffer'], wrong: ['swimsuit', 'croptop', 'tutu', 'tank'] },
  { name: 'An evening at the ballet', emoji: '🩰', right: ['gown', 'ballgown', 'tuxedo'], wrong: ['tracksuit', 'apron', 'pajamas', 'overalls'] },
  { name: 'Tea with the ambassador', emoji: '🫖', right: ['blazer', 'shirt', 'dress'], wrong: ['swimsuit', 'pajamas', 'tutu', 'tank'] },
  { name: 'Your own royal wedding', emoji: '💍', right: ['wedding', 'tuxedo'], wrong: ['tracksuit', 'pajamas', 'hoodie', 'swimsuit'] },
  { name: 'A rainy ribbon cutting', emoji: '🌧️', right: ['raincoat'], wrong: ['swimsuit', 'ballgown', 'tutu', 'croptop'] },
];

const shuffled = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

export function OutfitGame({ rounds, look, onDone }: { rounds: number; look?: Look; onDone: (score: number, max: number) => void }) {
  const later = useTimers();
  const deal = () => {
    const ev = OCCASIONS[Math.floor(Math.random() * OCCASIONS.length)];
    const right = shuffled(ev.right)[0];
    const options = shuffled([right, ...shuffled(ev.wrong).slice(0, 3)]);
    return { ev, right, options };
  };
  const [round, setRound] = useState(deal);
  const [picked, setPicked] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  const choose = (id: string) => {
    if (picked) return;
    const ok = id === round.right;
    judge(ok);
    const next = [...results, ok];
    setPicked(id);
    setResults(next);
    later(() => {
      if (next.length >= rounds) onDone(next.filter(Boolean).length, rounds);
      else { setRound(deal()); setPicked(null); }
    }, 1100);
  };

  const base: Look = look ?? { skin: '#f7cba9', hair: 'bob', hairColor: '#5a3825', eyes: '#6b4a2f' };
  return (
    <div className="game-body">
      <Dots total={rounds} results={results} />
      <p className="game-step">{round.ev.emoji} {round.ev.name}</p>
      <div className="outfit-grid">
        {round.options.map((id) => (
          <button key={id} className={`outfit-pick ${picked ? (id === round.right ? 'right' : picked === id ? 'wrong' : 'dim') : ''}`}
            onClick={() => choose(id)} disabled={!!picked}>
            <span className="outfit-avatar"><Avatar look={{ ...base, top: id }} age={22} mood={80} /></span>
            <small>{itemName(id)}</small>
          </button>
        ))}
      </div>
      <p className="game-feedback">
        {!picked ? 'Tap the outfit that fits the occasion' : picked === round.right ? '👑 Perfectly dressed!' : `😬 Not for this one — ${itemName(round.right)} was the right call.`}
      </p>
    </div>
  );
}

/* ───────── Exam paper ───────── */

export function ExamGame({ subjects, reviewed, onDone, onClose }: {
  subjects: { name: string; bank: QuizBank }[];
  reviewed: boolean;
  onDone: (marks: { name: string; correct: number; total: number }[]) => void;
  onClose: () => void;
}) {
  const later = useTimers();
  const PER_SUBJECT = 2;
  const [paper] = useState(() =>
    subjects.flatMap((s) => {
      const qs: ReturnType<typeof makeQuestion>[] = [];
      for (let tries = 0; qs.length < PER_SUBJECT && tries < 20; tries++) {
        const q = makeQuestion(s.bank);
        if (!qs.some((x) => x.q === q.q)) qs.push(q);
      }
      return qs.map((q) => ({ subject: s.name, q }));
    }));
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [marks, setMarks] = useState<boolean[]>([]);
  const [time, setTime] = useState(reviewed ? 16 : 11);
  const row = paper[i];

  const choose = (o: string) => {
    if (picked !== null || !row) return;
    const ok = o === row.q.a;
    judge(ok);
    const next = [...marks, ok];
    setPicked(o);
    setMarks(next);
    later(() => {
      if (i + 1 >= paper.length) {
        const byName = subjects.map((s) => {
          const idx = paper.map((p, j) => (p.subject === s.name ? j : -1)).filter((j) => j >= 0);
          return { name: s.name, correct: idx.filter((j) => next[j]).length, total: idx.length };
        });
        onDone(byName);
      } else { setI(i + 1); setPicked(null); setTime(reviewed ? 16 : 11); }
    }, 950);
  };

  useEffect(() => {
    if (!started || picked !== null) return;
    if (time <= 0) { choose('__timeout__'); return; }
    const id = setTimeout(() => setTime((t) => +(t - 0.1).toFixed(1)), 100);
    return () => clearTimeout(id);
  }, [time, picked, started]);

  return (
    <GameShell title="📝 Exam day" onClose={started ? undefined : onClose}>
      {!started ? (
        <div className="game-body">
          <div className="exam-sheet">
            <p className="exam-title">Examination paper</p>
            <ul>{subjects.map((s) => <li key={s.name}>{s.name}</li>)}</ul>
            <p className="exam-foot">{PER_SUBJECT * subjects.length} questions · {reviewed ? 'you studied the review sheet 📄' : 'no review sheet — good luck'}</p>
          </div>
          <button className="btn primary block big-btn" onClick={() => setStarted(true)}>Turn over the paper ▶</button>
        </div>
      ) : (
        <div className="game-body">
          <Dots total={paper.length} results={marks} />
          <p className="exam-subject">{row?.subject}</p>
          <div className="timer"><i style={{ width: `${(time / (reviewed ? 16 : 11)) * 100}%` }} /></div>
          <p className="quiz-q">{row?.q.q}</p>
          <div className="quiz-options">
            {row?.q.options.map((o) => (
              <button key={o} className={`btn quiz-opt ${picked === null ? '' : o === row.q.a ? 'right' : o === picked ? 'wrong' : 'dim'}`} onClick={() => choose(o)}>{o}</button>
            ))}
          </div>
          {picked === '__timeout__' && <p className="game-feedback">⏰ Time's up on that one!</p>}
        </div>
      )}
    </GameShell>
  );
}

/* ───────── Job interview ───────── */

export function InterviewGame({ interview, onDone, onClose }: {
  interview: Interview;
  onDone: (wrong: number) => void;
  onClose: () => void;
}) {
  const later = useTimers();
  const [rounds] = useState(() => interview.questions.map((q) => ({
    q: q.q,
    right: q.options[0],
    options: [...q.options].sort(() => Math.random() - 0.5),
  })));
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState(0);
  const row = rounds[i];

  const choose = (o: string) => {
    if (picked !== null) return;
    const ok = o === row.right;
    judge(ok);
    const misses = wrong + (ok ? 0 : 1);
    setPicked(o);
    setWrong(misses);
    later(() => {
      if (i + 1 >= rounds.length) onDone(misses);
      else { setI(i + 1); setPicked(null); }
    }, 1100);
  };

  return (
    <GameShell title={`${interview.emoji} ${interview.title} interview`} onClose={started ? undefined : onClose}>
      {!started ? (
        <div className="game-body">
          <p className="game-intro">
            They're ready for you. Three questions — answer them well and the job is yours to win.
            Get one wrong and they'll go with someone else, and you'd have to wait a year to try {interview.title} again.
          </p>
          <button className="btn primary block big-btn" onClick={() => setStarted(true)}>Walk in 🚪</button>
        </div>
      ) : (
        <div className="game-body">
          <Dots total={rounds.length} results={Array.from({ length: rounds.length }, (_, j) => (j < i ? true : undefined))} />
          <div className="interviewer">
            <span className="i-face">🧑‍💼</span>
            <p className="i-bubble">{row.q}</p>
          </div>
          <div className="quiz-options">
            {row.options.map((o) => (
              <button key={o} className={`btn quiz-opt ${picked === null ? '' : o === row.right ? 'right' : o === picked ? 'wrong' : 'dim'}`} onClick={() => choose(o)}>{o}</button>
            ))}
          </div>
          {picked !== null && <p className="game-feedback">{picked === row.right ? '🙂 They nodded and wrote something down.' : '😬 They didn’t write anything down.'}</p>}
        </div>
      )}
    </GameShell>
  );
}

export function WorkGamePlayer({ def, onFinish, onClose, look }: { def: WorkGame; onFinish: (score: number, max: number) => void; onClose: () => void; look?: Look }) {
  const [started, setStarted] = useState(false);
  const done = (score: number, max: number) => onFinish(score, max);
  return (
    <GameShell title={def.title} onClose={started ? undefined : onClose}>
      {!started ? (
        <div className="game-body">
          <p className="game-intro">{def.intro}</p>
          <button className="btn primary block big-btn" onClick={() => setStarted(true)}>Start ▶</button>
        </div>
      ) : def.kind === 'timing' ? <TimingGame steps={def.steps} zone={def.zone} speed={def.speed} button={def.button} scene={def.scene} onDone={done} />
        : def.kind === 'simon' ? <SimonGame pads={def.pads} onDone={done} />
        : def.kind === 'quiz' ? <QuizGame bank={def.bank} onDone={done} />
        : def.kind === 'tap' ? <TapGame good={def.good} bad={def.bad} onDone={done} />
        : def.kind === 'proof' ? <ProofGame rounds={def.rounds} onDone={done} />
        : def.kind === 'odd' ? <OddGame common={def.common} odd={def.odd} label={def.label} rounds={def.rounds} onDone={done} />
        : def.kind === 'sort' ? <SortGame bins={def.bins} items={def.items} onDone={done} />
        : def.kind === 'order' ? <OrderGame sets={def.sets} onDone={done} />
        : def.kind === 'breath' ? <BreathGame rounds={def.rounds} onDone={done} />
        : def.kind === 'findbook' ? <FindBookGame rounds={def.rounds} onDone={done} />
        : def.kind === 'outfit' ? <OutfitGame rounds={def.rounds} look={look} onDone={done} />
        : <StealthGame moves={def.moves} button={def.button} guard="👀" place="bank" onDone={(ok) => done(ok ? 1 : 0, 1)} />}
    </GameShell>
  );
}
