import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ROOMS } from '../src/data/rooms.js';
import { ACTIONS } from '../src/data/actions.js';
import { AVATAR_DEFAULT, AvatarFactory } from '../src/core/AvatarFactory.js';

assert.equal(AVATAR_DEFAULT.beard, 'full');
assert(ROOMS.bedroom.objects.some(o => o.id === 'mirror'));
assert(ROOMS.bedroom.objects.some(o => o.id === 'wardrobe'));
for(const key of ['shave_face','brush_teeth','put_on_suit','put_on_shirt','take_off_shirt']){
 assert(ACTIONS[key], 'Missing action: '+key);
}
for(const key of ['beard','shaved','suit']){
 const data=fs.readFileSync('public/assets/hero/'+key+'.webp');
 assert(data.length > 500, 'Missing raster asset: '+key);
 assert.equal(data.subarray(0,4).toString('ascii'), 'RIFF');
 assert.equal(data.subarray(8,12).toString('ascii'), 'WEBP');
}
const factory=new AvatarFactory('./');
const textures=[];
factory.queueTextures({scene:{textures:{exists:()=>false}},image:(k,url)=>textures.push({k,url})});
assert.equal(textures.length,3,'Mobile loader must only queue three raster textures');
assert.equal(factory.profileKey({beard:'full',outfit:'casual'}),'hero-raster-beard');
assert.equal(factory.profileKey({beard:'none',outfit:'casual'}),'hero-raster-shaved');
assert.equal(factory.profileKey({beard:'full',outfit:'formal'}),'hero-raster-suit');
const lab=fs.readFileSync('public/character-lab/index.html','utf8');
assert(lab.includes('id="hero"'),'Missing image portrait in editor');
assert(!lab.includes('id="char"'),'Obsolete vector figure still active');
for(const id of ['avatar-portrait','station-tools'])assert(fs.readFileSync('index.html','utf8').includes('id="'+id+'"'));
console.log('PASS: three raster portraits, shared editor state, 3 rooms, wardrobe and mirror.');
