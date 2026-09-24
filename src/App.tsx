import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Game, Result } from './game/types';
import { getActiveLife, getSession, rpc, RpcError, setActiveLife, setSession, summarize, type AccessRequest, type LifeMeta, type Overview, type Session } from './cloud';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { ageUp, continueAsChild, liveAsChild, newLife, type NewLifeOptions } from './game/engine';
import { resolveEvent } from './game/events';
import { fullName, log, syncCoworkers } from './game/helpers';
import { evaluateDream } from './game/dreams';
import { royalTitle } from './game/origins';
import { Avatar } from './components/Avatar';
import { StatBars } from './components/Editors';
import { FameMeter } from './components/Social';
import { schoolName } from './game/actions';
import { makeGrave, markLocalImported, normalize, readLocalSaves } from './game/storage';
import { LivesSheet } from './components/Lives';
import { money } from './game/util';
import { blip } from './sound';
import { paperFor, paperName } from './game/news';
import { StartScreen } from './components/StartScreen';
import { DeathScreen } from './components/DeathScreen';
import { groupEntries } from './game/logCategory';
import { NameBabyModal } from './components/NameBaby';
import { ActivitiesSheet, AssetsSheet, OccupationSheet, RelationshipsSheet, type Act } from './components/Sheets';
import { Modal } from './components/ui';

type SheetKind = 'occupation' | 'assets' | 'relationships' | 'activities' | 'lives';

export function subtitle(g: Game) {
  if (g.job?.royal) return `👑 ${g.job.title}`;
  const title = royalTitle(g.origin, g.gender);
  const base = baseSubtitle(g);
  return title ? `👑 ${title} · ${base}` : base;
}

function baseSubtitle(g: Game) {
  if (g.prison > 0) return 'Prisoner';
  if (g.job) return g.job.title;
  if (g.business) return `Owner, ${g.business.name}`;
  if (g.education.stage !== 'none') return schoolName(g);
  if (g.retired) return 'Retired';
  if (g.age < 1) return 'Newborn';
  if (g.age < 5) return 'Toddler';
  if (g.age < 18) return 'Kid';
  return 'Unemployed';
}

export default function App() {
  const [session, setSess] = useState<Session | null>(getSession);
  // Every launch starts on the home screen (and its PIN lock, if one is set).
  const [unlocked, setUnlocked] = useState(false);
  const logout = useCallback(async () => {
    try { await rpc('logout'); } catch { /* already gone */ }
    setSession(null);
    setSess(null);
  }, []);

  if (!unlocked) {
    return (
      <>
        <Backdrop />
        <HomeScreen username={session?.username ?? null} onPlay={() => setUnlocked(true)} onForgot={() => { void logout(); setUnlocked(true); }} />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Backdrop />
        <AuthScreen onAuthed={(s) => { setSession(s); setSess(s); }} />
      </>
    );
  }
  return <Main key={session.username} session={session} onLogout={logout} onHome={() => setUnlocked(false)} />;
}

type LoadedLife = LifeMeta & { game: Game };

