/* Add operation, agenda and role definitions here. IDs remain stable in saved configurations. */
(function(root){
  'use strict';
  const operations = [
    {id:'tip',name:'Anonymous Tip',kind:'random',targets:1,description:'Learn the apparent allegiance of one random active player.'},
    {id:'confession',name:'Confession',kind:'choose',targets:1,description:'Choose another player and show them your actual allegiance.'},
    {id:'intel',name:'Secret Intel',kind:'choose',targets:2,description:'Choose two other players. Learn whether at least one appears to be a Parasite.'},
    {id:'encounter',name:'Unfortunate Encounter',kind:'random',targets:1,description:'Read the result together with a random other player. Learn whether either of you appears to be a Parasite.'},
    {id:'evidence',name:'Incriminating Evidence',kind:'choose',targets:1,description:'Choose another player. Subtract one vote against them this round, or double their own vote.'},
    {id:'defector',name:'Defector',kind:'decision',targets:0,description:'Choose whether to switch teams. A Force Defector cannot vote. A Parasite Defector loses if a current Parasite votes for them.'},
    {id:'transfer',name:'Spy Transfer',kind:'choose',targets:1,description:'Secretly swap actual teams with another player. Neither team is disclosed.'},
    {id:'agenda',name:'Hidden Agenda',kind:'random',targets:0,description:'Receive a new personal victory condition, or switch teams as a Sleeper Agent.'},
    {id:'danish',name:'Danish Intelligence',kind:'choose',targets:2,description:'Choose two other players. Learn whether their apparent allegiances match.'}
  ];
  const agendas = [
    {id:'sleeper',name:'Sleeper Agent',description:'Immediately switch teams. Your new team determines your victory.'},
    {id:'scapegoat',name:'Operation Scapegoat',description:'Secure a personal win by being jailed in a vote. Your team no longer determines your victory.'},
    {id:'infatuation',name:'Infatuation',description:'Win or lose with a random other player, regardless of allegiance.'},
    {id:'grudge',name:'Grudge',description:'Secure a personal win when a random other player is jailed. Your team no longer determines your victory.'}
  ];
  const specials = [
    {id:'suspicious',name:'Suspicious Agent',description:'While you are Force, information operations see you as a Parasite.'},
    {id:'cover',name:'Deep Cover Agent',description:'While you are a Parasite, information operations see you as Force.'}
  ];
  const all = list => list.map(x=>x.id);
  const defaults = {parasites:1,parity:true,discussionMinutes:3,operations:all(operations),agendas:all(agendas),specials:all(specials),manual:false,assignments:{},overrides:[]};
  const presets = [
    {id:'full',name:'Full',description:'Every operation & special role',config:defaults},
    {id:'confident',name:'Confident',description:'Stable teams. Clean intelligence.',config:{...defaults,operations:all(operations).filter(id=>!['defector','transfer'].includes(id)),agendas:all(agendas).filter(id=>id!=='sleeper'),specials:[]}}
  ];
  const catalogue = {operations,agendas,specials,presets,defaults};
  root.QACatalogue = catalogue;
  if(typeof module!=='undefined' && module.exports)module.exports=catalogue;
})(globalThis);
