// Core simulation: pet state, per-minute ticking, care actions and evolution.
import { stageLength, BASE_WEIGHT, SPECIES, SPECIES_BY_ID, FAMILIES, COUNTER_KEYS } from './data.js';
import { clamp, rand, pick } from './util.js';

const SAVE_KEY = 'mythpals.save.v1';

const emptyCounters = () => Object.fromEntries(COUNTER_KEYS.map((k) => [k, 0]));

export function newPet(family, name) {
  return {
    name: name || 'Mochi', family, species: null, stage: 0, variant: 'normal',
    age: 0, stageAge: 0, stageProgress: 0,
    hunger: 70, happy: 70, energy: 100, hygiene: 100, health: 100, discipline: 10, bond: 5, weight: BASE_WEIGHT[0],
    power: 0, magic: 0, agility: 0,
    asleep: false, lightsOn: true, sick: false, poops: 0, poopTimer: 60,
    misbehaving: false, misbehaveTimer: 0, snackStreak: 0,
    mistakes: 0, totalMistakes: 0, care: { sum: 0, n: 0 }, counters: emptyCounters(),
    neglect: { hunger: 0, happy: 0, lights: 0, sick: 0, poop: 0 },
    alive: true, born: Date.now(),
  };
}

export function newState() {
  return {
    v: 1, lastReal: Date.now(), speed: 4, growth: 4, gentle: true, sound: true, vibrate: true, previewAll: false,
    coins: 40, generation: 1, pet: null,
    unlocked: {}, dex: {}, legends: [],
    inventory: { cake: 1, fav: 0, ball: 0, salts: 0, vitamin: 0 },
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1) {
        if (s.growth === undefined) s.growth = s.speed; // saves from before growth/needs pacing split
        if (s.pet && s.pet.stageProgress === undefined) s.pet.stageProgress = Math.min(1, s.pet.stageAge / stageLength(s.pet.stage, s.speed, s.growth));
        return Object.assign(newState(), s);
      }
    }
  } catch (e) { /* ignore corrupt or unavailable storage */ }
  return newState();
}

