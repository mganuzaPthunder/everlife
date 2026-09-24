import { useState } from 'react';
import type { Game } from '../game/types';
import { degreeName } from '../game/data';
import { estateShares, fullName, isCore, living, netWorth } from '../game/helpers';
import { money } from '../game/util';
import { Modal } from './ui';

export function DeathScreen({ game, onNewLife, onContinueAs, onEpitaph }: {
  game: Game;
  onEpitaph: (text: string) => void;
  onNewLife: () => void;
  onContinueAs: (childId: string) => void;
}) {
  const kids = living(game, 'child');
  const shares = estateShares(game);
  const inherits = (id: string) => shares.find((h) => h.id === id)?.amount ?? 0;
  const degree = game.education.degrees.at(-1);
  const career = game.job?.title ?? (game.retired ? 'Retired' : 'None');
  const [epitaph, setText] = useState('');
  const leave = (then: () => void) => {
    if (epitaph.trim()) onEpitaph(epitaph.trim());
    then();
  };

  return (
    <Modal>
      <div className="tomb">
        <div className="big">🪦</div>
        <h2>Rest in peace, {game.firstName}</h2>
        <p>
          {fullName(game)} passed away from {game.causeOfDeath} at age {game.age}.
        </p>
        <div className="facts">
          <div><small>Net worth</small><b>{money(netWorth(game))}</b></div>
          <div><small>Career</small><b>{career}</b></div>
          <div><small>Education</small><b>{degree ? degreeName(degree) : 'None'}</b></div>
          <div><small>Children</small><b>{game.relationships.filter((p) => p.relation === 'child' && isCore(p)).length}</b></div>
        </div>
        <textarea className="epitaph-input" value={epitaph} maxLength={140} rows={2}
          placeholder="Leave a note on their tombstone (optional)" onChange={(e) => setText(e.target.value)} style={{ marginBottom: 14 }} />
        {shares.length > 0 && (
          <p className="sub" style={{ marginBottom: 10 }}>
            {game.will?.length ? '📜 The will leaves ' : '👪 Split between the children: '}
            {shares.map((h) => `${h.name} ${money(h.amount)}`).join(' · ')}
          </p>
        )}
        <div className="choices">
          {kids.map((k) => (
            <button key={k.id} className="btn primary" onClick={() => leave(() => onContinueAs(k.id))}>
              🌙 Continue as {k.firstName} ({k.age}) · inherits {money(inherits(k.id))}
            </button>
          ))}
          <button className={`btn ${kids.length ? '' : 'primary'}`} onClick={() => leave(onNewLife)}>🌅 Start a new life</button>
        </div>
      </div>
    </Modal>
  );
}
