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

/* ───────── The house itself, drawn from your choices ─────────
   Every property gets its own cutaway: a studio is one room, a suburban house
   has a bedroom, living room and kitchen on one floor, and the mansion has two. */

interface Box { x: number; y: number; w: number; h: number }
const floorOf = (b: Box) => b.y + b.h;

function RoomLabel({ box, text }: { box: Box; text: string }) {
  return <text x={box.x + 3} y={box.y + 9} fontSize="6.5" fill="#2b2240" opacity="0.4" fontWeight="700">{text}</text>;
}

/* ── furniture, each drawn standing on the floor of its room ── */

function Bed({ box, id, color }: { box: Box; id: string; color: string }) {
  const y = floorOf(box);
  const w = id === 'king' ? 54 : id === 'double' ? 46 : id === 'bunk' ? 40 : 38;
  const x = box.x + 5;
  const wood = '#6b452b';
  /** One bed seen from the side: headboard by the pillow, a lower footboard, legs, mattress and blanket. */
  const bunk = (top: number) => (
    <g key={top}>
      <rect x={x + 3} y={top - 5} width={w - 6} height="3" rx="1" fill={wood} />
      <rect x={x + 3} y={top - 9} width={w - 6} height="5" rx="2" fill="#f5f0ff" />
      <rect x={x + 5} y={top - 12} width="10" height="4" rx="2" fill="#fff" />
      <rect x={x + 14} y={top - 10} width={w - 17} height="6" rx="2" fill={color} />
    </g>
  );
  return (
    <g>
      {id === 'bunk' ? (
        <>
          {bunk(y - 3)}
          {bunk(y - 24)}
          <path d={`M${x + 1.5} ${y - 36} V${y} M${x + w - 1.5} ${y - 36} V${y}`} stroke={wood} strokeWidth="3" strokeLinecap="round" />
          {/* ladder */}
          <path d={`M${x + w - 9} ${y - 24} V${y} M${x + w - 4} ${y - 24} V${y}`} stroke="#8a6a4a" strokeWidth="1.2" />
          {[y - 19, y - 13, y - 7].map((ry) => <path key={ry} d={`M${x + w - 9} ${ry} h5`} stroke="#8a6a4a" strokeWidth="1.2" />)}
        </>
      ) : (
        <>
          {id === 'canopy' && (
            <g>
              <rect x={x - 1} y={y - 40} width={w + 2} height="4" rx="2" fill="#6b3fc4" />
              <path d={`M${x + 1.5} ${y - 38} V${y} M${x + w - 1.5} ${y - 38} V${y}`} stroke="#6b3fc4" strokeWidth="3" strokeLinecap="round" />
              <path d={`M${x + 4} ${y - 36} q6 9 0 18 M${x + w - 4} ${y - 36} q-6 9 0 18`} fill="none" stroke="#ff8fc4" strokeWidth="2.5" opacity="0.85" />
            </g>
          )}
          {/* legs and frame */}
          <path d={`M${x + 4} ${y - 4} V${y} M${x + w - 4} ${y - 4} V${y}`} stroke={wood} strokeWidth="2.5" />
          <rect x={x + 1} y={y - 7} width={w - 2} height="4" rx="1.5" fill={wood} />
          {/* mattress, pillow, blanket */}
          <rect x={x + 2} y={y - 12} width={w - 4} height="6" rx="2.5" fill="#f5f0ff" />
          <rect x={x + 4} y={y - 15} width="12" height="5" rx="2.5" fill="#fff" stroke="#e2dcf2" strokeWidth="0.6" />
          <rect x={x + 15} y={y - 13} width={w - 18} height="7" rx="2.5" fill={color} />
          {/* headboard (tall, at the pillow end) and footboard (short) */}
          {id !== 'canopy' && <rect x={x} y={y - 22} width="3.5" height="22" rx="1.5" fill={wood} />}
          {id !== 'canopy' && <rect x={x + w - 3.5} y={y - 13} width="3.5" height="13" rx="1.5" fill={wood} />}
        </>
      )}
      <rect x={x + w + 4} y={y - 9} width="9" height="9" rx="1.5" fill="#8a6a4a" />
      <circle cx={x + w + 8.5} cy={y - 12} r="2.5" fill="#ffd37a" />
    </g>
  );
}

