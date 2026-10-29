// Anime-style CG portraits rendered as layered SVG, built from the same species parameters
// as the pixel sprites. One CG per species x stage (Spark/Bloom/Legend) x variant.
import { FAMILIES, SPECIES_BY_ID, VARIANTS, STAGE_NAMES } from './data.js';
import { palette } from './sprites.js';
import { CG_IMAGES } from '../art/registry.js';
import { shade, mix, seeded, escapeHtml } from './util.js';

const W = 400, H = 560, CX = 200;
let uid = 0;

export function speciesTitle(sp, stage, variant) {
  if (stage < 2) return stage === 0 ? 'Egg' : 'Wisp';
  return (VARIANTS[variant]?.prefix || '') + sp.names[stage - 2];
}

// One CG for display: a hand-made image when one is registered in art/registry.js, otherwise the
// procedural SVG. Returns { html, href, file } where html is an element with class "cg-frame".
export function cgView({ species, family, stage, variant = 'normal' }, opts = {}) {
  const style = opts.style ? ` style="${opts.style}"` : '';
  const imgs = species ? CG_IMAGES[species] : null;
  const src = imgs && (imgs[`${stage}-${variant}`] || imgs[stage]);
  if (src) {
    const sp = SPECIES_BY_ID[species];
    const title = speciesTitle(sp, stage, variant);
    const tinted = !imgs[`${stage}-${variant}`] && variant !== 'normal' ? ` cg-${variant}` : '';
    const name = opts.name || title;
    const sub = `${opts.name ? title + ' · ' : ''}${STAGE_NAMES[stage]} · ${FAMILIES[sp.fam].name}`;
    return {
      html: `<div class="cg-frame cg-art${tinted}${stage === 4 ? ' cg-legend' : ''}"${style}><img src="${src}" alt="${escapeHtml(title)}" loading="lazy">`
        + `<div class="cg-plate"><b>${escapeHtml(name)}</b><span>${escapeHtml(sub)}</span></div></div>`,
      href: src, file: src.split('/').pop(),
    };
  }
  const svg = stage === 1 ? makeWispCG(family, opts) : makeCG(species, stage, variant, opts);
  const url = cgDataUrl(svg);
  return { html: `<img class="cg-frame"${style} src="${url}" alt="CG" loading="lazy">`, href: url, file: 'mythpals-cg.svg' };
}