export function save(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

export function wipe() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

export const species = (pet) => (pet && pet.species ? SPECIES_BY_ID[pet.species] : null);

export function maxWeight(pet) { return BASE_WEIGHT[pet.stage] * 1.6; }

// Real-world minutes until the next stage.
export function minutesToNextStage(state) {
  const p = state.pet;
  if (!p || p.stage >= 4) return 0;
  return (Math.max(0, 1 - p.stageProgress) * stageLength(p.stage, state.speed, state.growth)) / state.speed;
}

export function unlockKey(pet) {
  if (pet.stage === 1) return `wisp:${pet.family}`;
  return `${pet.species}:${pet.stage}:${pet.variant}`;
}

// --------------------------------------------------------------------------
// Ticking
// --------------------------------------------------------------------------

// Advance the simulation by `minutes` game minutes. Returns the list of events that happened.
export function advance(state, minutes, offline = false) {
  const events = [];
  for (let i = 0; i < minutes; i++) {
    stepMinute(state, events, offline);
    if (!state.pet || !state.pet.alive) break;
  }
  return events;
}

function stepMinute(state, ev, offline) {
  const p = state.pet;
  if (!p || !p.alive) return;
  p.age += 1;
  p.stageAge += 1;
  if (p.stage < 4) p.stageProgress += 1 / stageLength(p.stage, state.speed, state.growth);

  if (p.stage === 0) {
    if (p.stageProgress >= 1) evolve(state, ev);
    return;
  }

  const r = offline && state.gentle ? 0.5 : 1;
  if (!p.asleep) {
    p.hunger -= 0.25 * r;
    p.happy -= (p.sick ? 0.35 : 0.2) * r;
    p.energy -= 0.12 * r;
  } else {
    p.energy += p.lightsOn ? 0.3 : 0.7;
    p.hunger -= 0.08 * r;
  }
  p.hygiene -= (p.poops * 0.25 + 0.03) * r;
  p.snackStreak = Math.max(0, p.snackStreak - 1 / 60);

  // messes
  if (!p.asleep && --p.poopTimer <= 0) {
    if (p.poops < 4) { p.poops += 1; ev.push({ type: 'poop' }); }
    p.poopTimer = rand(80, 160);
  }

  // sleep / wake
  if (!p.asleep && p.energy <= 8) {
    p.asleep = true;
    ev.push({ type: 'sleep' });
  } else if (p.asleep && p.energy >= 100) {
    p.asleep = false;
    if (!p.lightsOn) p.counters.sleep += 1;
    p.lightsOn = true;
    ev.push({ type: 'wake' });
  }

  // sickness
  if (!p.sick) {
    let risk = 0;
    if (p.hygiene < 30) risk += 0.004;
    if (p.poops >= 3) risk += 0.004;
    if (p.weight > maxWeight(p)) risk += 0.003;
    if (p.snackStreak > 4) risk += 0.004;
    if (p.hunger <= 0) risk += 0.002;
    if (Math.random() < risk) { p.sick = true; ev.push({ type: 'sick' }); }
  }

  // health
  if (p.sick) p.health -= 0.15;
  if (p.hunger <= 0) p.health -= 0.2;
  if (p.hygiene <= 10) p.health -= 0.05;
  if (!p.sick && p.hunger > 30 && p.hygiene > 30) p.health += 0.1;

  // neglect -> care mistakes (one per episode after 30 minutes)
  const check = (k, cond) => {
    if (cond) {
      p.neglect[k] += 1;
      if (p.neglect[k] === 30) { p.mistakes += 1; p.totalMistakes += 1; p.counters.mistake += 1; ev.push({ type: 'mistake', reason: k }); }
    } else p.neglect[k] = 0;
  };
  check('hunger', p.hunger <= 0);
  check('happy', p.happy <= 0);
  check('lights', p.asleep && p.lightsOn);
  check('sick', p.sick);
  check('poop', p.poops >= 3);

  // fake calls for attention (discipline)
  if (!p.asleep && !p.misbehaving && !offline && Math.random() < 0.003 * (1 - p.discipline / 120)) {
    p.misbehaving = true;
    p.misbehaveTimer = 0;
    ev.push({ type: 'tantrum' });
  }
  if (p.misbehaving && ++p.misbehaveTimer > 30) {
    p.misbehaving = false;
    p.discipline -= 5;
  }

  for (const k of ['hunger', 'happy', 'energy', 'hygiene', 'health', 'discipline', 'bond']) p[k] = clamp(p[k]);

  p.care.sum += (p.hunger + p.happy + p.hygiene + p.health) / 4;
  p.care.n += 1;

  if (p.stage < 4 && p.stageProgress >= 1 && !p.asleep) evolve(state, ev);

  if (p.health <= 0) {
    if (state.gentle) {
      p.health = 5;
    } else {
      p.alive = false;
      ev.push({ type: 'depart' });
    }
  }
}

// --------------------------------------------------------------------------
// Evolution
// --------------------------------------------------------------------------

export function chooseSpecies(pet) {
  const pool = SPECIES.filter((s) => s.fam === pet.family);
  const c = pet.counters;
  const total = COUNTER_KEYS.reduce((a, k) => a + (k === 'mistake' ? 0 : c[k]), 0) + 1;
  let best = null, bestScore = -Infinity;
  for (const sp of pool) {
    let score = Math.random() * 0.15;
    for (const [k, w] of Object.entries(sp.aff)) {
      const share = k === 'mistake' ? Math.min(c.mistake / 3, 1) : c[k] / total;
      score += w * share;
    }
    if (sp.aff.mistake < 0 && c.mistake > 0) score -= 5;
    if (score > bestScore) { bestScore = score; best = sp; }
  }
  return best;
}

export function careGrade(pet) {
  const avg = pet.care.n ? pet.care.sum / pet.care.n : 50;
  if (pet.mistakes <= 1 && avg >= 62 && pet.bond >= 35) return 'radiant';
  if (pet.mistakes >= 5 || avg < 35) return 'shadow';
  return 'normal';
}

function evolve(state, ev) {
  const p = state.pet;
  const from = { stage: p.stage, species: p.species, variant: p.variant };
  p.stage += 1;
  if (p.stage === 2) {
    p.species = chooseSpecies(p).id;
    state.dex[p.species] = true;
  } else if (p.stage >= 3) {
    p.variant = careGrade(p);
  }
  p.stageAge = 0;
  p.stageProgress = 0;
  p.mistakes = 0;
  p.care = { sum: 0, n: 0 };
  p.counters = emptyCounters();
  p.weight += BASE_WEIGHT[p.stage] - BASE_WEIGHT[p.stage - 1];
  p.health = clamp(p.health + 30);
  p.happy = clamp(p.happy + 20);
  state.unlocked[unlockKey(p)] = true;
  ev.push({ type: p.stage === 1 ? 'hatch' : 'evolve', from, to: { stage: p.stage, species: p.species, variant: p.variant } });
}

// --------------------------------------------------------------------------
// Actions. Each returns { ok, msg, anim } for the UI.
// --------------------------------------------------------------------------

const busy = (p) => (p.stage === 0 ? 'Your egg is still incubating.' : p.asleep ? `${p.name} is asleep. Shh!` : null);

export function feed(state, kind) {
  const p = state.pet;
  const b = busy(p); if (b) return { ok: false, msg: b };
  if (kind === 'meal') {
    if (p.hunger >= 98) return { ok: false, msg: `${p.name} is already full!`, anim: 'refuse' };
    if (p.discipline < 40 && Math.random() < 0.3) { return { ok: false, msg: `${p.name} refuses to eat! (Low discipline)`, anim: 'refuse' }; }
    p.hunger = clamp(p.hunger + 25); p.weight += 1; p.counters.meal += 1;
    p.poopTimer = Math.min(p.poopTimer, rand(30, 70));
    return { ok: true, msg: 'Nom nom! A hearty meal.', anim: 'eat', food: 'meal' };
  }
  if (kind === 'snack') {
    p.happy = clamp(p.happy + 15); p.hunger = clamp(p.hunger + 5); p.weight += 2; p.snackStreak += 1; p.counters.snack += 1;
    return { ok: true, msg: p.snackStreak > 4 ? 'Yum... but too many snacks can make her sick!' : 'A sweet treat!', anim: 'eat', food: 'snack' };
  }
  if (kind === 'cake' || kind === 'fav') {
    if (!state.inventory[kind]) return { ok: false, msg: 'You don\'t have any. Visit the shop!' };
    state.inventory[kind] -= 1;
    if (kind === 'cake') { p.happy = clamp(p.happy + 30); p.hunger = clamp(p.hunger + 10); p.weight += 2; p.counters.snack += 1; }
    else { p.happy = clamp(p.happy + 30); p.bond = clamp(p.bond + 10); p.hunger = clamp(p.hunger + 20); p.counters.meal += 1; p.counters.pet += 1; }
    return { ok: true, msg: kind === 'fav' ? 'Her favorite! She is overjoyed!' : 'Cake! Pure bliss.', anim: 'eat', food: 'snack' };
  }
  return { ok: false };
}

export function pet(state) {
  const p = state.pet;
  if (p.stage === 0) return { ok: true, msg: 'The egg feels warm. Something wiggles inside.', anim: 'wobble' };
  if (p.asleep) return { ok: true, msg: `${p.name} smiles in her sleep.`, anim: 'none' };
  p.bond = clamp(p.bond + 3 * (1 - p.bond / 150));
  p.happy = clamp(p.happy + 5);
  p.counters.pet += 1;
  return { ok: true, msg: 'Pat pat! 💕', anim: 'love' };
}

export function clean(state, bath = false) {
  const p = state.pet;
  if (p.stage === 0) return { ok: false, msg: 'The egg is spotless.' };
  if (bath) {
    if (!state.inventory.salts) return { ok: false, msg: 'You need Bath Salts from the shop.' };
    state.inventory.salts -= 1;
    p.poops = 0; p.hygiene = 100; p.happy = clamp(p.happy + 10); p.counters.clean += 2;
    return { ok: true, msg: 'A luxurious bubble bath!', anim: 'clean' };
  }
  if (p.poops === 0 && p.hygiene > 80) return { ok: false, msg: 'Everything is already tidy.' };
  p.poops = 0; p.hygiene = clamp(p.hygiene + 35); p.counters.clean += 1;
  return { ok: true, msg: 'All clean! ✨', anim: 'clean' };
}

export function heal(state, vitamin = false) {
  const p = state.pet;
  if (p.stage === 0) return { ok: false, msg: 'Eggs don\'t need medicine.' };
  if (vitamin) {
    if (!state.inventory.vitamin) return { ok: false, msg: 'You need Vitamins from the shop.' };
    state.inventory.vitamin -= 1; p.health = clamp(p.health + 40);
    return { ok: true, msg: 'Vitamins! She feels stronger.', anim: 'happy' };
  }
  if (!p.sick) { p.happy = clamp(p.happy - 5); return { ok: false, msg: 'She isn\'t sick... and the medicine tastes awful!', anim: 'refuse' }; }
  p.sick = false; p.health = clamp(p.health + 15); p.counters.heal += 1;
  return { ok: true, msg: 'She feels much better!', anim: 'happy' };
}

export function toggleLights(state) {
  const p = state.pet;
  p.lightsOn = !p.lightsOn;
  if (!p.lightsOn && !p.asleep && p.stage > 0 && p.energy < 70) {
    p.asleep = true;
    return { ok: true, msg: `Lights out. ${p.name} drifts off to sleep...`, anim: 'none' };
  }
  if (p.lightsOn && p.asleep && p.stage > 0) return { ok: true, msg: 'Lights on. (She is still sleeping!)' };
  return { ok: true, msg: p.lightsOn ? 'Lights on.' : 'Lights off.' };
}

export function scold(state) {
  const p = state.pet;
  const b = busy(p); if (b) return { ok: false, msg: b };
  if (p.misbehaving) {
    p.misbehaving = false; p.discipline = clamp(p.discipline + 25); p.counters.scold += 1;
    return { ok: true, msg: 'She settles down. Discipline up!', anim: 'sad' };
  }
  p.happy = clamp(p.happy - 15); p.bond = clamp(p.bond - 5);
  return { ok: false, msg: 'She didn\'t do anything wrong... 😢', anim: 'sad' };
}

export function canDoActivity(state) {
  const p = state.pet;
  const b = busy(p); if (b) return b;
  if (p.energy < 12) return `${p.name} is too tired.`;
  if (p.sick) return `${p.name} is sick. Give her medicine first.`;
  return null;
}

export function applyPlay(state, score, max) {
  const p = state.pet;
  const r = max ? score / max : 0;
  const coins = Math.round(5 + r * 20);
  p.happy = clamp(p.happy + 10 + r * 25); p.energy = clamp(p.energy - 10); p.hunger = clamp(p.hunger - 5);
  p.weight = Math.max(BASE_WEIGHT[p.stage] * 0.6, p.weight - 1); p.bond = clamp(p.bond + 2);
  p.counters.play += 1;
  state.coins += coins;
  return coins;
}

export function applyToy(state) {
  const p = state.pet;
  if (!state.inventory.ball) return { ok: false, msg: 'You need a Toy Ball from the shop.' };
  const b = busy(p); if (b) return { ok: false, msg: b };
  state.inventory.ball -= 1; p.happy = clamp(p.happy + 25); p.counters.play += 1;
  return { ok: true, msg: 'Boing boing! She loves the new toy.', anim: 'happy' };
}

export function applyTraining(state, stat, quality) {
  const p = state.pet;
  const gain = Math.max(1, Math.round(quality * (p.stage + 1)));
  p[stat] += gain; p.energy = clamp(p.energy - 15); p.hunger = clamp(p.hunger - 10);
  p.weight = Math.max(BASE_WEIGHT[p.stage] * 0.6, p.weight - 1);
  p.counters[stat] += 1 + (quality >= 3 ? 1 : 0);
  if (quality >= 3) p.discipline = clamp(p.discipline + 3);
  return gain;
}

export function applyBattle(state, won) {
  const p = state.pet;
  p.energy = clamp(p.energy - 20); p.hunger = clamp(p.hunger - 10);
  if (won) {
    const coins = 15 + p.stage * 10;
    state.coins += coins; p.bond = clamp(p.bond + 4); p.happy = clamp(p.happy + 10);
    p.counters.power += 1;
    return coins;
  }
  p.happy = clamp(p.happy - 10);
  return 0;
}

export function buy(state, item) {
  if (state.coins < item.price) return { ok: false, msg: 'Not enough coins.' };
  state.coins -= item.price;
  state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
  return { ok: true, msg: `Bought ${item.name}!` };
}

export function journey(state) {
  const p = state.pet;
  state.legends.push({ name: p.name, species: p.species, variant: p.variant, gen: state.generation, age: p.age, bond: Math.round(p.bond) });
  state.generation += 1;
  state.coins += 100;
  state.pet = null;
}

export function memorialize(state) {
  const p = state.pet;
  if (p.species) state.legends.push({ name: p.name, species: p.species, variant: p.variant, gen: state.generation, age: p.age, bond: Math.round(p.bond), departed: true });
  state.generation += 1;
  state.pet = null;
}

// Three random eggs from distinct families.
export function eggChoices() {
  const fams = Object.keys(FAMILIES);
  const out = [];
  while (out.length < 3) { const f = pick(fams); if (!out.includes(f)) out.push(f); }
  return out;
}

// What the pet currently "wants" (drives the attention icon).
export function needs(pet) {
  if (!pet || pet.stage === 0 || !pet.alive) return [];
  const n = [];
  if (pet.asleep) { if (pet.lightsOn) n.push('lights'); return n; }
  if (pet.hunger < 20) n.push('hunger');
  if (pet.happy < 20) n.push('happy');
  if (pet.poops >= 2 || pet.hygiene < 25) n.push('clean');
  if (pet.sick) n.push('sick');
  if (pet.energy < 15) n.push('tired');
  if (pet.misbehaving) n.push('tantrum');
  return n;
}
