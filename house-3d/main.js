import { speak } from '../src/core/audio.js';
import { rooms, stations, makePhrase, openingPhrase, practiceMotions } from './data.js';
import { animationClips } from './animation-clips.js';
import { ACTION_SENTENCES, PHRASAL_FAMILIES, actionExercise } from './action-phrases.js';
import { HouseScene } from './scene.js';
import './style.css';
import { initListening } from './listening.js';

const $ = id => document.getElementById(id);

function button(text, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = text;
  element.addEventListener('click', onClick);
  return element;
}

const placedOutside = new Map(Object.keys(stations).map(id => [id, new Set()]));
let scene;
let roomId = 'kitchen';
let stationId;
let busy = false;
let mode = 'explore';
let phrase;
let task;
let previousTask;
let solved = false;
let experience = 'house';
let phraseQuestion = null, phraseResolved = false, phraseScore = 0, phraseCount = 0;
let selectedAnimation;
let characterReady;
const listening = initListening({getScene:()=>scene, ready:()=>characterReady, setBusy, speak});

function setPhrase(next, hidden = false) {
  phrase = next;
  $('english').textContent = hidden ? 'Listen and choose.' : next.en;
  $('spanish').textContent = hidden ? 'Escucha la orden y elige el objeto indicado.' : next.es;
}

function renderItems(focusId) {
  const config = stations[stationId];
  const outside = placedOutside.get(stationId);
  $('items').replaceChildren(...config.items.map(entry => {
    const item = button('', () => choose(entry));
    item.dataset.item = entry.id;
    const art = document.createElement(scene ? 'img' : 'span');
    art.className = 'item-art';
    if (art instanceof HTMLImageElement) {
      art.alt = '';
      scene.thumbnail(entry.model).then(url => { art.src = url; }).catch(console.warn);
    } else {
      art.classList.add('model-item');
      art.textContent = '3D';
      art.setAttribute('aria-hidden', 'true');
    }
    const label = document.createElement('strong');
    label.textContent = entry.en;
    label.lang = 'en';
    const translation = document.createElement('span');
    translation.className = 'item-translation';
    translation.textContent = entry.es;
    const state = document.createElement('small');
    state.textContent = outside.has(entry.id) ? 'Fuera' : 'Dentro';
    item.append(art, label, translation, state);
    return item;
  }));
  if (focusId) $('items').querySelector(`[data-item="${focusId}"]`)?.focus({ preventScroll: true });
}

function renderNavigation() {
  $('rooms').replaceChildren(...Object.entries(rooms).map(([id, room]) => {
    const control = button(room.es, () => changeRoom(id));
    control.setAttribute('aria-pressed', String(id === roomId));
    control.dataset.room = id;
    return control;
  }));
  $('stations').replaceChildren(...rooms[roomId].stations.map(id => {
    const control = button(`Abrir ${stations[id].es.toLowerCase()}`, () => open(id));
    control.setAttribute('aria-pressed', String(id === stationId));
    control.dataset.station = id;
    return control;
  }));
}

function renderStation() {
  const config = stations[stationId];
  document.querySelector('.layout').classList.toggle('in-station', Boolean(config));
  $('room-label').textContent = rooms[roomId].en;
  $('inventory-title').textContent = config?.es || 'Elige un mueble';
  $('inventory-subtitle').textContent = config?.en || 'Selecciona un mueble para ver su contenido.';
  $('feedback').textContent = '';
  $('activities').hidden = $('close').hidden = !config;
  $('next').hidden = true;
  renderNavigation();
  if (!config) {
    $('items').replaceChildren();
    return;
  }
  renderItems();
  if (mode === 'listen') startTask();
  else setPhrase(openingPhrase(stationId));
}

async function animate(action) {
  if (!scene) return;
  try {
    await action(scene);
  } catch (error) {
    console.error(error);
    $('scene-message').textContent = 'La animación no pudo completarse. Puedes seguir practicando con el inventario.';
    $('scene-message').hidden = false;
  }
}

function setBusy(value) {
  busy = value;
  for (const control of document.querySelectorAll('main button')) control.disabled = value;
  $('viewport').classList.toggle('busy', value);
  $('animation-replay').disabled = value || !selectedAnimation;
}

