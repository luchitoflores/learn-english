// Data-driven animation manifest. All assets in the initial profile are original project PNGs.
// Swap profiles, spritesheets, or facial layers without touching the English vocabulary.
export const CHARACTER_PROFILE = {
  id: 'wordquest-hero',
  name: 'Word Quest Hero',
  size: { width: 126, height: 160 },
  anchor: { x: 0.5, y: 1 },
  defaultPose: 'idle',
  imagePrefix: 'hero-',
  poses: {
    idle: 'idle', walkA: 'walk1', walkB: 'walk2',
    crouch: 'crouch', reach: 'reach', grab: 'grab',
    sit: 'sit', hold: 'hold', use: 'use'
  },
  movement: { walkFrameRate: 7, walkSpeed: 0.31 },
  // Optional attachment slots. Add separate PNGs, exact offsets, and anchors to
  // turn on independent face/hair/clothes/hand layers without changing the engine.
  slots: {
    eyes: null, eyebrows: null, mouth: null, hair: null,
    clothing: null, leftHand: null, rightHand: null
  }
};

// Actions remain separate from animations: many verbs share the same recipe.
// Each recipe is a collection of keyframes and timing weights, not a bespoke sprite.
export const ANIMATION_RECIPES = {
  pickup: [{pose:'crouch', weight:0.32},{pose:'reach',weight:0.28},{pose:'grab',weight:0.24},{pose:'hold',weight:0.16}],
  place: [{pose:'hold',weight:0.20},{pose:'reach',weight:0.48},{pose:'idle',weight:0.32}],
  switch: [{pose:'reach',weight:0.35},{pose:'use',weight:0.45},{pose:'idle',weight:0.20}],
  open: [{pose:'reach',weight:0.40},{pose:'use',weight:0.40},{pose:'idle',weight:0.20}],
  dress: [{pose:'hold',weight:0.35},{pose:'use',weight:0.45},{pose:'idle',weight:0.20}],
  sit: [{pose:'sit',weight:0.75},{pose:'idle',weight:0.25}],
  look: [{pose:'use',weight:0.65},{pose:'idle',weight:0.35}],
  clean: [{pose:'crouch',weight:0.25},{pose:'use',weight:0.50},{pose:'idle',weight:0.25}],
  eat: [{pose:'hold',weight:0.35},{pose:'use',weight:0.45},{pose:'idle',weight:0.20}],
  walk: [{pose:'walkA',weight:0.50},{pose:'walkB',weight:0.50}]
};

// Facial animation data is ready for layered PNG assets (not fake face motion).
// The default protagonist has flattened full-body images, so this is metadata
// until transparent face components have been drawn and assigned to slots.
export const FACIAL_PRESETS = {
  neutral:{eyes:'open',mouth:'rest',eyebrows:'neutral'},
  blink:{eyes:'closed',mouth:'rest',eyebrows:'neutral'},
  shout:{eyes:'open',mouth:'wide',eyebrows:'raised'},
  cry:{eyes:'squint',mouth:'sad',eyebrows:'sad',effect:'tears'},
  smile:{eyes:'open',mouth:'smile',eyebrows:'soft'},
  brush_teeth:{eyes:'open',mouth:'open',eyebrows:'neutral',prop:'toothbrush'},
  shave:{eyes:'open',mouth:'rest',eyebrows:'focused',prop:'razor'},
  makeup:{eyes:'open',mouth:'rest',eyebrows:'focused',prop:'brush'},
  cut_nails:{eyes:'focused',mouth:'rest',eyebrows:'focused',prop:'nail_clip'}
};
