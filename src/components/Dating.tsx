import { useState } from 'react';
import type { Game } from '../game/types';
import { askChance, askOut, datingBlock, makeProfile, type Profile } from '../game/dating';
import { money } from '../game/util';
import { Avatar } from './Avatar';
import type { Act } from './Sheets';

const DECK = 8;
const fresh = (g: Game, vip: boolean) => Array.from({ length: DECK }, () => makeProfile(g, vip));

export function DatingPhone({ game, act, onClose }: { game: Game; act: Act; onClose: () => void }) {
  const [tab, setTab] = useState<'regular' | 'vip'>('regular');
  const [decks, setDecks] = useState(() => ({ regular: fresh(game, false), vip: fresh(game, true) }));
  const [idx, setIdx] = useState({ regular: 0, vip: 0 });
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [slide, setSlide] = useState<'' | 'left' | 'right'>('');

  const vip = tab === 'vip';
  const deck = decks[tab];
  const i = idx[tab];
  const p: Profile = deck[i];
  const block = datingBlock(game, vip);
  const chance = Math.round(askChance(game, p) * 100);

  const go = (dir: -1 | 1) => {
    setSlide(dir < 0 ? 'left' : 'right');
    setTimeout(() => setSlide(''), 220);
    setIdx((cur) => ({ ...cur, [tab]: (cur[tab] + dir + DECK) % DECK }));
  };
  const refresh = () => {
    setDecks((d) => ({ ...d, [tab]: fresh(game, vip) }));
    setIdx((cur) => ({ ...cur, [tab]: 0 }));
  };
  const ask = () => {
    let matched = false;
    act((g) => {
      const res = askOut(g, p);
      matched = res.ok;
      return res.result;
    });
    if (matched) onClose();
    else setDeclined((s) => new Set(s).add(p.key));
  };

  return (
    <div className="overlay center game-overlay" onClick={onClose}>
      <div className={`phone ${vip ? 'vip' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Dating app">
        <div className="phone-notch" />
        <div className="phone-status"><span>9:41</span><span>📶 🔋</span></div>
        <div className="phone-head">
          <b className="logo">{vip ? 'EverLove VIP' : 'EverLove'}</b>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="seg small-seg phone-tabs">
          <button type="button" className={tab === 'regular' ? 'on' : ''} onClick={() => setTab('regular')}>💘 Dating</button>
          <button type="button" className={tab === 'vip' ? 'on' : ''} onClick={() => setTab('vip')}>👑 VIP Dating</button>
        </div>

        <div className={`profile ${slide}`} key={p.key}>
          <div className="profile-photo">
            <Avatar look={p.look} age={p.age} mood={75} />
            {p.vip && <span className="vip-badge">✔ Verified star</span>}
            <span className="match-pill">💞 {p.compatibility}% match</span>
          </div>
          <div className="profile-info">
            <h3>{p.firstName} <span>{p.age}</span></h3>
            <p className="job">{p.jobEmoji} {p.job}</p>
            <div className="facts-mini">
              <span>💰 {p.salary ? `${money(p.salary)}/yr` : 'No income'}</span>
              <span>🎓 {p.education}</span>
              <span>📏 {Math.floor(p.heightCm / 30.48)}′{Math.round((p.heightCm / 2.54) % 12)}″</span>
              <span>{p.zodiac}</span>
            </div>
            <p className="bio">“{p.bio}”</p>
            <div className="interest-chips">{p.interests.map((t) => <span key={t}>{t}</span>)}</div>
          </div>
        </div>

        <div className="phone-actions">
          <button className="round-btn" onClick={() => go(-1)} aria-label="Previous profile">‹</button>
          <button className="btn primary ask-btn" onClick={ask} disabled={!!block || declined.has(p.key)}>
            {block ?? (declined.has(p.key) ? '💔 Left on read' : `💌 Ask out · ${chance}%`)}
          </button>
          <button className="round-btn" onClick={() => go(1)} aria-label="Next profile">›</button>
        </div>
        <div className="phone-foot">
          <span>{i + 1} / {DECK}</span>
          <button className="linklike" onClick={refresh}>🔄 New profiles</button>
        </div>
        {vip && <p className="phone-note">No fees, no limits. Stars are picky — fame, money and looks help.</p>}
      </div>
    </div>
  );
}
