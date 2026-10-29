// Procedural pixel-art sprites for eggs, wisps and every species (all stages / variants / poses),
// plus small effect icons and the pixel room backdrops.
import { PixelBuffer, bitmap } from './pixel.js';
import { shade, mix, desaturate } from './util.js';
import { FAMILIES } from './data.js';
import { SPRITES } from '../art/registry.js';

export const SPRITE = 48;
const OUTLINE = '#2b2238';
const cache = new Map();

export function palette(sp, variant = 'normal') {
  const p = {
    skin: sp.skin, hair: sp.hair, eyes: sp.eyes, outfit: sp.outfit, accent: sp.accent,
    lower: sp.lowerColor || sp.skin, wing: sp.wingColor || sp.hair, tail: sp.tailColor || sp.hair,
    gold: '#ffd54f', blush: '#ff8fa3', mouth: '#9c2f45', lash: OUTLINE,
  };
  p.horn = { bull: '#f3e6c8', curled: '#3b2350', dragon: shade(p.tail, -0.35), oni: '#ffe9a8', small: '#5d4037' }[sp.horns] || '#ddd';
  if (variant === 'radiant') {
    p.hair = shade(p.hair, 0.12); p.outfit = shade(p.outfit, 0.12); p.accent = '#ffd54f';
    p.wing = shade(p.wing, 0.15); p.lower = shade(p.lower, 0.1); p.tail = shade(p.tail, 0.12);
  } else if (variant === 'shadow') {
    const dusk = '#5b4a78';
    p.skin = mix(p.skin, dusk, 0.28); p.hair = shade(desaturate(p.hair, 0.35), -0.35);
    p.outfit = shade(desaturate(p.outfit, 0.45), -0.45); p.accent = '#b388ff'; p.eyes = '#ff1744';
    p.wing = shade(desaturate(p.wing, 0.3), -0.35); p.lower = shade(desaturate(p.lower, 0.3), -0.3);
    p.tail = shade(desaturate(p.tail, 0.3), -0.3); p.gold = '#b388ff'; p.blush = '#c26b9c';
  }
  return p;
}

const mirror = (pts, cx) => pts.map(([x, y]) => [2 * cx - x, y]);

function both(pb, cx, pts, fn) {
  fn(pts);
  fn(mirror(pts, cx));
}

// ---------------------------------------------------------------------------
// Chibi species sprite
// ---------------------------------------------------------------------------

const LOWER_H = { legs: [4, 6], bird: [4, 6], snake: [7, 8], fish: [7, 8], spider: [6, 7], horse: [9, 10], ghost: [5, 6], slime: [4, 4], tentacle: [6, 7] };

export function drawChibi(sp, stage, variant, pose = {}) {
  const pb = new PixelBuffer(SPRITE, SPRITE);
  const p = palette(sp, variant);
  const cx = 24, ground = 46;
  const big = stage >= 3 ? 1 : 0;
  const torsoH = big ? 9 : 7;
  const lowerH = LOWER_H[sp.lower][big];
  const hy = ground - lowerH - torsoH - 8;
  const neckY = hy + 7;
  const waistY = neckY + torsoH;
  const f = pose.flap ? 2 : 0;
  const s = pose.swing ? 1 : 0;
  const ult = stage === 4;

  const hairLight = shade(p.hair, 0.25), hairDark = shade(p.hair, -0.18);
  const skinDark = shade(p.skin, -0.1);

  // ---- wings (back) ----
  drawWingsBack(pb, sp, p, cx, neckY, f, big);

  // ---- tail (back) ----
  drawTail(pb, sp, p, cx, waistY, ground, s, stage);

  // ---- hair back ----
  const hb = (x, y, rx, ry) => pb.ellipse(x, y, rx, ry, p.hair, (px, py, nx, ny) => (ny > 0.5 ? hairDark : p.hair));
  switch (sp.hairStyle) {
    case 'long':
      hb(cx, hy, 9, 8); pb.rect(cx - 9, hy, 19, waistY - hy - 1, p.hair); jag(pb, cx - 9, cx + 9, waistY - 1, hairDark); break;
    case 'flowing':
      hb(cx, hy, 10, 8); pb.rect(cx - 10, hy, 21, waistY - hy + 1, p.hair); jag(pb, cx - 10, cx + 10, waistY + 1, hairDark); break;
    case 'bob': hb(cx, hy + 1, 10, 8); break;
    case 'short': hb(cx, hy, 9, 7); break;
    case 'wild':
      hb(cx, hy, 10, 8);
      both(pb, cx, [[cx - 10, hy], [cx - 14, hy + 9], [cx - 7, hy + 6]], (pts) => pb.poly(pts, hairDark));
      both(pb, cx, [[cx - 9, hy - 4], [cx - 14, hy - 2], [cx - 10, hy + 2]], (pts) => pb.poly(pts, p.hair));
      break;
    case 'twintails':
      hb(cx, hy, 9, 7); hb(cx - 12, hy + 5 + s, 3, 7); hb(cx + 12, hy + 5 + s, 3, 7); break;
    case 'ponytail':
      hb(cx, hy, 9, 7); hb(cx + 11, hy + 4 + s, 3, 7); break;
    case 'bun':
      hb(cx, hy, 9, 7); hb(cx - 7, hy - 6, 3, 3); hb(cx + 7, hy - 6, 3, 3); break;
    default: hb(cx, hy, 9, 7);
  }

  // ---- lower body ----
  drawLower(pb, sp, p, cx, waistY, ground, big, pose);

  // ---- torso ----
  const flare = (sp.lower === 'legs' || sp.lower === 'bird') && sp.outfitStyle !== 'armor';
  for (let i = 0; i < torsoH; i++) {
    const y = neckY + 1 + i;
    let half = i === 0 ? 3 : 4;
    if (flare && i >= torsoH - 3) half = 4 + (i - (torsoH - 4));
    pb.rect(cx - half, y, half * 2 + 1, 1, i >= torsoH - 2 && !flare ? shade(p.outfit, -0.1) : p.outfit);
  }
  // collar / outfit details
  pb.set(cx, neckY + 1, p.skin); pb.set(cx - 1, neckY + 1, p.accent); pb.set(cx + 1, neckY + 1, p.accent);
  if (sp.outfitStyle === 'kimono') {
    pb.line(cx - 2, neckY + 1, cx + 1, neckY + 4, p.accent);
    pb.rect(cx - 4, neckY + torsoH - 3, 9, 2, p.accent);
  } else if (sp.outfitStyle === 'armor') {
    pb.rect(cx - 4, neckY + torsoH - 2, 9, 1, p.accent);
    pb.rect(cx - 2, neckY + 3, 5, 2, shade(p.outfit, 0.2));
  } else if (sp.outfitStyle === 'tunic') {
    pb.rect(cx - 4, neckY + torsoH - 3, 9, 1, p.accent);
  } else {
    pb.rect(cx - 4, neckY + 4, 9, 1, p.accent);
  }
  if (sp.extras.includes('stripes')) {
    pb.rect(cx - 4, neckY + 3, 9, 1, '#2b2b2b'); pb.rect(cx - 5, neckY + torsoH - 1, 11, 1, '#2b2b2b');
  }
  if (sp.extras.includes('bandage')) {
    for (let y = neckY + 2; y < waistY; y += 2) pb.rect(cx - 4, y, 9, 1, shade(p.outfit, -0.12));
  }
  if (ult) { // royal sash + brooch
    pb.line(cx - 4, neckY + 2, cx + 3, neckY + torsoH - 1, p.gold);
    pb.set(cx, neckY + 2, p.gold);
  }

  // ---- arms ----
  drawArms(pb, sp, p, cx, neckY, torsoH, pose.arms || 'down');

  // ---- head ----
  pb.ellipse(cx, hy, 8, 7, p.skin, (x, y, nx, ny) => (ny > 0.6 ? skinDark : p.skin));

  // ---- hair front ----
  pb.ellipse(cx, hy - 1, 9, 7, null, (x, y) => { if (y <= hy - 3) pb.set(x, y, y <= hy - 6 ? hairLight : p.hair); return null; });
  const bangs = [2, 3, 1, 2, 3, 2, 1, 3, 1, 2, 3, 1, 2, 3, 2, 1, 2];
  for (let i = 0; i <= 16; i++) {
    const x = cx - 8 + i;
    for (let y = hy - 3; y <= hy - 3 + bangs[i]; y++) pb.set(x, y, p.hair);
  }
  const lock = sp.hairStyle === 'short' || sp.hairStyle === 'wild' ? 5 : 8;
  pb.rect(cx - 9, hy - 2, 2, lock, p.hair); pb.rect(cx + 8, hy - 2, 2, lock, p.hair);
  pb.set(cx - 9, hy - 2 + lock, hairDark); pb.set(cx + 9, hy - 2 + lock, hairDark);
  if (sp.hairStyle === 'twintails' || sp.hairStyle === 'ponytail') {
    pb.rect(cx + 9, hy - 2, 2, 2, p.accent);
    if (sp.hairStyle === 'twintails') pb.rect(cx - 10, hy - 2, 2, 2, p.accent);
  }

  // ---- ears / horns / head extras ----
  drawEars(pb, sp, p, cx, hy);
  drawHorns(pb, sp, p, cx, hy);
  drawHeadExtras(pb, sp, p, cx, hy, neckY);
  if (ult) {
    pb.rect(cx - 3, hy - 8, 7, 2, p.gold);
    pb.set(cx - 3, hy - 9, p.gold); pb.set(cx, hy - 10, p.gold); pb.set(cx, hy - 9, p.gold); pb.set(cx + 3, hy - 9, p.gold);
  }

  pb.outline(variant === 'shadow' ? '#1a1024' : OUTLINE);

  // ---- face (drawn after outline so it stays crisp) ----
  if (ult) pb.set(cx, hy - 8, variant === 'shadow' ? '#ff1744' : '#e53950');
  drawFace(pb, sp, p, cx, hy, pose);
  if (sp.extras.includes('halo')) {
    const hc = variant === 'shadow' ? '#b388ff' : '#ffe57f';
    for (let x = cx - 5; x <= cx + 5; x++) { pb.set(x, hy - 12, hc); }
    pb.set(cx - 6, hy - 11, hc); pb.set(cx + 6, hy - 11, hc);
    for (let x = cx - 4; x <= cx + 4; x++) pb.set(x, hy - 10, hc);
  }
  return pb;
}

