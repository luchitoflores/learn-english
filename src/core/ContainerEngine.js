import { CONTAINERS,roomContainers,loadContainerStates,saveContainerStates,makeContainerTask } from '../data/containers.js';
import { speak } from './audio.js';
import { remember } from './storage.js';

const $=id=>document.getElementById(id);
const modes={
 discover:'Descubrimiento',orders:'Órdenes',listening:'Listening',sequence:'Secuencias',
 story:'Historia',timed:'Contrarreloj',production:'Producción',phrasal:'Phrasal verbs'
};
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const asset=item=>import.meta.env.BASE_URL+'assets/'+item.image;

export class ContainerEngine {
 constructor(app){
  this.app=app;this.states=loadContainerStates();this.current=null;
  this.task=null;this.mode='discover';this.sequence=[];this.score=0;
  this.timeLeft=60;this.timer=null;this.advance=null;this.locked=false;
  this.previous=null;this.bind();
 }
 bind(){
  $('inventory-close').onclick=()=>this.close();
  $('inventory-scrim').onclick=()=>this.close();
  $('inventory-replay').onclick=()=>this.task&&speak(this.task.english);
  $('inventory-next').onclick=()=>{
   if(!this.current)return;
   if(this.mode==='discover'){
    this.showMessage('Toca cualquier objeto para descubrir su nombre y practicar.');
   }else{
    if((this.mode==='sequence'||this.mode==='story')&&!this.sequence.length)this.makeSequence();
    this.next();
   }
  };
 }
 get present(){return !!this.current}
 inRoom(id){return roomContainers(this.app.roomId).some(c=>c.id===id)}
 itemsState(id){
  if(!this.states[id])this.states[id]={};
  return this.states[id];
 }
 isOut(id,itemId){return !!this.itemsState(id)[itemId]}
 setOut(id,itemId,value){
  this.itemsState(id)[itemId]=!!value;saveContainerStates(this.states);
 }
 showMessage(text,tone=''){
  const box=$('inventory-result');box.textContent=text;box.dataset.tone=tone;
 }
 open(id){
  const container=CONTAINERS[id];
  if(!container||!this.inRoom(id))return false;
  this.close(false);
  this.app.closeActionPanel();
  this.app.closeModal();
  this.app.modeEngine.cancelPending();
  this.current=container;this.mode=this.app.modeEngine.mode;
  this.score=0;this.timeLeft=60;this.locked=false;this.previous=null;
  this.sequence=[];
  $('inventory-title').textContent=container.name;
  $('inventory-subtitle').textContent=container.en+' · '+container.items.length+' objetos';
  $('inventory-mode').textContent=modes[this.mode]||'Órdenes';
  $('inventory-layer').classList.remove('hidden');
  $('inventory-next').textContent=this.mode==='discover'?'Explorar':'Otra orden';
  this.render();
  this.showMessage('Toca un objeto para empezar.');
  if(this.mode==='discover'){
   $('inventory-prompt').textContent='Explore the objects.';
   $('inventory-translation').textContent='Explora los objetos.';
   $('inventory-replay').disabled=true;
  }else if(this.mode==='sequence'||this.mode==='story'){
   this.makeSequence();this.next();
  }else this.next();
  if(this.mode==='timed'){
   this.timer=setInterval(()=>{
    this.timeLeft--;this.renderStats();
    if(this.timeLeft<=0){
     clearInterval(this.timer);this.timer=null;this.locked=true;this.task=null;
     $('inventory-prompt').textContent='Time is up!';
     $('inventory-translation').textContent='¡Tiempo terminado!';
     this.showMessage('Conseguiste '+this.score+' aciertos.','good');
     $('inventory-replay').disabled=true;
    }
   },1000);
  }
  this.renderStats();
  return true;
 }
 renderStats(){
  $('inventory-score').textContent=(this.mode==='timed'?'⏱ '+this.timeLeft+' s · ':'')+
     this.score+' aciertos';
 }
 makeSequence(){
  const chosen=shuffle(this.current.items).slice(0,3);
  this.sequence=chosen.map(item=>makeContainerTask(this.current,item,!this.isOut(this.current.id,item.id)));
 }
 next(){
  if(!this.current)return;
  if(this.advance){clearTimeout(this.advance);this.advance=null}
  this.locked=false;
  if(['sequence','story'].includes(this.mode)){
   if(!this.sequence.length){
    this.task=null;$('inventory-prompt').textContent='Mission complete!';
    $('inventory-translation').textContent='Secuencia completada.';
    $('inventory-replay').disabled=true;
    this.showMessage('Terminaste los tres pasos. Pulsa Otra orden para repetir.','good');
    return;
   }
   this.task=this.sequence[0];
  }else{
   const tasks=this.current.items.map(item=>
     makeContainerTask(this.current,item,!this.isOut(this.current.id,item.id)));
   const candidates=tasks.filter(t=>t.itemId!==this.previous);
   const pool=candidates.length?candidates:tasks;
   this.task=pool[Math.floor(Math.random()*pool.length)];
  }
  const t=this.task;
  $('inventory-replay').disabled=false;
  $('inventory-prompt').textContent=this.mode==='listening'?'♫ Listen carefully':
    this.mode==='production'?t.spanish:t.english;
  $('inventory-translation').textContent=this.mode==='listening'?'Escucha y selecciona sin leer la orden.':
    this.mode==='production'?'Selecciona el objeto correcto.':
    'Toca el objeto indicado.';
  this.showMessage('Escucha la orden y selecciona un objeto.');
  this.render();
  speak(t.english);
 }
 render(){
  if(!this.current)return;
  const container=this.current;
  $('inventory-items').replaceChildren(...container.items.map(item=>{
   const out=this.isOut(container.id,item.id);
   const button=document.createElement('button');
   button.type='button';
   button.className='inventory-item'+(out?' is-out':'');
   button.dataset.itemId=item.id;
   const img=document.createElement('img');
   img.src=asset(item);img.alt=item.en;img.loading='eager';
   const label=document.createElement('strong');label.textContent=item.en;
   const state=document.createElement('small');state.textContent=out?'FUERA':'DENTRO';
   button.append(img,label,state);
   button.onclick=()=>this.select(item);
   return button;
  }));
  $('inventory-count').textContent=container.items.filter(i=>!this.isOut(container.id,i.id)).length+
    ' guardados · '+container.items.filter(i=>this.isOut(container.id,i.id)).length+' fuera';
 }
 select(item){
  if(!this.current||this.locked)return;
  const c=this.current;
  if(this.mode==='discover'){
   const t=makeContainerTask(c,item,!this.isOut(c.id,item.id));
   this.setOut(c.id,item.id,t.out);
   this.render();speak(t.english);
   this.app.showStudy(t.english,t.spanish,item.en+' · '+item.es+' · '+c.name);
   this.record(t,true);
   this.showMessage('✓ '+item.en+' = '+item.es+' · '+t.spanish,'good');
   return;
  }
  if(!this.task)return;
  const correct=item.id===this.task.itemId;
  this.record(this.task,correct);
  if(!correct){
   this.showMessage('✕ Inténtalo otra vez. Escucha la orden.','bad');
   this.app.feedback(false,'Intenta otra vez.');
   speak(this.task.english);
   return;
  }
  const t=this.task;
  this.locked=true;this.score++;
  this.previous=t.itemId;
  this.setOut(c.id,item.id,t.out);
  this.applyAppearance(item,t);
  this.render();this.renderStats();
  this.app.showStudy(t.english,t.spanish,c.en+' · '+item.en+' ('+item.es+')');
  this.showMessage('✓ '+t.english+' · '+t.spanish,'good');
  this.app.feedback(true,t.english);
  if(this.mode==='sequence'||this.mode==='story')this.sequence.shift();
  this.advance=setTimeout(()=>{this.advance=null;this.next()},this.mode==='timed'?500:2600);
 }
 record(t,correct){
  remember(this.app.progress,this.app.roomId,this.current.id,{
   action:t.action,english:t.english,spanish:t.spanish
  },correct);
  this.app.drawProgress();
 }
 applyAppearance(item,t){
  if(this.current.id!=='wardrobe')return;
  if(t.out && item.id==='suit')this.app.updateAvatarAppearance({outfit:'formal'});
  if(t.out && ['shirt','tshirt'].includes(item.id))this.app.updateAvatarAppearance({outfit:'casual'});
  if(!t.out && item.id==='suit')this.app.updateAvatarAppearance({outfit:'casual'});
 }
 close(restore=true){
  if(this.timer)clearInterval(this.timer);this.timer=null;
  if(this.advance)clearTimeout(this.advance);this.advance=null;
  const wasOpen=this.current!==null;
  this.current=null;this.task=null;this.locked=false;
  $('inventory-layer').classList.add('hidden');
  if(wasOpen&&restore)this.app.modeEngine.setMode(this.app.modeEngine.mode);
 }
}
