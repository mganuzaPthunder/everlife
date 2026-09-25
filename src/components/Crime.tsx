import { useState } from 'react';
import { escapeResult, heistResult, shopliftResult, startMiniGame } from '../game/actions';
import { chance, money, rand } from '../game/util';
import { GameShell, StealthGame, TimingGame } from './Games';
import { quickShoplift } from '../game/quickplay';
import type { Act } from './Sheets';

/* ───────── Shoplift ───────── */

const LOOT = [
  { id: 'candy', emoji: '🍫', name: 'Candy bar', moves: 2, note: 'Easy · just for fun' },
  { id: 'shades', emoji: '🕶️', name: 'Designer shades', moves: 3, note: 'Medium · resell for $150' },
  { id: 'bag', emoji: '👜', name: 'Designer handbag', moves: 5, note: 'Hard · resell for $900' },
];

export function ShopliftGame({ act, onClose, quick }: { act: Act; onClose: () => void; quick?: boolean }) {
  const [item, setItem] = useState<(typeof LOOT)[number] | null>(null);

  const start = (l: (typeof LOOT)[number]) => {
    if (quick) { act((g) => quickShoplift(g, l.id)); onClose(); return; } // mini-games off: just roll for it
    act((g) => { startMiniGame(g, 'shoplift'); });
    setItem(l);
  };

  return (
    <GameShell title="🕶️ Five-finger discount" onClose={item ? undefined : onClose}>
      {!item ? (
        <div className="game-body">
          <p className="game-intro">Pick your target. Only move when security looks away — if they see you, you’re busted.</p>
          <div className="pick-list">
            {LOOT.map((l) => (
              <button key={l.id} className="row" onClick={() => start(l)}>
                <span className="emoji">{l.emoji}</span>
                <span className="main"><b>{l.name}</b><small>{l.note}</small></span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <StealthGame moves={item.moves} button={`Grab ${item.emoji}`} guard="💂" place="shop" hard={item.id === 'bag'}
          onDone={(ok) => { act((g) => shopliftResult(g, ok, item.id)); onClose(); }} />
      )}
    </GameShell>
  );
}

/* ───────── Bank heist: sneak → crack → getaway ───────── */

const GETAWAYS = [
  { id: 'car', emoji: '🚗', name: 'Getaway car', odds: 0.5 },
  { id: 'subway', emoji: '🚇', name: 'Blend into the subway', odds: 0.55 },
  { id: 'disguise', emoji: '🥸', name: 'Fake mustache disguise', odds: 0.45 },
];

export function HeistGame({ act, onClose }: { act: Act; onClose: () => void }) {
  const [stage, setStage] = useState<'intro' | 'sneak' | 'crack' | 'getaway'>('intro');
  const [cracked, setCracked] = useState(0);

  const begin = () => {
    act((g) => { startMiniGame(g, 'heist'); });
    setStage('sneak');
  };
  const end = (outcome: 'caught' | 'escaped' | 'empty', loot = 0) => {
    act((g) => heistResult(g, outcome, loot));
    onClose();
  };

  const title = { intro: '🏦 The Big Heist', sneak: '1/3 · Sneak past the guards', crack: '2/3 · Crack the vault', getaway: '3/3 · The getaway' }[stage];
  return (
    <GameShell title={title} onClose={stage === 'intro' ? onClose : undefined}>
      {stage === 'intro' && (
        <div className="game-body">
          <p className="game-intro">Three stages. Sneak in without being seen, crack the vault dial, then pick your getaway. Get caught at any point and it’s prison time.</p>
          <p className="note center-note">Bigger vault score = bigger loot 💰</p>
          <button className="btn primary block big-btn" onClick={begin}>🦹 Let’s do this</button>
        </div>
      )}
      {stage === 'sneak' && <StealthGame moves={3} button="Sneak 🦹" guard="👮" place="bank" onDone={(ok) => (ok ? setStage('crack') : end('caught'))} />}
      {stage === 'crack' && (
        <TimingGame steps={['🔐 First number', '🔐 Second number', '🔐 Third number']} zone={0.15} speed={1.15} button="Click!"
          onDone={(score) => { setCracked(score); setStage('getaway'); }} />
      )}
      {stage === 'getaway' && (
        <div className="game-body">
          <p className="game-intro">
            {cracked === 0 ? '🚨 The alarm is blaring and the vault is still shut! Just get out!' : `The vault is open — you cracked ${cracked}/3 numbers. Sirens in the distance… pick your escape!`}
          </p>
          <div className="pick-list">
            {GETAWAYS.map((w) => (
              <button key={w.id} className="row" onClick={() => {
                const odds = Math.min(0.9, w.odds + cracked * 0.08 - (cracked === 0 ? 0.1 : 0));
                if (!chance(odds)) return end('caught');
                if (cracked === 0) return end('empty');
                end('escaped', cracked * rand(40, 160) * 1000);
              }}>
                <span className="emoji">{w.emoji}</span>
                <span className="main"><b>{w.name}</b><small>Potential loot: up to {money(cracked * 160000)}</small></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </GameShell>
  );
}

/* ───────── Prison escape ───────── */

export function EscapeGame({ act, onClose }: { act: Act; onClose: () => void }) {
  const [started, setStarted] = useState(false);
  return (
    <GameShell title="🪜 Jailbreak" onClose={started ? undefined : onClose}>
      {!started ? (
        <div className="game-body">
          <p className="game-intro">Five moves from your cell to the wall. The searchlight guard turns fast. Fail and you get two more years.</p>
          <button className="btn primary block big-btn" onClick={() => { act((g) => { startMiniGame(g, 'escape'); }); setStarted(true); }}>🏃 Make a run for it</button>
        </div>
      ) : (
        <StealthGame moves={5} button="Sneak 🏃" guard="🔦" place="prison" hard onDone={(ok) => { act((g) => escapeResult(g, ok)); onClose(); }} />
      )}
    </GameShell>
  );
}
