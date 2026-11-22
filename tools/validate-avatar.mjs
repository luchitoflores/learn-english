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
function assertPng(file,width,height){
 const data=fs.readFileSync(file);
 assert(data.length>500,'Missing PNG '+file);
 assert.equal(data.subarray(1,4).toString('ascii'),'PNG',file);
 assert.equal(data.readUInt32BE(16),width,'Wrong width '+file);
 assert.equal(data.readUInt32BE(20),height,'Wrong height '+file);
 assert.equal(data[25],6,'PNG must have full RGBA alpha: '+file);
}
for(const key of ['front-beard','front-shaved','front-suit'])
 assertPng('public/assets/hero/'+key+'.png',192,256);
assertPng('public/assets/hero/side-walk-clean.png',1536,256);
const factory=new AvatarFactory('./');
const textures=[];
factory.queueTextures({
 scene:{textures:{exists:()=>false}},
 image:(k,url)=>textures.push({k,url}),
 spritesheet:(k,url,opts)=>textures.push({k,url,opts})
});
assert.equal(textures.length,4,'Loader must queue 3 raster portraits and 1 side-walk spritesheet');
assert(textures.some(t=>t.k==='hero-side-walk-clean'&&t.opts?.frameWidth===192&&t.opts?.frameHeight===256));
assert.equal(factory.profileKey({beard:'full',outfit:'casual'}),'hero-front-beard');
assert.equal(factory.profileKey({beard:'none',outfit:'casual'}),'hero-front-shaved');
assert.equal(factory.profileKey({beard:'full',outfit:'formal'}),'hero-front-suit');
assert.equal(factory.characterProfile({beard:'full',outfit:'casual'}).sideSheet,'hero-side-walk-clean');
const lab=fs.readFileSync('public/character-lab/index.html','utf8');
assert(lab.includes('id="hero"'),'Missing image portrait in editor');
assert(!lab.includes('id="char"'),'Obsolete vector figure still active');
for(const id of ['avatar-portrait','station-tools'])assert(fs.readFileSync('index.html','utf8').includes('id="'+id+'"'));
console.log('PASS: full-alpha front poses, 8-frame side walk, shared avatar, 3 rooms, wardrobe and mirror.');
