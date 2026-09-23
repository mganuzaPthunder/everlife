import { useEffect, type ReactNode } from 'react';

export function Sheet({ title, onClose, onBack, children }: { title: string; onClose: () => void; onBack?: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay bottom" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          {onBack && <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>}
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="sheet-body">
          {children}
          <button type="button" className="btn block sheet-close-foot" onClick={onBack ?? onClose}>{onBack ? '← Back' : '✕ Close'}</button>
        </div>
      </div>
    </div>
  );
}

export function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="overlay center">
      <div className="modal" role="alertdialog">{children}</div>
    </div>
  );
}

export function Bar({ value, kind }: { value: number; kind: string }) {
  return (
    <div className={`bar ${kind} ${value < 20 && kind !== 'closeness' && kind !== 'skill' ? 'low' : ''}`}>
      <i style={{ width: `${kind === 'skill' ? value : Math.max(2, value)}%` }} />
    </div>
  );
}

export function Row({ emoji, title, sub, side, sideSub, onClick, disabled, dead }: {
  emoji: ReactNode; title: ReactNode; sub?: ReactNode; side?: ReactNode; sideSub?: ReactNode;
  onClick?: () => void; disabled?: boolean; dead?: boolean;
}) {
  const inner = (
    <>
      <span className={`emoji ${typeof emoji === 'string' ? '' : 'face'}`}>{emoji}</span>
      <span className="main"><b>{title}</b>{sub && <small>{sub}</small>}</span>
      {(side || sideSub) && <span className="side">{side}{sideSub && <small>{sideSub}</small>}</span>}
    </>
  );
  const cls = `row ${dead ? 'dead' : ''}`;
  return onClick ? <button type="button" className={cls} onClick={onClick} disabled={disabled}>{inner}</button> : <div className={cls}>{inner}</div>;
}
