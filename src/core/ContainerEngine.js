import { CONTAINERS,roomContainers,loadContainerStates,saveContainerStates,makeContainerTask } from '../data/containers.js';
import { speak } from './audio.js';
import { remember } from './storage.js';
import { FridgeFlow } from './FridgeFlow.js';

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
  this.previous=null;this.category='all';this.page=0;this.pageSize=12;this.choices=[];this.feedbackEnglish='';this.fridge=new FridgeFlow(this);this.bind();
 }
 bind(){
  $('inventory-close').onclick=()=>this.close();
  $('inventory-scrim').onclick=()=>this.close();
  $('inventory-prev').onclick=()=>{if(this.page>0){this.page--;this.render()}};
  $('inventory-next-page').onclick=()=>{
    const pages=Math.ceil(this.filteredItems().length/this.pageSize);
    if(this.page<pages-1){this.page++;this.render()}
  };
  $('inventory-replay').onclick=()=>this.task&&speak(this.task.english);
  $('inventory-feedback-replay').onclick=()=>this.feedbackEnglish&&speak(this.feedbackEnglish);
  $('inventory-next').onclick=()=>{
   if(!this.current)return;
   if(this.current.id==='fridge'){
    if(this.mode==='discover'){this.fridge.intro();this.render()}
    else{
     if((this.mode==='sequence'||this.mode==='story')&&this.fridge.roundsLeft<=0)this.fridge.roundsLeft=3;
     this.next();
    }
   }else if(this.mode==='discover'){
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
  this.itemsState(id)[itemId]=!!value;this.persistStates();
 }
 persistStates(){saveContainerStates(this.states)}
 showFeedback({en='',es='',note='',tone=''}={}){
  $('inventory-result').dataset.tone=tone;
  $('inventory-feedback-en').textContent=en||'Explore the objects.';
  $('inventory-feedback-es').textContent=es;
  $('inventory-feedback-note').textContent=note;
  this.feedbackEnglish=en;
  $('inventory-feedback-replay').disabled=!en;
 }
 showMessage(text,tone=''){
  this.showFeedback({en:this.task?.english||'Explore the objects.',
   es:this.task?.spanish||'Explora los objetos.',note:text,tone});
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
  this.sequence=[];this.category='all';this.page=0;this.choices=[];
  if(id==='fridge')this.fridge.open();else this.fridge.close();
  const showFilters=id==='fridge'&&this.mode==='discover';
  $('inventory-filters').classList.toggle('hidden',!showFilters);
  $('inventory-pager').classList.toggle('hidden',!showFilters);
  this.renderFilters();
  $('inventory-title').textContent=container.name;
  $('inventory-subtitle').textContent=container.en+' · '+container.items.length+' objetos';
  $('inventory-mode').textContent=modes[this.mode]||'Órdenes';
  $('inventory-layer').classList.remove('hidden');
  $('inventory-next').textContent=this.mode==='discover'?'Explorar':'Otra orden';
  this.render();
  this.showMessage('Toca un objeto para empezar.');
  if(id==='fridge'){
   if(this.mode==='discover')this.fridge.intro();else this.fridge.next();
  }else if(this.mode==='discover'){
   $('inventory-prompt').textContent='Explore the objects.';
   $('inventory-translation').textContent='Explora los objetos.';
   $('inventory-replay').disabled=true;
   this.showFeedback({en:'Explore the objects.',es:'Explora los objetos.',
     note:'Toca un objeto para escuchar y aprender su nombre.'});
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
  if(this.current.id==='fridge'){this.fridge.next();return}
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
  // Larger collections still show just eight alternatives for each spoken
  // mission. The correct item is ALWAYS among the choices.
  this.choices=this.current.items.length>12
    ?shuffle([this.current.items.find(i=>i.id===t.itemId),
      ...shuffle(this.current.items.filter(i=>i.id!==t.itemId)).slice(0,7)])
    :[...this.current.items];
  this.render();
  speak(t.english);
 }
 filteredItems(){
  if(!this.current)return [];
  const items=this.current.id==='fridge'?this.fridge.inside():this.current.items;
  if(this.category==='all')return items;
  return items.filter(item=>(item.category||'other')===this.category);
 }
 renderFilters(){
  const holder=$('inventory-filters');
  holder.replaceChildren();
  if(!this.current||this.current.id!=='fridge'||this.mode!=='discover')return;
  const choices=[['all','Todos'],['fruit','Frutas'],['vegetable','Verduras'],['other','Otros']];
  for(const [category,label] of choices){
    const count=this.fridge.inside().filter(item=>
      category==='all'||(item.category||'other')===category).length;
    const button=document.createElement('button');
    button.type='button';
    button.className='inventory-filter'+(category===this.category?' active':'');
    button.textContent=label+' ('+count+')';
    button.setAttribute('aria-pressed',String(category===this.category));
    button.onclick=()=>{
      this.category=category;this.page=0;this.renderFilters();this.render();
    };
    holder.append(button);
  }
 }
 createItemArt(item){
  if(Number.isInteger(item.spriteIndex)){
   const art=document.createElement('span');art.className='inventory-pixel-sprite';
   art.setAttribute('role','img');art.setAttribute('aria-label',item.en);
   const col=item.spriteIndex%7,row=Math.floor(item.spriteIndex/7);
   art.style.backgroundImage='url("'+asset(item)+'")';
   art.style.backgroundSize=(7*64)+'px '+(5*64)+'px';
   art.style.backgroundPosition=(-col*64)+'px '+(-row*64)+'px';
   return art;
  }
  const art=document.createElement('img');art.src=asset(item);
  art.alt=item.en;art.loading='eager';return art;
 }
 render(){
  if(!this.current)return;
  const c=this.current,isFridge=c.id==='fridge',paginated=isFridge&&this.mode==='discover';
  const filtered=this.filteredItems(),pages=Math.max(1,Math.ceil(filtered.length/this.pageSize));
  this.page=Math.min(this.page,pages-1);
  const visible=paginated
   ?filtered.slice(this.page*this.pageSize,(this.page+1)*this.pageSize)
   :this.mode==='discover'?(isFridge?this.fridge.inside():c.items)
    :this.choices.length?(isFridge?this.choices.filter(i=>this.fridge.location(i.id)==='fridge'):this.choices)
      :isFridge?this.fridge.inside():c.items;
  $('inventory-items').replaceChildren(...visible.map(item=>{
   const out=this.isOut(c.id,item.id);
   const btn=document.createElement('button');btn.type='button';
   btn.className='inventory-item'+(out?' is-out':'');btn.dataset.itemId=item.id;
   const label=document.createElement('strong');label.textContent=item.en;
   const state=document.createElement('small');
   state.textContent=isFridge?'DENTRO':out?'FUERA':'DENTRO';
   btn.append(this.createItemArt(item),label,state);
   btn.onclick=()=>this.select(item);return btn;
  }));
  if(isFridge){
   const inside=this.fridge.inside().length,tray=this.fridge.tray().length;
   $('inventory-count').textContent=inside+' dentro · '+tray+' en bandeja · '+(c.items.length-inside-tray)+' colocados';
   this.fridge.renderExtras();
   if(paginated)this.renderFilters();
  }else{
   $('inventory-count').textContent=c.items.filter(i=>!this.isOut(c.id,i.id)).length+
    ' guardados · '+c.items.filter(i=>this.isOut(c.id,i.id)).length+' fuera';
  }
  if(paginated){
   $('inventory-page').textContent='Página '+(this.page+1)+' de '+pages;
   $('inventory-prev').disabled=this.page===0;
   $('inventory-next-page').disabled=this.page>=pages-1;
  }
 }
 select(item){
  if(!this.current||this.locked)return;
  if(this.current.id==='fridge'){this.fridge.selectInside(item);return}
  const c=this.current;
  if(this.mode==='discover'){
   const t=makeContainerTask(c,item,!this.isOut(c.id,item.id));
   this.setOut(c.id,item.id,t.out);
   this.render();speak(t.english);
   this.app.showStudy(t.english,t.spanish,item.en+' · '+item.es+' · '+c.name);
   this.record(t,true);
   this.showFeedback({en:t.english,es:t.spanish,note:'✓ '+item.en+' = '+item.es,tone:'good'});
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
  this.showFeedback({en:t.english,es:t.spanish,note:'✓ Acción correcta.',tone:'good'});
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
  this.fridge.close();
  this.current=null;this.task=null;this.locked=false;
  $('inventory-layer').classList.add('hidden');
  if(wasOpen&&restore)this.app.modeEngine.setMode(this.app.modeEngine.mode);
 }
}
