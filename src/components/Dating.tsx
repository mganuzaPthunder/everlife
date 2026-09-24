import { useState } from 'react';
import type { Game } from '../game/types';
import { askChance, askOut, datingBlock, makeProfile, makeRoyalProfile, type Profile } from '../game/dating';
import { askCommonerDating, askCommonerDatingBlock, commonerDateBlock, isRoyal } from '../game/actions';
import { money } from '../game/util';
import { Avatar } from './Avatar';
import type { Act } from './Sheets';

const DECK = 8;
type Tab = 'regular' | 'vip' | 'royal';
const fresh = (g: Game, tab: Tab) =>
  Array.from({ length: DECK }, () => (tab === 'royal' ? makeRoyalProfile(g) : makeProfile(g, tab === 'vip')));

export function DatingPhone({ game, act, onClose }: { game: Game; act: Act; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('regular');
  const [decks, setDecks] = useState(() => ({ regular: fresh(game, 'regular'), vip: fresh(game, 'vip'), royal: fresh(game, 'royal') }));
  const [idx, setIdx] = useState({ regular: 0, vip: 0, royal: 0 });
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [slide, setSlide] = useState<'' | 'left' | 'right'>('');

  const vip = tab !== 'regular';
  const deck = decks[tab];
  const i = idx[tab];
  const p: Profile = deck[i];
  const royalPlayer = isRoyal(game);

  /* Who's allowed to see whom. A royal needs the palace's blessing to date a
     commoner; a commoner needs the royal's family to have given theirs. */
  const gateBlock = p.royal
    ? (royalPlayer ? null : p.blessing ? null : '🔒 Parents didn’t allow them to date normal people')
    : commonerDateBlock(game);
  const block = datingBlock(game, vip) ?? gateBlock;
  const chance = Math.round(askChance(game, p) * 100);

  const go = (dir: -1 | 1) => {
    setSlide(dir < 0 ? 'left' : 'right');
    setTimeout(() => setSlide(''), 220);
    setIdx((cur) => ({ ...cur, [tab]: (cur[tab] + dir + DECK) % DECK }));
  };
  const refresh = () => {
    setDecks((d) => ({ ...d, [tab]: fresh(game, tab) }));
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
      <div className={`phone ${tab === 'royal' ? 'royal' : vip ? 'vip' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Dating app">
        <div className="phone-notch" />
        <div className="phone-status"><span>9:41</span><span>📶 🔋</span></div>
        <div className="phone-head">
          <b className="logo">{tab === 'royal' ? 'EverCrown' : tab === 'vip' ? 'EverLove VIP' : 'EverLove'}</b>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="seg small-seg phone-tabs">
          <button type="button" className={tab === 'regular' ? 'on' : ''} onClick={() => setTab('regular')}>💘 Dating</button>
          <button type="button" className={tab === 'vip' ? 'on' : ''} onClick={() => setTab('vip')}>⭐ VIP</button>
          <button type="button" className={tab === 'royal' ? 'on' : ''} onClick={() => setTab('royal')}>👑 Royal</button>
        </div>

        <div className={`profile ${slide}`} key={p.key}>
          <div className="profile-photo">
            <Avatar look={p.look} age={p.age} mood={75} />
            {p.royal ? <span className="vip-badge royal">👑 {p.realm}</span> : p.vip && <span className="vip-badge">✔ Verified star</span>}
            {gateBlock && <span className="locked-pill">🔒 Locked</span>}
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
            {gateBlock && (
              <p className="gate-note">
                {p.royal
                  ? `The house ${p.lastName} only marries nobility — ${p.firstName}’s parents didn’t allow them to date normal people.`
                  : `You’re royalty. The palace hasn’t allowed you to court outside the family${askCommonerDatingBlock(game) ? '' : ' — you could ask them'}.`}
              </p>
            )}
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
        {royalPlayer && !p.royal && !askCommonerDatingBlock(game) && (
          <button className="btn small block" style={{ marginTop: 8 }} onClick={() => act(askCommonerDating)}>
            🗝️ Ask my parents if I can date outside the family
          </button>
        )}
        {tab === 'royal' && <p className="phone-note">Princes, princesses and the odd grand duchess. Most royal houses still insist on marrying nobility.</p>}
        {tab === 'vip' && <p className="phone-note">No fees, no limits. Stars are picky — fame, money and looks help.</p>}
      </div>
    </div>
  );
}
