import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GROUPS, totalObjects } from '../public/house-lab/data.js';

assert.equal(GROUPS.length,16,'House lab must have 16 household containers');
assert(totalObjects>=280,'Catalog should contain practical household vocabulary');
assert(GROUPS.some(g=>g.id==='first-aid'&&g.items.some(i=>i.en==='gauze')),
 'First-aid kit must include unfamiliar vocabulary');
assert(GROUPS.some(g=>g.id==='cutlery'&&g.items.some(i=>i.en==='whisk')),
 'Cutlery drawer should teach whisk');
assert(GROUPS.some(g=>g.id==='cleaning'&&g.items.some(i=>i.en==='squeegee')));
assert(GROUPS.find(g=>g.id==='fridge').items.length===41);
const atlasItems=GROUPS.find(g=>g.id==='fridge').items.filter(i=>Number.isInteger(i.spriteIndex));
assert.equal(atlasItems.length,35,'All 35 original produce sprites must be present');
for(const g of GROUPS){
  assert(g.id&&g.es&&g.en&&g.area&&g.emoji);
  assert(g.items.length>=10,g.id+' requires a useful vocabulary set');
  assert.equal(new Set(g.items.map(i=>i.en)).size,g.items.length,g.id+' duplicates English labels');
  for(const item of g.items){
    assert(item.en&&item.es&&item.emoji,'Missing translation or emoji: '+g.id);
    if(item.image)assert(fs.existsSync('public/assets/'+item.image),'Missing artwork: '+item.image);
    if(item.spriteIndex!==undefined)assert(item.spriteIndex>=0&&item.spriteIndex<35);
  }
}
const html=fs.readFileSync('public/house-lab/index.html','utf8');
for(const id of ['container-board','vocab-grid','mode-tabs','dictation-form','dictation-input','feedback-en','feedback-es','mark-learning','mark-known','listen-button']){
  assert(html.includes('id="'+id+'"'),'Missing house lab control: '+id);
}
for(const name of ['explore','listen','find','sentences','dictation','review']){
  assert(html.includes('data-mode="'+name+'"'),'Missing functional learning mode '+name);
}
const app=fs.readFileSync('public/house-lab/app.js','utf8');
assert(app.includes('speechSynthesis'),'Browser voice synthesis required');
assert(app.includes('localStorage'),'Adaptive progress must persist locally');
assert(fs.readFileSync('index.html','utf8').includes('href="./house-lab/"'),'Classic game must link to new lab');
console.log('PASS house lab:',GROUPS.length,'containers,',totalObjects,'household objects, six practice modes');
