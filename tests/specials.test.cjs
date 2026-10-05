const test=require('node:test');const assert=require('node:assert/strict');
const C=require('../src/catalogue.js'),E=require('../src/engine.js');
function game(){const roster=Array.from({length:5},(_,i)=>({id:`p${i+1}`,name:`Player ${i+1}`}));const g=E.createGame(roster,{...C.defaults,parity:false,specials:[]});g.players.forEach((p,i)=>p.team=i===4?'parasites':'force');g.phase='operations';g.round=1;return g;}
function run(g,id,actor='p1',targets=['p5'],result=''){
  g.cursor=0;g.turns=[{player:actor,operation:id,override:{targets,result},targets:null,result:null,done:false}];
  return E.runOperation(g,{targets,choice:'stay'});
}
test('New specials are available while default and Confident keep all specials off',()=>{
  assert.equal(C.specials.length,5);assert.deepEqual(C.defaults.specials,[]);assert.deepEqual(C.presets[1].config.specials,[]);
  for(const id of ['source','fixed','counterintel'])assert(C.presets[0].config.specials.includes(id));
});
test('Full deals one distinct random special role per player in three- and four-player groups',()=>{
  const encountered=new Set();
  for(let n=3;n<=4;n++)for(let i=0;i<100;i++){
    const roster=Array.from({length:n},(_,j)=>({id:`p${j+1}`,name:`Player ${j+1}`}));const g=E.createGame(roster,C.presets[0].config);const roles=g.players.map(p=>p.special);
    assert.equal(roles.filter(Boolean).length,n);assert.equal(new Set(roles).size,n);roles.forEach(id=>encountered.add(id));
  }assert.equal(encountered.size,5);
});
test('Small-group random dealing keeps a manually assigned role and never duplicates it',()=>{
  for(let i=0;i<30;i++){
    const roster=[1,2,3].map(n=>({id:`p${n}`,name:`Player ${n}`}));const g=E.createGame(roster,{...C.presets[0].config,manual:true,assignments:{p1:{special:'source'}}});
    assert.equal(g.players[0].special,'source');assert.equal(g.players.filter(p=>p.special==='source').length,1);assert.equal(g.players.filter(p=>p.special).length,3);
  }
});
test('Unreliable Source always inverts Anonymous Tip for either allegiance',()=>{
  const g=game();g.players[0].special='source';assert.equal(run(g,'tip').team,'force');assert.equal(run(g,'tip','p1',['p2']).team,'parasites');
});
test('Unreliable Source flips the combined Secret Intel answer, not each target individually',()=>{
  const g=game();g.players[0].special='source';assert.equal(run(g,'intel','p1',['p2','p5']).parasite,false);assert.equal(run(g,'intel','p1',['p2','p3']).parasite,true);
});
test('Unreliable Source flips the shared Encounter result when they own the operation',()=>{
  const g=game();g.players[0].special='source';assert.equal(run(g,'encounter').parasite,false);assert.equal(run(g,'encounter','p1',['p2']).parasite,true);
  // Merely being the invited partner does not modify another player's operation.
  assert.equal(run(g,'encounter','p2',['p1']).parasite,false);
});
test('Unreliable Source flips Danish Intelligence and cannot corrupt Confession',()=>{
  const g=game();g.players[0].special='source';assert.equal(run(g,'danish','p1',['p2','p3']).same,false);assert.equal(run(g,'danish','p1',['p2','p5']).same,true);assert.equal(run(g,'confession','p1',['p2']).team,'force');
});
test('Manual guaranteed answers take precedence over Unreliable Source',()=>{
  const g=game();g.players[0].special='source';assert.equal(run(g,'tip','p1',['p5'],'parasites').team,'parasites');assert.equal(run(g,'intel','p1',['p2','p5'],'yes').parasite,true);assert.equal(run(g,'danish','p1',['p2','p3'],'same').same,true);
});
test('Counterintelligence bypasses both target disguises across all information operations',()=>{
  const g=game();g.players[0].special='counterintel';g.players[1].special='suspicious';g.players[4].special='cover';
  assert.equal(run(g,'tip','p1',['p2']).team,'force');assert.equal(run(g,'tip','p1',['p5']).team,'parasites');assert.equal(run(g,'intel','p1',['p2','p5']).parasite,true);assert.equal(run(g,'intel','p1',['p2','p3']).parasite,false);assert.equal(run(g,'encounter','p1',['p5']).parasite,true);assert.equal(run(g,'danish','p1',['p2','p5']).same,false);
});
test('Counterintelligence affects only its owner’s information and respects explicit manual results',()=>{
  const g=game();g.players[0].special='counterintel';g.players[4].special='cover';assert.equal(run(g,'tip','p2',['p5']).team,'force');assert.equal(run(g,'tip','p1',['p5'],'force').team,'force');
});
test('Fixed Asset blocks Spy Transfer as either owner or target without disclosing the block',()=>{
  for(const fixed of ['p1','p5']){const g=game();g.players.find(p=>p.id===fixed).special='fixed';g.players[0].defector='force';const result=run(g,'transfer');assert.equal(g.players[0].team,'force');assert.equal(g.players[4].team,'parasites');assert.equal(g.players[0].defector,'force');assert.deepEqual(result,{type:'transfer',targets:['p5']});}
});
test('Fixed Asset leaves other team-changing operations available',()=>{
  const g=game();g.players[0].special='fixed';g.cursor=0;g.turns=[{player:'p1',operation:'defector',override:null,targets:null,result:null,done:false}];E.runOperation(g,{choice:'switch'});assert.equal(g.players[0].team,'parasites');run(g,'agenda','p1',[],'sleeper');assert.equal(g.players[0].team,'force');
});
