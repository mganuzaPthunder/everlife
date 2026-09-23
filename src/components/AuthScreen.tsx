import { useState } from 'react';
import { rpc, RpcError, type Session } from '../cloud';

export function AuthScreen({ onAuthed }: { onAuthed: (s: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ session: Session; password: string; email: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const s = await rpc<Session>(mode, mode === 'signup' ? { username, email, password } : { username, password });
      if (mode === 'signup') setCreated({ session: { token: s.token, username: s.username }, password, email: email.trim().toLowerCase() });
      else onAuthed(s);
    } catch (err) {
      setError(err instanceof RpcError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="start auth">
        <div className="hero"><h1 className="logo">EverLife</h1></div>
        <div className="glass auth-card">
          <div className="big-emoji-center">📸</div>
          <h2>Screenshot this!</h2>
          <p className="note">Save your login so you never lose your lives. Use it to play on any phone, tablet or computer.</p>
          <div className="credentials" aria-label="Your login details">
            <div><small>Username</small><b>@{created.session.username}</b></div>
            <div><small>Email</small><b>{created.email}</b></div>
            <div><small>Password</small><b>{created.password}</b></div>
          </div>
          <p className="warn-box" style={{ margin: 0 }}>⚠️ Keep your password safe — you can log in with your username <b>or</b> your email.</p>
          <button className="btn primary block big-btn" onClick={() => onAuthed(created.session)}>✅ I saved it — let’s play!</button>
        </div>
      </div>
    );
  }

  return (
    <div className="start auth">
      <div className="hero">
        <h1 className="logo">EverLife</h1>
        <p>Live a thousand lives beneath a midnight sunset.</p>
      </div>
      <form className="glass auth-card" onSubmit={submit}>
        <div className="seg">
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => { setMode('signup'); setError(''); }}>✨ Create account</button>
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError(''); }}>🔑 Log in</button>
        </div>
        {mode === 'signup' ? (
          <>
            <div className="field">
              <label htmlFor="au">Username</label>
              <div className="at-input">
                <span>@</span>
                <input id="au" value={username} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="moonchild_23" required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="ae">Email</label>
              <input id="ae" type="email" value={email} autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={120}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
          </>
        ) : (
          <div className="field">
            <label htmlFor="au">Username or email</label>
            <input id="au" value={username} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={120}
              onChange={(e) => setUsername(e.target.value.trim())} placeholder="moonchild_23 or you@example.com" required />
          </div>
        )}
        <div className="field">
          <label htmlFor="ap">Password</label>
          <div className="pw-input">
            <input id="ap" type={showPw ? 'text' : 'password'} value={password} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />
            <button type="button" className="icon-btn" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? '🙈' : '👁️'}</button>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn primary block big-btn" type="submit" disabled={busy || username.length < 3 || password.length < 6 || (mode === 'signup' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))}>
          {busy ? '…' : mode === 'signup' ? '🌅 Create my account' : '🌙 Log in'}
        </button>
        <p className="note center-note">
          {mode === 'signup' ? 'Your account works on every device and lets friends join your lives. No email verification needed.' : 'Welcome back! Your lives are waiting.'}
        </p>
      </form>
    </div>
  );
}
