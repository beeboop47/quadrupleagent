/* Pure rules engine. No DOM or storage dependencies; state can be safely resumed behind a handover. */
(function(root){
  'use strict';
  const C=root.QACatalogue || (typeof require==='function'?require('./catalogue.js'):null);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const lookup=(list,id)=>list.find(item=>item.id===id);
  const fail=message=>{throw new Error(message);};
  function shuffle(list,rng=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const active=g=>g.players.filter(p=>!p.jailed);
  const player=(g,id)=>g.players.find(p=>p.id===id);
  const hasSpecial=(p,id)=>p.special===id||(Array.isArray(p.specials)&&p.specials.includes(id));
  const apparent=p=>hasSpecial(p,'suspicious')&&p.team==='force'?'parasites':hasSpecial(p,'cover')&&p.team==='parasites'?'force':p.team;
  const other=team=>team==='force'?'parasites':'force';
  function cleanConfig(raw={}){
    const cfg={...clone(C.defaults),...clone(raw)};
    for(const [key,list] of [['operations',C.operations],['agendas',C.agendas],['specials',C.specials]])cfg[key]=Array.isArray(cfg[key])?[...new Set(cfg[key].filter(id=>lookup(list,id)))]:list.map(x=>x.id);
    cfg.parasites=Math.max(1,Math.min(8,Math.floor(Number(cfg.parasites)||1)));
    cfg.parity=cfg.parity!==false;cfg.manual=cfg.manual===true;
    cfg.singleRound=cfg.singleRound===true;
    cfg.operationPhases=Math.max(1,Math.min(10,Math.floor(Number(cfg.operationPhases)||1)));
    cfg.discussionMinutes=Math.max(0,Math.min(30,Number(cfg.discussionMinutes)||0));
    cfg.assignments=cfg.assignments&&typeof cfg.assignments==='object'&&!Array.isArray(cfg.assignments)?cfg.assignments:{};
    cfg.overrides=Array.isArray(cfg.overrides)?cfg.overrides:[];
    return cfg;
  }
  function roundOverrides(config,round,players){
    if(!config.manual)return [];
    const ids=new Set(players.filter(p=>!p.jailed).map(p=>p.id));
    return config.overrides.filter(o=>Number(o.round)===round&&ids.has(o.player)&&lookup(C.operations,o.operation));
  }
  function validateRound(config,round,players){
    const overrides=roundOverrides(config,round,players);const seen=new Set();
    for(const o of overrides){if(seen.has(o.player))fail('Only one guaranteed operation per player in a round.');seen.add(o.player);}
    const pool=config.operations.filter(id=>!overrides.some(o=>o.operation===id));
    if(pool.length<players.filter(p=>!p.jailed).length-overrides.length)fail('There are not enough unique operations for every active player. Enable more operations or explicitly assign manual operations.');
    if(config.operations.includes('agenda')&&!config.agendas.length&&overrides.filter(o=>o.operation==='agenda').length===0)fail('Enable at least one Hidden Agenda, or disable that operation.');
    for(const o of overrides){
      if(o.operation==='agenda'&&!config.agendas.length&&!lookup(C.agendas,o.result))fail('A guaranteed Hidden Agenda needs an enabled or explicitly assigned agenda.');
      if(Array.isArray(o.targets)&&o.targets.includes(o.player)&&!lookup(C.operations,o.operation).allowSelf)fail('An operation cannot target its own player.');
    }
    return overrides;
  }
  function createGame(roster,raw,rng=Math.random){
    const config=cleanConfig(raw);
    if(!Array.isArray(roster)||roster.length<3||roster.length>9)fail('Use 3–9 players.');
    const names=roster.map(p=>String(p.name||'').trim());
    if(names.some(n=>!n||n.length>30))fail('Give each player a name of 1–30 characters.');
    if(new Set(names.map(n=>n.toLowerCase())).size!==names.length)fail('Each player needs a different name.');
    if(new Set(roster.map(p=>p.id)).size!==roster.length)fail('Player IDs must be unique.');
    if(config.parasites>=roster.length&&!config.manual)fail('Keep at least one starting Force player.');
    const players=roster.map(p=>({id:p.id,name:p.name.trim(),team:null,special:null,jailed:false,defector:null,agenda:null,secured:[],disqualified:false}));
    if(config.manual)for(const p of players){const a=config.assignments[p.id]||{};if(['force','parasites'].includes(a.team))p.team=a.team;if(a.special==='none'||lookup(C.specials,a.special))p.special=a.special;}
    const fixedParasites=players.filter(p=>p.team==='parasites').length;
    const unassigned=shuffle(players.filter(p=>!p.team),rng);
    // Explicitly assigned teams can exceed the normal composition. Random slots fill the remaining requested count.
    const needed=unassigned.length?Math.max(0,config.parasites-fixedParasites):0;
    if(needed>unassigned.length)fail('Starting Parasite count conflicts with the manually assigned Force players. Lower the count or free a team assignment.');
    unassigned.forEach((p,i)=>p.team=i<needed?'parasites':'force');
    // Small groups receive a random subset of enabled roles, one per player.
    // Manual roles reserve their type and player before the remaining roles are dealt.
    for(const id of shuffle(config.specials,rng)){
      if(players.some(p=>p.special===id))continue;
      const eligible=players.filter(p=>p.special===null);
      if(!eligible.length){
        if(players.length<config.specials.length)break;
        fail('An enabled special role needs an available player. Free a manual special-role assignment or disable that role.');
      }
      shuffle(eligible,rng)[0].special=id;
    }
    for(const p of players){if(p.special==='none')p.special=null;p.initialTeam=p.team;}
    validateRound(config,1,players);
    return {version:1,config,players,initialParasites:players.filter(p=>p.team==='parasites').map(p=>p.id),phase:'briefing',cursor:0,round:0,turns:[],effects:{},votes:{},voters:[],history:[],winner:null,endingReason:null};
  }
  function teamWinner(g){
    const alive=active(g);const parasites=alive.filter(p=>p.team==='parasites').length;
    if(alive.length<=2)return parasites?{team:'parasites',reason:'Two or fewer players remain, with a Parasite still active.'}:{team:'force',reason:'Every active Parasite has been removed.'};
    if(g.config.singleRound)return null;
    if(!parasites)return {team:'force',reason:'Every active Parasite has been removed.'};
    if(g.config.parity&&parasites>=alive.length-parasites)return {team:'parasites',reason:'Parasites equal or outnumber the active Force.'};
    return null;
  }
  function checkEnd(g){const end=teamWinner(g);if(end){g.winner=end.team;g.endingReason=end.reason;g.phase='ended';return true;}return false;}
  function finishBriefing(g){if(g.phase!=='briefing')fail('Briefing is not active.');g.phase='round-ready';g.cursor=0;checkEnd(g);}
  function startRound(g,rng=Math.random){
    if(g.winner)fail('The game has already ended.');
    const continuation=g.phase==='discussion';
    const phases=g.config.operationPhases||1;
    if(continuation&&(g.operationCycle||1)>=phases)fail('All operation phases are complete. Begin voting.');
    if(!['round-ready','results','discussion'].includes(g.phase))fail('Finish the current round first.');
    if(checkEnd(g))return;
    const alive=active(g);const round=g.round+1;const overrides=validateRound(g.config,round,alive);
    const pool=shuffle(g.config.operations.filter(id=>!overrides.some(o=>o.operation===id)),rng);
    const turns=alive.map(p=>{const override=overrides.find(o=>o.player===p.id);return {player:p.id,operation:override?override.operation:pool.pop(),override:override?clone(override):null,targets:null,result:null,done:false};});
    g.operationCycle=continuation?(g.operationCycle||1)+1:1;
    g.votingRound=continuation?(g.votingRound||1):(g.votingRound||0)+1;
    if(!continuation){g.effects={};g.publicOperations=[];}
    g.publicOperations=g.publicOperations||[];
    g.publicOperations.push({cycle:g.operationCycle,turns:turns.map(t=>({player:t.player,operation:t.operation}))});
    g.round=round;g.phase='operations';g.cursor=0;g.turns=turns;g.votes={};g.voters=[];g.tally=null;
  }
  function resolveTargets(g,actor,count,requested=[],rng=Math.random,allowSelf=false){
    const eligible=active(g).filter(p=>allowSelf||p.id!==actor).map(p=>p.id);
    const chosen=[...new Set((Array.isArray(requested)?requested:[]).filter(id=>eligible.includes(id)))].slice(0,count);
    chosen.push(...shuffle(eligible.filter(id=>!chosen.includes(id)),rng).slice(0,count-chosen.length));
    if(chosen.length<count)fail('There are not enough active targets for this operation.');
    return chosen;
  }
  function prepareTurn(g,index=g.cursor,rng=Math.random){
    if(g.phase!=='operations'||index!==g.cursor)fail('This operation is not the current turn.');
    const turn=g.turns[index];const op=lookup(C.operations,turn.operation);
    if(turn.targets===null&&(op.kind==='random'||(turn.override&&turn.override.targets&&turn.override.targets.length)))turn.targets=resolveTargets(g,turn.player,op.targets,turn.override?.targets,rng,op.allowSelf);
    return turn;
  }
  function switchTeam(p,team,asDefector=false){
    if(p.team===team)return;
    p.team=team;p.defector=asDefector?team:null;
  }
  function runOperation(g,{targets=[],choice=null}={},rng=Math.random){
    const turn=prepareTurn(g,g.cursor,rng);if(turn.done)fail('This operation is already complete.');
    const op=lookup(C.operations,turn.operation);const p=player(g,turn.player);
    const forced=turn.override?.result??null;
    const picked=turn.targets!==null?turn.targets:resolveTargets(g,p.id,op.targets,targets,rng,op.allowSelf);
    if(op.kind==='choose'&&turn.targets===null&&(!Array.isArray(targets)||targets.length!==op.targets||new Set(targets).size!==targets.length||targets.some(id=>!active(g).some(t=>t.id===id&&(op.allowSelf||id!==p.id)))))fail(`Choose ${op.targets} different active player${op.targets===1?'':'s'}.`);
    turn.targets=picked;const people=picked.map(id=>player(g,id));let result;
    const seenTeam=target=>hasSpecial(p,'counterintel')?target.team:apparent(target);
    const invert=answer=>hasSpecial(p,'source')?!answer:answer;
    switch(op.id){
      case 'tip':{
        const natural=seenTeam(people[0]);
        result={type:'intel',team:['force','parasites'].includes(forced)?forced:hasSpecial(p,'source')?other(natural):natural,targets:picked};break;
      }
      case 'confession':result={type:'confession',team:['force','parasites'].includes(forced)?forced:p.team,targets:picked};break;
      case 'intel':case 'encounter':{
        const group=op.id==='encounter'?[p,...people]:people;
        result={type:'presence',parasite:['yes','no'].includes(forced)?forced==='yes':invert(group.some(t=>seenTeam(t)==='parasites')),targets:picked};break;
      }
      case 'danish':result={type:'match',same:['same','different'].includes(forced)?forced==='same':invert(seenTeam(people[0])===seenTeam(people[1])),targets:picked};break;
      case 'majority':{
        const natural=people.filter(t=>seenTeam(t)==='parasites').length>=2?'parasites':'force';
        result={type:'majority',team:['force','parasites'].includes(forced)?forced:hasSpecial(p,'source')?other(natural):natural,targets:picked};break;
      }
      case 'chain':result={type:'match',same:['same','different'].includes(forced)?forced==='same':invert(seenTeam(p)===seenTeam(people[0])),targets:[p.id,...picked]};break;
      case 'threat':result={type:'threat',opposing:['yes','no'].includes(forced)?forced==='yes':invert(people.some(t=>seenTeam(t)!==p.team)),targets:picked};break;
      case 'cross':{
        const eligible=active(g).filter(t=>t.id!==p.id&&t.id!==picked[0]);
        const extra=eligible.find(t=>t.id===turn.override?.targets?.[1])||shuffle(eligible,rng)[0];if(!extra)fail('Cross-Reference needs a third active player.');
        result={type:'match',same:['same','different'].includes(forced)?forced==='same':invert(seenTeam(people[0])===seenTeam(extra)),targets:[...picked,extra.id]};break;
      }
      case 'audit':{
        const alive=active(g),natural=alive.filter(t=>seenTeam(t)==='parasites').length;
        const count=forced!==null&&/^\d+$/.test(String(forced))?Number(forced):hasSpecial(p,'source')?alive.length-natural:natural;
        if(count>alive.length)fail('Internal Audit count cannot exceed the active player count.');
        result={type:'audit',count,total:alive.length,targets:[]};break;
      }
      case 'background':case 'loyalties':{
        const target=people[0];const natural=op.id==='background'?!!target.special||!!target.specials?.length:!!target.agenda||!!target.secured?.length;
        result={type:'fact',fact:op.id,answer:['yes','no'].includes(forced)?forced==='yes':invert(natural),targets:picked};break;
      }
      case 'personnel':{
        const target=people[0],facts=[{key:'team',positive:'They are Force.',negative:'They are a Parasite.',truth:seenTeam(target)==='force'},{key:'special',positive:'They have a hidden special role.',negative:'They have no hidden special role.',truth:!!target.special||!!target.specials?.length},{key:'agenda',positive:'They have a personal victory condition or secured personal win.',negative:'They follow their team’s usual victory condition.',truth:!!target.agenda||!!target.secured?.length}];
        const selected=shuffle(facts,rng).slice(0,2);const corrupted=forced==='false'||hasSpecial(p,'source')&&!['normal','true'].includes(forced);
        const statements=selected.map((fact,i)=>{const truthful=forced==='true'||!corrupted&&i===0;return truthful===fact.truth?fact.positive:fact.negative;});
        result={type:'personnel',statements:shuffle(statements,rng),targets:picked};break;
      }
      case 'evidence':{
        const effect=['shield','double'].includes(forced)?forced:choice;
        if(!['shield','double'].includes(effect))fail('Choose protection or a double vote.');
        const entry=g.effects[picked[0]]||(g.effects[picked[0]]={shield:0,double:0});entry[effect]++;
        result={type:'evidence',effect,targets:picked};break;
      }
      case 'defector':{
        const decision=['switch','stay'].includes(forced)?forced:choice;
        if(!['switch','stay'].includes(decision))fail('Choose whether to switch teams.');
        if(decision==='switch')switchTeam(p,other(p.team),true);
        result={type:'defector',switched:decision==='switch',team:p.team,defector:p.defector};break;
      }
      case 'transfer':{
        if(!hasSpecial(p,'fixed')&&!hasSpecial(people[0],'fixed')){
          const team=p.team;switchTeam(p,people[0].team);switchTeam(people[0],team);
        }
        result={type:'transfer',targets:picked};break;
      }
      case 'agenda':{
        const agenda=lookup(C.agendas,forced)?forced:shuffle(g.config.agendas,rng)[0];
        if(!agenda)fail('No Hidden Agenda is enabled.');
        if(agenda==='sleeper'){switchTeam(p,other(p.team));p.agenda=null;result={type:'agenda',agenda,team:p.team};}
        else{
          const target=['infatuation','grudge'].includes(agenda)?resolveTargets(g,p.id,1,turn.override?.targets,rng)[0]:null;
          p.agenda={id:agenda,target,round:g.round};result={type:'agenda',agenda,target};
        }break;
      }
      default:fail('This operation has no rules handler.');
    }
    turn.result=result;turn.done=true;return result;
  }
  function finishTurn(g){
    if(g.phase!=='operations'||!g.turns[g.cursor]?.done)fail('Complete the operation before passing the phone.');
    g.cursor++;if(g.cursor>=g.turns.length){g.phase='discussion';g.cursor=0;checkEnd(g);}
  }
  function startVoting(g){
    if(g.phase!=='discussion')fail('Voting follows discussion.');
    if((g.operationCycle||1)<(g.config.operationPhases||1))fail('Complete all operation phases before voting.');
    g.voters=active(g).filter(p=>!(p.team==='force'&&p.defector==='force')).map(p=>p.id);g.cursor=0;g.phase='voting';
    if(!g.voters.length)resolveVotes(g);
  }
  function vote(g,target){
    if(g.phase!=='voting')fail('Voting is not active.');
    const voter=g.voters[g.cursor];if(!voter)fail('There is no voter on this turn.');
    if(voter===target||!active(g).some(p=>p.id===target))fail('Vote for a different active player.');
    if(Object.hasOwn(g.votes,voter))fail('This player has already voted.');
    g.votes[voter]=target;g.cursor++;if(g.cursor>=g.voters.length)resolveVotes(g);
  }
  function resolveVotes(g){
    const alive=active(g);const totals=Object.fromEntries(alive.map(p=>[p.id,0]));const raw={...totals};
    for(const [voter,target] of Object.entries(g.votes)){
      const weight=g.effects[voter]?.double?2:1;totals[target]+=weight;raw[target]+=weight;
      const targetPlayer=player(g,target);const voterPlayer=player(g,voter);
      if(targetPlayer.team==='parasites'&&targetPlayer.defector==='parasites'&&voterPlayer.team==='parasites')targetPlayer.disqualified=true;
    }
    for(const p of alive)totals[p.id]=Math.max(0,totals[p.id]-(g.effects[p.id]?.shield||0));
    const max=Math.max(0,...Object.values(totals));const leaders=max>0?alive.filter(p=>totals[p.id]===max):[];
    const jailed=leaders.length===1?leaders[0]:null;
    if(jailed){
      jailed.jailed=true;
      if(jailed.agenda?.id==='scapegoat')jailed.secured.push({id:'scapegoat',round:g.round});
      for(const p of g.players)if(p.agenda?.id==='grudge'&&p.agenda.target===jailed.id)p.secured.push({id:'grudge',round:g.round});
    }
    // Public results contain totals and an actual jailing reveal, never voter identities or private operations.
    g.tally={round:g.round,totals,raw,jailed:jailed?.id||null,reveal:jailed?.team||null,tie:leaders.length>1,noVotes:max===0};
    g.history.push(clone(g.tally));g.phase='results';g.cursor=0;
    const end=g.config.singleRound?{team:jailed?other(jailed.team):'draw',reason:jailed?`${jailed.name} was jailed as ${jailed.team==='force'?'Force':'a Parasite'}. The one-voting-round rule gives ${jailed.team==='force'?'the Parasites':'the Force'} victory.`:'The voting round ended without anyone being jailed. Neither team wins.'}:teamWinner(g);
    if(end){g.winner=end.team;g.endingReason=end.reason;}
    return g.tally;
  }
  function outcomes(g){
    if(!g.winner)fail('The game has not ended.');
    const status=new Map();
    for(const p of g.players){
      if(p.disqualified)status.set(p.id,{win:false,reason:'A Parasite teammate voted for this Parasite Defector.'});
      else if(p.secured.length)status.set(p.id,{win:true,reason:`Personal win secured: ${lookup(C.agendas,p.secured[0].id).name}.`});
      else if(!p.agenda)status.set(p.id,{win:p.team===g.winner,draw:g.winner==='draw',reason:g.winner==='draw'?'Neither team won the voting round.':`${p.team==='force'?'Force':'Parasites'} allegiance at game end.`});
      else if(['scapegoat','grudge'].includes(p.agenda.id))status.set(p.id,{win:false,reason:'Personal jailing condition was not fulfilled.'});
    }
    // Infatuation follows the target's personal result. A closed cycle has no independent result;
    // its members use their own final team result. Documented in the field guide.
    const pending=g.players.filter(p=>!status.has(p.id));
    let progress=true;
    while(progress){progress=false;for(const p of pending){if(status.has(p.id))continue;const target=status.get(p.agenda.target);if(target){status.set(p.id,{win:target.win,draw:!!target.draw,reason:`Shares ${player(g,p.agenda.target).name}'s result.`});progress=true;}}}
    for(const p of pending)if(!status.has(p.id)){
      const path=[];let current=p;
      while(current&&!status.has(current.id)&&!path.includes(current.id)){path.push(current.id);current=player(g,current.agenda?.target);}
      const cycleAt=current?path.indexOf(current.id):-1;
      if(cycleAt>=0)for(const id of path.slice(cycleAt)){const member=player(g,id);status.set(id,{win:member.team===g.winner,draw:g.winner==='draw',reason:'Infatuation loop: final team result applies.'});}
      for(let i=path.length-1;i>=0;i--)if(!status.has(path[i])){const member=player(g,path[i]);const target=status.get(member.agenda?.target);status.set(member.id,{win:target?target.win:member.team===g.winner,draw:target?!!target.draw:g.winner==='draw',reason:target?`Shares ${player(g,member.agenda.target).name}'s result.`:'Final team result applies.'});}
    }
    return g.players.map(p=>({id:p.id,name:p.name,team:p.team,special:p.special,jailed:p.jailed,agenda:p.agenda,defector:p.defector,...status.get(p.id)}));
  }
  const api={clone,shuffle,cleanConfig,createGame,validateRound,active,player,hasSpecial,apparent,teamWinner,checkEnd,finishBriefing,startRound,prepareTurn,resolveTargets,runOperation,finishTurn,startVoting,vote,resolveVotes,outcomes};
  root.QAEngine=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