function jag(pb, x0, x1, y, c) {
  for (let x = x0; x <= x1; x++) if ((x - x0) % 3 === 1) pb.set(x, y + 1, c);
}

function drawWingsBack(pb, sp, p, cx, neckY, f, big) {
  const w = p.wing, wd = shade(w, -0.25), wl = shade(w, 0.3);
  const k = big ? 1 : 0;
  switch (sp.wings) {
    case 'bat':
    case 'dragon': {
      const e = sp.wings === 'dragon' ? 2 : 0;
      const pts = [[cx - 3, neckY + 2], [cx - 12 - k - e, neckY - 6 - e + f], [cx - 17 - k - e, neckY - 4 - e + f], [cx - 16 - k - e, neckY + 3],
        [cx - 13 - k, neckY + 2], [cx - 11 - k, neckY + 6], [cx - 8, neckY + 4], [cx - 5, neckY + 7]];
      both(pb, cx, pts, (q) => {
        pb.poly(q, w);
        pb.path([q[0], q[1], q[2]], wd);
        pb.line(q[1][0], q[1][1], q[4][0], q[4][1], wd);
      });
      break;
    }
    case 'feather': {
      for (const dir of [-1, 1]) {
        const X = (dx) => cx + dir * dx;
        pb.ellipse(X(10 + k), neckY + 1 - f, 6, 4, wl);
        pb.ellipse(X(14 + k), neckY - 2 - f, 4, 3, w);
        pb.ellipse(X(9 + k), neckY + 5, 5, 3, w);
        pb.ellipse(X(13 + k), neckY + 4 - f / 2, 3, 2, wd);
      }
      break;
    }
    case 'fairy':
      for (const dir of [-1, 1]) {
        pb.ellipse(cx + dir * 9, neckY - 1 - f, 4, 5, '#d7f4ff', (x, y, nx, ny) => (nx * nx + ny * ny > 0.5 ? '#ffc6f0' : '#e9fbff'));
        pb.ellipse(cx + dir * 8, neckY + 6, 3, 3, '#f3d9ff');
      }
      break;
    case 'bee':
      for (const dir of [-1, 1]) {
        pb.ellipse(cx + dir * 8, neckY - 1 - f, 3, 4, '#e3f6ff');
        pb.ellipse(cx + dir * 7, neckY + 4, 2, 2, '#e3f6ff');
      }
      break;
    case 'moth':
      for (const dir of [-1, 1]) {
        pb.ellipse(cx + dir * (11 + k), neckY + 0 - f, 7, 6, w, (x, y, nx, ny) => (nx * nx + ny * ny > 0.65 ? wd : w));
        pb.ellipse(cx + dir * (8 + k), neckY + 7, 4, 3, wl);
        pb.ellipse(cx + dir * (12 + k), neckY - f, 1.5, 1.5, '#5d4037');
        pb.set(cx + dir * (12 + k), neckY - f - 1, '#fff8e1');
      }
      break;
  }
}

