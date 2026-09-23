/* Illustrated scenes for the mini-games. Everything is drawn in a 300×170 viewBox. */

export type SceneId =
  | 'surgery' | 'injection' | 'kitchen' | 'hoop' | 'stage' | 'plane' | 'space' | 'beam'
  | 'tattoo' | 'camera' | 'lab' | 'gym' | 'scissors' | 'goal' | 'runway' | 'punch' | 'dial'
  | 'banquet' | 'balcony' | 'throne';

export interface Zone { center: number; width: number }

const W = 300;
const track = { x0: 34, x1: 266 };
const atX = (pos: number) => track.x0 + pos * (track.x1 - track.x0);
const zoneBox = (z: Zone) => ({ x: atX(z.center - z.width / 2), w: (track.x1 - track.x0) * z.width });

function ZoneStrip({ zone, y, h, round = 8 }: { zone: Zone; y: number; h: number; round?: number }) {
  const { x, w } = zoneBox(zone);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={round} fill="rgba(126,240,193,0.30)" stroke="#7ef0c1" strokeWidth="2" strokeDasharray="5 4" />
    </g>
  );
}

/** A horizontal band for scenes where the tool moves up and down. */
function VZone({ y, h, label }: { y: number; h: number; label?: string }) {
  return (
    <g>
      <rect x="28" y={y - h / 2} width="244" height={h} rx="8" fill="rgba(126,240,193,0.28)" stroke="#7ef0c1" strokeWidth="2" strokeDasharray="5 4" />
      {label && <text x="150" y={y - h / 2 - 6} fontSize="11" textAnchor="middle" fill="#7ef0c1">{label}</text>}
    </g>
  );
}

/** The slice of the dial you have to stop on. */
function DialZone({ zone }: { zone: Zone }) {
  const ang = (p: number) => ((p * 320 - 160) - 90) * (Math.PI / 180);
  const R = 46;
  const a0 = ang(zone.center - zone.width / 2);
  const a1 = ang(zone.center + zone.width / 2);
  const p0 = [150 + Math.cos(a0) * R, 86 + Math.sin(a0) * R];
  const p1 = [150 + Math.cos(a1) * R, 86 + Math.sin(a1) * R];
  return <path d={`M${p0[0]} ${p0[1]} A ${R} ${R} 0 0 1 ${p1[0]} ${p1[1]}`} fill="none" stroke="#7ef0c1" strokeWidth="9" strokeLinecap="round" opacity="0.85" />;
}

