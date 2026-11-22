import Phaser from 'phaser';
import { ROOMS, cloneRoom, ROOM_ORDER } from './data/rooms.js';
import { ACTIONS, isAvailable } from './data/actions.js';
import { RoomScene } from './core/RoomScene.js';
import { ModeEngine, MODES } from './core/ModeEngine.js';
import { loadProgress,saveProgress } from './core/storage.js';
import { speak,repeatSpeech } from './core/audio.js';
import { validateRooms } from './core/validator.js';
import './style.css';

const $=id=>document.getElementById(id);
const h=(tag,props={},children=[])=>{const el=document.createElement(tag);Object.assign(el,props);for(const child of children)el.append(child);return el};
const loadCustom=()=>{try{const raw=localStorage.getItem('wq-custom-rooms');return raw?JSON.parse(raw):null}catch{return null}};

class GameApp {
  constructor(){
    this.progress=loadProgress();this.custom=loadCustom();this.cache={};this.scene=null;this.selected=null;
    this.roomId=this.progress.room||'bedroom';if(!ROOMS[this.roomId])this.roomId='bedroom';
    this.modeEngine=new ModeEngine(this);this.editorActive=false;this.movement=0;this.entryX=null;this.lastStudy=null;
    this.initEvents();this.drawModes();this.drawProgress();this.setupPhaser();
  }
  get room(){return this.getRoom(this.roomId)}
  getRoom(id){if(!this.cache[id])this.cache[id]=cloneRoom(id,this.custom);return this.cache[id]}
  setupPhaser(){
    const viewport=$('game');
    this.game=new Phaser.Game({
      type:Phaser.AUTO,parent:'game',backgroundColor:'#282b44',
      width:Math.max(320,viewport.clientWidth||640),
      height:Math.max(240,viewport.clientHeight||360),
      transparent:false,
      // RESIZE fills the portrait game panel; the scene camera decides how
      // much of the 1280×720 room to show instead of letterboxing it.
      scale:{mode:Phaser.Scale.RESIZE},
      render:{antialias:true,pixelArt:false},
      scene:[],
      callbacks:{postBoot:(game)=>game.scene.add('RoomScene',RoomScene,true,{controller:this,roomId:this.roomId})}
    });
  }
  onRoomReady(scene){
    this.scene=scene;
    $('room-en').textContent=this.room.en.toUpperCase();
    $('room-name').textContent=this.room.name;
    $('location-tag').innerHTML=this.room.name.toUpperCase()+' <span> · EXPLORE</span>';
    this.drawRoomExits();
    this.modeEngine.onRoomChange();
    this.toast(`Llegaste a ${this.room.name}. Toca un objeto para escuchar su nombre.`);
  }
  switchRoom(id,{fromRoom=this.roomId,throughDoor=false,force=false}={}){
    if(!ROOMS[id])return false;
    if(id===this.roomId && !force){this.closeModal();return true;}
    const returnDoor=ROOMS[id].exits.find(exit=>exit.to===fromRoom);
    const entryX=throughDoor&&returnDoor?(returnDoor.x<640?145:1135):640;
    if(!this.scene?.sys.isActive()){
      this.toast('La habitación todavía está cargando.');
      return false;
    }
    if(this.scene.busy){
      this.toast('Termina la acción antes de cambiar de habitación.');
      return false;
    }
    this.modeEngine.cancelPending();
    this.movement=0;
    this.closeActionPanel();this.closeModal();
    // Update the artwork and hitboxes first; only announce a room change
    // once the scene has actually swapped all visible objects.
    const swapped=this.scene.changeRoom(id,entryX);
    if(!swapped){
      this.toast('No fue posible cambiar de habitación.');
      return false;
    }
    this.selected=null;
    this.roomId=id;
    this.progress.room=id;
    saveProgress(this.progress);
    this.onRoomReady(this.scene);
    return true;
  }
  drawRoomExits(){
    const exits=$('room-exits');
    exits.replaceChildren(...this.room.exits.map(exit=>{
      const left=exit.x<640;
      const button=h('button',{
        type:'button',
        className:'room-exit '+(left?'to-left':'to-right'),
        title:'Ir a '+exit.label,
        textContent:(left?'◀ ':'')+exit.label+(left?'':' ▶')
      });
      button.setAttribute('aria-label','Ir a '+exit.label);
      // DOM navigation bypasses canvas object hitboxes and door walk delays.
      button.onclick=e=>{e.preventDefault();e.stopPropagation();this.switchRoom(exit.to,{fromRoom:this.roomId,throughDoor:true})};
      return button;
    }));
  }
  drawModes(){
    $('mode-dock').replaceChildren(...MODES.map(mode=>{
      const b=h('button',{className:mode.id===this.modeEngine.mode?'active':'',title:mode.help});
      b.append(h('span',{className:'mode-icon',textContent:mode.icon}),h('span',{textContent:mode.label}));
      b.addEventListener('click',()=>{this.closeActionPanel();this.modeEngine.setMode(mode.id);});return b;
    }));
    const mode=MODES.find(m=>m.id===this.modeEngine.mode);
    if(mode)$('info-hint').textContent=`✦ ${mode.help}`;
  }
  drawProgress(){
    const p=this.progress;
    $('xp').textContent=`★ ${p.xp} XP`;
    $('mastered').textContent=`${Object.keys(p.discovered).length} descubiertas`;
    $('statline').textContent=`${p.correct} actividades correctas · ${p.streak} racha`;
  }
  selectObject(object){
    this.selected={object,phrase:null};
    this.showStudy(object.name,object.es,`Objeto de ${this.room.name} · Elige una acción.`);
    $('action-name').textContent=object.name;
    $('action-spanish').textContent=object.es;
    const actions=object.phrases.filter(p=>isAvailable(object,p));
    const possible=actions.length?actions:[];
    $('action-list').replaceChildren(...possible.map(phrase=>{
      const b=h('button');
      b.append(h('strong',{textContent:phrase.english}),h('small',{textContent:`${phrase.spanish} · ${phrase.level}`}));
      b.onclick=async()=>{this.selected={object,phrase};this.closeActionPanel();await this.modeEngine.choose(object,phrase)};
      return b;
    }));
    if(!possible.length)$('action-list').textContent='Este objeto ya no tiene acciones disponibles en su estado actual. Restablece la habitación.';
    $('action-layer').classList.remove('hidden');
  }
  closeActionPanel(){$('action-layer').classList.add('hidden')}
  setMission(title,content,showAudio=true){
    $('mission-title').textContent=title;$('mission-text').textContent=content;
    $('play-order').style.display=showAudio?'':'none';
    if(this.modeEngine.mode!=='timed')$('timer').textContent='';
  }
  updateTimer(left,score){$('timer').textContent=`${left}s · ${score} puntos`}
  showStudy(english,spanish,context=''){
    this.lastStudy={english,spanish,context};
    $('study-english').textContent=english;
    $('study-spanish').textContent=spanish;
    $('study-context').textContent=context;
    $('study-replay').disabled=false;
  }
  clearOptions(){$('answer-options').replaceChildren()}
  setOptions(items){$('answer-options').replaceChildren(...items.map(({text,callback})=>{
    const b=h('button',{textContent:text});b.onclick=callback;return b;
  }))}
  toast(msg,kind){
    const el=$('status');el.textContent=msg;el.className=`status visible ${kind||''}`;
    clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('visible'),2300);
  }
  feedback(correct,msg){this.toast(`${correct?'✓ Correcto':'✕ Revisa'} · ${msg}`,correct?'good':'bad')}
  resetRoom(){
    this.cache[this.roomId]=cloneRoom(this.roomId,this.custom);
    this.switchRoom(this.roomId,{force:true});
  }
  showMap(){
    $('modal-title').textContent='Mapa de la casa';
    const rooms=h('div',{className:'map-rooms'},ROOM_ORDER.map(id=>{
      const room=ROOMS[id];const button=h('button');
      button.append(h('img',{src:`${import.meta.env.BASE_URL}assets/rooms/${id}.png`,alt:room.name}),h('span',{textContent:room.name}));
      button.onclick=()=>this.switchRoom(id);return button;
    }));
    const lab=h('a',{
      className:'avatar-lab-link',
      href:`${import.meta.env.BASE_URL}character-lab/`,
      textContent:'✦ Taller de personaje modular · Prueba expresiones y apariencias'
    });
    $('modal-content').replaceChildren(rooms,lab);
    $('modal-layer').classList.remove('hidden');
  }
  closeModal(){$('modal-layer').classList.add('hidden')}
  initEvents(){
    $('repeat').onclick=repeatSpeech;
    $('play-order').onclick=()=>this.modeEngine.mission && speak(this.modeEngine.mission.phrase.english);
    $('study-replay').onclick=()=>this.lastStudy && speak(this.lastStudy.english);
    $('map').onclick=()=>this.showMap();
    $('reset').onclick=()=>this.modeEngine.reset();
    $('new-task').onclick=()=>{if(['sequence','story'].includes(this.modeEngine.mode)){this.modeEngine.createSequence();this.modeEngine.nextSequence()}else this.modeEngine.newMission()};
    $('close-action').onclick=$('action-x').onclick=()=>this.closeActionPanel();
    $('close-modal').onclick=$('modal-x').onclick=()=>this.closeModal();
    $('editor-close-bg').onclick=$('editor-close').onclick=()=>this.closeEditor();
    document.addEventListener('keydown',e=>{
      if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='e'){e.preventDefault();this.toggleEditor()}
      if(e.key==='Escape'){this.closeActionPanel();this.closeModal();this.closeEditor()}
    });
    const bindHold=(button,value)=>{
      const el=$(button);
      el.addEventListener('pointerdown',e=>{e.preventDefault();this.movement=value;el.setPointerCapture(e.pointerId)});
      for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>{this.movement=0});
    };
    bindHold('move-left',-1);bindHold('move-right',1);
    $('editor-export').onclick=()=>{
      const data=JSON.stringify(this.exportRooms(),null,2);const link=document.createElement('a');
      link.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));link.download='word-quest-rooms.json';link.click();
      setTimeout(()=>URL.revokeObjectURL(link.href),1000);
    };
    $('editor-apply').onclick=()=>this.applyEditor($('editor-json').value);
    $('editor-file').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      const content=await file.text();$('editor-json').value=content;this.applyEditor(content);
    };
  }
  exportRooms(){const out={};for(const id of ROOM_ORDER)out[id]=this.getRoom(id);return out}
  toggleEditor(){
    if(this.editorActive){this.editorActive=false;this.closeEditor();this.toast('Modo editor desactivado.');return}
    this.editorActive=true;$('editor-json').value=JSON.stringify(this.exportRooms(),null,2);
    $('editor-message').textContent='Modo edición activo. Cierra esta ventana para arrastrar objetos; Ctrl+Mayús+E para terminar.';
    $('editor-layer').classList.remove('hidden');this.toast('Editor activo: arrastra los objetos y exporta el JSON.');
  }
  closeEditor(){
    $('editor-layer').classList.add('hidden');
    // Editor mode remains enabled while the panel is closed for dragging, until toggled off.
  }
  applyEditor(raw){
    try{
      const json=JSON.parse(raw);
      const errors=validateRooms(json);
      if(errors.length)throw Error(errors.slice(0,9).join(' | '));
      for(const id of ROOM_ORDER)if(!json[id])throw Error(`Falta la habitación ${id}`);
      this.custom={rooms:json};localStorage.setItem('wq-custom-rooms',JSON.stringify(this.custom));
      this.cache={};$('editor-message').textContent='✓ Configuración validada y guardada localmente.';
      this.closeEditor();this.switchRoom(this.roomId,{force:true});
    }catch(e){$('editor-message').textContent=`✕ ${e.message}`}
  }
}
try{const app=new GameApp();window.wordQuest=app}catch(error){
 console.error(error);document.querySelector('#app').innerHTML=`<p style="padding:40px;color:#ffdaaa">No se pudo iniciar Word Quest: ${String(error.message).replaceAll('<','&lt;')}. Comprueba que has instalado las dependencias con npm install.</p>`;
}
