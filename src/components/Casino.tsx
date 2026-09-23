import { useEffect, useRef, useState } from 'react';
import type { Game } from '../game/types';
import { leaveCasino, lotteryWin, payBet } from '../game/actions';
import { blip } from '../sound';
import { money, rand } from '../game/util';
import { GameShell } from './Games';
import type { Act } from './Sheets';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function useMounted() {
  const m = useRef(true);
  useEffect(() => { m.current = true; return () => { m.current = false; }; }, []);
  return m;
}

function BetPicker({ bet, setBet, bank, disabled }: { bet: number; setBet: (n: number) => void; bank: number; disabled?: boolean }) {
  return (
    <div className="bet-row">
      <span className="muted">Bet</span>
      {[100, 500, 1000, 5000, 25000].map((b) => (
        <button key={b} type="button" className={`chip ${bet === b ? 'on' : ''}`} disabled={disabled || b > bank} onClick={() => setBet(b)}>{money(b)}</button>
      ))}
    </div>
  );
}

/* ═════════════════ Casino ═════════════════ */

export function CasinoView({ game, act, onClose }: { game: Game; act: Act; onClose: () => void }) {
  const [tab, setTab] = useState<'slots' | 'blackjack' | 'roulette'>('slots');
  const [bet, setBet] = useState(100);
  const [busy, setBusy] = useState(false);
  const session = useRef({ net: 0, rounds: 0 });
  const [net, setNet] = useState(0);

  const settle = (delta: number) => {
    act((g) => payBet(g, delta));
    session.current.net += delta;
    setNet(session.current.net);
  };
  const played = () => { session.current.rounds++; };
  const leave = () => {
    const { net, rounds } = session.current;
    act((g) => leaveCasino(g, net, rounds));
    onClose();
  };

  return (
    <GameShell title="🎰 Midnight Casino" onClose={busy ? undefined : leave}>
      <div className="game-body">
        <div className="casino-bank">
          <span>Bank <b>{money(game.money)}</b></span>
          <span className={net > 0 ? 'up' : net < 0 ? 'down' : ''}>Tonight {net >= 0 ? '+' : ''}{money(net)}</span>
        </div>
        <div className="seg small-seg">
          {(['slots', 'blackjack', 'roulette'] as const).map((t) => (
            <button key={t} type="button" className={tab === t ? 'on' : ''} disabled={busy} onClick={() => setTab(t)}>
              {t === 'slots' ? '🎰 Slots' : t === 'blackjack' ? '🃏 Blackjack' : '🎡 Roulette'}
            </button>
          ))}
        </div>
        <BetPicker bet={bet} setBet={setBet} bank={game.money} disabled={busy} />
        {tab === 'slots' && <Slots bet={bet} bank={game.money} settle={settle} played={played} setBusy={setBusy} />}
        {tab === 'blackjack' && <Blackjack bet={bet} bank={game.money} settle={settle} played={played} setBusy={setBusy} />}
        {tab === 'roulette' && <Roulette bet={bet} bank={game.money} settle={settle} played={played} setBusy={setBusy} />}
        <button className="btn block" onClick={leave} disabled={busy}>🚪 Cash out & leave</button>
      </div>
    </GameShell>
  );
}

interface TableProps { bet: number; bank: number; settle: (d: number) => void; played: () => void; setBusy: (b: boolean) => void }

/* ───── Slots ───── */

const REEL: [string, number][] = [['🍒', 30], ['🍋', 25], ['🔔', 18], ['⭐', 12], ['🌙', 8], ['💎', 5], ['7️⃣', 2]];
const TRIPLE: Record<string, number> = { '🍒': 3, '🍋': 4, '🔔': 5, '⭐': 8, '🌙': 12, '💎': 25, '7️⃣': 50 };
function spinSymbol() {
  let r = Math.random() * 100;
  for (const [s, w] of REEL) { r -= w; if (r <= 0) return s; }
  return '🍒';
}

