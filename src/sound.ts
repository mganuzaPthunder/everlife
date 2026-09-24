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

/* ───────── Instruments for the copy-the-order games ───────── */

/** How a copy-the-order game sounds. 'voice' is resolved to a girl's or boy's voice before play. */
export type PadSound =
  | 'chime' | 'piano' | 'guitar' | 'ukulele' | 'violin' | 'cello' | 'trumpet' | 'sax' | 'drums' | 'dj'
  | 'voice' | 'voice-f' | 'voice-m';

/** Four pads, four notes: a friendly major-pentatonic shape (root, 2nd, 3rd, 5th). */
const SHAPE = [0, 2, 4, 7];
const hz = (base: number, i: number) => base * 2 ** (SHAPE[i % SHAPE.length] / 12);

let noiseBuf: AudioBuffer | null = null;
function noise(ac: AudioContext) {
  if (!noiseBuf || noiseBuf.sampleRate !== ac.sampleRate) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  return src;
}

/** A gain envelope: quick rise, then fall away over `dur`. */
function env(ac: AudioContext, t0: number, peak: number, attack: number, dur: number) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(ac.destination);
  return g;
}

function osc(ac: AudioContext, type: OscillatorType, freq: number, t0: number, dur: number, out: AudioNode) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  o.connect(out);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
  return o;
}

/** A gentle wobble in pitch, like a bow or a singer's vibrato. */
function vibrato(ac: AudioContext, o: OscillatorNode, t0: number, dur: number, depthHz: number, rate = 5.5) {
  const lfo = ac.createOscillator();
  const amt = ac.createGain();
  lfo.frequency.value = rate;
  amt.gain.setValueAtTime(0, t0);
  amt.gain.linearRampToValueAtTime(depthHz, t0 + 0.15);
  lfo.connect(amt).connect(o.frequency);
  lfo.start(t0);
  lfo.stop(t0 + dur + 0.05);
}

function lowpass(ac: AudioContext, freq: number, out: AudioNode, q = 0.7) {
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  f.Q.value = q;
  f.connect(out);
  return f;
}

/** A plucked string: bright at first, then the tone darkens as it rings out. */
function pluck(ac: AudioContext, t0: number, freq: number, dur: number, gain: number) {
  const out = env(ac, t0, gain, 0.005, dur);
  const f = lowpass(ac, freq * 8, out, 1.2);
  f.frequency.exponentialRampToValueAtTime(freq * 1.5, t0 + dur * 0.7);
  osc(ac, 'sawtooth', freq, t0, dur, f);
  osc(ac, 'triangle', freq * 2, t0, dur * 0.5, env(ac, t0, gain * 0.25, 0.005, dur * 0.5));
}

/** A bowed string: slow bloom, warm, with vibrato. */
function bow(ac: AudioContext, t0: number, freq: number, dur: number, gain: number, bright: number) {
  const out = env(ac, t0, gain, 0.09, dur);
  const f = lowpass(ac, bright, out, 1);
  const o = osc(ac, 'sawtooth', freq, t0, dur, f);
  vibrato(ac, o, t0, dur, freq * 0.006);
}

/** Singing "ah, oh, ee, oo": a buzzy voice shaped by vowel formants. Women sing higher, with lighter vowels. */
const VOWELS = [[800, 1150, 2900], [500, 850, 2800], [300, 2250, 3000], [350, 700, 2600]];
function sing(ac: AudioContext, t0: number, i: number, female: boolean) {
  const dur = 0.5;
  const freq = hz(female ? 392 : 131, i); // G4 for her, C3 for him
  const out = env(ac, t0, female ? 0.6 : 0.7, 0.06, dur); // formant filters eat a lot of level, so start loud
  const scale = female ? 1.17 : 1; // shorter vocal tract, higher formants
  const src = ac.createGain();
  src.gain.value = 1;
  const o = osc(ac, 'sawtooth', freq, t0, dur, src);
  vibrato(ac, o, t0, dur, freq * 0.012, 5.2);
  VOWELS[i % VOWELS.length].forEach((f, k) => {
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * scale;
    bp.Q.value = 9 + k * 3;
    const lvl = ac.createGain();
    lvl.gain.value = [1, 0.6, 0.25][k];
    src.connect(bp).connect(lvl).connect(out);
  });
  // A touch of breath.
  const n = noise(ac);
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 4000;
  n.connect(hp).connect(env(ac, t0, 0.012, 0.02, 0.25));
  n.start(t0);
  n.stop(t0 + 0.3);
}

