const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/catalogue.js');
const E=require('../src/engine.js');
const roster=(n=5)=>Array.from({length:n},(_,i)=>({id:`p${i+1}`,name:`Player ${i+1}`}));
function seeded(seed=123){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function game(extra={},n=5){return E.createGame(roster(n),{...C.defaults,specials:[],parity:false,...extra},seeded());}
function operation(g,id,actor='p1',override=null){g.phase='operations';g.cursor=0;g.round=1;g.turns=[{player:actor,operation:id,override,targets:null,result:null,done:false}];return E.prepareTurn(g);}
function forceTeams(g,parasites=['p5']){g.players.forEach(p=>p.team=parasites.includes(p.id)?'parasites':'force');}
function voting(g,votes){g.phase='discussion';E.startVoting(g);while(g.phase==='voting'){const id=g.voters[g.cursor];E.vote(g,votes[id]);}return g.tally;}

test('Full and Confident contain exactly the requested content',()=>{
  assert.equal(C.presets[0].config.operations.length,17);assert.equal(C.presets[0].config.specials.length,5);
  const conf=C.presets[1].config;assert.equal(conf.operations.length,15);assert.deepEqual(conf.specials,[]);
  assert(!conf.operations.includes('defector'));assert(!conf.operations.includes('transfer'));assert(!conf.agendas.includes('sleeper'));assert(conf.operations.includes('agenda'));
});
test('Multiple starting Parasites recognise an immutable starting roster',()=>{
  const g=game({parasites:2});assert.equal(g.initialParasites.length,2);const initial=[...g.initialParasites];
  operation(g,'transfer',initial[0]);const target=g.players.find(p=>p.team==='force');E.runOperation(g,{targets:[target.id]});assert.deepEqual(g.initialParasites,initial);
});
test('No random duplicate operations and no random duplicate special roles',()=>{
  for(let n=3;n<=9;n++)for(let seed=1;seed<=30;seed++){
    const g=E.createGame(roster(n),C.presets[0].config,seeded(seed));E.finishBriefing(g);E.startRound(g,seeded(seed+90));
    assert.equal(new Set(g.turns.map(t=>t.operation)).size,n);
    const assigned=g.players.map(p=>p.special).filter(Boolean);assert.equal(assigned.length,Math.min(n,C.specials.length));assert.equal(new Set(assigned).size,assigned.length);
    if(n>=C.specials.length)for(const s of C.specials)assert.equal(g.players.filter(p=>p.special===s.id).length,1);
  }
});
test('Special roles default off and an enabled role is always assigned',()=>{
  assert.deepEqual(C.defaults.specials,[]);assert(game().players.every(p=>!p.special));
  for(let seed=1;seed<=50;seed++){const g=E.createGame(roster(),{...C.defaults,specials:['cover']},seeded(seed));assert.equal(g.players.filter(p=>p.special==='cover').length,1);}
  assert.throws(()=>game({manual:true,specials:['cover'],assignments:Object.fromEntries(roster().map(p=>[p.id,{special:'none'}]))}),/available player/);
});
test('Manual special role consumes the random slot, duplicates require explicit assignment',()=>{
  const cfg={manual:true,specials:['cover'],assignments:{p1:{special:'cover'}}};
  for(let seed=1;seed<30;seed++){const g=E.createGame(roster(),{...C.defaults,...cfg},seeded(seed));assert.equal(g.players.filter(p=>p.special==='cover').length,1);}
  const g=game({...cfg,assignments:{p1:{special:'cover'},p2:{special:'cover'}}});assert.equal(g.players.filter(p=>p.special==='cover').length,2);
});
test('Partial manual team assignments are respected while random slots fill the count',()=>{
  const g=game({manual:true,parasites:2,assignments:{p1:{team:'parasites'},p2:{team:'force'}}});
  assert.equal(g.players[0].team,'parasites');assert.equal(g.players[1].team,'force');assert.equal(g.players.filter(p=>p.team==='parasites').length,2);
});
test('Fully explicit team compositions can override the requested Parasite count',()=>{
  const g=game({manual:true,assignments:Object.fromEntries(roster().map(p=>[p.id,{team:'force'}]))});
  assert(g.players.every(p=>p.team==='force'));E.finishBriefing(g);assert.equal(g.winner,'force');
});
test('Forced content can exceed preset limits without introducing random copies',()=>{
  const g=game({...C.presets[1].config,manual:true,overrides:[{round:1,player:'p1',operation:'transfer',targets:['p2']},{round:1,player:'p2',operation:'transfer',targets:['p1']}]});
  E.finishBriefing(g);E.startRound(g);assert.equal(g.turns.filter(t=>t.operation==='transfer').length,2);assert.equal(new Set(g.turns.slice(2).map(t=>t.operation)).size,3);
});
test('Unavailable targets are replaced, jailed owners are skipped and forced results persist',()=>{
  const g=game({manual:true,overrides:[{round:2,player:'p1',operation:'confession',targets:['p2'],result:'parasites'},{round:2,player:'p2',operation:'tip'}]});
  forceTeams(g);g.players[1].jailed=true;g.round=1;g.phase='results';E.startRound(g,seeded());
  assert(!g.turns.some(t=>t.player==='p2'));const t=E.prepareTurn(g);assert.equal(t.operation,'confession');assert(!t.targets.includes('p2'));assert(!t.targets.includes('p1'));assert.equal(E.runOperation(g).team,'parasites');
});
test('Two targets stay distinct and preserve the eligible part of a partial override',()=>{
  const g=game();g.players[1].jailed=true;operation(g,'intel','p1',{targets:['p2','p3']});const t=g.turns[0];assert.equal(t.targets.length,2);assert(t.targets.includes('p3'));assert.equal(new Set(t.targets).size,2);assert(!t.targets.includes('p2'));
});
test('False allegiances affect information but Confession shows actual allegiance',()=>{
  const g=game();forceTeams(g);g.players[0].special='suspicious';g.players[4].special='cover';
  assert.equal(E.apparent(g.players[0]),'parasites');assert.equal(E.apparent(g.players[4]),'force');
  operation(g,'confession');assert.equal(E.runOperation(g,{targets:['p2']}).team,'force');
  operation(g,'tip','p2',{targets:['p1']});assert.equal(E.runOperation(g).team,'parasites');
  operation(g,'intel','p2');assert(E.runOperation(g,{targets:['p1','p5']}).parasite);
  operation(g,'danish','p2');assert(!E.runOperation(g,{targets:['p1','p5']}).same);
  operation(g,'encounter','p1',{targets:['p5']});assert(E.runOperation(g).parasite);
});
test('Spy Transfer swaps true teams without disclosing either',()=>{
  const g=game();forceTeams(g);operation(g,'transfer');const result=E.runOperation(g,{targets:['p5']});assert.equal(g.players[0].team,'parasites');assert.equal(g.players[4].team,'force');assert(!Object.hasOwn(result,'team'));
});
test('Force Defector skips voting and later team changes clear the restriction',()=>{
  const g=game();forceTeams(g,['p1','p5']);operation(g,'defector');E.runOperation(g,{choice:'switch'});assert.equal(g.players[0].defector,'force');
  g.phase='discussion';E.startVoting(g);assert(!g.voters.includes('p1'));
  operation(g,'transfer');E.runOperation(g,{targets:['p5']});assert.equal(g.players[0].defector,null);assert.equal(g.players[0].team,'parasites');
});
test('Parasite Defector loses on any teammate vote even when shielded and not jailed',()=>{
  const g=game();forceTeams(g);operation(g,'defector');E.runOperation(g,{choice:'switch'});g.effects.p1={shield:5,double:0};
  const tally=voting(g,{p1:'p2',p2:'p3',p3:'p2',p4:'p2',p5:'p1'});assert.equal(tally.jailed,'p2');assert.equal(tally.totals.p1,0);assert(g.players[0].disqualified);
  g.players[0].secured.push({id:'scapegoat',round:1});g.winner='parasites';assert.equal(E.outcomes(g)[0].win,false);
});
test('Force vote does not trigger Parasite Defector loss',()=>{
  const g=game();forceTeams(g,['p1']);g.players[0].defector='parasites';voting(g,{p1:'p2',p2:'p1',p3:'p2',p4:'p2',p5:'p2'});assert(!g.players[0].disqualified);
});
test('Protection subtracts one vote, double bonus doubles the voter not the target',()=>{
  const g=game();forceTeams(g);g.effects={p1:{double:1,shield:0},p2:{double:0,shield:1}};
  const tally=voting(g,{p1:'p2',p2:'p3',p3:'p2',p4:'p5',p5:'p4'});assert.equal(tally.raw.p2,3);assert.equal(tally.totals.p2,2);assert.equal(tally.jailed,'p2');assert.equal(tally.totals.p3,1);
  assert(!Object.hasOwn(tally,'votes'));assert(!Object.hasOwn(tally,'voters'));
});
test('Ties jail nobody and protection never gives negative totals',()=>{
  const g=game({},4);forceTeams(g,['p4']);g.effects.p3={shield:2,double:0};const tally=voting(g,{p1:'p2',p2:'p1',p3:'p1',p4:'p2'});assert(tally.tie);assert.equal(tally.jailed,null);assert.equal(tally.totals.p3,0);assert.equal(E.active(g).length,4);
});
test('Self votes and jailed targets are rejected without advancing the voter',()=>{
  const g=game();g.phase='discussion';E.startVoting(g);assert.throws(()=>E.vote(g,'p1'));assert.equal(g.cursor,0);g.players[1].jailed=true;assert.throws(()=>E.vote(g,'p2'));assert.equal(g.cursor,0);
});
test('Scapegoat and Grudge secure immediate personal wins, including jailed owners',()=>{
  const g=game();forceTeams(g);g.players[1].agenda={id:'scapegoat',target:null};g.players[0].agenda={id:'grudge',target:'p2'};
  voting(g,{p1:'p2',p2:'p1',p3:'p2',p4:'p2',p5:'p2'});assert.equal(g.players[1].secured[0].id,'scapegoat');assert.equal(g.players[0].secured[0].id,'grudge');
  g.winner='parasites';const out=E.outcomes(g);assert(out[0].win);assert(out[1].win);
});
test('New agendas replace unfinished conditions but retain secured wins',()=>{
  const g=game();g.players[0].agenda={id:'grudge',target:'p2'};g.players[0].secured=[{id:'grudge',round:0}];operation(g,'agenda','p1',{result:'scapegoat'});E.runOperation(g);assert.equal(g.players[0].agenda.id,'scapegoat');assert.equal(g.players[0].secured.length,1);
  operation(g,'agenda','p1',{result:'sleeper'});const old=g.players[0].team;E.runOperation(g);assert.notEqual(g.players[0].team,old);assert.equal(g.players[0].agenda,null);assert.equal(g.players[0].secured.length,1);
});
test('Guaranteed Grudge and Infatuation can target an active specified player',()=>{
  const g=game();for(const id of ['grudge','infatuation']){operation(g,'agenda','p1',{result:id,targets:['p3']});const r=E.runOperation(g);assert.equal(r.target,'p3');assert.equal(g.players[0].agenda.target,'p3');}
});
test('Infatuation follows personal results through chains and handles cycles',()=>{
  const g=game();forceTeams(g);g.winner='parasites';g.players[0].agenda={id:'infatuation',target:'p2'};g.players[1].agenda={id:'infatuation',target:'p3'};g.players[2].secured=[{id:'grudge',round:1}];assert(E.outcomes(g)[0].win);
  g.players[2].secured=[];g.players[2].agenda={id:'infatuation',target:'p1'};assert.equal(E.outcomes(g)[0].win,false);
});
test('Parity is optional, two-player ending is mandatory, no Parasites means Force win',()=>{
  const g=game({parity:false},4);forceTeams(g,['p1','p2']);assert.equal(E.teamWinner(g),null);g.config.parity=true;assert.equal(E.teamWinner(g).team,'parasites');g.config.parity=false;g.players[2].jailed=true;g.players[3].jailed=true;assert.equal(E.teamWinner(g).team,'parasites');forceTeams(g,[]);assert.equal(E.teamWinner(g).team,'force');
});
test('Effects expire and fresh unique operations are dealt each round',()=>{
  const g=game();E.finishBriefing(g);E.startRound(g);g.effects.p1={double:1,shield:1};g.phase='results';E.startRound(g);assert.deepEqual(g.effects,{});assert.equal(g.round,2);assert.equal(g.turns.length,5);
});
test('Too few enabled operations and empty agenda pools fail clearly',()=>{
  assert.throws(()=>game({operations:['tip','confession']}),/not enough unique/);assert.throws(()=>game({agendas:[]}),/at least one Hidden Agenda/);
});
test('Simulation completes legal rounds for every supported player count',()=>{
  for(let n=3;n<=9;n++)for(let seed=1;seed<=20;seed++){
    const rng=seeded(seed+31),g=E.createGame(roster(n),{...C.defaults,parity:false},rng);E.finishBriefing(g);
    for(let round=0;round<5&&g.phase!=='ended'&&!g.winner;round++){
      E.startRound(g,rng);
      while(g.phase==='operations'){
        const t=E.prepareTurn(g,g.cursor,rng),op=C.operations.find(o=>o.id===t.operation);
        E.runOperation(g,{targets:E.active(g).filter(p=>op.allowSelf||p.id!==t.player).slice(0,op.targets).map(p=>p.id),choice:t.operation==='evidence'?'double':'stay'},rng);E.finishTurn(g);
      }
      if(g.phase==='ended')break;
      E.startVoting(g);
      while(g.phase==='voting'){const id=g.voters[g.cursor];E.vote(g,E.active(g).find(p=>p.id!==id).id);}
      assert.equal(g.phase,'results');
      if(g.winner){const outcomes=E.outcomes(g);assert.equal(outcomes.length,n);assert(outcomes.every(p=>typeof p.win==='boolean'));}
    }
  }
});