function drawTail(pb, sp, p, cx, waistY, ground, s, stage) {
  const t = p.tail, td = shade(t, -0.2), tl = shade(t, 0.35);
  switch (sp.tail) {
    case 'cat': pb.path([[cx + 3, waistY], [cx + 8, waistY - 1], [cx + 10, waistY - 5 - s], [cx + 9 + s, waistY - 9 - s]], t, 2); break;
    case 'dog': pb.path([[cx + 3, waistY], [cx + 7, waistY - 3], [cx + 8 + s, waistY - 7]], t, 2); break;
    case 'fox': {
      const tails = stage >= 4 ? 3 : stage === 3 ? 2 : 1;
      const spots = [[9, -3], [-9, -3], [12, -9], [-12, -9], [0, -12]];
      for (let i = 0; i < Math.min(tails * 2 - 1, 5); i++) {
        const [dx, dy] = spots[i];
        pb.ellipse(cx + dx + (i % 2 ? -s : s), waistY + dy, 4, 6, t, (x, y, nx, ny) => (ny < -0.55 ? '#fffaf2' : nx > 0.5 ? td : t));
      }
      break;
    }
    case 'wolf':
      pb.ellipse(cx + 8 + s, waistY + 1, 3, 6, t, (x, y, nx, ny) => (ny > 0.6 ? tl : nx > 0.4 ? td : t)); break;
    case 'squirrel':
      pb.ellipse(cx + 9, waistY - 4, 5, 9, t, (x, y, nx, ny) => (nx < -0.3 ? tl : t));
      pb.ellipse(cx + 12 + s, waistY - 13, 3, 3, t); break;
    case 'puff': pb.ellipse(cx + 5, waistY, 2, 2, '#ffffff'); break;
    case 'cow':
      pb.path([[cx + 3, waistY], [cx + 8, waistY + 2], [cx + 9 + s, waistY + 6]], shade(p.skin, -0.2));
      pb.ellipse(cx + 9 + s, waistY + 7, 1, 1, p.hair); break;
    case 'devil': {
      const d = shade(p.wing, -0.1);
      pb.path([[cx + 3, waistY], [cx + 9, waistY + 2], [cx + 11, waistY - 2 - s]], d);
      pb.poly([[cx + 9, waistY - 2 - s], [cx + 13, waistY - 2 - s], [cx + 11, waistY - 6 - s]], d); break;
    }
    case 'dragon':
      pb.poly([[cx + 2, waistY - 1], [cx + 2, waistY + 3], [cx + 16, ground - 1 - s], [cx + 17, ground - 3 - s]], t);
      pb.line(cx + 3, waistY + 3, cx + 15, ground - 1 - s, tl);
      break;
    case 'stinger':
      pb.ellipse(cx + 6, waistY + 2, 4, 3, '#ffc107');
      pb.rect(cx + 5, waistY, 1, 5, '#2b2b2b'); pb.rect(cx + 8, waistY, 1, 5, '#2b2b2b');
      pb.set(cx + 11, waistY + 3, '#2b2b2b'); break;
  }
}

function drawLower(pb, sp, p, cx, waistY, ground, big, pose) {
  const L = p.lower, Ld = shade(L, -0.22), Ll = shade(L, 0.3);
  switch (sp.lower) {
    case 'legs': {
      const shoe = shade(p.outfit, -0.35);
      const legY = waistY + 1, h = ground - legY + 1;
      pb.rect(cx - 3, legY, 2, h, p.skin); pb.rect(cx + 2, legY, 2, h, p.skin);
      pb.rect(cx - 3, ground - 1, 3, 2, shoe); pb.rect(cx + 2, ground - 1, 3, 2, shoe);
      if (sp.extras.includes('bandage')) { pb.set(cx - 3, legY + 1, p.outfit); pb.set(cx + 3, legY + 2, p.outfit); }
      break;
    }
    case 'bird': {
      const leg = '#f9a825';
      pb.ellipse(cx - 2, waistY + 1, 2, 1, p.wing); pb.ellipse(cx + 2, waistY + 1, 2, 1, p.wing);
      pb.rect(cx - 2, waistY + 2, 1, ground - waistY - 2, leg); pb.rect(cx + 2, waistY + 2, 1, ground - waistY - 2, leg);
      pb.rect(cx - 4, ground, 4, 1, leg); pb.rect(cx + 1, ground, 4, 1, leg);
      break;
    }
    case 'snake':
      pb.rect(cx - 3, waistY + 1, 7, ground - waistY - 3, L);
      pb.ellipse(cx + 3, ground - 2, 10, 2, L, (x, y, nx, ny) => (ny > 0.3 ? Ld : L));
      pb.path([[cx + 12, ground - 2], [cx + 14, ground - 4], [cx + 14, ground - 6]], L, 2);
      pb.rect(cx - 1, waistY + 1, 3, ground - waistY - 3, Ll);
      for (let y = waistY + 2; y < ground - 2; y += 2) { pb.set(cx - 3, y, Ld); pb.set(cx + 3, y + 1, Ld); }
      break;
    case 'fish':
      pb.rect(cx - 3, waistY + 1, 7, 3, L);
      pb.rect(cx - 2, waistY + 4, 5, ground - waistY - 6, L);
      pb.ellipse(cx - 4, ground - 1, 4, 1.5, Ll); pb.ellipse(cx + 4, ground - 1, 4, 1.5, Ll);
      for (let y = waistY + 2; y < ground - 2; y += 2) pb.set(cx + ((y / 2) % 2 ? -1 : 1), y, Ld);
      break;
    case 'spider':
      pb.ellipse(cx + 7, ground - 7, 7, 5, L, (x, y, nx, ny) => (ny < -0.5 ? Ll : L));
      pb.set(cx + 8, ground - 8, '#e53935'); pb.set(cx + 8, ground - 6, '#e53935'); pb.set(cx + 9, ground - 7, '#e53935'); pb.set(cx + 7, ground - 7, '#e53935');
      for (let i = 0; i < 4; i++) {
        const legPts = [[cx - 2, waistY + 2 + i], [cx - 8 - i * 2, waistY - 2 + i * 2 + (pose.flap ? 1 : 0)], [cx - 10 - i * 2, ground]];
        both(pb, cx, legPts, (q) => pb.path(q, Ld));
      }
      pb.ellipse(cx, waistY + 2, 4, 2, L);
      break;
    case 'horse': {
      pb.ellipse(cx + 6, waistY + 3, 10, 4, L, (x, y, nx, ny) => (ny < -0.5 ? Ll : ny > 0.5 ? Ld : L));
      const hoof = '#3e2723';
      for (const lx of [cx - 2, cx + 1, cx + 10, cx + 13]) {
        pb.rect(lx, waistY + 6, 2, ground - waistY - 6, L); pb.rect(lx, ground, 2, 1, hoof);
      }
      pb.path([[cx + 16, waistY + 1], [cx + 18, waistY + 4], [cx + 19, waistY + 9]], p.hair, 2);
      break;
    }
    case 'ghost': {
      const o = p.outfit;
      pb.ellipse(cx, waistY + 1, 5, 3, o); pb.ellipse(cx + 2, waistY + 4, 4, 2, o);
      pb.ellipse(cx + 4, waistY + 6, 2, 1, shade(o, -0.05)); pb.set(cx + 7, waistY + 7, shade(o, -0.08));
      break;
    }
    case 'slime': {
      const sl = p.skin;
      pb.poly([[cx - 4, waistY], [cx + 4, waistY], [cx + 9, ground - 1], [cx - 9, ground - 1]], sl);
      pb.ellipse(cx, ground - 1, 11, 2, shade(sl, -0.08));
      pb.set(cx - 6, ground - 3, '#ffffff'); pb.set(cx + 7, ground - 2, shade(sl, 0.5));
      break;
    }
    case 'tentacle':
      for (let i = 0; i < 6; i++) {
        const x0 = cx - 4 + i * 1.6, x1 = cx - 11 + i * 4.4;
        const curl = i < 3 ? -1 : 1;
        pb.path([[x0, waistY + 1], [x0 + (x1 - x0) * 0.5, ground - 4], [x1, ground - 1], [x1 + curl * 2, ground - 3]], i % 2 ? L : Ld, 2);
      }
      pb.ellipse(cx, waistY + 2, 5, 2, L);
      break;
  }
}

