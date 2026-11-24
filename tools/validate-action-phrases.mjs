import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ACTION_SENTENCES,PHRASAL_FAMILIES,actionExercise } from '../house-3d/action-phrases.js';
import { animationClips } from '../house-3d/animation-clips.js';

assert(ACTION_SENTENCES.length>=12,'Need an initial collection of Ranger movements with usable phrases');
for(const e of ACTION_SENTENCES){
 assert(animationClips[e.pack]?.includes(e.clip),'Clip '+e.clip+' is not actually available in KayKit '+e.pack);
 for(const tense of ['present','past']){
  const q=actionExercise(e,tense);
  assert(q.phrase.endsWith('.')&&q.spanish.length>5);
  assert(q.motion.clip===e.clip&&q.motion.pack===e.pack);
  assert(q.time.includes(tense==='past'?'AYER':'AHORA'));
 }
}
for(const base of ['GET','PUT','LOOK']){
 const family=PHRASAL_FAMILIES.find(f=>f.base===base);
 assert(family?.words.length>=6,'Missing frequent phrasal expressions from '+base);
}
const html=fs.readFileSync('house-3d/index.html','utf8');
for(const id of ['phrase-lab','phrase-choices','phrase-next','phrase-grammar-note','phrase-view']){
 assert(html.includes('id="'+id+'"'),'Missing actionable 3D phrase control '+id);
}
const root=fs.readFileSync('index.html','utf8');
for(const label of ['home-menu','start-classic','house-3d/#animaciones','house-3d/#frases','house-lab/','character-lab/']){
 assert(root.includes(label),'Home menu missing '+label);
}
const main=fs.readFileSync('src/main.js','utf8');
assert(main.includes("window.startWordQuestClassic=startClassic"),'The classic game must start lazily from the menu');
const vite=fs.readFileSync('vite.config.js','utf8');
assert(vite.includes("house-3d/index.html"),'3D HTML must be included as a Vite build entry');
console.log('PASS Word Quest home navigation and',ACTION_SENTENCES.length,'Ranger movements with grammatical sentences');


// The listening catalog must reference real available clips and distinct English tasks.
const { LISTENING_ACTIONS } = await import('../house-3d/listening.js');
assert(LISTENING_ACTIONS.length>=12);
assert.equal(new Set(LISTENING_ACTIONS.map(a=>a.id)).size,LISTENING_ACTIONS.length);
for(const a of LISTENING_ACTIONS){
 assert(animationClips[a.motion.pack]?.includes(a.motion.clip),'Missing listening clip '+a.id);
 for(const clip of [a.motion.start,a.motion.hold].filter(Boolean)) assert(animationClips[a.motion.pack].includes(clip),'Missing pose '+clip);
 assert(a.command&&a.description&&a.translation&&a.icon);
}
assert.equal(LISTENING_ACTIONS.filter(a=>a.social).length,2);
for(const id of ['listening-lab','listening-view','listening-play','listening-slow','listening-hint','listening-choices','listening-next']) assert(html.includes('id="'+id+'"'),'Missing listening control '+id);
