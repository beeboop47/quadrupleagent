/* Native looping preserves the supplied track's own fade. Web Audio handles iPhone volume. */
(function(root){
  'use strict';
  function create({src='Background Music.mp3',volume=.28,onChange=()=>{},onError=()=>{}}={}){
    let context=null,gain=null,audio=null,enabled=false,pending=false,generation=0;
    function report(){onChange({enabled,volume,playing:enabled&&!!audio&&!audio.paused,loading:pending});}
    function init(){
      if(audio)return;
      const AC=root.AudioContext||root.webkitAudioContext;
      audio=new Audio();audio.preload='metadata';audio.loop=true;audio.src=src;audio.setAttribute('playsinline','');
      // Local-file media can be blocked by Web Audio origin checks; native audio keeps it audible.
      if(AC&&root.location?.protocol!=='file:'){
        context=new AC();gain=context.createGain();gain.gain.value=volume;gain.connect(context.destination);
        context.createMediaElementSource(audio).connect(gain);context.addEventListener('statechange',report);
      }else audio.volume=volume;
      audio.addEventListener('error',()=>{if(enabled){stop();onError('Music could not load. Keep Background Music.mp3 beside the HTML file.');}});
    }
    async function start(){
      if(enabled)return;let token=null;
      try{
        init();enabled=true;token=++generation;pending=true;report();
        // Both calls happen inside the user's gesture to unlock iPhone playback.
        const resume=context?context.resume():Promise.resolve(),play=audio.play();await Promise.all([resume,play]);
        if(!enabled||token!==generation)return;pending=false;report();
      }catch(error){
        if(token!==null&&token!==generation)return;
        stop();onError('Tap Music to play the background track. Check that Background Music.mp3 is beside the HTML.');
      }
    }
    function stop(){enabled=false;generation++;pending=false;if(audio)audio.pause();if(context?.state==='running')void context.suspend();report();}
    function setVolume(value){volume=Math.min(1,Math.max(0,Number(value)||0));if(gain)gain.gain.setTargetAtTime(volume,context.currentTime,.05);else if(audio)audio.volume=volume;report();}
    function dispose(){stop();if(audio){audio.removeAttribute('src');audio.load();}if(context)void context.close();}
    return {start,stop,setVolume,dispose,getState:()=>({enabled,volume})};
  }
  const api={create};root.QAMusic=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
