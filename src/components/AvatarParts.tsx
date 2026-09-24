/* Clothes and accessories for the Avatar. All drawn in a 100×100 viewBox. */

const BODY = 'M14 100 C16 82 33 76 50 76 C67 76 84 82 86 100 Z';
const GOLD = '#f4c95d';
const PINK = '#ff6fa8';
const INK = '#2b2240';

/** Clothes clipped to this sit exactly on the body, however they're drawn. */
const BODY_CLIP = 'ev-body-clip';
const BodyClip = () => (
  <defs>
    <clipPath id={BODY_CLIP}><path d={BODY} /></clipPath>
  </defs>
);

/** Lighten (amt > 0) or darken (amt < 0) a hex color. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const mix = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function heart(cx: number, cy: number, s: number) {
  return `M${cx} ${cy + s * 0.9} C${cx - s * 1.6} ${cy - s * 0.2} ${cx - s * 0.6} ${cy - s * 1.3} ${cx} ${cy - s * 0.4} C${cx + s * 0.6} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * 0.2} ${cx} ${cy + s * 0.9} Z`;
}

function star(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  });
  return pts.join(' ');
}

/* ───────── Tops ───────── */

export function Top({ top, color, skin }: { top: string; color: string; skin: string }) {
  const dark = shade(color, -0.25);
  const light = shade(color, 0.35);
  switch (top) {
    case 'onesie':
      return <g><path d={BODY} fill="#ffd1e6" /><circle cx="50" cy="88" r="2" fill="#fff" /><circle cx="50" cy="95" r="2" fill="#fff" /></g>;
    case 'tank':
      return (
        <g>
          <path d={BODY} fill={skin} />
          <path d="M30 100 C31 90 33 82 36 78 L40 78 Q50 88 60 78 L64 78 C67 82 69 90 70 100 Z" fill={color} />
        </g>
      );
    case 'hoodie':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M35 78 Q50 69 65 78 Q58 85 50 85 Q42 85 35 78 Z" fill={dark} />
          <path d="M46 84 L45 94 M54 84 L55 94" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="45" cy="94.5" r="1.2" fill="#fff" /><circle cx="55" cy="94.5" r="1.2" fill="#fff" />
        </g>
      );
    case 'sweater':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M40 77 Q50 86 60 77" stroke={dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M22 92 L28 88 L34 92 L40 88 L46 92 L52 88 L58 92 L64 88 L70 92 L76 88" stroke={light} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
        </g>
      );
    case 'overalls':
      return (
        <g>
          <path d={BODY} fill="#f5f0ff" />
          <path d="M41 77 Q50 84 59 77" fill={skin} />
          <path d="M35 100 L37.5 86 L62.5 86 L65 100 Z" fill={color} />
          <path d="M38 86 L33 78 M62 86 L67 78" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <circle cx="39.5" cy="87.5" r="1.6" fill={GOLD} /><circle cx="60.5" cy="87.5" r="1.6" fill={GOLD} />
          <rect x="45" y="90" width="10" height="6" rx="1.5" fill={dark} />
        </g>
      );
    case 'shirt':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M41.5 76.5 L50 86 L45.5 88.5 Z M58.5 76.5 L50 86 L54.5 88.5 Z" fill={light} />
          <circle cx="50" cy="90.5" r="1.2" fill={dark} /><circle cx="50" cy="96" r="1.2" fill={dark} />
        </g>
      );
    case 'turtleneck':
      return (
        <g>
          <path d={BODY} fill={color} />
          <rect x="41.5" y="68" width="17" height="13" rx="5" fill={color} />
          <path d="M44 70 L44 79 M47.5 70 L47.5 80 M51 70 L51 80 M54.5 70 L54.5 80 M58 70 L58 79" stroke={dark} strokeWidth="0.8" />
        </g>
      );
    case 'jersey':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M42 77 L50 87 L58 77 Z" fill={skin} />
          <path d="M42 77 L50 87 L58 77" stroke="#fff" strokeWidth="2" fill="none" strokeLinejoin="round" />
          <text x="50" y="98.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Outfit, sans-serif">7</text>
        </g>
      );
    case 'varsity':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M14 100 C15 92 18 86 22 83 L28 100 Z M86 100 C85 92 82 86 78 83 L72 100 Z" fill="#f5f0ff" />
          <path d="M41 77 Q50 85 59 77" stroke={INK} strokeWidth="3" fill="none" />
          <text x="37" y="95" textAnchor="middle" fontSize="9" fontWeight="800" fill="#f5f0ff" fontFamily="Fraunces, serif" fontStyle="italic">E</text>
        </g>
      );
    case 'puffer':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M20 88 Q50 83 80 88 M16 95 Q50 90 84 95" stroke={dark} strokeWidth="1.5" fill="none" />
          <path d="M40 77 Q50 72 60 77 L58 82 Q50 79 42 82 Z" fill={dark} />
          <path d="M50 81 L50 100" stroke={dark} strokeWidth="1.2" />
        </g>
      );
    case 'leather':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M44 77 L50 91 L56 77 Z" fill="#f5f0ff" />
          <path d="M44 77 L39 84 L47 91 Z M56 77 L61 84 L53 91 Z" fill={light} />
          <path d="M63 86 L66 100" stroke="#c9c3e6" strokeWidth="1" />
        </g>
      );
    case 'kimono':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M42 77 L57 100 M58 77 L47 93" stroke={light} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="20" y="94" width="60" height="6" fill={PINK} />
          {[[30, 86], [70, 90], [24, 96]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.8" fill={light} opacity="0.8" />)}
        </g>
      );
    case 'labcoat':
      return (
        <g>
          <path d={BODY} fill="#f7f5fc" />
          <path d="M43 77 L50 90 L57 77 Z" fill={color} />
          <path d="M43 77 L38 86 L48 94 M57 77 L62 86 L52 94" stroke="#c9c3e6" strokeWidth="1.3" fill="none" />
          <rect x="60" y="88" width="9" height="7" rx="1" fill="none" stroke="#c9c3e6" strokeWidth="1" />
          <path d="M63 85 L63 90" stroke={PINK} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case 'suit':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M43 77 L50 93 L57 77 Z" fill="#fff" />
          <path d="M48.5 79.5 L51.5 79.5 L52.7 89 L50 93 L47.3 89 Z" fill={PINK} />
          <path d="M43 77 L39 86 L47 93 Z M57 77 L61 86 L53 93 Z" fill={dark} />
        </g>
      );
    case 'dress':
      return (
        <g>
          <path d={BODY} fill={skin} />
          <path d="M24 100 C26 92 30 86 34 84 Q50 90 66 84 C70 86 74 92 76 100 Z" fill={color} />
          <path d="M36 84.5 L38.5 77 M64 84.5 L61.5 77" stroke={color} strokeWidth="2" strokeLinecap="round" />
          {[38, 44, 50, 56, 62].map((x) => <circle key={x} cx={x} cy={87 + Math.abs(x - 50) * -0.05} r="1.6" fill={light} />)}
        </g>
      );
    case 'gown':
      return (
        <g>
          <path d={BODY} fill={skin} />
          <path d="M20 100 C22 92 28 85 32 83 Q50 89 68 83 C72 85 78 92 80 100 Z" fill={color} />
          {[[30, 92], [44, 96], [58, 91], [70, 96], [38, 88], [64, 88]].map(([x, y]) => <polygon key={`${x}${y}`} points={star(x, y, 1.8)} fill="#fff" opacity="0.85" />)}
        </g>
      );
    case 'spacesuit':
      return (
        <g>
          <path d={BODY} fill="#eef0f8" />
          <ellipse cx="50" cy="77.5" rx="12" ry="4" fill="none" stroke="#9aa3c2" strokeWidth="3" />
          <circle cx="36" cy="90" r="4.5" fill={color} /><polygon points={star(36, 90, 2.4)} fill="#fff" />
          <rect x="58" y="86" width="9" height="6" rx="1" fill={PINK} />
          <path d="M20 96 L80 96" stroke="#c9cde0" strokeWidth="1.2" />
        </g>
      );
    case 'pajamas':
      return (
        <g>
          <path d={BODY} fill={light} />
          {[[26, 84], [38, 92], [50, 82], [62, 92], [74, 86], [32, 96], [56, 96]].map(([x, y]) => <text key={`${x}${y}`} x={x} y={y} fontSize="6" opacity="0.7">☁️</text>)}
          <path d="M41 77 Q50 85 59 77" stroke={dark} strokeWidth="2.4" fill="none" />
        </g>
      );
    case 'croptop':
      return (
        <g>
          <BodyClip />
          <path d={BODY} fill={skin} />
          <g clipPath={`url(#${BODY_CLIP})`}>
            <path d="M8 74 h84 v16 q-42 7 -84 0 z" fill={color} />
            <path d="M8 74 h84 v3 h-84 z" fill={dark} opacity="0.5" />
          </g>
          <path d="M41 76.5 Q50 84 59 76.5 Z" fill={skin} />
        </g>
      );
    case 'apron':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M40 78 L60 78 L64 100 L36 100 Z" fill="#f7f5fc" />
          <path d="M40 78 Q50 84 60 78" stroke="#e3dff0" strokeWidth="1.4" fill="none" />
          <rect x="44" y="88" width="12" height="7" rx="1.5" fill="none" stroke="#d9d3ea" strokeWidth="1.1" />
        </g>
      );
    case 'swimsuit':
      return (
        <g>
          <BodyClip />
          <path d={BODY} fill={skin} />
          <g clipPath={`url(#${BODY_CLIP})`}>
            <path d="M30 72 C32 84 30 92 26 100 L74 100 C70 92 68 84 70 72 Z" fill={color} />
            <path d="M36 72 q14 10 28 0 v-6 h-28 z" fill={skin} />
            {[[40, 88], [58, 92], [50, 96]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.7" fill="#fff" opacity="0.85" />)}
          </g>
          <path d="M34 76 q6 -1 7 1 M66 76 q-6 -1 -7 1" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'cardigan':
      return (
        <g>
          <path d={BODY} fill={light} />
          <path d="M38 77 L34 100 L20 100 C22 88 28 80 34 77 Z M62 77 L66 100 L80 100 C78 88 72 80 66 77 Z" fill={color} />
          <path d="M41 77 Q50 85 59 77" fill={skin} />
          {[84, 91, 98].map((y) => <circle key={y} cx="38.5" cy={y} r="1.3" fill={GOLD} />)}
        </g>
      );
    case 'tracksuit':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M24 82 L20 100 M76 82 L80 100" stroke="#f5f0ff" strokeWidth="2.6" strokeLinecap="round" />
          <rect x="41" y="70" width="18" height="12" rx="5" fill={dark} />
          <path d="M50 82 L50 100" stroke={dark} strokeWidth="1.6" />
          <circle cx="50" cy="86" r="1.4" fill={light} />
        </g>
      );
    case 'scrubs':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M42 76.5 L50 88 L58 76.5 Z" fill={skin} />
          <path d="M42 76.5 L50 88 L58 76.5" stroke={light} strokeWidth="1.6" fill="none" />
          <rect x="60" y="88" width="9" height="7" rx="1" fill="none" stroke={light} strokeWidth="1" />
          <path d="M30 88 h8 M34 84 v8" stroke="#f5f0ff" strokeWidth="1.6" />
        </g>
      );
    case 'raincoat':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M34 77 Q50 68 66 77 Q58 84 50 84 Q42 84 34 77 Z" fill={light} />
          <path d="M50 84 L50 100" stroke={dark} strokeWidth="1.4" />
          {[88, 95].map((y) => <circle key={y} cx="50" cy={y} r="1.4" fill={GOLD} />)}
          <rect x="18" y="90" width="64" height="4" fill="#f5f0ff" opacity="0.55" />
        </g>
      );
    case 'denim':
      return (
        <g>
          <path d={BODY} fill="#5b7bb5" />
          <path d="M43 77 L50 92 L57 77 Z" fill={color} />
          <path d="M43 77 L38 85 L47 92 M57 77 L62 85 L53 92" stroke="#e8e6f5" strokeWidth="1.1" fill="none" strokeDasharray="2 2" />
          <rect x="26" y="88" width="9" height="7" rx="1" fill="none" stroke="#e8e6f5" strokeWidth="1" strokeDasharray="2 2" />
        </g>
      );
    case 'tutu':
      return (
        <g>
          <path d={BODY} fill={skin} />
          <path d="M37 77 Q50 87 63 77 L65 88 L35 88 Z" fill={color} />
          <path d="M22 100 C26 90 34 86 50 86 C66 86 74 90 78 100 Z" fill={light} opacity="0.92" />
          <path d="M30 100 Q38 90 44 100 M50 88 L50 100 M56 100 Q62 90 70 100" stroke="#fff" strokeWidth="1" fill="none" opacity="0.7" />
        </g>
      );
    case 'blazer':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M43 77 L50 94 L57 77 Z" fill={light} />
          <path d="M43 77 L37 87 L47 94 Z M57 77 L63 87 L53 94 Z" fill={dark} />
          <rect x="58" y="88" width="8" height="5" rx="1" fill={light} opacity="0.7" />
          <circle cx="47" cy="96" r="1.2" fill={GOLD} />
        </g>
      );
    case 'wintercoat':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M30 78 Q50 70 70 78 Q68 86 50 86 Q32 86 30 78 Z" fill="#f2ece2" />
          <path d="M50 86 L50 100" stroke={dark} strokeWidth="1.6" />
          {[90, 96].map((y) => <circle key={y} cx="50" cy={y} r="1.6" fill={GOLD} />)}
          <path d="M18 96 Q50 92 82 96" stroke={dark} strokeWidth="1.4" fill="none" />
        </g>
      );
    case 'uniform':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M42 77 L50 90 L58 77 Z" fill={dark} />
          <path d="M28 80 L36 78 L37 86 L29 88 Z M72 80 L64 78 L63 86 L71 88 Z" fill={GOLD} />
          <path d="M33 84 L66 96" stroke={GOLD} strokeWidth="3" />
          {[[42, 88, '#e0445a'], [46, 90, '#6f8cff'], [38, 86, '#3fc1b0']].map(([x, y, col]) => <rect key={`${x}`} x={x as number} y={y as number} width="4" height="2.6" fill={col as string} />)}
          <circle cx="58" cy="92" r="2.4" fill={GOLD} />
        </g>
      );
    case 'tuxedo':
      return (
        <g>
          <path d={BODY} fill={INK} />
          <path d="M43 77 L50 95 L57 77 Z" fill="#fff" />
          <path d="M43 77 L38 87 L47 95 Z M57 77 L62 87 L53 95 Z" fill={color} />
          <path d="M50 80 L46 84 L50 86 L54 84 Z" fill={INK} />
          <circle cx="50" cy="91" r="1.2" fill={INK} />
        </g>
      );
    case 'wedding':
      return (
        <g>
          <path d={BODY} fill="#f7f5fc" />
          <path d="M18 100 C22 90 28 84 33 82 Q50 89 67 82 C72 84 78 90 82 100 Z" fill="#fffdfb" />
          <path d="M33 82 Q50 90 67 82" stroke="#e8e0f5" strokeWidth="1.4" fill="none" />
          {[[28, 94], [42, 90], [58, 92], [72, 95], [50, 96]].map(([x, y]) => <polygon key={`${x}${y}`} points={star(x, y, 1.7)} fill="#fff" opacity="0.9" />)}
          <path d="M36 82 L38.5 76 M64 82 L61.5 76" stroke="#f7f5fc" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'ballgown':
      return (
        <g>
          <BodyClip />
          <path d={BODY} fill={skin} />
          <g clipPath={`url(#${BODY_CLIP})`}>
            {/* skirt */}
            <path d="M6 86 h88 v20 h-88 z" fill={color} />
            {/* bodice */}
            <path d="M30 72 h40 v16 q-20 6 -40 0 z" fill={dark} />
            <path d="M30 86 q20 7 40 0 l2 4 q-22 7 -44 0 z" fill={light} opacity="0.85" />
            <path d="M50 90 L50 100 M34 92 L30 100 M66 92 L70 100" stroke={light} strokeWidth="1.2" opacity="0.6" />
            {[[24, 96], [40, 94], [58, 96], [74, 94], [50, 80]].map(([x, y]) => <polygon key={`${x}${y}`} points={star(x, y, 2)} fill="#fff" opacity="0.85" />)}
          </g>
          <path d="M41 76.5 Q50 83 59 76.5 Z" fill={skin} />
        </g>
      );
    case 'royal':
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M24 86 Q50 72 76 86 Q64 92 50 90 Q36 92 24 86 Z" fill="#fff" />
          {[30, 38, 46, 54, 62, 70].map((x, i) => <circle key={x} cx={x} cy={84 + (i % 2) * 2} r="0.9" fill={INK} />)}
          <circle cx="50" cy="90" r="2.6" fill={GOLD} />
        </g>
      );
    default: // tee
      return (
        <g>
          <path d={BODY} fill={color} />
          <path d="M41 76.5 Q50 85 59 76.5 Z" fill={skin} />
          <polygon points={star(62, 91, 3.2)} fill={light} />
        </g>
      );
  }
}

