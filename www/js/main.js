// App bootstrap, main room rendering loop, menus and screens.
import * as G from './game.js';
import { FAMILIES, SPECIES, SPECIES_BY_ID, STAGE_NAMES, STAGE_TIME, SPEEDS, SHOP, VARIANTS, speciesHint } from './data.js';
import { petSprite, drawEgg, drawChibi, drawWisp, roomCanvas, ICONS, ROOM_W, ROOM_H, PET_GROUND } from './sprites.js';
import { makeCG, makeWispCG, cgDataUrl, speciesTitle } from './cg.js';
import { sfx, setSound } from './audio.js';
import * as MG from './minigames.js';
import { escapeHtml, formatAge, clamp, rand } from './util.js';

const $ = (s) => document.querySelector(s);
let state = G.load();
setSound(state.sound);

// ---------------------------------------------------------------------------
// Modal helpers
// ---------------------------------------------------------------------------
let modalCleanup = null;
let modalLocked = false;

function openModal(html, { full = false, locked = false } = {}) {
  closeModal(true);
  const m = $('#modal');
  m.classList.toggle('full', full);
  m.classList.remove('hidden');
  $('#modalClose').style.display = locked ? 'none' : '';
  modalLocked = locked;
  const body = $('#modalBody');
  body.innerHTML = html;
  body.parentElement.scrollTop = 0;
  return body;
}

function closeModal(force = false) {
  if (modalLocked && !force) return;
  if (modalCleanup) { modalCleanup(); modalCleanup = null; }
  modalLocked = false;
  $('#modal').classList.add('hidden');
  $('#modalBody').innerHTML = '';
  G.save(state);
  processQueue();
}

$('#modalClose').addEventListener('click', () => closeModal());
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

