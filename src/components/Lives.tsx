import { useEffect, useState } from 'react';
import type { Game } from '../game/types';
import type { Grave } from '../game/storage';
import { rpc, RpcError, type LifeMeta, type ManageInfo, type Overview } from '../cloud';
import { fullName } from '../game/helpers';
import { money } from '../game/util';
import { Avatar } from './Avatar';
import { Sheet } from './ui';

export function lifeSubtitle(g: Game) {
  if (g.prison > 0) return 'Prisoner';
  if (g.job) return g.job.title;
  if (g.retired) return 'Retired';
  if (g.education.stage !== 'none') return 'Student';
  if (g.age < 5) return 'Little one';
  if (g.age < 18) return 'Kid';
  return 'Unemployed';
}

const ago = (t: number) => {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="code-chip" title="Copy life code"
      onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } }}>
      <span>{code}</span><small>{copied ? '✓ Copied' : '📋 Copy'}</small>
    </button>
  );
}

/* ───────── Enter a friend's code ───────── */

export function JoinCode({ onJoin }: { onJoin: (code: string) => Promise<string> }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { setMsg({ ok: true, text: await onJoin(code) }); setCode(''); }
    catch (err) { setMsg({ ok: false, text: err instanceof RpcError ? err.message : 'Something went wrong.' }); }
    setBusy(false);
  };
  return (
    <form className="join-code" onSubmit={submit}>
      <input value={code} maxLength={6} placeholder="ABC123" aria-label="Friend's 6-character life code" autoCapitalize="characters" spellCheck={false}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
      <button className="btn primary" type="submit" disabled={busy || code.length !== 6}>{busy ? '…' : 'Request'}</button>
      {msg && <p className={msg.ok ? 'form-ok' : 'form-error'}>{msg.text}</p>}
    </form>
  );
}

/* ───────── Tombstones ───────── */

export function GraveDetail({ grave }: { grave: Grave }) {
  const [epitaph, setText] = useState(grave.epitaph ?? '');
  const [saved, setSaved] = useState(false);
  const facts: [string, string][] = [
    ['Born', grave.born ?? '—'],
    ['Died', `Age ${grave.age}, ${grave.cause}`],
    ['Career', grave.career ?? 'None'],
    ['Education', grave.degree ?? 'None'],
    ['Dream', grave.dream ? `${grave.dream} ${grave.dreamFulfilled ? '✅' : '💔'}` : 'Not sure yet'],
    ['Family', `${grave.married ? 'Married · ' : ''}${grave.children ?? 0} ${grave.children === 1 ? 'child' : 'children'}`],
    ['Net worth', money(grave.netWorth)],
    ['Generation', `Gen ${grave.generation}`],
  ];

  return (
    <div>
      <div className="tombstone big">
        <span className="tomb-face"><Avatar look={grave.look} age={grave.age} fallback="🪦" /></span>
        <h3>{grave.name}</h3>
        <p>Age {grave.age} · {grave.cause}</p>
        {grave.epitaph && <p className="epitaph">“{grave.epitaph}”</p>}
      </div>

      <div className="facts-grid">
        {facts.map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}
      </div>

      <p className="section-title">Notes from their life</p>
      {grave.notes?.length ? (
        <ul className="timeline">
          {grave.notes.map((n, i) => <li key={i}><span className="when">Age {n.age}</span><span>{n.text}</span></li>)}
        </ul>
      ) : (
        <p className="note">A quiet, simple life.</p>
      )}

      <p className="section-title">Your note on their tombstone</p>
      <textarea className="epitaph-input" value={epitaph} maxLength={140} rows={2} placeholder="Here lies a legend who…"
        onChange={(e) => { setText(e.target.value); setSaved(false); }} />
      <button type="button" className="btn small" style={{ marginTop: 8 }}
        onClick={() => { rpc('setEpitaph', { id: grave.id, epitaph: epitaph.trim() }).then(() => setSaved(true)).catch(() => {}); }}>
        {saved ? '✓ Saved' : '🕯️ Save note'}
      </button>
    </div>
  );
}

export function GraveyardGrid({ graves, onOpen }: { graves: Grave[]; onOpen: (g: Grave) => void }) {
  if (!graves.length) return <p className="note">No one rests here yet. 🌙</p>;
  return (
    <div className="graveyard">
      {graves.map((g) => (
        <button key={g.id} type="button" className="tombstone" onClick={() => onOpen(g)}>
          <span className="tomb-face"><Avatar look={g.look} age={g.age} fallback="🪦" /></span>
          <b>{g.name}</b>
          <small>0 – {g.age}</small>
        </button>
      ))}
    </div>
  );
}

