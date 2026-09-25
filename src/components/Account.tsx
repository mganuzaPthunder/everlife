import { useEffect, useState, type FormEvent } from 'react';
import type { Game } from '../game/types';
import { rpc, type LifeMeta, type Overview } from '../cloud';
import { fullName } from '../game/helpers';

interface Me { username: string; email?: string; createdAt?: number }

/** Who you're signed in as, and what's on the account. */
export function AccountInfo({ game, lifeMeta, overview, onLogout }: { game: Game; lifeMeta: LifeMeta | null; overview: Overview | null; onLogout: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    rpc<Me>('me').then(setMe).catch((e) => setError(e instanceof Error ? e.message : 'Couldn’t load your account.'));
  }, []);

  const [editing, setEditing] = useState<'email' | 'password' | null>(null);
  const [saved, setSaved] = useState<{ email?: string; password?: string } | null>(null);

  if (saved && me) {
    return (
      <div className="account">
        <div className="big-emoji-center">📸</div>
        <h2 style={{ textAlign: 'center', margin: 0 }}>Screenshot this!</h2>
        <p className="note">Your login changed. Save it so you never lose your lives — use it to play on any phone, tablet or computer.</p>
        <div className="credentials" aria-label="Your login details">
          <div><small>Username</small><b>@{me.username}</b></div>
          <div><small>Email</small><b>{me.email ?? '—'}</b></div>
          <div><small>Password</small><b>{saved.password ?? '(unchanged)'}</b></div>
        </div>
        <p className="warn-box" style={{ margin: 0 }}>⚠️ Keep your password safe — you can log in with your username <b>or</b> your email.</p>
        <button type="button" className="btn primary block big-btn" onClick={() => setSaved(null)}>✅ I saved it</button>
      </div>
    );
  }

  if (editing && me) {
    return (
      <ChangeLogin what={editing} me={me} onCancel={() => setEditing(null)}
        onDone={(change) => { if (change.email) setMe({ ...me, email: change.email }); setEditing(null); setSaved(change); }} />
    );
  }

  const since = me?.createdAt ? new Date(me.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const rows: [string, string][] = [
    ['Username', me ? `@${me.username}` : '…'],
    ['Email', me ? `${me.email ?? 'Not set'}  ✏️` : '…'],
    ['Member since', me ? since : '…'],
    ['Your lives', String(overview?.mine.length ?? '—')],
    ['Friends’ lives', String(overview?.shared.length ?? '—')],
    ['Graveyard', `${overview?.graves.length ?? '—'} ${overview?.graves.length === 1 ? 'grave' : 'graves'}`],
  ];
  const lifeRows: [string, string][] = [
    ['Playing as', fullName(game)],
    ['Generation', `Gen ${game.generation}`],
    ['Your role', lifeMeta?.role === 'guest' ? `Guest in @${lifeMeta.owner}’s life (${lifeMeta.can === 'play' ? 'can play' : 'view only'})` : 'Owner'],
    ...(lifeMeta?.code ? [['Life code', lifeMeta.code] as [string, string]] : []),
  ];

  return (
    <div className="account">
      {error && <p className="note">⚠️ {error}</p>}
      <div className="card">
        <h4>👤 Account</h4>
        <dl className="kv">{rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{k === 'Email' && me
              ? <button type="button" className="linklike kv-edit" onClick={() => setEditing('email')} title="Change email">{v}</button>
              : v}</dd>
          </div>
        ))}</dl>
        <button type="button" className="btn small" style={{ marginTop: 10 }} disabled={!me} onClick={() => setEditing('password')}>🔑 Change password</button>
      </div>
      <div className="card">
        <h4>🌙 This life</h4>
        <dl className="kv">{lifeRows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </div>
      <button type="button" className="btn block" onClick={() => { if (window.confirm('Log out of LunaLife on this device?')) onLogout(); }}>🚪 Log out</button>
    </div>
  );
}

/** Change your email or password. Both need your current password first. */
function ChangeLogin({ what, me, onCancel, onDone }: {
  what: 'email' | 'password'; me: Me; onCancel: () => void; onDone: (change: { email?: string; password?: string }) => void;
}) {
  const [password, setPassword] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (what === 'password' && next !== again) { setError('The new passwords don’t match.'); return; }
    setBusy(true);
    try {
      if (what === 'email') {
        const r = await rpc<{ email: string }>('changeEmail', { password, newEmail: next });
        onDone({ email: r.email });
      } else {
        await rpc('changePassword', { password, newPassword: next });
        onDone({ password: next });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
    setBusy(false);
  };

  const type = show ? 'text' : 'password';
  return (
    <form className="account" onSubmit={submit}>
      <div className="card">
        <h4>{what === 'email' ? '✉️ Change email' : '🔑 Change password'}</h4>
        <p className="sub">{what === 'email' ? `Your email is ${me.email ?? 'not set'}.` : 'Choose a new password with at least 6 characters.'} First, enter your current password.</p>
      </div>
      <label className="field"><span className="biz-label">Current password</span>
        <input type={type} value={password} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {what === 'email' ? (
        <label className="field"><span className="biz-label">New email</span>
          <input type="email" value={next} autoComplete="email" placeholder="you@example.com" onChange={(e) => setNext(e.target.value)} required />
        </label>
      ) : (
        <>
          <label className="field"><span className="biz-label">New password</span>
            <input type={type} value={next} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="new-password" minLength={6} onChange={(e) => setNext(e.target.value)} required />
          </label>
          <label className="field"><span className="biz-label">New password again</span>
            <input type={type} value={again} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="new-password" minLength={6} onChange={(e) => setAgain(e.target.value)} required />
          </label>
        </>
      )}
      <label className="show-pw"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn primary block" disabled={busy || !password || !next}>{busy ? 'Saving…' : what === 'email' ? 'Change my email' : 'Change my password'}</button>
      <button type="button" className="btn block" onClick={onCancel}>Cancel</button>
    </form>
  );
}
