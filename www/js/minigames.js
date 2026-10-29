// Mini-games. Each takes a container element plus helpers and calls `done(result)` when finished.
// Each returns a cleanup function so the modal can stop timers when it closes.
import { petSprite, ICONS } from './sprites.js';
import { sfx } from './audio.js';
import { SPECIES, SPECIES_BY_ID } from './data.js';
import { speciesTitle } from './cg.js';
import { rand, pick } from './util.js';

function spriteOpts(pet) { return { sp: pet.species ? SPECIES_BY_ID[pet.species] : null }; }

function drawSprite(ctx, pet, pose, x, groundY, flip = false, opts = {}) {
  const cv = petSprite(pet, pose, { ...spriteOpts(pet), ...opts });
  ctx.save();
  if (flip) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(cv, -24, groundY - 47); }
  else ctx.drawImage(cv, Math.round(x) - 24, groundY - 47);
  ctx.restore();
}

function makeCanvas(el, w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h; cv.className = 'game-canvas';
  el.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return [cv, ctx];
}

function stage(ctx, w, h, top = '#cdefff', bottom = '#b7e39a') {
  ctx.fillStyle = top; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = bottom; ctx.fillRect(0, h - 14, w, 14);
}

// ---------------------------------------------------------------------------
// Which Way? — guess which way she'll turn. 5 rounds.
// ---------------------------------------------------------------------------
export function whichWay(el, pet, done) {
  el.innerHTML = '<h2>Which Way?</h2><p class="muted">Guess which way she will look!</p>';
  const [, ctx] = makeCanvas(el, 120, 80);
  const info = document.createElement('div'); info.className = 'big-score'; el.appendChild(info);
  const row = document.createElement('div'); row.className = 'row';
  row.innerHTML = '<button class="btn alt" data-d="-1">◀ Left</button><button class="btn alt" data-d="1">Right ▶</button>';
  el.appendChild(row);
  let round = 0, score = 0, face = 1, pose = {}, locked = false, raf;
  const draw = (t) => {
    stage(ctx, 120, 80);
    const bob = Math.floor(t / 300) % 2;
    drawSprite(ctx, pet, { ...pose, flap: bob, swing: bob }, 60, 74 - (pose.arms === 'up' ? bob * 3 : 0), face < 0);
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  const upd = () => { info.textContent = `Round ${Math.min(round + 1, 5)}/5 · ⭐ ${score}`; };
  upd();
  row.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || locked) return;
    locked = true;
    const guess = +b.dataset.d;
    face = Math.random() < 0.5 ? -1 : 1;
    const ok = guess === face;
    if (ok) { score++; pose = { arms: 'up', eyes: 'happy', mouth: 'open' }; sfx('happy'); }
    else { pose = { eyes: 'closed', mouth: 'smile' }; sfx('miss'); }
    round++;
    upd();
    setTimeout(() => {
      pose = {}; locked = false;
      if (round >= 5) { info.textContent = `You got ${score}/5!`; row.innerHTML = '<button class="btn primary block">Done</button>'; row.onclick = () => done({ score, max: 5 }); }
    }, 900);
  });
  return () => cancelAnimationFrame(raf);
}