function changeRoom(id) {
  if (busy || id === roomId) return;
  roomId = id;
  stationId = undefined;
  scene?.setRoom(id);
  renderStation();
  $('rooms').querySelector(`[data-room="${id}"]`).focus({ preventScroll: true });
}

async function open(id) {
  if (busy || id === stationId) return;
  setBusy(true);
  if (stationId) await animate(view => view.setOpen(stationId, false));
  stationId = id;
  if (mode === 'explore') speak(openingPhrase(id).en);
  await animate(view => view.setOpen(id, true, placedOutside.get(id)));
  renderStation();
  setBusy(false);
  $('stations').querySelector(`[data-station="${id}"]`).focus({ preventScroll: true });
}

async function close() {
  if (busy || !stationId) return;
  const previous = stationId;
  setBusy(true);
  await animate(view => view.setOpen(previous, false));
  stationId = undefined;
  renderStation();
  setBusy(false);
  $('stations').querySelector(`[data-station="${previous}"]`).focus({ preventScroll: true });
}

function startTask() {
  const choices = stations[stationId].items.filter(entry => entry.id !== previousTask);
  task = choices[Math.floor(Math.random() * choices.length)];
  previousTask = task.id;
  solved = false;
  $('next').hidden = true;
  $('feedback').textContent = '';
  setPhrase(makePhrase(stationId, task, placedOutside.get(stationId).has(task.id)), true);
  speak(phrase.en);
}

async function choose(entry) {
  if (busy || (mode === 'listen' && solved)) return;
  if (mode === 'listen' && entry !== task) {
    $('feedback').textContent = 'Inténtalo otra vez. Puedes volver a escuchar la orden.';
    speak(phrase.en);
    return;
  }
  const outside = placedOutside.get(stationId);
  const isOut = outside.has(entry.id);
  const next = makePhrase(stationId, entry, isOut);
  setPhrase(next);
  speak(next.en);
  if (isOut) outside.delete(entry.id);
  else outside.add(entry.id);
  setBusy(true);
  await animate(view => view.moveItem(entry.id, !isOut, next.clip));
  setBusy(false);
  renderItems(entry.id);
  solved = mode === 'listen';
  $('feedback').textContent = solved ? 'Correcto. Mira cómo el personaje completa la orden.' : '';
  $('next').hidden = !solved;
  if (solved) $('next').focus({ preventScroll: true });
}

function setMode(next) {
  mode = next;
  $('explore').setAttribute('aria-pressed', String(mode === 'explore'));
  $('listen').setAttribute('aria-pressed', String(mode === 'listen'));
  renderStation();
}

const categories = {
  General: 'Acciones generales',
  MovementBasic: 'Movimiento básico',
  MovementAdvanced: 'Movimiento avanzado',
  Simulation: 'Acciones cotidianas',
  Tools: 'Herramientas',
  CombatMelee: 'Combate de videojuego',
  CombatRanged: 'Puntería de videojuego',
  Special: 'Animaciones especiales',
};
const aliases = new Map(practiceMotions.map(motion => [motion.clip, motion]));
aliases.set('PickUp', { en: 'Pick up.', es: 'Recoge algo.' });
aliases.set('Walking_A', { en: 'Walk.', es: 'Camina.', distance: 1.25 });
aliases.set('Running_A', { en: 'Run.', es: 'Corre.', distance: 1.65 });
aliases.set('Use_Item', { en: 'Use an item.', es: 'Usa un objeto.' });
aliases.set('Waving', { en: 'Wave hello.', es: 'Saluda con la mano.' });
const labelFor = clip => clip.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
const animations = Object.entries(categories).flatMap(([pack, category]) =>
  animationClips[pack].map(clip => ({
    pack, category, clip, en: labelFor(clip), ...aliases.get(clip),
  })));

function renderAnimations() {
  const filter = $('animation-category').value;
  const words = $('animation-search').value.trim().toLowerCase().split(/\s+/);
  const matches = animations.filter(({ pack, clip, en, es, category }) =>
    (!filter || pack === filter) &&
    words.every(word => `${en} ${es || ''} ${labelFor(clip)} ${category}`.toLowerCase().includes(word)));
  $('animation-count').textContent = `${matches.length} de ${animations.length} animaciones`;
  $('animation-actions').replaceChildren(...matches.map(motion => {
    const control = button('', () => playAnimation(motion));
    const name = document.createElement('strong');
    name.lang = 'en';
    name.textContent = motion.en;
    const detail = document.createElement('small');
    detail.textContent = motion.es || motion.category;
    control.append(name, detail);
    control.title = motion.clip;
    control.disabled = busy;
    control.setAttribute('aria-pressed', String(motion === selectedAnimation));
    return control;
  }));
  if (!matches.length) $('animation-actions').textContent = 'No hay acciones con esa búsqueda.';
}