/* ───────── A life in a list ───────── */

function LifeRow({ l, current, onOpen, onRemove }: { l: LifeMeta; current?: boolean; onOpen?: () => void; onRemove?: () => void }) {
  const pending = l.status === 'pending';
  return (
    <div className={`row life-row ${current ? 'current-life' : ''}`}>
      <button type="button" className="life-open" onClick={onOpen} disabled={!onOpen}>
        <span className="emoji face"><Avatar look={l.look as Game['look']} age={l.age} /></span>
        <span className="main">
          <b>{l.name}</b>
          <small>Age {l.age} · {l.subtitle}{l.role === 'guest' ? ` · ${l.can === 'play' ? '🎮' : '👀'} @${l.owner}` : ''}</small>
          {pending && <small className="pending-note">⏳ Waiting for @{l.owner} to approve</small>}
          {l.code && <span className="row-code">Code <b>{l.code}</b></span>}
        </span>
      </button>
      {current ? <span className="tag pink">Playing</span> : onRemove && (
        <button type="button" className="icon-btn" aria-label={l.role === 'owner' ? `Abandon ${l.name}` : `Leave ${l.name}`} title={l.role === 'owner' ? 'Abandon this life' : 'Leave this life'} onClick={onRemove}>✕</button>
      )}
    </div>
  );
}

/* ───────── Lives sheet ───────── */