function Slots({ bet, bank, settle, played, setBusy }: TableProps) {
  const mounted = useMounted();
  const [reels, setReels] = useState(['🌙', '⭐', '💎']);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [msg, setMsg] = useState('Three of a kind pays big. Any pair pays 1.5×.');
  const spinningRef = useRef([true, true, true]);

  const spin = async () => {
    if (bet > bank) return;
    setBusy(true);
    settle(-bet);
    const final = [spinSymbol(), spinSymbol(), spinSymbol()];
    setSpinning([true, true, true]);
    setMsg('Spinning…');
    const anim = setInterval(() => mounted.current && setReels((r) => r.map((s, i) => (spinningRef.current[i] ? spinSymbol() : s))), 70);
    for (let i = 0; i < 3; i++) {
      await wait(600 + i * 350);
      spinningRef.current[i] = false;
      if (!mounted.current) { clearInterval(anim); return; }
      setReels((r) => r.map((s, j) => (j === i ? final[i] : s)));
      setSpinning((sp) => sp.map((v, j) => (j === i ? false : v)));
      blip('pop');
    }
    clearInterval(anim);
    spinningRef.current = [true, true, true];
    const [a, b, c] = final;
    let payout = 0;
    if (a === b && b === c) payout = bet * TRIPLE[a];
    else if (a === b || b === c || a === c) payout = Math.round(bet * 1.5);
    if (payout) settle(payout);
    blip(payout >= bet * 8 ? 'win' : payout ? 'coin' : 'lose');
    played();
    setMsg(payout >= bet * 8 ? `🎉 JACKPOT! +${money(payout)}` : payout ? `Nice! +${money(payout)}` : 'No luck. Spin again?');
    setBusy(false);
  };

  return (
    <div className="table">
      <div className="reels">{reels.map((s, i) => <span key={i} className={`reel ${spinning[i] ? 'spin' : ''}`}>{s}</span>)}</div>
      <p className="game-feedback">{msg}</p>
      <button className="btn primary block big-btn" onClick={spin} disabled={spinning.some(Boolean) || bet > bank}>{bet > bank ? 'Not enough money' : `Spin · ${money(bet)}`}</button>
    </div>
  );
}

/* ───── Blackjack ───── */

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
interface Card { r: string; s: string }
const draw = (): Card => ({ r: RANKS[rand(0, 12)], s: SUITS[rand(0, 3)] });
function total(hand: Card[]) {
  let t = 0, aces = 0;
  for (const c of hand) {
    if (c.r === 'A') { t += 11; aces++; } else t += ['J', 'Q', 'K'].includes(c.r) ? 10 : Number(c.r);
  }
  while (t > 21 && aces--) t -= 10;
  return t;
}

function CardView({ c, hidden }: { c: Card; hidden?: boolean }) {
  if (hidden) return <span className="pcard back">🌙</span>;
  return <span className={`pcard ${c.s === '♥' || c.s === '♦' ? 'red' : ''}`}>{c.r}<small>{c.s}</small></span>;
}

