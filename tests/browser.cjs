const {chromium}=require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../src/catalogue.js');
const E=require('../src/engine.js');
const KEY='quadruple-agent.v1';
const url=process.env.QA_TEST_URL||'http://127.0.0.1:4173/';
const outputs=path.resolve(__dirname,'../artifacts');fs.mkdirSync(outputs,{recursive:true});
const roster=Array.from({length:5},(_,i)=>({id:`p${i+1}`,name:['Alex','Blair','Casey','Drew','Ellis'][i]}));
const assignments=Object.fromEntries(roster.map((p,i)=>[p.id,{team:i===4?'parasites':'force',special:'none'}]));
const click=(p,a)=>p.locator(`[data-action="${a}"]`).first().click();
async function seed(p,config,game=null,people=roster){await p.evaluate(({KEY,roster,config,game})=>{localStorage.setItem(KEY,JSON.stringify({roster,config,game,customs:[],presetId:'custom'}));Storage.prototype.setItem=()=>{};},{KEY,roster:people,config,game});await p.reload();}
async function brief(p,n=5){await click(p,'start');for(let i=0;i<n;i++){await click(p,'reveal');const text=await p.locator('#main').innerText();for(const role of C.specials)assert(!text.includes(role.name));assert(!text.includes('No special role'));await click(p,'brief-next');}assert.match(await p.locator('#main').innerText(),/New round/);assert(!/manual mode|overrides/i.test(await p.locator('#main').innerText()));assert.equal(await p.locator('#main [data-action="game-overrides"]').count(),0);}
async function completeOps(p){
  let turns=0;
  while(await p.locator('[data-action="reveal"]').count()){
    await click(p,'reveal');
    if(await p.locator('[data-action="operate"]').count()){
      const targets=p.locator('[data-action="target"]');
      if(await targets.count()){
        const text=await p.locator('#main').innerText();await targets.nth(0).click();
        if(text.includes('Choose two players'))await p.locator('[data-action="target"]').nth(1).click();
      }
      const choices=p.locator('[data-action="choice"]:not([disabled])');if(await choices.count())await choices.first().click();
      await click(p,'operate');
      if(await p.locator('[data-action="reveal"]').count())await click(p,'reveal');
    }
    await click(p,'op-next');turns++;
    if(turns>9)throw new Error('Operation loop did not finish.');
  }
  return turns;
}
let debugPage;
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('quadruple-agent.audio',JSON.stringify({enabled:false,volume:.28})));
  const page=await context.newPage();debugPage=page;page.setDefaultTimeout(8000);await page.emulateMedia({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  await page.screenshot({path:path.join(outputs,'setup-mobile.png'),fullPage:true});
  assert.equal(await page.title(),'Quadruple Agent');
  assert.deepEqual(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).config.specials,KEY),[]);
  await click(page,'settings');await page.locator('#single-round').check();await click(page,'settings-done');await page.reload();await click(page,'settings');assert(await page.locator('#single-round').isChecked());await page.locator('#single-round').uncheck();await click(page,'settings-done');
  await page.locator('[data-action="preset"][data-id="full"]').click();assert.equal((await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).config.specials,KEY)).length,5);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('[data-action="preset"][data-id="confident"]').click();
  const config=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).config,KEY);assert.equal(config.operations.length,7);assert.equal(config.specials.length,0);assert(!config.agendas.includes('sleeper'));
  await click(page,'presets');await page.locator('#preset-name').fill('Group night');await click(page,'save-custom');
  await page.reload();await click(page,'presets');assert.match(await page.locator('#modal-body').innerText(),/Group night/);
  const downloadPromise=page.waitForEvent('download');await click(page,'export');const download=await downloadPromise;const exportPath=path.join(outputs,'exported-config.json');await download.saveAs(exportPath);assert.equal(JSON.parse(fs.readFileSync(exportPath)).format,'quadruple-agent-config');
  await page.locator('#config-file').setInputFiles(exportPath);await page.waitForTimeout(100);assert.match(await page.locator('#toast').innerText(),/imported/);await click(page,'close-modal');
  console.log('PASS presets save, reload, export and import');
  await click(page,'settings');await page.locator('[data-action="settings-tab"][data-tab="manual"]').click();await page.locator('#manual-toggle').check();await page.locator('[data-assignment="special"][data-id="p1"]').selectOption('cover');await page.locator('[data-assignment="special"][data-id="p2"]').selectOption('cover');await click(page,'override-add');await page.locator('[data-override="operation"]').selectOption('confession');await page.locator('[data-override="target0"]').selectOption('p2');await page.locator('[data-override="round"]').fill('2');await page.locator('[data-override="round"]').press('Tab');await click(page,'settings-done');
  let stored=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.equal(stored.config.assignments.p1.special,'cover');assert.equal(stored.config.assignments.p2.special,'cover');assert.equal(stored.config.overrides[0].round,2);assert.deepEqual(stored.config.overrides[0].targets,['p2']);console.log('PASS manual assignment controls');
  const conf={...C.presets[1].config,manual:true,parity:false,assignments:{...assignments,p1:{team:'force',special:'cover'}},overrides:[
    {round:1,player:'p1',operation:'confession',targets:['p2']},
    {round:1,player:'p2',operation:'encounter',targets:['p5']},
    {round:1,player:'p3',operation:'evidence',targets:['p4'],result:'double'},
    {round:1,player:'p4',operation:'agenda',result:'scapegoat'},
    {round:1,player:'p5',operation:'tip',targets:['p1']},
    {round:2,player:'p1',operation:'confession',targets:['p4']}
  ]};
  await seed(page,conf);await brief(page);await click(page,'round-start');await click(page,'reveal');await click(page,'operate');assert.match(await page.locator('#main').innerText(),/Alex[\s\S]*Blair/);assert(!await page.locator('.secret').count());await click(page,'reveal');assert.match(await page.locator('.secret').innerText(),/Alex is Force/);await page.screenshot({path:path.join(outputs,'confession-mobile.png'),fullPage:true});
  await page.reload();await click(page,'resume');assert(!await page.locator('.secret').count());assert.match(await page.locator('#main').innerText(),/Alex[\s\S]*Blair/);await click(page,'reveal');await click(page,'op-next');
  await click(page,'reveal');await click(page,'operate');assert(!await page.locator('.secret').count());assert.match(await page.locator('#main').innerText(),/Blair[\s\S]*Ellis/);await click(page,'reveal');assert.match(await page.locator('.secret').innerText(),/A Parasite is present/);await click(page,'op-next');assert.equal(await completeOps(page),3);assert.match(await page.locator('#main').innerText(),/Compare stories/);console.log('PASS operation flow, joint reveals and concealed reload');
  await click(page,'voting-start');
  for(let i=0;i<5;i++){await click(page,'reveal');const target=i===3?'p1':'p4';await page.locator(`[data-action="target"][data-id="${target}"]`).click();await click(page,'cast-vote');if(i<4)assert(!await page.locator('.target-list').count());}
  assert.match(await page.locator('#main').innerText(),/Drew is jailed/);assert(!await page.locator('#main').innerText().then(t=>t.includes('Operation Scapegoat')));
  stored=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.equal(stored.game.tally.totals.p1,2);assert.equal(stored.game.players[3].secured[0].id,'scapegoat');
  assert(!/manual mode|overrides/i.test(await page.locator('#main').innerText()));assert.equal(await page.locator('#main [data-action="game-overrides"]').count(),0);
  await page.screenshot({path:path.join(outputs,'votes-mobile.png'),fullPage:true});await click(page,'settings');await click(page,'game-overrides');await click(page,'overrides-save');await click(page,'round-start');await click(page,'reveal');stored=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY); // Targets prepared in memory; result persistence confirms replacement below.
  await click(page,'operate');await click(page,'reveal');stored=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert(!stored.game.turns[0].targets.includes('p4'));assert.equal(stored.game.turns.length,4);console.log('PASS anonymous voting, immediate personal win, in-game overrides and jailed-target fallback');
  await click(page,'op-next');await completeOps(page);await click(page,'voting-start');
  const votes={p1:'p5',p2:'p5',p3:'p5',p5:'p1'};
  while(await page.locator('[data-action="reveal"]').count()){await click(page,'reveal');stored=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);const voter=stored.game.voters[stored.game.cursor];await page.locator(`[data-action="target"][data-id="${votes[voter]}"]`).click();await click(page,'cast-vote');}
  await click(page,'final-results');assert.match(await page.locator('#main').innerText(),/Force win/);assert.match(await page.locator('#main').innerText(),/Personal win secured: Operation Scapegoat/);assert(!await page.locator('#main').innerText().then(t=>t.includes('Deep Cover Agent')));await page.screenshot({path:path.join(outputs,'final-mobile.png'),fullPage:true});console.log('PASS game ends, special roles stay hidden and personal results differ from team result');
  await click(page,'play-again');
  const otherOps={...conf,overrides:[
    {round:1,player:'p1',operation:'defector',result:'stay'},
    {round:1,player:'p2',operation:'transfer',targets:['p3']},
    {round:1,player:'p3',operation:'intel',targets:['p1','p5']},
    {round:1,player:'p4',operation:'danish',targets:['p1','p5']},
    {round:1,player:'p5',operation:'agenda',result:'grudge',targets:['p4']}
  ]};
  await seed(page,otherOps);await brief(page);await click(page,'round-start');assert.equal(await completeOps(page),5);console.log('PASS remaining operation interfaces');
  const three=roster.slice(0,3);const smallConfig={...C.presets[1].config,parity:false,manual:true,assignments:{p1:{team:'force',special:'none'},p2:{team:'force',special:'none'},p3:{team:'parasites',special:'none'}},overrides:[{round:1,player:'p1',operation:'tip',targets:['p3']},{round:1,player:'p2',operation:'confession',targets:['p1']},{round:1,player:'p3',operation:'evidence',targets:['p1'],result:'shield'}]};
  await seed(page,smallConfig,null,three);await brief(page,3);await click(page,'round-start');await completeOps(page);await click(page,'voting-start');
  for(const id of ['p2','p1','p2']){await click(page,'reveal');await page.locator(`[data-action="target"][data-id="${id}"]`).click();await click(page,'cast-vote');}
  assert.match(await page.locator('#main').innerText(),/Two or fewer players/);await click(page,'final-results');assert.match(await page.locator('#main').innerText(),/Parasites win/);console.log('PASS mandatory two-player ending with parity disabled');await click(page,'play-again');
  const singleConfig={...C.defaults,singleRound:true};const singleGame=E.createGame(roster,singleConfig);singleGame.players.forEach(p=>p.team=['p4','p5'].includes(p.id)?'parasites':'force');singleGame.round=1;singleGame.phase='discussion';
  await seed(page,singleConfig,singleGame);await click(page,'resume');await click(page,'voting-start');
  for(const id of ['p5','p5','p5','p5','p1']){await click(page,'reveal');await page.locator(`[data-action="target"][data-id="${id}"]`).click();await click(page,'cast-vote');}
  assert.equal(await page.locator('[data-action="round-start"]').count(),0);await click(page,'final-results');assert.match(await page.locator('#main').innerText(),/Force win/);await click(page,'play-again');
  const tiedGame=E.createGame(roster,singleConfig);tiedGame.round=1;tiedGame.phase='discussion';await seed(page,singleConfig,tiedGame);await click(page,'resume');await click(page,'voting-start');
  for(const id of ['p2','p3','p4','p5','p1']){await click(page,'reveal');await page.locator(`[data-action="target"][data-id="${id}"]`).click();await click(page,'cast-vote');}
  await click(page,'final-results');assert.match(await page.locator('#main').innerText(),/No team wins/);assert.equal(await page.locator('.result-detail .chip').filter({hasText:'DRAW'}).count(),5);await click(page,'play-again');console.log('PASS saved one-voting-round option, decisive team victory and tied-game draw');
  for(const [width,height,label] of [[320,568,'small'],[1440,900,'desktop']]){await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(outputs,`setup-${label}.png`),fullPage:true});}
  // Verify direct-file delivery has no external requests or asset dependencies.
  const offline=await browser.newContext({viewport:{width:390,height:844},offline:true});const file=await offline.newPage();file.on('pageerror',e=>errors.push(e.message));await file.goto('file:///'+path.resolve(__dirname,'../index.html').replace(/\\/g,'/'));assert.equal(await file.locator('[data-action="start"]').count(),1);await click(file,'start');assert.match(await file.locator('#main').innerText(),/Private handover/i);console.log('PASS offline single-file launch');
  assert.deepEqual(errors,[]);console.log('PASS zero browser errors, mobile and desktop layouts');await browser.close();
})().catch(async err=>{console.error(err);if(debugPage){console.error(await debugPage.locator('#main').innerText());await debugPage.screenshot({path:path.join(outputs,'failure.png'),fullPage:true});}process.exit(1);});