/* ───────── Accessories ───────── */

export function Neck({ id }: { id: string }) {
  switch (id) {
    case 'bowtie':
      return <g><path d="M50 79 L43 75.5 L43 82.5 Z M50 79 L57 75.5 L57 82.5 Z" fill={PINK} /><circle cx="50" cy="79" r="1.8" fill={shade(PINK, -0.2)} /></g>;
    case 'choker':
      return <g><path d="M42 77 Q50 81.5 58 77" stroke={INK} strokeWidth="2.4" fill="none" /><path d={heart(50, 81.5, 1.5)} fill={PINK} /></g>;
    case 'scarf':
      return <g><path d="M38 75 Q50 83 62 75 L63 80 Q50 89 37 80 Z" fill="#e0445a" /><rect x="54" y="80" width="6" height="15" rx="2" fill="#c7354a" /></g>;
    case 'pearlnecklace':
      return <g>{Array.from({ length: 9 }, (_, i) => { const x = 41 + i * 2.25; const y = 77 + Math.sin((i / 8) * Math.PI) * 5; return <circle key={i} cx={x} cy={y} r="1.2" fill="#fff" stroke="#e8e0f5" strokeWidth="0.3" />; })}</g>;
    case 'goldchain':
      return <g><path d="M41 77 Q50 87 59 77" stroke={GOLD} strokeWidth="1.6" fill="none" /><circle cx="50" cy="84" r="2.2" fill={GOLD} /></g>;
    case 'tie':
      return <g><path d="M46 76 L54 76 L52 81 L48 81 Z" fill="#e0445a" /><path d="M48 81 L52 81 L54 94 L50 98 L46 94 Z" fill="#e0445a" /></g>;
    case 'locket':
      return <g><path d="M41 77 Q50 86 59 77" stroke={GOLD} strokeWidth="1.2" fill="none" /><path d={heart(50, 85, 3)} fill={GOLD} stroke="#d9a93a" strokeWidth="0.5" /></g>;
    case 'medal':
      return (
        <g>
          <path d="M43 77 L50 87 L57 77" stroke="#6f8cff" strokeWidth="3.4" fill="none" strokeLinejoin="round" />
          <path d="M46 84 h8 v4 h-8 z" fill="#4f6fd8" />
          <circle cx="50" cy="92" r="5" fill={GOLD} stroke="#d9a93a" strokeWidth="0.8" />
          <polygon points={star(50, 92, 2.8)} fill="#fff6d6" />
        </g>
      );
    case 'sash':
      return (
        <g>
          <defs>
            <clipPath id="ev-sash-body"><path d={BODY} /></clipPath>
          </defs>
          <g clipPath="url(#ev-sash-body)">
            <path d="M36 70 L48 70 L76 104 L62 104 Z" fill="#2b6be0" />
            <path d="M36 70 L40 70 L68 104 L62 104 Z" fill="#f4c95d" opacity="0.9" />
          </g>
          <circle cx="66" cy="96" r="3.4" fill={GOLD} stroke="#d9a93a" strokeWidth="0.6" />
        </g>
      );
    default:
      return null;
  }
}

