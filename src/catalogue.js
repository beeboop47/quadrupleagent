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
    {id:'danish',name:'Danish Intelligence',kind:'choose',targets:2,description:'Choose two other players. Learn whether their apparent allegiances match.'},
    {id:'majority',name:'Majority Report',kind:'choose',targets:3,allowSelf:true,description:'Choose three active players, including yourself if needed. Learn which team has the majority among them.'},
    {id:'chain',name:'Chain of Command',kind:'choose',targets:1,description:'Choose another player. Learn whether you and that player appear to work for the same team.'},
    {id:'threat',name:'Threat Assessment',kind:'choose',targets:2,description:'Choose two other players. Learn whether at least one appears to belong to the opposing team to your current actual allegiance.'},
    {id:'cross',name:'Cross-Reference',kind:'choose',targets:1,description:'Choose another player. A second, different player is selected randomly. Learn their identity and whether the two appear to work for the same team.'},
    {id:'audit',name:'Internal Audit',kind:'random',targets:0,description:'Learn how many active players appear to be Parasites. No identities are revealed.'},
    {id:'background',name:'Background Check',kind:'choose',targets:1,description:'Choose another player. Learn whether they have a hidden special role, without learning its identity or their allegiance.'},
    {id:'loyalties',name:'Divided Loyalties',kind:'choose',targets:1,description:'Choose another player. Learn whether they have a personal victory condition or secured personal win, without learning what it is.'},
    {id:'personnel',name:'Personnel File',kind:'choose',targets:1,description:'Choose another player. Receive two statements about different aspects of their file. Normally exactly one is true; hidden information modifiers can interfere.'}
  ];
  const agendas = [
    {id:'sleeper',name:'Sleeper Agent',description:'Immediately switch teams. Your new team determines your victory.'},
    {id:'scapegoat',name:'Operation Scapegoat',description:'Secure a personal win by being jailed in a vote. Your team no longer determines your victory.'},
    {id:'infatuation',name:'Infatuation',description:'Win or lose with a random other player, regardless of allegiance.'},
    {id:'grudge',name:'Grudge',description:'Secure a personal win when a random other player is jailed. Your team no longer determines your victory.'}
  ];
  const specials = [
    {id:'suspicious',name:'Suspicious Agent',description:'While you are Force, information operations see you as a Parasite.'},
    {id:'cover',name:'Deep Cover Agent',description:'While you are a Parasite, information operations see you as Force.'},
    {id:'source',name:'Unreliable Source',description:'Your information answers are inverted. Internal Audit reports the complementary count; Personnel File gives two false statements. Confession stays truthful.'},
    {id:'fixed',name:'Fixed Asset',description:'Spy Transfer involving you leaves both players’ teams unchanged, while still reporting completion.'},
    {id:'counterintel',name:'Counterintelligence Officer',description:'Your information operations use actual allegiances, bypassing Suspicious Agent and Deep Cover Agent. Confession remains truthful.'}
  ];
  const all = list => list.map(x=>x.id);
  const defaults = {parasites:1,parity:true,singleRound:false,operationPhases:1,discussionMinutes:3,operations:all(operations),agendas:all(agendas),specials:[],manual:false,assignments:{},overrides:[]};
  const presets = [
    {id:'full',name:'Full',description:'Every operation & special role',config:{...defaults,specials:all(specials)}},
    {id:'confident',name:'Confident',description:'Stable teams. Clean intelligence.',config:{...defaults,operations:all(operations).filter(id=>!['defector','transfer'].includes(id)),agendas:all(agendas).filter(id=>id!=='sleeper'),specials:[]}}
  ];
  const catalogue = {operations,agendas,specials,presets,defaults};
  root.QACatalogue = catalogue;
  if(typeof module!=='undefined' && module.exports)module.exports=catalogue;
})(globalThis);
