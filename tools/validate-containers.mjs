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
assert(CONTAINERS.fridge.items.some(i=>i.id==='eggs'));
assert(CONTAINERS.toolbox.items.some(i=>i.id==='hammer'));
console.log('PASS:',ids.size,'data-driven room containers and illustrated inventory items');
