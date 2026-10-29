# Art guide: bringing in CGs (NovelAI or otherwise)

The game can show hand-made art for any creature. Anything without hand-made art keeps using the procedural
sprites and CGs, so art can arrive one creature at a time.

## What to send for each creature line

| Stage | Picture | Why |
| --- | --- | --- |
| **Legend** (final form) | **Required** | The CG players unlock at the end, and the main reference for her sprites. |
| **Bloom** (middle form) | Recommended | Without it, the Bloom stage keeps the procedural CG, and the mix of styles is noticeable. |
| **Spark** (first form) | Recommended | Same reason. |
| Radiant / Dusk versions | Optional | When these are missing, the stage picture gets an automatic golden glow (Radiant) or purple shadow tint (Dusk). |

To keep a line consistent, reuse the same character tags (hair, eyes, skin, ears, horns, tail and so on) for all
three stages and change only the outfit and pose. A natural progression is:
- **Spark:** simple, everyday clothes.
- **Bloom:** an adventurer outfit or armor with signature gear.
- **Legend:** regal, with a crown, cape or fully grown features (for example, nine tails for the Kitsune).

Every form is an adult. Spark should read as a young adult with a simpler outfit, never as a child. Keep the
art SFW, since the game is meant to be shareable.

## Image specs

- **Portrait orientation.** NovelAI's 832×1216 portrait size is ideal. The game frames CGs at 5:7 and crops
  evenly, so keep her centered with her head in the top third.
- **Leave room at the bottom** (roughly the lowest 12%). The nameplate sits there.
- **Full body or thighs-up framing helps a lot with sprites.** It shows the outfit, legs, tail, snake or fish
  half, wings and props. A bust-only shot means the lower half of the sprite has to be invented.
- **Use a simple background.** A soft color or a light scene suits the game's look.
- PNG or WebP. When the art is added, each file is converted to WebP (about 150–250 KB) to keep the app small.

## Naming

Use the creature's id followed by the stage, for example `goblin-legend.png`, `goblin-bloom.png` and
`goblin-spark.png`. For variants, add the variant name: `goblin-legend-radiant.png` or `goblin-legend-dusk.png`.

| Family | ids (Legend name) |
| --- | --- |
| Beastkin | cat (Bastet Queen), dog (Sirius Paladin), fox (Nine-Tails), wolf (Fenrir Alpha), bunny (Lunar Empress), squirrel (Ratatoskr) |
| Wildfolk | goblin (Goblin Matriarch), orc (Orc Warchief), minotaur (Labyrinth Queen), oni (Great Oni) |
| Sylvan | elf (High Elf Queen), darkelf (Drow Matron), dryad (Verdant Empress), fairy (Titania), centaur (Sagittaria) |
| Spirit | ghost (Phantom Queen), vampire (Vampire Progenitor), yukionna (Winter Sovereign), mummy (Pharaoh Queen) |
| Tidal | siren (Abyssal Diva), lamia (Naga Empress), gorgon (Medusa), slime (Slime Empress), scylla (Kraken Queen) |
| Skyborn | harpy (Roc Queen), phoenix (Eternal Phoenix), bee (Hive Queen), moth (Nightlight Monarch), angel (Seraph) |
| Infernal | succubus (Lilith Queen), hellhound (Cerberus Queen), arachne (Spider Queen), imp (Archfiend) |
| Draconic | dragon (Dragon Empress), wyvern (Tempest Wyvern), kobold (Kobold Chieftess), salamander (Inferno Empress) |

Put the originals in an `art-src/` folder in the repo, or attach them in chat.

## What happens to the images

1. Each image is cropped and converted into `www/art/cg/` and registered in `www/art/registry.js`
   (`CG_IMAGES`). From then on the Album, Status screen and evolution scene use it.
2. Her **Legend sprite** is hand-drawn as pixel art, using the CG as reference for her silhouette, palette,
   hair, outfit and props. Her **Bloom** and **Spark** sprites follow from it with the same face and features,
   simpler outfits and a smaller size. Each sprite is stored as editable pixel rows in `www/art/sprites/<id>.js`.
   The Goblin line (`www/art/sprites/goblin.js`) is the finished example.
3. Expressions (blink, happy, sad, angry, open mouth, frown), the idle breathing frame and the Radiant/Dusk
   recolors are generated from that single drawing per stage.

Preview a line's sprites by serving the repo root (`python3 -m http.server`) and opening
`tools/art.html?id=goblin&v=normal,radiant,shadow`.

Working one family at a time (4–6 creatures per batch) keeps reviews manageable.
