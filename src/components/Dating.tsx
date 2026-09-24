import { useState } from 'react';
import type { Game } from '../game/types';
import {
  REALMS, ROYAL_TITLES, VIP_JOBS, askChance, askOut, datingBlock, loverCareers, loverJob, loverPrice, makeLover, makeLoverBlock, makeProfile, makeRoyalProfile,
  type LoverSpec, type LoverStatus, type Profile,
} from '../game/dating';
import { datingGender, randomFirst } from '../game/helpers';
import { LAST } from '../game/names';
import { pick } from '../game/util';
import { ACCESSORIES, TOPS, randomLook } from '../game/look';
import { LookEditor } from './Editors';
import { askCommonerDating, askCommonerDatingBlock, commonerDateBlock, isRoyal } from '../game/actions';
import { money } from '../game/util';
import { Avatar } from './Avatar';
import type { Act } from './Sheets';

const DECK = 8;
type Tab = 'regular' | 'vip' | 'royal' | 'make';
const fresh = (g: Game, tab: Tab) =>
  Array.from({ length: DECK }, () => (tab === 'royal' ? makeRoyalProfile(g) : makeProfile(g, tab === 'vip')));

export function DatingPhone({ game, act, onClose }: { game: Game; act: Act; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('regular');
  const [decks, setDecks] = useState(() => ({ regular: fresh(game, 'regular'), vip: fresh(game, 'vip'), royal: fresh(game, 'royal') }));
  const [idx, setIdx] = useState({ regular: 0, vip: 0, royal: 0 });
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [slide, setSlide] = useState<'' | 'left' | 'right'>('');

  const deckTab = tab === 'make' ? 'regular' : tab;
  const vip = deckTab !== 'regular';
  const deck = decks[deckTab];
  const i = idx[deckTab];
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
    setIdx((cur) => ({ ...cur, [deckTab]: (cur[deckTab] + dir + DECK) % DECK }));
  };
  const refresh = () => {
    setDecks((d) => ({ ...d, [deckTab]: fresh(game, deckTab) }));
    setIdx((cur) => ({ ...cur, [deckTab]: 0 }));
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
          <b className="logo">{tab === 'make' ? 'Make A Lover' : tab === 'royal' ? 'LunaCrown' : tab === 'vip' ? 'LunaLove VIP' : 'LunaLove'}</b>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="seg small-seg phone-tabs">
          <button type="button" className={tab === 'regular' ? 'on' : ''} onClick={() => setTab('regular')}>💘 Dating</button>
          <button type="button" className={tab === 'vip' ? 'on' : ''} onClick={() => setTab('vip')}>⭐ VIP</button>
          <button type="button" className={tab === 'royal' ? 'on' : ''} onClick={() => setTab('royal')}>👑 Royal</button>
          <button type="button" className={tab === 'make' ? 'on' : ''} onClick={() => setTab('make')}>🪄 Make</button>
        </div>

        {tab === 'make' ? <MakeLover game={game} act={act} onDone={onClose} /> : (<>

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
        </>)}
      </div>
    </div>
  );
}

/* ───────── Make A Lover ───────── */

const EVERYTHING = [...TOPS.map((t) => t.id), ...ACCESSORIES.map((a) => a.id)];

