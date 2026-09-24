import type { ReactNode } from 'react';
import type { HairStyle, Look } from '../game/types';
import { NATURAL_HAIR } from '../game/look';
import { Earrings, FaceDeco, Glasses, Hat, Neck, Top } from './AvatarParts';

const OUTLINE = 'rgba(20, 10, 40, 0.18)';
const ACCENT = '#ff6fa8';

/* Shared shapes. The head is an ellipse at (50,50), rx 26, ry 27. */
const DOME = 'M21 52 C19 30 31 18 50 18 C69 18 81 30 79 52';
const HAIRLINE = 'L75.5 52 C75 46 73.5 41 70.5 38 C64 33.5 57 33 50 33.5 C43 33 36 33.5 29.5 38 C26.5 41 25 46 24.5 52 Z';
/** Shaved hair hugs the scalp exactly (follows the head ellipse). */
const SCALP = 'M24 50 A26 27 0 0 1 76 50 L75.5 50 C75 45 73.5 41 70.5 38 C64 33.5 57 33 50 33.5 C43 33 36 33.5 29.5 38 C26.5 41 25 45 24.5 50 Z';
const SLEEK = 'M22 50 C20 29 32 19 50 19 C68 19 80 29 78 50 L75.5 50 C75 45 73.5 40 70 36.5 C64 32 57 31 50 31.5 C43 31 36 32 30 36.5 C26.5 40 25 45 24.5 50 Z';

const CURTAIN = 'M19 90 C13 36 28 16 50 16 C72 16 87 36 81 90 L76 90 C77 72 77 55 73 44 C68 36 58 30 50 28 C42 30 32 36 27 44 C23 55 23 72 24 90 Z';
const LONG_BACK = 'M18 50 C15 18 32 14 50 14 C68 14 85 18 82 50 L86 92 Q50 100 14 92 Z';

interface HairParts { back?: ReactNode; front?: ReactNode; shine?: boolean }