function Kitchen({ box, id, color }: { box: Box; id: string; color: string }) {
  const y = floorOf(box);
  const x = box.x + 4;
  const w = box.w - 10;
  return (
    <g>
      <rect x={x} y={y - 16} width={w} height="16" rx="1.5" fill={color} />
      <rect x={x} y={y - 19} width={w} height="3.5" rx="1.5" fill="#e8e6f5" />
      <rect x={x + 3} y={y - 12} width={12} height="9" rx="1.5" fill="#3a3560" opacity="0.45" />
      <rect x={x + 18} y={y - 12} width={12} height="9" rx="1.5" fill="#3a3560" opacity="0.45" />
      <rect x={x + w - 14} y={y - 34} width={14} height="15" rx="2" fill="#c9c3e6" />
      <path d={`M${x + w - 12} ${y - 27} h10`} stroke="#9aa3c2" strokeWidth="1" />
      {id === 'island' && <rect x={x + 6} y={y - 30} width="22" height="8" rx="2" fill={color} />}
      {id === 'chef' && (
        <g>
          <rect x={x + 4} y={y - 32} width="26" height="10" rx="2" fill={color} />
          <path d={`M${x + 7} ${y - 34} h20`} stroke="#ffd37a" strokeWidth="2.5" />
          {[0, 1, 2].map((i) => <circle key={i} cx={x + 9 + i * 8} cy={y - 26} r="2" fill="#3a3560" opacity="0.5" />)}
        </g>
      )}
      {id === 'retro' && (
        <g>
          <rect x={x + 5} y={y - 30} width="24" height="10" rx="5" fill="#ff8fa8" />
          <path d={`M${x + 8} ${y - 25} h18`} stroke="#fff" strokeWidth="1.6" />
        </g>
      )}
    </g>
  );
}

/** A sofa seen from the front: back cushions, seat, two arms and little legs. */
function Sofa({ x, y, w, color, seats }: { x: number; y: number; w: number; color: string; seats: number }) {
  const light = shadeHex(color, 0.16);
  const dark = shadeHex(color, -0.18);
  const inner = w - 10;
  return (
    <g>
      <path d={`M${x + 3} ${y - 2} v2 M${x + w - 3} ${y - 2} v2`} stroke="#3a2a1e" strokeWidth="2" />
      <rect x={x + 4} y={y - 21} width={inner + 2} height="11" rx="3" fill={light} />
      {Array.from({ length: seats - 1 }, (_, i) => (
        <path key={i} d={`M${x + 5 + ((i + 1) * inner) / seats} ${y - 20} v9`} stroke={dark} strokeWidth="0.8" opacity="0.6" />
      ))}
      <rect x={x + 3} y={y - 11} width={w - 6} height="8" rx="2.5" fill={color} />
      {Array.from({ length: seats - 1 }, (_, i) => (
        <path key={i} d={`M${x + 5 + ((i + 1) * inner) / seats} ${y - 10} v6`} stroke={dark} strokeWidth="0.8" opacity="0.6" />
      ))}
      <rect x={x} y={y - 15} width="6" height="13" rx="2.5" fill={dark} />
      <rect x={x + w - 6} y={y - 15} width="6" height="13" rx="2.5" fill={dark} />
    </g>
  );
}

