import { useState } from 'react';
import type { Game, PendingEvent } from '../game/types';
import { nameBaby } from '../game/actions';
import { randomFirst } from '../game/helpers';
import { Modal } from './ui';
import type { Act } from './Sheets';

/** The new-baby pop-up: type a name, roll a random one, or keep the one they came with. */
export function NameBabyModal({ game, pending, act }: { game: Game; pending: PendingEvent; act: Act }) {
  const kid = game.relationships.find((p) => p.id === pending.ctx.childId);
  const [name, setName] = useState(kid?.firstName ?? '');
  if (!kid) return null;
  return (
    <Modal>
      <div className="big">{pending.emoji}</div>
      <h2>{pending.title}</h2>
      <p>{pending.text}</p>
      <form className="name-baby" onSubmit={(e) => { e.preventDefault(); act((g) => nameBaby(g, kid.id, name)); }}>
        <div className="field">
          <input value={name} maxLength={20} autoFocus placeholder="Baby’s first name" onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="name-baby-row">
          <span className="muted">{name.trim() || '…'} {kid.lastName}</span>
          <button type="button" className="btn small" onClick={() => setName(randomFirst(kid.gender))}>🎲 Random name</button>
        </div>
        <button type="submit" className="btn primary block" disabled={!name.trim()}>👶 Name them</button>
      </form>
    </Modal>
  );
}
