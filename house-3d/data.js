export const asset = path => new URL(`../assets/${path}`, document.baseURI).href;

const food = name => `kenney-main/3d/food/${name}.glb`;
const furniture = name => `kenney-main/3d/furniture/${name}.glb`;
const survival = name => `kenney-main/3d/survival/${name}.glb`;
const firstAid = name => `Survival Pack - Sept 2020/OBJ/${name}.obj`;
const item = (id, en, es, model) => ({ id, en, es, model });

export const rooms = {
  kitchen: {
    es: 'Cocina', en: 'Kitchen', color: 0xc0ded0, floor: 0xeedcc6,
    stations: ['fridge', 'drawer'],
    props: [[furniture('kitchenCabinet'), -0.5, -2.6, 1.65]],
  },
  bathroom: {
    es: 'Baño', en: 'Bathroom', color: 0xc8dfed, floor: 0xe7eaee,
    stations: ['medkit'],
    props: [[furniture('bathroomCabinet'), 2.7, -2.4, 1.55]],
  },
  workshop: {
    es: 'Taller', en: 'Workshop', color: 0xe3d3a9, floor: 0xe6d4b9,
    stations: ['toolbox'],
    props: [['kenney-main/3d/survival/workbench.glb', 2.1, -1.6, 2.2]],
  },
};

export const stations = {
  fridge: {
    es: 'Refrigeradora', en: 'Fridge', x: -2.6, z: -2, width: 1.55, height: 2.7,
    depth: 0.95, base: 0, color: 0x88b3ac, shelves: 2,
    items: [
      item('apple', 'apple', 'manzana', food('apple')),
      item('cheese', 'cheese', 'queso', food('cheese')),
      item('bread', 'loaf of bread', 'pan', food('bread')),
      item('carrot', 'carrot', 'zanahoria', food('carrot')),
      item('egg', 'egg', 'huevo', food('egg')),
      item('milk', 'carton of milk', 'cartón de leche', food('carton')),
      item('orange', 'orange', 'naranja', food('orange')),
      item('soda', 'bottle of soda', 'botella de gaseosa', food('soda-bottle')),
      item('ketchup', 'bottle of ketchup', 'botella de kétchup', food('bottle-ketchup')),
    ],
  },
  drawer: {
    es: 'Cajón de cubiertos', en: 'Cutlery drawer', x: 2, z: -1.45,
    width: 1.8, height: 0.54, depth: 1.05, base: 0.78, color: 0xbd865c, drawer: true,
    items: [
      item('spoon', 'spoon', 'cuchara', food('utensil-spoon')),
      item('fork', 'fork', 'tenedor', food('utensil-fork')),
      item('knife', 'knife', 'cuchillo', food('utensil-knife')),
      item('ladle', 'ladle', 'cucharón', food('cooking-spoon')),
    ],
  },
  medkit: {
    es: 'Botiquín', en: 'Medicine cabinet', x: -1.9, z: -2, width: 1.65, height: 1.34,
    depth: 0.62, base: 1.25, color: 0xd98680, shelves: 1,
    items: [
      item('bandage', 'bandage', 'venda', firstAid('Bandages')),
      item('first-aid-pouch', 'first-aid pouch', 'bolsa de primeros auxilios', firstAid('FirstAidKit')),
      item('first-aid-kit', 'first-aid kit', 'estuche de primeros auxilios', firstAid('FirstAidKit_Hard')),
      item('medicine', 'medicine bottle', 'frasco de medicina', survival('bottle')),
      item('antiseptic', 'bottle of antiseptic', 'frasco de antiséptico', survival('bottle-large')),
    ],
  },
  toolbox: {
    es: 'Caja de herramientas', en: 'Toolbox', x: -1.9, z: -1.6, width: 1.8, height: 0.68,
    depth: 1.12, base: 0.68, color: 0xdaac58, lid: true,
    items: [
      item('hammer', 'hammer', 'martillo', survival('tool-hammer')),
      item('hatchet', 'hatchet', 'hacha de mano', survival('tool-axe')),
      item('shovel', 'shovel', 'pala', survival('tool-shovel')),
      item('pickaxe', 'pickaxe', 'pico', survival('tool-pickaxe')),
      item('hoe', 'hoe', 'azada', survival('tool-hoe')),
    ],
  },
};

export const practiceMotions = [
  { en: 'Sit down.', es: 'Siéntate.', pack: 'Simulation', clip: 'Sit_Floor_Down', hold: 'Sit_Floor_Idle' },
  { en: 'Stand up.', es: 'Ponte de pie.', pack: 'Simulation', start: 'Sit_Floor_Idle', clip: 'Sit_Floor_StandUp' },
  { en: 'Lie down.', es: 'Recuéstate.', pack: 'Simulation', clip: 'Lie_Down', hold: 'Lie_Idle' },
  { en: 'Get up.', es: 'Levántate.', pack: 'Simulation', start: 'Lie_Idle', clip: 'Lie_StandUp' },
  { en: 'Crouch down.', es: 'Agáchate.', pack: 'MovementAdvanced', clip: 'Crouching' },
  { en: 'Back up.', es: 'Retrocede.', pack: 'MovementAdvanced', clip: 'Walking_Backwards', distance: -1.35 },
  { en: 'Jump up.', es: 'Salta hacia arriba.', pack: 'MovementBasic', clip: 'Jump_Full_Short' },
];

export function makePhrase(station, entry, isOut) {
  if (isOut) {
    return {
      en: station === 'medkit' || station === 'toolbox'
        ? `Put away the ${entry.en}.`
        : `Put the ${entry.en} back.`,
      es: `Vuelve a guardar ${entry.es}.`,
      clip: 'Interact',
    };
  }
  return {
    en: station === 'toolbox' ? `Pick up the ${entry.en}.` : `Take out the ${entry.en}.`,
    es: `Saca ${entry.es}.`,
    clip: 'PickUp',
  };
}

export function openingPhrase(station) {
  const { en, es } = stations[station];
  return {
    en: `${station === 'drawer' ? 'Pull out' : 'Open up'} the ${en.toLowerCase()}.`,
    es: `${station === 'drawer' ? 'Saca' : 'Abre'} ${station === 'medkit' || station === 'drawer' ? 'el' : 'la'} ${es.toLowerCase()}.`,
  };
}