function Living({ box, id, color }: { box: Box; id: string; color: string }) {
  const y = floorOf(box);
  const x = box.x + 5;
  return (
    <g>
      <rect x={x + 2} y={y - 1.5} width={box.w - 14} height="1.5" rx="0.75" fill="#000" opacity="0.12" />
      {id === 'grand' ? (
        <g>
          {/* bench */}
          <rect x={x} y={y - 10} width="9" height="3" rx="1" fill={color} />
          <path d={`M${x + 1.5} ${y - 7} V${y} M${x + 7.5} ${y - 7} V${y}`} stroke={color} strokeWidth="1.5" />
          {/* propped-open lid and its stick */}
          <path d={`M${x + 18} ${y - 18} L${x + 44} ${y - 34} L${x + 47} ${y - 31} L${x + 24} ${y - 18} Z`} fill={shadeHex(color, 0.25)} />
          <path d={`M${x + 34} ${y - 18} L${x + 37} ${y - 28}`} stroke="#c9c3e6" strokeWidth="1" />
          {/* curved body */}
          <path d={`M${x + 13} ${y - 18} H${x + 36} Q${x + 50} ${y - 18} ${x + 50} ${y - 13} V${y - 11} H${x + 13} Z`} fill={color} />
          {/* keyboard, with a few black keys */}
          <rect x={x + 11} y={y - 17} width="8" height="3" rx="0.5" fill="#f5f0ff" />
          {[12.5, 14.5, 17].map((k) => <rect key={k} x={x + k} y={y - 17} width="1" height="1.8" fill="#1b1330" />)}
          {/* legs and pedals */}
          <path d={`M${x + 15} ${y - 11} V${y} M${x + 47} ${y - 11} V${y} M${x + 31} ${y - 11} V${y}`} stroke={color} strokeWidth="2" />
          <rect x={x + 29} y={y - 3} width="4" height="1.5" fill="#f4c95d" />
        </g>
      ) : id === 'corner' ? (
        <g>
          <Sofa x={x} y={y} w={40} color={color} seats={3} />
          {/* the chaise end of the L, coming towards you */}
          <rect x={x + 34} y={y - 10} width="16" height="8" rx="2.5" fill={color} />
          <rect x={x + 44} y={y - 13} width="6" height="11" rx="2.5" fill={shadeHex(color, -0.18)} />
          <path d={`M${x + 36} ${y - 2} v2 M${x + 48} ${y - 2} v2`} stroke="#3a2a1e" strokeWidth="2" />
        </g>
      ) : id === 'leather' ? (
        <g>
          <Sofa x={x} y={y} w={32} color={color} seats={2} />
          <Sofa x={x + 36} y={y} w={17} color={color} seats={1} />
        </g>
      ) : id === 'fireplace' ? (
        <g>
          <Sofa x={x} y={y} w={32} color={color} seats={2} />
          <rect x={box.x + box.w - 22} y={y - 28} width="20" height="4" rx="1" fill="#5e4234" />
          <rect x={box.x + box.w - 20} y={y - 24} width="16" height="24" rx="1" fill="#7a5a4a" />
          <rect x={box.x + box.w - 17} y={y - 17} width="10" height="13" rx="1" fill="#2b1a12" />
          <path d={`M${box.x + box.w - 12} ${y - 5} q-5 -7 0 -10 q4 5 2 10 z`} fill="#ff9a4d" />
        </g>
      ) : (
        <Sofa x={x} y={y} w={34} color={color} seats={2} />
      )}
    </g>
  );
}

function Bath({ box, id }: { box: Box; id: string }) {
  const y = floorOf(box);
  const x = box.x + 5;
  const porcelain = id === 'gold' ? '#fff6d6' : '#f7f9ff';
  const metal = id === 'gold' ? '#f4c95d' : '#c9d2e6';
  return (
    <g>
      {id === 'spa' && <rect x={box.x + 2} y={box.y + 2} width={box.w - 4} height={box.h - 2} fill="#e8e6f0" opacity="0.5" />}
      <g>
        <rect x={x} y={y - 12} width={26} height="10" rx={id === 'tub' || id === 'spa' ? 5 : 2} fill={porcelain} stroke={metal} strokeWidth="1" />
        <path d={`M${x + 3} ${y - 8} h20`} stroke="#bfe9ff" strokeWidth="3" />
        {(id === 'tub' || id === 'spa') && <path d={`M${x + 2} ${y - 2} v2 M${x + 24} ${y - 2} v2`} stroke={metal} strokeWidth="2" />}
      </g>
      <g transform={`translate(${x + 32} ${y - 16})`}>
        <rect x="0" y="6" width="9" height="10" rx="1.5" fill={porcelain} />
        <rect x="-1" y="2" width="11" height="5" rx="2" fill={porcelain} />
        <path d="M4.5 2 v-4" stroke={metal} strokeWidth="1.6" />
      </g>
      <rect x={x + 44} y={y - 24} width="11" height="13" rx="1.5" fill="none" stroke={metal} strokeWidth="1.4" />
    </g>
  );
}