const isOpen = () => !$('#modal').classList.contains('hidden');

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
let toastTimer = 0;
function toast(msg) {
  if (!msg) return;
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------------------------------------------------------------------------
// Room view state (animation only, not saved)
// ---------------------------------------------------------------------------
const view = { x: 60, dir: 1, target: 60, idleUntil: 0, anim: null, animUntil: 0, food: null, particles: [], flip: 0 };
const roomCv = $('#room');
const rctx = roomCv.getContext('2d');
rctx.imageSmoothingEnabled = false;

function setAnim(anim, ms = 1600, food = null) {
  view.anim = anim;
  view.animUntil = performance.now() + ms;
  view.food = food;
}

function particle(icon, x, y, opt = {}) {
  view.particles.push({ icon, x, y, vx: opt.vx ?? rand(-6, 6), vy: opt.vy ?? -12, life: opt.life ?? 1.4, age: 0 });
}

function burst(icon, n = 4) {
  for (let i = 0; i < n; i++) setTimeout(() => particle(icon, view.x + rand(-10, 10), PET_GROUND - 34), i * 150);
}

const spOf = (pet) => (pet.species ? SPECIES_BY_ID[pet.species] : null);

function currentPose(pet, t) {
  const frame = Math.floor(t / 420) % 2;
  const pose = { flap: frame, swing: frame };
  if (pet.stage === 0) return pose;
  const blinking = t % 3400 < 140;
  if (pet.asleep) return { ...pose, eyes: 'closed', mouth: 'flat', flap: 0 };
  const a = t < view.animUntil ? view.anim : null;
  switch (a) {
    case 'eat': return { ...pose, mouth: frame ? 'open' : 'smile', eyes: 'happy' };
    case 'love': return { ...pose, eyes: 'happy', mouth: 'smile', arms: 'wave' };
    case 'happy': return { ...pose, eyes: 'happy', mouth: 'open', arms: 'up' };
    case 'refuse': return { ...pose, eyes: 'angry', mouth: 'frown' };
    case 'sad': return { ...pose, eyes: 'sad', mouth: 'frown' };
    case 'clean': return { ...pose, eyes: 'happy', mouth: 'open' };
  }
  if (pet.misbehaving) return { ...pose, eyes: 'angry', mouth: 'open', arms: frame ? 'up' : 'down' };
  if (pet.sick || pet.happy < 25 || pet.hunger < 15) return { ...pose, eyes: blinking ? 'closed' : 'sad', mouth: 'frown' };
  if (pet.happy > 80 && frame && t % 9000 < 1500) return { ...pose, arms: 'wave', mouth: 'open' };
  return { ...pose, eyes: blinking ? 'closed' : 'open', mouth: 'smile' };
}

function drawRoom(t) {
  const pet = state.pet;
  const fam = pet ? pet.family : 'beast';
  rctx.drawImage(roomCanvas(fam), 0, 0);
  if (!pet) { requestAnimationFrame(drawRoom); return; }

  // poops on the floor
  for (let i = 0; i < pet.poops; i++) {
    const px = 100 - i * 12, py = PET_GROUND - 6;
    rctx.drawImage(ICONS.poop, px, py);
    if (Math.floor(t / 500 + i) % 2) { rctx.fillStyle = '#9ccc65'; rctx.fillRect(px + 2, py - 4, 1, 2); rctx.fillRect(px + 5, py - 5, 1, 2); }
  }

  // movement
  const now = t;
  const animating = now < view.animUntil;
  if (pet.stage > 0 && !pet.asleep && !animating) {
    if (Math.abs(view.target - view.x) < 1) {
      if (now > view.idleUntil) {
        view.target = rand(22, pet.poops ? 70 : 98);
        view.idleUntil = now + rand(1500, 5000);
      }
    } else {
      const step = 0.25 * (pet.energy < 20 ? 0.5 : 1);
      view.dir = Math.sign(view.target - view.x);
      view.x += view.dir * Math.min(step, Math.abs(view.target - view.x));
    }
  }
  if (animating && view.anim === 'refuse') view.dir = Math.floor(now / 160) % 2 ? 1 : -1;

  const pose = currentPose(pet, now);
  const sp = spOf(pet);
  const floaty = pet.stage === 1 && pet.family === 'spirit' || (sp && (sp.lower === 'ghost' || sp.wings === 'fairy'));
  let bob = 0;
  if (pet.stage === 0) bob = 0;
  else if (floaty) bob = Math.round(Math.sin(now / 400) * 2) - 2;
  else if (animating && view.anim === 'happy') bob = -Math.abs(Math.round(Math.sin(now / 120) * 4));
  else if (!pet.asleep && Math.abs(view.target - view.x) >= 1) bob = Math.floor(now / 200) % 2 ? -1 : 0;

  const crack = pet.stage === 0 ? Math.floor((pet.stageAge / STAGE_TIME[0]) * 3) : 0;
  let cv = petSprite(pet, pose, { sp, crack });
  let dx = pet.stage === 0 ? 60 : view.x;
  if (pet.stage === 0 && (animating || now % 2400 < 300)) dx += Math.floor(now / 90) % 2 ? 1 : -1;

  if (!pet.lightsOn) { rctx.fillStyle = 'rgba(10, 8, 40, 0.72)'; rctx.fillRect(0, 0, ROOM_W, ROOM_H); }

  rctx.save();
  if (!pet.lightsOn) rctx.filter = 'brightness(0.6)';
  // shadow
  rctx.fillStyle = 'rgba(0,0,0,0.18)';
  rctx.fillRect(Math.round(dx) - 9, PET_GROUND, 18, 2);
  if (view.dir < 0 && pet.stage > 0) {
    rctx.translate(Math.round(dx), 0); rctx.scale(-1, 1);
    rctx.drawImage(cv, -24, PET_GROUND - 47 + bob);
  } else rctx.drawImage(cv, Math.round(dx) - 24, PET_GROUND - 47 + bob);
  rctx.restore();

  // food in front of her
  if (animating && view.anim === 'eat' && view.food) {
    const bites = Math.floor(((now - (view.animUntil - 1600)) / 1600) * 3);
    if (bites < 3) {
      const ic = ICONS[view.food];
      rctx.drawImage(ic, 0, 0, ic.width - bites * 2, ic.height, Math.round(view.x + view.dir * 12) - 4, PET_GROUND - 8, ic.width - bites * 2, ic.height);
    }
  }

  // ambient effects
  if (pet.asleep && now % 1200 < 30) particle(ICONS.zzz, view.x + 8, PET_GROUND - 34, { vx: 4, vy: -8 });
  if (pet.sick && now % 1500 < 30) particle(ICONS.sick, view.x - 8, PET_GROUND - 36, { vy: -5 });
  if (pet.stage === 4 && now % 900 < 30) particle(pet.variant === 'shadow' ? ICONS.wisp : ICONS.sparkle, view.x + rand(-16, 16), PET_GROUND - rand(10, 40), { vy: -6, life: 1 });
  if (pet.misbehaving && now % 1000 < 30) particle(ICONS.anger, view.x + 9, PET_GROUND - 40, { vy: -3, vx: 0, life: 0.8 });

  // particles
  const dt = 1 / 60;
  view.particles = view.particles.filter((p) => (p.age += dt) < p.life);
  for (const p of view.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    rctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    rctx.drawImage(p.icon, Math.round(p.x), Math.round(p.y));
  }
  rctx.globalAlpha = 1;

  // attention icon
  const needs = G.needs(pet);
  if (needs.length && Math.floor(now / 500) % 2) rctx.drawImage(ICONS.exclaim, 4, 4);

  requestAnimationFrame(drawRoom);
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
const BARS = [
  ['hunger', '🍙', 'Food', '#ffb74d'],
  ['happy', '💗', 'Mood', '#ff6fa8'],
  ['energy', '⚡', 'Energy', '#ffd54f'],
  ['hygiene', '🫧', 'Clean', '#4fc3f7'],
  ['health', '❤️', 'Health', '#66bb6a'],
];

function renderHud() {
  const pet = state.pet;
  $('#coins').textContent = state.coins;
  if (!pet) { $('#petName').textContent = 'MythPals'; $('#petTitle').textContent = 'Choose an egg!'; $('#bars').innerHTML = ''; return; }
  const sp = spOf(pet);
  $('#petName').textContent = pet.name;
  $('#petTitle').textContent = pet.stage === 0 ? `${FAMILIES[pet.family].name} Egg` : pet.stage === 1 ? `${FAMILIES[pet.family].name} Wisp` :
    `${speciesTitle(sp, pet.stage, pet.variant)} · ${STAGE_NAMES[pet.stage]}`;
  $('#age').textContent = formatAge(pet.age);
  $('#bars').innerHTML = BARS.map(([k, ico, lbl, col]) => {
    const v = Math.round(pet[k]);
    return `<div class="bar ${v < 20 && pet.stage ? 'low' : ''}"><div class="lbl">${ico}<span>${lbl}</span></div><div class="track"><div class="fill" style="width:${v}%;background:${col}"></div></div></div>`;
  }).join('');
  const needs = G.needs(pet);
  const map = { hunger: 'feed', happy: 'play', clean: 'clean', sick: 'heal', lights: 'lights', tired: 'lights', tantrum: 'scold' };
  const alertActs = new Set(needs.map((n) => map[n]));
  document.querySelectorAll('#actions button').forEach((b) => b.classList.toggle('alert', alertActs.has(b.dataset.act)));
  $('#actions [data-act=lights] span').textContent = pet.lightsOn ? '💡' : '🌙';
}

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------
let accum = 0;
let lastNeeds = '';
const queue = [];

function tick() {
  const now = Date.now();
  const elapsed = Math.max(0, now - state.lastReal);
  state.lastReal = now;
  if (!state.pet || !state.pet.alive) { renderHud(); return; }
  accum += (elapsed / 60000) * state.speed;
  let n = Math.floor(accum);
  accum -= n;
  n = Math.min(n, 10080); // at most a week of catch-up
  const offline = elapsed > 15000;
  if (n > 0) {
    const ev = G.advance(state, n, offline);
    handleEvents(ev, offline, n);
  }
  const needs = G.needs(state.pet).join(',');
  if (needs && needs !== lastNeeds && !offline) {
    sfx('alert');
    if (state.vibrate && navigator.vibrate) navigator.vibrate([80, 60, 80]);
  }
  lastNeeds = needs;
  renderHud();
}

function handleEvents(events, offline, minutes) {
  if (offline && minutes > 5) {
    const mistakes = events.filter((e) => e.type === 'mistake').length;
    const poops = events.filter((e) => e.type === 'poop').length;
    toast(`Welcome back! ${formatAge(minutes)} passed.${poops ? ` ${poops} mess${poops > 1 ? 'es' : ''}.` : ''}${mistakes ? ` ${mistakes} care mistake${mistakes > 1 ? 's' : ''}.` : ''}`);
  }
  for (const e of events) {
    switch (e.type) {
      case 'poop': if (!offline) toast('Uh oh, she made a mess!'); break;
      case 'sick': if (!offline) toast(`${state.pet.name} feels sick... 🤒`); break;
      case 'sleep': if (!offline) toast(`${state.pet.name} fell asleep. Turn off the lights!`); break;
      case 'wake': if (!offline) { toast(`${state.pet.name} woke up! ☀️`); setAnim('happy', 1200); } break;
      case 'mistake': if (!offline) toast('Care mistake! She was neglected too long.'); break;
      case 'tantrum': if (!offline) toast(`${state.pet.name} is throwing a tantrum! (Scold?)`); break;
      case 'hatch': case 'evolve': queue.push(e); break;
      case 'depart': queue.push(e); break;
    }
  }
  G.save(state);
  processQueue();
}

function processQueue() {
  if (isOpen() || !queue.length) return;
  // only show the latest evolution if several happened while away
  const departIdx = queue.findIndex((e) => e.type === 'depart');
  let e;
  if (departIdx >= 0) { e = queue[departIdx]; queue.length = 0; }
  else { e = queue[queue.length - 1]; const first = queue[0]; queue.length = 0; e = { ...e, from: first.from }; }
  if (e.type === 'depart') showDepart();
  else showEvolution(e);
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
function result(r) {
  if (!r) return;
  toast(r.msg);
  if (r.anim && r.anim !== 'none') {
    setAnim(r.anim, r.anim === 'eat' ? 1600 : 1300, r.food);
    if (r.anim === 'love') { burst(ICONS.heart, 4); sfx('love'); }
    else if (r.anim === 'happy') { burst(ICONS.note, 3); sfx('happy'); }
    else if (r.anim === 'clean') { burst(ICONS.bubble, 6); sfx('clean'); }
    else if (r.anim === 'eat') sfx('eat');
    else if (r.anim === 'sad') { burst(ICONS.sweat, 2); sfx('sad'); }
    else if (r.anim === 'refuse') sfx('refuse');
    else if (r.anim === 'wobble') sfx('tap');
  } else sfx('tap');
  G.save(state);
  renderHud();
}

const ACTIONS = {
  feed: showFeed,
  play: showPlay,
  pet: () => result(G.pet(state)),
  clean: showClean,
  heal: showHeal,
  lights: () => result(G.toggleLights(state)),
  train: showTrain,
  scold: () => result(G.scold(state)),
  status: showStatus,
  shop: showShop,
  album: () => showAlbum('gallery'),
  settings: showSettings,
};

$('#actions').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (!state.pet && !['album', 'settings', 'shop'].includes(b.dataset.act)) { showEggPicker(); return; }
  ACTIONS[b.dataset.act]?.();
});

roomCv.addEventListener('pointerdown', (e) => {
  if (!state.pet) return showEggPicker();
  const r = roomCv.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * ROOM_W, y = ((e.clientY - r.top) / r.height) * ROOM_H;
  const px = state.pet.stage === 0 ? 60 : view.x;
  if (Math.abs(x - px) < 14 && y > PET_GROUND - 40 && y < PET_GROUND + 4) result(G.pet(state));
  else if (state.pet.poops && y > PET_GROUND - 12 && x > 100 - state.pet.poops * 12) result(G.clean(state));
});

function menu(title, items, sub = '') {
  const body = openModal(`<h2>${title}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}<div class="menu"></div>`);
  const m = body.querySelector('.menu');
  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.disabled = !!it.disabled;
    b.innerHTML = `<span class="ico">${it.icon}</span><span class="txt">${it.label}<small>${it.desc || ''}</small></span>${it.qty !== undefined ? `<span class="qty">x${it.qty}</span>` : ''}`;
    b.onclick = () => it.run();
    m.appendChild(b);
  }
  return body;
}

