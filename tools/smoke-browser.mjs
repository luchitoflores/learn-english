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
  assert(state.hero.startsWith('hero-raster-'),'The old placeholder character is visible');
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
  assert.equal(errors.length,0,'Browser asset or JavaScript errors: '+errors.join(' | '));
  console.log('PASS mobile browser smoke:',state,'next:',next,'canvas colors:',distinct.size);
} catch(e){ console.error('FAIL browser smoke:',e);process.exitCode=1; }
finally{await browser?.close();}