/** The scene drawing plus the moving tool, all in one picture. */
export function AimScene({ scene, pos, zone, state }: { scene: SceneId; pos: number; zone: Zone; state: 'idle' | 'hit' | 'miss' }) {
  const x = atX(pos);
  const zx = atX(zone.center); // the target sits where the green zone is, so aiming makes sense
  const glow = state === 'hit' ? '#7ef0c1' : state === 'miss' ? '#ff7a8a' : '#fff';

  const scenes: Record<SceneId, React.ReactNode> = {
    /* ───── Operating table: body, sheet, incision site ───── */
    surgery: (
      <>
        <rect x="18" y="74" width="264" height="58" rx="10" fill="#2b2f6b" />
        <rect x="18" y="126" width="264" height="10" rx="4" fill="#1b1f4f" />
        <ellipse cx="150" cy="96" rx="118" ry="30" fill="#f7cba9" />
        <path d="M32 96 q118 -34 236 0 z" fill="#ffd9bd" opacity="0.6" />
        <rect x="18" y="104" width="264" height="26" rx="8" fill="#9fd4e8" opacity="0.9" />
        <ZoneStrip zone={zone} y={80} h={26} />
        <path d="M40 60 h40 l10 -14 10 28 12 -20 10 12 h130" fill="none" stroke="#7ef0c1" strokeWidth="2" opacity="0.8" />
        <text x="22" y="30" fontSize="13" fill="#b8b0d8">🫀 98 bpm</text>
        <g transform={`translate(${x} 58)`}>
          <rect x="-2" y="-26" width="4" height="24" rx="2" fill="#c9c3e6" />
          <path d="M-6 -2 L6 -2 L0 16 Z" fill="#e8e6f5" stroke={glow} strokeWidth="2" />
        </g>
      </>
    ),

    /* ───── Arm with veins: line the needle up with the vein ───── */
    injection: (
      <>
        <rect x="14" y="86" width="272" height="52" rx="26" fill="#e6ab84" />
        <rect x="14" y="86" width="272" height="20" rx="12" fill="#f7cba9" opacity="0.7" />
        <path d="M20 116 q70 -18 130 0 t130 -4" fill="none" stroke="#5f6fd8" strokeWidth="6" opacity="0.75" />
        <path d="M20 128 q80 -12 150 2 t110 -6" fill="none" stroke="#7a86e8" strokeWidth="4" opacity="0.6" />
        <ZoneStrip zone={zone} y={104} h={26} />
        <g transform={`translate(${x} 40)`}>
          <rect x="-24" y="-8" width="44" height="16" rx="4" fill="#e8e6f5" stroke="#9aa3c2" />
          <rect x="-18" y="-5" width="26" height="10" fill="#bfe9ff" />
          <rect x="20" y="-3" width="10" height="6" rx="2" fill="#c9c3e6" />
          <path d="M0 8 L0 40" stroke={glow} strokeWidth="3" />
          <path d="M-4 40 L4 40 L0 50 Z" fill={glow} />
        </g>
      </>
    ),

    /* ───── Pan on the stove: flip at the top of the arc ───── */
    kitchen: (
      <>
        <rect x="0" y="120" width="300" height="50" fill="#2b2240" />
        <ellipse cx={zx} cy="128" rx="60" ry="14" fill="#3a3560" />
        <path d={`M${zx - 30} 120 q30 20 60 0`} fill="none" stroke="#ff9a4d" strokeWidth="6" opacity="0.8" />
        <path d={`M${zx - 20} 122 q20 14 40 0`} fill="none" stroke="#ffd37a" strokeWidth="4" opacity="0.9" />
        <ellipse cx={zx} cy="116" rx="46" ry="12" fill="#4a4470" stroke="#6b6699" strokeWidth="3" />
        <rect x={zx + 44} y="110" width="52" height="8" rx="4" fill="#6b6699" />
        <ZoneStrip zone={zone} y={26} h={22} round={11} />
        <g transform={`translate(${x} ${64 - Math.sin(pos * Math.PI) * 26})`}>
          <ellipse cx="0" cy="0" rx="26" ry="9" fill="#e8b06a" stroke="#c98b3f" strokeWidth="2" transform={`rotate(${(pos - 0.5) * 120})`} />
          <circle cx="4" cy="-2" r="3" fill="#ffd9a0" />
        </g>
      </>
    ),

    /* ───── Basketball hoop ───── */
    hoop: (
      <>
        <rect x="0" y="140" width="300" height="30" fill="#8a5a3a" />
        <g transform={`translate(${zx} 0)`}>
          <rect x="-24" y="10" width="48" height="36" rx="4" fill="#e8e6f5" stroke="#9aa3c2" strokeWidth="2" />
          <rect x="-9" y="22" width="18" height="14" fill="none" stroke="#e0445a" strokeWidth="2" />
          <path d="M-16 46 h32" stroke="#e0445a" strokeWidth="3" />
          <path d="M-14 48 l4 16 h20 l4 -16" fill="none" stroke="#f5f0ff" strokeWidth="2" opacity="0.8" />
        </g>
        <ZoneStrip zone={zone} y={58} h={22} />
        <g transform={`translate(${x} ${112 - Math.sin(pos * Math.PI) * 52})`}>
          <circle r="13" fill="#e8873a" stroke="#a85c20" strokeWidth="2" />
          <path d="M-13 0 h26 M0 -13 v26" stroke="#a85c20" strokeWidth="1.6" />
        </g>
      </>
    ),

    /* ───── Theatre stage with a moving spotlight ───── */
    stage: (
      <>
        <rect x="0" y="0" width="300" height="170" fill="#241c48" />
        <path d="M0 0 h64 q-14 60 6 120 h-70 z" fill="#8a2f4f" />
        <path d="M300 0 h-64 q14 60 -6 120 h70 z" fill="#8a2f4f" />
        <rect x="0" y="128" width="300" height="42" fill="#5a3a24" />
        <text x={zx - 13} y="150" fontSize="24">🎭</text>
        <ZoneStrip zone={zone} y={112} h={18} />
        <g transform={`translate(${x} 0)`}>
          <path d="M-26 0 L26 0 L44 124 L-44 124 Z" fill="#fff6d6" opacity="0.22" />
          <circle cx="0" cy="124" r="22" fill="#fff6d6" opacity="0.3" />
          <circle cx="0" cy="8" r="9" fill="#ffe7b0" stroke={glow} strokeWidth="2" />
        </g>
      </>
    ),

    /* ───── Landing approach ───── */
    plane: (
      <>
        <rect x="0" y="0" width="300" height="118" fill="#2a2a66" />
        <circle cx="250" cy="34" r="16" fill="#ffd37a" opacity="0.6" />
        <rect x="0" y="118" width="300" height="52" fill="#3b4a2f" />
        <path d="M110 170 L140 118 L170 118 L200 170 Z" fill="#4a4a58" />
        <path d="M150 124 v40" stroke="#f5f0ff" strokeWidth="2" strokeDasharray="8 8" />
        <ZoneStrip zone={zone} y={96} h={18} />
        <g transform={`translate(${x} ${40 + pos * 40})`}>
          <path d="M-22 0 L10 -5 L22 0 L10 5 Z" fill="#e8e6f5" stroke={glow} strokeWidth="2" />
          <path d="M-4 -4 L-14 -16 M-4 4 L-14 16" stroke="#c9c3e6" strokeWidth="3" />
        </g>
      </>
    ),

    /* ───── Docking with the station ───── */
    space: (
      <>
        <rect x="0" y="0" width="300" height="170" fill="#0b1030" />
        {[[30, 28], [80, 60], [140, 22], [210, 48], [268, 96], [54, 120], [176, 140]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="1.6" fill="#fff" opacity="0.8" />)}
        <g transform={`translate(${zx + 46} 85)`}>
          <rect x="-16" y="-34" width="32" height="68" rx="8" fill="#c9c3e6" />
          <rect x="-34" y="-8" width="20" height="16" rx="3" fill="#9aa3c2" />
          <circle cx="-26" cy="0" r="9" fill="none" stroke="#7ef0c1" strokeWidth="3" />
        </g>
        <ZoneStrip zone={zone} y={70} h={30} />
        <g transform={`translate(${x} 85)`}>
          <rect x="-20" y="-12" width="40" height="24" rx="10" fill="#e8e6f5" stroke={glow} strokeWidth="2" />
          <path d="M-20 0 L-34 -8 L-34 8 Z" fill="#ff9a4d" />
        </g>
      </>
    ),

    /* ───── Crane dropping a beam onto the column ───── */
    beam: (
      <>
        <rect x="0" y="140" width="300" height="30" fill="#3a3560" />
        <rect x="20" y="20" width="10" height="120" fill="#6b6699" />
        <rect x="20" y="20" width="240" height="8" fill="#6b6699" />
        <rect x={zx - 40} y="96" width="24" height="46" fill="#8a7fb8" />
        <rect x={zx + 16} y="96" width="24" height="46" fill="#8a7fb8" />
        <ZoneStrip zone={zone} y={78} h={20} />
        <g transform={`translate(${x} 0)`}>
          <path d="M0 28 v34" stroke="#c9c3e6" strokeWidth="2" />
          <rect x="-40" y="62" width="80" height="14" rx="3" fill="#f4c95d" stroke={glow} strokeWidth="2" />
        </g>
      </>
    ),

    /* ───── Fine line work (tattoo, welding, engraving) ───── */
    tattoo: (
      <>
        <rect x="16" y="74" width="268" height="66" rx="20" fill="#e6ab84" />
        <path d="M30 108 q60 -22 120 0 t120 -6" fill="none" stroke="#b8845c" strokeWidth="2" strokeDasharray="6 6" />
        <ZoneStrip zone={zone} y={92} h={28} />
        <g transform={`translate(${x} 46)`}>
          <rect x="-5" y="-26" width="10" height="30" rx="4" fill="#4b2a86" />
          <path d="M0 4 v18" stroke={glow} strokeWidth="3" />
        </g>
      </>
    ),

    /* ───── Camera viewfinder ───── */
    camera: (
      <>
        <rect x="10" y="12" width="280" height="118" rx="10" fill="#141a3a" stroke="#6b6699" strokeWidth="2" />
        <text x={zx - 20} y="88" fontSize="38">🦩</text>
        <path d="M22 24 h22 M22 24 v18 M278 24 h-22 M278 24 v18 M22 118 h22 M22 118 v-18 M278 118 h-22 M278 118 v-18" stroke="#7ef0c1" strokeWidth="3" />
        <ZoneStrip zone={zone} y={44} h={56} round={10} />
        <g transform={`translate(${x} 0)`}>
          <path d="M0 16 v112" stroke={glow} strokeWidth="2" strokeDasharray="6 5" opacity="0.9" />
          <circle cx="0" cy="70" r="12" fill="none" stroke={glow} strokeWidth="2" />
          <path d="M-18 70 h10 M8 70 h10 M0 52 v10 M0 78 v10" stroke={glow} strokeWidth="2" />
        </g>
        <text x="132" y="152" fontSize="16">📷</text>
      </>
    ),

    /* ───── Pipette into the test tube ───── */
    lab: (
      <>
        <rect x="0" y="136" width="300" height="34" fill="#2b2240" />
        {[zx - 56, zx, zx + 56].map((cx, i) => (
          <g key={i} transform={`translate(${cx} 92)`}>
            <rect x="-12" y="0" width="24" height="46" rx="10" fill="#bfe9ff" opacity="0.35" stroke="#9aa3c2" />
            <rect x="-12" y="24" width="24" height="22" rx="10" fill={['#7ef0c1', '#ff8fc4', '#ffd37a'][i]} opacity="0.85" />
          </g>
        ))}
        <ZoneStrip zone={zone} y={76} h={22} />
        <g transform={`translate(${x} 30)`}>
          <rect x="-5" y="-18" width="10" height="28" rx="4" fill="#e8e6f5" stroke="#9aa3c2" />
          <path d="M0 10 v16" stroke={glow} strokeWidth="3" />
          <circle cx="0" cy="30" r="4" fill="#7ef0c1" />
        </g>
      </>
    ),

    /* ───── Bench press ───── */
    gym: (
      <>
        <rect x="0" y="142" width="300" height="28" fill="#2b2240" />
        <rect x="70" y="112" width="160" height="16" rx="6" fill="#4b2a86" />
        <rect x="86" y="128" width="12" height="16" fill="#3a3560" />
        <rect x="204" y="128" width="12" height="16" fill="#3a3560" />
        <circle cx="132" cy="104" r="12" fill="#f7cba9" />
        <rect x="142" y="96" width="70" height="18" rx="9" fill="#6b3fc4" />
        <VZone y={96 - zone.center * 60} h={Math.max(16, zone.width * 90)} label="Lock out here" />
        <g transform={`translate(0 ${96 - pos * 60})`}>
          <rect x="44" y="-4" width="212" height="8" rx="4" fill="#c9c3e6" stroke={glow} strokeWidth="2" />
          <rect x="44" y="-20" width="18" height="40" rx="4" fill="#2b2240" />
          <rect x="238" y="-20" width="18" height="40" rx="4" fill="#2b2240" />
          <rect x="66" y="-14" width="12" height="28" rx="3" fill="#4a4470" />
          <rect x="222" y="-14" width="12" height="28" rx="3" fill="#4a4470" />
        </g>
      </>
    ),

    /* ───── Scissors over a strand of hair ───── */
    scissors: (
      <>
        <ellipse cx="150" cy="150" rx="70" ry="26" fill="#f7cba9" />
        <path d="M84 150 q10 -96 66 -96 t66 96" fill="#5a3825" />
        {[100, 120, 140, 160, 180, 200].map((sx) => <path key={sx} d={`M${sx} 62 q6 40 0 76`} stroke="#4a2c1c" strokeWidth="5" fill="none" />)}
        <ZoneStrip zone={zone} y={56} h={26} />
        <g transform={`translate(${x} 24)`}>
          <path d="M-10 0 L0 18 L10 0" fill="none" stroke={glow} strokeWidth="3" />
          <circle cx="-12" cy="-4" r="5" fill="none" stroke="#c9c3e6" strokeWidth="2" />
          <circle cx="12" cy="-4" r="5" fill="none" stroke="#c9c3e6" strokeWidth="2" />
        </g>
      </>
    ),

    /* ───── Shot on goal ───── */
    goal: (
      <>
        <rect x="0" y="120" width="300" height="50" fill="#3f7a4a" />
        <rect x="34" y="30" width="232" height="90" fill="none" stroke="#f5f0ff" strokeWidth="4" />
        {[70, 110, 150, 190, 230].map((gx) => <path key={gx} d={`M${gx} 30 v90`} stroke="#f5f0ff" strokeWidth="1" opacity="0.5" />)}
        {[52, 74, 96].map((gy) => <path key={gy} d={`M34 ${gy} h232`} stroke="#f5f0ff" strokeWidth="1" opacity="0.5" />)}
        <g transform="translate(150 112)"><text x="-14" y="6" fontSize="22">🧤</text></g>
        <ZoneStrip zone={zone} y={40} h={56} round={10} />
        <g transform={`translate(${x} ${124 - Math.sin(pos * Math.PI) * 70})`}>
          <circle r="12" fill="#f5f0ff" stroke="#2b2240" strokeWidth="2" />
          <path d="M-6 -4 L0 -8 L6 -4 L4 4 L-4 4 Z" fill="#2b2240" />
        </g>
      </>
    ),

    /* ───── Runway pose in front of the flashes ───── */
    runway: (
      <>
        <rect x="0" y="0" width="300" height="170" fill="#1b1852" />
        <path d="M110 170 L134 60 L166 60 L190 170 Z" fill="#e8e6f5" opacity="0.9" />
        {[30, 62, 238, 270].map((fx, i) => <circle key={fx} cx={fx} cy={60 + (i % 2) * 30} r={Math.abs(pos - zone.center) < zone.width ? 12 : 7} fill="#fff6d6" opacity="0.75" />)}
        <ZoneStrip zone={zone} y={128} h={26} />
        <g transform={`translate(${x} 0)`}>
          <text x="-17" y="126" fontSize="34">💃</text>
          <circle cx="0" cy="140" r="5" fill={glow} />
        </g>
      </>
    ),

    /* ───── Boxing: land the punch ───── */
    punch: (
      <>
        <rect x="0" y="130" width="300" height="40" fill="#5a2a3a" />
        <path d="M20 130 v-96 M280 130 v-96" stroke="#c9c3e6" strokeWidth="4" />
        <path d="M20 44 h260 M20 76 h260" stroke="#e8e6f5" strokeWidth="2" opacity="0.5" />
        <g transform={`translate(${zx} 92)`}>
          <circle r="22" fill="#e6ab84" />
          <path d="M-22 -6 q22 -26 44 0 q-22 -10 -44 0" fill="#3a2a22" />
          <circle cx="-8" cy="-2" r="2.5" fill="#2b2240" />
          <circle cx="8" cy="-2" r="2.5" fill="#2b2240" />
          <path d="M-9 10 q9 7 18 0" stroke="#2b2240" strokeWidth="2" fill="none" />
        </g>
        <ZoneStrip zone={zone} y={78} h={30} />
        <g transform={`translate(${x} 128)`}>
          <circle r="16" fill="#e0445a" stroke={glow} strokeWidth="2" />
          <path d="M-8 0 h16" stroke="#8a1f2f" strokeWidth="3" />
        </g>
      </>
    ),

    /* ───── State banquet: serve the guest in the green seat ───── */
    banquet: (
      <>
        <rect x="0" y="0" width="300" height="170" rx="16" fill="#241c48" />
        <path d="M0 40 h300" stroke="#4b3f7a" strokeWidth="2" />
        {[40, 150, 260].map((cx) => (
          <g key={cx}>
            <path d={`M${cx - 3} 18 h6 v22 h-6 z`} fill="#f4c95d" />
            <ellipse cx={cx} cy="14" rx="3" ry="5" fill="#ffd37a" />
          </g>
        ))}
        <rect x="10" y="96" width="280" height="14" rx="4" fill="#6b4a2f" />
        <rect x="10" y="88" width="280" height="10" rx="3" fill="#f2ece2" />
        {[46, 96, 146, 196, 246].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="74" r="12" fill="#e6ab84" />
            <circle cx={cx - 4} cy="72" r="1.6" fill="#2b2240" />
            <circle cx={cx + 4} cy="72" r="1.6" fill="#2b2240" />
            <ellipse cx={cx} cy="93" rx="13" ry="4" fill="#f7f5fc" />
            <ellipse cx={cx} cy="93" rx="7" ry="2" fill="#e3dff0" />
          </g>
        ))}
        <ZoneStrip zone={zone} y={84} h={22} />
        <g transform={`translate(${x} 46)`}>
          <ellipse cx="0" cy="0" rx="16" ry="5" fill="#c9c3e6" stroke={glow} strokeWidth="2" />
          <path d="M-6 -6 q6 -8 12 0" fill="none" stroke="#ffd37a" strokeWidth="2" />
          <path d="M0 5 v12" stroke={glow} strokeWidth="2" />
        </g>
      </>
    ),

    /* ───── Balcony wave: greet the crowd where they're loudest ───── */
    balcony: (
      <>
        <rect x="0" y="0" width="300" height="170" rx="16" fill="#1d1a4d" />
        <rect x="0" y="0" width="300" height="68" fill="#3a2f6e" />
        <rect x="24" y="8" width="252" height="54" rx="6" fill="#2a2360" stroke="#6b5fae" strokeWidth="2" />
        <path d="M24 62 h252" stroke="#8a7fc4" strokeWidth="4" />
        {[40, 70, 100, 130, 160, 190, 220, 250].map((bx) => <path key={bx} d={`M${bx} 62 v16`} stroke="#8a7fc4" strokeWidth="4" />)}
        <path d="M24 78 h252" stroke="#c9c3e6" strokeWidth="5" />
        <g transform="translate(150 40)">
          <circle cy="-4" r="13" fill="#f7cba9" />
          <path d="M-13 -10 q13 -14 26 0 q-13 -6 -26 0" fill="#5a3825" />
          <path d="M-9 -16 l3 -7 l4 5 l2 -8 l4 8 l4 -5 l3 7 z" fill="#f4c95d" />
          <rect x="-10" y="10" width="20" height="18" rx="7" fill="#e0445a" />
        </g>
        {[[18, 120], [50, 132], [86, 118], [120, 134], [156, 120], [192, 132], [228, 118], [262, 130]].map(([cx, cy]) => (
          <g key={cx}>
            <circle cx={cx} cy={cy} r="9" fill="#e6ab84" />
            <rect x={cx - 7} y={cy + 8} width="14" height="16" rx="5" fill="#5a4fa8" />
            <path d={`M${cx + 7} ${cy - 6} l10 -5 v10 z`} fill="#ff8fc4" />
          </g>
        ))}
        <ZoneStrip zone={zone} y={104} h={22} />
        <g transform={`translate(${x} 150)`}>
          <text x="-9" y="6" fontSize="17">🎉</text>
          <path d="M0 -12 v-8" stroke={glow} strokeWidth="2" />
        </g>
      </>
    ),

    /* ───── Coronation: lower the crown onto the head ───── */
    throne: (
      <>
        <rect x="0" y="0" width="300" height="170" rx="16" fill="#241c48" />
        <path d="M0 0 h300 v40 H0 z" fill="#3a2f6e" opacity="0.6" />
        <path d="M110 170 V96 q40 -28 80 0 v74 z" fill="#7a2f4f" />
        <rect x="104" y="150" width="92" height="20" rx="4" fill="#5c2340" />
        <path d="M118 96 q32 -22 64 0" fill="none" stroke="#f4c95d" strokeWidth="3" />
        <g transform={`translate(${zx} 0)`}>
          <circle cy="118" r="18" fill="#f7cba9" />
          <path d="M-18 112 q18 -20 36 0 q-18 -8 -36 0" fill="#3a2a22" />
          <circle cx="-6" cy="116" r="2" fill="#2b2240" />
          <circle cx="6" cy="116" r="2" fill="#2b2240" />
          <path d="M-7 126 q7 6 14 0" stroke="#2b2240" strokeWidth="2" fill="none" />
        </g>
        <ZoneStrip zone={zone} y={86} h={22} />
        <g transform={`translate(${x} 52)`}>
          <path d="M-16 12 L-14 -6 L-6 2 L0 -12 L6 2 L14 -6 L16 12 Z" fill="#f4c95d" stroke={glow} strokeWidth="2" />
          <circle cx="0" cy="7" r="2.4" fill="#e0445a" />
        </g>
      </>
    ),

    /* ───── Safe dial ───── */
    dial: (
      <>
        <rect x="60" y="14" width="180" height="146" rx="12" fill="#3a3560" stroke="#6b6699" strokeWidth="3" />
        <circle cx="150" cy="86" r="52" fill="#2b2240" stroke="#c9c3e6" strokeWidth="4" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={150 + Math.cos(a) * 42} cy={86 + Math.sin(a) * 42} r="2" fill="#c9c3e6" />;
        })}
        <DialZone zone={zone} />
        <g transform={`translate(150 86) rotate(${pos * 320 - 160})`}>
          <rect x="-3" y="-44" width="6" height="46" rx="3" fill={glow} />
        </g>
        <circle cx="150" cy="86" r="7" fill="#c9c3e6" />
      </>
    ),
  };

  return (
    <svg className={`scene ${state}`} viewBox={`0 0 ${W} 170`} role="img" aria-label={`${scene} scene`}>
      <rect x="0" y="0" width={W} height="170" rx="16" fill="#181446" />
      {scenes[scene]}
    </svg>
  );
}

