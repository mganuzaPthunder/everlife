import { useEffect, useState } from 'react';
import { checkPin, clearPin, hasPin, savePin } from '../pin';

type Mode = 'home' | 'unlock' | 'old' | 'new' | 'confirm';

/** The front door: title, Play, and the optional 4-digit PIN that guards your lives on this device. */
export function HomeScreen({ username, onPlay, onForgot }: { username: string | null; onPlay: () => void; onForgot: () => void }) {
  const [mode, setMode] = useState<Mode>('home');
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [msg, setMsg] = useState('');
  const [shake, setShake] = useState(false);
  const locked = !!username && hasPin(username);

  const wrong = (text: string) => {
    setMsg(text);
    setShake(true);
    setTimeout(() => { setShake(false); setPin(''); }, 380);
  };

  // Four digits in: decide what they mean for this step.
  useEffect(() => {
    if (pin.length !== 4 || !username) return;
    const entered = pin;
    (async () => {
      if (mode === 'unlock') {
        if (await checkPin(username, entered)) onPlay(); else wrong('Wrong PIN. Try again.');
      } else if (mode === 'old') {
        if (await checkPin(username, entered)) { setPin(''); setMsg(''); setMode('new'); } else wrong('That’s not your current PIN.');
      } else if (mode === 'new') {
        setFirst(entered); setPin(''); setMsg(''); setMode('confirm');
      } else if (mode === 'confirm') {
        if (entered !== first) { setMode('new'); wrong('Those didn’t match. Start again.'); return; }
        await savePin(username, entered);
        setPin(''); setFirst(''); setMode('home'); setMsg(locked ? '🔒 PIN changed.' : '🔒 PIN set. You’ll need it to play.');
      }
    })();
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  const press = (d: string) => { setMsg(''); setPin((p) => (p.length < 4 ? p + d : p)); };
  const back = () => setPin((p) => p.slice(0, -1));

  // Typing digits on a keyboard works too.
  useEffect(() => {
    if (mode === 'home') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Escape') { setMode('home'); setPin(''); setMsg(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  const play = () => { if (locked) { setPin(''); setMsg(''); setMode('unlock'); } else onPlay(); };
  const password = () => { setPin(''); setMsg(''); setMode(locked ? 'old' : 'new'); };

  const title = { unlock: 'Enter your PIN', old: 'Enter your current PIN', new: locked ? 'Choose a new 4-digit PIN' : 'Choose a 4-digit PIN', confirm: 'Enter it once more', home: '' }[mode];

  return (
    <div className="home-screen">
      <div className="hero">
        <h1 className="logo">EverLife</h1>
        <p className="tagline">Live a thousand lives beneath a midnight sunset.</p>
      </div>

      {mode === 'home' ? (
        <div className="home-actions">
          <button type="button" className="btn primary big-btn home-play" onClick={play}>{locked ? '🔒 Play' : '▶ Play'}</button>
          {username ? (
            <button type="button" className="linklike home-pin-link" onClick={password}>{locked ? '🔑 Change password?' : '🔑 Add password?'}</button>
          ) : (
            <p className="home-note">Log in first, then you can add a PIN.</p>
          )}
          {msg && <p className="home-note ok">{msg}</p>}
        </div>
      ) : (
        <div className={`pin-pad ${shake ? 'shake' : ''}`}>
          <p className="pin-title">{title}</p>
          <div className="pin-dots" aria-label={`${pin.length} of 4 digits`}>
            {[0, 1, 2, 3].map((i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}
          </div>
          <p className="pin-msg" role="status">{msg || ' '}</p>
          <div className="pin-keys">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => <button key={d} type="button" onClick={() => press(d)}>{d}</button>)}
            <button type="button" className="pin-soft" onClick={() => { setMode('home'); setPin(''); setMsg(''); }}>Cancel</button>
            <button type="button" onClick={() => press('0')}>0</button>
            <button type="button" className="pin-soft" onClick={back} aria-label="Delete">⌫</button>
          </div>
          {(mode === 'unlock' || mode === 'old') && username && (
            <button type="button" className="linklike pin-extra" onClick={() => {
              if (window.confirm('Forgot your PIN? You’ll be logged out, and can log back in with your account password to clear it.')) { clearPin(username); onForgot(); }
            }}>Forgot PIN?</button>
          )}
        </div>
      )}
    </div>
  );
}