async function playAnimation(motion) {
  if (busy || !motion) return;
  selectedAnimation = motion;
  $('animation-title').textContent = motion.en;
  $('animation-result').textContent = motion.es || motion.category;
  setBusy(true);
  renderAnimations();
  speak(motion.en);
  try {
    if (!scene) throw new Error('WebGL no está disponible.');
    await characterReady;
    await scene.previewMotion(motion);
  } catch (error) {
    console.error(error);
    $('animation-result').textContent = 'No se pudo reproducir la animación. Vuelve a intentarlo.';
  } finally {
    setBusy(false);
    $('animation-actions').querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
  }
}

function renderFamilies(){
  const root=$('phrase-family-content');
  root.replaceChildren(...PHRASAL_FAMILIES.map(family=>{
    const section=document.createElement('section');
    const heading=document.createElement('h3');heading.textContent=family.base;
    const list=document.createElement('dl');
    for(const [english,spanish,context] of family.words){
      const dt=document.createElement('dt');dt.textContent=english;
      const dd=document.createElement('dd');dd.textContent=spanish+' · '+context;
      list.append(dt,dd);
    }
    section.append(heading,list);
    return section;
  }));
}
const mix=items=>[...items].sort(()=>Math.random()-.5);
async function playPhraseMotion(){
  if(!phraseQuestion||!scene)return;
  try{
    setBusy(true);
    await characterReady;
    await scene.previewMotion(phraseQuestion.exercise.motion);
  }catch(error){
    console.error(error);
    $('phrase-feedback').textContent='El movimiento no pudo reproducirse. Puedes seguir con la frase.';
  }finally{setBusy(false);}
}
function renderPhraseQuestion(){
  if(!phraseQuestion)return;
  const {exercise,options}=phraseQuestion;
  $('phrase-time').textContent=exercise.time;
  $('phrase-spanish').textContent=exercise.spanish;
  $('phrase-grammar').textContent=exercise.tense;
  $('phrase-score').textContent=phraseScore+' correctas · '+phraseCount+' preguntas';
  $('phrase-feedback').textContent='Mira el movimiento y elige la oración correcta.';
  $('phrase-grammar-note').hidden=true;
  $('phrase-next').disabled=false;
  $('phrase-choices').replaceChildren(...options.map(option=>{
    const btn=button(option.phrase,()=>answerPhrase(option,btn));
    btn.dataset.answer=option.entry.key;
    btn.dataset.correct=String(option===phraseQuestion.correct);
    return btn;
  }));
}
function nextPhrase(){
  const previous=phraseQuestion?.entry.key;
  const candidates=ACTION_SENTENCES.filter(entry=>entry.key!==previous);
  const entry=candidates[Math.floor(Math.random()*candidates.length)]||ACTION_SENTENCES[0];
  const tense=Math.random()<.5?'present':'past';
  const correct={entry,phrase:actionExercise(entry,tense).phrase};
  const others=mix(ACTION_SENTENCES.filter(e=>e!==entry)).slice(0,3)
    .map(e=>({entry:e,phrase:actionExercise(e,tense).phrase}));
  phraseQuestion={entry,exercise:actionExercise(entry,tense),correct,options:mix([correct,...others])};
  phraseResolved=false;phraseCount++;
  renderPhraseQuestion();
  playPhraseMotion();
}
function answerPhrase(option,control){
  if(phraseResolved||!phraseQuestion||busy)return;
  const correct=option===phraseQuestion.correct;
  if(!correct){
    control.classList.add('incorrect');
    $('phrase-feedback').textContent='Esa frase representa otra acción. Mira el movimiento y prueba de nuevo.';
    return;
  }
  phraseResolved=true;phraseScore++;
  $('phrase-score').textContent=phraseScore+' correctas · '+phraseCount+' preguntas';
  const {entry,exercise}=phraseQuestion;
  $('phrase-feedback').textContent='✓ '+exercise.phrase+' — '+exercise.spanish;
  $('phrase-grammar-note').hidden=false;
  $('phrase-grammar-note').textContent=entry.hint+' · '+exercise.tense;
  for(const btn of $('phrase-choices').querySelectorAll('button')){
    btn.disabled=true;
    if(btn.dataset.correct==='true')btn.classList.add('correct');
  }
  speak(exercise.phrase);
  try{localStorage.setItem('wq-action-phrases-score',JSON.stringify({score:phraseScore,questions:phraseCount}))}catch{}
}
function setExperience(next) {
  if(busy || experience===next)return;
  experience=next;
  stationId=undefined;
  const isAnimation=next==='animations',isPhrases=next==='phrases',isListening=next==='listening';
  if(!isListening) listening.leave();
  const layout=document.querySelector('.layout');
  layout.classList.toggle('animation-mode',isAnimation||isPhrases||isListening);
  layout.classList.toggle('listening-mode',isListening);
  $('listening-view').setAttribute('aria-pressed',String(isListening));
  $('listening-lab').hidden=!isListening;
  layout.classList.toggle('phrase-mode',isPhrases);
  $('animation-view').setAttribute('aria-pressed',String(isAnimation));
  $('phrase-view').setAttribute('aria-pressed',String(isPhrases));
  $('house-view').setAttribute('aria-pressed',String(next==='house'));
  $('animation-catalog').hidden=!isAnimation;
  $('phrase-lab').hidden=!isPhrases;
  $('view-title').textContent=isListening?'Listening Lab':isAnimation?'Animaciones del Ranger':isPhrases?'Frases en movimiento':'La casa en 3D';
  $('view-description').textContent=isListening?'Escucha inglés y comprende lo que sucede en el mundo 3D.':isAnimation
    ?'Busca un verbo o elige una acción para que el Ranger la haga.'
    :isPhrases?'Aprende inglés con las animaciones reales del Ranger, en presente y pasado.'
    :'Abre un mueble, observa lo que hay dentro y practica verbos frasales.';
  history.replaceState(null,'',next==='house'?location.pathname+location.search:
    next==='animations'?'#animaciones':isListening?'#escuchar':'#frases');
  renderStation();
  if(isAnimation||isPhrases||isListening){
    scene?.setStudio();
    if(isAnimation)renderAnimations();
    else if(isListening)listening.enter();
    else nextPhrase();
  }else scene?.setRoom(roomId);
}
renderFamilies();
$('phrase-next').addEventListener('click',nextPhrase);
$('phrase-audio').addEventListener('click',()=>phraseQuestion&&speak(phraseQuestion.exercise.phrase));
$('phrase-watch').addEventListener('click',playPhraseMotion);