function showFeed() {
  const sp = spOf(state.pet), inv = state.inventory;
  menu('Feed', [
    { icon: '🍙', label: 'Meal', desc: 'Food +25 · Weight +1', run: () => { closeModal(); result(G.feed(state, 'meal')); } },
    { icon: '🍮', label: 'Snack', desc: 'Mood +15 · Weight +2', run: () => { closeModal(); result(G.feed(state, 'snack')); } },
    { icon: '🍰', label: 'Strawberry Cake', desc: 'Mood +30', qty: inv.cake, disabled: !inv.cake, run: () => { closeModal(); result(G.feed(state, 'cake')); } },
    { icon: '💝', label: sp ? sp.fav : 'Favorite Food', desc: 'Mood +30 · Bond +10', qty: inv.fav, disabled: !inv.fav, run: () => { closeModal(); result(G.feed(state, 'fav')); } },
  ]);
}

function startGame(fn, onResult) {
  const why = G.canDoActivity(state);
  if (why) { closeModal(); toast(why); sfx('refuse'); return; }
  const body = openModal('');
  modalCleanup = fn(body, state.pet, (res) => {
    onResult(res);
    closeModal();
    G.save(state);
    renderHud();
  });
}

function showPlay() {
  menu('Play', [
    { icon: '↔️', label: 'Which Way?', desc: 'Guess which way she looks', run: () => startGame(MG.whichWay, (r) => playDone(r)) },
    { icon: '🍬', label: 'Treat Catch', desc: 'Catch the falling treats', run: () => startGame(MG.treatCatch, (r) => playDone(r)) },
    { icon: '🧶', label: 'Toy Ball', desc: 'Mood +25, no energy cost', qty: state.inventory.ball, disabled: !state.inventory.ball, run: () => { closeModal(); result(G.applyToy(state)); } },
  ]);
}

