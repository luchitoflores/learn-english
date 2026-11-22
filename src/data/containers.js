// One reusable, data-driven inventory system for every Word Quest room.
// Illustrated inventory art is original, generated for this project and stored locally.
const I=(id,en,es,image,plural=false)=>({id,en,es,image,plural});
const inv=name=>'inventory/'+name+'.webp';
const prop=name=>'objects/'+name+'.webp';
export const CONTAINERS={
 fridge:{
  id:'fridge',room:'kitchen',name:'Refrigeradora',en:'Fridge',es:'refrigeradora',kind:'food',
  items:[
   I('eggs','eggs','huevos',inv('eggs'),true),I('milk','milk','leche',inv('milk')),
   I('cheese','cheese','queso',inv('cheese')),I('apple','apple','manzana',prop('apple')),
   I('juice','juice','jugo',inv('juice')),I('yogurt','yogurt','yogur',inv('yogurt')),
   I('butter','butter','mantequilla',inv('butter')),I('lettuce','lettuce','lechuga',inv('lettuce'))],
  verbs:{out:['Take out the {item}.','Saca {es}.'],back:['Put the {item} back.','Vuelve a guardar {es}.']}
 },
 toolbox:{
  id:'toolbox',room:'living',name:'Caja de herramientas',en:'Toolbox',es:'caja de herramientas',kind:'tools',
  items:[
   I('hammer','hammer','martillo',inv('hammer')),I('screwdriver','screwdriver','destornillador',inv('screwdriver')),
   I('wrench','wrench','llave inglesa',inv('wrench')),I('pliers','pliers','alicates',inv('pliers')),
   I('tape-measure','tape measure','cinta métrica',inv('tape-measure')),
   I('nails','nails','clavos',inv('nails'),true),I('screws','screws','tornillos',inv('screws'),true),
   I('drill','drill','taladro',inv('drill'))],
  verbs:{out:['Pick up the {item}.','Recoge {es}.'],back:['Put away the {item}.','Guarda {es}.']}
 },
 wardrobe:{
  id:'wardrobe',room:'bedroom',name:'Ropero',en:'Wardrobe',es:'ropero',kind:'clothes',
  items:[
   I('shirt','shirt','camisa',inv('shirt')),I('jacket','jacket','chaqueta',prop('jacket')),
   I('tshirt','T-shirt','camiseta',inv('tshirt')),I('pants','pants','pantalones',inv('pants'),true),
   I('shoes','shoes','zapatos',prop('shoes'),true),I('tie','tie','corbata',inv('tie')),
   I('suit','suit','traje',inv('coat'))],
  verbs:{out:['Put on the {item}.','Ponte {es}.'],back:['Take off the {item}.','Quítate {es}.']}
 },
 backpack:{
  id:'backpack',room:'bedroom',name:'Mochila',en:'Backpack',es:'mochila',kind:'daily',
  items:[
   I('book','book','libro',prop('book')),I('phone','phone','teléfono',prop('phone')),
   I('keys','keys','llaves',prop('keys'),true),I('towel','towel','toalla',prop('towel')),
   I('apple','apple','manzana',prop('apple')),I('spoon','spoon','cuchara',prop('spoon'))],
  verbs:{out:['Take out the {item}.','Saca {es}.'],back:['Put the {item} back.','Vuelve a guardar {es}.']}
 },
 medkit:{
  id:'medkit',room:'kitchen',name:'Botiquín',en:'Medicine cabinet',es:'botiquín',kind:'care',
  items:[
   I('bandage','bandage','venda',inv('bandage')),I('thermometer','thermometer','termómetro',inv('thermometer')),
   I('cotton','cotton','algodón',inv('cotton')),I('antiseptic','antiseptic','antiséptico',inv('antiseptic')),
   I('scissors','scissors','tijeras',inv('scissors'),true),I('ointment','ointment','pomada',inv('ointment')),
   I('medicine','medicine bottle','frasco de medicina',inv('medicine'))],
  verbs:{out:['Find the {item}.','Encuentra {es}.'],back:['Put away the {item}.','Guarda {es}.']}
 },
 drawer:{
  id:'drawer',room:'kitchen',name:'Cajón',en:'Drawer',es:'cajón',kind:'daily',
  items:[
   I('spoon','spoon','cuchara',prop('spoon')),I('keys','keys','llaves',prop('keys'),true),
   I('remote','remote control','control remoto',prop('remote')),I('towel','towel','toalla',prop('towel')),
   I('book','book','libro',prop('book')),I('scissors','scissors','tijeras',inv('scissors'),true)],
  verbs:{out:['Take out the {item}.','Saca {es}.'],back:['Put the {item} back.','Vuelve a guardar {es}.']}
 }
};
export const containerForObject=id=>CONTAINERS[id]??null;
export const roomContainers=roomId=>Object.values(CONTAINERS).filter(c=>c.room===roomId);
export const INVENTORY_STORAGE='word-quest-containers-v1';
export function loadContainerStates(){
 try{
  const saved=JSON.parse(localStorage.getItem(INVENTORY_STORAGE)||'{}');
  if(!saved||typeof saved!=='object')return {};
  return Object.fromEntries(Object.entries(saved).filter(([key,v])=>
    CONTAINERS[key]&&v&&typeof v==='object'&&!Array.isArray(v)));
 }catch{return {}}
}
export function saveContainerStates(states){
 try{localStorage.setItem(INVENTORY_STORAGE,JSON.stringify(states))}catch{}
}
export function makeContainerTask(container,item,out=true){
 const [en,es]=container.verbs[out?'out':'back'];
 return {containerId:container.id,itemId:item.id,out,
   action:out?'container_take':'container_return',
   english:en.replace('{item}',item.en),spanish:es.replace('{es}',item.es)};
}
