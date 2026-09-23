import { useState } from 'react';
import type { Asset, Game } from '../game/types';
import {
  DISTRICTS, decorCost, decorOf, districtOf, priceIn, redecorate, slotsFor, tierOf, type District,
} from '../game/property';
import { money } from '../game/util';
import { Sheet } from './ui';

/* ───────── The map you pick a home on ───────── */

export function CityMap({ picked, onPick, basePrice }: { picked?: string; onPick: (id: string) => void; basePrice: number }) {
  return (
    <div className="map-wrap">
      <svg viewBox="0 0 300 200" className="city-map" role="img" aria-label="Map of the city">
        <rect x="0" y="0" width="300" height="200" rx="16" fill="#151242" />
        {/* water */}
        <path d="M300 96 C266 104 250 126 252 200 L300 200 Z" fill="#2b4a86" opacity="0.85" />
        <path d="M120 200 C140 160 176 150 210 150 L300 140 L300 110 C240 120 180 130 150 168 L136 200 Z" fill="#2b4a86" opacity="0.5" />
        {/* hills */}
        <path d="M188 60 L226 18 L268 60 Z" fill="#3c3470" />
        <path d="M216 60 L250 28 L284 60 Z" fill="#473e83" />
        {/* fields */}
        <path d="M6 12 h72 v58 H6 z" fill="#2f4a33" opacity="0.8" />
        {[20, 34, 48, 62].map((x) => <path key={x} d={`M${x} 14 v54`} stroke="#3f6a45" strokeWidth="3" />)}
        {/* roads */}
        <path d="M0 96 H300 M150 0 V200 M60 96 L60 200 M230 60 L230 150" stroke="#2a2560" strokeWidth="7" />
        <path d="M0 96 H300 M150 0 V200" stroke="#3b3480" strokeWidth="1.5" strokeDasharray="7 9" />
        {/* city blocks */}
        {[[104, 60], [122, 52], [140, 64], [160, 50], [178, 62]].map(([x, y], i) => (
          <rect key={x} x={x} y={y} width="12" height={36 - (i % 3) * 8} rx="2" fill="#4a4290" />
        ))}
        {[[24, 120], [42, 126], [74, 122], [92, 130]].map(([x, y]) => (
          <g key={x}><rect x={x} y={y} width="16" height="12" rx="2" fill="#5a4fa8" /><path d={`M${x - 2} ${y} l10 -7 l10 7 z`} fill="#7a6cc8" /></g>
        ))}
        {/* beach */}
        <path d="M236 150 C252 142 274 140 300 140 L300 168 C272 166 250 172 238 182 Z" fill="#e0c88a" opacity="0.7" />

        {DISTRICTS.map((d) => {
          const on = picked === d.id;
          return (
            <g key={d.id} className={`map-pin ${on ? 'on' : ''}`} onClick={() => onPick(d.id)} style={{ cursor: 'pointer' }}>
              <circle cx={d.x} cy={d.y} r={on ? 15 : 12} fill={on ? '#ff6fa8' : '#1c1850'} stroke={on ? '#ffe7b0' : '#8a7fc4'} strokeWidth="2" />
              <text x={d.x} y={d.y + 5} fontSize="12" textAnchor="middle">{d.emoji}</text>
              <text x={d.x} y={d.y + 27} fontSize="9" textAnchor="middle" fill={on ? '#ffe7b0' : '#c9c3e6'} fontWeight="700">{d.name}</text>
              <text x={d.x} y={d.y + 37} fontSize="8" textAnchor="middle" fill="#9a93c4">{money(priceIn(basePrice, d.id))}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ───────── The house itself, drawn from your choices ───────── */

export function HouseScene({ asset }: { asset: Asset }) {
  const tier = tierOf(asset.shopId);
  const wall = decorOf(asset, 'wall').color ?? '#f2e6d4';
  const floor = decorOf(asset, 'floor').color ?? '#8b8798';
  const bedId = decorOf(asset, 'bed').id;
  const bed = decorOf(asset, 'bed').color ?? '#8fb8ff';
  const kitchenId = decorOf(asset, 'kitchen').id;
  const kitchen = decorOf(asset, 'kitchen').color ?? '#9b95b0';
  const gardenId = tier >= 1 ? decorOf(asset, 'garden').id : 'none';
  // The lawn is always grass — what you pick shows up as what's planted on it.
  const lawn = gardenId === 'zen' ? '#9c9478' : '#5c9c55';
  const extraId = tier >= 2 ? decorOf(asset, 'extra').id : 'none';
  const petId = decorOf(asset, 'pet').id;

  return (
    <svg viewBox="0 0 300 190" className="house-scene" role="img" aria-label="Your home">
      <rect x="0" y="0" width="300" height="190" rx="16" fill="#14113a" />
      {/* sky and garden */}
      <rect x="0" y="0" width="300" height="118" fill="#2a2566" />
      <circle cx="262" cy="26" r="12" fill="#ffd37a" opacity="0.7" />
      <rect x="0" y="118" width="300" height="72" fill={tier >= 1 ? lawn : '#332c63'} />

      {/* the house shell */}
      <rect x="40" y="44" width="180" height="88" rx="4" fill={wall} />
      <path d="M32 46 L130 8 L228 46 Z" fill="#8a4a5c" />
      <rect x="40" y="120" width="180" height="12" fill={floor} />

      {/* wall art / mural */}
      {decorOf(asset, 'wall').id === 'mural' && (
        <g><circle cx="86" cy="70" r="12" fill="#ffd37a" /><path d="M60 88 q26 -22 52 0 z" fill="#ff8fc4" opacity="0.8" /></g>
      )}

      {/* bed */}
      <g transform="translate(56 92)">
        {bedId === 'bunk' ? (
          <>
            <rect x="0" y="-26" width="52" height="8" rx="3" fill={bed} />
            <rect x="0" y="-38" width="14" height="8" rx="3" fill="#f5f0ff" />
            <rect x="0" y="0" width="52" height="8" rx="3" fill={bed} />
            <rect x="0" y="-12" width="14" height="8" rx="3" fill="#f5f0ff" />
            <path d="M2 -26 v34 M50 -26 v34" stroke="#6b6699" strokeWidth="2" />
          </>
        ) : (
          <>
            {bedId === 'canopy' && (
              <g><path d="M-2 -44 h60 v6 h-60 z" fill="#6b3fc4" /><path d="M0 -44 v50 M56 -44 v50" stroke="#6b3fc4" strokeWidth="3" />
                <path d="M0 -38 q10 14 0 28 M56 -38 q-10 14 0 28" fill="none" stroke="#ff8fc4" strokeWidth="3" opacity="0.8" /></g>
            )}
            <rect x="0" y="0" width={bedId === 'king' ? 62 : bedId === 'double' ? 54 : 42} height="10" rx="3" fill={bed} />
            <rect x="0" y="-8" width="16" height="10" rx="4" fill="#f5f0ff" />
            <rect x="0" y="10" width="6" height="8" fill="#6b4a2f" />
            <rect x={(bedId === 'king' ? 62 : bedId === 'double' ? 54 : 42) - 6} y="10" width="6" height="8" fill="#6b4a2f" />
          </>
        )}
      </g>

      {/* kitchen */}
      <g transform="translate(140 96)">
        <rect x="0" y="0" width="70" height="24" rx="2" fill={kitchen} />
        <rect x="0" y="-4" width="70" height="5" rx="2" fill="#e8e6f5" />
        <rect x="8" y="6" width="18" height="14" rx="2" fill="#3a3560" opacity="0.5" />
        <rect x="34" y="6" width="18" height="14" rx="2" fill="#3a3560" opacity="0.5" />
        {kitchenId === 'island' && <rect x="-42" y="8" width="34" height="14" rx="3" fill={kitchen} />}
        {kitchenId === 'chef' && <g><rect x="-44" y="4" width="36" height="18" rx="3" fill={kitchen} /><path d="M-40 2 h28" stroke="#ffd37a" strokeWidth="3" /></g>}
        {kitchenId === 'retro' && <g><rect x="-40" y="6" width="30" height="16" rx="8" fill="#ff8fa8" /><path d="M-36 14 h22" stroke="#fff" strokeWidth="2" /></g>}
        <rect x="52" y="-26" width="16" height="22" rx="2" fill="#c9c3e6" />
      </g>

      {/* window */}
      <g><rect x="176" y="56" width="34" height="26" rx="2" fill="#7ec4e8" opacity="0.8" /><path d="M193 56 v26 M176 69 h34" stroke={wall} strokeWidth="2" /></g>

      {/* garden extras */}
      {tier >= 1 && gardenId === 'tree' && (
        <g transform="translate(258 132)"><rect x="-4" y="0" width="8" height="26" fill="#6b452b" /><circle cy="-10" r="20" fill="#3f7a4a" /><circle cx="-12" cy="0" r="12" fill="#4a8a55" /></g>
      )}
      {tier >= 1 && gardenId === 'flowers' && (
        <g>{[236, 252, 268, 284].map((x, i) => (
          <g key={x} transform={`translate(${x} ${150 + (i % 2) * 10})`}>
            <path d="M0 0 v-10" stroke="#3f7a4a" strokeWidth="2" />
            <circle cy="-12" r="4" fill={['#ff8fc4', '#ffd37a', '#b79cff', '#ff7a8a'][i]} />
          </g>))}
        </g>
      )}
      {tier >= 1 && gardenId === 'veg' && (
        <g>{[232, 248, 264, 280].map((x) => <g key={x}><rect x={x} y="150" width="12" height="8" rx="2" fill="#6b452b" /><circle cx={x + 6} cy="148" r="4" fill="#7ec46a" /></g>)}</g>
      )}
      {tier >= 1 && gardenId === 'zen' && (
        <g><ellipse cx="258" cy="156" rx="34" ry="18" fill="#cfe0ce" /><circle cx="248" cy="152" r="5" fill="#8a8598" /><circle cx="268" cy="160" r="4" fill="#8a8598" />
          <path d="M228 156 q30 -10 60 0" stroke="#b8c9b8" strokeWidth="1.5" fill="none" /></g>
      )}

      {/* the big extra */}
      {extraId === 'pool' && (
        <g><rect x="24" y="142" width="86" height="34" rx="10" fill="#7ec4e8" /><path d="M30 152 q14 6 28 0 q14 -6 28 0" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" /></g>
      )}
      {extraId === 'cinema' && (
        <g><rect x="24" y="140" width="86" height="40" rx="4" fill="#1b1330" /><rect x="32" y="146" width="70" height="24" rx="2" fill="#4b2a86" />
          <circle cx="44" cy="176" r="4" fill="#e0445a" /><circle cx="58" cy="176" r="4" fill="#e0445a" /><circle cx="72" cy="176" r="4" fill="#e0445a" /></g>
      )}
      {extraId === 'library' && (
        <g><rect x="24" y="140" width="86" height="40" rx="4" fill="#a6704a" />{[30, 46, 62, 78, 94].map((x) => <rect key={x} x={x} y="146" width="10" height="28" rx="2" fill={['#e0445a', '#f4c95d', '#7ec46a', '#6f8cff', '#b79cff'][(x / 16) | 0]} />)}</g>
      )}
      {extraId === 'studio' && (
        <g><rect x="24" y="140" width="86" height="40" rx="4" fill="#2b2240" /><circle cx="52" cy="160" r="12" fill="none" stroke="#ff6fa8" strokeWidth="3" />
          <path d="M76 168 v-20 l16 -4 v20" stroke="#ffd37a" strokeWidth="3" fill="none" /></g>
      )}

      {/* finishing touches */}
      {petId === 'plants' && <g transform="translate(206 112)"><path d="M0 8 h12 l-2 10 h-8 z" fill="#b9854f" /><path d="M6 8 q-10 -12 -2 -16 q8 4 2 16 M6 8 q10 -12 2 -16 q-8 4 -2 16" fill="#7ec46a" /></g>}
      {petId === 'cat' && <g transform="translate(120 112)"><ellipse cx="0" cy="4" rx="10" ry="6" fill="#e8a86a" /><circle cx="8" cy="-2" r="5" fill="#e8a86a" /><path d="M5 -6 l1 -5 l4 3 z M11 -6 l3 -4 l1 5 z" fill="#e8a86a" /><path d="M-10 4 q-8 -4 -4 -8" stroke="#e8a86a" strokeWidth="3" fill="none" /></g>}
      {petId === 'dog' && <g transform="translate(120 110)"><ellipse cx="0" cy="6" rx="12" ry="7" fill="#b9854f" /><circle cx="10" cy="-1" r="6" fill="#b9854f" /><ellipse cx="6" cy="-4" rx="3" ry="5" fill="#8a6338" /><path d="M-12 4 q-6 -8 0 -10" stroke="#b9854f" strokeWidth="3" fill="none" /></g>}
      {petId === 'fish' && <g transform="translate(206 100)"><rect x="0" y="0" width="26" height="18" rx="3" fill="#7ec4e8" opacity="0.6" stroke="#c9c3e6" /><path d="M8 9 l6 -3 v6 z" fill="#ffb38a" /><circle cx="18" cy="8" r="2" fill="#ff8fc4" /></g>}
    </svg>
  );
}

/* ───────── Pick a spot on the map, then buy ───────── */

export function LocationPicker({ item, game, onBuy, onBack, onClose }: {
  item: { id: string; name: string; emoji: string; price: number; happiness: number };
  game: Game;
  onBuy: (districtId: string, price: number) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string>();
  const district: District | undefined = districtOf(picked);
  const price = picked ? priceIn(item.price, picked) : item.price;

  return (
    <Sheet title={`${item.emoji} ${item.name}`} onClose={onClose} onBack={onBack}>
      <p className="note" style={{ marginBottom: 10 }}>Where do you want to live? The address changes the price — and how fast it gains value.</p>
      <CityMap picked={picked} onPick={setPicked} basePrice={item.price} />
      {district ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h4>{district.emoji} {district.name}</h4>
          <p className="sub">{district.blurb}</p>
          <p className="sub">+{district.joy} happiness · value grows {Math.round(district.growth * 100)}% faster a year</p>
        </div>
      ) : (
        <p className="note" style={{ marginTop: 12 }}>Tap a pin on the map to choose your neighbourhood.</p>
      )}
      <div className="sticky-cta">
        <button className="btn primary block" disabled={!picked || (price > game.money && game.age >= 25)}
          onClick={() => picked && onBuy(picked, price)}>
          {!picked ? 'Pick a neighbourhood 📍' : `🔑 Buy in ${district?.name} · ${money(price)}`}
        </button>
      </div>
    </Sheet>
  );
}

/* ───────── Make it yours ───────── */

export function HouseEditor({ game, asset, onApply, onBack, onClose }: {
  game: Game;
  asset: Asset;
  onApply: (picks: Record<string, string>, cost: number) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [picks, setPicks] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = {};
    for (const slot of slotsFor(asset)) start[slot.id] = asset.decor?.[slot.id] ?? slot.options[0].id;
    return start;
  });
  const preview: Asset = { ...asset, decor: picks };
  const cost = decorCost(asset, picks);
  const district = districtOf(asset.location);

  return (
    <Sheet title={`${asset.emoji} ${asset.name}`} onClose={onClose} onBack={onBack}>
      <p className="note" style={{ marginBottom: 10 }}>
        {district ? `${district.emoji} ${district.name} · ` : ''}worth {money(asset.value)}. Tap anything to try it — you only pay for what you change.
      </p>
      <HouseScene asset={preview} />
      {slotsFor(asset).map((slot) => (
        <div key={slot.id} className="decor-slot">
          <p className="section-title">{slot.emoji} {slot.name}</p>
          <div className="decor-row">
            {slot.options.map((o) => {
              const owned = asset.decor?.[slot.id] === o.id;
              const on = picks[slot.id] === o.id;
              return (
                <button key={o.id} className={`decor-opt ${on ? 'on' : ''}`} onClick={() => setPicks({ ...picks, [slot.id]: o.id })}>
                  <span className="swatch" style={{ background: o.color ?? 'transparent', borderStyle: o.color ? 'solid' : 'dashed' }} />
                  <b>{o.name}</b>
                  <small>{owned ? 'Yours' : o.price ? money(o.price) : 'Free'}</small>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="sticky-cta">
        <button className="btn primary block" disabled={cost > game.money && game.age >= 25} onClick={() => onApply(picks, cost)}>
          {cost > 0 ? `🛋️ Make it happen · ${money(cost)}` : '🛋️ Save the layout'}
        </button>
      </div>
    </Sheet>
  );
}