function Main({ session, onLogout, onHome }: { session: Session; onLogout: () => void; onHome: () => void }) {
  const username = session.username;
  const [game, setGame] = useState<Game | null>(null);
  const [lifeMeta, setLifeMeta] = useState<LifeMeta | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const gameRef = useRef(game);
  gameRef.current = game;
  const metaRef = useRef(lifeMeta);
  metaRef.current = lifeMeta;
  const versionRef = useRef(0);
  const dirty = useRef(false);
  const savingNow = useRef<Promise<void> | null>(null);
  const saveTimer = useRef(0);
  const toastTimer = useRef(0);
  const buryDone = useRef<Promise<unknown>>(Promise.resolve());

  const say = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const authFail = (e: unknown) => {
    if (e instanceof RpcError && e.status === 401) { onLogout(); return true; }
    return false;
  };

  const refresh = useCallback(async () => {
    try { setOverview(await rpc<Overview>('overview')); } catch (e) { if (!authFail(e) && e instanceof Error) say(e.message); }
  }, []);

  const show = (data: LoadedLife) => {
    const g = normalize(data.game);
    if (!g) throw new Error('This save looks broken.');
    versionRef.current = data.version;
    dirty.current = false;
    gameRef.current = g;
    setLifeMeta(data);
    setGame(g);
    setActiveLife(username, g.id);
  };

  const kick = useCallback((message: string) => {
    dirty.current = false;
    gameRef.current = null;
    setGame(null);
    setLifeMeta(null);
    setSheet(null);
    setResult(null);
    setActiveLife(username, null);
    say(`🔒 ${message}`);
    refresh();
  }, [refresh]);

  /* ───── Saving to the cloud ───── */

  const doSave = useCallback(async () => {
    const g = gameRef.current;
    if (!g || !dirty.current || !metaRef.current || !g.alive) return;
    dirty.current = false;
    const job = (async () => {
      try {
        const r = await rpc<{ version: number }>('saveLife', { id: g.id, version: versionRef.current, game: g, summary: summarize(g, subtitle(g)) });
        versionRef.current = r.version;
      } catch (e) {
        if (e instanceof RpcError && e.status === 409 && e.data) {
          show(e.data as LoadedLife);
          say(`🔄 ${e.message} Loaded the newest version.`);
        } else if (e instanceof RpcError && (e.status === 403 || e.status === 404)) {
          kick(e.message);
        } else if (!authFail(e)) {
          dirty.current = true;
          say('⚠️ Couldn’t save — retrying…');
          saveTimer.current = window.setTimeout(doSave, 4000);
        }
      }
    })();
    savingNow.current = job;
    await job;
    savingNow.current = null;
  }, [kick]);

  const scheduleSave = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(doSave, 700);
  };

  const flush = async () => {
    clearTimeout(saveTimer.current);
    await savingNow.current;
    if (dirty.current) await doSave();
  };

  // Last-chance save when the tab closes.
  useEffect(() => {
    const onHide = () => {
      const g = gameRef.current;
      if (!dirty.current || !g?.alive) return;
      const body = JSON.stringify({ action: 'saveLife', args: { __token: session.token, id: g.id, version: versionRef.current, game: g, summary: summarize(g, subtitle(g)) } });
      navigator.sendBeacon?.('/api/rpc', new Blob([body], { type: 'application/json' }));
      dirty.current = false;
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  /* ───── Boot: import this device's old saves, then open the last life ───── */

  useEffect(() => {
    (async () => {
      try {
        await rpc('me');
        const local = readLocalSaves();
        if (local.lives.length || local.graves.length) {
          const r = await rpc<{ imported: number }>('importLocal', {
            lives: local.lives.map((g) => ({ game: g, summary: summarize(g, subtitle(g)) })),
            graves: local.graves,
          });
          markLocalImported();
          if (r.imported) say(`☁️ Moved ${r.imported} ${r.imported === 1 ? 'life' : 'lives'} from this device into @${username}.`);
        }
        const ov = await rpc<Overview>('overview');
        setOverview(ov);
        const active = getActiveLife(username);
        const playable = [...ov.mine, ...ov.shared.filter((l) => l.status === 'view' || l.status === 'play')];
        if (active && playable.some((l) => l.id === active)) show(await rpc<LoadedLife>('getLife', { id: active }));
      } catch (e) {
        if (!authFail(e) && e instanceof Error) say(e.message);
      }
      setLoading(false);
    })();
  }, []);

  /* ───── Live sync: pick up a friend's moves ───── */

  useEffect(() => {
    if (!game?.alive) return;
    const id = game.id;
    const timer = setInterval(async () => {
      if (dirty.current || savingNow.current) return;
      try {
        const v = await rpc<{ version: number; updatedBy: string }>('lifeVersion', { id });
        if (v.version > versionRef.current && !dirty.current && gameRef.current?.id === id) {
          show(await rpc<LoadedLife>('getLife', { id }));
          if (v.updatedBy !== username) say(`🔄 @${v.updatedBy} just played this life.`);
        }
      } catch (e) {
        if (e instanceof RpcError && (e.status === 403 || e.status === 404)) kick(e.message);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [game?.id, game?.alive]);

  /* ───── "May @friend play your life?" ───── */

  useEffect(() => {
    const poll = async () => {
      try { setRequests((await rpc<{ requests: AccessRequest[] }>('requests')).requests); } catch { /* try again later */ }
    };
    poll();
    const timer = setInterval(poll, 8000);
    return () => clearInterval(timer);
  }, []);

  const answer = async (req: AccessRequest, allow: boolean, level: 'view' | 'play' = 'view') => {
    setRequests((rs) => rs.filter((r) => !(r.lifeId === req.lifeId && r.requester === req.requester)));
    try {
      await rpc('respond', { lifeId: req.lifeId, requester: req.requester, allow, level });
      say(allow ? `${level === 'play' ? '🎮' : '👀'} @${req.requester} can now ${level === 'play' ? 'play' : 'watch'} ${req.lifeName}.` : `🚫 Declined @${req.requester}.`);
    } catch (e) {
      if (e instanceof Error) say(e.message);
    }
  };

  /* ───── Playing ───── */

  const commit = (g: Game) => {
    gameRef.current = g;
    setGame(g);
    dirty.current = true;
    scheduleSave();
  };

  const act: Act = useCallback((fn) => {
    const prev = gameRef.current;
    if (!prev || !prev.alive) return;
    if (metaRef.current?.can === 'view') {
      say(`👀 You’re watching @${metaRef.current.owner}’s life. Ask them for permission to play.`);
      return;
    }
    const g = structuredClone(prev);
    const r = fn(g);
    if (g.alive) { evaluateDream(g, false); syncCoworkers(g); }
    if (r) {
      if (!r.silent) log(g, r.text);
      setResult(r);
    }
    gameRef.current = g;
    setGame(g);
    if (!g.alive) {
      setSheet(null);
      clearTimeout(saveTimer.current);
      dirty.current = false;
      buryDone.current = rpc('bury', { id: g.id, grave: makeGrave(g) }).then(refresh).catch((e) => say(e.message));
      return;
    }
    dirty.current = true;
    scheduleSave();
  }, [refresh]);

  const startLife = async (g: Game) => {
    await flush();
    await buryDone.current;
    try {
      const m = await rpc<LifeMeta>('createLife', { game: g, summary: summarize(g, subtitle(g)) });
      show({ ...m, game: g });
      setResult(null);
      setSheet(null);
      refresh();
    } catch (e) {
      if (!authFail(e) && e instanceof Error) say(e.message);
    }
  };

  const openLife = async (id: string) => {
    await flush();
    setResult(null);
    setSheet(null);
    try { show(await rpc<LoadedLife>('getLife', { id })); } catch (e) { if (!authFail(e) && e instanceof Error) say(e.message); refresh(); }
  };

  const toStart = async () => {
    await flush();
    await buryDone.current;
    setResult(null);
    setSheet(null);
    gameRef.current = null;
    setGame(null);
    setLifeMeta(null);
    setActiveLife(username, null);
    refresh();
  };

  const joinWithCode = async (code: string) => {
    const r = await rpc<{ status: string; owner: string; name: string }>('requestAccess', { code });
    refresh();
    return r.status === 'allowed' ? `You can already play ${r.name}! 🎉` : `Request sent! We asked @${r.owner} to let you play ${r.name}. 💌`;
  };

  const removeGrave = async (id: string) => {
    try { await rpc('removeGrave', { id }); } catch (e) { if (!authFail(e) && e instanceof Error) say(e.message); }
    refresh();
  };

  const removeLifeById = async (id: string) => {
    try { await rpc('removeLife', { id }); } catch (e) { if (e instanceof Error) say(e.message); }
    refresh();
  };

  const lastAge = game?.log.at(-1)?.age;
  const entryCount = game?.log.at(-1)?.entries.length;
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastAge, entryCount, game?.id]);

  const request = requests[0];
  const requestModal = request && !result && (
    <Modal>
      <div className="big">🔔</div>
      <h2>Permission request</h2>
      <p>
        <b>@{request.requester}</b> wants to join <b>{request.lifeName}</b>’s life.
        <br /><b>👀 Watch</b> lets them look without changing anything. <b>🎮 Play</b> lets them make choices too.
        <br />You can change or remove this anytime in Activities → 👥 Manage Users.
      </p>
      <div className="choices">
        <button className="btn primary" onClick={() => answer(request, true, 'view')}>👀 Let them watch</button>
        <button className="btn" onClick={() => answer(request, true, 'play')}>🎮 Let them play too</button>
        <button className="btn" onClick={() => answer(request, false)}>🚫 Decline</button>
      </div>
    </Modal>
  );
  const toastEl = toast && <div className="toast" role="status">{toast}</div>;

  if (loading) {
    return (
      <>
        <Backdrop />
        <div className="splash"><h1 className="logo">EverLife</h1><p>Loading your lives…</p></div>
      </>
    );
  }

  if (!game) {
    return (
      <>
        <Backdrop />
        <StartScreen
          username={username}
          overview={overview}
          onStart={(o: NewLifeOptions) => startLife(newLife(o))}
          onContinue={openLife}
          onJoinCode={joinWithCode}
          onRemoveGrave={removeGrave}
          onLogout={onLogout}
          onHome={onHome}
        />
        {requestModal}
        {toastEl}
      </>
    );
  }

  const pending = game.pending[0];
  const busy = !!pending || !!result || !game.alive;
  const closeSheet = () => setSheet(null);
  const guest = lifeMeta?.role === 'guest';
  const viewOnly = lifeMeta?.can === 'view';

  return (
    <>
      <Backdrop />
      <div className="app">
        <header className="header">
          <button type="button" className="brand logo" onClick={async () => { await flush(); onHome(); }} title="Home">EverLife</button>
          <div className="avatar bounce" key={`a${game.age}`}><Avatar look={game.look} age={game.age} alive={game.alive} mood={game.stats.happiness} /></div>
          <div className="who">
            <h1>{fullName(game)}</h1>
            <p>Age {game.age} · {subtitle(game)}</p>
            {guest && <span className={`guest-chip ${viewOnly ? 'view' : ''}`}>{viewOnly ? '👀 Watching' : '🤝 Playing'} @{lifeMeta?.owner}’s life</span>}
          </div>
          <div className="bank">
            <div className={`amt ${game.money < 0 ? 'neg' : ''}`}>{money(game.money)}</div>
            <small>Bank</small>
          </div>
          <FameMeter game={game} compact />
        </header>

        <div className="log glass" ref={logRef}>
          {game.log.map((y) => (
            <div className="log-year" key={y.age}>
              <h3>Age {y.age}</h3>
              <Paper game={game} age={y.age} />
              {y.entries.length ? groupEntries(y.entries).map((grp, i) => (
                <div className="event" key={i} style={{ '--cat': grp.cat.color } as CSSProperties}>
                  <span className="event-cat">{grp.cat.label}</span>
                  {grp.lines.map((t, j) => <p key={j}>{t}</p>)}
                </div>
              )) : <p className="empty">A quiet year.</p>}
            </div>
          ))}
        </div>

        <section className={`stats glass bars-${game.bars.style}`} aria-label="Stats">
          <StatBars stats={game.stats} prefs={game.bars} />
        </section>

        <nav className="nav glass">
          <NavBtn emoji="💼" label="Career" onClick={() => setSheet('occupation')} disabled={busy} />
          <NavBtn emoji="🏠" label="Assets" onClick={() => setSheet('assets')} disabled={busy} />
          <button className="age-btn" onClick={() => act(ageUp)} disabled={busy || viewOnly} aria-label="Age up one year" title={viewOnly ? 'View only' : 'Age up'}>
            <b>+</b><small>Age up</small>
          </button>
          <NavBtn emoji="💞" label="People" onClick={() => setSheet('relationships')} disabled={busy} />
          <NavBtn emoji="🌙" label="Activities" onClick={() => setSheet('activities')} disabled={busy} />
        </nav>
      </div>

      {sheet === 'occupation' && <OccupationSheet game={game} act={act} onClose={closeSheet} />}
      {sheet === 'assets' && <AssetsSheet game={game} act={act} onClose={closeSheet} />}
      {sheet === 'relationships' && (
        <RelationshipsSheet game={game} act={act} onClose={closeSheet}
          onLiveAs={lifeMeta?.role === 'guest' ? undefined : (id) => startLife(liveAsChild(game, id))} />
      )}
      {sheet === 'activities' && (
        <ActivitiesSheet game={game} act={act} onClose={closeSheet} onOpenLives={() => setSheet('lives')} lifeMeta={lifeMeta}
          onLeaveLife={async () => { await removeLifeById(game.id); toStart(); }} />
      )}
      {sheet === 'lives' && (
        <LivesSheet game={game} lifeMeta={lifeMeta} username={username} overview={overview}
          onSwitch={openLife} onNewLife={toStart} onJoinCode={joinWithCode}
          onRemove={removeLifeById} onRemoveGrave={removeGrave} onLogout={onLogout} onClose={closeSheet} />
      )}

      {result?.celebrate && <Confetti key={result.text} />}
      <ResultSound result={result} />
      {result ? (
        <Modal>
          <div className="big">{result.emoji}</div>
          <h2>{result.title}</h2>
          <p>{result.text}</p>
          <button className="btn primary block" autoFocus onClick={() => setResult(null)}>Continue</button>
        </Modal>
      ) : pending?.id === 'name-baby' ? (
        <NameBabyModal key={String(pending.ctx.childId)} game={game} pending={pending} act={act} />
      ) : pending ? (
        <Modal>
          <div className="big">{pending.emoji}</div>
          <h2>{pending.title}</h2>
          <p>{pending.text}</p>
          <div className="choices">
            {pending.choices.map((c, i) => (
              <button key={i} className={`btn ${i === 0 ? 'primary' : ''}`} onClick={() => act((g) => resolveEvent(g, i))}>{c}</button>
            ))}
          </div>
        </Modal>
      ) : !game.alive ? (
        <DeathScreen
          game={game}
          onEpitaph={(text) => { buryDone.current.then(() => rpc('setEpitaph', { id: game.id, epitaph: text })).catch(() => {}); }}
          onNewLife={toStart}
          onContinueAs={(id) => startLife(continueAsChild(game, id))}
        />
      ) : requestModal}
      {toastEl}
    </>
  );
}

function NavBtn({ emoji, label, onClick, disabled }: { emoji: string; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="nav-btn" onClick={onClick} disabled={disabled}>
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

const CONFETTI_COLORS = ['#ff6fa8', '#ffb38a', '#b79cff', '#7ef0c1', '#f4c95d', '#8fb8ff'];

/** The year's headlines, in a little newspaper. */
function Paper({ game, age }: { game: Game; age: number }) {
  const paper = paperFor(game, age);
  if (!paper) return null;
  return (
    <div className="news">
      <div className="news-head">
        <span className="news-name">{paperName(game)}</span>
        <span className="news-date">Age {age}</span>
      </div>
      {paper.lines.map((line, i) => <p key={i} className="news-line">{line}</p>)}
    </div>
  );
}

/** A little fanfare (or a thud) whenever a result card appears. */
function ResultSound({ result }: { result: Result | null }) {
  useEffect(() => {
    if (!result) return;
    blip(result.celebrate ? 'win' : /caught|lost|died|denied|rejected|failed|fired|turned me down/i.test(`${result.title} ${result.text}`) ? 'lose' : 'pop');
  }, [result]);
  return null;
}

function Confetti() {
  const pieces = useRef(Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 1.8 + Math.random() * 1.4,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rot: Math.random() * 360,
    shape: i % 3,
  })));
  return (
    <div className="confetti" aria-hidden>
      {pieces.current.map((p, i) => (
        <i key={i} className={`c${p.shape}`} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}

function Backdrop() {
  return (
    <>
      <div className="sky" />
      <div className="stars" />
      <div className="sun" />
    </>
  );
}