function drawArms(pb, sp, p, cx, neckY, torsoH, arms) {
  const sleeve = shade(p.outfit, -0.08);
  const hand = p.skin;
  const one = (dir, mode) => {
    const X = (dx) => cx + dir * dx;
    if (sp.wings === 'harpy') {
      const w = p.wing;
      if (mode === 'up') pb.ellipse(X(8), neckY - 1, 2, 5, w, (x, y, nx, ny) => (ny < -0.4 ? shade(w, 0.3) : w));
      else pb.ellipse(X(7), neckY + 5, 2, 5, w, (x, y, nx, ny) => (ny > 0.4 ? shade(w, -0.2) : w));
      return;
    }
    if (mode === 'up') {
      pb.line(X(5), neckY + 2, X(8), neckY - 3, sleeve, 2);
      pb.rect(Math.min(X(8), X(9)), neckY - 5, 2, 2, hand);
    } else {
      const top = neckY + 2;
      pb.rect(Math.min(X(5), X(6)), top, 2, torsoH - 2, hand);
      pb.rect(Math.min(X(5), X(6)), top, 2, 2, sleeve);
    }
  };
  one(-1, arms === 'up' ? 'up' : 'down');
  one(1, arms === 'up' || arms === 'wave' ? 'up' : 'down');
}

function drawEars(pb, sp, p, cx, hy) {
  const h = p.hair, inner = '#ffb3c4';
  switch (sp.ears) {
    case 'cat':
      both(pb, cx, [[cx - 8, hy - 4], [cx - 7, hy - 11], [cx - 3, hy - 7]], (q) => pb.poly(q, h));
      pb.set(cx - 6, hy - 7, inner); pb.set(cx - 6, hy - 8, inner); pb.set(cx + 6, hy - 7, inner); pb.set(cx + 6, hy - 8, inner);
      break;
    case 'fox':
    case 'wolf': {
      const tip = sp.ears === 'fox' ? 12 : 11;
      both(pb, cx, [[cx - 9, hy - 3], [cx - 8, hy - tip], [cx - 3, hy - 7]], (q) => pb.poly(q, h));
      for (const d of [-1, 1]) { pb.set(cx + d * 7, hy - 7, '#fff3e0'); pb.set(cx + d * 7, hy - 8, '#fff3e0'); pb.set(cx + d * 6, hy - 7, '#fff3e0'); }
      break;
    }
    case 'dog':
      pb.ellipse(cx - 9, hy - 1, 2, 4, shade(h, -0.15)); pb.ellipse(cx + 9, hy - 1, 2, 4, shade(h, -0.15)); break;
    case 'bunny':
      pb.ellipse(cx - 4, hy - 12, 2, 6, h); pb.ellipse(cx + 4, hy - 12, 2, 6, h);
      pb.rect(cx - 4, hy - 15, 1, 6, inner); pb.rect(cx + 4, hy - 15, 1, 6, inner); break;
    case 'squirrel':
      both(pb, cx, [[cx - 8, hy - 4], [cx - 6, hy - 10], [cx - 4, hy - 6]], (q) => pb.poly(q, h));
      pb.set(cx - 6, hy - 11, shade(h, 0.4)); pb.set(cx + 6, hy - 11, shade(h, 0.4)); break;
    case 'cow':
      pb.ellipse(cx - 10, hy - 3, 2, 1, p.skin); pb.ellipse(cx + 10, hy - 3, 2, 1, p.skin);
      pb.set(cx - 10, hy - 3, inner); pb.set(cx + 10, hy - 3, inner); break;
    case 'elf': both(pb, cx, [[cx - 8, hy + 1], [cx - 13, hy - 3], [cx - 8, hy + 3]], (q) => pb.poly(q, p.skin)); break;
    case 'elfShort': both(pb, cx, [[cx - 8, hy + 1], [cx - 11, hy - 1], [cx - 8, hy + 3]], (q) => pb.poly(q, p.skin)); break;
    case 'goblin': both(pb, cx, [[cx - 8, hy], [cx - 15, hy - 1], [cx - 8, hy + 3]], (q) => pb.poly(q, p.skin)); break;
    case 'fin': {
      const fc = sp.lowerColor || p.tail || p.accent;
      both(pb, cx, [[cx - 8, hy], [cx - 12, hy - 3], [cx - 12, hy + 3], [cx - 8, hy + 3]], (q) => pb.poly(q, fc));
      pb.set(cx - 10, hy, shade(fc, 0.4)); pb.set(cx + 10, hy, shade(fc, 0.4)); break;
    }
  }
}

function drawHorns(pb, sp, p, cx, hy) {
  const c = p.horn, cd = shade(c, -0.25);
  switch (sp.horns) {
    case 'bull':
      both(pb, cx, [[cx - 7, hy - 5], [cx - 11, hy - 6], [cx - 13, hy - 9]], (q) => { pb.path(q.slice(0, 2), c, 2); pb.path(q.slice(1), cd); });
      break;
    case 'curled':
      both(pb, cx, [[cx - 4, hy - 7], [cx - 6, hy - 10], [cx - 8, hy - 11], [cx - 9, hy - 9]], (q) => pb.path(q, c, 2));
      break;
    case 'dragon':
      both(pb, cx, [[cx - 4, hy - 6], [cx - 7, hy - 9], [cx - 10, hy - 12]], (q) => { pb.path(q.slice(0, 2), c, 2); pb.path(q.slice(1), cd); });
      break;
    case 'oni':
      both(pb, cx, [[cx - 5, hy - 6], [cx - 3, hy - 6], [cx - 4, hy - 11]], (q) => pb.poly(q, c));
      break;
    case 'small':
      both(pb, cx, [[cx - 4, hy - 6], [cx - 5, hy - 9]], (q) => pb.path(q, c, 2));
      break;
  }
}

