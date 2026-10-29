// Tiny chiptune-style sound effects using WebAudio (no audio files needed).
let ctx = null;
let enabled = true;

export function setSound(on) { enabled = on; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'square', vol = 0.06) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(vol, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.02);
}

const SFX = {
  tap: [[660, 0, 0.05]],
  eat: [[392, 0, 0.07], [330, 0.1, 0.07], [392, 0.2, 0.07]],
  happy: [[523, 0, 0.08], [659, 0.08, 0.08], [784, 0.16, 0.12]],
  love: [[784, 0, 0.08], [988, 0.09, 0.14, 'triangle']],
  sad: [[392, 0, 0.12], [311, 0.13, 0.2]],
  refuse: [[220, 0, 0.08], [196, 0.1, 0.12]],
  clean: [[880, 0, 0.04, 'triangle'], [1046, 0.05, 0.04, 'triangle'], [1318, 0.1, 0.06, 'triangle']],
  alert: [[988, 0, 0.07], [988, 0.12, 0.07]],
  coin: [[988, 0, 0.06], [1318, 0.06, 0.12]],
  hit: [[180, 0, 0.08, 'sawtooth']],
  miss: [[140, 0, 0.12, 'triangle']],
  evolve: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1046, 0.3, 0.1], [784, 0.4, 0.1], [1046, 0.5, 0.35]],
  hatch: [[440, 0, 0.06], [554, 0.08, 0.06], [659, 0.16, 0.2]],
};

export function sfx(name) {
  if (!enabled) return;
  try {
    for (const [f, s, d, t] of SFX[name] || []) tone(f, s, d, t);
  } catch (e) { /* audio not available */ }
}
