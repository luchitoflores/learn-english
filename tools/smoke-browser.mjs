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
  assert.equal(await page.locator('#inventory-items button').count(),12,'Fridge grid must paginate');
  assert.equal(await page.locator('#inventory-filters button').count(),4,'Fridge category tabs missing');
  await page.locator('#inventory-filters button',{hasText:'Frutas'}).click();
  assert.equal(await page.locator('#inventory-items button').count(),12,'Fruit grid page size incorrect');
  assert(await page.locator('#inventory-items button[data-item-id="banana"] .inventory-pixel-sprite').count(),
    'Banana 48px original sprite not visible');
  await page.locator('#inventory-items button[data-item-id="banana"]').click();
  assert((await page.locator('#study-english').textContent()).includes('banana'),'Banana discovery failed');
  await page.locator('#inventory-next-page').click();
  assert((await page.locator('#inventory-page').textContent()).includes('2 de 2'),'Fruit pagination failed');
  await page.locator('#inventory-filters button',{hasText:'Verduras'}).click();
  assert(await page.locator('#inventory-items button[data-item-id="carrot"]').isVisible(),'Carrot sprite missing');
  await page.locator('#inventory-layer').screenshot({path:artifacts+'/fridge-mobile.png'});
  await page.locator('#inventory-close').click();
  await page.evaluate(()=>window.wordQuest.modeEngine.setMode('orders'));
  await page.locator('#container-shortcuts button',{hasText:'Fridge'}).click();
  await page.waitForFunction(()=>window.wordQuest?.containers?.task?.itemId);
  const target=await page.evaluate(()=>window.wordQuest.containers.task.itemId);
  assert.equal(await page.locator('#inventory-items button').count(),8,'Fridge mission needs eight visible choices');
  await page.locator('#inventory-items button[data-item-id="'+target+'"]').click();
  assert.equal(await page.evaluate(()=>window.wordQuest.containers.score),1,
    'Fridge orders did not accept the correct item');
  await page.locator('#inventory-close').click();
  assert.equal(errors.length,0,'Browser asset or JavaScript errors: '+errors.join(' | '));
  console.log('PASS mobile browser smoke:',state,'next:',next,'canvas colors:',distinct.size);
} catch(e){ console.error('FAIL browser smoke:',e);process.exitCode=1; }
finally{await browser?.close();}