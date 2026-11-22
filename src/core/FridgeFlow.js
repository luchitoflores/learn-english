// Two-step, data-driven fridge activity: inside -> tray -> destination.
// Uses the existing fridge artwork; no extra Phaser sprites or external services.
import { makeContainerTask } from '../data/containers.js';
import { speak } from './audio.js';

const $=id=>document.getElementById(id);
const random=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
export const FRIDGE_DESTINATIONS=[
  {id:'table',en:'table',es:'mesa',prep:'on',esPrep:'sobre la',emoji:'🪑'},
  {id:'basket',en:'basket',es:'canasta',prep:'in',esPrep:'en la',emoji:'🧺'},
  {id:'counter',en:'counter',es:'encimera',prep:'on',esPrep:'sobre la',emoji:'🍽️'},
  {id:'plate',en:'plate',es:'plato',prep:'on',esPrep:'en el',image:'objects/plate.webp'},
  {id:'fridge',en:'fridge',es:'refrigeradora',prep:'back in',esPrep:'en la',image:'inventory/fridge-container.webp'}
];
const byId=id=>FRIDGE_DESTINATIONS.find(d=>d.id===id);
const normalize=loc=>loc===true?'tray':loc===false||loc==null?'fridge':
  (loc==='tray'||byId(loc)?loc:'fridge');
const asset=item=>import.meta.env.BASE_URL+'assets/'+item.image;
const isProduce=item=>['fruit','vegetable'].includes(item.category);

export function placementTask(item,destination){
  const returning=destination.id==='fridge';
  return {
    itemId:item.id,phase:'place',destinationId:destination.id,
    action:returning?'container_return':'container_place',
    english:returning
      ?'Put the '+item.en+' back in the fridge.'
      :'Put the '+item.en+' '+destination.prep+' the '+destination.en+'.',
    spanish:returning
      ?'Vuelve a guardar '+item.es+' en la refrigeradora.'
      :'Pon '+item.es+' '+destination.esPrep+' '+destination.es+'.'
  };
}
export function destinationsFor(item){
  if(item.category==='fruit')return ['basket','table','plate','fridge'].map(byId);
  if(item.category==='vegetable')return ['basket','counter','plate','fridge'].map(byId);
  if(item.id==='eggs')return ['basket','counter','plate','fridge'].map(byId);
  if(['milk','juice','yogurt','butter','cheese'].includes(item.id))
    return ['table','counter','fridge'].map(byId);
  return ['table','basket','plate','fridge'].map(byId);
}