export function cgDataUrl(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Mirror an SVG path around the vertical center line (supports abs/rel M L Q C S T H V A Z).
const ARGS = { M: 2, L: 2, T: 2, Q: 4, S: 4, C: 6, H: 1, V: 1, A: 7, Z: 0 };
function mirrorPath(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  const out = [];
  let cmd = null, args = [];
  const flush = () => {
    if (!cmd) return;
    const U = cmd.toUpperCase(), rel = cmd !== U, n = ARGS[U];
    if (n === 0) { out.push(cmd); return; }
    for (let i = 0; i < args.length; i += n) {
      const a = args.slice(i, i + n);
      if (U === 'A') { a[2] = -a[2]; a[4] = a[4] ? 0 : 1; a[5] = rel ? -a[5] : 2 * CX - a[5]; }
      else if (U === 'H') a[0] = rel ? -a[0] : 2 * CX - a[0];
      else if (U !== 'V') for (let k = 0; k < n; k += 2) a[k] = rel ? -a[k] : 2 * CX - a[k];
      out.push((i === 0 ? cmd + ' ' : '') + a.map((v) => +v.toFixed(2)).join(' '));
    }
  };
  for (const t of toks) {
    if (/[a-zA-Z]/.test(t)) { flush(); cmd = t; args = []; }
    else args.push(+t);
  }
  flush();
  return out.join(' ');
}

const sym = (d, attrs) => `<path d="${d}" ${attrs}/><path d="${mirrorPath(d)}" ${attrs}/>`;

export function makeCG(speciesId, stage, variant = 'normal', opts = {}) {
  const sp = SPECIES_BY_ID[speciesId];
  const fam = FAMILIES[sp.fam];
  const p = palette(sp, variant);
  const id = 'cg' + uid++;
  const rnd = seeded(speciesId + stage + variant);
  const ult = stage === 4, champ = stage >= 3;
  const shadow = variant === 'shadow', radiant = variant === 'radiant';
  const ex = sp.extras;

  const hairL = shade(p.hair, 0.3), hairD = shade(p.hair, -0.25), hairDD = shade(p.hair, -0.45);
  const skinS = shade(p.skin, -0.12), skinL = shade(p.skin, 0.25);
  const line = shadow ? '#1a1024' : '#3a2440';
  const out = [];
  const add = (s) => out.push(s);

  // ------------------------------------------------------------------ defs
  const [bg0, bg1] = fam.bg;
  add(`<defs>
    <radialGradient id="${id}bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="${shadow ? mix(bg0, '#3a2b55', 0.6) : shade(bg0, 0.35)}"/>
      <stop offset="0.55" stop-color="${shadow ? mix(bg0, '#1d1530', 0.7) : bg0}"/>
      <stop offset="1" stop-color="${shadow ? '#120b1e' : bg1}"/>
    </radialGradient>
    <linearGradient id="${id}hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${hairL}"/><stop offset="0.35" stop-color="${p.hair}"/><stop offset="1" stop-color="${hairD}"/>
    </linearGradient>
    <linearGradient id="${id}iris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(p.eyes, -0.55)}"/><stop offset="0.45" stop-color="${p.eyes}"/><stop offset="1" stop-color="${shade(p.eyes, 0.55)}"/>
    </linearGradient>
    <linearGradient id="${id}skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skin}"/><stop offset="1" stop-color="${skinS}"/>
    </linearGradient>
    <linearGradient id="${id}outfit" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${shade(p.outfit, 0.18)}"/><stop offset="1" stop-color="${shade(p.outfit, -0.22)}"/>
    </linearGradient>
    <linearGradient id="${id}lower" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(p.lower, 0.15)}"/><stop offset="1" stop-color="${shade(p.lower, -0.3)}"/>
    </linearGradient>
    <linearGradient id="${id}wing" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(p.wing, 0.25)}"/><stop offset="1" stop-color="${shade(p.wing, -0.25)}"/>
    </linearGradient>
    <linearGradient id="${id}gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shadow ? '#d1b3ff' : '#fff3b0'}"/><stop offset="0.5" stop-color="${p.gold}"/><stop offset="1" stop-color="${shadow ? '#6a3fb0' : '#c8961e'}"/>
    </linearGradient>
    <linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.55" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="${id}ghostmask"><rect width="${W}" height="${H}" fill="url(#${id}fade)"/></mask>
    <filter id="${id}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="${id}soft"><feGaussianBlur stdDeviation="1.2"/></filter>
    <clipPath id="${id}frame"><rect x="0" y="0" width="${W}" height="${H}" rx="22"/></clipPath>
  </defs>`);
  add(`<g clip-path="url(#${id}frame)">`);

  // ------------------------------------------------------------ background
  add(`<rect width="${W}" height="${H}" fill="url(#${id}bg)"/>`);
  if (ult) {
    const rays = [];
    for (let i = 0; i < 18; i++) {
      const a0 = (i / 18) * Math.PI * 2, a1 = a0 + Math.PI / 30;
      rays.push(`M ${CX} 220 L ${CX + Math.cos(a0) * 600} ${220 + Math.sin(a0) * 600} L ${CX + Math.cos(a1) * 600} ${220 + Math.sin(a1) * 600} Z`);
    }
    add(`<path d="${rays.join(' ')}" fill="${shadow ? '#b388ff' : '#ffffff'}" opacity="0.13"/>`);
  }
  if (champ) {
    add(`<circle cx="${CX}" cy="225" r="150" fill="none" stroke="${shadow ? '#b388ff' : '#ffffff'}" stroke-opacity="0.35" stroke-width="3"/>`);
    add(`<circle cx="${CX}" cy="225" r="162" fill="none" stroke="${shadow ? '#b388ff' : '#ffffff'}" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="4 8"/>`);
  }
  add(`<circle cx="${CX}" cy="230" r="120" fill="${shadow ? '#7e57c2' : '#ffffff'}" opacity="0.25" filter="url(#${id}glow)"/>`);
  add(background(sp.fam, rnd, shadow));

  // -------------------------------------------------------------- wings
  add(wings(sp, p, id, rnd));

  // --------------------------------------------------------------- tails
  add(tails(sp, p, stage, line));

  // ------------------------------------------------------- spider legs etc
  if (sp.lower === 'spider') {
    for (let i = 0; i < 4; i++) {
      const y = 430 + i * 26, x2 = 30 - i * 6, y2 = 300 + i * 50;
      add(sym(`M 150 ${y} Q ${x2 + 40} ${y2 - 60} ${x2} ${y2} L ${x2 - 10} ${y2 + 90}`,
        `fill="none" stroke="${shade(p.lower, -0.1)}" stroke-width="${12 - i}" stroke-linecap="round" stroke-linejoin="round"`));
      add(sym(`M 150 ${y} Q ${x2 + 40} ${y2 - 60} ${x2} ${y2}`, `fill="none" stroke="${shade(p.lower, 0.35)}" stroke-width="2" opacity="0.6"`));
    }
  }

  // ------------------------------------------------------------ cape (ult)
  if (ult) {
    const cape = shadow ? '#2a1640' : radiant ? '#ffffff' : shade(p.accent, -0.1);
    add(`<path d="M 110 330 Q 40 420 30 560 L 370 560 Q 360 420 290 330 Z" fill="${cape}" stroke="${line}" stroke-width="2.5"/>`);
    add(`<path d="M 110 330 Q 60 420 52 560" fill="none" stroke="url(#${id}gold)" stroke-width="6"/>`);
    add(`<path d="M 290 330 Q 340 420 348 560" fill="none" stroke="url(#${id}gold)" stroke-width="6"/>`);
  }

  // ------------------------------------------------------------ hair back
  add(hairBack(sp, id, line, hairDD));

  // --------------------------------------------------------------- body
  const ghost = sp.lower === 'ghost';
  add(`<g ${ghost ? `mask="url(#${id}ghostmask)"` : ''} ${sp.lower === 'slime' ? 'opacity="0.92"' : ''}>`);
  // neck + shoulders
  add(`<path d="M 182 270 L 182 316 Q 150 322 122 334 Q 98 344 94 372 Q 86 420 84 560 L 316 560 Q 314 420 306 372 Q 302 344 278 334 Q 250 322 218 316 L 218 270 Z" fill="url(#${id}skin)" stroke="${line}" stroke-width="2.5"/>`);
  add(`<path d="M 182 292 Q 200 306 218 292 L 218 312 Q 200 326 182 312 Z" fill="${skinS}" opacity="0.6"/>`);
  add(`<path d="M 186 326 Q 192 334 200 332 M 214 326 Q 208 334 200 332" fill="none" stroke="${skinS}" stroke-width="2.5" stroke-linecap="round"/>`);
  add(outfit(sp, p, id, stage, line));
  add('</g>');

  // harpy arm-wings sit in front of the torso edges
  if (sp.wings === 'harpy') add(harpyArms(p, id, line));

  // snake / fish / tentacle / slime lower bodies in the foreground
  add(lowerFront(sp, p, id, line, rnd));

  // ---------------------------------------------------------------- head
  add(earsBack(sp, p, line));
  add(`<path d="M 138 205 C 138 150 165 128 200 128 C 235 128 262 150 262 205 C 262 238 252 258 234 272 Q 216 288 200 292 Q 184 288 166 272 C 148 258 138 238 138 205 Z" fill="url(#${id}skin)" stroke="${line}" stroke-width="2.5"/>`);
  add(`<path d="M 150 262 Q 200 300 250 262 Q 236 282 200 292 Q 164 282 150 262 Z" fill="${skinS}" opacity="0.35"/>`);
  add(face(sp, p, id, variant, line, stage));
  add(hairFront(sp, id, line, hairL));
  add(earsTop(sp, p, line));
  add(horns(sp, p, id, line));
  add(headExtras(sp, p, id, line, rnd));
  if (ult) add(crown(id, line, shadow));
  else if (champ) add(`<g transform="rotate(-20 262 156)"><path d="M 246 146 L 278 146 L 274 166 L 250 166 Z" fill="${p.accent}" stroke="${line}" stroke-width="2"/><circle cx="262" cy="156" r="6" fill="${p.eyes}" stroke="${line}" stroke-width="1.5"/></g>`);
  if (ex.includes('halo')) add(`<ellipse cx="${CX}" cy="92" rx="58" ry="14" fill="none" stroke="${shadow ? '#b388ff' : '#ffe57f'}" stroke-width="7" filter="url(#${id}soft)"/><ellipse cx="${CX}" cy="92" rx="58" ry="14" fill="none" stroke="#fffbe0" stroke-width="2.5"/>`);

  // ------------------------------------------------------------ overlays
  if (radiant) {
    for (let i = 0; i < 14; i++) add(sparkle(30 + rnd() * 340, 30 + rnd() * 420, 4 + rnd() * 8, '#fff8d0', 0.9));
  }
  if (shadow) {
    add(`<rect width="${W}" height="${H}" fill="#2a0f45" opacity="0.18"/>`);
    for (let i = 0; i < 9; i++) {
      const x = 20 + rnd() * 360, y = 360 + rnd() * 200;
      add(`<circle cx="${x}" cy="${y}" r="${18 + rnd() * 28}" fill="#7e3fd6" opacity="0.22" filter="url(#${id}glow)"/>`);
    }
  }
  add('</g>');

  // ---------------------------------------------------------- nameplate
  if (!opts.noPlate) {
    const title = speciesTitle(sp, stage, variant);
    const frame = ult ? `url(#${id}gold)` : champ ? '#ffffff' : 'rgba(255,255,255,0.75)';
    add(`<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="20" fill="none" stroke="${frame}" stroke-width="${ult ? 7 : 4}"/>`);
    add(`<rect x="40" y="${H - 74}" width="${W - 80}" height="54" rx="14" fill="${shadow ? '#1a1024' : '#ffffff'}" opacity="0.85" stroke="${line}" stroke-width="2"/>`);
    add(`<text x="${CX}" y="${H - 50}" text-anchor="middle" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-weight="700" font-size="20" fill="${shadow ? '#e8d9ff' : '#3a2440'}">${escapeHtml(opts.name || title)}</text>`);
    add(`<text x="${CX}" y="${H - 29}" text-anchor="middle" font-family="'Trebuchet MS', 'Segoe UI', sans-serif" font-size="13" fill="${shadow ? '#b9a5d9' : '#7a6a85'}">${escapeHtml(opts.name ? title + ' · ' : '')}${STAGE_NAMES[stage]} · ${fam.name}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${out.join('')}</svg>`;
}

// ------------------------------------------------------------------------
// Pieces
// ------------------------------------------------------------------------

function sparkle(x, y, r, c, o = 1) {
  return `<path d="M ${x} ${y - r} Q ${x} ${y} ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} Q ${x} ${y} ${x - r} ${y} Q ${x} ${y} ${x} ${y - r} Z" fill="${c}" opacity="${o}"/>`;
}

function background(fam, rnd, shadow) {
  const o = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const x = rnd() * W, y = rnd() * H * 0.85, r = 3 + rnd() * 9;
    switch (fam) {
      case 'beast': o.push(heart(x, y, r * 1.2, '#ffffff', 0.35)); break;
      case 'wild': o.push(`<path d="M ${x} ${y} q ${r} ${-r} ${r * 2} 0 q ${-r} ${r} ${-r * 2} 0 Z" fill="#6aa84f" opacity="0.45"/>`); break;
      case 'sylvan': o.push(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r / 2.2}" transform="rotate(${rnd() * 180} ${x} ${y})" fill="${rnd() > 0.5 ? '#a5e8a0' : '#ffd1ea'}" opacity="0.55"/>`); break;
      case 'spirit': o.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#c8b6ff" opacity="0.35"/><circle cx="${x}" cy="${y}" r="${r / 3}" fill="#ffffff" opacity="0.6"/>`); break;
      case 'tide': o.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.5"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 4}" fill="#fff" opacity="0.7"/>`); break;
      case 'sky': o.push(`<g opacity="0.7"><circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="#fff"/><circle cx="${x + r * 1.6}" cy="${y + 3}" r="${r * 1.2}" fill="#fff"/><circle cx="${x - r * 1.5}" cy="${y + 4}" r="${r}" fill="#fff"/></g>`); break;
      case 'infernal': o.push(heart(x, y, r, rnd() > 0.5 ? '#ff6fb1' : '#b388ff', 0.4)); break;
      case 'draconic': o.push(`<circle cx="${x}" cy="${y}" r="${r / 2.5}" fill="#ffdd57" opacity="0.65"/>`); break;
    }
  }
  for (let i = 0; i < 8; i++) o.push(sparkle(rnd() * W, rnd() * H * 0.8, 3 + rnd() * 5, shadow ? '#d1b3ff' : '#ffffff', 0.8));
  return o.join('');
}

function heart(x, y, r, c, o) {
  return `<path d="M ${x} ${y + r} C ${x - r * 2} ${y - r * 0.2} ${x - r} ${y - r * 1.6} ${x} ${y - r * 0.5} C ${x + r} ${y - r * 1.6} ${x + r * 2} ${y - r * 0.2} ${x} ${y + r} Z" fill="${c}" opacity="${o}"/>`;
}

function wings(sp, p, id, rnd) {
  const line = '#3a2440';
  switch (sp.wings) {
    case 'bat':
    case 'dragon': {
      const big = sp.wings === 'dragon';
      const top = big ? 70 : 120, tipX = big ? 6 : 26;
      const d = `M 170 340 Q 130 ${top + 40} 60 ${top} L ${tipX} ${top + 30} Q 40 ${top + 90} ${tipX + 10} ${top + 150} Q 60 ${top + 140} 72 ${top + 190} Q 100 ${top + 170} 112 ${top + 220} Q 130 ${top + 180} 165 380 Z`;
      let s = sym(d, `fill="url(#${id}wing)" stroke="${line}" stroke-width="3" stroke-linejoin="round"`);
      const bones = `M 165 345 Q 120 ${top + 40} 60 ${top} M 120 ${top + 90} L ${tipX + 10} ${top + 150} M 130 ${top + 110} L 72 ${top + 190} M 145 ${top + 140} L 112 ${top + 220}`;
      s += sym(bones, `fill="none" stroke="${shade(p.wing, -0.45)}" stroke-width="4" stroke-linecap="round"`);
      if (big) s += sym(`M 60 ${top} l -6 -20 l 14 12 Z`, `fill="${p.horn}" stroke="${line}" stroke-width="2"`);
      return s;
    }
    case 'feather': {
      let s = '';
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 7; i++) {
          const a = -0.6 + i * 0.22 + row * 0.08;
          const len = 150 - row * 40 - i * 6;
          const x = 160 - Math.cos(a) * len * 0.9, y = 330 - Math.sin(-a) * len * 0.3 + row * 30 - 40 + i * 14;
          const col = row === 0 ? shade(p.wing, 0.35) : row === 1 ? p.wing : shade(p.wing, -0.18);
          const e = `<ellipse cx="${x}" cy="${y}" rx="${46 - row * 8}" ry="${13 - row * 2}" transform="rotate(${-30 + i * 9 + row * 6} ${x} ${y})" fill="${col}" stroke="${line}" stroke-width="2"/>`;
          s += e + e.replace(/cx="([\d.-]+)"/, (m, v) => `cx="${2 * CX - v}"`).replace(/rotate\(([\d.-]+) ([\d.-]+)/, (m, r, v) => `rotate(${-r} ${2 * CX - v}`);
        }
      }
      if (sp.extras.includes('flame')) s += `<circle cx="70" cy="300" r="70" fill="#ffab40" opacity="0.35" filter="url(#${id}glow)"/><circle cx="330" cy="300" r="70" fill="#ffab40" opacity="0.35" filter="url(#${id}glow)"/>`;
      return s;
    }
    case 'fairy':
      return sym('M 175 330 Q 60 180 40 250 Q 30 330 175 345 Z', `fill="#d9f4ff" fill-opacity="0.65" stroke="#9adfff" stroke-width="2.5"`)
        + sym('M 175 350 Q 70 380 80 450 Q 120 470 178 365 Z', `fill="#ffd6f5" fill-opacity="0.6" stroke="#ff9ad5" stroke-width="2.5"`)
        + sym('M 172 335 Q 100 250 60 255', 'fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8"');
    case 'bee':
      return sym('M 175 330 Q 80 200 70 260 Q 70 320 175 342 Z', `fill="#eaf8ff" fill-opacity="0.6" stroke="#90caf9" stroke-width="2"`)
        + sym('M 175 350 Q 100 360 110 410 Q 140 420 178 360 Z', `fill="#eaf8ff" fill-opacity="0.55" stroke="#90caf9" stroke-width="2"`)
        + sym('M 172 335 Q 120 280 80 262 M 140 300 L 110 310', 'fill="none" stroke="#90caf9" stroke-width="1.5"');
    case 'moth': {
      const d1 = 'M 175 320 Q 60 150 14 230 Q 0 330 175 350 Z';
      const d2 = 'M 175 355 Q 50 380 60 470 Q 120 490 178 370 Z';
      return sym(d1, `fill="url(#${id}wing)" stroke="${line}" stroke-width="3"`) + sym(d2, `fill="${shade(p.wing, 0.2)}" stroke="${line}" stroke-width="3"`)
        + sym('M 160 330 Q 100 260 40 240', `fill="none" stroke="${shade(p.wing, -0.3)}" stroke-width="3"`)
        + `<circle cx="80" cy="270" r="20" fill="#5d4037"/><circle cx="80" cy="270" r="11" fill="#fff3e0"/><circle cx="320" cy="270" r="20" fill="#5d4037"/><circle cx="320" cy="270" r="11" fill="#fff3e0"/>`;
    }
  }
  return '';
}

function tails(sp, p, stage, line) {
  const t = p.tail, tl = shade(t, 0.3), td = shade(t, -0.3);
  const st = `stroke="${line}" stroke-width="3" stroke-linejoin="round"`;
  switch (sp.tail) {
    case 'fox': {
      const n = stage >= 4 ? 9 : stage === 3 ? 2 : 1;
      let s = '';
      for (let i = 0; i < n; i++) {
        const a = n === 1 ? 55 : n === 2 ? (i ? 50 : -50) : -80 + (160 * i) / (n - 1);
        s += `<g transform="rotate(${a} 200 480)"><path d="M 184 480 Q 130 390 160 280 Q 178 220 200 196 Q 222 220 240 280 Q 270 390 216 480 Z" fill="${t}" ${st}/><path d="M 200 196 Q 222 220 232 262 Q 200 250 168 262 Q 178 220 200 196 Z" fill="#fffaf2" stroke="${line}" stroke-width="2"/><path d="M 196 450 Q 170 380 190 300" fill="none" stroke="${td}" stroke-width="3" opacity="0.5"/></g>`;
      }
      return s;
    }
    case 'squirrel':
      return `<path d="M 230 520 Q 380 520 380 380 Q 380 250 300 230 Q 250 230 270 280 Q 320 280 320 360 Q 320 440 240 470 Z" fill="${t}" ${st}/><path d="M 310 260 Q 350 300 350 380" fill="none" stroke="${tl}" stroke-width="10" stroke-linecap="round" opacity="0.7"/>`;
    case 'cat':
      return `<path d="M 270 520 Q 360 500 350 400 Q 345 340 380 320" fill="none" stroke="${line}" stroke-width="22" stroke-linecap="round"/><path d="M 270 520 Q 360 500 350 400 Q 345 340 380 320" fill="none" stroke="${t}" stroke-width="16" stroke-linecap="round"/>`;
    case 'wolf':
      return `<path d="M 260 520 Q 380 500 370 380 Q 340 420 330 460 Q 300 470 260 470 Z" fill="${t}" ${st}/><path d="M 370 380 Q 360 420 345 440" fill="none" stroke="${tl}" stroke-width="8"/>`;
    case 'dog':
      return `<path d="M 270 520 Q 360 470 330 400" fill="none" stroke="${line}" stroke-width="30" stroke-linecap="round"/><path d="M 270 520 Q 360 470 330 400" fill="none" stroke="${t}" stroke-width="24" stroke-linecap="round"/>`;
    case 'devil': {
      const c = shade(p.wing, -0.05);
      return `<path d="M 260 540 Q 380 520 350 420 Q 330 360 360 330" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M 360 300 L 380 340 L 362 335 L 345 345 Z" fill="${c}" stroke="${line}" stroke-width="2"/>`;
    }
    case 'dragon':
      return `<path d="M 250 560 Q 360 520 380 420 Q 390 380 370 350 Q 360 420 320 470 Q 280 500 230 510 Z" fill="${t}" ${st}/><path d="M 372 352 l 10 -18 l 4 22 Z" fill="${td}"/>`;
    case 'cow':
      return `<path d="M 270 520 Q 350 500 340 420" fill="none" stroke="${shade(p.skin, -0.2)}" stroke-width="6"/><ellipse cx="340" cy="410" rx="10" ry="16" fill="${p.hair}" stroke="${line}" stroke-width="2"/>`;
    case 'stinger':
      return `<ellipse cx="300" cy="500" rx="60" ry="42" transform="rotate(-20 300 500)" fill="#ffc107" stroke="${line}" stroke-width="3"/><path d="M 270 470 Q 290 500 280 535 M 310 462 Q 330 495 318 530" stroke="#2b2b2b" stroke-width="12" fill="none"/>`;
  }
  return '';
}

function hairBack(sp, id, line, hairDD) {
  const f = `fill="url(#${id}hair)" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`;
  const cap = 'M 125 215 C 115 120 165 92 200 92 C 235 92 285 120 275 215';
  switch (sp.hairStyle) {
    case 'long':
      return `<path d="${cap} Q 290 330 300 470 Q 270 455 250 480 Q 230 455 200 470 Q 170 455 150 480 Q 130 455 100 470 Q 110 330 125 215 Z" ${f}/>`;
    case 'flowing':
      return `<path d="${cap} Q 310 340 340 520 Q 300 500 270 540 Q 240 505 200 530 Q 160 505 130 540 Q 100 500 60 520 Q 90 340 125 215 Z" ${f}/>`;
    case 'bob':
      return `<path d="${cap} Q 285 270 280 300 Q 250 290 240 305 L 160 305 Q 150 290 120 300 Q 115 270 125 215 Z" ${f}/>`;
    case 'short':
      return `<path d="${cap} Q 280 255 268 275 L 132 275 Q 120 255 125 215 Z" ${f}/>`;
    case 'wild':
      return `<path d="${cap} L 300 250 L 280 260 L 310 310 L 270 300 L 285 360 L 240 320 L 200 340 L 160 320 L 115 360 L 130 300 L 90 310 L 120 260 L 100 250 Z" ${f}/>`;
    case 'twintails':
      return `<path d="${cap} Q 280 260 260 280 L 140 280 Q 120 260 125 215 Z" ${f}/>`
        + sym('M 140 150 Q 60 160 55 280 Q 50 380 85 470 Q 95 420 115 440 Q 100 360 120 300 Q 130 250 150 200 Z', f)
        + sym('M 132 148 m -10 0 a 12 12 0 1 0 24 0 a 12 12 0 1 0 -24 0', `fill="${sp.accent}" stroke="${line}" stroke-width="2"`);
    case 'ponytail':
      return `<path d="${cap} Q 280 260 262 285 L 138 285 Q 120 260 125 215 Z" ${f}/>`
        + `<path d="M 255 130 Q 340 120 350 230 Q 360 340 320 430 Q 310 380 290 390 Q 310 300 290 230 Q 280 180 250 165 Z" ${f}/>`
        + `<circle cx="258" cy="140" r="12" fill="${sp.accent}" stroke="${line}" stroke-width="2"/>`;
    case 'bun':
      return `<path d="${cap} Q 280 260 262 285 L 138 285 Q 120 260 125 215 Z" ${f}/>`
        + `<circle cx="140" cy="105" r="30" ${f}/><circle cx="260" cy="105" r="30" ${f}/>`;
  }
  return `<path d="${cap} Z" ${f}/>`;
}

function outfit(sp, p, id, stage, line) {
  const o = [];
  const st = `stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`;
  const acc = p.accent;
  const style = sp.outfitStyle;
  if (sp.extras.includes('bandage')) {
    o.push(`<path d="M 94 372 Q 104 346 160 338 Q 200 360 240 338 Q 296 346 306 372 L 316 560 L 84 560 Z" fill="url(#${id}outfit)" ${st}/>`);
    for (let y = 370; y < 560; y += 26) o.push(`<path d="M 86 ${y} Q 200 ${y + 18} 314 ${y - 6}" stroke="${shade(p.outfit, -0.18)}" stroke-width="3" fill="none"/>`);
    o.push(`<path d="M 120 352 Q 200 380 280 352" stroke="${acc}" stroke-width="10" fill="none"/>`);
  } else if (style === 'kimono') {
    o.push(`<path d="M 94 372 Q 104 342 168 330 L 200 430 L 232 330 Q 296 342 306 372 L 316 560 L 84 560 Z" fill="url(#${id}outfit)" ${st}/>`);
    o.push(`<path d="M 168 330 L 200 430 L 232 330" fill="none" stroke="${acc}" stroke-width="10"/>`);
    o.push(`<path d="M 92 470 L 308 470 L 310 520 L 90 520 Z" fill="${acc}" ${st}/>`);
    o.push(`<path d="M 200 470 l -16 50 M 200 470 l 16 50" stroke="${shade(acc, -0.25)}" stroke-width="5"/>`);
  } else if (style === 'armor') {
    o.push(`<path d="M 94 372 Q 104 346 165 336 Q 200 352 235 336 Q 296 346 306 372 L 316 560 L 84 560 Z" fill="url(#${id}outfit)" ${st}/>`);
    o.push(`<path d="M 130 380 Q 200 410 270 380 L 262 470 Q 200 490 138 470 Z" fill="${shade(acc, 0.1)}" ${st}/>`);
    o.push(`<path d="M 150 400 Q 200 420 250 400" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>`);
    o.push(sym('M 80 380 Q 92 336 150 340 Q 145 380 112 400 Q 90 400 80 380 Z', `fill="${shade(acc, -0.05)}" ${st}`));
  } else {
    // dress / tunic
    o.push(`<path d="M 94 372 Q 104 346 160 336 Q 200 368 240 336 Q 296 346 306 372 L 316 560 L 84 560 Z" fill="url(#${id}outfit)" ${st}/>`);
    o.push(`<path d="M 160 336 Q 200 368 240 336 Q 236 352 200 380 Q 164 352 160 336 Z" fill="${acc}" ${st}/>`);
    if (style === 'tunic') o.push(`<path d="M 86 480 Q 200 500 314 480 L 315 500 Q 200 520 85 500 Z" fill="${acc}" ${st}/>`);
    else o.push(`<path d="M 120 420 Q 200 440 280 420" fill="none" stroke="${acc}" stroke-width="6"/><circle cx="200" cy="432" r="9" fill="${acc}" ${st}/>`);
  }
  o.push(sym('M 122 410 Q 118 480 120 560', `fill="none" stroke="${shade(p.outfit, -0.35)}" stroke-width="2.5" opacity="0.7"`));
  if (sp.extras.includes('stripes')) {
    o.push(`<path d="M 86 430 Q 200 455 314 430 L 315 455 Q 200 480 85 455 Z M 84 500 Q 200 525 316 500 L 317 525 Q 200 550 83 525 Z" fill="#2b2b2b"/>`);
  }
  if (sp.extras.includes('fluff')) {
    for (let i = 0; i < 9; i++) o.push(`<circle cx="${130 + i * 17.5}" cy="${342 + Math.sin(i * 1.3) * 6}" r="18" fill="#fffdf5" stroke="${line}" stroke-width="2"/>`);
  }
  if (stage >= 3) { // champion tier: shoulder guards with gems + trim
    o.push(sym('M 92 384 Q 96 344 150 340 Q 146 372 120 392 Q 104 398 92 384 Z', `fill="${shade(acc, 0.05)}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`));
    o.push(sym('M 100 380 Q 108 356 140 350', `fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.6"`));
    o.push(`<circle cx="124" cy="366" r="6" fill="${p.eyes}" stroke="${line}" stroke-width="2"/><circle cx="276" cy="366" r="6" fill="${p.eyes}" stroke="${line}" stroke-width="2"/>`);
  }
  if (stage === 4) {
    o.push(`<path d="M 150 345 Q 200 375 250 345" fill="none" stroke="url(#${id}gold)" stroke-width="8"/>`);
    o.push(`<circle cx="200" cy="372" r="14" fill="url(#${id}gold)" stroke="${line}" stroke-width="2.5"/><circle cx="200" cy="372" r="7" fill="${p.eyes}"/><circle cx="197" cy="369" r="2.5" fill="#fff"/>`);
  }
  return o.join('');
}

function harpyArms(p, id, line) {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const y = 360 + i * 30;
    const col = i % 2 ? p.wing : shade(p.wing, 0.2);
    s += sym(`M 100 ${y} Q 40 ${y + 20} 30 ${y + 70} Q 70 ${y + 50} 110 ${y + 30} Z`, `fill="${col}" stroke="${line}" stroke-width="2.5"`);
  }
  return s;
}

function lowerFront(sp, p, id, line, rnd) {
  const st = `stroke="${line}" stroke-width="3" stroke-linejoin="round"`;
  switch (sp.lower) {
    case 'snake': {
      let s = `<path d="M 60 560 Q 70 480 160 490 Q 260 500 340 470 Q 380 455 390 490 Q 380 530 300 545 Q 220 560 200 560 Z" fill="url(#${id}lower)" ${st}/>`;
      for (let i = 0; i < 9; i++) s += `<path d="M ${90 + i * 32} ${505 - Math.sin(i / 2) * 8} q 12 -10 24 0" fill="none" stroke="${shade(p.lower, -0.35)}" stroke-width="2.5"/>`;
      s += `<path d="M 80 545 Q 200 520 360 495" fill="none" stroke="${shade(p.lower, 0.45)}" stroke-width="8" opacity="0.6"/>`;
      return s;
    }
    case 'fish': {
      let s = `<path d="M 300 560 Q 360 470 330 400 Q 390 380 395 330 Q 350 340 330 380 Q 320 330 280 320 Q 300 380 315 420 Q 330 480 270 560 Z" fill="url(#${id}lower)" ${st}/>`;
      for (let i = 0; i < 6; i++) s += `<circle cx="${40 + rnd() * 80}" cy="${300 + rnd() * 220}" r="${4 + rnd() * 8}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.7"/>`;
      s += `<path d="M 120 352 Q 130 370 150 362 Q 155 340 140 335 Z M 280 352 Q 270 370 250 362 Q 245 340 260 335 Z" fill="${p.accent}" stroke="${line}" stroke-width="2"/>`;
      return s;
    }
    case 'tentacle': {
      let s = '';
      for (const [x, dir] of [[90, -1], [150, -1], [250, 1], [310, 1]]) {
        const d = `M ${x} 560 Q ${x + dir * 10} 500 ${x + dir * 50} 470 Q ${x + dir * 80} 455 ${x + dir * 70} 430 Q ${x + dir * 55} 420 ${x + dir * 52} 440`;
        s += `<path d="${d}" fill="none" stroke="${line}" stroke-width="30" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${p.lower}" stroke-width="24" stroke-linecap="round"/>`;
        for (let k = 0; k < 3; k++) s += `<circle cx="${x + dir * (8 + k * 14)}" cy="${540 - k * 22}" r="4" fill="${shade(p.lower, 0.45)}"/>`;
      }
      return s;
    }
    case 'slime': {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const x = 100 + i * 34, len = 20 + rnd() * 40;
        s += `<path d="M ${x - 10} 540 Q ${x - 8} ${540 + len} ${x} ${540 + len} Q ${x + 8} ${540 + len} ${x + 10} 540 Z" fill="${p.skin}" opacity="0.9"/>`;
      }
      s += `<ellipse cx="150" cy="420" rx="20" ry="40" fill="#ffffff" opacity="0.25"/>`;
      return s;
    }
    case 'ghost': {
      let s = '';
      for (let i = 0; i < 4; i++) {
        const x = 40 + rnd() * 320, y = 80 + rnd() * 300;
        s += `<path d="M ${x} ${y} q -14 -20 0 -40 q 14 20 0 40 Z" fill="#a5f3ff" opacity="0.6"/><circle cx="${x}" cy="${y - 8}" r="7" fill="#e0fbff"/>`;
      }
      return s;
    }
  }
  return '';
}

function earsBack(sp, p, line) {
  const sk = `fill="${p.skin}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`;
  switch (sp.ears) {
    case 'elf': return sym('M 142 215 Q 110 190 78 150 Q 100 210 146 245 Z', sk) + sym('M 138 214 Q 112 196 92 170 Q 112 212 140 232', `fill="none" stroke="${shade(p.skin, -0.2)}" stroke-width="2"`);
    case 'elfShort': return sym('M 142 215 Q 120 200 104 182 Q 112 222 146 242 Z', sk);
    case 'goblin': return sym('M 142 208 Q 90 205 50 185 Q 80 240 146 248 Z', sk) + sym('M 136 216 Q 96 212 70 200', `fill="none" stroke="${shade(p.skin, -0.25)}" stroke-width="2"`);
    case 'fin': {
      const fc = p.lower !== p.skin ? p.lower : p.tail;
      return sym('M 142 200 Q 100 170 86 185 Q 96 210 88 240 Q 110 250 144 240 Z', `fill="${fc}" stroke="${line}" stroke-width="2.5"`)
        + sym('M 140 210 L 96 192 M 140 222 L 94 218 M 140 232 L 98 238', `fill="none" stroke="${shade(fc, 0.4)}" stroke-width="2"`);
    }
    case 'cow': return sym('M 135 168 Q 100 150 80 170 Q 100 190 138 186 Z', sk) + sym('M 128 172 Q 104 162 90 172 Q 104 182 128 180 Z', 'fill="#ffb3c4"');
    case 'human': return '';
  }
  return '';
}

function hairFront(sp, id, line, hairL) {
  // Cap over the top of the head ending in a row of swept, pointed strands.
  const tips = [[266, 236], [244, 200], [222, 210], [200, 194], [178, 208], [158, 198], [134, 236]];
  const notchY = [0, 168, 176, 166, 174, 170, 168];
  let d = 'M 132 236 C 112 150 150 104 200 104 C 250 104 288 150 268 236 ';
  d += `Q 262 ${tips[0][1] - 10} ${tips[0][0]} ${tips[0][1]} `;
  for (let i = 1; i < tips.length; i++) {
    const [px, py] = tips[i - 1], [x, y] = tips[i];
    const nx = (px + x) / 2 + (x < 200 ? -3 : 3), ny = notchY[i];
    const lean = x < 200 ? -1 : 1;
    d += `Q ${px - 2} ${(py + ny) / 2} ${nx} ${ny} Q ${x + lean * 8} ${(ny + y) / 2 - 6} ${x} ${y} `;
  }
  d += 'Z';
  let s = `<path d="${d}" fill="url(#${id}hair)" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/>`;
  // inner strand lines for texture
  s += `<path d="M 200 116 Q 214 140 224 172 M 200 116 Q 186 140 176 172 M 170 126 Q 160 150 150 178 M 230 126 Q 240 150 250 178" fill="none" stroke="${shade(sp.hair, -0.35)}" stroke-width="2" stroke-linecap="round" opacity="0.55"/>`;
  // side locks framing the face
  const len = ['short', 'wild'].includes(sp.hairStyle) ? 270 : sp.hairStyle === 'bob' ? 290 : 320;
  s += sym(`M 134 190 Q 128 250 132 ${len} Q 142 ${len - 30} 150 ${len - 70} Q 148 240 150 200 Z`, `fill="url(#${id}hair)" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`);
  // shine ("angel ring")
  s += `<path d="M 150 150 Q 200 128 250 150" fill="none" stroke="${hairL}" stroke-width="7" stroke-linecap="round" opacity="0.8"/>`;
  s += `<path d="M 160 150 l 6 -4 l 6 4 M 228 150 l 6 -4 l 6 4" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.7"/>`;
  return s;
}

function earsTop(sp, p, line) {
  const h = p.hair;
  const st = `fill="${h}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`;
  const inner = 'fill="#ffb3c4"';
  switch (sp.ears) {
    case 'cat': return sym('M 136 160 L 140 78 L 190 118 Z', st) + sym('M 146 140 L 148 96 L 176 120 Z', inner);
    case 'fox': return sym('M 132 165 L 128 62 L 192 118 Z', st) + sym('M 142 145 L 140 84 L 178 120 Z', 'fill="#fff3e0"') + sym('M 128 62 L 134 92 L 148 82 Z', `fill="${shade(h, -0.4)}"`);
    case 'wolf': return sym('M 134 162 L 136 66 L 190 118 Z', st) + sym('M 146 142 L 146 90 L 176 120 Z', 'fill="#e8eaf6"');
    case 'dog': return sym('M 150 120 Q 112 112 104 150 Q 100 210 122 230 Q 140 200 148 160 Z', `fill="${shade(h, -0.15)}" stroke="${line}" stroke-width="2.5"`);
    case 'bunny': return sym('M 170 118 Q 130 20 155 5 Q 185 0 190 112 Z', st) + sym('M 172 105 Q 145 35 158 18 Q 176 20 182 104 Z', inner);
    case 'squirrel': return sym('M 140 150 Q 130 90 152 76 Q 180 100 184 124 Z', st) + sym('M 152 76 l -6 -16 l 14 8 l 2 -14 l 6 22', `fill="${shade(h, 0.35)}" stroke="${line}" stroke-width="2"`);
  }
  return '';
}

function horns(sp, p, id, line) {
  const c = p.horn, cd = shade(c, -0.3);
  const st = `fill="${c}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"`;
  switch (sp.horns) {
    case 'bull': return sym('M 140 160 Q 100 160 80 120 Q 70 90 84 70 Q 92 110 120 128 Q 140 136 150 140 Z', st) + sym('M 84 70 Q 78 90 82 104 Q 86 88 90 80 Z', `fill="${cd}"`);
    case 'curled': return sym('M 170 120 Q 160 74 124 66 Q 92 64 90 96 Q 92 124 118 122 Q 132 118 128 104 Q 120 112 112 104 Q 106 90 122 86 Q 146 88 152 130 Z', st) + sym('M 160 112 Q 150 84 126 78', `fill="none" stroke="${cd}" stroke-width="3"`);
    case 'dragon': return sym('M 166 120 Q 140 70 100 40 Q 130 90 140 132 Z', st) + sym('M 160 110 Q 140 80 112 56', `fill="none" stroke="${cd}" stroke-width="3"`);
    case 'oni': return sym('M 160 118 L 170 64 L 186 112 Z', st) + sym('M 166 100 L 182 104', `stroke="${cd}" stroke-width="3"`);
    case 'small': return sym('M 162 118 Q 154 90 144 80 Q 166 88 178 112 Z', st);
  }
  return '';
}

function headExtras(sp, p, id, line, rnd) {
  const ex = sp.extras;
  let s = '';
  if (ex.includes('flower')) {
    for (const [x, y, r] of [[262, 150, 16], [282, 186, 11], [250, 122, 9]]) {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        s += `<circle cx="${x + Math.cos(a) * r * 0.8}" cy="${y + Math.sin(a) * r * 0.8}" r="${r * 0.6}" fill="#ff9ccf" stroke="${line}" stroke-width="1.5"/>`;
      }
      s += `<circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#fff176"/>`;
    }
    s += `<path d="M 140 132 q -20 -10 -24 6 q 16 4 24 -6 Z" fill="#66bb6a" stroke="${line}" stroke-width="1.5"/>`;
  }
  if (ex.includes('snakehair')) {
    for (const [x, y, a] of [[130, 140, -40], [160, 104, -15], [200, 94, 0], [240, 104, 15], [270, 140, 40], [116, 190, -70], [284, 190, 70]]) {
      const c = shade(p.hair, (rnd() - 0.5) * 0.3);
      s += `<g transform="rotate(${a} ${x} ${y})"><path d="M ${x} ${y} Q ${x - 14} ${y - 20} ${x} ${y - 36}" fill="none" stroke="${line}" stroke-width="15" stroke-linecap="round"/><path d="M ${x} ${y} Q ${x - 14} ${y - 20} ${x} ${y - 36}" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/><ellipse cx="${x}" cy="${y - 42}" rx="10" ry="8" fill="${c}" stroke="${line}" stroke-width="2"/><circle cx="${x - 4}" cy="${y - 44}" r="2" fill="#ffeb3b"/><circle cx="${x + 4}" cy="${y - 44}" r="2" fill="#ffeb3b"/><path d="M ${x} ${y - 50} l -3 -8 M ${x} ${y - 50} l 3 -8" stroke="#e53935" stroke-width="1.5"/></g>`;
    }
  }
  if (ex.includes('flame')) {
    s += `<g filter="url(#${id}soft)" opacity="0.95"><path d="M 150 120 Q 140 60 175 30 Q 170 70 200 80 Q 205 40 235 20 Q 230 70 260 120 Q 220 100 200 110 Q 180 100 150 120 Z" fill="#ff7043"/><path d="M 170 115 Q 170 80 190 66 Q 192 92 205 96 Q 214 72 228 64 Q 228 96 238 115 Q 210 104 170 115 Z" fill="#ffeb3b"/></g>`;
  }
  if (ex.includes('antennae') || ex.includes('antennaeFeather')) {
    if (ex.includes('antennae')) s += sym('M 182 112 Q 170 60 140 40', `fill="none" stroke="${line}" stroke-width="4" stroke-linecap="round"`) + `<circle cx="140" cy="40" r="9" fill="#3e2723"/><circle cx="260" cy="40" r="9" fill="#3e2723"/>`;
    else {
      s += sym('M 184 110 Q 170 60 136 34', `fill="none" stroke="${line}" stroke-width="3"`);
      for (let i = 0; i < 7; i++) {
        const t = i / 7, x = 184 - 48 * t, y = 110 - 76 * t;
        s += sym(`M ${x} ${y} l -18 6 M ${x} ${y} l 10 -16`, `stroke="${p.hair}" stroke-width="4" stroke-linecap="round"`);
      }
    }
  }
  if (ex.includes('snowflake')) {
    const x = 268, y = 150;
    let f = '';
    for (let k = 0; k < 6; k++) f += `<path d="M ${x} ${y} l 0 -18" transform="rotate(${k * 60} ${x} ${y})" stroke="#e1f5fe" stroke-width="4" stroke-linecap="round"/>`;
    s += f + `<circle cx="${x}" cy="${y}" r="5" fill="#81d4fa"/>`;
    for (let i = 0; i < 18; i++) s += `<circle cx="${rnd() * W}" cy="${rnd() * H * 0.9}" r="${1.5 + rnd() * 3}" fill="#ffffff" opacity="0.85"/>`;
  }
  if (ex.includes('bandage')) {
    s += `<path d="M 130 150 Q 200 125 270 160 L 268 176 Q 200 142 132 166 Z" fill="${p.outfit}" stroke="${line}" stroke-width="2"/>`;
  }
  return s;
}

