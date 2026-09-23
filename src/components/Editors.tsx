import { useState } from 'react';
import type { AccSlot, BarPrefs, Game, Look, StatKey } from '../game/types';
import {
  ACCESSORIES, ACC_SLOTS, BAR_PALETTES, BAR_STYLES, CLOTH_COLORS, EYE_COLORS, HAIR_COLORS, HAIR_GROUPS, HAIR_STYLES, SKIN_TONES, STAT_META, TOPS, paletteCss,
} from '../game/look';
import { CAREERS } from '../game/data';
import { DREAMS, careerOf, dreamOf, taskLabel, taskProgress } from '../game/dreams';
import { money } from '../game/util';
import { Avatar } from './Avatar';
import { Row } from './ui';

/* ───────── Appearance ───────── */

function Swatches({ options, value, onPick, label }: { options: { id: string; name?: string }[]; value: string; onPick: (id: string) => void; label: string }) {
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} title={o.name}
          className={`swatch ${value === o.id ? 'on' : ''}`} style={{ background: o.id }} onClick={() => onPick(o.id)} />
      ))}
    </div>
  );
}

export type LookTab = 'hair' | 'face' | 'outfit' | 'acc';

const TAB_NAMES: Record<LookTab, string> = { hair: 'Hair', face: 'Face', outfit: 'Outfit', acc: 'Accessories' };

