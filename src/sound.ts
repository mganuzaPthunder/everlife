/* Little synthesised UI sounds — no audio files, just the Web Audio API. */

const MUTE_KEY = 'everlife:muted:v1';

let ctx: AudioContext | null = null;
let muted = read();

function read() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

export const isMuted = () => muted;

export function setMuted(next: boolean) {
  muted = next;
  try { localStorage.setItem(MUTE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
  if (!next) blip('toggle');
}

/** The browser only lets us make noise after a gesture, so the context is created on the first click. */
function audio(): AudioContext | null {
  if (muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Tone { freq: number; to?: number; dur: number; gain?: number; type?: OscillatorType; delay?: number }

function tone(ac: AudioContext, { freq, to, dur, gain = 0.06, type = 'sine', delay = 0 }: Tone) {
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type Sfx = 'tap' | 'primary' | 'age' | 'back' | 'toggle' | 'win' | 'lose' | 'coin' | 'pop' | 'good' | 'bad';

/** Play one of the UI sounds. Silent when muted or when audio isn't available. */
export function blip(kind: Sfx = 'tap') {
  const ac = audio();
  if (!ac) return;
  switch (kind) {
    case 'tap': return tone(ac, { freq: 620, to: 520, dur: 0.07, gain: 0.05, type: 'triangle' });
    case 'primary': return tone(ac, { freq: 480, to: 720, dur: 0.11, gain: 0.06, type: 'triangle' });
    case 'back': return tone(ac, { freq: 420, to: 300, dur: 0.09, gain: 0.045, type: 'sine' });
    case 'toggle': return tone(ac, { freq: 880, dur: 0.07, gain: 0.05, type: 'sine' });
    case 'pop': return tone(ac, { freq: 760, to: 900, dur: 0.06, gain: 0.05, type: 'sine' });
    case 'age':
      tone(ac, { freq: 523.25, dur: 0.16, gain: 0.055, type: 'sine' });
      tone(ac, { freq: 659.25, dur: 0.16, gain: 0.05, type: 'sine', delay: 0.08 });
      return tone(ac, { freq: 783.99, dur: 0.3, gain: 0.05, type: 'sine', delay: 0.16 });
    case 'win':
      tone(ac, { freq: 659.25, dur: 0.14, gain: 0.05, type: 'triangle' });
      tone(ac, { freq: 830.61, dur: 0.14, gain: 0.05, type: 'triangle', delay: 0.09 });
      return tone(ac, { freq: 987.77, dur: 0.34, gain: 0.05, type: 'triangle', delay: 0.18 });
    case 'lose':
      tone(ac, { freq: 300, to: 190, dur: 0.22, gain: 0.05, type: 'sawtooth' });
      return tone(ac, { freq: 150, to: 110, dur: 0.3, gain: 0.035, type: 'sine', delay: 0.1 });
    case 'good': return tone(ac, { freq: 880, to: 1320, dur: 0.12, gain: 0.05, type: 'triangle' });
    case 'bad': return tone(ac, { freq: 240, to: 160, dur: 0.16, gain: 0.05, type: 'sawtooth' });
    case 'coin':
      tone(ac, { freq: 988, dur: 0.08, gain: 0.05, type: 'square' });
      return tone(ac, { freq: 1319, dur: 0.18, gain: 0.04, type: 'square', delay: 0.07 });
  }
}

/** Did that round go well? */
export const judge = (ok: boolean) => blip(ok ? 'good' : 'bad');

/** A note from a pentatonic scale — for pads you play in order. */
const SCALE = [523.25, 587.33, 698.46, 783.99, 880, 1046.5];
export function note(i: number) {
  const ac = audio();
  if (!ac) return;
  tone(ac, { freq: SCALE[i % SCALE.length], dur: 0.2, gain: 0.05, type: 'sine' });
}

/** Which sound a button should make, based on what kind of button it is. */
function soundFor(el: HTMLElement): Sfx {
  const label = `${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''}`.trim();
  if (el.classList.contains('age-btn') || /age up/i.test(label)) return 'age';
  if (/^(✕|←|↩)/.test(label) || /close|back|cancel|never mind/i.test(label)) return 'back';
  if (el.classList.contains('primary') || el.classList.contains('big-btn')) return 'primary';
  if (el.classList.contains('tile') || el.classList.contains('app-icon')) return 'pop';
  return 'tap';
}

/** Every button in the app clicks. One listener, set up once. */
export function listenForClicks() {
  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as HTMLElement | null)?.closest('button, [role="button"]') as HTMLElement | null;
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
    blip(soundFor(el));
  }, { passive: true });
}