function crown(id, line, shadow) {
  return `<path d="M 148 128 L 154 86 L 174 108 L 200 70 L 226 108 L 246 86 L 252 128 Q 200 116 148 128 Z" fill="url(#${id}gold)" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<circle cx="200" cy="108" r="8" fill="${shadow ? '#ff1744' : '#e53950'}" stroke="${line}" stroke-width="2"/><circle cx="174" cy="116" r="4" fill="#40c4ff"/><circle cx="226" cy="116" r="4" fill="#40c4ff"/><circle cx="198" cy="105" r="2.5" fill="#fff"/>`;
}

function face(sp, p, id, variant, line, stage) {
  const shadow = variant === 'shadow';
  const ey = 222;
  let s = '';
  // blush
  s += `<ellipse cx="160" cy="254" rx="16" ry="7" fill="${p.blush}" opacity="0.45"/><ellipse cx="240" cy="254" rx="16" ry="7" fill="${p.blush}" opacity="0.45"/>`;
  s += sym('M 152 258 l 5 -8 M 160 258 l 5 -8 M 168 258 l 5 -8', `stroke="${shade(p.blush, -0.2)}" stroke-width="1.6" opacity="0.6"`);
  // eyebrows
  const browY = shadow ? 182 : 178;
  s += sym(`M 152 ${browY + 4} Q 168 ${browY - 4} 186 ${browY + (shadow ? 6 : 2)}`, `fill="none" stroke="${shade(p.hair, -0.35)}" stroke-width="3.5" stroke-linecap="round"`);
  for (const [cx, dir] of [[172, -1], [228, 1]]) {
    const slit = sp.pupil === 'slit';
    s += `<ellipse cx="${cx}" cy="${ey}" rx="16" ry="20" fill="#ffffff"/>`;
    s += `<ellipse cx="${cx + dir * 1}" cy="${ey + 2}" rx="13" ry="17.5" fill="url(#${id}iris)" stroke="${shade(p.eyes, -0.6)}" stroke-width="1.5"/>`;
    s += slit ? `<ellipse cx="${cx + dir}" cy="${ey + 3}" rx="2.6" ry="11" fill="${shade(p.eyes, -0.75)}"/>`
      : `<ellipse cx="${cx + dir}" cy="${ey + 4}" rx="6" ry="8.5" fill="${shade(p.eyes, -0.7)}"/>`;
    s += `<ellipse cx="${cx + dir}" cy="${ey + 11}" rx="8" ry="4" fill="${shade(p.eyes, 0.6)}" opacity="0.55"/>`;
    if (variant === 'radiant') s += sparkle(cx - 5, ey - 6, 6.5, '#ffffff');
    else s += `<circle cx="${cx - 5}" cy="${ey - 6}" r="5" fill="#ffffff"/>`;
    s += `<circle cx="${cx + 5}" cy="${ey + 8}" r="2.4" fill="#ffffff" opacity="0.9"/>`;
    if (shadow) {
      s += `<path d="M ${cx - 18} ${ey - 20} L ${cx + 18} ${ey - 20} L ${cx + 18} ${ey - 6} Q ${cx} ${ey - 2} ${cx - 18} ${ey - 9} Z" fill="${p.skin}"/>`;
      s += `<ellipse cx="${cx}" cy="${ey + 4}" rx="14" ry="16" fill="${p.eyes}" opacity="0.25" filter="url(#${id}soft)"/>`;
    }
    // upper lash line with outer flick
    const outer = cx + dir * 19, inner = cx - dir * 17;
    const lashY = shadow ? ey - 8 : ey - 15;
    s += `<path d="M ${inner} ${lashY + 6} Q ${cx} ${lashY - 9} ${outer} ${lashY + 2} L ${outer + dir * 6} ${lashY - 2}" fill="none" stroke="${line}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M ${cx - 9} ${ey + 20} Q ${cx} ${ey + 23} ${cx + 9} ${ey + 20}" fill="none" stroke="${line}" stroke-width="1.6" opacity="0.6"/>`;
  }
  // nose
  s += `<path d="M 200 248 l -2 5 l 3 0" fill="none" stroke="${shade(p.skin, -0.3)}" stroke-width="1.8" stroke-linecap="round"/>`;
  // mouth
  const m = '#a0404a';
  if (shadow) s += `<path d="M 188 268 Q 202 272 212 264" fill="none" stroke="${m}" stroke-width="2.6" stroke-linecap="round"/>`;
  else if (stage === 2) s += `<path d="M 188 265 Q 200 284 212 265 Z" fill="${m}" stroke="${line}" stroke-width="1.8"/><path d="M 194 274 Q 200 280 206 274 Q 200 271 194 274 Z" fill="#ff8a9a"/>`;
  else s += `<path d="M 188 266 Q 200 276 212 266" fill="none" stroke="${m}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (sp.extras.includes('fangs')) s += `<path d="M 205 268 l 2 7 l 3 -8 Z" fill="#ffffff" stroke="${line}" stroke-width="1"/>`;
  if (sp.extras.includes('tusks')) s += `<path d="M 184 274 l -2 -14 l 7 12 Z M 216 274 l 2 -14 l -7 12 Z" fill="#fffde7" stroke="${line}" stroke-width="1.5"/>`;
  if (sp.extras.includes('scales')) {
    const sc = shade(p.tail !== p.hair ? p.tail : p.lower, 0);
    s += sym('M 146 232 q 5 -6 10 0 q -5 6 -10 0 Z M 142 244 q 5 -6 10 0 q -5 6 -10 0 Z', `fill="${sc}" stroke="${line}" stroke-width="1" opacity="0.85"`);
  }
  return s;
}

// --------------------------------------------------------------------------
// Wisp CG (pre-species stage)
// --------------------------------------------------------------------------

export function makeWispCG(famId, opts = {}) {
  const fam = FAMILIES[famId];
  const id = 'wcg' + uid++;
  const rnd = seeded('wisp' + famId);
  const col = fam.wisp, d = shade(col, -0.25), line = '#3a2440';
  let s = `<defs><radialGradient id="${id}bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${shade(fam.bg[0], 0.4)}"/><stop offset="1" stop-color="${fam.bg[1]}"/></radialGradient>
    <radialGradient id="${id}b" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${shade(col, 0.6)}"/><stop offset="0.6" stop-color="${col}"/><stop offset="1" stop-color="${d}"/></radialGradient>
    <filter id="${id}glow"><feGaussianBlur stdDeviation="10"/></filter><clipPath id="${id}c"><rect width="${W}" height="${H}" rx="22"/></clipPath></defs>`;
  s += `<g clip-path="url(#${id}c)"><rect width="${W}" height="${H}" fill="url(#${id}bg)"/>`;
  s += background(famId, rnd, false);
  s += `<circle cx="200" cy="300" r="150" fill="#ffffff" opacity="0.35" filter="url(#${id}glow)"/>`;
  s += `<path d="M 80 330 C 80 200 140 160 200 160 C 260 160 320 200 320 330 C 320 410 270 440 200 440 C 130 440 80 410 80 330 Z" fill="url(#${id}b)" stroke="${line}" stroke-width="4"/>`;
  s += `<ellipse cx="150" cy="230" rx="30" ry="18" fill="#ffffff" opacity="0.6" transform="rotate(-25 150 230)"/>`;
  for (const cx of [160, 240]) {
    s += `<ellipse cx="${cx}" cy="320" rx="20" ry="28" fill="${line}"/><circle cx="${cx - 6}" cy="308" r="8" fill="#fff"/><circle cx="${cx + 6}" cy="330" r="3.5" fill="#fff"/>`;
  }
  s += `<ellipse cx="135" cy="365" rx="18" ry="8" fill="#ff8fa3" opacity="0.6"/><ellipse cx="265" cy="365" rx="18" ry="8" fill="#ff8fa3" opacity="0.6"/>`;
  s += `<path d="M 186 362 Q 193 372 200 362 Q 207 372 214 362" fill="none" stroke="${line}" stroke-width="3.5" stroke-linecap="round"/>`;
  s += `<rect x="40" y="${H - 74}" width="${W - 80}" height="54" rx="14" fill="#ffffff" opacity="0.85" stroke="${line}" stroke-width="2"/>`;
  s += `<text x="200" y="${H - 50}" text-anchor="middle" font-family="'Trebuchet MS', sans-serif" font-weight="700" font-size="20" fill="${line}">${escapeHtml(opts.name || fam.name + ' Wisp')}</text>`;
  s += `<text x="200" y="${H - 29}" text-anchor="middle" font-family="'Trebuchet MS', sans-serif" font-size="13" fill="#7a6a85">Wisp · ${fam.name}</text>`;
  s += `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="20" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.8"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`;
}
