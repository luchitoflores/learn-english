import { allPhrases } from '../data/rooms.js';
import { isAvailable } from '../data/actions.js';
import { speak } from './audio.js';
import { remember,saveProgress } from './storage.js';

export const MODES=[
  {id:'discover',icon:'✦',label:'Descubrir',help:'Toca cualquier objeto y explora sus acciones.'},
  {id:'orders',icon:'◎',label:'Órdenes',help:'Escucha y realiza la orden en inglés.'},
  {id:'sequence',icon:'☷',label:'Secuencias',help:'Completa varias acciones en orden.'},
  {id:'timed',icon:'◷',label:'Contrarreloj',help:'Haz tantas acciones como puedas en 60 segundos.'},
  {id:'production',icon:'✎',label:'Producción',help:'Observa la animación y elige la expresión adecuada.'},
  {id:'phrasal',icon:'◇',label:'Phrasal verbs',help:'Relaciona cada expresión con su significado contextual.'},
  {id:'listening',icon:'♫',label:'Listening',help:'Escucha sin leer y realiza la acción.'},
  {id:'story',icon:'▤',label:'Historias',help:'Vive una pequeña historia en esta habitación.'}
];
const shuffle=a=>[...a].sort(()=>Math.random()-.5);

export class ModeEngine {
  constructor(app){this.app=app;this.mode='discover';this.mission=null;this.sequence=[];this.timer=null;this.timeLeft=60;this.score=0;this.locked=false;this.previous=new Set();}
  get room(){return this.app.room}
  get pool(){return allPhrases(this.room).filter(({object,phrase})=>isAvailable(object,phrase))}
  setMode(mode){
    if(!MODES.some(m=>m.id===mode))return;
    this.clearTimer();this.mode=mode;this.mission=null;this.sequence=[];this.previous.clear();this.locked=false;
    if(mode==='timed'){this.timeLeft=60;this.score=0;this.timer=setInterval(()=>this.tick(),1000)}
    this.app.drawModes();
    if(mode==='discover')this.app.setMission('Descubre las acciones','Toca un objeto y elige qué hará el personaje. Puedes practicar sin límites.',false);
    else if(['sequence','story'].includes(mode)){this.createSequence();this.nextSequence();}
    else this.newMission();
  }
  clearTimer(){if(this.timer)clearInterval(this.timer);this.timer=null}
  tick(){
    if(this.mode!=='timed'){this.clearTimer();return}
    this.timeLeft--;this.app.updateTimer(this.timeLeft,this.score);
    if(this.timeLeft<=0){this.clearTimer();this.locked=true;this.app.setMission('¡Tiempo terminado!',`Lograste ${this.score} órdenes. Cambia de modo para continuar.`,false);this.app.clearOptions();}
  }
  randomTask(filter=()=>true){
    let candidates=this.pool.filter(filter);
    if(!candidates.length){this.app.setMission('Reinicia la habitación','Ya completaste todas las acciones disponibles. Usa «Restablecer habitación».',false);return null}
    const uncommon=candidates.filter(({object,phrase})=>!this.previous.has(`${object.id}:${phrase.action}`));
    if(uncommon.length)candidates=uncommon;
    candidates.sort((a,b)=>{
      const stat=x=>this.app.progress.practice[`${this.room.id}/${x.object.id}/${x.phrase.action}/${x.phrase.english}`]||0;
      return stat(a)-stat(b);
    });
    const subset=candidates.slice(0,Math.max(3,Math.ceil(candidates.length*.45)));
    const target=subset[Math.floor(Math.random()*subset.length)];
    this.previous.add(`${target.object.id}:${target.phrase.action}`);
    if(this.previous.size>=this.pool.length-2)this.previous.clear();
    return target;
  }
  async newMission(){
    if(this.locked)return;
    const poolFilter=this.mode==='phrasal'?(_,phrase)=>phrase.type==='phrasal':()=>true;
    const task=this.randomTask(({object,phrase})=>poolFilter(object,phrase));
    if(!task)return;
    this.mission=task;
    this.app.clearOptions();
    const {phrase,object}=task;
    if(this.mode==='production'){
      this.app.setMission('¿Qué acción observaste?',`Mira cómo actúa el personaje con «${object.name}» y elige la frase correcta.`,false);
      this.locked=true;
      await this.app.scene.previewAction(object,phrase);
      this.locked=false;this.drawChoices('english');
    }else if(this.mode==='phrasal'){
      this.app.setMission('Phrasal verb challenge',`¿Qué expresión significa «${phrase.spanish}»?`,false);
      this.drawChoices('english');
    }else if(this.mode==='listening'){
      this.app.setMission('Escucha y actúa',`La orden está oculta. Escucha y toca el objeto y la acción que corresponden.`,true);
      speak(phrase.english);
    }else{
      this.app.setMission(this.mode==='timed'?`⏱ ${this.timeLeft}s · ${this.score} puntos`:'Sigue la orden',phrase.english,true);
      speak(phrase.english);
    }
  }
  createSequence(){
    const pool=shuffle(this.pool);
    const used=new Set();
    this.sequence=pool.filter(t=>{if(used.has(t.object.id))return false;used.add(t.object.id);return true}).slice(0,this.mode==='story'?4:3);
  }
  nextSequence(){
    if(!this.sequence.length){this.app.setMission('¡Misión completada!','Terminaste toda la secuencia. Pulsa «Otra misión» para practicar más.',false);this.mission=null;return}
    this.mission=this.sequence[0];
    const index=this.mode==='story'?5-this.sequence.length:4-this.sequence.length;
    const {phrase}=this.mission;
    this.app.setMission(this.mode==='story'?`Historia · paso ${index}`:`Secuencia · paso ${index}`,phrase.english,true);
    speak(phrase.english);
  }
  drawChoices(type){
    const {phrase}=this.mission;
    const all=this.pool.map(x=>x.phrase).filter(p=>p.english!==phrase.english);
    const distractors=shuffle(all).filter((p,i,a)=>a.findIndex(z=>z.english===p.english)===i).slice(0,3);
    const options=shuffle([phrase,...distractors]);
    this.app.setOptions(options.map(p=>({text:type==='english'?p.english:p.spanish,callback:()=>this.pickChoice(p===phrase)})));
  }
  async pickChoice(correct){
    if(this.locked||!this.mission)return;
    this.locked=true;
    const {object,phrase}=this.mission;
    if(correct){
      if(this.mode==='phrasal')await this.app.scene.executeAction(object,phrase);
      this.record(true);this.app.feedback(true,`${phrase.english} · ${phrase.spanish}`);
    }else{this.record(false);this.app.feedback(false,`Respuesta: ${phrase.english} · ${phrase.spanish}`)}
    setTimeout(()=>{this.locked=false;if(this.mode==='production'||this.mode==='phrasal')this.newMission()},950);
  }
  async choose(object,phrase){
    if(this.locked)return;
    if(this.mode==='production'||this.mode==='phrasal')return;
    if(this.mode==='discover'){
      this.locked=true;
      await this.app.scene.executeAction(object,phrase);
      this.record(true);this.app.feedback(true,`${phrase.english} · ${phrase.spanish}`);speak(phrase.english);
      this.locked=false;this.app.closeActionPanel();return;
    }
    if(!this.mission)return;
    this.locked=true;
    const correct=(object.id===this.mission.object.id && phrase.action===this.mission.phrase.action && phrase.english===this.mission.phrase.english);
    if(correct){
      await this.app.scene.executeAction(object,phrase);
      this.record(true);this.app.feedback(true,`${phrase.english} · ${phrase.spanish}`);speak(phrase.english);
      if(this.mode==='timed')this.score++;
      if(['sequence','story'].includes(this.mode))this.sequence.shift();
    }else{this.record(false);this.app.feedback(false,`Intenta: ${this.mission.phrase.english} (${this.mission.phrase.spanish})`)}
    this.app.closeActionPanel();
    setTimeout(()=>{
      this.locked=false;
      if(['sequence','story'].includes(this.mode))this.nextSequence();else this.newMission();
    },950);
  }
  record(correct){
    const task=this.mode==='discover'?this.app.selected:this.mission;
    if(!task)return;
    remember(this.app.progress,this.room.id,task.object.id,task.phrase,correct);
    this.app.drawProgress();
  }
  reset(){
    this.previous.clear();this.locked=false;this.app.resetRoom();
  }
  onRoomChange(){this.clearTimer();const mode=this.mode;this.setMode(mode)}
}
