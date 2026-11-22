import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ROOMS } from '../src/data/rooms.js';
const keys=['lamp','book','backpack','jacket','shoes','phone','pillow','cup','apple','kettle','plate','spoon','towel','remote','plant','keys','trash','picture','ball','mirror'];
for(const key of keys){
 const path='public/assets/objects/'+key+'.webp';
 const data=fs.readFileSync(path);
 assert(data.length>500,key+' empty');
 assert.equal(data.subarray(0,4).toString('ascii'),'RIFF',key+' RIFF missing');
 assert.equal(data.subarray(8,12).toString('ascii'),'WEBP',key+' format missing');
}
assert.equal(ROOMS.bedroom.objects.find(o=>o.id==='mirror').kind,'mirror');
assert.equal(ROOMS.bedroom.objects.find(o=>o.id==='mirror').passive,false);
console.log('PASS: 20 3D-styled object sprites are present and the mirror is interactive.');
