const {chromium}=require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const {pathToFileURL}=require('node:url');const path=require('node:path');
let browser;
(async()=>{
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{
    const NativeAudio=window.Audio,NativeContext=window.AudioContext;window.testAudio=[];window.testContexts=[];window.testGains=[];
    window.Audio=function(...args){const audio=new NativeAudio(...args);window.testAudio.push(audio);return audio;};
    window.AudioContext=class extends NativeContext{constructor(...args){super(...args);window.testContexts.push(this);}createGain(){const gain=super.createGain();window.testGains.push(gain);return gain;}};
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('http://127.0.0.1:4173/');
  await page.locator('#music-button').click();await page.waitForFunction(()=>document.querySelector('#music-button').textContent==='Music on',null,{timeout:30000});
  await page.waitForFunction(()=>testAudio[0].currentTime>.5&&testAudio[0].duration>0);const duration=await page.evaluate(()=>testAudio[0].duration);console.log('PASS supplied track streams; duration',Math.round(duration),'seconds');
  await page.locator('#music-volume').fill('40');await page.waitForTimeout(400);assert(Math.abs(await page.evaluate(()=>testGains[0].gain.value)-.4)<.01);
  assert.equal(await page.evaluate(()=>testAudio.length),1);assert(await page.evaluate(()=>testAudio[0].loop));
  await page.evaluate(()=>{testAudio[0].currentTime=Math.max(0,testAudio[0].duration-.6);});
  await page.waitForFunction(()=>testAudio[0].currentTime<3&&!testAudio[0].paused,null,{timeout:10000});console.log('PASS supplied track loops natively without added fades');
  await page.locator('#music-button').click();assert.equal(await page.locator('#music-button').innerText(),'Music off');assert(await page.evaluate(()=>testAudio.every(a=>a.paused)));
  await page.locator('#music-button').click();await page.waitForFunction(()=>document.querySelector('#music-button').textContent==='Music on');assert(await page.evaluate(()=>!testAudio[0].paused));
  await page.locator('#music-button').click();await page.reload();assert.equal(await page.locator('#music-volume').inputValue(),'40');assert.equal(await page.locator('#music-button').innerText(),'Music off');console.log('PASS volume, pause/resume and remembered preferences');
  await page.screenshot({path:'artifacts/music-mobile.png',fullPage:true,animations:'disabled'});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);await page.locator('#music-button').click();await page.waitForFunction(()=>document.querySelector('#music-button').textContent==='Music on');await page.waitForFunction(()=>testAudio[0].currentTime>.2);
  assert.equal(await page.evaluate(()=>testContexts.length),0);await page.locator('#music-volume').fill('35');assert(Math.abs(await page.evaluate(()=>testAudio[0].volume)-.35)<.001);console.log('PASS local HTML music playback and volume without Web Audio origin restrictions');
  assert.deepEqual(errors,[]);await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exit(1);});