$('animation-category').add(new Option('Todas las categorías', ''));
for (const [id, label] of Object.entries(categories)) {
  $('animation-category').add(new Option(label, id));
}
$('animation-search').addEventListener('input', renderAnimations);
$('animation-category').addEventListener('change', renderAnimations);
$('animation-replay').addEventListener('click', () => playAnimation(selectedAnimation));
$('animation-view').addEventListener('click', () => setExperience('animations'));
$('house-view').addEventListener('click', () => setExperience('house'));
$('phrase-view').addEventListener('click', () => setExperience('phrases'));
$('listening-view').addEventListener('click', () => setExperience('listening'));

$('close').addEventListener('click', close);
$('explore').addEventListener('click', () => setMode('explore'));
$('listen').addEventListener('click', () => setMode('listen'));
$('replay').addEventListener('click', () => speak(phrase.en));
$('next').addEventListener('click', () => {
  startTask();
  $('replay').focus({ preventScroll: true });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') close();
});

renderStation();
try {
  scene = new HouseScene($('viewport'), open);
  scene.setRoom(roomId);
  characterReady = scene.loadCharacter();
  characterReady.then(() => {
    $('scene-message').hidden = true;
  }).catch(error => {
    console.error(error);
    $('scene-message').textContent = 'El personaje 3D no pudo cargar. Los muebles y la práctica siguen disponibles.';
  });
} catch (error) {
  console.error(error);
  $('scene-message').textContent = 'WebGL no está disponible. Puedes practicar con el inventario de cada mueble.';
}
if (location.hash === '#animaciones') setExperience('animations');
else if(location.hash === '#frases') setExperience('phrases');
else if(location.hash === '#escuchar') setExperience('listening');