function Blackjack({ bet, bank, settle, played, setBusy }: TableProps) {
  const mounted = useMounted();
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'idle' | 'play' | 'dealer' | 'done'>('idle');
  const [stake, setStake] = useState(0);
  const [msg, setMsg] = useState('Get closer to 21 than the dealer without going over.');

  const finish = (p: Card[], d: Card[], stakeAmt: number) => {
    const pt = total(p), dt = total(d);
    let payout = 0, text = '';
    if (pt > 21) text = `Bust with ${pt}. Dealer wins.`;
    else if (p.length === 2 && pt === 21 && !(d.length === 2 && dt === 21)) { payout = Math.round(stakeAmt * 2.5); text = `🃏 BLACKJACK! +${money(payout)}`; }
    else if (dt > 21 || pt > dt) { payout = stakeAmt * 2; text = `You win with ${pt}! +${money(payout)}`; }
    else if (pt === dt) { payout = stakeAmt; text = `Push at ${pt}. Bet returned.`; }
    else text = `Dealer wins with ${dt}.`;
    if (payout) settle(payout);
    blip(payout > stakeAmt ? 'coin' : payout ? 'pop' : 'lose');
    played();
    setMsg(text);
    setPhase('done');
    setBusy(false);
  };

  const deal = () => {
    if (bet > bank) return;
    settle(-bet);
    setStake(bet);
    setBusy(true);
    const p = [draw(), draw()];
    const d = [draw(), draw()];
    setPlayer(p); setDealer(d);
    if (total(p) === 21) { setPhase('dealer'); finish(p, d, bet); return; }
    setPhase('play');
    setMsg('Hit or stand?');
  };

  const hit = () => {
    const p = [...player, draw()];
    setPlayer(p);
    if (total(p) > 21) { setPhase('dealer'); finish(p, dealer, stake); }
  };

  const stand = async () => {
    setPhase('dealer');
    let d = [...dealer];
    setMsg('Dealer’s turn…');
    while (total(d) < 17) {
      await wait(550);
      if (!mounted.current) return;
      d = [...d, draw()];
      setDealer(d);
    }
    await wait(400);
    if (mounted.current) finish(player, d, stake);
  };

  const hideHole = phase === 'play';
  return (
    <div className="table felt">
      <div className="hand"><span className="muted">Dealer {phase === 'idle' ? '' : hideHole ? '' : `· ${total(dealer)}`}</span>
        <div className="cards">{dealer.map((c, i) => <CardView key={i} c={c} hidden={hideHole && i === 1} />)}</div></div>
      <div className="hand"><span className="muted">You {player.length ? `· ${total(player)}` : ''}</span>
        <div className="cards">{player.map((c, i) => <CardView key={i} c={c} />)}</div></div>
      <p className="game-feedback">{msg}</p>
      {phase === 'play' ? (
        <div className="two-btns">
          <button className="btn primary" onClick={hit}>Hit</button>
          <button className="btn" onClick={stand}>Stand</button>
        </div>
      ) : (
        <button className="btn primary block big-btn" onClick={deal} disabled={phase === 'dealer' || bet > bank}>{bet > bank ? 'Not enough money' : `Deal · ${money(bet)}`}</button>
      )}
    </div>
  );
}

/* ───── Roulette ───── */

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
type RouletteBet = 'red' | 'black' | 'odd' | 'even' | number;

