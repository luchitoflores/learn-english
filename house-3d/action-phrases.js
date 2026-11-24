// English practice grounded in real, existing KayKit animation clip names.
// Time cues make grammatical tense meaningful; visual movement alone cannot show past vs present.
export const ACTION_SENTENCES=[
 {pack:'Simulation',clip:'Lie_Down',key:'lie-down',present:'He is lying down.',past:'He lay down.',spanishPresent:'Él se está acostando.',spanishPast:'Él se acostó.',hint:'lie down → lay down → lain down'},
 {pack:'Simulation',clip:'Lie_StandUp',key:'get-up',start:'Lie_Idle',present:'He is getting up.',past:'He got up.',spanishPresent:'Él se está levantando.',spanishPast:'Él se levantó.',hint:'get up → got up → got up'},
 {pack:'Simulation',clip:'Sit_Floor_Down',key:'sit-down',present:'He is sitting down.',past:'He sat down.',spanishPresent:'Él se está sentando.',spanishPast:'Él se sentó.',hint:'sit down → sat down → sat down'},
 {pack:'Simulation',clip:'Sit_Floor_StandUp',key:'stand-up',start:'Sit_Floor_Idle',present:'He is standing up.',past:'He stood up.',spanishPresent:'Él se está poniendo de pie.',spanishPast:'Él se puso de pie.',hint:'stand up → stood up → stood up'},
 {pack:'MovementBasic',clip:'Jump_Full_Short',key:'jump',present:'He is jumping.',past:'He jumped.',spanishPresent:'Él está saltando.',spanishPast:'Él saltó.',hint:'jump → jumped → jumped'},
 {pack:'MovementAdvanced',clip:'Crouching',key:'crouch-down',present:'He is crouching down.',past:'He crouched down.',spanishPresent:'Él se está agachando.',spanishPast:'Él se agachó.',hint:'crouch down → crouched down → crouched down'},
 {pack:'MovementAdvanced',clip:'Walking_Backwards',key:'back-up',distance:-1.35,present:'He is backing up.',past:'He backed up.',spanishPresent:'Él está retrocediendo.',spanishPast:'Él retrocedió.',hint:'back up → backed up → backed up'},
 {pack:'General',clip:'PickUp',key:'pick-up',present:'He is picking something up.',past:'He picked something up.',spanishPresent:'Él está recogiendo algo.',spanishPast:'Él recogió algo.',hint:'pick up → picked up → picked up'},
 {pack:'General',clip:'Throw',key:'throw-away',present:'He is throwing something.',past:'He threw something.',spanishPresent:'Él está lanzando algo.',spanishPast:'Él lanzó algo.',hint:'throw → threw → thrown; throw away requires disposing of an object'},
 {pack:'Simulation',clip:'Waving',key:'wave',present:'He is waving.',past:'He waved.',spanishPresent:'Él está saludando con la mano.',spanishPast:'Él saludó con la mano.',hint:'wave → waved → waved'},
 {pack:'Simulation',clip:'Cheering',key:'cheer-up',present:'He is cheering.',past:'He cheered.',spanishPresent:'Él está celebrando.',spanishPast:'Él celebró.',hint:'cheer up = animarse o animar a alguien; no es lo mismo que cheer'},
 {pack:'Tools',clip:'Hammering',key:'hammer',present:'He is hammering.',past:'He hammered.',spanishPresent:'Él está martillando.',spanishPast:'Él martilló.',hint:'hammer → hammered → hammered'},
 {pack:'Tools',clip:'Sawing',key:'saw',present:'He is sawing.',past:'He sawed.',spanishPresent:'Él está serruchando.',spanishPast:'Él serruchó.',hint:'saw (cortar con serrucho) → sawed → sawn/sawed'},
 {pack:'Tools',clip:'Fishing_Catch',key:'catch-fish',present:'He is catching a fish.',past:'He caught a fish.',spanishPresent:'Él está pescando un pez.',spanishPast:'Él pescó un pez.',hint:'catch → caught → caught'}
];

export const PHRASAL_FAMILIES=[
 {base:'GET',words:[
  ['get up','levantarse','Personaje: levantarse de estar acostado'],
  ['get back','regresar / recuperar algo','Escena: regresar a un lugar u obtener algo de vuelta'],
  ['get in','entrar (a un vehículo o espacio)','Escena: puerta o vehículo'],
  ['get out','salir','Escena: puerta o vehículo'],
  ['get off','bajarse de un transporte / quitarse algo de encima','Escena: vehículo o superficie'],
  ['get along with','llevarse bien con','Necesita interacción entre personajes'],
  ['get over','superar (un problema/enfermedad)','Necesita contexto narrativo'],
  ['get rid of','deshacerse de','Necesita desechar un objeto']
 ]},
 {base:'PUT',words:[
  ['put it back','devolverlo a su lugar','Objeto con posición original registrada'],
  ['put it away','guardarlo en su lugar','Objeto y contenedor donde guardarlo'],
  ['put it in','ponerlo dentro','Objeto y recipiente'],
  ['put it on','ponerlo encima / ponerse una prenda','Objeto y superficie o prenda'],
  ['put it down','dejarlo en una superficie','Objeto sostenido y superficie'],
  ['put it off','posponerlo','Necesita evento y contexto temporal'],
  ['put up with','tolerar o soportar','Necesita situación, no solo un gesto']
 ]},
 {base:'LOOK',words:[
  ['Look!','¡Mira!','Dirigir la atención'],
  ['Take a look.','Échale un vistazo.','Observar un objeto'],
  ['Watch out!','¡Cuidado!','Advertencia ante peligro'],
  ['Pay attention.','Presta atención.','Escuchar y observar'],
  ['Look out!','¡Cuidado!','Advertir de un peligro'],
  ['Look for','buscar','Buscar un objeto que falta'],
  ['Look after','cuidar','Persona, mascota u objeto que necesita atención']
 ]}
];
export function actionExercise(entry,tense){
 const past=tense==='past';
 return {
  phrase:past?entry.past:entry.present,
  spanish:past?entry.spanishPast:entry.spanishPresent,
  time:past?'YESTERDAY · AYER':'RIGHT NOW · AHORA',
  tense:past?'Past simple':'Present continuous',
  motion:{pack:entry.pack,clip:entry.clip,start:entry.start,distance:entry.distance}
 };
}