function drawHeadExtras(pb, sp, p, cx, hy, neckY) {
  const ex = sp.extras;
  if (ex.includes('flower')) {
    pb.ellipse(cx + 7, hy - 5, 2, 2, '#ff8fc8'); pb.set(cx + 7, hy - 5, '#fff176');
    pb.ellipse(cx - 7, hy - 6, 1, 1, '#ffffff');
  }
  if (ex.includes('snakehair')) {
    for (const [x, y] of [[cx - 10, hy - 5], [cx - 5, hy - 9], [cx + 4, hy - 9], [cx + 10, hy - 5]]) {
      pb.ellipse(x, y, 2, 1.5, shade(p.hair, 0.15));
    }
  }
  if (ex.includes('flame')) {
    pb.poly([[cx - 3, hy - 7], [cx - 1, hy - 13], [cx + 3, hy - 7]], '#ff7043');
    pb.poly([[cx - 1, hy - 7], [cx, hy - 10], [cx + 1, hy - 7]], '#ffeb3b');
  }
  if (ex.includes('antennae') || ex.includes('antennaeFeather')) {
    both(pb, cx, [[cx - 2, hy - 7], [cx - 4, hy - 13]], (q) => pb.path(q, '#3e2723'));
    if (ex.includes('antennae')) { pb.ellipse(cx - 4, hy - 14, 1, 1, '#3e2723'); pb.ellipse(cx + 4, hy - 14, 1, 1, '#3e2723'); }
    else for (let y = hy - 12; y <= hy - 9; y++) { pb.set(cx - 5, y, p.hair); pb.set(cx + 5, y, p.hair); pb.set(cx - 2, y, p.hair); pb.set(cx + 2, y, p.hair); }
  }
  if (ex.includes('snowflake')) {
    const x = cx + 7, y = hy - 4;
    pb.set(x, y, '#ffffff'); pb.set(x - 1, y, '#81d4fa'); pb.set(x + 1, y, '#81d4fa'); pb.set(x, y - 1, '#81d4fa'); pb.set(x, y + 1, '#81d4fa');
  }
  if (ex.includes('fluff')) pb.ellipse(cx, neckY + 1, 5, 2, '#fffdf5');
}

function drawFace(pb, sp, p, cx, hy, pose) {
  const eyes = pose.eyes || 'open';
  const ey = hy + 1;
  const lash = p.lash;
  for (const ex of [cx - 5, cx + 4]) {
    if (eyes === 'closed') {
      pb.set(ex - 1, ey + 1, lash); pb.set(ex, ey + 2, lash); pb.set(ex + 1, ey + 2, lash); pb.set(ex + 2, ey + 1, lash);
    } else if (eyes === 'happy') {
      pb.set(ex - 1, ey + 2, lash); pb.set(ex, ey + 1, lash); pb.set(ex + 1, ey + 1, lash); pb.set(ex + 2, ey + 2, lash);
    } else {
      pb.rect(ex, ey, 2, 1, lash);
      pb.set(ex, ey + 1, '#ffffff'); pb.set(ex + 1, ey + 1, p.eyes);
      pb.set(ex, ey + 2, shade(p.eyes, -0.3)); pb.set(ex + 1, ey + 2, shade(p.eyes, 0.25));
      if (sp.pupil === 'slit') pb.set(ex + 1, ey + 1, shade(p.eyes, -0.5));
      if (eyes === 'sad') { pb.set(ex + (ex < cx ? 1 : 0), ey - 1, lash); pb.set(ex + (ex < cx ? 2 : -1), ey - 2, lash); }
      if (eyes === 'angry') { pb.set(ex + (ex < cx ? 1 : 0), ey - 2, lash); pb.set(ex + (ex < cx ? 2 : -1), ey - 1, lash); }
    }
  }
  // blush
  pb.set(cx - 7, hy + 4, p.blush); pb.set(cx - 6, hy + 4, p.blush); pb.set(cx + 6, hy + 4, p.blush); pb.set(cx + 7, hy + 4, p.blush);
  const my = hy + 5;
  switch (pose.mouth || 'smile') {
    case 'open':
      pb.rect(cx - 1, my, 3, 2, p.mouth); pb.set(cx, my + 1, '#ff8a9a'); break;
    case 'frown': pb.set(cx - 1, my + 1, p.mouth); pb.set(cx, my, p.mouth); pb.set(cx + 1, my + 1, p.mouth); break;
    case 'flat': pb.rect(cx - 1, my, 3, 1, p.mouth); break;
    default: pb.set(cx - 1, my, p.mouth); pb.set(cx, my + 1, p.mouth); pb.set(cx + 1, my, p.mouth);
  }
  if (sp.extras.includes('fangs') && pose.mouth !== 'frown') pb.set(cx + 1, my + 1, '#ffffff');
  if (sp.extras.includes('tusks')) { pb.set(cx - 2, my, '#fffde7'); pb.set(cx + 2, my, '#fffde7'); }
  if (sp.extras.includes('scales')) { pb.set(cx - 7, hy + 2, shade(p.tail, -0.05)); pb.set(cx + 7, hy + 2, shade(p.tail, -0.05)); }
  if (sp.extras.includes('bandage')) { pb.set(cx + 5, hy - 1, p.outfit); pb.set(cx + 6, hy - 1, p.outfit); pb.set(cx + 7, hy, p.outfit); }
}

// ---------------------------------------------------------------------------
// Egg & wisp
// ---------------------------------------------------------------------------

export function drawEgg(fam, crack = 0) {
  const pb = new PixelBuffer(SPRITE, SPRITE);
  const [a, b] = FAMILIES[fam].egg;
  const cx = 24, cy = 36;
  pb.ellipse(cx, cy, 8, 10, a, (x, y, nx, ny) => (nx > 0.5 && ny > -0.2 ? shade(a, -0.12) : nx < -0.4 && ny < -0.3 ? shade(a, 0.4) : a));
  for (let x = cx - 8; x <= cx + 8; x++) {
    const zz = (x % 4 < 2 ? 0 : 1);
    for (let y = cy + zz; y <= cy + zz + 2; y++) if (pb.get(x, y)) pb.set(x, y, b);
  }
  for (const [x, y] of [[cx - 3, cy - 6], [cx + 3, cy - 4], [cx - 1, cy + 6], [cx + 4, cy + 5]]) { pb.set(x, y, b); pb.set(x + 1, y, b); pb.set(x, y + 1, b); }
  pb.outline(OUTLINE);
  if (crack > 0) pb.path([[cx - 4, cy - 7], [cx - 2, cy - 5], [cx - 3, cy - 3], [cx, cy - 2]], OUTLINE);
  if (crack > 1) pb.path([[cx + 5, cy - 4], [cx + 3, cy - 2], [cx + 4, cy]], OUTLINE);
  return pb;
}