function Roulette({ bet, bank, settle, played, setBusy }: TableProps) {
  const mounted = useMounted();
  const [choice, setChoice] = useState<RouletteBet>('red');
  const [shown, setShown] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState('Colors and odd/even pay 2×. A single number pays 36×.');
  const color = (n: number) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

  const spin = async () => {
    if (bet > bank) return;
    settle(-bet);
    setBusy(true);
    setSpinning(true);
    const result = rand(0, 36);
    for (let i = 0; i < 18; i++) {
      await wait(40 + i * 8);
      if (!mounted.current) return;
      setShown(rand(0, 36));
    }
    setShown(result);
    const won = typeof choice === 'number' ? choice === result
      : result !== 0 && (choice === 'red' ? REDS.has(result) : choice === 'black' ? !REDS.has(result) : choice === 'odd' ? result % 2 === 1 : result % 2 === 0);
    const payout = won ? bet * (typeof choice === 'number' ? 36 : 2) : 0;
    if (payout) settle(payout);
    blip(won ? 'coin' : 'lose');
    played();
    setMsg(won ? `🎉 ${result} ${color(result)}! +${money(payout)}` : `${result} ${color(result)}. The house wins.`);
    setSpinning(false);
    setBusy(false);
  };

  return (
    <div className="table">
      <div className={`wheel ${shown === null ? '' : color(shown)} ${spinning ? 'spin' : ''}`}>{shown ?? '🎡'}</div>
      <div className="chips">
        {(['red', 'black', 'odd', 'even'] as const).map((c) => (
          <button key={c} type="button" className={`chip ${choice === c ? 'on' : ''}`} disabled={spinning} onClick={() => setChoice(c)}>
            {c === 'red' ? '🔴 Red' : c === 'black' ? '⚫ Black' : c === 'odd' ? 'Odd' : 'Even'}
          </button>
        ))}
        <label className="chip num-chip">
          # <input type="number" min={0} max={36} value={typeof choice === 'number' ? choice : ''} placeholder="7" disabled={spinning}
            onChange={(e) => { const n = Math.max(0, Math.min(36, Number(e.target.value))); setChoice(Number.isNaN(n) ? 'red' : n); }} />
        </label>
      </div>
      <p className="game-feedback">{msg}</p>
      <button className="btn primary block big-btn" onClick={spin} disabled={spinning || bet > bank}>{bet > bank ? 'Not enough money' : `Spin · ${money(bet)} on ${typeof choice === 'number' ? `#${choice}` : choice}`}</button>
    </div>
  );
}

/* ═════════════════ Lottery ═════════════════ */

const SCRATCH: { sym: string; prize: number; odds: number }[] = [
  { sym: '💎', prize: 10000, odds: 1 / 20000 },
  { sym: '🌙', prize: 500, odds: 1 / 1000 },
  { sym: '⭐', prize: 50, odds: 1 / 100 },
  { sym: '🍀', prize: 10, odds: 1 / 15 },
  { sym: '🍒', prize: 5, odds: 1 / 8 },
];

function makeScratchCard(): { cells: string[]; prize: number; sym?: string } {
  let r = Math.random();
  let winner: (typeof SCRATCH)[number] | undefined;
  for (const s of SCRATCH) { if (r < s.odds) { winner = s; break; } r -= s.odds; }
  const syms = SCRATCH.map((s) => s.sym);
  const cells: string[] = [];
  const counts: Record<string, number> = {};
  if (winner) { cells.push(winner.sym, winner.sym, winner.sym); counts[winner.sym] = 3; }
  while (cells.length < 9) {
    const s = syms[rand(0, syms.length - 1)];
    if ((counts[s] ?? 0) >= 2 && s !== winner?.sym) continue;
    if (s === winner?.sym) continue;
    counts[s] = (counts[s] ?? 0) + 1;
    cells.push(s);
  }
  return { cells: cells.sort(() => Math.random() - 0.5), prize: winner?.prize ?? 0, sym: winner?.sym };
}

const MEGA_PICKS = 6;
const MEGA_MAX = 45;
const MEGA_PRIZES: Record<number, number> = { 3: 50, 4: 500, 5: 10000 };

export function LotteryView({ game, act, onClose }: { game: Game; act: Act; onClose: () => void }) {
  const [tab, setTab] = useState<'scratch' | 'mega'>('scratch');
  const [busy, setBusy] = useState(false);
  return (
    <GameShell title="🎟️ Lottery Booth" onClose={busy ? undefined : onClose}>
      <div className="game-body">
        <div className="casino-bank"><span>Bank <b>{money(game.money)}</b></span></div>
        <div className="seg small-seg">
          <button type="button" className={tab === 'scratch' ? 'on' : ''} disabled={busy} onClick={() => setTab('scratch')}>✨ Scratch card · $5</button>
          <button type="button" className={tab === 'mega' ? 'on' : ''} disabled={busy} onClick={() => setTab('mega')}>🌕 Mega draw · $20</button>
        </div>
        {tab === 'scratch' ? <Scratch game={game} act={act} setBusy={setBusy} /> : <Mega game={game} act={act} setBusy={setBusy} />}
      </div>
    </GameShell>
  );
}

function Scratch({ game, act, setBusy }: { game: Game; act: Act; setBusy: (b: boolean) => void }) {
  const [card, setCard] = useState<ReturnType<typeof makeScratchCard> | null>(null);
  const [shown, setShown] = useState<boolean[]>(Array(9).fill(false));
  const [msg, setMsg] = useState('Match three symbols to win!');

  const buy = () => {
    if (game.money < 5) return;
    act((g) => payBet(g, -5));
    setCard(makeScratchCard());
    setShown(Array(9).fill(false));
    setMsg('Scratch all nine spots!');
    setBusy(true);
  };

  const reveal = (i: number | 'all') => {
    if (!card) return;
    const next = i === 'all' ? Array(9).fill(true) : shown.map((v, j) => v || j === i);
    setShown(next);
    if (next.every(Boolean)) {
      setBusy(false);
      if (card.prize) {
        blip('coin');
        setMsg(`${card.sym}${card.sym}${card.sym} You won ${money(card.prize)}!`);
        const prize = card.prize;
        act((g) => { const r = lotteryWin(g, prize, 'a scratch card'); return prize >= 500 ? r : undefined; });
      } else { blip('lose'); setMsg('No match this time.'); }
    }
  };

  const done = !card || shown.every(Boolean);
  return (
    <div className="table">
      <div className="scratch">
        {Array.from({ length: 9 }, (_, i) => (
          <button key={i} className={`scratch-cell ${card && shown[i] ? 'open' : ''}`} disabled={!card || shown[i]} onClick={() => reveal(i)}>
            {card && shown[i] ? card.cells[i] : '✨'}
          </button>
        ))}
      </div>
      <p className="game-feedback">{msg}</p>
      {done ? (
        <button className="btn primary block big-btn" onClick={buy} disabled={game.money < 5}>Buy a card · $5</button>
      ) : (
        <button className="btn block" onClick={() => reveal('all')}>Reveal all</button>
      )}
      <p className="note center-note">Prizes: 💎 $10,000 · 🌙 $500 · ⭐ $50 · 🍀 $10 · 🍒 $5</p>
    </div>
  );
}

function Mega({ game, act, setBusy }: { game: Game; act: Act; setBusy: (b: boolean) => void }) {
  const mounted = useMounted();
  const [picks, setPicks] = useState<number[]>([]);
  const [balls, setBalls] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [msg, setMsg] = useState(`Pick ${MEGA_PICKS} numbers. Match all ${MEGA_PICKS} for the jackpot!`);

  const toggle = (n: number) => {
    if (drawing) return;
    setBalls([]);
    setPicks((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length < MEGA_PICKS ? [...p, n] : p));
  };
  const quick = () => {
    const s = new Set<number>();
    while (s.size < MEGA_PICKS) s.add(rand(1, MEGA_MAX));
    setPicks([...s]); setBalls([]);
  };

  const play = async () => {
    if (picks.length < MEGA_PICKS || game.money < 20) return;
    act((g) => payBet(g, -20));
    setDrawing(true); setBusy(true); setBalls([]);
    setMsg('Drawing…');
    const s = new Set<number>();
    while (s.size < MEGA_PICKS) s.add(rand(1, MEGA_MAX));
    const drawn = [...s];
    for (let i = 0; i < drawn.length; i++) {
      await wait(650);
      if (!mounted.current) return;
      setBalls(drawn.slice(0, i + 1));
    }
    const hits = drawn.filter((n) => picks.includes(n)).length;
    const prize = hits === MEGA_PICKS ? rand(5, 60) * 1_000_000 : MEGA_PRIZES[hits] ?? 0;
    setDrawing(false); setBusy(false);
    if (prize) {
      blip('coin');
      setMsg(`${hits} matches! You won ${money(prize)}!`);
      act((g) => lotteryWin(g, prize, `the Mega draw (${hits} matches)`));
    } else setMsg(`${hits} match${hits === 1 ? '' : 'es'}. Better luck next time!`);
  };

  return (
    <div className="table">
      <div className="balls">{Array.from({ length: MEGA_PICKS }, (_, i) => <span key={i} className={`ball ${balls[i] && picks.includes(balls[i]) ? 'match' : ''}`}>{balls[i] ?? '?'}</span>)}</div>
      <div className="num-grid">
        {Array.from({ length: MEGA_MAX }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={`lotto-num ${picks.includes(n) ? 'on' : ''} ${balls.includes(n) ? 'drawn' : ''}`} onClick={() => toggle(n)}>{n}</button>
        ))}
      </div>
      <p className="game-feedback">{msg}</p>
      <div className="two-btns">
        <button className="btn" onClick={quick} disabled={drawing}>🎲 Quick pick</button>
        <button className="btn primary" onClick={play} disabled={drawing || picks.length < MEGA_PICKS || game.money < 20}>Play · $20</button>
      </div>
      <p className="note center-note">3 matches $50 · 4 matches $500 · 5 matches $10,000 · 6 = 🌕 JACKPOT</p>
    </div>
  );
}