/** Breathing circles for the meditation game. */
export function BreathScene({ scale, state }: { scale: number; state: 'idle' | 'hit' | 'miss' }) {
  const r = 24 + scale * 46;
  const glow = state === 'hit' ? '#7ef0c1' : state === 'miss' ? '#ff7a8a' : '#ff9ec7';
  return (
    <svg className="scene" viewBox="0 0 300 170" role="img" aria-label="Breathing circles">
      <rect x="0" y="0" width="300" height="170" rx="16" fill="#141138" />
      {[0, 1, 2].map((i) => <circle key={i} cx="150" cy="85" r={r + i * 12} fill="none" stroke={glow} strokeOpacity={0.18 - i * 0.05} strokeWidth="2" />)}
      <circle cx="150" cy="85" r="70" fill="none" stroke="#7ef0c1" strokeWidth="2" strokeDasharray="4 6" opacity="0.5" />
      <circle cx="150" cy="85" r={r} fill={glow} fillOpacity="0.22" stroke={glow} strokeWidth="3" />
      <text x="150" y="92" fontSize="26" textAnchor="middle">🧘</text>
    </svg>
  );
}

/** Bookshelf for the "find the book" game. */
export function ShelfScene({ books, onPick, picked, target }: {
  books: { color: string; label: string }[];
  onPick: (i: number) => void;
  picked: number | null;
  target: number;
}) {
  return (
    <svg className="scene tall" viewBox="0 0 300 170" role="img" aria-label="Bookshelf">
      <rect x="0" y="0" width="300" height="170" rx="16" fill="#2a2140" />
      <rect x="10" y="12" width="280" height="146" rx="8" fill="#4a3520" />
      <rect x="18" y="20" width="264" height="60" fill="#2d1f13" />
      <rect x="18" y="90" width="264" height="60" fill="#2d1f13" />
      {books.map((b, i) => {
        const row = i < 6 ? 0 : 1;
        const col = i % 6;
        const bx = 26 + col * 42;
        const by = 24 + row * 70;
        const h = 52 - (i % 3) * 4;
        return (
          <g key={i} onClick={() => onPick(i)} style={{ cursor: 'pointer' }}>
            <rect x={bx} y={by + (52 - h)} width="32" height={h} rx="3" fill={b.color}
              stroke={picked === null ? '#00000055' : i === target ? '#7ef0c1' : picked === i ? '#ff7a8a' : '#00000055'} strokeWidth={picked === null ? 1 : 3} />
            <text x={bx + 16} y={by + 30} fontSize="13" textAnchor="middle" fill="#ffffffcc" style={{ pointerEvents: 'none' }}>{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Sneaking past a guard: the room, the guard's eyeline and how far you've crept. */
export function SneakScene({ state, progress, moves, place }: {
  state: 'watching' | 'turning' | 'away';
  progress: number;
  moves: number;
  place: 'shop' | 'bank' | 'prison';
}) {
  const px = 40 + (progress / moves) * 190;
  const watching = state === 'watching';
  const cone = watching ? '#ff7a8a' : state === 'turning' ? '#ffd37a' : '#7ef0c1';
  const floor = place === 'prison' ? '#3b3a52' : place === 'bank' ? '#4a3f6b' : '#4a3560';

  return (
    <svg className="scene" viewBox="0 0 300 170" role="img" aria-label="Sneaking past a guard">
      <rect x="0" y="0" width="300" height="170" rx="16" fill="#181446" />
      <rect x="0" y="120" width="300" height="50" fill={floor} />

      {place === 'shop' && [20, 74, 128].map((sx) => (
        <g key={sx}>
          <rect x={sx} y="42" width="44" height="78" rx="4" fill="#2f2857" stroke="#4d447e" />
          <path d={`M${sx} 68 h44 M${sx} 94 h44`} stroke="#4d447e" strokeWidth="2" />
          <text x={sx + 6} y="62" fontSize="13">🧴</text>
          <text x={sx + 24} y="62" fontSize="13">🍫</text>
          <text x={sx + 6} y="88" fontSize="13">🧃</text>
          <text x={sx + 24} y="88" fontSize="13">🍪</text>
        </g>
      ))}
      {place === 'bank' && (
        <>
          <rect x="196" y="34" width="86" height="86" rx="8" fill="#2f2857" stroke="#c9c3e6" strokeWidth="3" />
          <circle cx="239" cy="77" r="22" fill="none" stroke="#c9c3e6" strokeWidth="4" />
          <circle cx="239" cy="77" r="5" fill="#c9c3e6" />
          <text x="26" y="70" fontSize="20">💰</text>
          <text x="62" y="70" fontSize="20">💵</text>
        </>
      )}
      {place === 'prison' && (
        <>
          {[24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264].map((bx) => <path key={bx} d={`M${bx} 18 v102`} stroke="#8e8ab5" strokeWidth="5" />)}
          <path d="M14 18 h272" stroke="#8e8ab5" strokeWidth="6" />
          <path d="M232 26 l24 -12 v106 l-24 -10 z" fill="#181446" opacity="0.9" />
          <text x="236" y="86" fontSize="18">🪜</text>
        </>
      )}

      {/* the guard, and where they're looking */}
      <g transform="translate(262 96)">
        <path d={watching ? 'M0 -14 L-70 -44 L-70 34 Z' : 'M0 -14 L48 -44 L48 34 Z'} fill={cone} opacity="0.16" />
        <circle cy="-18" r="13" fill="#e6ab84" />
        <rect x="-11" y="-6" width="22" height="30" rx="8" fill={place === 'prison' ? '#3f6fa8' : '#5a4fa8'} />
        {watching
          ? <><circle cx="-5" cy="-20" r="2.4" fill="#2b2240" /><circle cx="5" cy="-20" r="2.4" fill="#2b2240" /></>
          : <path d="M-7 -20 q7 5 14 0" stroke="#2b2240" strokeWidth="2" fill="none" />}
        <text x="-14" y="-32" fontSize="13">{watching ? '👀' : state === 'turning' ? '⚠️' : '🙈'}</text>
      </g>

      {/* you, creeping towards the way out */}
      <g transform={`translate(${px} 96)`}>
        <circle cy="-16" r="12" fill="#f7cba9" />
        <rect x="-10" y="-4" width="20" height="28" rx="8" fill="#b06bd6" />
        <circle cx="-4" cy="-18" r="2.2" fill="#2b2240" />
        <circle cx="4" cy="-18" r="2.2" fill="#2b2240" />
      </g>
      {Array.from({ length: moves }, (_, i) => (
        <circle key={i} cx={40 + ((i + 1) / moves) * 190} cy="134" r="4" fill={i < progress ? '#7ef0c1' : '#4d447e'} />
      ))}
      <text x="238" y="140" fontSize="14">🚪</text>
    </svg>
  );
}