function MakeLover({ game, act, onDone }: { game: Game; act: Act; onDone: () => void }) {
  const [spec, setSpec] = useState<LoverSpec>(() => {
    const gender = datingGender(game);
    return { firstName: '', lastName: '', gender, age: Math.max(18, game.age), status: 'regular', job: loverCareers()[0].id, realm: REALMS[0], look: randomLook(gender) };
  });
  const [confirming, setConfirming] = useState(false);
  const set = (patch: Partial<LoverSpec>) => { setSpec((cur) => ({ ...cur, ...patch })); setConfirming(false); };
  const setStatus = (status: LoverStatus) =>
    set({ status, job: status === 'royal' ? ROYAL_TITLES[spec.gender][0] : status === 'vip' ? VIP_JOBS[0].job : loverCareers()[0].id });
  const setGender = (gender: LoverSpec['gender']) =>
    set({ gender, look: { ...randomLook(gender), skin: spec.look.skin, eyes: spec.look.eyes, hairColor: spec.look.hairColor }, job: spec.status === 'royal' ? ROYAL_TITLES[gender][0] : spec.job });

  const price = loverPrice(game);
  const block = makeLoverBlock(game) ?? (spec.status !== 'royal' ? commonerDateBlock(game) : null);
  const j = loverJob(spec);

  return (
    <div className="make-lover">
      <p className="phone-note" style={{ marginTop: 0 }}>Design your perfect partner. This one costs <b>{money(price)}</b>; each one after costs double.</p>

      <div className="name-pair">
        <label className="field"><span>First name</span>
          <input value={spec.firstName} maxLength={20} placeholder="Random" onChange={(e) => set({ firstName: e.target.value })} />
        </label>
        <label className="field"><span>Last name</span>
          <input value={spec.lastName} maxLength={24} placeholder={spec.status === 'royal' ? `of ${spec.realm}` : 'Random'} onChange={(e) => set({ lastName: e.target.value })} />
        </label>
      </div>
      <button type="button" className="btn small" style={{ justifySelf: 'start' }}
        onClick={() => set({ firstName: randomFirst(spec.gender), lastName: spec.status === 'royal' ? `of ${spec.realm}` : pick(LAST) })}>
        🎲 Random name
      </button>

      <div className="field"><span>Gender</span>
        <div className="seg small-seg">
          {(['female', 'male'] as const).map((gd) => (
            <button key={gd} type="button" className={spec.gender === gd ? 'on' : ''} onClick={() => setGender(gd)}>{gd === 'female' ? 'Woman' : 'Man'}</button>
          ))}
        </div>
      </div>

      <label className="field"><span>Age · {spec.age}</span>
        <input type="range" min={18} max={80} value={spec.age} onChange={(e) => set({ age: Number(e.target.value) })} />
      </label>

      <div className="field"><span>Status</span>
        <div className="seg small-seg">
          <button type="button" className={spec.status === 'regular' ? 'on' : ''} onClick={() => setStatus('regular')}>Regular</button>
          <button type="button" className={spec.status === 'vip' ? 'on' : ''} onClick={() => setStatus('vip')}>⭐ VIP</button>
          <button type="button" className={spec.status === 'royal' ? 'on' : ''} onClick={() => setStatus('royal')}>👑 Royal</button>
        </div>
      </div>

      <label className="field"><span>{spec.status === 'royal' ? 'Title' : 'Job'}</span>
        <select value={spec.job} onChange={(e) => set({ job: e.target.value })}>
          {spec.status === 'royal' && ROYAL_TITLES[spec.gender].map((t) => <option key={t} value={t}>{t}</option>)}
          {spec.status === 'vip' && VIP_JOBS.map((v) => <option key={v.job} value={v.job}>{v.emoji} {v.job}</option>)}
          {spec.status === 'regular' && (
            <>
              {loverCareers().map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>)}
              <option value="unemployed">🛋️ Unemployed</option>
            </>
          )}
        </select>
      </label>
      {spec.status === 'royal' && (
        <label className="field"><span>Realm</span>
          <select value={spec.realm} onChange={(e) => set({ realm: e.target.value })}>
            {REALMS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      )}
      <p className="phone-note" style={{ marginTop: 4 }}>{j.emoji} {j.job} · {j.salary ? `${money(j.salary)}/yr` : 'no income'}</p>

      <div className="field"><span>Looks</span></div>
      <LookEditor look={spec.look} onChange={(look) => set({ look })} age={spec.age} tabs={['hair', 'face', 'outfit', 'acc']} wardrobe={EVERYTHING} />

      <div className="warn-box" style={{ marginTop: 12 }}>⚠️ Once you accept, your lover <b>can’t be changed</b> — not their looks, job, status or age.</div>
      {!confirming ? (
        <button className="btn primary block" style={{ marginTop: 10 }} disabled={!!block} onClick={() => setConfirming(true)}>
          {block ?? `🪄 Make my lover · ${money(price)}`}
        </button>
      ) : (
        <div className="choices" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => { act((g) => makeLover(g, spec)); onDone(); }}>💞 Accept · {money(price)}</button>
          <button className="btn" onClick={() => setConfirming(false)}>Keep editing</button>
        </div>
      )}
    </div>
  );
}