function playDone(r) {
  const coins = G.applyPlay(state, r.score, r.max);
  setTimeout(() => { result({ msg: `Fun! +${coins} coins`, anim: 'happy' }); sfx('coin'); }, 50);
}

function showTrain() {
  const p = state.pet;
  const items = ['power', 'magic', 'agility'].map((stat) => ({
    icon: { power: '💪', magic: '🔮', agility: '💨' }[stat], label: `${stat[0].toUpperCase() + stat.slice(1)} Training`, desc: `Current: ${p[stat]}`,
    run: () => startGame((el, pet, done) => MG.training(el, pet, stat, done), (r) => {
      const gain = G.applyTraining(state, stat, r.quality);
      setTimeout(() => result({ msg: `${stat[0].toUpperCase() + stat.slice(1)} +${gain}!`, anim: 'happy' }), 50);
    }),
  }));
  items.push({
    icon: '⚔️', label: 'Spar Battle', desc: p.stage < 2 ? 'Available from the Rookie stage' : 'Fight a wild monster for coins',
    disabled: p.stage < 2,
    run: () => startGame(MG.battle, (r) => {
      const coins = G.applyBattle(state, r.won);
      setTimeout(() => result(r.won ? { msg: `Victory! +${coins} coins`, anim: 'happy' } : { msg: 'Defeated... give her a rest.', anim: 'sad' }), 50);
    }),
  });
  menu('Train', items, 'Training shapes what she becomes. Wisps who train a lot evolve into fighters and mages!');
}

