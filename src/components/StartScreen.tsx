import { useState } from 'react';
import type { BarPrefs, Gender, Look, Preference } from '../game/types';
import type { NewLifeOptions } from '../game/engine';
import { DEFAULT_BARS, randomLook } from '../game/look';
import { careerOf } from '../game/dreams';
import type { Grave } from '../game/storage';
import type { Overview } from '../cloud';
import { Avatar } from './Avatar';
import { GraveDetail, GraveyardGrid, JoinCode } from './Lives';
import { pick } from '../game/util';
import { BarEditor, DreamPicker, LookEditor, randomStats } from './Editors';
import { ORIGINS, originOf, type OriginId } from '../game/origins';
import { money as fmtMoney } from '../game/util';
import { Row, Sheet } from './ui';

type GenderChoice = Gender | 'random';

export function StartScreen({ username, overview, onStart, onContinue, onJoinCode, onLogout }: {
  username: string;
  overview: Overview | null;
  onStart: (o: NewLifeOptions) => void;
  onContinue: (id: string) => void;
  onJoinCode: (code: string) => Promise<string>;
  onLogout: () => void;
}) {
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [gender, setGender] = useState<GenderChoice>('random');
  const [pref, setPref] = useState<Preference | 'default'>('default');
  const [look, setLook] = useState<Look>(() => randomLook(pick(['male', 'female'] as const)));
  const [bars, setBars] = useState<BarPrefs>(() => structuredClone(DEFAULT_BARS));
  const [stats, setStats] = useState(randomStats);
  const [dream, setDream] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'dream' | 'bars' | 'origin' | null>(null);
  const [origin, setOrigin] = useState<OriginId | 'random'>('random');
  const [confirming, setConfirming] = useState(false);
  const [grave, setGrave] = useState<Grave | null>(null);
  const graves = overview?.graves ?? [];
  const lives = [...(overview?.mine ?? []), ...(overview?.shared ?? [])];
  const dreamCareer = dream ? careerOf(dream) : null;

  const begin = (e?: React.FormEvent) => {
    e?.preventDefault();
    setConfirming(true);
  };
  const reallyBegin = () => {
    onStart({
      origin: origin === 'random' ? undefined : origin,
      firstName,
      lastName,
      gender: gender === 'random' ? undefined : gender,
      preference: pref === 'default' ? undefined : pref,
      look,
      bars,
      dream,
      stats,
    });
  };

  return (
    <div className="start">
      <div className="hero">
        <h1 className="logo">EverLife</h1>
        <p>Live a thousand lives beneath a midnight sunset.</p>
      </div>

      <div className="account-row" style={{ marginBottom: 16 }}>
        <span>Hi, <b>@{username}</b> 👋</span>
        <button type="button" className="btn small" onClick={() => { if (window.confirm('Log out of EverLife on this device?')) onLogout(); }}>Log out</button>
      </div>

      {lives.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p className="section-title">Continue a life</p>
          {lives.map((l) => (
            <Row key={l.id} emoji={<Avatar look={l.look as Look} age={l.age} />} title={l.name}
              sub={l.status === 'pending' ? `⏳ Waiting for @${l.owner} to approve` : `Age ${l.age} · ${l.subtitle}${l.role === 'guest' ? ` · 🤝 @${l.owner}` : ''}`}
              side="›" onClick={() => onContinue(l.id)} disabled={l.status === 'pending'} />
          ))}
        </div>
      )}

      <div className="glass join-card">
        <p className="section-title" style={{ marginTop: 0 }}>🔑 Join a friend’s life</p>
        <p className="note" style={{ marginBottom: 10 }}>Enter their 6-character life code. They’ll be asked to let <b>@{username}</b> play.</p>
        <JoinCode onJoin={onJoinCode} />
      </div>

      <p className="section-title" style={{ marginTop: 22 }}>…or start a brand-new life</p>
      <form className="glass" onSubmit={begin}>
        <p className="section-title">You</p>
        <div className="two">
          <div className="field">
            <label htmlFor="fn">First name</label>
            <input id="fn" value={firstName} onChange={(e) => setFirst(e.target.value)} placeholder="Random" maxLength={20} />
          </div>
          <div className="field">
            <label htmlFor="ln">Last name</label>
            <input id="ln" value={lastName} onChange={(e) => setLast(e.target.value)} placeholder="Random" maxLength={20} />
          </div>
        </div>

        <div className="field">
          <label>Gender</label>
          <div className="seg">
            {(['random', 'female', 'male'] as const).map((g) => (
              <button type="button" key={g} className={gender === g ? 'on' : ''} onClick={() => setGender(g)}>
                {g === 'random' ? '🎲 Random' : g === 'female' ? '♀ Female' : '♂ Male'}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Attracted to</label>
          <div className="seg">
            {(['default', 'men', 'women', 'everyone'] as const).map((p) => (
              <button type="button" key={p} className={pref === p ? 'on' : ''} onClick={() => setPref(p)}>
                {p === 'default' ? 'Auto' : p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="section-row">
          <p className="section-title">Appearance</p>
          <button type="button" className="btn small" onClick={() => setLook(randomLook(gender === 'random' ? pick(['male', 'female'] as const) : gender))}>🎲 Shuffle</button>
        </div>
        <LookEditor look={look} onChange={setLook} tabs={['hair', 'face', 'outfit', 'acc']} />

        <p className="section-title">Born into</p>
        <Row emoji={origin === 'random' ? '🎲' : originOf(origin).emoji} title={origin === 'random' ? 'Random family' : originOf(origin).name}
          sub="⚠️ Can’t be changed once you’re born" side="›" onClick={() => setSheet('origin')} />

        <p className="section-title">Extras</p>
        <div>
          <Row emoji={dreamCareer?.emoji ?? '🌠'} title="Dream career" sub={dreamCareer ? dreamCareer.title : 'Not sure yet'} side="›" onClick={() => setSheet('dream')} />
          <Row emoji="🎨" title="Stat bars" sub={`😊 ${stats.happiness}% · ❤️ ${stats.health}% · 🧠 ${stats.smarts}% · ✨ ${stats.looks}%`} side="›" onClick={() => setSheet('bars')} />
        </div>

        <button className="btn primary block" type="submit">🌅 Begin a new life</button>
        <button className="btn block" type="button" onClick={() => onStart({})}>🎲 Totally random life</button>
      </form>

      {graves.length > 0 && (
        <>
          <p className="section-title" style={{ marginTop: 28 }}>🪦 Graveyard</p>
          <GraveyardGrid graves={graves} onOpen={setGrave} />
        </>
      )}

      {grave && (
        <Sheet title="Graveyard" onClose={() => setGrave(null)}>
          <GraveDetail grave={grave} />
        </Sheet>
      )}
      {sheet === 'origin' && (
        <Sheet title="Born into…" onClose={() => setSheet(null)}>
          <div className="warn-box">⚠️ Choose carefully! Your family background is set <b>forever</b> the moment you’re born.</div>
          <button type="button" className={`origin-card ${origin === 'random' ? 'on' : ''}`} onClick={() => { setOrigin('random'); setSheet(null); }}>
            <span className="origin-emoji">🎲</span>
            <span className="origin-main"><b>Random</b><small>Let fate decide. Most people are born normal — a lucky few are royalty.</small></span>
          </button>
          {ORIGINS.map((o) => (
            <button type="button" key={o.id} className={`origin-card ${origin === o.id ? 'on' : ''}`} onClick={() => { setOrigin(o.id); setSheet(null); }}>
              <span className="origin-emoji">{o.emoji}</span>
              <span className="origin-main">
                <b>{o.name}</b>
                <small>{o.blurb}</small>
                <span className="origin-tags">
                  {o.trustFund > 0 && <span className="tag gold">💰 {fmtMoney(o.trustFund)} at 18</span>}
                  {o.connections > 0 && <span className="tag pink">🤝 Connections</span>}
                  {o.tuition === 0 && <span className="tag">No tuition help</span>}
                  {Object.entries(o.statShift).map(([k, v]) => <span key={k} className="tag">{v > 0 ? '+' : ''}{v} {k}</span>)}
                </span>
              </span>
            </button>
          ))}
        </Sheet>
      )}
      {confirming && (
        <div className="overlay center">
          <div className="modal">
            <div className="big">{origin === 'random' ? '🎲' : originOf(origin).emoji}</div>
            <h2>Ready to be born?</h2>
            <p>
              You’ll be born into <b>{origin === 'random' ? 'a random family' : originOf(origin).phrase}</b>.
              <br />This <b>can’t be changed</b> later.
            </p>
            <div className="choices">
              <button className="btn primary" onClick={reallyBegin}>🌅 Yes, begin my life</button>
              <button className="btn" onClick={() => setConfirming(false)}>Go back</button>
            </div>
          </div>
        </div>
      )}
      {sheet === 'dream' && (
        <Sheet title="Dream career" onClose={() => setSheet(null)}>
          <DreamPicker current={dream} onPick={(id) => { setDream(id); setSheet(null); }} />
        </Sheet>
      )}
      {sheet === 'bars' && (
        <Sheet title="Stat bars" onClose={() => setSheet(null)}>
          <BarEditor prefs={bars} onChange={setBars} stats={stats} onStats={setStats} />
          <button className="btn primary block" onClick={() => setSheet(null)}>Done</button>
        </Sheet>
      )}
    </div>
  );
}
