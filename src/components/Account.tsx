import { useEffect, useState } from 'react';
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

  const since = me?.createdAt ? new Date(me.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const rows: [string, string][] = [
    ['Username', me ? `@${me.username}` : '…'],
    ['Email', me ? me.email ?? 'Not set' : '…'],
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
        <dl className="kv">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </div>
      <div className="card">
        <h4>🌙 This life</h4>
        <dl className="kv">{lifeRows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </div>
      <button type="button" className="btn block" onClick={() => { if (window.confirm('Log out of LunaLife on this device?')) onLogout(); }}>🚪 Log out</button>
    </div>
  );
}