export function LivesSheet({ game, lifeMeta, username, overview, onSwitch, onNewLife, onJoinCode, onRemove, onLogout, onClose }: {
  game: Game;
  lifeMeta: LifeMeta | null;
  username: string;
  overview: Overview | null;
  onSwitch: (id: string) => void;
  onNewLife: () => void;
  onJoinCode: (code: string) => Promise<string>;
  onRemove: (id: string) => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  const [grave, setGrave] = useState<Grave | null>(null);
  const [adding, setAdding] = useState(false);
  const mine = (overview?.mine ?? []).filter((l) => l.id !== game.id);
  const shared = (overview?.shared ?? []).filter((l) => l.id !== game.id);
  const graves = overview?.graves ?? [];

  if (grave) {
    return (
      <Sheet title="Graveyard" onClose={onClose} onBack={() => setGrave(null)}>
        <GraveDetail grave={grave} />
      </Sheet>
    );
  }

  if (adding) {
    return (
      <Sheet title="Add a life" onClose={onClose} onBack={() => setAdding(false)}>
        <button type="button" className="origin-card" onClick={onNewLife}>
          <span className="origin-emoji">🌅</span>
          <span className="origin-main"><b>Start a new life</b><small>Be born again with a brand-new character. {game.firstName}’s life stays saved.</small></span>
        </button>
        <div className="origin-card static">
          <span className="origin-emoji">🔑</span>
          <span className="origin-main">
            <b>Join a friend’s life</b>
            <small>Enter the 6-character code from your friend’s life. They’ll get a note asking if <b>@{username}</b> can play — once they allow it, you can play that life too.</small>
            <JoinCode onJoin={onJoinCode} />
          </span>
        </div>
      </Sheet>
    );
  }

  const confirmRemove = (l: LifeMeta) => {
    const q = l.role === 'owner' ? `Abandon ${l.name}’s life forever? Friends playing it will lose it too.` : `Leave ${l.name}’s life? You’d need @${l.owner}’s permission to come back.`;
    if (window.confirm(q)) onRemove(l.id);
  };

  return (
    <Sheet title="My Lives" onClose={onClose}>
      <div className="account-row">
        <span>Signed in as <b>@{username}</b></span>
        <button type="button" className="btn small" onClick={() => { if (window.confirm('Log out of EverLife on this device?')) onLogout(); }}>Log out</button>
      </div>

      <p className="section-title">Living now</p>
      {lifeMeta && <LifeRow l={{ ...lifeMeta, name: fullName(game), age: game.age, subtitle: lifeSubtitle(game), look: game.look }} current />}

      <button type="button" className="btn primary block" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>➕ Add life</button>

      <p className="section-title">Your other lives</p>
      {mine.length === 0 && <p className="note">No other lives yet. Tap “Add life” to start one.</p>}
      {mine.map((l) => <LifeRow key={l.id} l={l} onOpen={() => onSwitch(l.id)} onRemove={() => confirmRemove(l)} />)}

      <p className="section-title">🤝 Friends’ lives</p>
      {shared.length === 0 && <p className="note">Got a friend’s life code? Tap “Add life” → Join a friend’s life.</p>}
      {shared.map((l) => <LifeRow key={l.id} l={l} onOpen={l.status === 'pending' ? undefined : () => onSwitch(l.id)} onRemove={() => confirmRemove(l)} />)}

      <p className="section-title">🪦 Graveyard</p>
      <GraveyardGrid graves={graves} onOpen={setGrave} />
    </Sheet>
  );
}

/* ───────── Manage users (owner) / shared-life info (guest) ───────── */

export function ManageUsers({ lifeMeta, lifeName, onLeave }: { lifeMeta: LifeMeta | null; lifeName: string; onLeave: () => void }) {
  const [info, setInfo] = useState<ManageInfo | null>(null);
  const [error, setError] = useState('');
  const owner = lifeMeta?.role === 'owner';

  const load = async () => {
    if (!lifeMeta || !owner) return;
    try { setInfo(await rpc<ManageInfo>('manage', { lifeId: lifeMeta.id })); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load.'); }
  };
  useEffect(() => { load(); }, [lifeMeta?.id]);

  if (!lifeMeta) return <p className="note">Loading…</p>;

  if (!owner) {
    return (
      <div>
        <div className="card">
          <h4>🤝 You’re a guest</h4>
          <p className="sub">
            This is <b>@{lifeMeta.owner}</b>’s life. You can {lifeMeta.can === 'play' ? <b>play and make choices</b> : <b>watch only</b>}.
            {lifeMeta.can === 'view' && ' Ask them to switch you to “Can play” if you want to join in.'}
          </p>
        </div>
        <button className="btn block danger" style={{ marginTop: 12 }} onClick={() => { if (window.confirm(`Leave ${lifeName}’s life?`)) onLeave(); }}>🚪 Leave this life</button>
      </div>
    );
  }

  const decide = async (username: string, action: 'view' | 'play' | 'deny' | 'remove', pending = false) => {
    try {
      if (action === 'remove') await rpc('revoke', { lifeId: lifeMeta.id, username });
      else if (action === 'deny') await rpc('respond', { lifeId: lifeMeta.id, requester: username, allow: false });
      else if (pending) await rpc('respond', { lifeId: lifeMeta.id, requester: username, allow: true, level: action });
      else await rpc('setAccess', { lifeId: lifeMeta.id, username, level: action });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
  };

  return (
    <div>
      <div className="card code-card">
        <h4>🔑 {lifeName}’s life code</h4>
        <p className="sub">Share this with a friend. When they enter it, you’ll be asked whether they can play.</p>
        {info ? <CopyCode code={info.code} /> : <p className="note">…</p>}
      </div>

      <p className="section-title">👥 People with access</p>
      {error && <p className="form-error">{error}</p>}
      {info && info.users.length === 0 && <p className="note">Only you can play this life right now.</p>}
      {info?.users.map((u) => (
        <div className="card user-card" key={u.username}>
          <div className="user-head">
            <span className="emoji">{u.status === 'pending' ? '⏳' : u.status === 'play' ? '🎮' : '👀'}</span>
            <span className="main">
              <b>@{u.username}</b>
              <small>{u.status === 'pending' ? 'Asked to join' : u.status === 'play' ? 'Can play and make choices' : 'Can watch only'}</small>
            </span>
          </div>
          {u.status === 'pending' ? (
            <div className="actions">
              <button className="btn small" onClick={() => decide(u.username, 'view', true)}>👀 Let them watch</button>
              <button className="btn small" onClick={() => decide(u.username, 'play', true)}>🎮 Let them play</button>
              <button className="btn small danger" onClick={() => decide(u.username, 'deny')}>Decline</button>
            </div>
          ) : (
            <>
              <div className="seg small-seg" role="group" aria-label={`What @${u.username} can do`}>
                <button type="button" className={u.status === 'view' ? 'on' : ''} onClick={() => decide(u.username, 'view')}>👀 View only</button>
                <button type="button" className={u.status === 'play' ? 'on' : ''} onClick={() => decide(u.username, 'play')}>🎮 Can play</button>
              </div>
              <div className="actions">
                <button className="btn small danger" onClick={() => { if (window.confirm(`Remove @${u.username}’s access to ${lifeName}?`)) decide(u.username, 'remove'); }}>🚫 Remove access</button>
              </div>
            </>
          )}
        </div>
      ))}

      <p className="section-title">🕒 Recent activity</p>
      {info && info.activity.length === 0 && <p className="note">Nothing yet.</p>}
      <ul className="activity">
        {info?.activity.map((a, i) => <li key={i}><span>{a.text}</span><small>{ago(a.at)}</small></li>)}
      </ul>
    </div>
  );
}
