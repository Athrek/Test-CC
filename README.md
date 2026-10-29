# MythPals — Monster Girl V-Pet

A Tamagotchi / Digimon-style virtual pet where you hatch, raise and evolve fantasy monster girls:
goblins, orcs, elves, minotaurs, ghosts, beastkin of all kinds, succubi, gorgons, lamias, sirens, harpies, dragons and more.
Sprites and CGs come from two sources: hand-made art registered in `www/art/`, and procedural generators that cover every
creature without hand-made art yet. The Goblin line has hand-made sprites; see [docs/ART_GUIDE.md](docs/ART_GUIDE.md) for adding more. The game runs offline in any modern browser and is built for phones.

## Playing on Android

There are three ways to play:

1. **Install the APK.** Every push that touches the game runs the **Build Android APK** GitHub Action.
   Open the run under the repo's *Actions* tab, download the `MythPals-debug-apk` artifact, unzip it and
   install `app-debug.apk` on your phone. You'll need to allow installing from unknown sources.
2. **Install it as a web app (PWA).** Host the `www/` folder on any static host, for example GitHub Pages
   with the folder set to `www`. Open it in Chrome on Android and choose *Add to Home screen*. It then runs
   full-screen and works offline.
3. **Try it on a computer.** Run `npm run serve` (or any static file server pointed at `www/`) and open
   `http://localhost:8080`.

Building the APK yourself:

```bash
npm install
npx cap add android      # first time only
npx cap sync android
npx cap open android     # build and run from Android Studio
```

## How it plays

| Action | What it does |
| --- | --- |
| 🍙 **Feed** | Meals fill hunger. Snacks lift her mood, but too many make her sick and heavy. Shop items include cake and her **favorite food**. |
| 🎾 **Play** | Mini-games: *Which Way?* and *Treat Catch* (both earn coins), or a toy ball. |
| 💗 **Pet** | Tap her or press Pet to raise **bond** and mood. |
| 🧽 **Clean** | Clears the messes she leaves. Tap a mess to clean it directly. Bubble baths do a full clean. |
| 💊 **Heal** | Medicine cures sickness. Vitamins restore health. |
| 💡 **Lights** | Turn the lights off when she sleeps. Sleeping with the lights on is a care mistake. |
| ⚔️ **Train** | Timing mini-games raise **Power / Magic / Agility**. *Spar Battles* against wild monsters earn coins. |
| ❗ **Scold** | She sometimes throws tantrums for no reason. Scolding her then builds **discipline**; scolding her when she's done nothing wrong hurts her feelings. |

Ignoring a need (hunger, mood, a messy room, sickness, lights) for too long counts as a **care mistake**.

### Growth and evolution

`Egg → Wisp → Spark → Bloom → Legend`

- **8 egg families:** Beastkin, Wildfolk, Sylvan, Spirit, Tidal, Skyborn, Infernal and Draconic.
- **37 species.** During the Wisp stage, the care you give most often (meals, snacks, play, affection,
  each training type, discipline, rest, even neglect) decides which species of her family she becomes.
  The in-game **Codex** gives a hint for each species. For example, a Beastkin wisp who gets lots of Magic
  training becomes a Kitsune, and an Angel only appears for keepers who make no mistakes.
- **Variants.** At Bloom and Legend, great care (few mistakes, high bond) gives a **Radiant** form and
  neglect gives a **Dusk** form. Each form has its own palette and CG.
- Each new stage reaches the **Album** and unlocks an anime-style CG. That's 7 CGs per species plus 8 Wisp CGs.
- Legend pets can be **sent on a journey**. They join the Hall of Legends and you get a new egg.

### Settings

- **Growth speed:** how fast she evolves. The options run from *Patient* (real time, about 2½ days to Legend)
  to *Whirlwind* (180×, about 20 minutes).
- **Needs speed:** how fast she gets hungry, bored, tired and messy, from *Chill* (1×) to *Busy* (10×).
  The two are independent, so a pet can reach Legend quickly without needing care every few minutes.
  Both can be set when you pick an egg and changed any time without losing her progress.
- **Gentle mode** (on by default): your pet never runs away, and her needs drop at half speed while the app is closed.
- **Preview all CGs:** shows every species and CG in the Album, for browsing the art.
- Sound effects and vibration on alerts.

Progress is saved on the device in `localStorage`. Time keeps passing while the app is closed, up to a week of catch-up.

## Project layout

```
www/                 the game (static files, no build step)
  index.html, css/style.css, manifest.webmanifest, sw.js, icons/
  js/data.js         species, families, shop, stage timings
  js/game.js         simulation: ticking, care mistakes, evolution, actions, saves
  js/pixel.js        tiny pixel-buffer renderer
  js/sprites.js      procedural pixel sprites (all species, stages, variants, poses) and rooms
  js/cg.js           procedural layered-SVG anime CG portraits
  js/minigames.js    Which Way?, Treat Catch, training meter, spar battles
  js/main.js         UI, room animation loop, menus, album, evolution cutscenes
  js/audio.js        WebAudio chiptune sound effects
  art/registry.js    hand-made art registry (sprites + image CGs); see docs/ART_GUIDE.md
  art/sprites/       hand-made pixel sprites, one file per creature line
  art/cg/            image CGs
tools/               dev pages: sprite sheet, CG browser, hand-sprite preview, icon generator (serve from the repo root)
capacitor.config.json, package.json   native Android packaging
.github/workflows/android.yml         CI build of the debug APK
```

### Adding a creature

Add an entry to `SPECIES` in `www/js/data.js`. Choose its family, its three stage names, its colors and features
(ears, horns, wings, tail, lower body, hair style, extras) and the care affinities that lead to it. The sprite,
the CGs, the Codex entry and the gallery slots are all generated from that one definition. To preview the new
creature, serve the repo root and open `tools/sprites.html` or `tools/cg.html?ids=<id>&st=2,3,4&v=normal,radiant,shadow`.