export function FaceDeco({ id }: { id: string }) {
  switch (id) {
    case 'freckles':
      return <g fill="#a0603a" opacity="0.55">{[[33, 58.5], [36.5, 60.5], [31, 61.5], [67, 58.5], [63.5, 60.5], [69, 61.5]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="0.85" />)}</g>;
    case 'beautymark':
      return <circle cx="61" cy="64.5" r="0.95" fill={INK} />;
    case 'heartsticker':
      return <path d={heart(68, 62.5, 2.2)} fill={PINK} stroke="#fff" strokeWidth="0.5" />;
    case 'starsticker':
      return <polygon points={star(68, 62, 2.8)} fill={GOLD} stroke="#fff" strokeWidth="0.5" />;
    case 'bandaid':
      return <g transform="rotate(-20 64 58)"><rect x="59" y="56.5" width="10" height="3.4" rx="1.7" fill="#f2c48d" /><rect x="62.5" y="56.5" width="3" height="3.4" fill="#e6ad6e" /></g>;
    case 'glitter':
      return <g>{[[32, 46], [40, 42], [62, 43], [70, 47], [36, 64], [66, 64]].map(([x, y]) => <polygon key={`${x}${y}`} points={star(x, y, 1.6)} fill="#ffe7b0" opacity="0.9" />)}</g>;
    case 'moustache':
      return <path d="M42 62.5 Q46 59.5 50 62 Q54 59.5 58 62.5 Q54 65.5 50 63.5 Q46 65.5 42 62.5 Z" fill={INK} opacity="0.85" />;
    case 'facepaint':
      return <g fill="none" strokeWidth="1.2" strokeLinecap="round">{['#ff6f6f', '#f4c95d', '#7ec46a', '#6f8cff'].map((c, i) => <path key={c} d={`M${28 + i} 64 Q${33} ${58 + i} ${38 - i} 64`} stroke={c} />)}</g>;
    default:
      return null;
  }
}

