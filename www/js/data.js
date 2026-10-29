// Static game data: egg families, species, stages, foods and shop items.

// Game-minutes needed in each stage before evolving (egg, wisp, rookie, champion).
export const STAGE_TIME = [2, 45, 720, 2880];
export const STAGE_NAMES = ['Egg', 'Wisp', 'Spark', 'Bloom', 'Legend'];
export const BASE_WEIGHT = [3, 5, 15, 30, 45];

// Pacing is split in two so players can grow a pet quickly without frantic care (or the reverse).
// Growth: how fast she moves through the stages. Total time from egg to Legend at 1x is ~61 hours.
export const GROWTH_SPEEDS = [
  { id: 1, label: 'Patient (real time)', hint: 'about 2½ days to Legend' },
  { id: 4, label: 'Steady (4×)', hint: 'about 15 hours to Legend' },
  { id: 12, label: 'Quick (12×)', hint: 'about 5 hours to Legend' },
  { id: 60, label: 'Speedy (60×)', hint: 'about 1 hour to Legend' },
  { id: 180, label: 'Whirlwind (180×)', hint: 'about 20 minutes to Legend' },
];
// Needs: how fast hunger, mood, energy and messes change.
export const NEEDS_SPEEDS = [
  { id: 1, label: 'Chill (1×)', hint: 'check in every few hours' },
  { id: 2, label: 'Easygoing (2×)', hint: 'check in every hour or two' },
  { id: 4, label: 'Lively (4×)', hint: 'check in about once an hour' },
  { id: 10, label: 'Busy (10×)', hint: 'check in every 15–20 minutes' },
];

// Game-minute length of a stage for the current pacing (stage age is counted in game minutes,
// which tick at the needs speed).
export function stageLength(stage, needs, growth) {
  return Math.max(1, Math.round((STAGE_TIME[stage] * needs) / growth));
}

export const VARIANTS = {
  normal: { prefix: '', label: 'Normal' },
  radiant: { prefix: 'Radiant ', label: 'Radiant' },
  shadow: { prefix: 'Dusk ', label: 'Dusk' },
};

// Egg families. A wisp hatches from the egg and becomes one of the family's species
// depending on how it was raised.
export const FAMILIES = {
  beast: { name: 'Beastkin', egg: ['#ffd29d', '#c47a3a'], wisp: '#ffcf8a', hint: 'A fuzzy, warm egg that purrs softly.',
    bg: ['#ffe5c4', '#ff9eaa'], room: 'cottage' },
  wild: { name: 'Wildfolk', egg: ['#b5d98b', '#5b7f3a'], wisp: '#a8d672', hint: 'A rough, sturdy egg covered in scratches.',
    bg: ['#e2f0c9', '#8a6a4f'], room: 'camp' },
  sylvan: { name: 'Sylvan', egg: ['#c8f7c5', '#3f9f5f'], wisp: '#9ff0b5', hint: 'A leafy egg that smells like spring rain.',
    bg: ['#d8ffe0', '#2d6a4f'], room: 'forest' },
  spirit: { name: 'Spirit', egg: ['#e6dcff', '#7a68b8'], wisp: '#d6ccff', hint: 'A cold, pale egg. Sometimes it floats.',
    bg: ['#d9c8f0', '#232046'], room: 'haunt' },
  tide: { name: 'Tidal', egg: ['#b3ecff', '#2a7fc0'], wisp: '#8fe3ff', hint: 'A glossy egg. You can hear waves inside.',
    bg: ['#bfe6ff', '#0b4f8a'], room: 'shore' },
  sky: { name: 'Skyborn', egg: ['#fff3c4', '#f08fb0'], wisp: '#fff0a8', hint: 'A light, feathery egg that hums a tune.',
    bg: ['#d6efff', '#ffc4de'], room: 'clouds' },
  infernal: { name: 'Infernal', egg: ['#ffb3d1', '#6b1f7a'], wisp: '#ff9ccc', hint: 'A warm egg with a tiny heart-shaped mark.',
    bg: ['#ffb0d0', '#3c0d5c'], room: 'abyss' },
  draconic: { name: 'Draconic', egg: ['#ffd77a', '#b3261e'], wisp: '#ffb36b', hint: 'A heavy, scaled egg. It is very warm.',
    bg: ['#ffe08a', '#8c1c13'], room: 'lair' },
};

