import { useState } from 'react';
import type { Game } from '../game/types';
import {
  SOCIAL_APPS, accountOf, appOf, fameOf, fameTier, formatFollowers, joinApp, makePost, postsLeft, suggestHandle, totalFollowers, trainingHint,
} from '../game/social';
import { Avatar } from './Avatar';
import type { Act } from './Sheets';

export function FameMeter({ game, compact }: { game: Game; compact?: boolean }) {
  const fame = fameOf(game);
  const tier = fameTier(fame);
  const tiers = ['Not Known', 'Known', 'Well-Known', 'Popular', 'Famous'] as const;
  return (
    <div className={`fame-meter ${compact ? 'compact' : ''}`} title={`Fame ${fame}/100`}>
      {tiers.map((t) => <span key={t} className={t === tier ? 'on' : ''}>{t}</span>)}
    </div>
  );
}

/* ───────── The social apps, on a phone ───────── */

export function SocialPhone({ game, act, onClose }: { game: Game; act: Act; onClose: () => void }) {
  const [openApp, setOpenApp] = useState<string | null>(null);
  const [handle, setHandle] = useState('');
  const [composing, setComposing] = useState(false);

  const app = openApp ? appOf(openApp) : null;
  const acc = openApp ? accountOf(game, openApp) : undefined;

  return (
    <div className="overlay center game-overlay" onClick={onClose}>
      <div className="phone social-phone" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Social apps">
        <div className="phone-notch" />
        <div className="phone-status"><span>9:41</span><span>📶 🔋</span></div>

        {!app ? (
          <>
            <div className="phone-head">
              <b className="logo">Apps</b>
              <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="fame-box">
              <span className="muted">Total followers</span>
              <b>{formatFollowers(totalFollowers(game))}</b>
              <FameMeter game={game} />
            </div>
            <div className="app-grid">
              {SOCIAL_APPS.map((a) => {
                const account = accountOf(game, a.id);
                const locked = game.age < a.minAge;
                return (
                  <button key={a.id} className="app-icon" disabled={locked} onClick={() => { setHandle(suggestHandle(game, a)); setOpenApp(a.id); }}>
                    <span className="app-badge" style={{ background: a.color }}>{a.emoji}</span>
                    <b>{a.name}</b>
                    <small>{locked ? `Age ${a.minAge}+` : account ? `${formatFollowers(account.followers)} ${a.audience ?? 'followers'}` : 'Not joined'}</small>
                  </button>
                );
              })}
            </div>
            <p className="phone-note">Post every year to keep growing. Quiet accounts slowly lose followers. Lessons and clubs make your posts better — and singing without lessons won’t get many views.</p>
          </>
        ) : (
          <>
            <div className="phone-head">
              <button className="icon-btn" onClick={() => { setOpenApp(null); setComposing(false); }} aria-label="Back">←</button>
              <b className="logo" style={{ color: app.color }}>{app.emoji} {app.name}</b>
              <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
            </div>

            {!acc ? (
              <div className="join-app">
                <p className="note">{app.tagline}. Pick a handle:</p>
                <div className="at-input">
                  <span>@</span>
                  <input value={handle} maxLength={18} autoCapitalize="none" spellCheck={false}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} />
                </div>
                <button className="btn primary block big-btn" disabled={handle.length < 3} onClick={() => act((g) => joinApp(g, app.id, handle))}>
                  {app.emoji} Create my {app.name} account
                </button>
              </div>
            ) : composing ? (
              <div className="compose">
                <p className="game-step">What do you want to post?</p>
                <div className="post-kinds">
                  {app.posts.map((k) => {
                    const locked = game.age < (k.minAge ?? 0);
                    return (
                      <button key={k.id} className="post-kind" disabled={locked}
                        onClick={() => { act((g) => makePost(g, app.id, k.id)); setComposing(false); }}>
                        <span className="e">{k.emoji}</span>
                        <b>{k.name}</b>
                        <small>{locked ? `Age ${k.minAge}+` : k.risky ? '🌶️ Risky — big reach or backlash' : `Boosted by ${k.stat}`}</small>
                        {!locked && trainingHint(game, k) && <small>{trainingHint(game, k)}</small>}
                      </button>
                    );
                  })}
                </div>
                <button className="btn block" onClick={() => setComposing(false)}>Cancel</button>
              </div>
            ) : (
              <>
                <div className="profile-bar">
                  <span className="pfp"><Avatar look={game.look} age={game.age} mood={game.stats.happiness} /></span>
                  <div className="pstats">
                    <b>@{acc.handle} {acc.verified && <span className="verified" title="Verified">✔️</span>}</b>
                    <div className="counts">
                      <span><b>{formatFollowers(acc.followers)}</b> {app.audience ?? 'followers'}</span>
                      <span><b>{acc.posts}</b> posts</span>
                    </div>
                  </div>
                </div>
                <button className="btn primary block post-btn" disabled={postsLeft(game, app.id) <= 0} onClick={() => setComposing(true)}>
                  {postsLeft(game, app.id) > 0 ? `➕ New ${app.id === 'spotify' ? 'release' : 'post'} · ${postsLeft(game, app.id)} left this year` : `🌙 No ${app.id === 'spotify' ? 'releases' : 'posts'} left this year`}
                </button>
                <div className="feed">
                  {acc.feed.length === 0 && <p className="note center-note">Nothing posted yet. Tap ➕ to start!</p>}
                  {acc.feed.map((post, i) => (
                    <div className={`post ${post.viral ? 'viral' : ''}`} key={i}>
                      <div className="post-top"><span className="pfp small"><Avatar look={game.look} age={Math.max(1, post.age)} /></span><b>@{acc.handle}</b><small>age {post.age}</small></div>
                      <p>{post.text}</p>
                      <div className="post-meta">{app.id === 'spotify' ? '▶️' : '❤️'} {formatFollowers(post.likes)}{post.viral && <span className="tag gold">🚀 Viral</span>}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