// ---------------------------------------------------------------------------
// Treat Catch — slide to catch falling treats, avoid messes. 20 seconds.
// ---------------------------------------------------------------------------
export function treatCatch(el, pet, done) {
  el.innerHTML = '<h2>Treat Catch</h2><p class="muted">Drag (or tap left/right) to catch treats. Dodge the messes!</p>';
  const W = 120, H = 110;
  const [cv, ctx] = makeCanvas(el, W, H);
  const info = document.createElement('div'); info.className = 'big-score'; el.appendChild(info);
  let x = 60, target = 60, score = 0, items = [], last = performance.now(), spawn = 0, timeLeft = 20, over = false, raf, face = 1, hitT = 0;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * W; };
  const onPtr = (e) => { if (e.buttons || e.type === 'pointerdown') target = Math.max(10, Math.min(W - 10, pos(e))); };
  cv.addEventListener('pointerdown', onPtr); cv.addEventListener('pointermove', onPtr);
  const loop = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!over) {
      timeLeft -= dt;
      spawn -= dt;
      if (spawn <= 0) {
        spawn = rand(0.35, 0.75);
        const r = Math.random();
        items.push({ x: rand(8, W - 8), y: -8, v: rand(28, 48) + (20 - timeLeft) * 1.5, kind: r < 0.18 ? 'poop' : r < 0.3 ? 'heart' : 'snack' });
      }
      const dx = target - x;
      x += Math.sign(dx) * Math.min(Math.abs(dx), 90 * dt);
      if (Math.abs(dx) > 1) face = Math.sign(dx);
      for (const it of items) {
        it.y += it.v * dt;
        if (!it.hit && it.y > H - 40 && it.y < H - 22 && Math.abs(it.x - x) < 11) {
          it.hit = true;
          if (it.kind === 'poop') { score = Math.max(0, score - 2); sfx('refuse'); hitT = -0.4; }
          else { score += it.kind === 'heart' ? 2 : 1; sfx('tap'); hitT = 0.3; }
        }
      }
      items = items.filter((it) => !it.hit && it.y < H + 10);
      hitT += hitT > 0 ? -dt : dt;
      if (timeLeft <= 0) {
        over = true;
        sfx('coin');
        const btn = document.createElement('button'); btn.className = 'btn primary block'; btn.textContent = 'Done';
        btn.onclick = () => done({ score: Math.min(score, 30), max: 30 });
        el.appendChild(btn);
      }
    }
    stage(ctx, W, H, '#ffe5f1', '#ffc6dd');
    for (const it of items) ctx.drawImage(ICONS[it.kind], Math.round(it.x - 4), Math.round(it.y - 4));
    const pose = hitT > 0 ? { eyes: 'happy', mouth: 'open', arms: 'up' } : hitT < 0 ? { eyes: 'sad', mouth: 'frown' } : { mouth: 'open', arms: 'up' };
    const bob = Math.floor(t / 200) % 2;
    drawSprite(ctx, pet, { ...pose, flap: bob, swing: bob }, x, H - 3, face < 0);
    info.textContent = over ? `Caught ${score}! 🎉` : `⭐ ${score}   ⏱ ${Math.ceil(timeLeft)}s`;
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