export class FridgeFlow {
  constructor(engine){this.engine=engine;this.phase='browse';this.activeItem=null;this.target=null;this.roundsLeft=3;}
  get container(){return this.engine.current}
  state(){return this.engine.itemsState('fridge')}
  location(id){return normalize(this.state()[id])}
  setLocation(id,location){
    this.state()[id]=location==='fridge'?false:location;
    this.engine.persistStates();
  }
  inside(){return this.container.items.filter(item=>this.location(item.id)==='fridge')}
  tray(){return this.container.items.filter(item=>this.location(item.id)==='tray')}
  placed(id){return this.container.items.filter(item=>this.location(item.id)===id)}
  open(){
    this.phase='browse';this.activeItem=null;this.target=null;this.roundsLeft=3;
    this.engine.page=0;
    this.engine.pageSize=window.matchMedia('(max-width:760px)').matches?6:12;
    $('inventory-layer').classList.add('inventory-fridge-mode');
    $('inventory-fridge-heading').classList.remove('hidden');
    $('inventory-tray-section').classList.remove('hidden');
    $('inventory-place-section').classList.remove('hidden');
    $('inventory-reset-fridge').onclick=()=>this.restoreAll();
    this.renderExtras();
  }
  close(){
    $('inventory-layer').classList.remove('inventory-fridge-mode');
    $('inventory-fridge-heading').classList.add('hidden');
    $('inventory-tray-section').classList.add('hidden');
    $('inventory-place-section').classList.add('hidden');
    this.phase='browse';this.activeItem=null;this.target=null;
  }
  restoreAll(){
    for(const item of this.container.items)this.state()[item.id]=false;
    this.engine.persistStates();
    this.phase='browse';this.activeItem=null;this.target=null;
    this.engine.page=0;this.engine.task=null;
    this.engine.render();
    if(this.engine.mode==='discover')this.intro();
    else this.next();
    this.engine.showFeedback({
      en:'Put everything back in the fridge.',
      es:'Devuelve todos los alimentos a la refrigeradora.',
      note:'Los alimentos están nuevamente dentro.',tone:'good'
    });
  }
  intro(){
    this.engine.task=null;
    $('inventory-prompt').textContent='Take an item out of the fridge.';
    $('inventory-translation').textContent='Saca un alimento de la refrigeradora.';
    $('inventory-replay').disabled=false;
    this.engine.showFeedback({
      en:'Take an item out of the fridge.',
      es:'Saca un alimento de la refrigeradora.',
      note:'Toca un alimento; después elige dónde colocarlo.',tone:''
    });
    this.renderExtras();
  }
  next(){
    const e=this.engine;
    if(!this.container)return;
    if(e.advance){clearTimeout(e.advance);e.advance=null}
    e.locked=false;
    if(['story','sequence'].includes(e.mode)){
      if(this.roundsLeft<=0){
        e.task=null;this.phase='complete';this.activeItem=null;this.target=null;
        $('inventory-prompt').textContent='Mission complete!';
        $('inventory-translation').textContent='¡Secuencia completada!';
        $('inventory-replay').disabled=true;
        e.showFeedback({en:'Mission complete!',es:'¡Misión completada!',note:'Pulsa Otra orden para una nueva secuencia.',tone:'good'});
        this.renderExtras();return;
      }
    }
    const inside=this.inside();
    const available=inside.filter(i=>i.id!==e.previous);
    const chosen=random(available.length?available:inside);
    if(chosen){
      this.phase='pick';this.activeItem=chosen;this.target=null;
      e.choices=inside.length>8
        ?shuffle([chosen,...shuffle(inside.filter(i=>i.id!==chosen.id)).slice(0,7)])
        :shuffle(inside);
      e.task={...makeContainerTask(this.container,chosen,true),phase:'pick'};
    }else if(this.tray().length){
      const item=random(this.tray());
      e.choices=[];
      this.preparePlacement(item,true);
      return;
    }else{
      e.choices=[];
      this.phase='complete';this.activeItem=null;this.target=null;e.task=null;
      $('inventory-prompt').textContent='The fridge is empty.';
      $('inventory-translation').textContent='No quedan alimentos dentro.';
      $('inventory-replay').disabled=true;
      e.showFeedback({en:'Put the food back in the fridge.',es:'Devuelve los alimentos a la refrigeradora.',note:'Puedes usar «Reponer todo» para comenzar de nuevo.',tone:''});
      this.renderExtras();return;
    }
    this.announce(e.task,'Toca el alimento indicado dentro de la refrigeradora.');
    e.render();this.renderExtras();
  }
  announce(task,note='',play=true){
    const e=this.engine;
    e.task=task;
    $('inventory-replay').disabled=false;
    $('inventory-prompt').textContent=e.mode==='listening'?'♫ Listen carefully.':
      e.mode==='production'?task.spanish:task.english;
    $('inventory-translation').textContent=e.mode==='listening'?'Escucha y selecciona.':
      e.mode==='production'?'Selecciona el objeto que corresponde.':
      task.spanish;
    e.showFeedback({en:task.english,es:task.spanish,note,tone:''});
    if(play)speak(task.english);
  }
  preparePlacement(item,play=true){
    this.phase='place';this.activeItem=item;
    const options=destinationsFor(item);
    this.target=random(options);
    const task=placementTask(item,this.target);
    this.announce(task,'Selecciona el destino indicado en «Colócalo aquí».',play);
    this.engine.render();this.renderExtras();
  }
  record(task,correct){
    this.engine.record(task,correct);
    if(correct){this.engine.score++;this.engine.renderStats()}
  }
  selectInside(item){
    const e=this.engine;
    if(e.locked||this.phase==='place')return;
    if(e.mode!=='discover'&&this.phase!=='pick')return;
    if(this.location(item.id)!=='fridge')return;
    if(e.mode!=='discover' && this.phase==='pick' && e.task?.itemId!==item.id){
      this.record(e.task,false);
      e.showFeedback({en:e.task.english,es:e.task.spanish,note:'Todavía no: escucha y busca el alimento indicado.',tone:'bad'});
      return;
    }
    const take=makeContainerTask(this.container,item,true);
    this.setLocation(item.id,'tray');
    this.record(take,true);
    e.previous=item.id;
    e.app.showStudy(take.english,take.spanish,item.en+' · '+item.es);
    e.showFeedback({en:take.english,es:take.spanish,note:'✓ '+item.en+' pasó a Mi bandeja.',tone:'good'});
    e.render();this.renderExtras();
    this.preparePlacement(item,true);
  }
  selectTray(item){
    if(this.engine.locked||this.location(item.id)!=='tray')return;
    if(this.engine.mode!=='discover'){
      if(this.phase==='place'&&this.activeItem?.id===item.id){
        this.announce(this.engine.task,'Ahora toca el lugar correcto.',true);
      }
      return;
    }
    this.preparePlacement(item,true);
  }
  chooseDestination(id){
    const e=this.engine;
    if(e.locked)return;
    if(this.phase!=='place'||!this.activeItem){
      // In discovery, placed groceries can be picked up again and returned.
      if(e.mode==='discover'){
        const item=this.placed(id)[0];
        if(item){
          this.setLocation(item.id,'tray');
          const d=byId(id);
          const take={itemId:item.id,action:'container_pick_up',
            english:'Pick up the '+item.en+' from the '+d.en+'.',
            spanish:'Recoge '+item.es+' de '+(id==='plate'?'el':'la')+' '+d.es+'.'};
          this.record(take,true);
          e.app.showStudy(take.english,take.spanish,item.en+' · '+item.es);
          this.preparePlacement(item,true);
          return;
        }
      }
      e.showFeedback({en:'Choose an item from your tray.',es:'Selecciona un alimento de Mi bandeja.',note:'Primero saca un alimento de la refrigeradora.',tone:''});
      return;
    }
    if(e.mode!=='discover'&&this.target?.id!==id){
      this.record(e.task,false);
      e.showFeedback({en:e.task.english,es:e.task.spanish,note:'Ese no es el destino. Lee «in / on / back in» y prueba otra vez.',tone:'bad'});
      return;
    }
    const item=this.activeItem, destination=byId(id);
    if(!destination)return;
    const task=placementTask(item,destination);
    this.setLocation(item.id,id);
    this.record(task,true);
    e.app.showStudy(task.english,task.spanish,item.en+' · '+item.es+' · '+destination.en);
    e.showFeedback({en:task.english,es:task.spanish,note:'✓ '+item.en+' colocado en '+destination.es+'.',tone:'good'});
    $('inventory-prompt').textContent=task.english;
    $('inventory-translation').textContent=task.spanish;
    e.task=task;e.previous=item.id;
    this.phase='complete';this.activeItem=null;this.target=null;
    this.renderExtras();e.render();
    if(e.mode==='timed')e.advance=setTimeout(()=>{e.advance=null;this.next()},650);
    else if(['sequence','story'].includes(e.mode)){
      this.roundsLeft--;
      e.advance=setTimeout(()=>{e.advance=null;this.next()},2300);
    }
    // Otherwise hold the English result until the player presses "Otra orden".
  }
  renderExtras(){
    if(!this.container)return;
    const tray=this.tray();
    $('inventory-tray-count').textContent=tray.length+' alimento'+(tray.length===1?'':'s');
    const holder=$('inventory-tray-items');holder.replaceChildren();
    if(!tray.length){
      const empty=document.createElement('p');empty.className='inventory-empty';
      empty.textContent='Todavía no has sacado ningún alimento.';
      holder.append(empty);
    }else for(const item of tray){
      const btn=document.createElement('button');
      btn.type='button';btn.className='inventory-tray-item';
      btn.dataset.itemId=item.id;
      if(this.activeItem?.id===item.id)btn.classList.add('selected');
      btn.append(this.engine.createItemArt(item));
      const text=document.createElement('span');text.textContent=item.en;btn.append(text);
      btn.setAttribute('aria-label','Seleccionar '+item.en+' de Mi bandeja');
      btn.onclick=()=>this.selectTray(item);holder.append(btn);
    }
    const destinations=$('inventory-place-targets');destinations.replaceChildren();
    const dlist=this.activeItem?destinationsFor(this.activeItem):
      FRIDGE_DESTINATIONS;
    for(const target of dlist){
      const placed=this.placed(target.id);
      const button=document.createElement('button');
      button.type='button';button.dataset.destination=target.id;
      button.className='inventory-destination';
      const highlighted=this.phase==='place'&&this.target?.id===target.id&&this.engine.mode==='discover';
      if(highlighted)button.classList.add('hint');
      const image=document.createElement('span');image.className='inventory-destination-art';
      if(target.image){
        const img=document.createElement('img');img.src=asset(target);img.alt='';image.append(img);
      }else image.textContent=target.emoji;
      const name=document.createElement('strong');name.textContent=target.en;
      const sub=document.createElement('small');sub.textContent=target.es+(placed.length?' · '+placed.length:'');
      button.append(image,name,sub);
      if(placed.length){
        const sample=this.engine.createItemArt(placed[placed.length-1]);
        sample.classList.add('destination-item-preview');button.append(sample);
      }
      button.onclick=()=>this.chooseDestination(target.id);
      destinations.append(button);
    }
    $('inventory-place-hint').textContent=this.phase==='place'&&this.activeItem
      ?'Selecciona dónde colocar '+this.activeItem.en+'.'
      :'Toca un alimento de la bandeja para indicar dónde colocarlo.';
    $('inventory-inside-count').textContent=this.inside().length+' dentro';
  }
}
