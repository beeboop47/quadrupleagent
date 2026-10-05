(function(){
  'use strict';
  const C=QACatalogue,E=QAEngine,$=id=>document.getElementById(id),main=$('main'),modal=$('modal');
  const STORE='quadruple-agent.v1';
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const teamName=team=>team==='force'?'Force':'Parasites';
  const find=(list,id)=>list.find(item=>item.id===id);
  const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const defaultRoster=()=>[1,2,3,4].map(n=>({id:`p${n}`,name:`Player ${n}`}));
  let saved={};try{saved=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{}
  let roster=Array.isArray(saved.roster)&&saved.roster.length>=3&&saved.roster.length<=9?saved.roster:defaultRoster();
  let config=E.cleanConfig(saved.config||C.defaults),customs=Array.isArray(saved.customs)?saved.customs:[];
  let game=saved.game?.version===1&&Array.isArray(saved.game.players)?saved.game:null;
  let view='setup',presetId=saved.presetId||'default',revealed=false,selected=[],choice=null,jointGate=false,error='',modalTab='config',modalMode='settings',toastTimeout;
  let storageAvailable=true;
  function persist(){try{localStorage.setItem(STORE,JSON.stringify({roster,config,customs,game,presetId}));}catch{storageAvailable=false;}}
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').hidden=true,3500);}
  let audioPrefs={enabled:true,volume:.28};try{audioPrefs={...audioPrefs,...JSON.parse(localStorage.getItem('quadruple-agent.audio')||'{}')};}catch{}
  function saveAudio(){try{localStorage.setItem('quadruple-agent.audio',JSON.stringify(audioPrefs));}catch{}}
  const music=QAMusic.create({volume:audioPrefs.volume,onChange(state){$('music-button').textContent=state.loading?'Music loading…':state.enabled?'Music on':'Music off';$('music-button').setAttribute('aria-pressed',String(state.enabled));$('music-volume').value=String(Math.round(state.volume*100));},onError(message){$('music-status').textContent=message;}});
  $('music-volume').value=String(Math.round(audioPrefs.volume*100));
  $('music-button').addEventListener('click',()=>{const playing=music.getState().enabled;audioPrefs.enabled=!playing;saveAudio();$('music-status').textContent='';if(playing)music.stop();else void music.start();});
  $('music-volume').addEventListener('input',event=>{audioPrefs.volume=Number(event.target.value)/100;music.setVolume(audioPrefs.volume);saveAudio();});
  function markCustom(){presetId='custom';persist();}
  function resetPrivate(){revealed=false;selected=[];choice=null;jointGate=false;error='';}
  function button(label,action,cls='btn wide',attrs=''){return `<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;}
  function options(list,value,blank='Random'){return `<option value="">${blank}</option>`+list.map(x=>`<option value="${esc(x.id)}" ${x.id===value?'selected':''}>${esc(x.name)}</option>`).join('');}
  function operationCount(){return config.operations.length;}
  function errorBlock(){return error?`<div class="error" role="alert">${esc(error)}</div>`:'';}
  function setup(){
    const chosen=find(C.presets,presetId)||find(customs,presetId);
    return `<div class="setup-grid"><section><div class="eyebrow">Shared-phone social deduction</div><h1 class="title">Quadruple<br><span>Agent.</span></h1><p class="intro">The Force is compromised. Pass the phone, gather intelligence, and decide who to trust.</p>
      ${game&&game.phase!=='ended'?`<div class="notice row between"><span>Game in progress${game.round?` · Round ${game.round}`:''}</span>${button('Resume','resume','pill')}</div>`:''}
      <div class="presets">${C.presets.map(p=>`<button class="preset ${presetId===p.id?'selected':''}" data-action="preset" data-id="${p.id}" aria-pressed="${presetId===p.id}"><b>${p.name}</b><span>${p.description}</span></button>`).join('')}</div>
      <div class="row between" style="margin-bottom:26px"><span class="small muted">${chosen?esc(chosen.name):presetId==='default'?'Default configuration':'Custom configuration'} · ${operationCount()} operations${config.manual?' · Manual mode':''}</span>${button('Presets','presets','pill')}</div>
      <div class="panel-title"><h2>Your players</h2><span class="count">${roster.length} / 9</span></div>
      <div class="stack">${roster.map((p,i)=>`<div class="player-row"><span class="player-number">${String(i+1).padStart(2,'0')}</span><input aria-label="Player ${i+1} name" autocomplete="off" maxlength="30" value="${esc(p.name)}" data-name="${esc(p.id)}"><button class="remove" aria-label="Remove ${esc(p.name)}" data-action="remove" data-id="${esc(p.id)}" ${roster.length<=3?'disabled':''}>×</button></div>`).join('')}</div>
      <button class="add" data-action="add" ${roster.length>=9?'disabled':''}>+ Add player</button>
      <div class="setting-row" style="margin-top:24px"><div>Starting Parasites${config.manual?'<div class="small muted">Manual teams count toward this total.</div>':''}</div><div class="stepper"><button data-action="less" aria-label="Fewer Parasites" ${config.parasites<=1?'disabled':''}>−</button><span>${config.parasites}</span><button data-action="more" aria-label="More Parasites" ${config.parasites>=roster.length-1?'disabled':''}>+</button></div></div>
      ${errorBlock()}${!storageAvailable?'<div class="notice">Browser storage is unavailable. Export your configuration to keep it.</div>':''}
      ${button('Begin briefing','start','btn wide launch')}<p class="launch-note">3–9 players · Pass & play · Private identities</p>
      </section><aside class="setup-aside"><div class="panel"><div class="panel-title"><h3>Rules of engagement</h3><span class="unclassified">CLASSIFIED</span></div>${[['Operations','Everyone gets a unique private operation.'],['Discussion','Share your intel. Or sell a convincing lie.'],['Voting','Cast private votes. Reveal anonymous totals.']].map((r,i)=>`<div class="rule"><span class="number">0${i+1}</span><div><b>${r[0]}</b><p>${r[1]}</p></div></div>`).join('')}<div class="team-line"><span class="chip force">THE FORCE</span><span class="muted small">vs.</span><span class="chip parasites">PARASITES</span></div></div><div class="notice">Parasites recognise each other at the start. Team changes stay secret.</div><div class="notice">${config.parity?'Parasites win at equal numbers.':'Parasite parity victory is off.'} At two active players, the game always ends.</div></aside></div>`;
  }
  function phaseStrip(){const phase=game.phase;return `<div class="phase-strip"><span>ROUND ${game.round||'—'}</span>${[['operations','Operations'],['discussion','Discussion'],['voting','Voting']].map(([id,name])=>`<span class="${phase===id?'current':''}">${name}</span>`).join('')}</div>`;}
  const lock=`<div class="seal" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="7" y="14" width="18" height="14" rx="3"/><path d="M11 14V9a5 5 0 0 1 10 0v5M16 20v3"/></svg></div>`;
  function handover(names,caption,action='reveal'){return `<div class="handover">${lock}<div class="eyebrow">Private handover</div><p class="muted">${caption}</p><h1>${names.map(esc).join('<br><span class="muted" style="font-size:1.2rem">&</span><br>')}</h1><p class="muted small">${names.length>1?'Only these two players should look at the screen.':'Everyone else, look away.'}</p>${button(names.length>1?'We’re ready':'I’m '+esc(names[0]),action)}<p class="small muted" style="margin:16px 0 0">The next screen contains private information.</p></div>`;}
  function briefing(){
    const p=game.players[game.cursor];
    if(!revealed)return handover([p.name],'Pass the phone to');
    
    const teammates=game.initialParasites.filter(id=>id!==p.id).map(id=>E.player(game,id).name);
    return `<div class="eyebrow">Initial briefing · ${game.cursor+1} / ${game.players.length}</div><h1>Your allegiance</h1><div class="secret ${p.team}"><div class="micro muted">Eyes only / ${esc(p.name)}</div><div class="team-name ${p.team==='parasites'?'red':'blue'}">${teamName(p.team)}</div><p>${p.team==='force'?'Find and jail the Parasites. Your teammates are unknown.':'Stay hidden and take control of the Force.'}</p>${p.team==='parasites'?`<hr class="divider"><h3>Your starting ${teammates.length===1?'teammate':'teammates'}</h3><p>${teammates.length?teammates.map(esc).join(', '):'You are the only starting Parasite.'}</p><p class="small muted">This is your only teammate briefing. Later team changes stay secret.</p>`:''}</div>${button('Conceal & pass','brief-next')}<p class="small muted center" style="margin:14px 0">Remember your allegiance before continuing.</p>`;
  }
  function roundReady(){return `<div class="eyebrow">Round ${game.round+1} / Ready</div><h1>New round.<br>Fresh intelligence.</h1><p class="muted">Everyone gets one operation. Complete it privately, then conceal the screen and pass the phone.</p><div class="public-roster">${game.players.map(p=>`<span class="${p.jailed?'jailed':''}">${esc(p.name)}${p.jailed?' · jailed':''}</span>`).join('')}</div>${game.config.manual?`<div class="notice">Manual mode is active. Round overrides replace unavailable targets automatically.</div>${button('Edit round overrides','game-overrides','btn secondary wide')}`:''}${errorBlock()}${button('Start operations','round-start','btn wide launch')}`;}
  function targetButtons(ids,limit){return `<div class="target-list">${ids.map(id=>{const p=E.player(game,id),on=selected.includes(id);return `<button class="target ${on?'selected':''}" data-action="target" data-id="${esc(id)}" data-limit="${limit}" aria-pressed="${on}"><span class="avatar">${String(game.players.indexOf(p)+1).padStart(2,'0')}</span><span class="target-name">${esc(p.name)}</span><span class="selection" aria-hidden="true"></span></button>`;}).join('')}</div>`;}
  function operations(){
    const turn=game.turns[game.cursor],p=E.player(game,turn.player),op=find(C.operations,turn.operation);
    const together=(turn.done&&['confession','encounter'].includes(op.id))||jointGate;
    if(!revealed){
      const partners=together?[p.name,...(turn.targets||[]).map(id=>E.player(game,id).name)]:[p.name];
      return handover(partners,together?'Read the next screen together':'Pass the phone to');
    }
    if(turn.done)return operationResult(turn);
    const forced=turn.override?.result;
    const fixed=turn.targets!==null&&op.targets>0;
    let body=`<div class="eyebrow">Operation ${game.cursor+1} / ${game.turns.length} · ${esc(p.name)}</div><h1>${op.name}</h1><p class="muted">${op.description}</p>`;
    if(op.kind==='choose'&&op.targets){
      if(fixed)body+=`<div class="notice">Your ${op.targets===1?'target is':'targets are'} ${turn.targets.map(id=>esc(E.player(game,id).name)).join(' and ')}.</div>`;
      else body+=`<p class="small accent">Choose ${op.targets===1?'one player':'two players'}${op.targets===2?` · ${selected.length}/2 selected`:''}</p>${targetButtons(E.active(game).filter(t=>t.id!==p.id).map(t=>t.id),op.targets)}`;
    }
    if(op.id==='evidence'){
      const effect=['shield','double'].includes(forced)?forced:choice;
      body+=`<div class="presets"><button class="preset ${effect==='shield'?'selected':''}" data-action="choice" data-choice="shield" ${forced?'disabled':''}><b>Shield</b><span>Subtract 1 vote against them</span></button><button class="preset ${effect==='double'?'selected':''}" data-action="choice" data-choice="double" ${forced?'disabled':''}><b>Double vote</b><span>Their own vote counts as 2</span></button></div>`;
    }
    if(op.id==='defector'){
      const decision=['switch','stay'].includes(forced)?forced:choice;
      body+=`<div class="notice">Force Defectors cannot vote while Force. Parasite Defectors permanently lose if any current Parasite votes for them. Other players will not be told.</div><div class="presets"><button class="preset ${decision==='stay'?'selected':''}" data-action="choice" data-choice="stay" ${forced?'disabled':''}><b>Stay</b><span>Keep your current allegiance</span></button><button class="preset ${decision==='switch'?'selected':''}" data-action="choice" data-choice="switch" ${forced?'disabled':''}><b>Defect</b><span>Switch to the other team</span></button></div>`;
    }
    if(op.id==='encounter')body+=`<div class="notice">Your partner: <strong>${esc(E.player(game,turn.targets[0]).name)}</strong>. Both of you must read the result together.</div>`;
    const ready=(op.kind!=='choose'||fixed||selected.length===op.targets)&&(!['evidence','defector'].includes(op.id)||choice||forced);
    body+=errorBlock()+button(op.id==='encounter'?'Invite partner & conceal':op.id==='confession'?'Conceal for confession':'Complete operation','operate','btn wide',ready?'':'disabled');return body;
  }
  function operationResult(turn){
    const r=turn.result,p=E.player(game,turn.player),op=find(C.operations,turn.operation),names=(r.targets||[]).map(id=>E.player(game,id).name);let headline='',detail='';
    switch(r.type){
      case 'intel':headline=teamName(r.team);detail=`${esc(names[0])} appears to belong to the ${r.team==='force'?'Force':'Parasites'}.`;break;
      case 'confession':headline=`${esc(p.name)} is ${r.team==='force'?'Force':'a Parasite'}.`;detail=`${esc(names[0])}, this is ${esc(p.name)}’s actual allegiance.`;break;
      case 'presence':headline=r.parasite?'A Parasite is present.':'No Parasite detected.';detail=`${turn.operation==='encounter'?[p.name,...names].map(esc).join(' and '):names.map(esc).join(' and ')}: ${r.parasite?'at least one appears to be a Parasite.':'both appear to be Force.'}`;break;
      case 'match':headline=r.same?'Same team.':'Different teams.';detail=`${names.map(esc).join(' and ')} appear to work for ${r.same?'the same team':'different teams'}.`;break;
      case 'evidence':headline=r.effect==='shield'?'One vote of protection.':'A vote with double effect.';detail=r.effect==='shield'?`One vote will be subtracted from ${esc(names[0])}’s total this round.`:`${esc(names[0])}’s own vote counts as two this round.`;break;
      case 'defector':headline=r.switched?`You are now ${r.team==='force'?'Force':'a Parasite'}.`:'Allegiance unchanged.';detail=r.switched?(r.team==='force'?'You are a Force Defector. You cannot vote while you remain Force.':'You are a Parasite Defector. If any current Parasite votes for you, you permanently lose.'):'You chose to stay on your current team.';break;
      case 'transfer':headline='Transfer complete.';detail=`Your team was swapped with ${esc(names[0])}’s. Neither allegiance is disclosed. If both teams matched, no allegiance changed.`;break;
      case 'agenda':{
        const agenda=find(C.agendas,r.agenda);headline=agenda.name;
        if(r.agenda==='sleeper')detail=`You immediately switched teams. You are now <strong>${teamName(r.team)}</strong>, and your new team determines your victory.`;
        else if(r.agenda==='scapegoat')detail='Your new goal: get jailed in a vote. This secures your personal win immediately, regardless of your team.';
        else if(r.agenda==='grudge')detail=`Your target is <strong>${esc(E.player(game,r.target).name)}</strong>. Secure your personal win when they are jailed, regardless of your team.`;
        else detail=`You share <strong>${esc(E.player(game,r.target).name)}</strong>’s personal victory or loss, regardless of either player’s allegiance.`;
        if(p.secured.length)detail+='<br>Your earlier secured personal win is retained.';
        break;
      }
    }
    return `<div class="eyebrow">${op.name} / Eyes only</div><h1>Intelligence received.</h1><div class="secret"><div class="micro muted">${esc(p.name)}${['confession','encounter'].includes(turn.operation)?' & '+names.map(esc).join(', '):''}</div><div class="big-result">${headline}</div><p>${detail}</p></div>${['intel','presence','match'].includes(r.type)?'<p class="small muted">Special roles can disguise allegiance. Information reflects the moment this operation was completed.</p>':''}${r.type==='agenda'&&r.agenda!=='sleeper'?'<p class="small muted">This replaces your personal victory condition. Your allegiance still determines team counts and intel. A later Hidden Agenda replaces an unfinished one.</p>':''}${button('Conceal & pass','op-next')}`;
  }
  function discussion(){
    return `<div class="eyebrow">Discussion / Everyone may look</div><h1>Compare stories.<br>Question everything.</h1><p class="muted">Share what you learned, or tell a convincing lie. Decide who should be jailed.</p><div class="panel center"><div class="micro muted">Discussion timer · optional</div><div class="timer" id="timer">${timerText()}</div><div class="row" style="justify-content:center">${button(game.timer?.running?'Pause':'Start','timer-toggle','pill')}${button('Reset','timer-reset','pill')}</div></div><div class="public-roster">${E.active(game).map(p=>`<span>${esc(p.name)}</span>`).join('')}</div><p class="small muted">Votes are private. Ties jail nobody. No self-votes. A jailed player’s actual allegiance is revealed.</p>${button('Begin private voting','voting-start','btn wide launch')}`;
  }
  function voting(){
    const p=E.player(game,game.voters[game.cursor]);
    if(!revealed)return handover([p.name],'Pass the phone to vote');
    return `<div class="eyebrow">Private vote ${game.cursor+1} / ${game.voters.length}</div><h1>Who do you<br>want to jail?</h1><p class="muted">${esc(p.name)}, choose another active player. Your vote will be revealed only as an anonymous total.</p>${targetButtons(E.active(game).filter(t=>t.id!==p.id).map(t=>t.id),1)}${errorBlock()}${button('Lock vote & conceal','cast-vote','btn wide',selected.length===1?'':'disabled')}`;
  }
  function results(){
    const tally=game.tally,jailed=tally.jailed?E.player(game,tally.jailed):null;
    return `<div class="eyebrow">Round ${game.round} / Anonymous results</div><h1>${jailed?esc(jailed.name)+' is jailed.':tally.tie?'A tie. Nobody jailed.':'Nobody is jailed.'}</h1>${jailed?`<div class="notice"><span class="chip ${tally.reveal}">${teamName(tally.reveal).toUpperCase()}</span> <span style="margin-left:8px">Actual allegiance revealed</span></div>`:'<p class="muted">'+(tally.tie?'The highest total was shared.':'No player received a positive final total.')+'</p>'}<div class="panel"><div class="panel-title"><h3>Final vote totals</h3><span class="count">ROUND ${game.round}</span></div>${Object.entries(tally.totals).sort((a,b)=>b[1]-a[1]).map(([id,total])=>`<div class="results-row"><span class="name">${esc(E.player(game,id).name)}${id===tally.jailed?' <span class="red small">JAILED</span>':''}</span><span class="vote-total">${total}</span></div>`).join('')}<p class="small muted" style="margin:18px 0 0">Double votes and protection are included. Voter identities remain concealed.</p></div>${game.winner?`<div class="notice">The game has ended. ${esc(game.endingReason)}</div>${button('Reveal final outcomes','final-results','btn wide launch')}`:`<p class="muted small" style="margin:20px 0">${E.active(game).length} players remain. Any personal wins stay secret until the game ends.</p>${game.config.manual?button('Edit round overrides','game-overrides','btn secondary wide'):''}${errorBlock()}${button('Next round','round-start','btn wide launch')}`}`;
  }
  function ended(){const outcomes=E.outcomes(game);return `<div class="eyebrow">Case closed / Everyone may look</div><h1 class="${game.winner==='force'?'blue':'red'}">${teamName(game.winner)} win.</h1><p class="muted">${esc(game.endingReason)}</p><div class="notice">Personal agendas can give players a different result from their team.</div>${outcomes.map(p=>`<div class="result-detail"><div class="row between"><h3 style="margin:0">${esc(p.name)}</h3><span class="chip ${p.win?'force':'parasites'}">${p.win?'WIN':'LOSS'}</span></div><p class="small muted" style="margin:8px 0">${teamName(p.team)}${p.jailed?' · Jailed':''}${p.agenda?' · '+find(C.agendas,p.agenda.id).name:''}${p.defector?' · '+teamName(p.defector)+' Defector':''}</p><p class="small">${esc(p.reason)}</p></div>`).join('')}${button('Play again','play-again','btn wide launch')}`;}
  function render(){
    $('settings-button').textContent=view==='setup'?'Settings':'Controls';
    if(view==='setup'){main.innerHTML=setup();return;}
    const fn={briefing, 'round-ready':roundReady,operations,discussion,voting,results,ended}[game.phase];
    main.innerHTML=`<section class="game-view">${['briefing','ended'].includes(game.phase)?'':phaseStrip()}${fn?fn():'<p>Unable to resume this game.</p>'}</section>`;
  }
  function openModal(title,html,mode){modalMode=mode;$('modal-title').textContent=title;$('modal-body').innerHTML=html;if(!modal.open)modal.showModal();}
  function closeModal(){modal.close();error='';}
  function settings(tab='config'){
    modalTab=tab;
    if(view==='playing'){resetPrivate();render();openModal('Game controls',`<p class="muted">The current game is saved on this browser. Returning to setup keeps it available to resume.</p>${game.config.manual&&['round-ready','results'].includes(game.phase)&&!game.winner?button('Edit upcoming round overrides','game-overrides','btn secondary wide'):''}${button('Return to setup','leave','btn secondary wide launch')}${button('Conceal screen','conceal','btn wide launch')}`,'controls');return;}
    const tabs=`<div class="tabbar" role="tablist">${[['config','Rules'],['manual','Manual mode'],['presets','Saved presets']].map(([id,label])=>`<button role="tab" aria-selected="${tab===id}" class="${tab===id?'active':''}" data-action="settings-tab" data-tab="${id}">${label}</button>`).join('')}</div>`;
    let body=tab==='config'?configForm():tab==='manual'?manualForm(config,roster,false):presetsForm();
    openModal('Game settings',tabs+body+errorBlock()+(tab==='presets'?'':`<div class="modal-foot">${button('Done','settings-done')}</div>`),'settings');
  }
  function checklist(list,key){return list.map(item=>`<div class="check-row"><input type="checkbox" id="toggle-${item.id}" data-list="${key}" data-id="${item.id}" ${config[key].includes(item.id)?'checked':''}><label for="toggle-${item.id}">${item.name}<p>${item.description}</p></label></div>`).join('');}
  function configForm(){return `<div class="check-row"><input type="checkbox" id="parity" data-config="parity" ${config.parity?'checked':''}><label for="parity">Parasite parity victory<p>End when active Parasites equal or outnumber the Force.</p></label></div><div class="notice">Always ends at two active players. Any remaining Parasite gives the Parasites the team victory. No remaining Parasites gives the Force victory.</div><label>Discussion timer (minutes, 0 to disable)<input type="number" min="0" max="30" data-config="discussionMinutes" value="${config.discussionMinutes}"></label><hr class="divider"><h3>Operations</h3><p class="small muted">One unique operation per active player. Enable enough for your group.</p>${checklist(C.operations,'operations')}<hr class="divider"><h3>Hidden Agenda outcomes</h3><p class="small muted">A new agenda replaces that player’s unfinished condition. Secured personal wins are retained.</p>${checklist(C.agendas,'agendas')}<hr class="divider"><h3>Special roles</h3><p class="small muted">Special roles are off by default. Each enabled role is guaranteed, with at most one of each. Players are never told their special role. Explicit manual assignments can exceed this limit.</p>${checklist(C.specials,'specials')}`;}
  function resultOptions(operation){
    if(['tip','confession'].includes(operation))return [{id:'force',name:'Force'},{id:'parasites',name:'Parasites'}];
    if(['intel','encounter'].includes(operation))return [{id:'yes',name:'Parasite present'},{id:'no',name:'No Parasite detected'}];
    if(operation==='danish')return [{id:'same',name:'Same team'},{id:'different',name:'Different teams'}];
    if(operation==='agenda')return C.agendas;
    if(operation==='evidence')return [{id:'shield',name:'Subtract one vote'},{id:'double',name:'Double their own vote'}];
    if(operation==='defector')return [{id:'stay',name:'Stay'},{id:'switch',name:'Switch teams'}];
    return [];
  }
  function manualForm(cfg,people,duringGame){
    let body=duringGame?`<p class="muted">Upcoming round: <strong>${game.round+1}</strong>. Only active players get operations. Jailed targets are replaced with random eligible players.</p>`:`<div class="check-row"><input type="checkbox" id="manual-toggle" data-config="manual" ${cfg.manual?'checked':''}><label for="manual-toggle">Enable manual mode<p>Override any part of setup or a round. Everything else stays random.</p></label></div>`;
    if(!cfg.manual)return body+'<div class="notice">Enable manual mode to assign teams, special roles, operations and results.</div>';
    body+=`<div class="notice">These assignments are private. Set them before the group looks at the screen. Explicit assignments can use disabled content or exceed normal limits.</div>`;
    if(!duringGame){body+='<h3>Starting assignments</h3>';for(const p of people){const a=cfg.assignments[p.id]||{};body+=`<div class="override"><h3>${esc(p.name)}</h3><div class="field-grid"><label>Allegiance<select data-assignment="team" data-id="${esc(p.id)}">${options([{id:'force',name:'Force'},{id:'parasites',name:'Parasites'}],a.team)}</select></label><label>Special role<select data-assignment="special" data-id="${esc(p.id)}">${options([{id:'none',name:'No special role'},...C.specials],a.special)}</select></label></div></div>`;}}
    body+=`<hr class="divider"><div class="panel-title"><h3>Guaranteed operations</h3><span class="count">${cfg.overrides.length}</span></div><p class="small muted">Choose a round and player. Random targets and results stay available. If the player is jailed, the whole assignment is skipped.</p>`;
    if(!cfg.overrides.length)body+='<div class="empty">No overrides. Operations stay random.</div>';
    cfg.overrides.forEach((o,index)=>{
      const op=find(C.operations,o.operation);const targetCount=op?.id==='agenda'?(['grudge','infatuation'].includes(o.result)?1:0):op?.targets||0;
      const candidates=people.filter(p=>p.id!==o.player).map(p=>({id:p.id,name:p.name+(p.jailed?' (jailed → random replacement)':'')}));
      const choices=resultOptions(o.operation);
      body+=`<div class="override"><button class="remove" data-action="override-remove" data-index="${index}" aria-label="Remove override ${index+1}">×</button><h3>Override ${index+1}</h3><div class="field-grid"><label>Round<input type="number" min="${duringGame?game.round+1:1}" max="999" data-override="round" data-index="${index}" value="${Number(o.round)||1}"></label><label>Player<select data-override="player" data-index="${index}">${people.map(p=>`<option value="${esc(p.id)}" ${o.player===p.id?'selected':''}>${esc(p.name)}${p.jailed?' (jailed)':''}</option>`).join('')}</select></label><label class="full">Operation<select data-override="operation" data-index="${index}">${C.operations.map(p=>`<option value="${p.id}" ${p.id===o.operation?'selected':''}>${p.name}</option>`).join('')}</select></label>${choices.length?`<label class="full">Guaranteed ${['evidence','defector'].includes(o.operation)?'decision':'result'}<select data-override="result" data-index="${index}">${options(choices,o.result,['evidence','defector'].includes(o.operation)?'Player chooses':'Natural / random result')}</select></label>`:''}${Array.from({length:targetCount},(_,t)=>`<label class="${targetCount===1?'full':''}">Target ${targetCount===1?'':t+1}<select data-override="target${t}" data-index="${index}">${options(candidates,o.targets?.[t],'Random active player')}</select></label>`).join('')}</div></div>`;
    });
    body+=button('+ Add operation override','override-add','btn secondary wide');return body;
  }
  let overridesDraft=null;
  function gameOverrides(){
    if(!game.config.manual||!['round-ready','results'].includes(game.phase)||game.winner)throw new Error('Round overrides are only editable between rounds.');
    if(!overridesDraft)overridesDraft=E.clone(game.config);
    openModal('Round overrides',manualForm(overridesDraft,game.players,true)+errorBlock()+`<div class="modal-foot">${button('Cancel','overrides-cancel','btn secondary')}${button('Save overrides','overrides-save')}</div>`,'game-overrides');
  }
  function presetsForm(){return `<h3>Default presets</h3>${C.presets.map(p=>`<div class="setting-row"><div><strong>${p.name}</strong><p class="small muted" style="margin:4px 0 0">${p.id==='full'?'All operations, agendas and special roles.':'No special roles, Defector, Sleeper Agent or Spy Transfer.'}</p></div>${button('Load','preset','pill',`data-id="${p.id}"`)}</div>`).join('')}<hr class="divider"><h3>Your saved configurations</h3><p class="small muted">Includes players, rules, starting assignments and round overrides. Saved on this browser.</p>${customs.length?customs.map(p=>`<div class="setting-row"><strong>${esc(p.name)}</strong><div class="row">${button('Load','load-custom','pill',`data-id="${esc(p.id)}"`)}${button('Delete','delete-custom','pill',`data-id="${esc(p.id)}"`)}</div></div>`).join(''):'<div class="empty">No saved configurations yet.</div>'}<label style="margin-top:20px">Configuration name<input id="preset-name" placeholder="Friday night" maxlength="40" autocomplete="off"></label>${button('Save current configuration','save-custom','btn wide launch')}<hr class="divider"><h3>Take your config with you</h3><p class="small muted">Export a file to back up your settings or import them on another device.</p><div class="sides">${button('Export config','export','btn secondary')}${button('Import config','import','btn secondary')}</div><input type="file" id="config-file" accept="application/json,.json" hidden>`;}
  function help(){
    const intro=`<h3>One phone, private turns</h3><p class="muted">3–9 players. Brief everyone privately. Each round: Operations, Discussion, then Voting. Conceal before passing. Players may lie about their information.</p><h3>Teams & voting</h3><p class="muted">Starting Parasites recognise each other once. Team changes stay secret. Force Defectors cannot vote while Force. No self-votes. Highest final total is jailed and reveals actual allegiance; ties jail nobody. A jailed player stops taking turns.</p><p class="muted">The Force wins when no active Parasites remain. Parasites win at equal or greater numbers if parity victory is enabled. At two active players the game always ends: any Parasite means a Parasite victory. Team victory is checked after setup, after all operations, and after voting.</p>`;
    openModal('Field guide',intro+`<h3 style="margin-top:28px">Operations</h3>${C.operations.map(o=>`<div class="help-entry"><h3>${o.name}</h3><p>${o.description}</p></div>`).join('')}<hr class="divider"><h3>Personal agendas</h3>${C.agendas.map(a=>`<div class="help-entry"><h3>${a.name}</h3><p>${a.description}</p></div>`).join('')}<div class="notice">A later Hidden Agenda replaces an unfinished agenda. A secured Scapegoat or Grudge win is retained. A Parasite Defector’s teammate-vote loss overrides every personal win. Secured personal wins stay private until the final reveal.</div><p class="small muted">Infatuation follows the target’s personal outcome, including their own agenda. If Infatuation forms a closed loop, each player in the loop uses their final team outcome; anyone following them shares that outcome.</p><hr class="divider"><h3>Special roles</h3>${C.specials.map(s=>`<div class="help-entry"><h3>${s.name}</h3><p>${s.description}</p></div>`).join('')}<p class="small muted" style="margin-top:16px">Confession reveals actual allegiance. Other information uses apparent allegiance. Special roles are hidden from players and stay with their player after a team change. Enabled roles are guaranteed; both are off in the default setup. Defector restrictions clear if an operation later changes that player’s team.</p><h3>Manual mode</h3><p class="small muted">Explicit assignments may exceed normal limits; random assignments never create a second copy of a manually assigned special role. Explicitly duplicated operations are allowed, but randomly dealt operations stay unique. Manual result overrides can deliberately alter reported intel. Protection stacks by subtracting one per use, with a minimum total of zero. A double vote always counts as two, even with repeated bonuses.</p><p class="small muted">At least two other active players are required for two-target intel. Jailed operation owners are skipped. Unavailable or duplicated targets are replaced with eligible active players. Unfilled targets are chosen randomly. Guaranteed results are preserved.</p><div class="modal-foot">${button('Understood','close-modal')}</div>`,'help');
  }
  function applyPreset(id){const p=find(C.presets,id);if(!p)return;config=E.cleanConfig(p.config);config.parasites=Math.min(config.parasites,roster.length-1);presetId=id;error='';persist();render();if(modal.open&&modalMode==='settings')settings(modalTab);toast(p.name+' preset loaded');}
  function newGame(){game=E.createGame(roster,config);view='playing';resetPrivate();persist();render();window.scrollTo(0,0);}
  function setTimer(){game.timer={remaining:game.config.discussionMinutes*60,running:false,deadline:null};}
  function remainingTime(){return game?.timer?.running?Math.max(0,Math.ceil((game.timer.deadline-Date.now())/1000)):game?.timer?.remaining||0;}
  function timerText(){const seconds=remainingTime();return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
  function privateAdvance(){resetPrivate();persist();render();window.scrollTo(0,0);}
  function runAction(action,b){
    switch(action){
      case 'add':if(roster.length<9){let n=1;while(roster.some(p=>p.name===`Player ${n}`))n++;roster.push({id:uid(),name:`Player ${n}`});persist();render();}break;
      case 'remove':if(roster.length>3){roster=roster.filter(p=>p.id!==b.dataset.id);config.parasites=Math.min(config.parasites,roster.length-1);delete config.assignments[b.dataset.id];config.overrides=config.overrides.filter(o=>o.player!==b.dataset.id);persist();render();}break;
      case 'less':config.parasites=Math.max(1,config.parasites-1);markCustom();render();break;
      case 'more':config.parasites=Math.min(roster.length-1,config.parasites+1);markCustom();render();break;
      case 'preset':applyPreset(b.dataset.id);break;
      case 'settings':settings();break;
      case 'settings-tab':error='';settings(b.dataset.tab);break;
      case 'presets':settings('presets');break;
      case 'help':if(view==='playing'){revealed=false;render();}help();break;
      case 'close-modal':closeModal();break;
      case 'settings-done':closeModal();persist();render();break;
      case 'start':
        E.createGame(roster,config);
        if(audioPrefs.enabled)void music.start();
        if(game&&game.phase!=='ended')openModal('Replace the current game?',`<p class="muted">A game is already in progress. Starting a new briefing replaces it.</p><div class="modal-foot">${button('Keep current game','close-modal','btn secondary')}${button('New game','replace-game')}</div>`,'replace');
        else newGame();break;
      case 'replace-game':closeModal();newGame();break;
      case 'resume':if(audioPrefs.enabled)void music.start();view='playing';resetPrivate();render();break;
      case 'leave':closeModal();view='setup';resetPrivate();persist();render();break;
      case 'conceal':closeModal();revealed=false;render();break;
      case 'reveal':
        if(game.phase==='operations'){
          const turn=E.prepareTurn(game);if(jointGate&&turn.operation==='encounter'&&!turn.done){E.runOperation(game);persist();}
        }
        revealed=true;render();break;
      case 'brief-next':game.cursor++;if(game.cursor>=game.players.length)E.finishBriefing(game);privateAdvance();break;
      case 'round-start':E.startRound(game);privateAdvance();break;
      case 'target':{
        const id=b.dataset.id,limit=Number(b.dataset.limit);selected=selected.includes(id)?selected.filter(t=>t!==id):limit===1?[id]:selected.length<limit?[...selected,id]:[...selected.slice(1),id];render();break;
      }
      case 'choice':choice=b.dataset.choice;render();break;
      case 'operate':{
        const turn=E.prepareTurn(game);
        if(turn.operation==='encounter'){jointGate=true;revealed=false;render();break;}
        E.runOperation(game,{targets:selected,choice});persist();
        if(turn.operation==='confession'){jointGate=true;revealed=false;}
        render();window.scrollTo(0,0);break;
      }
      case 'op-next':E.finishTurn(game);if(game.phase==='discussion')setTimer();privateAdvance();break;
      case 'timer-toggle':if(!game.timer)setTimer();if(game.timer.running){game.timer.remaining=remainingTime();game.timer.running=false;}else{if(!remainingTime())game.timer.remaining=game.config.discussionMinutes*60;game.timer.deadline=Date.now()+game.timer.remaining*1000;game.timer.running=true;}persist();render();break;
      case 'timer-reset':setTimer();persist();render();break;
      case 'voting-start':E.startVoting(game);privateAdvance();break;
      case 'cast-vote':if(selected.length!==1)throw new Error('Choose a player first.');E.vote(game,selected[0]);privateAdvance();break;
      case 'final-results':game.phase='ended';privateAdvance();break;
      case 'play-again':game=null;view='setup';privateAdvance();break;
      case 'game-overrides':resetPrivate();overridesDraft=null;gameOverrides();break;
      case 'overrides-cancel':overridesDraft=null;closeModal();break;
      case 'overrides-save':E.validateRound(overridesDraft,game.round+1,E.active(game));game.config.overrides=E.clone(overridesDraft.overrides);overridesDraft=null;closeModal();persist();render();toast('Round overrides saved');break;
      case 'override-add':{
        const cfg=modalMode==='game-overrides'?overridesDraft:config;const people=modalMode==='game-overrides'?E.active(game):roster;
        cfg.overrides.push({round:modalMode==='game-overrides'?game.round+1:1,player:people[0].id,operation:'tip',result:'',targets:[]});
        if(modalMode==='game-overrides')gameOverrides();else{markCustom();settings('manual');}break;
      }
      case 'override-remove':{const cfg=modalMode==='game-overrides'?overridesDraft:config;cfg.overrides.splice(Number(b.dataset.index),1);if(modalMode==='game-overrides')gameOverrides();else{markCustom();settings('manual');}break;}
      case 'save-custom':{
        const name=$('preset-name').value.trim();if(!name)throw new Error('Name your configuration first.');
        const existing=customs.find(p=>p.name.toLowerCase()===name.toLowerCase());
        if(existing){openModal('Update saved configuration?',`<p>Replace the saved settings for <strong>${esc(name)}</strong> with your current configuration?</p><div class="modal-foot">${button('Cancel','presets','btn secondary')}${button('Update','overwrite-custom','btn',`data-id="${esc(existing.id)}"`)}</div>`,'overwrite');}
        else{const item={id:uid(),name,config:E.clone(config),roster:E.clone(roster)};customs.push(item);presetId=item.id;persist();settings('presets');render();toast('Configuration saved');}break;
      }
      case 'overwrite-custom':{const item=find(customs,b.dataset.id);item.config=E.clone(config);item.roster=E.clone(roster);presetId=item.id;persist();settings('presets');render();toast('Configuration updated');break;}
      case 'load-custom':{
        const p=find(customs,b.dataset.id);config=E.cleanConfig(p.config);if(p.roster)roster=E.clone(p.roster);presetId=p.id;persist();settings('presets');render();toast(p.name+' loaded');break;
      }
      case 'delete-custom':openModal('Delete saved configuration?',`<p>Delete <strong>${esc(find(customs,b.dataset.id).name)}</strong> from this browser?</p><div class="modal-foot">${button('Cancel','presets','btn secondary')}${button('Delete','confirm-delete','btn danger',`data-id="${esc(b.dataset.id)}"`)}</div>`,'delete');break;
      case 'confirm-delete':customs=customs.filter(p=>p.id!==b.dataset.id);if(presetId===b.dataset.id)presetId='custom';persist();settings('presets');render();break;
      case 'export':{
        const body={format:'quadruple-agent-config',version:1,name:find(customs,presetId)?.name||find(C.presets,presetId)?.name||'Custom',roster,config};
        const url=URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='quadruple-agent-config.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Configuration exported');break;
      }
      case 'import':$('config-file').click();break;
    }
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-action]');if(!b||b.disabled)return;
    error='';try{runAction(b.dataset.action,b);}catch(err){error=err.message||'Something went wrong.';if(modal.open){if(modalMode==='game-overrides')gameOverrides();else if(modalMode==='settings')settings(modalTab);else toast(error);}else render();}
  });
  document.addEventListener('input',event=>{
    const t=event.target;
    if(t.dataset.name){const p=roster.find(p=>p.id===t.dataset.name);if(p)p.name=t.value;persist();}
    if(t.dataset.config==='discussionMinutes'){config.discussionMinutes=Math.max(0,Math.min(30,Number(t.value)||0));markCustom();}
  });
  document.addEventListener('change',async event=>{
    const t=event.target;
    if(t.dataset.config&&t.type==='checkbox'){config[t.dataset.config]=t.checked;markCustom();if(t.dataset.config==='manual')settings('manual');render();}
    if(t.dataset.list){const key=t.dataset.list;config[key]=t.checked?[...new Set([...config[key],t.dataset.id])]:config[key].filter(id=>id!==t.dataset.id);markCustom();render();}
    if(t.dataset.assignment){const a=config.assignments[t.dataset.id]||(config.assignments[t.dataset.id]={});a[t.dataset.assignment]=t.value;markCustom();}
    if(t.dataset.override){
      const cfg=modalMode==='game-overrides'?overridesDraft:config,o=cfg.overrides[Number(t.dataset.index)],field=t.dataset.override;
      if(field.startsWith('target')){o.targets=o.targets||[];o.targets[Number(field.slice(6))]=t.value;}
      else if(field==='round')o.round=Math.max(modalMode==='game-overrides'?game.round+1:1,Math.min(999,Math.floor(Number(t.value)||1)));
      else{o[field]=t.value;if(field==='operation'){o.targets=[];o.result='';}if(field==='player')o.targets=(o.targets||[]).map(id=>id===o.player?'':id);}
      if(modalMode==='game-overrides')gameOverrides();else{markCustom();settings('manual');}
    }
    if(t.id==='config-file'&&t.files?.[0]){
      try{
        if(t.files[0].size>1024*1024)throw new Error('The configuration file is too large.');
        const incoming=JSON.parse(await t.files[0].text());
        if(incoming.format!=='quadruple-agent-config'||incoming.version!==1||!Array.isArray(incoming.roster)||incoming.roster.length<3||incoming.roster.length>9||!incoming.config)throw new Error('Choose a Quadruple Agent configuration export.');
        const nextRoster=incoming.roster.map(p=>({id:String(p.id).slice(0,100),name:String(p.name).slice(0,30)}));
        if(nextRoster.some(p=>!p.id||!p.name)||new Set(nextRoster.map(p=>p.id)).size!==nextRoster.length)throw new Error('The file contains invalid player entries.');
        config=E.cleanConfig(incoming.config);roster=nextRoster;presetId='custom';persist();settings('presets');render();toast('Configuration imported');
      }catch(err){toast(err.message||'Unable to read that file.');}
    }
  });
  modal.addEventListener('close',()=>{overridesDraft=null;error='';});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&view==='playing'){revealed=false;if(modal.open)modal.close();render();persist();}});
  window.addEventListener('pagehide',()=>{if(view==='playing'){revealed=false;render();}persist();});
  window.addEventListener('pageshow',event=>{if(event.persisted&&view==='playing'){revealed=false;render();}});
  setInterval(()=>{if(view==='playing'&&game?.phase==='discussion'&&$('timer')){$('timer').textContent=timerText();if(game.timer?.running&&remainingTime()===0){game.timer.running=false;game.timer.remaining=0;persist();render();}}},500);
  // Expose public setup through WebMCP, never secret allegiances or individual votes.
  if(document.modelContext?.registerTool){try{const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});Promise.resolve(document.modelContext.registerTool({name:'read_quadruple_agent_setup',title:'Read game setup',description:'Read public setup and enabled operations without secret game state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(input&&Object.keys(input).length)throw new Error('This tool accepts no input fields.');return {title:'Quadruple Agent',players:roster.map(p=>p.name),startingParasites:config.parasites,parityVictory:config.parity,operations:config.operations.map(id=>find(C.operations,id).name)};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  persist();render();
})();