/** Lighten a hex colour a little (local copy so this file stays standalone). */
function shadeHex(hex: string, amt: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const mix = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)); // lighten or darken
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function Window({ x, y, w = 26, h = 20 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" fill="#7ec4e8" opacity="0.75" />
      <path d={`M${x + w / 2} ${y} v${h} M${x} ${y + h / 2} h${w}`} stroke="#f7f5fc" strokeWidth="1.6" opacity="0.8" />
      <rect x={x} y={y} width={w} height={h} rx="2" fill="none" stroke="#f7f5fc" strokeWidth="1.6" opacity="0.8" />
    </g>
  );
}

function Door({ x, y, h = 26 }: { x: number; y: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width="14" height={h} rx="2" fill="#8a5a3a" />
      <circle cx={x + 11} cy={y + h / 2} r="1.4" fill="#f4c95d" />
    </g>
  );
}

export function HouseScene({ asset }: { asset: Asset }) {
  const tier = tierOf(asset.shopId);
  const wall = decorOf(asset, 'wall').color ?? '#f2e6d4';
  const wallDark = shadeHex(wall, -0.001) === wall ? wall : wall;
  const floor = decorOf(asset, 'floor').color ?? '#8b8798';
  const bedId = decorOf(asset, 'bed').id;
  const bedColor = decorOf(asset, 'bedcolor').color ?? decorOf(asset, 'bed').color ?? '#8fb8ff';
  const kitchenId = decorOf(asset, 'kitchen').id;
  const kitchenColor = decorOf(asset, 'kitchen').color ?? '#9b95b0';
  const livingId = tier >= 1 ? decorOf(asset, 'living').id : 'none';
  const livingColor = decorOf(asset, 'living').color ?? '#8a7fb8';
  const bathId = tier >= 2 ? decorOf(asset, 'bath').id : 'none';
  const gardenId = tier >= 1 ? decorOf(asset, 'garden').id : 'none';
  const lawn = gardenId === 'zen' ? '#9c9478' : '#5c9c55';
  const extraId = tier >= 2 ? decorOf(asset, 'extra').id : 'none';
  const mural = decorOf(asset, 'wall').id === 'mural';

  /* Room plans, one per property. */
  const plan: { rooms: Record<string, Box>; ground: number } =
    tier === 0 ? { ground: 150, rooms: { bed: { x: 68, y: 66, w: 76, h: 80 }, kitchen: { x: 148, y: 66, w: 80, h: 80 } } }
    : tier === 1 ? { ground: 134, rooms: {
        bed: { x: 40, y: 62, w: 72, h: 70 }, living: { x: 116, y: 62, w: 66, h: 70 }, kitchen: { x: 186, y: 62, w: 68, h: 70 },
      } }
    : tier === 2 ? { ground: 148, rooms: {
        bed: { x: 32, y: 86, w: 68, h: 56 }, living: { x: 104, y: 86, w: 66, h: 56 }, kitchen: { x: 174, y: 86, w: 72, h: 56 },
        bath: { x: 150, y: 48, w: 96, h: 32 },
      } }
    : { ground: 156, rooms: {
        kitchen: { x: 34, y: 100, w: 74, h: 54 }, living: { x: 142, y: 100, w: 70, h: 54 },
        bed: { x: 34, y: 44, w: 74, h: 52 }, bath: { x: 142, y: 44, w: 70, h: 52 },
      } };

  const shell: Box = tier === 0 ? { x: 62, y: 60, w: 172, h: 90 }
    : tier === 1 ? { x: 34, y: 56, w: 222, h: 78 }
    : tier === 2 ? { x: 28, y: 44, w: 222, h: 104 }
    : { x: 28, y: 38, w: 190, h: 118 };

  return (
    <svg viewBox="0 0 300 190" className="house-scene" role="img" aria-label="Your home">
      <rect x="0" y="0" width="300" height="190" rx="16" fill="#14113a" />
      <rect x="0" y="0" width="300" height={plan.ground} fill="#2a2566" />
      <circle cx="266" cy="24" r="11" fill="#ffd37a" opacity="0.65" />
      {[[22, 18], [58, 34], [120, 16], [210, 30]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="1.4" fill="#fff" opacity="0.5" />)}

      {/* the ground: a street for a condo, lawn or sand otherwise */}
      <rect x="0" y={plan.ground} width="300" height={190 - plan.ground} fill={tier === 0 ? '#3a3560' : lawn} />
      {tier === 2 && <path d="M0 176 h300 v14 H0 z" fill="#e0c88a" />}
      {tier === 0 && <path d="M0 168 h300" stroke="#6b6699" strokeWidth="2" strokeDasharray="10 8" />}

      {/* neighbouring flats behind a studio */}
      {tier === 0 && (
        <g opacity="0.5">
          <rect x="14" y="30" width="272" height="122" fill="#1e1a50" />
          {[24, 58, 238, 262].map((x) => [44, 78, 112].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="16" height="12" rx="1" fill="#4a4290" />))}
        </g>
      )}

      {/* the building itself */}
      <rect x={shell.x} y={shell.y} width={shell.w} height={shell.h} rx="3" fill={wallDark} />
      {tier === 1 && <path d={`M${shell.x - 8} ${shell.y + 2} L150 22 L${shell.x + shell.w + 8} ${shell.y + 2} Z`} fill="#8a4a5c" />}
      {tier === 2 && (
        <g>
          <path d={`M${shell.x - 12} 48 L139 16 L${shell.x + shell.w + 12} 48 Z`} fill="#7a5a86" />
          <rect x={shell.x - 4} y="44" width={shell.w + 8} height="5" rx="2" fill="#9a7aa6" />
          <rect x={shell.x} y="82" width={shell.w} height="4" fill="#9a7aa6" />
          <rect x={shell.x - 6} y="148" width={shell.w + 12} height="6" fill="#a6704a" />
          {[40, 92, 144, 196, 244].map((x) => <path key={x} d={`M${x} 154 v12`} stroke="#a6704a" strokeWidth="3" />)}
          <path d={`M${shell.x - 6} 158 h${shell.w + 12}`} stroke="#c58f5f" strokeWidth="3" />
        </g>
      )}
      {tier === 3 && (
        <g>
          <path d={`M${shell.x - 10} 40 L123 12 L${shell.x + shell.w + 10} 40 Z`} fill="#6b3f5c" />
          <rect x={shell.x - 4} y="36" width={shell.w + 8} height="6" rx="2" fill="#8a5a76" />
          <rect x={shell.x - 4} y="96" width={shell.w + 8} height="5" rx="2" fill="#8a5a76" />
          {[224, 246, 268].map((x) => <rect key={x} x={x} y="60" width="8" height="96" fill="#e8e0d4" />)}
          <path d="M216 56 h68 v8 h-68 z" fill="#f2ece2" />
          <path d="M216 56 L250 38 L284 56 Z" fill="#6b3f5c" />
        </g>
      )}

      {/* floors and dividing walls */}
      {Object.entries(plan.rooms).map(([key, box]) => (
        <g key={key}>
          {mural && key === 'bed' && (
            <g><circle cx={box.x + 22} cy={box.y + 20} r="9" fill="#ffd37a" /><path d={`M${box.x + 6} ${box.y + 34} q18 -16 36 0 z`} fill="#ff8fc4" opacity="0.8" /></g>
          )}
          <rect x={box.x} y={floorOf(box)} width={box.w} height="6" fill={floor} />
          <rect x={box.x - 2} y={box.y} width="2" height={box.h + 6} fill="#00000018" />
        </g>
      ))}

      {/* windows and doors sit on the back wall, behind everything else */}
      {tier === 0 && <Window x={168} y={74} />}
      {tier === 1 && <><Window x={62} y={70} w={22} h={16} /><Window x={210} y={70} w={22} h={16} /></>}
      {tier === 2 && <><Window x={52} y={94} w={22} h={16} /><Window x={212} y={94} w={22} h={16} /><Window x={60} y={56} w={24} h={18} /></>}
      {tier === 3 && <><Window x={62} y={56} w={20} h={14} /><Window x={150} y={56} w={20} h={14} /><Window x={62} y={112} w={20} h={14} /><Door x={233} y={130} /></>}

      {/* what's in each room */}
      {plan.rooms.bed && <><RoomLabel box={plan.rooms.bed} text="BEDROOM" /><Bed box={plan.rooms.bed} id={bedId} color={bedColor} /></>}
      {plan.rooms.kitchen && <><RoomLabel box={plan.rooms.kitchen} text="KITCHEN" /><Kitchen box={plan.rooms.kitchen} id={kitchenId} color={kitchenColor} /></>}
      {plan.rooms.living && <><RoomLabel box={plan.rooms.living} text="LIVING" /><Living box={plan.rooms.living} id={livingId} color={livingColor} /></>}
      {plan.rooms.bath && <><RoomLabel box={plan.rooms.bath} text="BATHROOM" /><Bath box={plan.rooms.bath} id={bathId} /></>}

      {/* stairs between floors in the mansion */}
      {tier === 3 && (
        <g>
          <rect x="108" y="44" width="30" height="112" fill="#00000012" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={106 + i * 4} y={148 - i * 9} width="14" height="9" fill={i % 2 ? '#c58f5f' : '#b9854f'} />
          ))}
          <path d="M106 152 L128 96" stroke="#8a5a3a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M104 144 L126 88" stroke="#e8d3b8" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}


      {/* the garden */}
      {tier >= 1 && gardenId === 'tree' && (
        <g transform={`translate(272 ${plan.ground - 2})`}><rect x="-4" y="0" width="8" height="26" fill="#6b452b" /><circle cy="-12" r="18" fill="#3f7a4a" /><circle cx="-11" cy="-2" r="11" fill="#4a8a55" /></g>
      )}
      {tier >= 1 && gardenId === 'flowers' && (
        <g>{[264, 276, 288, 270, 284].map((x, i) => (
          <g key={x} transform={`translate(${x} ${plan.ground + 12 + (i % 2) * 12})`}>
            <path d="M0 0 v-9" stroke="#3f7a4a" strokeWidth="1.8" />
            <circle cy="-11" r="3.6" fill={['#ff8fc4', '#ffd37a', '#b79cff', '#ff7a8a', '#fff'][i]} />
          </g>))}
        </g>
      )}
      {tier >= 1 && gardenId === 'veg' && (
        <g>{[262, 276, 290].map((x) => <g key={x}><rect x={x - 6} y={plan.ground + 10} width="12" height="7" rx="2" fill="#6b452b" /><circle cx={x} cy={plan.ground + 8} r="4" fill="#7ec46a" /></g>)}</g>
      )}
      {tier >= 1 && gardenId === 'zen' && (
        <g><ellipse cx="276" cy={plan.ground + 18} rx="22" ry="14" fill="#cfe0ce" /><circle cx="268" cy={plan.ground + 14} r="4" fill="#8a8598" /><circle cx="284" cy={plan.ground + 22} r="3" fill="#8a8598" /></g>
      )}

      {/* the big extra, out on the grounds */}
      {extraId === 'pool' && (
        <g><rect x="14" y={plan.ground + 8} width="74" height="26" rx="10" fill="#7ec4e8" /><path d={`M20 ${plan.ground + 18} q12 5 24 0 q12 -5 24 0`} stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" /></g>
      )}
      {extraId !== 'pool' && extraId !== 'none' && (
        <g>
          <rect x="14" y={plan.ground + 4} width="74" height={182 - plan.ground} rx="3" fill={wall} />
          <path d={`M10 ${plan.ground + 6} L51 ${plan.ground - 8} L92 ${plan.ground + 6} Z`} fill="#8a4a5c" />
          {extraId === 'cinema' && <><rect x="22" y={plan.ground + 14} width="44" height="16" rx="2" fill="#4b2a86" />{[30, 42, 54].map((x) => <circle key={x} cx={x} cy={plan.ground + 36} r="3" fill="#e0445a" />)}</>}
          {extraId === 'library' && <g>{[22, 32, 42, 52, 62].map((x, i) => <rect key={x} x={x} y={plan.ground + 14} width="7" height="20" rx="1.5" fill={['#e0445a', '#f4c95d', '#7ec46a', '#6f8cff', '#b79cff'][i]} />)}</g>}
          {extraId === 'studio' && <g><circle cx="36" cy={plan.ground + 24} r="10" fill="none" stroke="#ff6fa8" strokeWidth="3" /><path d={`M58 ${plan.ground + 34} v-18 l12 -3 v18`} stroke="#ffd37a" strokeWidth="2.5" fill="none" /></g>}
        </g>
      )}

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
