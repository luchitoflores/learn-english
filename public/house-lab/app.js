import { GROUPS,totalObjects } from './data.js';

// Static, offline-friendly Word Quest House Lab. The whole catalog is editable data.
// All activities share the same item metadata and vocabulary history.
const $=id=>document.getElementById(id);
const AREAS=[['all','Todos'],['kitchen','Cocina'],['bathroom','Baño'],['garage','Garaje'],['bedroom','Dormitorio'],['utility','Limpieza y ropa'],['garden','Jardín']];
const MODES={explore:'Descubrir',listen:'Escuchar',find:'Reconocer',sentences:'Órdenes',dictation:'Dictado',review:'Repasar'};
const STORE_KEY='word-quest-house-lab-v1';
let progress={};
try{progress=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');if(!progress||typeof progress!=='object')progress={}}catch{progress={}}
let group=null,area='all',mode='explore',page=0,selected=null,task=null,choices=[],solved=false;
let points=0,questionIndex=0,lastId='',lastSpeech='',phrase='',hint=false,wrongId='';
const PAGE_SIZE=12;
const idOf=(g,item)=>g.id+'::'+item.en.toLowerCase();
const getRecord=(g,item)=>progress[idOf(g,item)]||{status:'new',seen:0,correct:0,wrong:0};
const save=()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(progress))}catch{}};
function track(g,item,changes={}){
  const key=idOf(g,item),prev=getRecord(g,item);
  progress[key]={...prev,...changes};save();updateStats();
}
const make=(tag,cls='',content)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(content!==undefined)e.textContent=content;
  return e;
};
const normalized=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const shuffle=arr=>[...arr].sort(()=>Math.random()-.5);
const random=arr=>arr[Math.floor(Math.random()*arr.length)];
function say(text){
  lastSpeech=text;
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return false;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-US';u.rate=.84;u.pitch=1;
  const english=window.speechSynthesis.getVoices().filter(v=>v.lang?.toLowerCase().startsWith('en'));
  u.voice=english.find(v=>/en-US/i.test(v.lang))||english[0]||null;
  window.speechSynthesis.speak(u);return true;
}
function art(item){
  const element=make('span','vocab-art');
  element.setAttribute('aria-hidden','true');
  if(Number.isInteger(item.spriteIndex)){
    element.classList.add('atlas');
    element.style.backgroundImage='url("../assets/'+item.image+'")';
    const col=item.spriteIndex%7,row=Math.floor(item.spriteIndex/7);
    element.style.backgroundSize='448px 320px';
    element.style.backgroundPosition=(-64*col)+'px '+(-64*row)+'px';
  }else if(item.image){
    const img=make('img');img.src='../assets/'+item.image;img.alt='';img.loading='lazy';element.append(img);
  }else{
    element.textContent=item.emoji||'📦';
  }
  return element;
}
function updateStats(){
  let known=0,learning=0;
  for(const g of GROUPS)for(const item of g.items){
    const state=getRecord(g,item).status;
    if(state==='known')known++;
    else if(state==='learning')learning++;
  }
  $('stat-groups').textContent=String(GROUPS.length);
  $('stat-words').textContent=String(totalObjects);
  $('stat-known').textContent=String(known);
  $('stat-learning').textContent=String(learning);
  if(group){
    const seen=group.items.filter(i=>getRecord(group,i).seen>0).length;
    $('group-progress').textContent=seen+' de '+group.items.length+' descubiertas';
  }
}
function renderFilters(){
  $('area-filters').replaceChildren(...AREAS.map(([key,label])=>{
    const btn=make('button',key===area?'active':'',label);
    btn.type='button';btn.dataset.area=key;
    btn.setAttribute('aria-pressed',String(key===area));
    btn.onclick=()=>{area=key;renderFilters();renderBoard()};
    return btn;
  }));
}
function renderBoard(){
  const term=normalized($('group-search').value);
  const filtered=GROUPS.filter(g=>(area==='all'||g.area===area)&&
    (!term||normalized([g.en,g.es,g.description,...g.items.flatMap(i=>[i.en,i.es])].join(' ')).includes(term)));
  $('group-total').textContent=filtered.length+' disponibles';
  $('container-board').replaceChildren(...filtered.map(g=>{
    const card=make('button','container-card');card.type='button';card.dataset.group=g.id;
    const top=make('div','card-top');
    top.append(make('span','card-emoji',g.emoji),make('span','card-count',g.items.length+' objetos'));
    card.append(top,make('strong','',g.es),make('span','english',g.en),make('p','',g.description));
    card.onclick=()=>openGroup(g.id);
    return card;
  }));
  if(!filtered.length)$('container-board').append(make('p','empty-message','No encontré contenedores con esa búsqueda.'));
}
function openGroup(id){
  group=GROUPS.find(g=>g.id===id);
  if(!group)return;
  $('board-screen').classList.add('hidden');$('lab-screen').classList.remove('hidden');
  $('lab-area').textContent=(AREAS.find(a=>a[0]===group.area)?.[1]||'Casa').toUpperCase();
  $('lab-emoji').textContent=group.emoji;
  $('lab-name').textContent=group.es;
  $('lab-description').textContent=group.en+' · '+group.description;
  $('lab-total').textContent=group.items.length+' objetos';
  points=0;questionIndex=0;lastId='';
  setMode('explore');
  window.scrollTo({top:0,behavior:'instant'});
}
function goBoard(){
  group=null;task=null;selected=null;
  $('lab-screen').classList.add('hidden');$('board-screen').classList.remove('hidden');
  renderBoard();window.scrollTo({top:0,behavior:'instant'});
}
function feedback(en,es,detail='',tone=''){
  $('feedback-panel').dataset.tone=tone;
  $('feedback-en').textContent=en;
  $('feedback-es').textContent=es;
  $('feedback-detail').textContent=detail;
}
function setMode(next){
  if(!MODES[next]||!group)return;
  mode=next;page=0;selected=null;task=null;choices=[];solved=false;hint=false;wrongId='';
  document.querySelectorAll('[data-mode]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.mode===mode);
    btn.setAttribute('aria-pressed',String(btn.dataset.mode===mode));
  });
  $('dictation-area').classList.toggle('hidden',mode!=='dictation');
  $('vocab-grid').classList.toggle('hidden',mode==='dictation');
  $('hint-button').classList.toggle('hidden',mode==='explore');
  $('mark-known').disabled=true;$('mark-learning').disabled=true;
  $('next-exercise').classList.toggle('hidden',mode==='explore');
  $('listen-button').disabled=mode==='explore';
  $('session-score').textContent=points+' aciertos';
  $('status-message').textContent=MODES[mode];
  if(mode==='explore'){
    $('desk-title').textContent='Toca cualquier objeto para descubrirlo';
    $('desk-subtitle').textContent='Escucha su nombre, mira su significado y marca si ya lo conoces.';
    $('mission-prompt').textContent='Discover the objects.';
    $('mission-helper').textContent='Explora libremente. No hay obligación de sacar ni guardar nada.';
    feedback('Ready to explore?','¿Qué hay dentro?','Selecciona cualquier ilustración para descubrir su nombre.');
    renderGrid();
  }else newQuestion();
  updateStats();
}
function weightedTask(){
  let pool=group.items.filter(i=>idOf(group,i)!==lastId);
  if(!pool.length)pool=group.items;
  if(mode==='review'){
    const need=pool.filter(i=>getRecord(group,i).status==='learning'||getRecord(group,i).wrong>getRecord(group,i).correct);
    if(need.length)pool=need;
    else{
      const unfamiliar=pool.filter(i=>getRecord(group,i).status!=='known');
      if(unfamiliar.length)pool=unfamiliar;
    }
  }else{
    const unknown=pool.filter(i=>getRecord(group,i).status!=='known');
    if(unknown.length)pool=unknown;
  }
  const weighted=[];
  for(const item of pool){
    const r=getRecord(group,item);
    const count=r.status==='learning'?5:r.status==='new'?3:1;
    for(let i=0;i<count;i++)weighted.push(item);
  }
  return random(weighted);
}
const templates=[
  word=>'Show me the '+word+'.',
  word=>'Can you find the '+word+'?',
  word=>'Where is the '+word+'?',
  word=>'Point to the '+word+'.',
  word=>'I need the '+word+'.',
  word=>'Choose the '+word+'.'
];
function newQuestion(){
  task=weightedTask();selected=null;hint=false;solved=false;wrongId='';
  if(!task)return;
  lastId=idOf(group,task);
  choices=shuffle([task,...shuffle(group.items.filter(i=>i!==task)).slice(0,5)]);
  phrase=random(templates)(task.en);
  questionIndex++;
  $('mark-known').disabled=true;$('mark-learning').disabled=true;
  $('next-exercise').textContent='Otra palabra →';
  $('session-score').textContent=points+' aciertos';
  $('status-message').textContent='Pregunta '+questionIndex;
  $('hint-button').textContent='Aa Mostrar texto';
  if(mode==='dictation'){
    $('desk-title').textContent='Escribe la palabra que escuchas';
    $('desk-subtitle').textContent='Escucha, observa el objeto y escribe su nombre en inglés.';
    $('dictation-picture').replaceChildren(art(task));
    $('dictation-input').value='';
    $('mission-prompt').textContent='♫ Listen and write.';
    $('mission-helper').textContent='Pulsa Escuchar y escribe la palabra. La respuesta no se muestra antes de comprobar.';
  }else if(mode==='listen'||mode==='review'){
    $('desk-title').textContent=mode==='review'?'Repaso de palabras pendientes':'Escucha y toca el objeto correcto';
    $('desk-subtitle').textContent='Las etiquetas están ocultas para que reconozcas las imágenes.';
    $('mission-prompt').textContent='♫ Listen carefully.';
    $('mission-helper').textContent='Escucha una orden en inglés y elige la ilustración correcta.';
  }else if(mode==='find'){
    $('desk-title').textContent='Reconoce el vocabulario';
    $('desk-subtitle').textContent='Lee el significado en español y señala su imagen.';
    $('mission-prompt').textContent='Encuentra: '+task.es;
    $('mission-helper').textContent='Selecciona el objeto correcto. Puedes escuchar la palabra en inglés.';
  }else{
    $('desk-title').textContent='Escucha y cumple una orden';
    $('desk-subtitle').textContent='Elige el objeto mencionado en la oración inglesa.';
    $('mission-prompt').textContent=phrase;
    $('mission-helper').textContent='Escucha la frase y señala el objeto. Sin sacar ni devolver objetos.';
  }
  feedback('Your turn!','Te toca responder','Escucha, piensa y selecciona. Puedes repetir el audio.');
  $('listen-button').disabled=false;
  $('next-exercise').classList.remove('hidden');
  renderGrid();
  if(mode==='listen'||mode==='review'||mode==='dictation'||mode==='sentences')say(mode==='dictation'?task.en:phrase);
}
function renderGrid(){
  if(!group)return;
  const free=mode==='explore',visible=free?group.items.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE):choices;
  const pages=Math.max(1,Math.ceil(group.items.length/PAGE_SIZE));
  $('page-indicator').textContent=free?(page+1)+' / '+pages:'6 opciones';
  $('page-prev').disabled=!free||page<=0;
  $('page-next').disabled=!free||page>=pages-1;
  $('page-prev').classList.toggle('hidden',!free);
  $('page-next').classList.toggle('hidden',!free);
  $('selection-count').textContent=free?'Página '+(page+1)+' de '+pages:'Elige una de las seis imágenes';
  $('vocab-grid').replaceChildren(...visible.map(item=>{
    const key=idOf(group,item),r=getRecord(group,item);
    const btn=make('button','vocab-card');btn.type='button';
    btn.dataset.word=item.en;
    if(selected===item||solved&&task===item)btn.classList.add('chosen');
    if(solved&&task===item)btn.classList.add('correct');
    if(wrongId===item.en&&!solved)btn.classList.add('wrong');
    const dot=make('span','word-status',r.status==='known'?'✓':r.status==='learning'?'☆':'');
    if(r.status!=='new')dot.classList.add(r.status);
    const label=make('span','vocab-name');
    if(free){
      const visibleName=r.seen>0||selected===item;
      label.textContent=visibleName?item.en:'?';
      if(!visibleName)label.classList.add('hidden-name');
    }else label.textContent=solved&&task===item?item.en:'?';
    btn.setAttribute('aria-label',free?'Descubrir objeto '+(r.seen>0?item.en:'oculto'):'Elegir una imagen');
    btn.append(dot,art(item),label);
    btn.onclick=()=>free?discover(item):answer(item);
    return btn;
  }));
}
function discover(item){
  selected=item;const r=getRecord(group,item);
  track(group,item,{seen:(r.seen||0)+1});
  feedback(item.en,item.es,'♫ Pulsa o escucha la palabra. Marca si ya la conocías.','good');
  $('mark-known').disabled=false;$('mark-learning').disabled=false;
  $('listen-button').disabled=false;
  say(item.en);renderGrid();
}
function registerWrong(){
  if(!task)return;
  const r=getRecord(group,task);
  track(group,task,{seen:(r.seen||0)+1,wrong:(r.wrong||0)+1,status:'learning'});
}
function registerRight(){
  if(!task)return;
  const r=getRecord(group,task);
  const good=(r.correct||0)+1;
  track(group,task,{seen:(r.seen||0)+1,correct:good,status:r.status==='known'||good>=3&&r.wrong<=good-2?'known':'learning'});
  points++;
  $('session-score').textContent=points+' aciertos';
  $('mark-known').disabled=false;$('mark-learning').disabled=false;
  $('status-message').textContent='¡Correcto!';
}
function answer(item){
  if(solved||!task)return;
  if(item!==task){
    wrongId=item.en;registerWrong();
    feedback('Try again.','Vuelve a intentarlo.','Ese no es el objeto. Repite el audio y observa las otras imágenes.','bad');
    renderGrid();return;
  }
  selected=item;solved=true;wrongId='';
  registerRight();renderGrid();
  const message=mode==='sentences'?phrase:task.en;
  feedback(message,task.es,'✓ ¡Bien! '+task.en+' = '+task.es+'. Puedes marcarla como conocida.','good');
  say(mode==='sentences'?phrase:task.en);
}
function checkDictation(e){
  e.preventDefault();
  if(!task||solved)return;
  const typed=normalized($('dictation-input').value);
  if(!typed)return;
  if(typed!==normalized(task.en)){
    registerWrong();
    feedback('Not quite.','Intenta otra vez.','Escucha con atención, revisa las letras y vuelve a escribir.','bad');
    return;
  }
  solved=true;selected=task;registerRight();
  feedback(task.en,task.es,'✓ Escribiste correctamente la palabra en inglés.','good');
  say(task.en);
}
function mark(status){
  const item=selected;
  if(!item||!group)return;
  const r=getRecord(group,item);
  track(group,item,{...r,status,seen:Math.max(1,r.seen||0)});
  feedback(item.en,item.es,status==='known'?'✓ La priorizaremos menos en los repasos.':'☆ Volverá a aparecer en futuras prácticas.','good');
  renderGrid();
}
function showHint(){
  if(!task)return;
  hint=!hint;
  $('hint-button').textContent=hint?'Aa Ocultar texto':'Aa Mostrar texto';
  if(hint){
    $('mission-helper').textContent='Pista: '+(mode==='dictation'?task.en:phrase);
    const r=getRecord(group,task);
    track(group,task,{status:'learning',seen:r.seen});
  }else{
    $('mission-helper').textContent='Escucha de nuevo y señala el objeto correcto.';
  }
}
$('group-search').addEventListener('input',renderBoard);
$('go-board').onclick=goBoard;
$('page-prev').onclick=()=>{if(mode==='explore'&&page>0){page--;renderGrid()}};
$('page-next').onclick=()=>{
 if(mode==='explore'&&group&&page<Math.ceil(group.items.length/PAGE_SIZE)-1){page++;renderGrid()}
};
document.querySelectorAll('[data-mode]').forEach(btn=>btn.onclick=()=>setMode(btn.dataset.mode));
$('listen-button').onclick=()=>{if(mode==='explore'){if(selected)say(selected.en)}
 else if(task)say(mode==='dictation'||mode==='find'?task.en:phrase)};
$('hint-button').onclick=showHint;
$('mark-known').onclick=()=>mark('known');
$('mark-learning').onclick=()=>mark('learning');
$('next-exercise').onclick=()=>{if(mode!=='explore')newQuestion()};
$('dictation-form').onsubmit=checkDictation;
renderFilters();renderBoard();updateStats();
window.houseLab={get group(){return group?.id||null},get mode(){return mode},
  get task(){return task?.en||null},get solved(){return solved},get score(){return points},
  get groups(){return GROUPS.length},get words(){return totalObjects},
  getRecord:word=>group?getRecord(group,group.items.find(i=>i.en===word)||{}):null};