function hairParts(style: HairStyle | 'tuft', c: string): HairParts {
  const p = (d: string, extra: Record<string, unknown> = {}) => <path d={d} fill={c} stroke={OUTLINE} strokeWidth="0.8" {...extra} />;
  const part = (d: string) => <path d={d} fill="none" stroke="rgba(20,10,40,0.22)" strokeWidth="1.2" strokeLinecap="round" />;

  switch (style) {
    case 'tuft':
      return { front: <path d="M44 26 Q46 14 51 23 Q54 15 58 25" stroke={c} strokeWidth="3.2" fill="none" strokeLinecap="round" /> };

    case 'short':
      return {
        shine: true,
        front: p(`${DOME} L75.5 52 C75 46 73.5 41 70.5 38 C67 35 64 36 62 38.5 C61 34.5 57 34.5 55 37 C53.5 33 49 33.5 47 36.5 C45 33 41 33.5 39.5 36.5 C37.5 33.5 33 34 29.5 38 C26.5 41 25 46 24.5 52 Z`),
      };

    case 'sidepart':
      return {
        shine: true,
        front: <>{p(`${DOME} L75.5 52 C75 46 74 42 71.5 39.5 C63 43 51 41.5 41 31.5 C38.5 35 34.5 36.5 30.5 38.5 C27 41 25 46 24.5 52 Z`)}{part('M37 20 Q39 26 41 31.5')}</>,
      };

    case 'spiky':
      return {
        front: p('M20 52 L17 36 L25 37 L23 23 L32 28 L34 13 L42 23 L50 8 L57 22 L66 12 L68 27 L77 23 L75 37 L83 36 L80 52 L75.5 52 C75 46 73.5 41 70.5 38 L66.5 41.5 L63.5 35 L58.5 40 L54.5 34 L50 40 L45.5 34 L41.5 40 L36.5 35 L33.5 41.5 L29.5 38 C26.5 41 25 46 24.5 52 Z'),
      };

    case 'pixie':
      return {
        shine: true,
        front: <>{p('M21 60 C17 30 31 17 50 17 C69 17 82 30 79 58 L75.5 51 C75 45 73.5 40.5 70.5 37.5 C68 34 65 32 62 31 C57 38 45 43 30 45.5 C27 47 25.5 51 24 57 Z')}{part('M59 19 Q61 25 62 31')}</>,
      };

    case 'curly': {
      const outer: [number, number, number][] = [[23, 50, 6.5], [23, 40, 7.5], [27, 30, 8], [35, 22, 9], [45, 18, 9], [56, 18, 9], [66, 22, 9], [74, 30, 8], [77, 40, 7.5], [77, 50, 6.5]];
      const fringe: [number, number, number][] = [[31, 37, 5], [38, 33.5, 5.2], [46, 32, 5.4], [54, 32, 5.4], [62, 33.5, 5.2], [69, 37, 5]];
      return {
        front: <>
          {p(`${DOME} ${HAIRLINE}`, { stroke: 'none' })}
          {[...outer, ...fringe].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={c} stroke={OUTLINE} strokeWidth="0.8" />)}
        </>,
      };
    }

    case 'afro': {
      const fringe: [number, number, number][] = [[29, 39, 4.6], [34.5, 35, 4.6], [41, 32.6, 4.6], [47.5, 31.8, 4.6], [53.5, 31.8, 4.6], [60, 32.6, 4.6], [66, 35, 4.6], [71.5, 39, 4.6]];
      return {
        back: <ellipse cx="50" cy="38" rx="35" ry="31" fill={c} stroke={OUTLINE} strokeWidth="0.8" />,
        front: <>
          {p(`${DOME} ${HAIRLINE}`, { stroke: 'none' })}
          {fringe.map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill={c} />)}
        </>,
      };
    }

    case 'mohawk':
      return {
        front: <>
          {p(SCALP, { opacity: 0.4, stroke: 'none' })}
          {p('M42.5 37 C40 27 41.5 15 45.5 4 C47.5 10 49.5 8 51.5 2.5 C53.5 8.5 55.5 9.5 57 4.5 C60 15 59.5 28 57.5 37 C54 35 46 35 42.5 37 Z')}
        </>,
      };

    case 'buzz':
      return { front: p(SCALP, { opacity: 0.6, stroke: 'none' }) };

    case 'bald':
      return { front: <path d="M37 29 Q43 24.5 50 24" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.5" fill="none" strokeLinecap="round" /> };

    case 'bob':
      return {
        shine: true,
        back: p('M18 50 C16 22 32 16 50 16 C68 16 84 22 82 50 L83 72 C83 77 79 79 74 78 L26 78 C21 79 17 77 17 72 Z'),
        front: p('M20 76 C15 34 29 17 50 17 C71 17 85 34 80 76 L75 76 C76 63 76.5 51 75.5 43 C66 45 58 44.5 50 44.5 C42 44.5 34 45 24.5 43 C23.5 51 24 63 25 76 Z'),
      };

    case 'bangs':
      return {
        shine: true,
        back: p('M17 50 C15 20 32 15 50 15 C68 15 85 20 83 50 L85 94 L15 94 Z'),
        front: p('M19 92 C14 34 29 17 50 17 C71 17 86 34 81 92 L76 92 C76.5 70 76.5 52 75.5 43 C66 45 58 44.5 50 44.5 C42 44.5 34 45 24.5 43 C23.5 52 23.5 70 24 92 Z'),
      };

    case 'long':
      return { shine: true, back: p(LONG_BACK), front: <>{p(CURTAIN)}{part('M50 17 L50 28')}</> };

    case 'wavy':
      return {
        shine: true,
        back: p('M18 50 C14 18 32 14 50 14 C68 14 86 18 82 50 C86 58 80 64 85 72 C89 80 82 86 86 94 Q50 102 14 94 C18 86 11 80 15 72 C20 64 14 58 18 50 Z'),
        front: <>{p('M22 90 C14 82 22 75 17 66 C12 57 20 51 19 44 C19 28 31 16 50 16 C69 16 81 28 81 44 C80 51 88 57 83 66 C78 75 86 82 78 90 L75 90 C77 75 77 57 73 46 C68 38 58 33 41 29.5 C35 33.5 30 38 27 45 C23 56 23 73 25 90 Z')}{part('M38 18 Q40 24 41 29.5')}</>,
      };

    case 'locs': {
      const strands = [17, 23, 29, 71, 77, 83];
      return {
        back: <>{strands.map((x, i) => <rect key={x} x={x - 3.2} y="28" width="6.4" height={i % 2 ? 58 : 52} rx="3.2" fill={c} stroke={OUTLINE} strokeWidth="0.8" />)}</>,
        front: <>
          {p(`${DOME} ${HAIRLINE}`)}
          {[22, 78].map((x) => <rect key={x} x={x - 3.2} y="40" width="6.4" height="48" rx="3.2" fill={c} stroke={OUTLINE} strokeWidth="0.8" />)}
          {[34, 42, 50, 58, 66].map((x) => <path key={x} d={`M${x} 21 L${x} 33`} stroke="rgba(20,10,40,0.18)" strokeWidth="1" />)}
        </>,
      };
    }

    case 'ponytail':
      return {
        shine: true,
        back: p('M66 17 C86 10 97 30 91 52 C88 64 83 72 81 83 C78 70 84 58 82 44 C80 32 74 27 65 26 Z'),
        front: <>{p(SLEEK)}<circle cx="70" cy="21" r="4.5" fill={ACCENT} /></>,
      };

    case 'pigtails':
      return {
        shine: true,
        back: <>
          {p('M27 34 C10 38 5 60 11 80 C13 86 18 88 20 82 C16 68 20 53 29 45 Z')}
          {p('M73 34 C90 38 95 60 89 80 C87 86 82 88 80 82 C84 68 80 53 71 45 Z')}
        </>,
        front: <>{p(SLEEK)}{part('M50 19 L50 31')}<circle cx="24" cy="40" r="4" fill={ACCENT} /><circle cx="76" cy="40" r="4" fill={ACCENT} /></>,
      };

    case 'buns':
      return {
        shine: true,
        back: <><circle cx="27" cy="22" r="10.5" fill={c} stroke={OUTLINE} strokeWidth="0.8" /><circle cx="73" cy="22" r="10.5" fill={c} stroke={OUTLINE} strokeWidth="0.8" /></>,
        front: <>{p(SLEEK)}{part('M50 19 L50 31')}</>,
      };

    case 'topknot':
      return {
        shine: true,
        back: <circle cx="50" cy="12" r="11" fill={c} stroke={OUTLINE} strokeWidth="0.8" />,
        front: <>{p(SLEEK)}<path d="M43 20 Q50 23.5 57 20" stroke={ACCENT} strokeWidth="3" fill="none" strokeLinecap="round" /></>,
      };

    case 'braids': {
      const links = [58, 65.5, 73, 80.5, 88];
      const braid = (side: 1 | -1) => {
        const x0 = side === -1 ? 24 : 76;
        return (
          <g key={side}>
            {p(side === -1 ? 'M24 40 C21 47 22 53 24.5 56 L30 54 C28 50 27.5 45 28.5 40 Z' : 'M76 40 C79 47 78 53 75.5 56 L70 54 C72 50 72.5 45 71.5 40 Z')}
            {links.map((y, i) => <ellipse key={y} cx={x0 + side * (i * 0.6)} cy={y} rx="5.6" ry="4.4" fill={c} stroke={OUTLINE} strokeWidth="0.8" />)}
            <circle cx={x0 + side * 3} cy="93.5" r="2.6" fill={ACCENT} />
          </g>
        );
      };
      return { shine: true, front: <>{p(SLEEK)}{part('M50 19 L50 31')}{braid(-1)}{braid(1)}</> };
    }

    /* ───── More boys' styles ───── */
    case 'undercut':
      return {
        shine: true,
        front: <>
          {p(SCALP, { opacity: 0.4, stroke: 'none' })}
          {p('M28.5 39 C26 25 35 13.5 52 12.5 C67 12.5 76 21 74.5 35 C69 30.5 61 33.5 54.5 35.5 C46 37.5 36 37.5 28.5 39 Z')}
        </>,
      };

    case 'quiff':
      return {
        shine: true,
        front: <>
          {p(SCALP, { opacity: 0.45, stroke: 'none' })}
          {p('M29.5 38 C26.5 27 29 14 41 8.5 C51 4 66 7 71 15.5 C74 22 73 30 70.5 37 C63 31 55 28.5 48.5 30 C42 31.5 35 34 29.5 38 Z')}
          <path d="M42 12 Q52 8 62 12" stroke="rgba(20,10,40,0.2)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>,
      };

    case 'fringe':
      return {
        shine: true,
        front: p(`${DOME} L75.5 52 C75.5 47 74.5 43 72.5 40.5 L68.5 44.5 L65 39.5 L59.5 45.5 L55 39.5 L50 45.5 L45 39.5 L40.5 45.5 L35 39.5 L31.5 44.5 L27.5 40.5 C25.5 43 24.5 47 24.5 52 Z`),
      };

    case 'manbun':
      return {
        shine: true,
        back: <circle cx="50" cy="13" r="8.5" fill={c} stroke={OUTLINE} strokeWidth="0.8" />,
        front: <>
          {p(SLEEK)}
          <path d="M27 40 Q24 48 26 54 M73 40 Q76 48 74 54" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>,
      };

    case 'fauxhawk':
      return {
        front: <>
          {p(`${DOME} ${HAIRLINE}`, { opacity: 0.55, stroke: 'none' })}
          {p('M39.5 35 L41 16 L46 21 L50 7 L54 21 L59 16 L60.5 35 C56 33 44 33 39.5 35 Z')}
        </>,
      };

    case 'messy':
      return {
        front: p('M20 52 C16 41 17 31 21.5 26 L19 19.5 L27.5 21.5 C29.5 16 35 13 40 15 L41.5 9 L47.5 14 C52 11 58 11.5 62 14.5 L68.5 10.5 L68 18 C74 19.5 78 23.5 79.5 29.5 L84.5 29.5 L80 35.5 C81 41.5 81 47 80 52 L75.5 52 C75 46 73.5 41 70.5 38 L67 42 L64.5 36 L60 40.5 L57 35 L52 40 L48.5 34.5 L44 39.5 L41 35 L36.5 40.5 L34 36 L29.5 38.5 C26.5 41.5 25 46 24.5 52 Z'),
      };

    case 'slick':
      return {
        shine: true,
        front: <>
          {p('M22 48 C20 28 32 18.5 50 18.5 C68 18.5 80 28 78 48 L75.5 48 C75 43 73.5 38 70.5 34.5 C64 30.5 57 29.5 50 30 C43 29.5 36 30.5 29.5 34.5 C26.5 38 25 43 24.5 48 Z')}
          {[36, 43, 50, 57, 64].map((x) => <path key={x} d={`M${x} 30 Q${x + 2} 24 ${x + 1} 19.5`} stroke="rgba(20,10,40,0.2)" strokeWidth="1" fill="none" strokeLinecap="round" />)}
        </>,
      };

    case 'curtains':
      return {
        shine: true,
        front: <>{p('M20 58 C16 30 30 16 50 16 C70 16 84 30 80 58 L76 58 C76 50 74 44 70 40 C64 36 56 33.5 50 30 C44 33.5 36 36 30 40 C26 44 24 50 24 58 Z')}{part('M50 17 L50 30')}</>,
      };

    case 'cornrows':
      return {
        front: <>
          {p(SCALP, { stroke: 'none' })}
          {[31, 37.5, 44, 50, 56, 62.5, 69].map((x) => (
            <path key={x} d={`M${x} ${x < 36 || x > 64 ? 38 : 34} Q${50 + (x - 50) * 1.05} 26 ${50 + (x - 50) * 0.7} 23`} stroke="rgba(20,10,40,0.3)" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeDasharray="1.6 1.2" />
          ))}
        </>,
      };

    case 'twists': {
      const spots: [number, number][] = [[27, 33], [32, 25], [38, 19], [45, 15.5], [52, 14.5], [59, 16], [66, 20], [71, 26], [74, 34], [35, 31], [43, 26], [51, 24], [59, 26], [66, 31]];
      return {
        front: <>
          {p(`${DOME} ${HAIRLINE}`, { stroke: 'none' })}
          {spots.map(([x, y]) => <rect key={`${x}-${y}`} x={x - 2.6} y={y - 6} width="5.2" height="11" rx="2.6" fill={c} stroke={OUTLINE} strokeWidth="0.8" transform={`rotate(${(x - 50) * 0.9} ${x} ${y})`} />)}
        </>,
      };
    }

    /* ───── More styles ───── */
    case 'bowl':
      return {
        shine: true,
        front: p('M20 52 C18 28 31 16 50 16 C69 16 82 28 80 52 L76 52 C75.5 44 74 40 71 38 C64 41 58 42 50 42 C42 42 36 41 29 38 C26 40 24.5 44 24 52 Z'),
      };

    case 'caesar':
      return {
        shine: true,
        front: p('M22 52 C20 30 32 18 50 18 C68 18 80 30 78 52 L75.5 52 C75 45 73.5 41 70.5 38.5 C66 40.5 60 41.5 54 39.5 C50 42 44 42 39 39 C34.5 41 31 40 29.5 38.5 C26.5 41 25 45 24.5 52 Z'),
      };

    case 'shag':
      return {
        shine: true,
        back: p('M19 50 C16 20 32 15 50 15 C68 15 84 20 81 50 L83 78 L74 72 L68 80 L32 80 L26 72 L17 78 Z'),
        front: <>
          {p('M20 62 C16 28 30 15 50 15 C70 15 84 28 80 62 L75.5 52 C75 44 73 39 70 36.5 C64 40 56 40 50 37 C44 40 36 40 30 36.5 C27 39 25 44 24.5 52 Z')}
          {[30, 38, 46, 54, 62, 70].map((x) => <path key={x} d={`M${x} 20 L${x - 1} 34`} stroke="rgba(20,10,40,0.18)" strokeWidth="1" />)}
        </>,
      };

    case 'mullet':
      return {
        shine: true,
        back: p('M28 30 C16 36 14 58 18 80 L34 82 C29 62 29 44 38 34 Z M72 30 C84 36 86 58 82 80 L66 82 C71 62 71 44 62 34 Z'),
        front: p('M21 52 C19 28 32 17 50 17 C68 17 81 28 79 52 L75.5 52 C75 45 73.5 40 70.5 37 C66 40 60 38 55 34 C51 38 44 39 38 36 C33 38 29 40 29.5 37 C26.5 40 25 45 24.5 52 Z'),
      };

    case 'curtainbangs':
      return {
        shine: true,
        back: p(LONG_BACK),
        front: <>
          {p('M19 88 C13 36 28 16 50 16 C72 16 87 36 81 88 L76 88 C77 70 77 54 73 44 C69 37 60 32 50 30 C40 32 31 37 27 44 C23 54 23 70 24 88 Z')}
          {p('M50 30 C42 31 34 36 30 44 C34 44 42 41 47 34 Z M50 30 C58 31 66 36 70 44 C66 44 58 41 53 34 Z')}
          {part('M50 18 L50 29')}
        </>,
      };

    case 'wolfcut': {
      const tips: [number, number][] = [[17, 66], [21, 74], [26, 68], [74, 68], [79, 74], [83, 66]];
      return {
        shine: true,
        back: p('M18 50 C15 20 32 14 50 14 C68 14 85 20 82 50 L86 84 Q50 92 14 84 Z'),
        front: <>
          {p('M20 60 C15 26 30 14 50 14 C70 14 85 26 80 60 L75.5 50 C75 43 72 38 68 35 C62 40 54 41 48 38 C42 42 34 41 30 36 C27 39 25 43 24.5 50 Z')}
          {tips.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y - 16} L${x} ${y}`} stroke={c} strokeWidth="6" strokeLinecap="round" />)}
          {[30, 40, 50, 60, 70].map((x) => <path key={x} d={`M${x} 20 l-1 12`} stroke="rgba(20,10,40,0.2)" strokeWidth="1.2" />)}
        </>,
      };
    }

    case 'crimped': {
      const edge = (side: 1 | -1) => {
        const x = side === -1 ? 14 : 86;
        return `M${x} 30 ${Array.from({ length: 6 }, (_, i) => `l${side * 5} ${6} l${-side * 5} ${6}`).join(' ')}`;
      };
      return {
        back: p('M12 54 C6 20 28 10 50 10 C72 10 94 20 88 54 L92 88 Q50 96 8 88 Z'),
        front: <>
          {p('M16 52 C12 24 30 14 50 14 C70 14 88 24 84 52 L79 52 C78 44 76 40 72 37 C64 41 56 42 50 42 C44 42 36 41 28 37 C24 40 22 44 21 52 Z')}
          {[-1, 1].map((side) => <path key={side} d={edge(side as 1 | -1)} stroke={c} strokeWidth="7" fill="none" strokeLinejoin="round" />)}
          {[24, 30, 36].map((y) => <path key={y} d={`M26 ${y} l6 -3 l6 6 l6 -6 l6 6 l6 -6 l6 3`} stroke="rgba(20,10,40,0.22)" strokeWidth="1.3" fill="none" />)}
        </>,
      };
    }

    case 'coils': {
      const coils: [number, number, number][] = [
        [22, 46, 6], [22, 36, 6.5], [27, 27, 7], [35, 20, 7.5], [45, 17, 7.5], [55, 17, 7.5], [65, 20, 7.5], [73, 27, 7], [78, 36, 6.5], [78, 46, 6],
        [21, 56, 5.5], [79, 56, 5.5], [24, 64, 5], [76, 64, 5],
      ];
      return {
        front: <>
          {p(`${DOME} ${HAIRLINE}`, { stroke: 'none' })}
          {coils.map(([x, y, r]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r={r} fill={c} stroke={OUTLINE} strokeWidth="0.8" /><circle cx={x} cy={y} r={r * 0.45} fill="none" stroke="rgba(20,10,40,0.18)" strokeWidth="0.8" /></g>)}
        </>,
      };
    }

    case 'hime':
      return {
        shine: true,
        back: p(LONG_BACK),
        front: <>
          {/* long hair with blunt, straight-across bangs */}
          {p('M19 88 C14 34 29 16 50 16 C71 16 86 34 81 88 L76 88 C76.5 70 76.5 52 75.5 43 C66 44.3 58 44 50 44 C42 44 34 44.3 24.5 43 C23.5 52 23.5 70 24 88 Z')}
          {[36, 44, 56, 64].map((x) => <path key={x} d={`M${x} 30 L${x} 43.5`} stroke="rgba(20,10,40,0.14)" strokeWidth="1" />)}
          {/* the cheek-length side locks that make it a hime cut */}
          {p('M24.5 43 L33 44 L33 63 L24.5 63 Z M75.5 43 L67 44 L67 63 L75.5 63 Z')}
        </>,
      };

    case 'mermaid':
      return {
        shine: true,
        back: <>
          {p('M16 50 C12 18 31 12 50 12 C69 12 88 18 84 50 C88 60 80 66 86 76 C90 84 82 90 88 98 Q50 106 12 98 C18 90 10 84 14 76 C20 66 12 60 16 50 Z')}
          {[17, 25, 75, 83].map((x) => <path key={x} d={`M${x} 44 q6 8 0 16 q-6 8 0 16 q6 8 0 14`} stroke="rgba(20,10,40,0.22)" strokeWidth="1.8" fill="none" />)}
        </>,
        front: <>{p(CURTAIN)}{part('M44 18 Q42 25 41 31')}</>,
      };

    case 'halfup':
      return {
        shine: true,
        back: <>{p(LONG_BACK)}<circle cx="50" cy="13" r="9.5" fill={c} stroke={OUTLINE} strokeWidth="0.8" /></>,
        front: <>{p(SLEEK)}<path d="M42 21 Q50 25 58 21" stroke={ACCENT} strokeWidth="2.6" fill="none" strokeLinecap="round" /></>,
      };

    case 'chignon':
      return {
        shine: true,
        // A low bun at the nape, peeking out from behind the head.
        back: <g>
          <ellipse cx="77" cy="50" rx="11" ry="10" fill={c} stroke={OUTLINE} strokeWidth="0.8" />
          <ellipse cx="78" cy="50" rx="6" ry="5" fill="none" stroke="rgba(20,10,40,0.22)" strokeWidth="1" />
        </g>,
        front: <>
          {p(SLEEK)}
          {[32, 42, 52, 62].map((x) => <path key={x} d={`M${x} 22 q6 6 4 14`} stroke="rgba(20,10,40,0.16)" strokeWidth="1.1" fill="none" />)}
        </>,
      };

    case 'lowpigtails':
      return {
        shine: true,
        back: <>
          <circle cx="19" cy="66" r="11" fill={c} stroke={OUTLINE} strokeWidth="0.8" />
          <circle cx="81" cy="66" r="11" fill={c} stroke={OUTLINE} strokeWidth="0.8" />
          {p('M26 44 C18 50 16 58 17 66 L28 62 C26 56 27 50 31 47 Z M74 44 C82 50 84 58 83 66 L72 62 C74 56 73 50 69 47 Z')}
          <circle cx="24" cy="56" r="3.4" fill={ACCENT} /><circle cx="76" cy="56" r="3.4" fill={ACCENT} />
        </>,
        front: <>{p(SLEEK)}{part('M50 19 L50 31')}</>,
      };

    case 'crownbraid': {
      const beads = [28, 36, 44, 52, 60, 68];
      return {
        shine: true,
        back: p('M20 50 C17 22 33 16 50 16 C67 16 83 22 80 50 L82 70 Q50 78 18 70 Z'),
        front: <>
          {p(SLEEK)}
          {beads.map((x, i) => <ellipse key={x} cx={x + 2} cy={24 + Math.abs(x - 48) * 0.18} rx="5" ry="4" fill={c} stroke={OUTLINE} strokeWidth="0.8" transform={`rotate(${i % 2 ? 12 : -12} ${x + 2} 24)`} />)}
          <circle cx="74" cy="30" r="2.4" fill={ACCENT} />
        </>,
      };
    }

    case 'surfer':
      return {
        shine: true,
        back: p('M18 50 C15 18 32 14 50 14 C68 14 85 18 82 50 L84 68 L78 72 L74 66 L68 72 L32 72 L26 66 L22 72 L16 68 Z'),
        front: p('M20 70 C14 34 28 16 50 16 C72 16 86 34 80 70 L76 64 C77 55 76 48 73 43 C66 41 60 36 56 30 C50 37 38 41 27 43 C24 48 23 55 24 64 Z'),
      };
  }
}

/** A cute, age-aware face. Falls back to an emoji for people without a look. */
export function Avatar({ look, age, alive = true, fallback, mood = 65 }: { look?: Look; age: number; alive?: boolean; fallback?: string; mood?: number }) {
  if (!alive) return <span className="avatar-emoji">🪦</span>;
  if (!look) return <span className="avatar-emoji">{fallback}</span>;

  const baby = age < 3;
  const elder = age >= 65;
  const hair = elder && NATURAL_HAIR.includes(look.hairColor) ? '#dcd7e6' : look.hairColor;
  const style: HairStyle | 'tuft' = baby ? 'tuft' : look.hair in STYLE_OK ? look.hair : 'short';
  const skin = look.skin;
  const { back, front, shine } = hairParts(style, hair);
  const brow = ['bald', 'buzz', 'cornrows'].includes(style) ? '#5a4050' : hair;
  const acc = baby ? {} : look.acc ?? {};
  const sad = mood < 25;

  return (
    <svg className="avatar-svg" viewBox="0 0 100 100" aria-hidden>
      {back}

      {/* body & outfit */}
      <rect x="43" y="64" width="14" height="14" rx="6" fill={skin} />
      <rect x="43" y="68" width="14" height="4" fill="#000" opacity="0.08" />
      <Top top={baby ? 'onesie' : look.top ?? 'tee'} color={look.topColor ?? '#6b3fc4'} skin={skin} />

      {/* ears & head */}
      <circle cx="24.5" cy="54" r="5" fill={skin} />
      <circle cx="75.5" cy="54" r="5" fill={skin} />
      <circle cx="24.5" cy="54.5" r="2.2" fill="#000" opacity="0.06" />
      <circle cx="75.5" cy="54.5" r="2.2" fill="#000" opacity="0.06" />
      <ellipse cx="50" cy="50.5" rx={baby ? 27.5 : 26.5} ry={baby ? 26 : 26.8} fill={skin} />
      {acc.neck && <Neck id={acc.neck} />}

      {/* sparkly eyes */}
      {[40, 60].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="54" rx="4.3" ry="5" fill={look.eyes} />
          <ellipse cx={x} cy="55" rx="2.5" ry="3" fill="#1b1330" />
          <circle cx={x + 1.5} cy="52" r="1.5" fill="#fff" />
          <circle cx={x - 1.4} cy="56.6" r="0.75" fill="#fff" opacity="0.9" />
          {look.lashes && !baby && <path d={x < 50 ? `M${x - 4.2} 51.5 L${x - 6.2} 50 M${x - 3} 49.8 L${x - 4.4} 47.8` : `M${x + 4.2} 51.5 L${x + 6.2} 50 M${x + 3} 49.8 L${x + 4.4} 47.8`} stroke="#1b1330" strokeWidth="1.1" strokeLinecap="round" />}
        </g>
      ))}
      {!baby && (
        <path d={sad ? 'M35 45.5 Q40 46.5 45 48 M55 48 Q60 46.5 65 45.5' : 'M35 46 Q40 44 45 46 M55 46 Q60 44 65 46'} stroke={brow} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
      )}

      {/* nose, blush & mouth */}
      <path d="M48.8 59.5 Q50 60.6 51.2 59.5" stroke="#000" strokeOpacity="0.18" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <ellipse cx="32.5" cy="62" rx="5" ry="2.9" fill="#ff6f9a" opacity="0.38" />
      <ellipse cx="67.5" cy="62" rx="5" ry="2.9" fill="#ff6f9a" opacity="0.38" />
      <Mouth mood={mood} baby={baby} />
      {acc.face && <FaceDeco id={acc.face} />}

      {front}
      {shine && !acc.hat && <path d="M33 26 Q40 20.5 47 20.5" stroke="#fff" strokeOpacity="0.28" strokeWidth="2" fill="none" strokeLinecap="round" />}

      {acc.ears && <Earrings id={acc.ears} />}
      {acc.glasses ? <Glasses id={acc.glasses} /> : elder && <Glasses id="round" />}
      {acc.hat && <Hat id={acc.hat} hair={hair} />}
    </svg>
  );
}

function Mouth({ mood, baby }: { mood: number; baby: boolean }) {
  if (baby) return <path d="M47 64.5 Q50 67.5 53 64.5" stroke="#7a3448" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  if (mood >= 75) return (
    <g>
      <path d="M44 63.5 Q50 72 56 63.5 Z" fill="#7a3448" />
      <path d="M46.8 67.6 Q50 70.2 53.2 67.6 Q50 66.4 46.8 67.6 Z" fill="#ff8fa8" />
    </g>
  );
  if (mood >= 45) return <path d="M45 64 Q50 69 55 64" stroke="#7a3448" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  if (mood >= 25) return <path d="M46.5 65.5 Q50 66.3 53.5 65.5" stroke="#7a3448" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  return <path d="M45.5 67 Q50 62.5 54.5 67" stroke="#7a3448" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
}

const STYLE_OK: Record<HairStyle, true> = {
  short: true, sidepart: true, spiky: true, curly: true, afro: true, mohawk: true, buzz: true, bald: true, pixie: true,
  bob: true, bangs: true, long: true, wavy: true, ponytail: true, pigtails: true, buns: true, topknot: true, braids: true, locs: true,
  undercut: true, quiff: true, fringe: true, manbun: true, fauxhawk: true, messy: true, slick: true, curtains: true, cornrows: true, twists: true, surfer: true,
  bowl: true, caesar: true, shag: true, mullet: true, curtainbangs: true, wolfcut: true, crimped: true, coils: true,
  hime: true, mermaid: true, halfup: true, chignon: true, lowpigtails: true, crownbraid: true,
};