export function Earrings({ id }: { id: string }) {
  const at = [[24.5, 60], [75.5, 60]];
  return (
    <g>
      {at.map(([x, y]) => {
        switch (id) {
          case 'hoops': return <circle key={x} cx={x} cy={y + 2.5} r="3" fill="none" stroke={GOLD} strokeWidth="1.2" />;
          case 'starrings': return <polygon key={x} points={star(x, y + 2, 2.4)} fill={GOLD} />;
          case 'pearls': return <circle key={x} cx={x} cy={y + 0.5} r="1.9" fill="#fff" stroke="#e8e0f5" strokeWidth="0.4" />;
          case 'diamonds': return <g key={x}><rect x={x - 1.7} y={y - 1.2} width="3.4" height="3.4" transform={`rotate(45 ${x} ${y + 0.5})`} fill="#bfe9ff" /><circle cx={x + 0.6} cy={y} r="0.5" fill="#fff" /></g>;
          default: return <circle key={x} cx={x} cy={y} r="1.4" fill={GOLD} />;
        }
      })}
    </g>
  );
}

export function Glasses({ id }: { id: string }) {
  switch (id) {
    case 'nerd':
      return <g stroke={INK} strokeWidth="2" fill="rgba(255,255,255,0.12)"><rect x="32" y="48.5" width="16" height="11.5" rx="2.5" /><rect x="52" y="48.5" width="16" height="11.5" rx="2.5" /><path d="M48 53 L52 53" /></g>;
    case 'heartshades':
      return <g><path d={heart(40, 54.5, 6.6)} fill={PINK} opacity="0.9" /><path d={heart(60, 54.5, 6.6)} fill={PINK} opacity="0.9" /><path d="M45 52 L55 52" stroke={PINK} strokeWidth="1.6" /></g>;
    case 'starshades':
      return <g><polygon points={star(40, 54, 8.6)} fill={GOLD} opacity="0.92" /><polygon points={star(60, 54, 8.6)} fill={GOLD} opacity="0.92" /><path d="M46 52 L54 52" stroke={GOLD} strokeWidth="1.6" /></g>;
    case 'aviators':
      return (
        <g stroke={GOLD} strokeWidth="1.2">
          <path d="M32 50 Q40 48 47 50 Q47 60 40 61 Q32 60 32 50 Z" fill="#2b2f6b" opacity="0.88" />
          <path d="M53 50 Q60 48 68 50 Q68 60 60 61 Q53 60 53 50 Z" fill="#2b2f6b" opacity="0.88" />
          <path d="M47 50.5 Q50 49 53 50.5" fill="none" />
        </g>
      );
    case 'shades':
      return <g><path d="M31 49 L47 49 L46 60 Q39 62 33 60 Z" fill={INK} opacity="0.92" /><path d="M53 49 L69 49 L67 60 Q61 62 54 60 Z" fill={INK} opacity="0.92" /><path d="M47 51 L53 51" stroke={INK} strokeWidth="2" /></g>;
    case 'mask':
      return (
        <g>
          <path d="M28 48 Q50 43 72 48 Q73 60 62 63 Q54 64 50 59 Q46 64 38 63 Q27 60 28 48 Z" fill="#4b2a86" stroke={GOLD} strokeWidth="1" />
          <ellipse cx="39" cy="54" rx="5.5" ry="4" fill="#1b1330" />
          <ellipse cx="61" cy="54" rx="5.5" ry="4" fill="#1b1330" />
          {[[32, 46], [50, 44], [68, 46]].map(([x, y]) => <polygon key={x} points={star(x, y, 2.2)} fill={GOLD} />)}
        </g>
      );
    case 'monocle':
      return <g><circle cx="60" cy="54" r="7" fill="rgba(255,255,255,0.12)" stroke={GOLD} strokeWidth="1.6" /><path d="M66 58 Q70 68 66 76" stroke={GOLD} strokeWidth="0.8" fill="none" /></g>;
    default: // round
      return <g stroke="#3a2b55" strokeWidth="1.6" fill="rgba(255,255,255,0.1)"><circle cx="40" cy="54" r="7" /><circle cx="60" cy="54" r="7" /><path d="M47 54 L53 54" /></g>;
  }
}