export function drawWisp(fam, pose = {}) {
  const pb = new PixelBuffer(SPRITE, SPRITE);
  const col = FAMILIES[fam].wisp, d = shade(col, -0.18), l = shade(col, 0.45);
  const cx = 24, cy = 38;
  const accent = FAMILIES[fam].egg[1];
  // family emblems behind body
  if (fam === 'sky') { pb.ellipse(cx - 11, cy - 3 - (pose.flap ? 1 : 0), 3, 2, '#ffffff'); pb.ellipse(cx + 11, cy - 3 - (pose.flap ? 1 : 0), 3, 2, '#ffffff'); }
  if (fam === 'infernal') { pb.path([[cx + 8, cy + 3], [cx + 13, cy + 1], [cx + 14, cy - 3]], accent); pb.poly([[cx + 12, cy - 3], [cx + 16, cy - 3], [cx + 14, cy - 6]], accent); }
  if (fam === 'spirit') { pb.ellipse(cx + 8, cy + 5, 3, 2, col); pb.set(cx + 12, cy + 6, col); }
  if (fam === 'draconic') pb.poly([[cx + 6, cy + 4], [cx + 15, cy + 7], [cx + 8, cy + 7]], accent);
  pb.ellipse(cx, cy, 10, 7, col, (x, y, nx, ny) => (ny > 0.55 ? d : nx < -0.3 && ny < -0.3 ? l : col));
  // top emblems
  if (fam === 'beast') both(pb, cx, [[cx - 8, cy - 4], [cx - 7, cy - 10], [cx - 3, cy - 6]], (q) => pb.poly(q, col));
  if (fam === 'wild') { pb.poly([[cx - 3, cy - 6], [cx, cy - 11], [cx + 1, cy - 6]], '#6d4c41'); pb.poly([[cx, cy - 6], [cx + 4, cy - 10], [cx + 3, cy - 6]], '#6d4c41'); }
  if (fam === 'sylvan') { pb.line(cx, cy - 7, cx, cy - 10, '#2e7d32'); pb.ellipse(cx - 2, cy - 11, 2, 1, '#66bb6a'); pb.ellipse(cx + 2, cy - 11, 2, 1, '#43a047'); }
  if (fam === 'tide') pb.poly([[cx - 2, cy - 6], [cx + 1, cy - 12], [cx + 3, cy - 6]], accent);
  if (fam === 'infernal' || fam === 'draconic') both(pb, cx, [[cx - 4, cy - 6], [cx - 6, cy - 9]], (q) => pb.path(q, fam === 'draconic' ? '#ffe0b2' : '#3b2350', 2));
  if (fam === 'spirit') pb.poly([[cx - 2, cy - 6], [cx, cy - 11], [cx + 2, cy - 6]], l);
  pb.outline(OUTLINE);
  const eyes = pose.eyes || 'open';
  for (const ex of [cx - 5, cx + 4]) {
    if (eyes === 'closed') { pb.rect(ex, cy, 2, 1, OUTLINE); }
    else if (eyes === 'happy') { pb.set(ex - 1, cy + 1, OUTLINE); pb.set(ex, cy, OUTLINE); pb.set(ex + 1, cy, OUTLINE); pb.set(ex + 2, cy + 1, OUTLINE); }
    else { pb.rect(ex, cy - 2, 2, 3, OUTLINE); pb.set(ex, cy - 2, '#ffffff'); }
  }
  pb.set(cx - 7, cy + 2, '#ff8fa3'); pb.set(cx + 7, cy + 2, '#ff8fa3');
  if (pose.mouth === 'open') pb.rect(cx - 1, cy + 2, 2, 2, '#9c2f45');
  else if (pose.mouth === 'frown') { pb.set(cx - 1, cy + 3, OUTLINE); pb.set(cx, cy + 2, OUTLINE); pb.set(cx + 1, cy + 3, OUTLINE); }
  else { pb.set(cx - 1, cy + 2, OUTLINE); pb.set(cx, cy + 3, OUTLINE); pb.set(cx + 1, cy + 2, OUTLINE); }
  return pb;
}

