import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CONTAINERS,roomContainers,makeContainerTask } from '../src/data/containers.js';
import { ROOMS } from '../src/data/rooms.js';
const ids=new Set();
for(const [id,c] of Object.entries(CONTAINERS)){
 assert(!ids.has(id));ids.add(id);
 assert(ROOMS[c.room],id+' missing room');
 assert(ROOMS[c.room].objects.some(o=>o.id===id),id+' missing scene object');
 assert(c.items.length>=6,id+' too few items');
 const unique=new Set();
 for(const item of c.items){
  assert(!unique.has(item.id),id+' duplicate item '+item.id);unique.add(item.id);
  assert(item.en&&item.es&&item.image);
  const path='public/assets/'+item.image;
  assert(fs.existsSync(path),'Missing inventory image '+path);
 }
 const sample=c.items[0];
 const forward=makeContainerTask(c,sample,true);
 const back=makeContainerTask(c,sample,false);
 assert(forward.english.includes(sample.en));
 assert(back.english.includes(sample.en));
 assert(forward.english!==back.english);
 assert(roomContainers(c.room).some(x=>x.id===id));
}
// User-provided 48×48 fruit/vegetable atlas: 35 frames, no duplicate IDs.
const fridge=CONTAINERS.fridge;
const iconItems=fridge.items.filter(i=>Number.isInteger(i.spriteIndex));
assert.equal(iconItems.length,35,'All 35 user-supplied sprites must be available');
assert.equal(fridge.items.length,41,'35 produce + 6 existing groceries');
assert.equal(new Set(fridge.items.map(i=>i.id)).size,41);
assert.equal(iconItems.filter(i=>i.category==='fruit').length,17);
assert.equal(iconItems.filter(i=>i.category==='vegetable').length,18);
const frames=new Set(iconItems.map(i=>i.spriteIndex));
assert.equal(frames.size,35);
assert([...frames].every(i=>i>=0&&i<35));
const png=fs.readFileSync('public/assets/inventory/fruits-veggies-atlas.png');
assert.equal(png.subarray(1,4).toString('ascii'),'PNG');
assert.equal(png.readUInt32BE(16),336);
assert.equal(png.readUInt32BE(20),240);
assert(CONTAINERS.fridge.items.some(i=>i.id==='eggs'));
assert(CONTAINERS.toolbox.items.some(i=>i.id==='hammer'));
console.log('PASS:',ids.size,'data-driven room containers and illustrated inventory items');