function Thumb({ look, age, on, label, badge, onClick }: { look: Look; age: number; on: boolean; label: string; badge?: string; onClick: () => void }) {
  return (
    <button type="button" className={`hair-opt ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on}>
      <span className="thumb"><Avatar look={look} age={age} /></span>
      <small>{label}</small>
      {badge && <span className="price-badge">{badge}</span>}
    </button>
  );
}

/**
 * Appearance editor. In `shop` mode every item is listed with its price;
 * otherwise only free starter items and things already in the wardrobe show up.
 */
export function LookEditor({ look, onChange, age = 25, tabs = ['hair', 'face'], wardrobe = [], shop = false }: {
  look: Look; onChange: (l: Look) => void; age?: number; tabs?: LookTab[]; wardrobe?: string[]; shop?: boolean;
}) {
  const set = (patch: Partial<Look>) => onChange({ ...look, ...patch });
  const [tab, setTab] = useState<LookTab>(tabs[0]);
  const [group, setGroup] = useState(HAIR_STYLES.find((h) => h.id === look.hair)?.group ?? 'short');
  const [slot, setSlot] = useState<AccSlot>('hat');
  const shownAge = Math.max(age, 12);
  const owned = (id: string, starter?: boolean) => !!starter || wardrobe.includes(id);
  const available = (id: string, starter?: boolean) => shop || owned(id, starter);
  const badge = (id: string, price: number, starter?: boolean) => (shop && !owned(id, starter) ? money(price) : undefined);

  return (
    <div className="look-editor">
      <div className="look-preview"><Avatar look={look} age={shownAge} mood={80} /></div>
      {tabs.length > 1 && (
        <div className="seg small-seg look-tabs">
          {tabs.map((t) => <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{TAB_NAMES[t]}</button>)}
        </div>
      )}
      <div className="look-fields">
        {tab === 'hair' && (
          <>
            <div className="field">
              <div className="seg small-seg">
                {HAIR_GROUPS.map((g) => <button key={g.id} type="button" className={group === g.id ? 'on' : ''} onClick={() => setGroup(g.id)}>{g.name}</button>)}
              </div>
              <div className="hair-grid">
                {HAIR_STYLES.filter((h) => h.group === group).map((h) => (
                  <Thumb key={h.id} look={{ ...look, hair: h.id, acc: { ...look.acc, hat: undefined } }} age={shownAge} on={look.hair === h.id} label={h.name} onClick={() => set({ hair: h.id })} />
                ))}
              </div>
            </div>
            <div className="field"><label>Hair color</label><Swatches label="Hair color" options={HAIR_COLORS} value={look.hairColor} onPick={(hairColor) => set({ hairColor })} /></div>
          </>
        )}

        {tab === 'face' && (
          <>
            <div className="field"><label>Eyes</label><Swatches label="Eye color" options={EYE_COLORS} value={look.eyes} onPick={(eyes) => set({ eyes })} /></div>
            <div className="field"><label>Skin tone</label><Swatches label="Skin tone" options={SKIN_TONES.map((id) => ({ id }))} value={look.skin} onPick={(skin) => set({ skin })} /></div>
            <div className="field">
              <label>Lashes</label>
              <div className="seg small-seg">
                <button type="button" className={!look.lashes ? 'on' : ''} onClick={() => set({ lashes: false })}>None</button>
                <button type="button" className={look.lashes ? 'on' : ''} onClick={() => set({ lashes: true })}>✨ Fluttery</button>
              </div>
            </div>
          </>
        )}

        {tab === 'outfit' && (
          <>
            <div className="field">
              <label>{shop ? 'Clothes for sale' : 'Your clothes'}</label>
              <div className="hair-grid">
                {TOPS.filter((t) => available(t.id, t.starter)).map((t) => (
                  <Thumb key={t.id} look={{ ...look, top: t.id }} age={shownAge} on={(look.top ?? 'tee') === t.id} label={t.name} badge={badge(t.id, t.price, t.starter)} onClick={() => set({ top: t.id })} />
                ))}
              </div>
              {!shop && <p className="note">More styles at the 🛍️ Shopping Mall.</p>}
            </div>
            <div className="field"><label>Color</label><Swatches label="Clothes color" options={CLOTH_COLORS.map((id) => ({ id }))} value={look.topColor ?? '#6b3fc4'} onPick={(topColor) => set({ topColor })} /></div>
          </>
        )}

        {tab === 'acc' && (
          <div className="field">
            <div className="seg small-seg">
              {ACC_SLOTS.map((sl) => <button key={sl.id} type="button" className={slot === sl.id ? 'on' : ''} onClick={() => setSlot(sl.id)}>{sl.name}</button>)}
            </div>
            <div className="hair-grid">
              <Thumb look={{ ...look, acc: { ...look.acc, [slot]: undefined } }} age={shownAge} on={!look.acc?.[slot]} label="None" onClick={() => set({ acc: { ...look.acc, [slot]: undefined } })} />
              {ACCESSORIES.filter((a) => a.slot === slot && available(a.id, a.starter)).map((a) => (
                <Thumb key={a.id} look={{ ...look, acc: { ...look.acc, [slot]: a.id } }} age={shownAge} on={look.acc?.[slot] === a.id} label={a.name}
                  badge={badge(a.id, a.price, a.starter)} onClick={() => set({ acc: { ...look.acc, [slot]: a.id } })} />
              ))}
            </div>
            {!shop && <p className="note">Find hats, shades and sparkly things at the 🛍️ Shopping Mall.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Stat bars ───────── */

export function StatBars({ stats, prefs }: { stats: Record<StatKey, number>; prefs: BarPrefs }) {
  return (
    <>
      {STAT_META.map((s) => (
        <div className="meter" key={s.key}>
          <span className="top"><span>{s.emoji} {s.label}</span><b>{stats[s.key]}%</b></span>
          <div className={`bar ${stats[s.key] < 20 ? 'low' : ''}`}>
            <i style={{ width: `${Math.max(2, stats[s.key])}%`, background: stats[s.key] < 20 ? undefined : paletteCss(prefs.colors[s.key]) }} />
          </div>
        </div>
      ))}
    </>
  );
}

export function StatSliders({ stats, onChange }: { stats: Record<StatKey, number>; onChange: (s: Record<StatKey, number>) => void }) {
  return (
    <div className="sliders">
      {STAT_META.map((m) => (
        <label key={m.key} className="slider-row">
          <span>{m.emoji} {m.label}</span>
          <input type="range" min={1} max={100} value={stats[m.key]} onChange={(e) => onChange({ ...stats, [m.key]: Number(e.target.value) })} />
          <b>{stats[m.key]}%</b>
        </label>
      ))}
    </div>
  );
}

export function BarEditor({ prefs, onChange, stats, onStats }: {
  prefs: BarPrefs; onChange: (p: BarPrefs) => void; stats?: Record<StatKey, number>; onStats?: (s: Record<StatKey, number>) => void;
}) {
  const sample = stats ?? { happiness: 78, health: 64, smarts: 86, looks: 52 };
  return (
    <div>
      <div className={`stats glass bars-${prefs.style}`} style={{ margin: '0 0 16px' }}><StatBars stats={sample} prefs={prefs} /></div>
      {stats && onStats && (
        <div className="field" style={{ marginBottom: 16 }}>
          <div className="section-row" style={{ margin: 0 }}>
            <label>Starting percent</label>
            <button type="button" className="btn small" onClick={() => onStats(randomStats())}>🎲 Random</button>
          </div>
          <StatSliders stats={stats} onChange={onStats} />
        </div>
      )}
      <div className="field" style={{ marginBottom: 16 }}>
        <label>Bar style</label>
        <div className="seg">
          {BAR_STYLES.map((b) => (
            <button key={b.id} type="button" className={prefs.style === b.id ? 'on' : ''} onClick={() => onChange({ ...prefs, style: b.id })}>{b.name}</button>
          ))}
        </div>
      </div>
      {STAT_META.map((s) => (
        <div className="field" key={s.key} style={{ marginBottom: 14 }}>
          <label>{s.emoji} {s.label} color</label>
          <div className="swatches">
            {BAR_PALETTES.map((p) => (
              <button key={p.id} type="button" title={p.name} aria-label={`${s.label}: ${p.name}`}
                className={`swatch wide ${prefs.colors[s.key] === p.id ? 'on' : ''}`} style={{ background: p.css }}
                onClick={() => onChange({ ...prefs, colors: { ...prefs.colors, [s.key]: p.id } })} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const randomStats = () => ({
  happiness: 55 + Math.floor(Math.random() * 46),
  health: 60 + Math.floor(Math.random() * 41),
  smarts: 15 + Math.floor(Math.random() * 86),
  looks: 15 + Math.floor(Math.random() * 86),
});

/* ───────── Dream career ───────── */

export function DreamTasks({ careerId, game }: { careerId: string; game?: Game }) {
  const def = dreamOf(careerId);
  if (!def) return null;
  const status = game?.dream?.careerId === careerId ? game.dream.status : undefined;
  return (
    <ul className="tasks">
      {def.tasks.map((t, i) => {
        const st = status?.[i];
        const progress = game && st === 'pending' ? taskProgress(game, t) : null;
        return (
          <li key={i} className={st ?? ''}>
            <span className="tick">{st === 'done' ? '✅' : st === 'failed' ? '❌' : '⏳'}</span>
            <span>{taskLabel(t)}{progress && <small> · {progress}</small>}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function DreamCard({ game }: { game: Game }) {
  const d = game.dream;
  if (!d) return <div className="card"><h4>🤷 Not sure yet</h4><p className="sub">Pick a dream career to get a path of goals. Finish them all and the job is guaranteed.</p></div>;
  const c = careerOf(d.careerId);
  const status = d.complete ? '🌟 Guaranteed! Apply anytime you meet the basics.' : d.failed ? '💔 A step was missed — no longer guaranteed, but you can still try.' : '✨ On track';
  return (
    <div className="card">
      <h4>{c?.emoji} Dream: {c?.title}</h4>
      <p className="sub">{status}</p>
      <DreamTasks careerId={d.careerId} game={game} />
    </div>
  );
}

export function DreamPicker({ current, onPick, game }: { current: string | null; onPick: (id: string | null) => void; game?: Game }) {
  const tabOf = (id: string): 'regular' | 'talent' | 'extra' => (dreamOf(id)?.extraordinary ? 'extra' : CAREERS.find((c) => c.id === id)?.field ? 'talent' : 'regular');
  const [tab, setTab] = useState<'regular' | 'talent' | 'extra'>(current ? tabOf(current) : 'regular');
  const [preview, setPreview] = useState<string | null>(null);

  if (preview) {
    const c = careerOf(preview)!;
    const def = dreamOf(preview)!;
    return (
      <div>
        <div className="card">
          <h4>{c.emoji} {c.title}</h4>
          <p className="sub">{def.blurb}</p>
          <p className="sub">Starts at {money(c.salary)} / year · tops out as {c.levels[c.levels.length - 1]}</p>
        </div>
        <p className="section-title">Complete every step to guarantee the job</p>
        <DreamTasks careerId={preview} />
        {game && game.age > 0 && <p className="note" style={{ margin: '12px 0' }}>Steps whose deadlines already passed are judged on how you’re doing right now.</p>}
        <div className="choices" style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          <button type="button" className="btn primary" onClick={() => onPick(preview)}>🌠 Make this my dream</button>
          <button type="button" className="btn" onClick={() => setPreview(null)}>Back to the list</button>
        </div>
      </div>
    );
  }

  const list = DREAMS.filter((d) => tabOf(d.careerId) === tab);
  return (
    <div>
      <div className="seg" style={{ marginBottom: 14 }}>
        <button type="button" className={tab === 'regular' ? 'on' : ''} onClick={() => setTab('regular')}>💼 Careers</button>
        <button type="button" className={tab === 'talent' ? 'on' : ''} onClick={() => setTab('talent')}>🎵 Talent</button>
        <button type="button" className={tab === 'extra' ? 'on' : ''} onClick={() => setTab('extra')}>✨ Extra</button>
      </div>
      <Row emoji="🤷" title="Not sure yet" sub={current === null ? 'Current choice' : 'Keep your options open'} onClick={() => onPick(null)} />
      {list.map((d) => {
        const c = CAREERS.find((x) => x.id === d.careerId)!;
        return (
          <Row key={d.careerId} emoji={c.emoji} title={c.title} sub={current === d.careerId ? 'Current dream' : d.blurb}
            side={money(c.salary)} sideSub="start" onClick={() => setPreview(d.careerId)} />
        );
      })}
    </div>
  );
}
