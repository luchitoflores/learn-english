import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ROOMS } from '../src/data/rooms.js';
import { ACTIONS } from '../src/data/actions.js';
import { AVATAR_DEFAULT, OUTFITS, BEARDS, POSES } from '../src/core/AvatarFactory.js';
assert.equal(AVATAR_DEFAULT.beard,'full');
assert(OUTFITS.includes('formal')&&OUTFITS.includes('casual'));
assert(BEARDS.includes('none'));
assert(POSES.includes('walk1')&&POSES.includes('use'));
const bedroom=ROOMS.bedroom;
for(const station of ['mirror','wardrobe'])assert(bedroom.objects.some(o=>o.id===station),station+' missing');
for(const action of ['shave_face','brush_teeth','put_on_shirt','put_on_suit','take_off_shirt','put_on_pajamas'])
  assert(ACTIONS[action],action+' missing');
const lab=fs.readFileSync('public/character-lab/index.html','utf8');
for(const id of ['char','beard','shirtLayer','suitLayer','eyesOpen','eyesClosed','mouthSmile','mouthShout','mouthSad','legFront','legBack','armWorking']){
  assert(lab.includes('id="'+id+'"'),id+' missing in lab SVG');
}
const main=fs.readFileSync('index.html','utf8');
for(const id of ['avatar-portrait','station-tools'])assert(main.includes('id="'+id+'"'));
console.log('Avatar phases: art source, editor, Phaser integration and stations are configured.');