function showClean() {
  menu('Clean', [
    { icon: '🧽', label: 'Tidy Up', desc: 'Clean messes · Clean +35', run: () => { closeModal(); result(G.clean(state)); } },
    { icon: '🛁', label: 'Bubble Bath', desc: 'Full clean + Mood +10', qty: state.inventory.salts, disabled: !state.inventory.salts, run: () => { closeModal(); result(G.clean(state, true)); } },
  ]);
}

function showHeal() {
  menu('Heal', [
    { icon: '💊', label: 'Medicine', desc: 'Cures sickness', run: () => { closeModal(); result(G.heal(state)); } },
    { icon: '🧪', label: 'Vitamins', desc: 'Health +40', qty: state.inventory.vitamin, disabled: !state.inventory.vitamin, run: () => { closeModal(); result(G.heal(state, true)); } },
  ]);
}

function showShop() {
  const body = menu('Shop', SHOP.map((it) => ({
    icon: it.icon, label: `${it.name} — 🪙${it.price}`, desc: it.desc, qty: state.inventory[it.id] || 0, disabled: state.coins < it.price,
    run: () => { const r = G.buy(state, it); toast(r.msg); if (r.ok) sfx('coin'); renderHud(); showShop(); },
  })), `You have 🪙 ${state.coins}. Earn coins by playing, training and battling.`);
  return body;
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
function cgFor(pet, opts = {}) {
  if (pet.stage === 0) return null;
  if (pet.stage === 1) return makeWispCG(pet.family, opts);
  return makeCG(pet.species, pet.stage, pet.variant, opts);
}

function showStatus() {
  const p = state.pet;
  const sp = spOf(p);
  const cg = cgFor(p, { name: p.name });
  const grade = p.stage >= 2 && p.stage < 4 ? G.careGrade(p) : null;
  const next = p.stage < 4 ? Math.max(0, STAGE_TIME[p.stage] - p.stageAge) : 0;
  const body = openModal(`
    <h2>${escapeHtml(p.name)}</h2>
    ${cg ? `<img class="cg-frame" src="${cgDataUrl(cg)}" alt="CG">` : `<p class="center muted">Your egg is incubating. Keep it company!</p>`}
    <div class="statgrid">
      <div><span>Stage</span><b>${STAGE_NAMES[p.stage]}</b></div>
      <div><span>Age</span><b>${formatAge(p.age)}</b></div>
      <div><span>Weight</span><b>${Math.round(p.weight)} kg</b></div>
      <div><span>Next stage</span><b>${p.stage < 4 ? (p.asleep && next === 0 ? 'after nap' : formatAge(next)) : 'Max'}</b></div>
      <div><span>💪 Power</span><b>${p.power}</b></div>
      <div><span>🔮 Magic</span><b>${p.magic}</b></div>
      <div><span>💨 Agility</span><b>${p.agility}</b></div>
      <div><span>💞 Bond</span><b>${Math.round(p.bond)}</b></div>
      <div><span>📏 Discipline</span><b>${Math.round(p.discipline)}</b></div>
      <div><span>⚠️ Mistakes</span><b>${p.mistakes} (total ${p.totalMistakes})</b></div>
    </div>
    ${p.stage === 1 ? `<p class="muted" style="margin-top:10px">How you raise this wisp decides which ${FAMILIES[p.family].name} she becomes. Check the Codex for hints!</p>` : ''}
    ${grade ? `<p class="muted" style="margin-top:10px">Current care outlook: <b>${VARIANTS[grade].label}</b> form. Great care with few mistakes leads to a Radiant evolution; neglect leads to a Dusk form.</p>` : ''}
    ${sp ? `<p class="muted">Favorite food: <b>${sp.fav}</b> · ${escapeHtml(sp.desc)}</p>` : ''}
    <div class="row" style="margin-top:10px">
      <button class="btn" id="rename">✏️ Rename</button>
      ${p.stage === 4 ? '<button class="btn alt" id="journey">🌄 Send on a journey</button>' : ''}
    </div>`);
  body.querySelector('#rename').onclick = () => {
    const n = prompt('New name?', p.name);
    if (n && n.trim()) { p.name = n.trim().slice(0, 16); G.save(state); renderHud(); showStatus(); }
  };
  const j = body.querySelector('#journey');
  if (j) j.onclick = () => {
    if (!confirm(`Send ${p.name} off on a grand journey? She will be remembered in the Hall of Legends and you will receive a new egg (+100 coins).`)) return;
    G.journey(state);
    G.save(state);
    closeModal();
    toast('She waves goodbye... Safe travels! 🌄');
    showEggPicker();
  };
}

// ---------------------------------------------------------------------------
// Album: gallery, codex, legends
// ---------------------------------------------------------------------------
const CG_SLOTS = [[2, 'normal'], [3, 'normal'], [3, 'radiant'], [3, 'shadow'], [4, 'normal'], [4, 'radiant'], [4, 'shadow']];

function spriteThumb(sp) {
  const cv = drawChibi(sp, 2, 'normal', {}).toCanvas();
  return cv;
}

function showAlbum(tab) {
  const body = openModal(`<h2>Album</h2>
    <div class="tabs"><button data-t="gallery">Gallery</button><button data-t="codex">Codex</button><button data-t="legends">Legends</button></div>
    <div id="albumBody"></div>`);
  body.querySelectorAll('.tabs button').forEach((b) => {
    b.classList.toggle('on', b.dataset.t === tab);
    b.onclick = () => showAlbum(b.dataset.t);
  });
  const ab = body.querySelector('#albumBody');
  const has = (k) => state.previewAll || state.unlocked[k];
  if (tab === 'gallery') {
    const total = SPECIES.length * CG_SLOTS.length + Object.keys(FAMILIES).length;
    const got = Object.keys(state.unlocked).length;
    ab.innerHTML = `<p class="muted">${state.previewAll ? 'Preview mode: all CGs visible.' : `Unlocked ${got} / ${total} CGs. Raise pets to new stages to unlock more!`} Tap a creature to see her CGs.</p>`;
    // wisps
    const wh = document.createElement('div'); wh.className = 'fam-h'; wh.textContent = 'Wisps'; ab.appendChild(wh);
    const wt = document.createElement('div'); wt.className = 'thumbs'; ab.appendChild(wt);
    for (const f of Object.keys(FAMILIES)) {
      const fig = document.createElement('figure');
      if (has(`wisp:${f}`)) {
        const img = new Image(); img.src = cgDataUrl(makeWispCG(f)); img.onclick = () => showCG(makeWispCG(f)); fig.appendChild(img);
      } else fig.innerHTML = '<div class="lock">?</div>';
      fig.insertAdjacentHTML('beforeend', `<figcaption>${FAMILIES[f].name}</figcaption>`);
      wt.appendChild(fig);
    }
    for (const fam of Object.keys(FAMILIES)) {
      const h = document.createElement('div'); h.className = 'fam-h'; h.textContent = FAMILIES[fam].name; ab.appendChild(h);
      const list = document.createElement('div'); list.className = 'splist'; ab.appendChild(list);
      for (const sp of SPECIES.filter((s) => s.fam === fam)) {
        const n = CG_SLOTS.filter(([st, v]) => has(`${sp.id}:${st}:${v}`)).length;
        const seen = state.previewAll || state.dex[sp.id];
        const row = document.createElement('button'); row.className = 'sprow';
        const thumb = spriteThumb(sp);
        if (!seen) { const c = drawChibi(sp, 2, 'normal', {}); c.fillAll('#3a2440'); row.appendChild(c.toCanvas()); }
        else row.appendChild(thumb);
        row.insertAdjacentHTML('beforeend', `<div class="grow"><b>${seen ? sp.names[0] : '???'}</b><small>${n} / ${CG_SLOTS.length} CGs</small></div><span>›</span>`);
        const holder = document.createElement('div');
        row.onclick = () => {
          if (holder.innerHTML) { holder.innerHTML = ''; return; }
          const th = document.createElement('div'); th.className = 'thumbs';
          for (const [st, v] of CG_SLOTS) {
            const fig = document.createElement('figure');
            if (has(`${sp.id}:${st}:${v}`)) {
              const svg = makeCG(sp.id, st, v);
              const img = new Image(); img.src = cgDataUrl(svg); img.loading = 'lazy'; img.onclick = () => showCG(svg, () => showAlbum('gallery'));
              fig.appendChild(img);
            } else fig.innerHTML = '<div class="lock">?</div>';
            fig.insertAdjacentHTML('beforeend', `<figcaption>${STAGE_NAMES[st]}${v !== 'normal' ? ' · ' + VARIANTS[v].label : ''}</figcaption>`);
            th.appendChild(fig);
          }
          holder.appendChild(th);
        };
        list.appendChild(row); list.appendChild(holder);
      }
    }
  } else if (tab === 'codex') {
    const found = Object.keys(state.dex).length;
    ab.innerHTML = `<p class="muted">Discovered ${found} / ${SPECIES.length} species. Hints tell you how to raise a wisp into each one.</p>`;
    for (const fam of Object.keys(FAMILIES)) {
      ab.insertAdjacentHTML('beforeend', `<div class="fam-h">${FAMILIES[fam].name} <span class="muted">— ${FAMILIES[fam].hint}</span></div>`);
      const list = document.createElement('div'); list.className = 'splist'; ab.appendChild(list);
      for (const sp of SPECIES.filter((s) => s.fam === fam)) {
        const seen = state.previewAll || state.dex[sp.id];
        const row = document.createElement('div'); row.className = 'sprow';
        const c = drawChibi(sp, 2, 'normal', {}); if (!seen) c.fillAll('#3a2440');
        row.appendChild(c.toCanvas());
        row.insertAdjacentHTML('beforeend', `<div class="grow"><b>${seen ? sp.names.join(' → ') : '???'}</b>
          <small>${seen ? escapeHtml(sp.desc) : ''}</small><small>🔑 Raise with ${speciesHint(sp)}${seen ? ` · 💝 ${sp.fav}` : ''}</small></div>`);
        list.appendChild(row);
      }
    }
  } else {
    ab.innerHTML = state.legends.length ? '' : '<p class="muted">No legends yet. Raise a pet to the Ultimate stage and send her on a journey!</p>';
    for (const l of [...state.legends].reverse()) {
      const sp = SPECIES_BY_ID[l.species];
      ab.insertAdjacentHTML('beforeend', `<div class="legend"><b>Gen ${l.gen}: ${escapeHtml(l.name)}</b> — ${sp ? speciesTitle(sp, 4, l.variant) : 'Unknown'}<br>
        <span class="muted">Age ${formatAge(l.age)} · Bond ${l.bond}${l.departed ? ' · 🕊️ Ran away' : ' · 🌄 Journeyed'}</span></div>`);
    }
  }
}

function showCG(svg, back) {
  const body = openModal(`<img class="cg-frame" style="max-width:min(100%, 62vh)" src="${cgDataUrl(svg)}" alt="CG">
    <div class="row" style="max-width:360px;margin:12px auto 0;width:100%"><a class="btn" download="mythpals-cg.svg" href="${cgDataUrl(svg)}">💾 Save</a><button class="btn primary" id="cgBack">Back</button></div>`, { full: true });
  body.querySelector('#cgBack').onclick = () => (back ? back() : closeModal());
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
function showSettings() {
  const body = openModal(`<h2>Settings</h2>
    <h3>Time speed</h3>
    <select id="speed">${SPEEDS.map((s) => `<option value="${s.id}" ${s.id === state.speed ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
    <p class="muted">Faster speeds make her grow (and get hungry) faster. Relaxed is a true real-time V-pet.</p>
    <h3>Options</h3>
    <label class="row" style="align-items:center"><input type="checkbox" id="gentle" ${state.gentle ? 'checked' : ''}> Gentle mode (she never runs away; slower needs while the app is closed)</label>
    <label class="row" style="align-items:center"><input type="checkbox" id="sound" ${state.sound ? 'checked' : ''}> Sound effects</label>
    <label class="row" style="align-items:center"><input type="checkbox" id="vibrate" ${state.vibrate ? 'checked' : ''}> Vibrate on alerts</label>
    <label class="row" style="align-items:center"><input type="checkbox" id="preview" ${state.previewAll ? 'checked' : ''}> Preview all CGs &amp; Codex (spoilers!)</label>
    <h3>How to play</h3>
    <p class="muted">Feed, play, clean and put her to bed with the lights off. Ignoring a need for too long is a <b>care mistake</b>.
    During the <b>Wisp</b> stage, what you do most (meals, snacks, play, petting, training, discipline...) decides her species.
    At the Champion and Ultimate stages, great care unlocks <b>Radiant</b> forms while neglect leads to <b>Dusk</b> forms.
    When she sometimes throws a tantrum for no reason, <b>Scold</b> her to build discipline. Each new stage unlocks a CG in your Album!</p>
    <h3>Data</h3>
    <button class="btn" id="reset" style="background:#ffd6d6">🗑️ Reset all progress</button>
    <p class="muted" style="margin-top:14px">MythPals v1.0 · Generation ${state.generation}</p>`);
  body.querySelector('#speed').onchange = (e) => { state.speed = +e.target.value; G.save(state); };
  body.querySelector('#gentle').onchange = (e) => { state.gentle = e.target.checked; G.save(state); };
  body.querySelector('#sound').onchange = (e) => { state.sound = e.target.checked; setSound(state.sound); G.save(state); };
  body.querySelector('#vibrate').onchange = (e) => { state.vibrate = e.target.checked; G.save(state); };
  body.querySelector('#preview').onchange = (e) => { state.previewAll = e.target.checked; G.save(state); };
  body.querySelector('#reset').onclick = () => {
    if (!confirm('Erase your pet, album and legends? This cannot be undone.')) return;
    G.wipe();
    state = G.newState();
    G.save(state);
    closeModal();
    showEggPicker();
  };
}

// ---------------------------------------------------------------------------
// Egg picker / evolution / departure
// ---------------------------------------------------------------------------
function showEggPicker() {
  const eggs = G.eggChoices();
  let sel = 0;
  const body = openModal(`<h2>${state.generation > 1 ? 'A new egg!' : 'Welcome to MythPals!'}</h2>
    <p>Choose an egg to raise. Each egg holds a different family of monster girls — and how you raise her decides who she becomes.</p>
    <div class="eggs"></div>
    <p class="muted" id="eggHint"></p>
    <input type="text" id="petNameIn" maxlength="16" placeholder="Name your pet" value="${['Mochi', 'Luna', 'Pip', 'Nyx', 'Clover', 'Saffy', 'Juniper', 'Maple'][Math.floor(Math.random() * 8)]}">
    <button class="btn primary block" id="adopt" style="margin-top:10px">🥚 Adopt this egg</button>`, { locked: true });
  const wrap = body.querySelector('.eggs');
  eggs.forEach((f, i) => {
    const d = document.createElement('button'); d.className = 'egg';
    const c = document.createElement('canvas'); c.width = 48; c.height = 48;
    c.getContext('2d').drawImage(drawEgg(f, 0).toCanvas(), 0, -6);
    d.appendChild(c);
    d.insertAdjacentHTML('beforeend', `<b>${FAMILIES[f].name}</b>`);
    d.onclick = () => { sel = i; upd(); sfx('tap'); };
    wrap.appendChild(d);
  });
  const upd = () => {
    wrap.querySelectorAll('.egg').forEach((e, i) => e.classList.toggle('sel', i === sel));
    body.querySelector('#eggHint').textContent = FAMILIES[eggs[sel]].hint;
  };
  upd();
  body.querySelector('#adopt').onclick = () => {
    const name = body.querySelector('#petNameIn').value.trim() || 'Mochi';
    state.pet = G.newPet(eggs[sel], name.slice(0, 16));
    state.lastReal = Date.now();
    accum = 0;
    G.save(state);
    sfx('hatch');
    closeModal(true);
    renderHud();
    toast('Keep your egg warm — it will hatch soon!');
  };
}

function showEvolution(e) {
  const p = state.pet;
  const fromPet = { ...p, stage: e.from.stage, species: e.from.species, variant: e.from.variant };
  const toSp = spOf(p);
  const body = openModal(`<div class="evo-title">${e.type === 'hatch' ? 'Your egg is hatching!' : 'What? ' + escapeHtml(p.name) + ' is evolving!'}</div>
    <canvas class="game-canvas" width="120" height="80" style="max-width:240px;margin:0 auto"></canvas>
    <div id="evoOut" class="center"></div>`, { full: true, locked: true });
  const cv = body.querySelector('canvas'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const t0 = performance.now();
  let raf;
  sfx('evolve');
  const draw = (t) => {
    const k = (t - t0) / 3200;
    ctx.fillStyle = '#1d1427'; ctx.fillRect(0, 0, 120, 80);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t / 500;
      ctx.fillStyle = i % 2 ? '#ff8fc8' : '#b388ff';
      ctx.fillRect(60 + Math.cos(a) * (30 + k * 20), 44 + Math.sin(a) * 26, 2, 2);
    }
    const period = Math.max(60, 400 - k * 360);
    const showNew = k >= 1 || Math.floor((t - t0) / period) % 2 === 1;
    const who = showNew ? p : fromPet;
    const spr = petSprite(who, showNew ? { eyes: 'happy', mouth: 'open', arms: 'up' } : {}, { sp: spOf(who), silhouette: k < 1 ? '#ffffff' : null });
    ctx.drawImage(spr, 36, 74 - 47);
    if (k < 1.15) raf = requestAnimationFrame(draw);
    else reveal();
  };
  raf = requestAnimationFrame(draw);
  modalCleanup = () => cancelAnimationFrame(raf);
  const reveal = () => {
    const title = p.stage === 1 ? `${FAMILIES[p.family].name} Wisp` : speciesTitle(toSp, p.stage, p.variant);
    const cg = cgFor(p, { name: p.name });
    sfx('happy');
    const out = body.querySelector('#evoOut');
    out.innerHTML = `<div class="evo-title">${escapeHtml(p.name)} became a ${escapeHtml(title)}!</div>
      ${cg ? `<img class="cg-frame" style="max-width:min(100%, 30vh)" src="${cgDataUrl(cg)}" alt="CG">` : ''}
      <p class="muted" style="color:#d9c8f0">${p.stage === 1 ? 'Raise her well — what you do most decides her species!' : p.stage === 2 ? escapeHtml(toSp.desc) : p.variant === 'radiant' ? 'Your loving care made her shine!' : p.variant === 'shadow' ? 'Neglect left a shadow on her heart...' : 'She grew strong and healthy!'} New CG added to your Album.</p>
      <button class="btn primary" id="evoOk" style="min-width:200px">Yay!</button>`;
    out.querySelector('#evoOk').onclick = () => { closeModal(true); setAnim('happy', 1500); burst(ICONS.star, 5); };
  };
}

function showDepart() {
  const p = state.pet;
  const body = openModal(`<div class="evo-title">${escapeHtml(p.name)} has run away...</div>
    <p class="center">She was neglected for too long and left to find a new home in the wilds. Maybe you will meet again someday.</p>
    <p class="center muted" style="color:#d9c8f0">Tip: turn on Gentle mode in Settings if real-time care is too demanding.</p>
    <button class="btn primary block" id="ok">Choose a new egg</button>`, { full: true, locked: true });
  body.querySelector('#ok').onclick = () => { G.memorialize(state); G.save(state); closeModal(true); showEggPicker(); };
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(state); else tick(); });
window.addEventListener('pagehide', () => G.save(state));

renderHud();
requestAnimationFrame(drawRoom);
if (!state.pet) showEggPicker();
else tick();
setInterval(tick, 1000);
setInterval(() => G.save(state), 10000);

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.match(/^(localhost|127\.)/)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Expose for debugging in the console.
window.mythpals = { get state() { return state; }, advance: (m) => handleEvents(G.advance(state, m), false, m), G, clamp, drawWisp };