// ---------------------------------------------------------------------------
// Cached sprite lookup
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hand-made sprites (art/sprites/*.js)
// ---------------------------------------------------------------------------

export const handSprite = (speciesId, stage) => (SPRITES[speciesId] && SPRITES[speciesId][stage]) || null;

// Variant recolors are driven by each palette entry's role.
function recolor(c, role, variant) {
  if (variant === 'radiant') {
    if (role === 'metal') return mix(c, '#fff3b0', 0.25);
    if (['hair', 'cloth', 'accent', 'fur'].includes(role)) return shade(c, 0.12);
    return c;
  }
  if (variant === 'shadow') {
    switch (role) {
      case 'skin': return mix(c, '#5b4a78', 0.28);
      case 'eyes': case 'gem': return '#ff1744';
      case 'line': return '#1a1024';
      case 'white': return mix(c, '#b9a5d9', 0.4);
      case 'metal': return mix(c, '#b388ff', 0.6);
      case 'blush': return '#c26b9c';
      default: return shade(desaturate(c, 0.45), -0.38);
    }
  }
  return c;
}

// Renders a hand-made sprite definition with a pose (expression + breathing frame) and variant palette.
export function drawHand(def, variant = 'normal', pose = {}) {
  const rows = def.rows;
  const h = rows.length, w = rows[0].length;
  const pb = new PixelBuffer(w, h + 1); // +1 empty row so feet sit on the ground line like procedural sprites
  const col = {};
  for (const [ch, v] of Object.entries(def.palette)) {
    const [c, role] = Array.isArray(v) ? v : [v, 'cloth'];
    col[ch] = recolor(c, role, variant);
  }
  const lift = pose.flap && def.breath ? def.breath : 0; // rows above this line move down 1px on frame 2
  const put = (from, to) => {
    for (let y = from; y < to; y++) {
      const r = rows[y];
      for (let x = 0; x < w; x++) if (r[x] !== '.') pb.set(x, y + (y < lift ? 1 : 0), col[r[x]]);
    }
  };
  put(lift, h);
  put(0, lift);
  const line = col[def.face.lash || 'k'] || OUTLINE;
  pb.outline(variant === 'shadow' ? '#1a1024' : def.outline || OUTLINE);

  const f = def.face;
  const skin = col[f.skin || 's'];
  const dy = (y) => y + (y < lift ? 1 : 0);
  const ew = f.eyeW || 3, eh = f.eyeH || 3;
  const eyes = pose.eyes || 'open';
  f.eyes.forEach(([ex, ey0], i) => {
    const ey = dy(ey0);
    const inner = i === 0 ? ex + ew - 1 : ex;
    const outer = i === 0 ? ex : ex + ew - 1;
    if (eyes === 'closed' || eyes === 'happy') {
      pb.rect(ex, ey, ew, eh, skin);
      for (let k = 0; k < ew; k++) {
        const edge = k === 0 || k === ew - 1;
        pb.set(ex + k, eyes === 'closed' ? ey + eh - (edge ? 2 : 1) : ey + eh - (edge ? 1 : 2), line);
      }
    } else if (eyes === 'sad') {
      pb.set(inner, ey - 2, line); pb.set(outer, ey - 1, line);
    } else if (eyes === 'angry') {
      pb.set(inner, ey - 1, line); pb.set(outer, ey - 2, line);
    }
  });
  const mouth = pose.mouth || 'smile';
  if (f.mouth && mouth !== 'smile') {
    const [mx, my0] = f.mouth, my = dy(my0), mw = f.mouthW || 3;
    pb.rect(mx, my, mw, 2, skin);
    const mc = col[f.mouthColor || 'm'] || '#9c2f45';
    if (mouth === 'open') { pb.rect(mx, my, mw, 2, mc); pb.rect(mx + 1, my + 1, Math.max(1, mw - 2), 1, '#ff8a9a'); }
    else if (mouth === 'frown') { pb.rect(mx + 1, my, Math.max(1, mw - 2), 1, mc); pb.set(mx, my + 1, mc); pb.set(mx + mw - 1, my + 1, mc); }
    else if (mouth === 'flat') pb.rect(mx, my, mw, 1, mc);
  }
  return pb;
}

// Pixel buffer for a species at a stage (hand-made when available, procedural otherwise).
export function speciesSprite(sp, stage, variant = 'normal', pose = {}) {
  const hand = handSprite(sp.id, stage);
  return hand ? drawHand(hand, variant, pose) : drawChibi(sp, stage, variant, pose);
}

// ---------------------------------------------------------------------------
// Cached sprite lookup
// ---------------------------------------------------------------------------

export function petSprite(pet, pose = {}, opts = {}) {
  const key = JSON.stringify([pet.stage, pet.family, pet.species, pet.variant, pose, opts.crack, opts.silhouette]);
  let cv = cache.get(key);
  if (cv) return cv;
  let pb;
  if (pet.stage === 0) pb = drawEgg(pet.family, opts.crack || 0);
  else if (pet.stage === 1 || !pet.species) pb = drawWisp(pet.family, pose);
  else pb = speciesSprite(opts.sp, pet.stage, pet.variant, pose);
  if (opts.silhouette) pb.fillAll(opts.silhouette);
  cv = pb.toCanvas();
  if (cache.size > 400) cache.clear();
  cache.set(key, cv);
  return cv;
}

// Draws a sprite canvas centered on x with its feet on groundY (sprites have one empty bottom row).
export function blitSprite(ctx, cv, x, groundY, flip = false) {
  const top = groundY - cv.height + 1, half = Math.floor(cv.width / 2);
  ctx.save();
  if (flip) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(cv, -half, top); }
  else ctx.drawImage(cv, Math.round(x) - half, top);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Effect icons
// ---------------------------------------------------------------------------

export const ICONS = {
  heart: bitmap(['.rr.rr.', 'rpprrrr', 'rprrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#ff4d6d', p: '#ffc2d1' }),
  note: bitmap(['..bbb', '..b.b', '..b.b', 'bbb.b', 'bbbbb', 'bb...'].map((r) => r.padEnd(5, '.')), { b: '#5a4fcf' }),
  zzz: bitmap(['zzzz', '...z', '..z.', '.z..', 'zzzz'], { z: '#cfd8ff' }),
  bubble: bitmap(['.bbb.', 'bw..b', 'b...b', 'b...b', '.bbb.'], { b: '#7fd3ff', w: '#ffffff' }),
  sparkle: bitmap(['..y..', '..y..', 'yywyy', '..y..', '..y..'], { y: '#ffe066', w: '#ffffff' }),
  anger: bitmap(['r.r.r', '.r.r.', 'r...r', '.r.r.', 'r.r.r'], { r: '#ff1744' }),
  sweat: bitmap(['.b.', 'bbb', 'bbb', '.b.'], { b: '#7fd3ff' }),
  exclaim: bitmap(['.kkk.', 'kyyyk', 'kyyyk', 'kyyyk', '.kyk.', '.kyk.', '..k..', '.kyk.', '..k..'], { k: '#2b2238', y: '#ffe066' }),
  sick: bitmap(['.ggg.', 'g...g', 'g.g.g', 'g..g.', '.gg..'], { g: '#7bd36b' }),
  poop: bitmap([
    '...bb...',
    '..bbbb..',
    '.bbBbbb.',
    '.bbbbbb.',
    'bbBbbbbb',
    'bbbbbbBb',
    '.bbbbbb.',
  ], { b: '#8d5a3b', B: '#b98060' }),
  meal: bitmap([
    '..www...',
    '.wwwww..',
    'wwwwwww.',
    'wwwwwww.',
    'wkkkkkw.',
    '.kkkkk..',
  ].map((r) => r.padEnd(8, '.')), { w: '#ffffff', k: '#2e3b2e' }),
  snack: bitmap([
    '...r....',
    '.wwwww..',
    'wwwwwww.',
    'ppppppp.',
    'yyyyyyy.',
    'yyyyyyy.',
  ], { r: '#ff1744', w: '#fff8f0', p: '#ff8fb1', y: '#f5c26b' }),
  star: bitmap(['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.', 'y.....y'], { y: '#ffd54f' }),
  wisp: bitmap(['..p..', '.ppp.', 'ppPpp', '.ppp.', '..p..'], { p: '#b388ff', P: '#ede7f6' }),
};

// ---------------------------------------------------------------------------
// Room backdrops (120 x 96)
// ---------------------------------------------------------------------------

export const ROOM_W = 120, ROOM_H = 96, FLOOR_Y = 70, PET_GROUND = 87;
const roomCache = new Map();

export function roomCanvas(fam) {
  if (roomCache.has(fam)) return roomCache.get(fam);
  const cv = document.createElement('canvas');
  cv.width = ROOM_W; cv.height = ROOM_H;
  const c = cv.getContext('2d');
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const bands = (cols, y0, y1) => { const h = (y1 - y0) / cols.length; cols.forEach((col, i) => R(0, Math.round(y0 + i * h), ROOM_W, Math.ceil(h), col)); };
  const circle = (x, y, r, col) => { c.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); c.fillRect(x - w, y + j, w * 2 + 1, 1); } };
  switch (FAMILIES[fam].room) {
    case 'cottage':
      bands(['#ffe9d2', '#ffe2c6'], 0, FLOOR_Y);
      for (let x = 0; x < ROOM_W; x += 10) R(x, 0, 4, FLOOR_Y, '#ffdcbc');
      R(14, 14, 28, 24, '#8b5a3c'); R(16, 16, 24, 20, '#9fe0ff'); R(16, 28, 24, 8, '#c4f0c4'); R(27, 16, 2, 20, '#8b5a3c'); R(16, 25, 24, 2, '#8b5a3c');
      R(12, 38, 32, 3, '#a86d48');
      R(78, 30, 24, 40, '#c98b5a'); R(80, 34, 20, 14, '#b47a4c'); R(80, 52, 20, 14, '#b47a4c'); circle(98, 52, 1, '#ffd54f');
      bands(['#d69a68', '#c98b5a', '#b97b4c'], FLOOR_Y, ROOM_H);
      for (let x = 0; x < ROOM_W; x += 16) R(x, FLOOR_Y, 1, ROOM_H - FLOOR_Y, '#a86d48');
      R(30, 82, 60, 10, '#ff9eb5'); R(32, 84, 56, 6, '#ffc2d1');
      break;
    case 'camp':
      bands(['#9fd8ff', '#b9e4ff', '#d5f0ff'], 0, 40);
      R(0, 40, ROOM_W, FLOOR_Y - 40, '#8fcf6f');
      for (let i = 0; i < 4; i++) circle(10 + i * 34, 46, 14, i % 2 ? '#7bbd5e' : '#86c766');
      c.fillStyle = '#d98c4a'; c.beginPath(); c.moveTo(70, 70); c.lineTo(88, 40); c.lineTo(106, 70); c.fill();
      R(85, 56, 6, 14, '#5d3a22');
      bands(['#a8774f', '#9b6c46', '#8a5f3d'], FLOOR_Y, ROOM_H);
      R(14, 78, 14, 3, '#6d4c41'); circle(21, 75, 3, '#ff7043'); circle(21, 74, 1, '#ffeb3b');
      break;
    case 'forest':
      bands(['#c9f7d4', '#b4efc4', '#9fe3b2'], 0, FLOOR_Y);
      for (const [x, w] of [[6, 8], [36, 6], [92, 10]]) { R(x, 10, w, FLOOR_Y - 10, '#7a5236'); circle(x + w / 2, 12, 14, '#3f9f5f'); circle(x + w / 2 - 6, 18, 9, '#4fb06e'); }
      for (let i = 0; i < 12; i++) R((i * 37) % ROOM_W, 20 + ((i * 13) % 40), 1, 1, '#fff9c4');
      bands(['#5fb85f', '#52a852', '#479847'], FLOOR_Y, ROOM_H);
      for (const x of [12, 50, 70, 104]) { circle(x, 80, 1, '#ff8fc8'); R(x, 81, 1, 3, '#2e7d32'); }
      break;
    case 'haunt':
      bands(['#2a2350', '#352b62', '#433673', '#4f3f80'], 0, FLOOR_Y);
      circle(92, 18, 9, '#fff5d6'); circle(96, 15, 8, '#352b62');
      for (let i = 0; i < 14; i++) R((i * 29) % ROOM_W, (i * 17) % 50, 1, 1, '#ffffff');
      for (const x of [14, 40, 100]) { R(x, 52, 10, 18, '#8e8aa8'); circle(x + 5, 52, 5, '#8e8aa8'); R(x + 4, 55, 2, 6, '#6c6888'); R(x + 2, 57, 6, 2, '#6c6888'); }
      bands(['#3b3458', '#332d4d', '#2b2642'], FLOOR_Y, ROOM_H);
      for (let x = 0; x < ROOM_W; x += 12) R(x, FLOOR_Y + 2, 8, 2, '#4a4170');
      break;
    case 'shore':
      bands(['#7fd0ff', '#9adbff', '#b5e6ff'], 0, 40);
      circle(20, 14, 7, '#fff3b0');
      bands(['#2e9bd6', '#3aa9e0', '#4bb8e8', '#62c6ee'], 40, FLOOR_Y);
      for (let x = 4; x < ROOM_W; x += 14) R(x, 48 + (x % 3) * 6, 6, 1, '#d6f3ff');
      bands(['#f7dfa6', '#f2d595', '#ebca86'], FLOOR_Y, ROOM_H);
      R(96, 84, 4, 3, '#ff9eb5'); R(16, 88, 3, 2, '#fff');
      break;
    case 'clouds':
      bands(['#bfe3ff', '#cfe9ff', '#e0f0ff', '#f0e6ff', '#ffe3f1'], 0, FLOOR_Y);
      circle(96, 16, 8, '#fff0a8');
      for (const [x, y] of [[20, 20], [60, 36], [100, 50]]) { circle(x, y, 6, '#ffffff'); circle(x + 7, y + 1, 5, '#ffffff'); circle(x - 7, y + 2, 4, '#ffffff'); }
      bands(['#ffffff', '#f6f4ff', '#ecebff'], FLOOR_Y, ROOM_H);
      for (let x = 0; x < ROOM_W; x += 10) circle(x + 5, FLOOR_Y, 5, '#ffffff');
      break;
    case 'abyss':
      bands(['#2a0b3d', '#3a0f52', '#4c1366', '#5e187a'], 0, FLOOR_Y);
      for (const x of [12, 106]) { R(x, 40, 4, 30, '#2b0a3a'); R(x + 1, 36, 2, 4, '#ffe0f0'); circle(x + 2, 34, 2, '#ff6fb1'); }
      for (const [x, y] of [[40, 20], [80, 14], [62, 40]]) { R(x, y, 3, 3, '#ff6fb1'); R(x + 1, y - 1, 1, 5, '#ff9ccc'); }
      bands(['#3a0f2a', '#330c25', '#2b0920'], FLOOR_Y, ROOM_H);
      R(10, 80, 30, 1, '#ff5f87'); R(60, 88, 40, 1, '#ff5f87'); R(40, 80, 1, 8, '#ff5f87');
      break;
    case 'lair':
      bands(['#3e2a1f', '#4a3224', '#56392a', '#634232'], 0, FLOOR_Y);
      for (let i = 0; i < 10; i++) R((i * 31) % ROOM_W, (i * 23) % 60, 3, 2, '#6f4b39');
      R(12, 30, 3, 12, '#5d4037'); circle(13, 28, 2, '#ff9100'); circle(13, 27, 1, '#ffee58');
      for (let i = 0; i < 9; i++) circle(84 + (i % 3) * 8, 66 - Math.floor(i / 3) * 4, 4, i % 2 ? '#ffd54f' : '#ffca28');
      R(94, 52, 3, 3, '#e53935'); R(86, 58, 2, 2, '#40c4ff');
      bands(['#7a5240', '#6d4836', '#5f3e2e'], FLOOR_Y, ROOM_H);
      break;
  }
  roomCache.set(fam, cv);
  return cv;
}
