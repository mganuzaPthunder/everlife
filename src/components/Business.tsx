import { useState } from 'react';
import type { Game } from '../game/types';
import {
  AD_CHANNELS, BUSINESS_TYPES, MAX_STAFF, MIN_INVESTMENT, adBlock, businessType, expectedRevenue, fire, foundBlock, foundBusiness, hire, hireBlock,
  investMore, makeCandidate, payroll, runAd, sellBusiness, staffFactor, upkeep, type Employee,
} from '../game/business';
import { money } from '../game/util';
import { Avatar } from './Avatar';
import { Bar, Row } from './ui';
import type { Act } from './Sheets';

/** The Make Own tab: found a business, or run the one you have. */
export function BusinessTab({ game, act }: { game: Game; act: Act }) {
  return game.business ? <Dashboard game={game} act={act} /> : <Founder game={game} act={act} />;
}

function Founder({ game, act }: { game: Game; act: Act }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(BUSINESS_TYPES[0].id);
  const [invest, setInvest] = useState(MIN_INVESTMENT);
  const block = foundBlock(game, invest);
  const t = businessType(type);
  const steps = [5, 10, 25, 50, 100].map((m) => m * 1_000_000);

  return (
    <div className="biz">
      <div className="card">
        <h4>🏗️ Start your own business</h4>
        <p className="sub">Pick a name and a type, and invest at least <b>{money(MIN_INVESTMENT)}</b> to open. The more you put in, the more it can earn — if people know about it.</p>
      </div>

      <div className="field"><span className="biz-label">Business name</span>
        <input value={name} maxLength={32} placeholder={`${game.firstName}’s ${t.name}`} onChange={(e) => setName(e.target.value)} />
      </div>

      <p className="section-title">Type of business</p>
      <div className="biz-types">
        {BUSINESS_TYPES.map((b) => (
          <button key={b.id} type="button" className={`biz-type ${type === b.id ? 'on' : ''}`} onClick={() => setType(b.id)}>
            <span className="e">{b.emoji}</span><b>{b.name}</b><small>Team of {b.team}</small>
          </button>
        ))}
      </div>

      <p className="section-title">Investment · {money(invest)}</p>
      <div className="biz-steps">
        {steps.map((v) => (
          <button key={v} type="button" className={`btn small ${invest === v ? 'primary' : ''}`} disabled={game.money < v} onClick={() => setInvest(v)}>{money(v)}</button>
        ))}
      </div>
      <p className="note">You have {money(game.money)}.</p>

      <button className="btn primary block big-btn" style={{ marginTop: 12 }} disabled={!!block}
        onClick={() => act((g) => foundBusiness(g, name, type, invest))}>
        {block ?? `${t.emoji} Open ${name.trim() || `${game.firstName}’s ${t.name}`} · ${money(invest)}`}
      </button>
    </div>
  );
}