// Affinity keys (care counters tracked during the Wisp stage):
// meal snack play pet power magic agility clean scold sleep mistake heal
export const AFFINITY_HINTS = {
  meal: 'hearty meals', snack: 'sweet treats', play: 'lots of play', pet: 'affection',
  power: 'Power training', magic: 'Magic training', agility: 'Agility training', clean: 'a tidy home',
  scold: 'firm discipline', sleep: 'restful nights', mistake: 'a little neglect', heal: 'medicine',
};

const S = (o) => ({
  horns: null, wings: null, tail: null, ears: 'human', lower: 'legs', extras: [], hairStyle: 'long',
  accent: '#ffffff', outfitStyle: 'dress', pupil: 'round', ...o,
});

export const SPECIES = [
  // ---------------- Beastkin ----------------
  S({ id: 'cat', fam: 'beast', names: ['Nekomimi', 'Cat Sith', 'Bastet Queen'],
    skin: '#ffe3cf', hair: '#f2994a', eyes: '#2fb36b', outfit: '#ff7eb6', accent: '#fff2f8',
    hairStyle: 'bob', ears: 'cat', tail: 'cat', pupil: 'slit', fav: 'Grilled Fish',
    aff: { play: 2, snack: 1.5 }, desc: 'A playful cat-eared beastkin. Naps in sunbeams and steals snacks.' }),
  S({ id: 'dog', fam: 'beast', names: ['Inumimi', 'Hound Knight', 'Sirius Paladin'],
    skin: '#ffe0c4', hair: '#c4935f', eyes: '#6b4423', outfit: '#4a90d9', accent: '#ffe17a',
    hairStyle: 'short', ears: 'dog', tail: 'dog', fav: 'Meaty Bone',
    aff: { pet: 2, scold: 1.5 }, desc: 'Loyal and cheerful. Will follow you absolutely everywhere.' }),
  S({ id: 'fox', fam: 'beast', names: ['Kitsune', 'Twin-Tail Kitsune', 'Nine-Tails'],
    skin: '#fff0e2', hair: '#f28c28', eyes: '#c0392b', outfit: '#ffffff', accent: '#d7263d',
    hairStyle: 'long', ears: 'fox', tail: 'fox', fav: 'Fried Tofu', outfitStyle: 'kimono',
    aff: { magic: 2, play: 0.5 }, desc: 'A mischievous fox spirit who grows more tails as her magic deepens.' }),
  S({ id: 'wolf', fam: 'beast', names: ['Wolfkin', 'Moon Howler', 'Fenrir Alpha'],
    skin: '#f6dccb', hair: '#a3aec4', eyes: '#ffc93c', outfit: '#3d4a5c', accent: '#c8d3e6',
    hairStyle: 'wild', ears: 'wolf', tail: 'wolf', pupil: 'slit', fav: 'Rare Steak',
    aff: { power: 2, meal: 1 }, desc: 'Proud pack leader with a howl that echoes over the hills.' }),
  S({ id: 'bunny', fam: 'beast', names: ['Usagimimi', 'Moon Rabbit', 'Lunar Empress'],
    skin: '#fff0ea', hair: '#fff4f7', eyes: '#e5446d', outfit: '#9d7cd8', accent: '#ffd1e8',
    hairStyle: 'twintails', ears: 'bunny', tail: 'puff', fav: 'Carrot Cake',
    aff: { agility: 2, snack: 0.5 }, desc: 'Quick on her feet and quicker to giggle. Loves the full moon.' }),
  S({ id: 'squirrel', fam: 'beast', names: ['Risumimi', 'Acorn Ranger', 'Ratatoskr'],
    skin: '#ffe2c8', hair: '#b5562b', eyes: '#3b2314', outfit: '#5f8d4e', accent: '#f4d58d',
    hairStyle: 'ponytail', ears: 'squirrel', tail: 'squirrel', fav: 'Golden Acorn',
    aff: { meal: 2, snack: 1 }, desc: 'Hoards snacks in every pocket. Her tail is bigger than she is.' }),

  // ---------------- Wildfolk ----------------
  S({ id: 'goblin', fam: 'wild', names: ['Goblin', 'Hobgoblin', 'Goblin Matriarch'],
    skin: '#8fc65a', hair: '#3e2723', eyes: '#ffe14d', outfit: '#8d6e63', accent: '#d7b98e',
    hairStyle: 'wild', ears: 'goblin', fav: 'Shiny Mushroom', outfitStyle: 'tunic',
    aff: { mistake: 2, snack: 1 }, desc: 'Scrappy, clever and loud. Collects anything shiny.' }),
  S({ id: 'orc', fam: 'wild', names: ['Orc', 'Orc Warrior', 'Orc Warchief'],
    skin: '#79a05a', hair: '#1f1b1b', eyes: '#e53935', outfit: '#7b5a44', accent: '#c0c0c0',
    hairStyle: 'ponytail', ears: 'elfShort', extras: ['tusks'], fav: 'Roast Boar', outfitStyle: 'armor',
    aff: { power: 2, meal: 1 }, desc: 'Strong, honest and fiercely protective of her friends.' }),
  S({ id: 'minotaur', fam: 'wild', names: ['Minotaur', 'Minotaur Gladiator', 'Labyrinth Queen'],
    skin: '#f5d0b0', hair: '#5d4037', eyes: '#4e342e', outfit: '#c62828', accent: '#ffd54f',
    hairStyle: 'long', ears: 'cow', horns: 'bull', tail: 'cow', fav: 'Fresh Hay Bread', outfitStyle: 'armor',
    aff: { power: 1.5, meal: 1.5 }, desc: 'A gentle giant with mighty horns. Never gets lost in a maze.' }),
  S({ id: 'oni', fam: 'wild', names: ['Oni', 'Oni Brawler', 'Great Oni'],
    skin: '#ff9a8a', hair: '#f5f5f5', eyes: '#ffd54f', outfit: '#283593', accent: '#ffca28',
    hairStyle: 'wild', horns: 'oni', extras: ['fangs'], fav: 'Sake Dango', outfitStyle: 'kimono',
    aff: { power: 1.5, scold: 1.5 }, desc: 'A boisterous ogre-spirit who loves festivals and arm-wrestling.' }),

  // ---------------- Sylvan ----------------
  S({ id: 'elf', fam: 'sylvan', names: ['Elf', 'Elf Ranger', 'High Elf Queen'],
    skin: '#fde7d6', hair: '#f7e08a', eyes: '#2e9e6a', outfit: '#3f8f4a', accent: '#e8d48a',
    hairStyle: 'long', ears: 'elf', fav: 'Lembas Bread',
    aff: { agility: 1.5, pet: 1.5 }, desc: 'Graceful forest archer. Has excellent taste in tea.' }),
  S({ id: 'darkelf', fam: 'sylvan', names: ['Dark Elf', 'Dusk Blade', 'Drow Matron'],
    skin: '#9b7fa6', hair: '#eceaf5', eyes: '#e53935', outfit: '#2d1b3d', accent: '#b388ff',
    hairStyle: 'ponytail', ears: 'elf', fav: 'Cave Truffle',
    aff: { magic: 1.5, scold: 1.5 }, desc: 'A cool-headed sorceress from the underdark. Secretly loves cuddles.' }),
  S({ id: 'dryad', fam: 'sylvan', names: ['Dryad', 'Grove Keeper', 'Verdant Empress'],
    skin: '#d4ecb8', hair: '#5fb85f', eyes: '#8d6e63', outfit: '#2e7d32', accent: '#ff9ccf',
    hairStyle: 'flowing', ears: 'elfShort', extras: ['flower'], fav: 'Spring Water',
    aff: { clean: 2, meal: 1 }, desc: 'A tree spirit who blooms when cared for. Hums to the flowers.' }),
  S({ id: 'fairy', fam: 'sylvan', names: ['Pixie', 'Sylph', 'Titania'],
    skin: '#ffe4ec', hair: '#ff9ad5', eyes: '#4fc3f7', outfit: '#b388ff', accent: '#fff59d',
    hairStyle: 'bun', ears: 'elfShort', wings: 'fairy', fav: 'Honey Drop',
    aff: { play: 1.5, snack: 1.5 }, desc: 'A tiny bundle of sparkles and pranks.' }),
  S({ id: 'centaur', fam: 'sylvan', names: ['Centaur', 'Centaur Archer', 'Sagittaria'],
    skin: '#f1c9a5', hair: '#6d4c41', eyes: '#33691e', outfit: '#a1887f', accent: '#e0c38c', lower: 'horse',
    lowerColor: '#8d6e63', hairStyle: 'ponytail', fav: 'Sugar Apple',
    aff: { agility: 1.5, power: 1.5 }, desc: 'Half-horse huntress. Gallops faster than the wind.' }),

  // ---------------- Spirit ----------------
  S({ id: 'ghost', fam: 'spirit', names: ['Ghost', 'Poltergeist', 'Phantom Queen'],
    skin: '#e7f3ff', hair: '#b3e5fc', eyes: '#7e57c2', outfit: '#ffffff', accent: '#b39ddb', lower: 'ghost',
    hairStyle: 'long', fav: 'Spirit Candle',
    aff: { play: 1.5, mistake: 1 }, desc: 'A shy phantom who loves jump-scares (and being hugged after).' }),
  S({ id: 'vampire', fam: 'spirit', names: ['Vampire', 'Vampire Countess', 'Vampire Progenitor'],
    skin: '#f8e6ea', hair: '#2b1b2f', eyes: '#d81b60', outfit: '#4a0e2e', accent: '#ffd54f',
    hairStyle: 'twintails', wings: 'bat', extras: ['fangs'], fav: 'Tomato Juice',
    aff: { magic: 1.5, scold: 1 }, desc: 'Elegant creature of the night. Prefers tomato juice, honestly.' }),
  S({ id: 'yukionna', fam: 'spirit', names: ['Yuki-onna', 'Frost Maiden', 'Winter Sovereign'],
    skin: '#f0f8ff', hair: '#dff1ff', eyes: '#4fc3f7', outfit: '#90caf9', accent: '#ffffff',
    hairStyle: 'flowing', extras: ['snowflake'], fav: 'Shaved Ice', outfitStyle: 'kimono',
    aff: { clean: 1.5, magic: 1.5 }, desc: 'A snow spirit whose touch is cold but whose heart is warm.' }),
  S({ id: 'mummy', fam: 'spirit', names: ['Mummy', 'Tomb Guardian', 'Pharaoh Queen'],
    skin: '#e9d2b0', hair: '#1f1f1f', eyes: '#ffca28', outfit: '#f3ead7', accent: '#2a9d8f',
    hairStyle: 'bob', extras: ['bandage'], fav: 'Date Cakes', outfitStyle: 'tunic',
    aff: { scold: 1.5, power: 1.5 }, desc: 'Ancient royalty wrapped in linen. Very strict about bedtime.' }),

  // ---------------- Tidal ----------------
  S({ id: 'siren', fam: 'tide', names: ['Siren', 'Tide Singer', 'Abyssal Diva'],
    skin: '#ffe0d2', hair: '#4dd0e1', eyes: '#00838f', outfit: '#f48fb1', accent: '#fff3e0', lower: 'fish',
    lowerColor: '#26a69a', ears: 'fin', hairStyle: 'flowing', fav: 'Pearl Jelly',
    aff: { play: 1.5, clean: 1.5 }, desc: 'Her songs calm storms. Splashes you when she is happy.' }),
  S({ id: 'lamia', fam: 'tide', names: ['Lamia', 'Lamia Dancer', 'Naga Empress'],
    skin: '#fbe3d0', hair: '#ad1457', eyes: '#ffd600', outfit: '#ffb300', accent: '#00897b', lower: 'snake',
    lowerColor: '#43a047', pupil: 'slit', hairStyle: 'long', extras: ['scales'], fav: 'Egg Custard',
    aff: { pet: 1.5, meal: 1.5 }, desc: 'Loves to wrap her friends in long, warm snake-tail hugs.' }),
  S({ id: 'gorgon', fam: 'tide', names: ['Gorgon', 'Stone Gazer', 'Medusa'],
    skin: '#dcedc8', hair: '#558b2f', eyes: '#ff6f00', outfit: '#6a1b9a', accent: '#ffd54f', lower: 'snake',
    lowerColor: '#827717', pupil: 'slit', hairStyle: 'short', extras: ['snakehair'], fav: 'Sun-baked Figs',
    aff: { magic: 1.5, power: 1, mistake: 0.5 }, desc: 'Wears sunglasses to protect others. Her hair-snakes have names.' }),
  S({ id: 'slime', fam: 'tide', names: ['Slime', 'Slime Mage', 'Slime Empress'],
    skin: '#7fdbe8', hair: '#45b8cc', eyes: '#0a4f7a', outfit: '#45b8cc', accent: '#e0fbff', lower: 'slime',
    hairStyle: 'bob', fav: 'Jelly Cube',
    aff: { meal: 1.5, snack: 1.5 }, desc: 'Bouncy and absorbent. Will eat literally anything.' }),
  S({ id: 'scylla', fam: 'tide', names: ['Scylla', 'Kraken Captain', 'Kraken Queen'],
    skin: '#ffe0e0', hair: '#c62828', eyes: '#ffeb3b', outfit: '#00695c', accent: '#ffd54f', lower: 'tentacle',
    lowerColor: '#e57373', hairStyle: 'wild', fav: 'Sea Pickles',
    aff: { power: 1.5, agility: 1 }, desc: 'A pirate captain with eight arms for eight swords.' }),

  // ---------------- Skyborn ----------------
  S({ id: 'harpy', fam: 'sky', names: ['Harpy', 'Storm Harpy', 'Roc Queen'],
    skin: '#fff0e0', hair: '#ffb74d', eyes: '#f57f17', outfit: '#4fc3f7', accent: '#ffffff', wings: 'harpy',
    wingColor: '#ff8a65', lower: 'bird', hairStyle: 'wild', fav: 'Sunflower Seeds',
    aff: { agility: 1.5, play: 1.5 }, desc: 'Wings for arms and a song for every sunrise.' }),
  S({ id: 'phoenix', fam: 'sky', names: ['Firebird', 'Phoenix', 'Eternal Phoenix'],
    skin: '#ffe6c4', hair: '#ff5722', eyes: '#ffca28', outfit: '#d84315', accent: '#ffe082', wings: 'feather',
    wingColor: '#ff7043', hairStyle: 'flowing', extras: ['flame'], fav: 'Cinnamon Bun',
    aff: { magic: 1.5, heal: 1.5 }, desc: 'Burns bright and is reborn from her ashes. Always warm.' }),
  S({ id: 'bee', fam: 'sky', names: ['Honeybee', 'Hive Guard', 'Hive Queen'],
    skin: '#fff1d6', hair: '#ffca28', eyes: '#4e342e', outfit: '#ffc107', accent: '#212121', wings: 'bee',
    tail: 'stinger', hairStyle: 'bob', extras: ['antennae', 'stripes'], fav: 'Royal Jelly',
    aff: { scold: 1.5, meal: 1 }, desc: 'Hard-working and orderly. Makes the best honey toast.' }),
  S({ id: 'moth', fam: 'sky', names: ['Mothkin', 'Luna Moth', 'Nightlight Monarch'],
    skin: '#fbf3ea', hair: '#f3ead2', eyes: '#2a1f3d', outfit: '#bcaaa4', accent: '#ffffff', wings: 'moth',
    wingColor: '#c8b6a6', hairStyle: 'bob', extras: ['antennaeFeather', 'fluff'], fav: 'Lamp Oil Candy',
    aff: { sleep: 2, magic: 1 }, desc: 'Fluffy and sleepy. Absolutely cannot resist a nightlight.' }),
  S({ id: 'angel', fam: 'sky', names: ['Angel', 'Archangel', 'Seraph'],
    skin: '#fff3ea', hair: '#ffe082', eyes: '#42a5f5', outfit: '#ffffff', accent: '#ffd54f', wings: 'feather',
    wingColor: '#ffffff', hairStyle: 'long', extras: ['halo'], fav: 'Angel Food Cake',
    aff: { pet: 1.5, scold: 1, mistake: -2 }, desc: 'Kind and earnest. Only appears for keepers who never slip up.' }),

  // ---------------- Infernal ----------------
  S({ id: 'succubus', fam: 'infernal', names: ['Succubus', 'Dream Weaver', 'Lilith Queen'],
    skin: '#f6cad8', hair: '#7b1fa2', eyes: '#ff4081', outfit: '#311b92', accent: '#ff80ab', wings: 'bat',
    wingColor: '#4a148c', horns: 'curled', tail: 'devil', hairStyle: 'long', fav: 'Dream Macaron',
    aff: { pet: 1.5, snack: 1.5 }, desc: 'A charming dream-demon who feeds on sweet dreams (and sweets).' }),
  S({ id: 'hellhound', fam: 'infernal', names: ['Hellhound', 'Cerberus Guard', 'Cerberus Queen'],
    skin: '#e8c4a8', hair: '#2b2b2b', eyes: '#ff3d00', outfit: '#424242', accent: '#ff6d00',
    ears: 'wolf', tail: 'wolf', hairStyle: 'wild', extras: ['flame', 'fangs'], fav: 'Spicy Jerky',
    aff: { power: 1.5, pet: 1.5 }, desc: 'Guards the gates with a fiery bark and a waggy tail.' }),
  S({ id: 'arachne', fam: 'infernal', names: ['Arachne', 'Silk Weaver', 'Spider Queen'],
    skin: '#ead0f0', hair: '#1a1a2e', eyes: '#e53935', outfit: '#880e4f', accent: '#ffffff', lower: 'spider',
    lowerColor: '#3a1550', hairStyle: 'long', fav: 'Dewdrop Jelly',
    aff: { magic: 1.5, agility: 1 }, desc: 'Weaves the finest silk dresses in any realm.' }),
  S({ id: 'imp', fam: 'infernal', names: ['Imp', 'Devil', 'Archfiend'],
    skin: '#ff8a80', hair: '#4a148c', eyes: '#ffeb3b', outfit: '#212121', accent: '#ff1744', wings: 'bat',
    wingColor: '#b71c1c', horns: 'small', tail: 'devil', hairStyle: 'short', extras: ['fangs'], fav: 'Ghost Pepper',
    aff: { mistake: 1.5, play: 1.5 }, desc: 'A prankster demon. Laughs at her own jokes the loudest.' }),

  // ---------------- Draconic ----------------
  S({ id: 'dragon', fam: 'draconic', names: ['Dragonkin', 'Dragon Knight', 'Dragon Empress'],
    skin: '#ffe0cc', hair: '#c62828', eyes: '#ffb300', outfit: '#ffd54f', accent: '#b71c1c', wings: 'dragon',
    wingColor: '#d32f2f', horns: 'dragon', tail: 'dragon', tailColor: '#d32f2f', pupil: 'slit', hairStyle: 'long',
    extras: ['scales'], fav: 'Golden Apple', outfitStyle: 'armor',
    aff: { power: 1.5, magic: 1.5 }, desc: 'Proud heir to a mountain of gold. Sleeps on her treasure.' }),
  S({ id: 'wyvern', fam: 'draconic', names: ['Wyvern', 'Sky Wyvern', 'Tempest Wyvern'],
    skin: '#e9f2e6', hair: '#00695c', eyes: '#ffeb3b', outfit: '#26a69a', accent: '#b2dfdb', wings: 'dragon',
    wingColor: '#26a69a', horns: 'small', tail: 'dragon', tailColor: '#26a69a', pupil: 'slit', hairStyle: 'wild',
    extras: ['scales'], fav: 'Storm Berry',
    aff: { agility: 2, power: 1 }, desc: 'Rides the storm winds. Very fast, very loud.' }),
  S({ id: 'kobold', fam: 'draconic', names: ['Kobold', 'Kobold Artificer', 'Kobold Chieftess'],
    skin: '#ffd8c2', hair: '#5d4037', eyes: '#ffd54f', outfit: '#795548', accent: '#ff8a65',
    ears: 'fin', horns: 'small', tail: 'dragon', tailColor: '#ff8a65', hairStyle: 'short', extras: ['scales'],
    fav: 'Crystal Candy', outfitStyle: 'tunic',
    aff: { meal: 1.5, scold: 1.5 }, desc: 'A tinkering miner who builds gadgets out of junk.' }),
  S({ id: 'salamander', fam: 'draconic', names: ['Salamander', 'Flame Dancer', 'Inferno Empress'],
    skin: '#ffd5c2', hair: '#ff7043', eyes: '#ffeb3b', outfit: '#bf360c', accent: '#ffca28',
    tail: 'dragon', tailColor: '#ff5722', pupil: 'slit', hairStyle: 'wild', extras: ['flame', 'scales'],
    fav: 'Lava Cake', aff: { play: 1.5, power: 1.5 }, desc: 'A fire lizard who dances in the embers.' }),
];

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

export function speciesHint(sp) {
  return Object.entries(sp.aff)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => AFFINITY_HINTS[k])
    .join(' & ');
}

export const SHOP = [
  { id: 'cake', name: 'Strawberry Cake', icon: '🍰', price: 12, desc: 'Mood +30, Hunger +10' },
  { id: 'fav', name: 'Favorite Food', icon: '💝', price: 20, desc: 'Her favorite dish! Mood +30, Bond +10' },
  { id: 'ball', name: 'Toy Ball', icon: '🧶', price: 15, desc: 'Mood +25 without tiring her out' },
  { id: 'salts', name: 'Bath Salts', icon: '🛁', price: 10, desc: 'Full clean + Mood +10' },
  { id: 'vitamin', name: 'Vitamins', icon: '🧪', price: 18, desc: 'Health +40' },
];

// Counters tracked during a stage and used to pick the next species.
export const COUNTER_KEYS = ['meal', 'snack', 'play', 'pet', 'power', 'magic', 'agility', 'clean', 'scold', 'sleep', 'mistake', 'heal'];