/** Kick, snare, hi-hat, tom. */
function drum(ac: AudioContext, t0: number, i: number) {
  if (i === 0) {
    const o = osc(ac, 'sine', 150, t0, 0.4, env(ac, t0, 0.35, 0.003, 0.4));
    o.frequency.exponentialRampToValueAtTime(45, t0 + 0.3);
  } else if (i === 1) {
    const n = noise(ac);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    n.connect(bp).connect(env(ac, t0, 0.22, 0.002, 0.2));
    n.start(t0); n.stop(t0 + 0.25);
    osc(ac, 'triangle', 190, t0, 0.12, env(ac, t0, 0.15, 0.002, 0.12));
  } else if (i === 2) {
    const n = noise(ac);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    n.connect(hp).connect(env(ac, t0, 0.14, 0.002, 0.07));
    n.start(t0); n.stop(t0 + 0.1);
  } else {
    const o = osc(ac, 'sine', 220, t0, 0.35, env(ac, t0, 0.3, 0.003, 0.35));
    o.frequency.exponentialRampToValueAtTime(110, t0 + 0.3);
  }
}

/** Bass drop, synth stab, record scratch, air horn. */
function deck(ac: AudioContext, t0: number, i: number) {
  if (i === 0) {
    const o = osc(ac, 'sine', 110, t0, 0.5, env(ac, t0, 0.35, 0.005, 0.5));
    o.frequency.exponentialRampToValueAtTime(40, t0 + 0.45);
  } else if (i === 1) {
    const f = lowpass(ac, 2400, env(ac, t0, 0.07, 0.004, 0.22), 6);
    f.frequency.exponentialRampToValueAtTime(400, t0 + 0.2);
    for (const r of [1, 1.26, 1.5]) osc(ac, 'sawtooth', 262 * r, t0, 0.22, f);
  } else if (i === 2) {
    const n = noise(ac);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 4;
    bp.frequency.setValueAtTime(600, t0);
    bp.frequency.linearRampToValueAtTime(2800, t0 + 0.12);
    bp.frequency.linearRampToValueAtTime(500, t0 + 0.26);
    n.connect(bp).connect(env(ac, t0, 0.3, 0.01, 0.3));
    n.start(t0); n.stop(t0 + 0.32);
  } else {
    const out = lowpass(ac, 2600, env(ac, t0, 0.06, 0.01, 0.5));
    for (const f of [466, 554, 698]) osc(ac, 'sawtooth', f, t0, 0.5, out);
  }
}

/** Play pad `i` of a copy-the-order game in its instrument's voice. */
export function padNote(sound: PadSound, i: number) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + 0.01;
  switch (sound) {
    case 'piano': {
      const f = hz(523.25, i);
      osc(ac, 'triangle', f, t0, 0.9, env(ac, t0, 0.12, 0.004, 0.9));
      osc(ac, 'sine', f * 2, t0, 0.4, env(ac, t0, 0.03, 0.004, 0.4));
      return;
    }
    case 'guitar': return pluck(ac, t0, hz(196, i), 0.8, 0.12);
    case 'ukulele': return pluck(ac, t0, hz(392, i), 0.45, 0.1);
    case 'violin': return bow(ac, t0, hz(392, i), 0.5, 0.09, 3200);
    case 'cello': return bow(ac, t0, hz(131, i), 0.55, 0.13, 1400);
    case 'trumpet': {
      const f = hz(349, i);
      const o = osc(ac, 'sawtooth', f * 0.97, t0, 0.45, lowpass(ac, 2600, env(ac, t0, 0.14, 0.03, 0.45), 2));
      o.frequency.exponentialRampToValueAtTime(f, t0 + 0.05);
      return;
    }
    case 'sax': {
      const f = hz(233, i);
      const o = osc(ac, 'square', f, t0, 0.5, lowpass(ac, 1600, env(ac, t0, 0.08, 0.04, 0.5), 3));
      vibrato(ac, o, t0, 0.5, f * 0.008, 5);
      return;
    }
    case 'drums': return drum(ac, t0, i);
    case 'dj': return deck(ac, t0, i);
    case 'voice': case 'voice-f': return sing(ac, t0, i, true);
    case 'voice-m': return sing(ac, t0, i, false);
    default: return note(i);
  }
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
