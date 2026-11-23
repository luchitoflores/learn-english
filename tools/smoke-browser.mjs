import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';

let browser;
const artifacts='smoke-artifacts';
fs.mkdirSync(artifacts,{recursive:true});
try {
  let executablePath;
  for (const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']) {
    try { executablePath=execFileSync('which',[name],{encoding:'utf8'}).trim(); break; }catch{}
  }
  assert(executablePath,'No Chromium/Chrome executable on runner');
  browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('requestfailed',r=>{if(r.url().includes('127.0.0.1'))errors.push(r.url()+': '+r.failure()?.errorText)});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:25000});
  await page.waitForFunction(()=>Boolean(window.wordQuest?.scene?.hero?.active && window.wordQuest?.scene?.backgroundArt?.active),null,{timeout:30000});
  await page.waitForTimeout(650);
  const state=await page.evaluate(()=>({
    room:window.wordQuest.roomId,
    hero:window.wordQuest.scene.hero.texture.key,
    background:window.wordQuest.scene.backgroundArt.texture.key,
    width:document.querySelector('#game canvas')?.width,
    height:document.querySelector('#game canvas')?.height
  }));
  assert(state.width>200&&state.height>150,'Canvas missing or too small: '+JSON.stringify(state));
  assert.equal(state.background,'room-'+state.room);
  assert.equal(state.hero,'hero-front-beard','Idle character must face forward');
  // Exercise the actual frame-based sideways walk, not a sliding still image.
  await page.evaluate(()=>{window.wordQuest.movement=1});
  await page.waitForTimeout(250);
  const walking=await page.evaluate(()=>({
    key:window.wordQuest.scene.hero.anims.currentAnim?.key,
    playing:window.wordQuest.scene.hero.anims.isPlaying,
    texture:window.wordQuest.scene.hero.texture.key
  }));
  await page.evaluate(()=>{window.wordQuest.movement=0});
  assert(walking.playing&&walking.key?.includes('walk'),'Side walk animation failed: '+JSON.stringify(walking));
  assert.equal(walking.texture,'hero-side-walk-clean','Walking must show the lateral frames');
  await page.waitForFunction(()=>window.wordQuest?.scene?.hero?.texture?.key==='hero-front-beard',null,{timeout:5000});
  const pose=await page.evaluate(()=>{
    const scene=window.wordQuest.scene;
    scene.character.turn(true);
    scene.character.setPose('use');
    const action={key:scene.hero.texture.key,frame:scene.hero.frame.name,flip:scene.hero.flipX};
    scene.character.rest();
    return {action,returned:scene.hero.texture.key,frontFlip:scene.hero.flipX};
  });
  assert.equal(pose.action.key,'hero-side-walk-clean','Interaction must show the lateral pose');
  assert.equal(pose.action.frame,7,'Reach frame is missing');
  assert.equal(pose.returned,'hero-front-beard','Character did not return to front after interaction');
  assert.equal(pose.frontFlip,false,'Front view must not be flipped');
  const shot=await page.locator('#game canvas').screenshot({path:artifacts+'/bedroom-mobile.png'});
  const png=PNG.sync.read(shot);
  const distinct=new Set();
  for(let y=0;y<png.height;y+=7){for(let x=0;x<png.width;x+=7){
    const i=(png.width*y+x)*4;
    distinct.add((png.data[i]>>4)+','+(png.data[i+1]>>4)+','+(png.data[i+2]>>4));
  }}
  assert(distinct.size>30,'Canvas appears blank / uniform (distinct colors: '+distinct.size+')');
  const button=page.locator('#room-exits button').first();
  assert(await button.isVisible(),'Mobile door button is missing');
  await button.click({timeout:10000});
  await page.waitForFunction(()=>window.wordQuest?.roomId==='living' && window.wordQuest?.scene?.roomId==='living',null,{timeout:10000});
  const next=await page.evaluate(()=>({background:window.wordQuest.scene.backgroundArt.texture.key,objects:window.wordQuest.scene.objects.size}));
  assert.equal(next.background,'room-living','Room background did not change');
  assert(next.objects>0,'Room objects did not repopulate');
  await page.locator('#game canvas').screenshot({path:artifacts+'/living-mobile.png'});
  const toolbox=page.locator('#container-shortcuts button',{hasText:'Toolbox'});
  assert(await toolbox.isVisible(),'Toolbox shortcut missing');
  await toolbox.click();
  await page.waitForFunction(()=>window.wordQuest?.containers?.current?.id==='toolbox',null,{timeout:15000});
  assert.equal(await page.locator('#inventory-items button').count(),8,'Toolbox slots missing');
  await page.locator('#inventory-items button[data-item-id="hammer"]').click();
  assert((await page.locator('#study-english').textContent()).includes('hammer'),'Discovery not recorded');
  await page.locator('#inventory-layer').screenshot({path:artifacts+'/toolbox-mobile.png'});
  await page.locator('#inventory-close').click();
  assert(await page.locator('#inventory-layer').evaluate(el=>el.classList.contains('hidden')),'Close failed');
  // Fridge now contains all 35 uploaded fruit and vegetable sprites.
  await page.evaluate(()=>window.wordQuest.switchRoom('kitchen'));
  await page.waitForFunction(()=>window.wordQuest?.roomId==='kitchen');
  await page.locator('#container-shortcuts button',{hasText:'Fridge'}).click();
  await page.waitForFunction(()=>window.wordQuest?.containers?.current?.id==='fridge',null,{timeout:15000});
  assert.equal(await page.locator('#inventory-items button').count(),6,'Fridge grid must display six mobile choices');
  assert.equal(await page.locator('#inventory-filters button').count(),4,'Fridge category tabs missing');
  await page.locator('#inventory-filters button',{hasText:'Frutas'}).click();
  assert.equal(await page.locator('#inventory-items button').count(),6,'Fruit grid page size incorrect');
  assert(await page.locator('#inventory-items button[data-item-id="banana"] .inventory-pixel-sprite').count(),
    'Banana 48px original sprite not visible');
  await page.locator('#inventory-items button[data-item-id="banana"]').click();
  assert((await page.locator('#study-english').textContent()).includes('banana'),'Banana discovery failed');
  assert(await page.locator('#inventory-tray-items button[data-item-id="banana"]').isVisible(),
    'Banana did not move into My tray');
  assert((await page.locator('#inventory-feedback-en').textContent()).includes('Put the banana'),
    'The English placement phrase must appear in the green feedback');
  const discoveryDestination=await page.evaluate(()=>window.wordQuest.containers.fridge.target.id);
  await page.locator('#inventory-place-targets button[data-destination="'+discoveryDestination+'"]').click();
  assert.equal(await page.evaluate(()=>window.wordQuest.containers.fridge.location('banana')),
    discoveryDestination,'Banana not placed into the selected destination');
  assert((await page.locator('#inventory-feedback-en').textContent()).startsWith('Put the banana'),
    'Placement feedback did not preserve the English sentence');
  await page.locator('#inventory-next-page').click();
  assert((await page.locator('#inventory-page').textContent()).includes('2 de 3'),'Fruit pagination failed');
  await page.locator('#inventory-filters button',{hasText:'Verduras'}).click();
  assert(await page.locator('#inventory-items button[data-item-id="carrot"]').isVisible(),'Carrot sprite missing');
  assert(await page.locator('#inventory-tray-section').isVisible(),'Fridge tray section missing');
  assert(await page.locator('#inventory-place-section').isVisible(),'Fridge placement area missing');
  await page.locator('#inventory-layer').screenshot({path:artifacts+'/fridge-mobile.png'});
  await page.locator('#inventory-close').click();
  await page.evaluate(()=>window.wordQuest.modeEngine.setMode('orders'));
  await page.locator('#container-shortcuts button',{hasText:'Fridge'}).click();
  await page.waitForFunction(()=>window.wordQuest?.containers?.task?.itemId);
  const target=await page.evaluate(()=>window.wordQuest.containers.task.itemId);
  assert.equal(await page.locator('#inventory-items button').count(),8,'Fridge mission needs eight visible choices');
  assert((await page.locator('#inventory-feedback-en').textContent()).includes('Take out the '),
    'English instruction must remain readable');
  await page.locator('#inventory-items button[data-item-id="'+target+'"]').click();
  assert.equal(await page.evaluate(()=>window.wordQuest.containers.fridge.phase),'place',
    'Taking out the grocery must lead to the place stage');
  assert(await page.locator('#inventory-tray-items button[data-item-id="'+target+'"]').isVisible(),
    'Taken-out grocery must appear in My tray');
  const destination=await page.evaluate(()=>window.wordQuest.containers.fridge.target.id);
  const phrase=await page.locator('#inventory-feedback-en').textContent();
  assert(phrase.startsWith('Put the '),'English destination instruction is missing');
  assert((await page.locator('#inventory-feedback-es').textContent()).length>8,'Spanish translation missing');
  const wrong=await page.evaluate(id=>[...document.querySelectorAll('#inventory-place-targets button')]
    .find(b=>b.dataset.destination!==id)?.dataset.destination,destination);
  if(wrong){
    await page.locator('#inventory-place-targets button[data-destination="'+wrong+'"]').click();
    assert.equal(await page.evaluate(()=>window.wordQuest.containers.fridge.phase),'place',
      'Incorrect destination must not complete the mission');
  }
  await page.locator('#inventory-place-targets button[data-destination="'+destination+'"]').click();
  assert.equal(await page.evaluate(()=>window.wordQuest.containers.fridge.phase),'complete',
    'Correct destination must complete the mission');
  assert.equal(await page.evaluate(id=>window.wordQuest.containers.fridge.location(id),target),
    destination,'Destination state was not saved');
  assert(await page.locator('#inventory-feedback-replay').isEnabled(),'Feedback replay is unavailable');
  await page.locator('#inventory-layer').screenshot({path:artifacts+'/fridge-orders-mobile.png'});
  await page.locator('#inventory-close').click();
  // Independent house vocabulary workshop: live on Pages, all controls work on Android.
  await page.goto('http://127.0.0.1:4173/house-lab/',{waitUntil:'domcontentloaded',timeout:25000});
  await page.waitForFunction(()=>window.houseLab?.groups===16,{timeout:15000});
  assert.equal(await page.locator('#container-board button').count(),16,'House catalog card count');
  assert((await page.locator('#stat-words').textContent()).includes('298'),'House vocabulary count missing');
  const medkit=page.locator('#container-board button[data-group="first-aid"]');
  assert(await medkit.isVisible(),'First aid kit not selectable');
  await medkit.click();
  await page.waitForFunction(()=>window.houseLab?.group==='first-aid',{timeout:5000});
  assert(await page.locator('#vocab-grid button').count()===12,'Mobile exploration must paginate twelve items');
  const first=page.locator('#vocab-grid button').first();
  await first.click();
  assert((await page.locator('#feedback-en').textContent()).length>2,'Discovery must reveal English vocabulary');
  assert(await page.locator('#mark-learning').isEnabled(),'Unknown-word training mark missing');
  await page.locator('#mark-learning').click();
  await page.locator('#mode-tabs [data-mode="listen"]').click();
  const listening=await page.evaluate(()=>window.houseLab.task);
  assert(listening,'Listening mission not generated');
  assert(await page.locator('#vocab-grid button').count()===6,'Listening requires six picture choices');
  await page.locator('#vocab-grid button[data-word="'+listening+'"]').click();
  assert.equal(await page.evaluate(()=>window.houseLab.solved),true,'Listening correct image rejected');
  assert((await page.locator('#feedback-en').textContent()).includes(listening),'Listening feedback failed to reveal target');
  await page.locator('#mode-tabs [data-mode="dictation"]').click();
  const dictated=await page.evaluate(()=>window.houseLab.task);
  assert(await page.locator('#dictation-area').isVisible(),'Dictation input missing');
  await page.locator('#dictation-input').fill(dictated);
  await page.locator('#dictation-form button').click();
  assert.equal(await page.evaluate(()=>window.houseLab.solved),true,'Dictation answer not accepted');
  await page.locator('#mode-tabs [data-mode="sentences"]').click();
  const sentenceTarget=await page.evaluate(()=>window.houseLab.task);
  assert(await page.locator('#mission-prompt').textContent(),'English sentence missing');
  await page.locator('#vocab-grid button[data-word="'+sentenceTarget+'"]').click();
  assert.equal(await page.evaluate(()=>window.houseLab.solved),true,'Sentence click failed');
  await page.locator('#go-board').click();
  await page.locator('#container-board button[data-group="fridge"]').click();
  assert.equal(await page.evaluate(()=>window.houseLab.group),'fridge');
  await page.locator('#page-next').click();
  assert(await page.locator('#vocab-grid .vocab-art.atlas').count()>0,'Original fruit sprite atlas not displayed');
  await page.locator('#lab-screen').screenshot({path:artifacts+'/house-lab-mobile.png'});
  await page.locator('#go-board').click();
  await page.locator('#container-board button[data-group="cutlery"]').click();
  await page.locator('#page-next').click();
  assert(await page.locator('#vocab-grid button[data-word="whisk"]').count()||await page.locator('#vocab-grid button').count()>0,
    'Cutlery exercise has no items');
  await page.locator('#lab-screen').screenshot({path:artifacts+'/house-cutlery-mobile.png'});
  assert.equal(errors.length,0,'Browser asset or JavaScript errors: '+errors.join(' | '));
  console.log('PASS mobile browser smoke:',state,'next:',next,'canvas colors:',distinct.size);
} catch(e){ console.error('FAIL browser smoke:',e);process.exitCode=1; }
finally{await browser?.close();}