function Dashboard({ game, act }: { game: Game; act: Act }) {
  const b = game.business!;
  const t = businessType(b.type);
  const [view, setView] = useState<'main' | 'hire'>('main');
  const [candidates, setCandidates] = useState<Employee[]>(() => Array.from({ length: 5 }, () => makeCandidate(game)));
  const [open, setOpen] = useState<string | null>(null);
  const [confirmSell, setConfirmSell] = useState(false);
  const staff = staffFactor(b);

  if (view === 'hire') {
    const block = hireBlock(game);
    return (
      <div className="biz">
        <button type="button" className="btn small" onClick={() => setView('main')}>← Back to {b.name}</button>
        <p className="section-title">Candidates</p>
        <p className="note" style={{ marginBottom: 8 }}>Tap someone to see their background. Skilled staff sell more, but cost more.</p>
        {candidates.map((e) => (
          <EmployeeCard key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)}
            action={<button className="btn small primary" disabled={!!block} onClick={() => { act((g) => hire(g, e)); setCandidates((cs) => cs.filter((c) => c.id !== e.id)); }}>{block ?? `Hire · ${money(e.salary)}/yr`}</button>} />
        ))}
        <button className="btn block" style={{ marginTop: 8 }} onClick={() => setCandidates(Array.from({ length: 5 }, () => makeCandidate(game)))}>🔄 New candidates</button>
      </div>
    );
  }

  return (
    <div className="biz">
      <div className="card biz-head">
        <h4>{t.emoji} {b.name}</h4>
        <p className="sub">{t.name} · opened at age {b.foundedAge} · worth {money(b.value)}</p>
        <div className="stat" style={{ marginTop: 10 }}>
          <span className="lbl">Popularity</span><Bar value={b.popularity} kind="skill" /><span className="num">{b.popularity}</span>
        </div>
        <div className="facts-mini" style={{ marginTop: 10 }}>
          <span>👥 {b.employees.length} staff</span>
          <span>📈 ~{money(expectedRevenue(b))}/yr sales</span>
          <span>💸 {money(payroll(b) + upkeep(b))}/yr costs</span>
          {b.lastProfit !== undefined && <span>{b.lastProfit >= 0 ? '✅' : '🔻'} Last year {money(b.lastProfit)}</span>}
        </div>
        <p className="sub" style={{ marginTop: 8 }}>
          {staff < 0.7 ? '⚠️ Short-staffed — hire people to serve more customers.' : staff >= 1.2 ? '🌟 Your team is excellent.' : '👍 Your team is holding up.'}
          {' '}{b.popularity < 25 ? 'Hardly anyone knows about you yet — advertise!' : ''}
        </p>
      </div>

      <p className="section-title">📣 Advertise</p>
      {AD_CHANNELS.map((c) => {
        const block = adBlock(game, c.id);
        return <Row key={c.id} emoji={c.emoji} title={c.name} sub={`+${c.boost} popularity`} side={block ?? money(c.price)} disabled={!!block} onClick={() => act((g) => runAd(g, c.id))} />;
      })}
      <p className="note" style={{ margin: '4px 0 12px' }}>📱 You can also post <b>🏢 Promote my business</b> on any of your Social Apps. The more followers you have, the bigger the boost.</p>

      <p className="section-title">👥 Employees · {b.employees.length}/{MAX_STAFF}</p>
      {b.employees.length === 0 && <p className="note">No one works here yet. A {t.name.toLowerCase()} runs best with about {t.team} good people.</p>}
      {b.employees.map((e) => (
        <EmployeeCard key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)}
          action={<button className="btn small danger" onClick={() => act((g) => fire(g, e.id))}>Let go</button>} />
      ))}
      <button className="btn primary block" style={{ marginTop: 8 }} disabled={!!hireBlock(game)} onClick={() => setView('hire')}>🤝 Hire employees</button>

      <p className="section-title">💼 Owner</p>
      <div className="biz-steps">
        {[1, 5, 25].map((m) => m * 1_000_000).map((v) => (
          <button key={v} type="button" className="btn small" disabled={game.money < v} onClick={() => act((g) => investMore(g, v))}>+{money(v)}</button>
        ))}
      </div>
      <p className="note">Investing more grows how much it can earn.</p>
      {!confirmSell ? (
        <button className="btn block" style={{ marginTop: 10 }} onClick={() => setConfirmSell(true)}>🤝 Sell {b.name}</button>
      ) : (
        <div className="card" style={{ marginTop: 10 }}>
          <p className="sub" style={{ marginBottom: 10 }}>Sell {b.name} for {money(b.value)}? Your staff go with it.</p>
          <div className="actions">
            <button className="btn small primary" onClick={() => { setConfirmSell(false); act(sellBusiness); }}>Sell for {money(b.value)}</button>
            <button className="btn small" onClick={() => setConfirmSell(false)}>Keep it</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeCard({ e, open, onToggle, action }: { e: Employee; open: boolean; onToggle: () => void; action: React.ReactNode }) {
  return (
    <div className={`card emp ${open ? 'open' : ''}`}>
      <button type="button" className="emp-top" onClick={onToggle} aria-expanded={open}>
        <span className="avatar sm"><Avatar look={e.look} age={e.age} /></span>
        <span className="main"><b>{e.firstName} {e.lastName}</b><small>{e.role} · age {e.age} · skill {e.skill}</small></span>
        <span className="side muted">{open ? '▾' : '›'}</span>
      </button>
      {open && (
        <div className="emp-bio">
          <div className="facts-mini">
            <span>🎓 {e.education}</span>
            <span>💼 {e.previousJob === 'First job' ? 'First job' : `Was a ${e.previousJob}`}</span>
            <span>⏳ {e.experience} yr{e.experience === 1 ? '' : 's'} experience</span>
            <span>💰 {money(e.salary)}/yr</span>
          </div>
          <div className="stat" style={{ marginTop: 8 }}><span className="lbl">Skill</span><Bar value={e.skill} kind="skill" /><span className="num">{e.skill}</span></div>
          <p className="sub" style={{ marginTop: 6 }}>“{e.bio}”</p>
        </div>
      )}
      <div className="actions" style={{ marginTop: 8 }}>{action}</div>
    </div>
  );
}