// ---------------------------------------------------------------------------
// Timing meter shared by training & battle. Calls back with quality 1..5.
// ---------------------------------------------------------------------------
function timingMeter(el, label, onHit) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="meter"><div class="needle"></div></div><button class="btn primary block">${label}</button>`;
  el.appendChild(wrap);
  const needle = wrap.querySelector('.needle'), btn = wrap.querySelector('button');
  let t0 = performance.now(), raf, stopped = false, posv = 0, speed = 1.2 + Math.random() * 0.5;
  const loop = (t) => {
    if (!stopped) {
      posv = (Math.sin(((t - t0) / 1000) * speed * Math.PI) + 1) / 2;
      needle.style.left = `calc(${posv * 100}% - 3px)`;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  btn.onclick = () => {
    if (stopped) return;
    stopped = true;
    const d = Math.abs(posv - 0.5);
    const q = d < 0.03 ? 5 : d < 0.08 ? 3 : d < 0.2 ? 2 : 1;
    sfx(q >= 3 ? 'hit' : 'miss');
    onHit(q, () => { stopped = false; t0 = performance.now(); speed = 1.2 + Math.random() * 0.6; });
  };
  return { stop: () => cancelAnimationFrame(raf), wrap };
}

const QUAL = { 5: 'PERFECT!', 3: 'Great!', 2: 'Good', 1: 'Miss...' };

export function training(el, pet, stat, done) {
  const names = { power: 'Power', magic: 'Magic', agility: 'Agility' };
  el.innerHTML = `<h2>${names[stat]} Training</h2><p class="muted">Stop the needle in the green zone. 3 tries.</p>`;
  const [, ctx] = makeCanvas(el, 120, 70);
  const info = document.createElement('div'); info.className = 'big-score'; info.textContent = 'Ready?'; el.appendChild(info);
  let tries = 0, total = 0, pose = {}, raf;
  const draw = (t) => {
    stage(ctx, 120, 70, stat === 'magic' ? '#e6dcff' : stat === 'agility' ? '#d6f5ff' : '#ffe2cc', '#c9b49a');
    const bob = Math.floor(t / 250) % 2;
    drawSprite(ctx, pet, { ...pose, flap: bob, swing: bob }, 60, 66 - (pose.arms === 'up' ? bob * 2 : 0));
    if (stat === 'magic' && pose.arms === 'up') for (let i = 0; i < 4; i++) ctx.drawImage(ICONS.sparkle, 40 + i * 12, 10 + ((t / 50 + i * 7) % 20));
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  const meter = timingMeter(el, 'STOP!', (q, again) => {
    tries++; total += q;
    info.textContent = QUAL[q];
    pose = q >= 3 ? { arms: 'up', eyes: 'happy', mouth: 'open' } : { eyes: 'sad', mouth: 'frown' };
    setTimeout(() => {
      pose = {};
      if (tries < 3) { info.textContent = `Try ${tries + 1}/3`; again(); }
      else {
        meter.wrap.remove();
        const quality = total / 3;
        info.textContent = quality >= 4 ? 'Amazing session!' : quality >= 2.5 ? 'Good workout!' : 'Keep practicing!';
        const btn = document.createElement('button'); btn.className = 'btn primary block'; btn.textContent = 'Done';
        btn.onclick = () => done({ quality });
        el.appendChild(btn);
      }
    }, 800);
  });
  return () => { cancelAnimationFrame(raf); meter.stop(); };
}

// ---------------------------------------------------------------------------
// Spar battle against a wild monster.
// ---------------------------------------------------------------------------
export function battle(el, pet, done) {
  const sp = SPECIES_BY_ID[pet.species];
  const foeStage = Math.max(2, Math.min(4, pet.stage + (Math.random() < 0.25 ? 1 : 0) - (Math.random() < 0.25 ? 1 : 0)));
  const foeSp = pick(SPECIES.filter((s) => s.id !== pet.species));
  const foe = { stage: foeStage, species: foeSp.id, family: foeSp.fam, variant: 'shadow' };
  const atk = 6 + pet.stage * 2 + (pet.power + pet.magic) / 25;
  const dodge = Math.min(0.4, pet.agility / 250);
  let hp = 40 + pet.stage * 12 + Math.floor(pet.power / 10), maxHp = hp;
  let fhp = 34 + foeStage * 12 + Math.floor(rand(0, 10)), fmax = fhp;
  el.innerHTML = `<h2>Spar Battle</h2><p class="muted">A wild <b>${speciesTitle(foeSp, foeStage, 'shadow')}</b> appears!</p>`;
  const [, ctx] = makeCanvas(el, 120, 70);
  const hpRow = document.createElement('div'); hpRow.className = 'hp'; el.appendChild(hpRow);
  const info = document.createElement('div'); info.className = 'big-score'; info.textContent = 'Attack when ready!'; el.appendChild(info);
  let poseA = {}, poseB = {}, shakeA = 0, shakeB = 0, raf, ended = false;
  const bar = (v, m, c) => `<div class="hbar"><div style="width:${(100 * Math.max(0, v)) / m}%;background:${c}"></div></div>`;
  const renderHp = () => { hpRow.innerHTML = `<div>${pet.name}${bar(hp, maxHp, '#69f0ae')}</div><div>Foe${bar(fhp, fmax, '#ff5252')}</div>`; };
  renderHp();
  const draw = (t) => {
    stage(ctx, 120, 70, '#2b2350', '#4f3f80');
    const bob = Math.floor(t / 300) % 2;
    drawSprite(ctx, pet, { ...poseA, flap: bob, swing: bob }, 32 + (shakeA ? (bob ? 2 : -2) : 0), 66, false, { sp });
    drawSprite(ctx, foe, { ...poseB, flap: bob, swing: bob }, 88 + (shakeB ? (bob ? 2 : -2) : 0), 66, true, { sp: foeSp });
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  const finish = (won) => {
    ended = true;
    meter.wrap.remove();
    info.textContent = won ? 'Victory! 🏆' : 'She lost... but she tried her best!';
    poseA = won ? { arms: 'up', eyes: 'happy', mouth: 'open' } : { eyes: 'sad', mouth: 'frown' };
    sfx(won ? 'evolve' : 'sad');
    const btn = document.createElement('button'); btn.className = 'btn primary block'; btn.textContent = 'Done';
    btn.onclick = () => done({ won });
    el.appendChild(btn);
  };
  const meter = timingMeter(el, 'ATTACK!', (q, again) => {
    const dmg = Math.round(atk * [0, 0.4, 0.9, 1.4, 0, 2][q]);
    fhp -= dmg; shakeB = 1; poseA = { arms: 'up', mouth: 'open', eyes: 'angry' }; poseB = { eyes: 'closed', mouth: 'frown' };
    info.textContent = `${QUAL[q]} ${dmg} dmg!`;
    renderHp();
    setTimeout(() => {
      shakeB = 0; poseA = {}; poseB = {};
      if (fhp <= 0) return finish(true);
      poseB = { arms: 'up', mouth: 'open', eyes: 'angry' };
      if (Math.random() < dodge) { info.textContent = 'She dodged!'; sfx('miss'); }
      else {
        const edmg = Math.round(5 + foeStage * 3 + rand(0, 6));
        hp -= edmg; shakeA = 1; poseA = { eyes: 'closed', mouth: 'frown' }; sfx('hit');
        info.textContent = `Ouch! -${edmg}`;
      }
      renderHp();
      setTimeout(() => {
        shakeA = 0; poseA = {}; poseB = {};
        if (hp <= 0) return finish(false);
        if (!ended) again();
      }, 700);
    }, 700);
  });
  return () => { cancelAnimationFrame(raf); meter.stop(); };
}