export function Hat({ id, hair }: { id: string; hair: string }) {
  switch (id) {
    case 'bow':
      return <g><path d="M67 21 L58 15 L58 27 Z M67 21 L76 15 L76 27 Z" fill={PINK} /><circle cx="67" cy="21" r="2.8" fill={shade(PINK, -0.2)} /></g>;
    case 'beanie':
      return (
        <g>
          <path d="M21.5 41 C20 20 34 10 50 10 C66 10 80 20 78.5 41 Z" fill="#6b3fc4" />
          <rect x="20" y="35" width="60" height="8" rx="4" fill="#8a5cf0" />
          <circle cx="50" cy="8" r="5.5" fill="#f5f0ff" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M23.5 37 C22.5 18 36 11 50 11 C64 11 77.5 18 76.5 37 Z" fill="#e0445a" />
          <path d="M22 36 Q50 30 78 36 Q80 42 72 42 Q50 37.5 28 42 Q20 42 22 36 Z" fill="#b8323f" />
          <circle cx="50" cy="12" r="2" fill="#b8323f" />
        </g>
      );
    case 'catears':
      return <g><path d="M25 32 L28 11 L42 23 Z M75 32 L72 11 L58 23 Z" fill={hair} /><path d="M29 26 L30 16 L37 22 Z M71 26 L70 16 L63 22 Z" fill="#ffb3cf" /></g>;
    case 'bunnyears':
      return (
        <g>
          <path d="M26 34 C30 20 70 20 74 34" stroke="#f5f0ff" strokeWidth="2.5" fill="none" />
          <ellipse cx="40" cy="12" rx="5.5" ry="13" fill="#f5f0ff" transform="rotate(-12 40 12)" />
          <ellipse cx="60" cy="12" rx="5.5" ry="13" fill="#f5f0ff" transform="rotate(12 60 12)" />
          <ellipse cx="40" cy="13" rx="2.5" ry="9" fill="#ffb3cf" transform="rotate(-12 40 12)" />
          <ellipse cx="60" cy="13" rx="2.5" ry="9" fill="#ffb3cf" transform="rotate(12 60 12)" />
        </g>
      );
    case 'beret':
      return <g><path d="M22 30 C20 16 42 10 60 12 C76 14 82 23 77 30 Q50 35 22 30 Z" fill="#e0445a" /><path d="M58 12 L60 7" stroke="#c7354a" strokeWidth="2.5" strokeLinecap="round" /></g>;
    case 'flowercrown': {
      const spots: [number, number, string][] = [[27, 32, PINK], [33.5, 24.5, GOLD], [41.5, 20, '#b79cff'], [50, 18.5, PINK], [58.5, 20, GOLD], [66.5, 24.5, '#b79cff'], [73, 32, PINK]];
      return (
        <g>
          {spots.map(([x, y]) => <ellipse key={`l${x}`} cx={x + 2.5} cy={y + 2} rx="2.6" ry="1.4" fill="#7ec46a" />)}
          {spots.map(([x, y, c]) => <g key={x}><circle cx={x} cy={y} r="3.4" fill={c} /><circle cx={x} cy={y} r="1.2" fill="#fff" /></g>)}
        </g>
      );
    }
    case 'witch':
      return (
        <g>
          <path d="M33 27 L57 0 L67 27 Z" fill="#4b2a86" />
          <ellipse cx="50" cy="27.5" rx="31" ry="5.5" fill="#3a2070" />
          <rect x="35" y="21" width="30" height="4.5" fill={PINK} />
          <rect x="47" y="20.5" width="6" height="5.5" rx="1" fill="none" stroke={GOLD} strokeWidth="1.2" />
        </g>
      );
    case 'cowboy':
      return (
        <g>
          <path d="M33 27 C32 12 40 9 50 12 C60 9 68 12 67 27 Z" fill="#9c6444" />
          <path d="M11 27 Q50 38 89 27 Q85 34 70 34 Q50 37 30 34 Q15 34 11 27 Z" fill="#7a4a30" />
          <rect x="33" y="23" width="34" height="3.5" fill="#5a3825" />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d="M21 50 C19 18 81 18 79 50" stroke={INK} strokeWidth="4" fill="none" />
          <rect x="16" y="44" width="9" height="15" rx="4.5" fill={PINK} />
          <rect x="75" y="44" width="9" height="15" rx="4.5" fill={PINK} />
        </g>
      );
    case 'halo':
      return <g><ellipse cx="50" cy="9" rx="17" ry="4.5" fill="none" stroke={GOLD} strokeWidth="3" /><ellipse cx="50" cy="9" rx="17" ry="4.5" fill="none" stroke="#fff6d6" strokeWidth="1" /></g>;
    case 'bandana':
      return <g><path d="M22 38 C24 28 76 28 78 38 Q50 44 22 38 Z" fill="#e0445a" /><path d="M76 34 L86 30 L84 40 Z" fill="#c7354a" />{[[32, 35], [44, 33], [56, 33], [68, 35]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.4" fill="#fff" opacity="0.8" />)}</g>;
    case 'headband':
      return <g><path d="M23 40 C26 27 74 27 77 40 L73 41 C70 32 30 32 27 41 Z" fill={PINK} /><path d="M64 30 L58 24 L64 25 L62 19 L70 26 Z" fill={shade(PINK, 0.2)} /></g>;
    case 'earmuffs':
      return (
        <g>
          <path d="M22 50 C20 22 80 22 78 50" stroke="#c9c3e6" strokeWidth="3.5" fill="none" />
          <ellipse cx="20" cy="53" rx="6.5" ry="8" fill="#ffb3cf" />
          <ellipse cx="80" cy="53" rx="6.5" ry="8" fill="#ffb3cf" />
        </g>
      );
    case 'sunhat':
      return (
        <g>
          <ellipse cx="50" cy="32" rx="38" ry="9" fill="#f4e3c1" />
          <path d="M32 32 C31 16 40 10 50 10 C60 10 69 16 68 32 Z" fill="#f7ecd4" />
          <path d="M31 30 Q50 35 69 30" stroke={PINK} strokeWidth="3" fill="none" />
        </g>
      );
    case 'veil':
      return (
        <g>
          <path d="M26 34 C28 12 72 12 74 34 L70 34 C68 20 32 20 30 34 Z" fill="#fff" opacity="0.9" />
          <path d="M28 30 C10 44 8 72 14 92 L86 92 C92 72 90 44 72 30 Z" fill="#f7f5fc" opacity="0.28" />
          {[[34, 24], [50, 19], [66, 24]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.8" fill="#fff" />)}
        </g>
      );
    case 'tiara':
      return (
        <g>
          <path d="M33 26 Q50 30 67 26 L64 18 L57 22 L50 12 L43 22 L36 18 Z" fill={GOLD} stroke="#d9a93a" strokeWidth="0.7" />
          <circle cx="50" cy="20" r="2.2" fill="#bfe9ff" />
          <circle cx="41" cy="23" r="1.4" fill="#ff8fc4" /><circle cx="59" cy="23" r="1.4" fill="#ff8fc4" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path d="M30 25 L32 8 L40.5 16 L50 3 L59.5 16 L68 8 L70 25 Z" fill={GOLD} stroke="#d9a93a" strokeWidth="0.8" />
          <circle cx="50" cy="19" r="2.4" fill="#e0445a" /><circle cx="39" cy="20.5" r="1.8" fill="#6f8cff" /><circle cx="61" cy="20.5" r="1.8" fill="#3fc1b0" />
        </g>
      );
    default:
      return null;
  }
}
