// Listening first: no English or Spanish answer before playback/selection unless requested.
const actions=[
 ['jump','⬆️','Jump.','He is jumping.','Salta.','MovementBasic','Jump_Full_Short'],
 ['sit','🧎','Sit down.','He is sitting down.','Siéntate.','Simulation','Sit_Floor_Down',null,'Sit_Floor_Idle'],
 ['lie','🛏️','Lie down.','He is lying down.','Acuéstate.','Simulation','Lie_Down',null,'Lie_Idle'],
 ['get-up','🛏️⬆️','Get up.','He is getting up.','Levántate de estar acostado.','Simulation','Lie_StandUp','Lie_Idle'],
 ['stand','🧍','Stand up.','He is standing up.','Ponte de pie.','Simulation','Sit_Floor_StandUp','Sit_Floor_Idle'],
 ['walk','🚶','Walk forward.','He is walking forward.','Camina hacia adelante.','MovementBasic','Walking_A',null,null,1.25],
 ['run','🏃','Run.','He is running.','Corre.','MovementBasic','Running_A',null,null,1.65],
 ['back','⬅️','Back up.','He is backing up.','Retrocede.','MovementAdvanced','Walking_Backwards',null,null,-1.35],
 ['wave','👋','Wave to the other person.','He is waving to the other person.','Saluda con la mano a la otra persona.','Simulation','Waving',null,null,null,'near'],
 ['wave-far','👋 · · 🧍','Wave to the person far away.','He is waving to the person far away.','Saluda a la persona que está lejos.','Simulation','Waving',null,null,null,'far'],
 ['crouch','⬇️','Crouch down.','He is crouching down.','Agáchate.','MovementAdvanced','Crouching'],
 ['cheer','🙌','Cheer!','He is cheering.','¡Celebra!','Simulation','Cheering']
].map(([id,icon,command,description,translation,pack,clip,start,hold,distance,social])=>({id,icon,command,description,translation,motion:{pack,clip,start,hold,distance},social}));
export const LISTENING_ACTIONS=actions;
const shuffle=items=>{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
export function initListening({getScene,ready,setBusy,speak}){
 const $=id=>document.getElementById(id);
 let mode='watch',current,choices=[],resolved=false,active=false,locked=false,score=0,total=0,seenAudio=false,missed=false;
 let deck=[],review=[];
 const sentence=()=>mode==='act'?current.command:current.description;
 function play(rate=1){
   if(!current)return;
   seenAudio=speak(sentence(),rate);
   if(!seenAudio)$('listening-feedback').textContent='El navegador no dispone de síntesis de voz. Usa otro navegador o activa una voz inglesa.';
   sync();
 }
 function sync(){
   $('listening-score').textContent=score+' / '+total+' sin errores';
   $('listening-next').disabled=locked||!resolved;
   $('listening-choices').querySelectorAll('button').forEach(b=>b.disabled=locked||!seenAudio||resolved);
 }
 async function animate(entry){
   if(locked||!active)return false;
   locked=true;setBusy(true);sync();
   try{
     await ready();const scene=getScene();
     if(!scene)throw Error('WebGL unavailable');
     if(entry.social)await scene.previewGreeting(entry.social==='far');
     else await scene.previewMotion(entry.motion);
     return true;
   }catch(error){console.error(error);$('listening-feedback').textContent='No se pudo reproducir el movimiento. Vuelve a intentarlo.';return false;}
   finally{locked=false;setBusy(false);sync();}
 }
 function reveal(){ $('listening-transcript').hidden=false;$('listening-transcript').textContent=sentence(); }
 function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;}
 async function answer(entry,card){
   if(resolved||locked||!seenAudio)return;
   if(entry!==current){missed=true;card.classList.add('incorrect');if(!review.includes(current))review.push(current);
     $('listening-feedback').textContent='Escucha otra vez y prueba otra acción.';return;}
   if(!await animate(entry))return;
   resolved=true;total++;if(!missed)score++;card.classList.add('correct');reveal();
   $('listening-feedback').textContent='✓ '+current.translation;play();sync();
 }
 function render(){
   $('listening-transcript').hidden=true;$('listening-transcript').textContent='';
   $('listening-feedback').textContent='';
   $('listening-instruction').textContent=mode==='watch'?'Pulsa escuchar y observa lo que ocurre. Después puedes ver la frase.':mode==='act'?'Escucha la orden y elige la acción que debe ejecutar el personaje.': 'Escucha la descripción. Reproduce las acciones numeradas y selecciona la que corresponde.';
   $('listening-choices').replaceChildren();
   if(mode!=='watch')choices.forEach((entry,i)=>{
     const card=document.createElement('div');card.className='listen-card';
     const icon=document.createElement('span');icon.className='listen-icon';icon.textContent=mode==='act'?entry.icon:String(i+1);icon.setAttribute('aria-hidden','true');
     card.append(icon);
     if(mode==='match')card.append(button('Ver acción '+(i+1),()=>animate(entry)));
     const select=button(mode==='act'?'Ejecutar':'Elegir acción '+(i+1),()=>answer(entry,card));
     if(mode==='act')select.setAttribute('aria-label',entry.translation);
     card.append(select);$('listening-choices').append(card);
   });
   sync();
 }
 function next(){
   if(locked)return;
   getScene()?.hidePartner();
   if(!deck.length)deck=shuffle(actions);
   let candidate=review.length&&Math.random()<.5?review.shift():deck.shift();
   if(candidate===current&&deck.length){deck.push(candidate);candidate=deck.shift();}
   current=candidate;resolved=false;seenAudio=false;missed=false;
   choices=shuffle([current,...shuffle(actions.filter(a=>a!==current)).slice(0,3)]);
   render();
 }
 async function listen(rate){
   if(locked||!active)return;
   play(rate);
   if(mode==='watch'&&seenAudio&&await animate(current)){
     resolved=true;reveal();$('listening-feedback').textContent=current.translation;sync();
   }
 }
 function changeMode(nextMode){if(locked)return;mode=nextMode;deck=[];review=[];score=0;total=0;
  for(const [id,value] of [['listen-watch','watch'],['listen-act','act'],['listen-match','match']])$(id).setAttribute('aria-pressed',String(mode===value));next();}
 $('listen-watch').onclick=()=>changeMode('watch');$('listen-act').onclick=()=>changeMode('act');$('listen-match').onclick=()=>changeMode('match');
 $('listening-play').onclick=()=>listen(1);$('listening-slow').onclick=()=>listen(.75);
 $('listening-hint').onclick=()=>{if(!current||locked)return;reveal();missed=true;};
 $('listening-next').onclick=next;
 return {enter(){active=true;next();},leave(){active=false;getScene()?.hidePartner();if('speechSynthesis' in window)window.speechSynthesis.cancel();}};
}
