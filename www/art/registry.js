// Hand-made art. Anything not listed here falls back to the procedural generators in js/sprites.js and js/cg.js.
//
// SPRITES[speciesId][stage] -> sprite definition (stage 2 = Spark, 3 = Bloom, 4 = Legend).
//   See art/sprites/goblin.js for the format.
//
// CG_IMAGES[speciesId][key] -> image path, where key is the stage number ('2', '3', '4') or a
//   stage+variant ('4-radiant', '4-shadow') for a variant-specific picture. When a variant has no picture of
//   its own, the stage picture is shown with a Radiant glow or a Dusk tint applied on top.
//   Example: goblin: { 4: 'art/cg/goblin-legend.webp' }
import goblin from './sprites/goblin.js';

export const SPRITES = {
  goblin,
};

export const CG_IMAGES = {
};
