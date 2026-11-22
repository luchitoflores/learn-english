// Data-first definitions. Add objects and expressions here, not in the game engine.
// Phrasal-verb senses are contextual phrases, not blindly generated word combinations.
const O = (id, kind, name, es, x, y, size, acts, state = {}, passive = false) => ({
  id, kind, name, es, x, y, size, passive,
  state: { held:false, stored:false, worn:false, on:false, open:false, hung:false,
           sitting:false, lying:false, awake:false, clean:false, tidy:false,
           eaten:false, empty:false, discarded:false, made:false, wet:false,
           cut:false, set:false, ...state },
  phrases: acts.map(([action, english, spanish, level='A2']) => ({action, english, spanish, level,
    type: /\b(up|down|off|on|away|out|back|through|in)\b/i.test(english) ? 'phrasal' : 'verb'}))
});
export const ROOMS = {
  bedroom: {
    id:'bedroom', name:'Dormitorio', en:'Bedroom', subtitle:'Despierta, vístete y explora.',
    background:'bedroom', exits:[{to:'living',x:1225,y:450,label:'Sala'}],
    objects:[
      O('mirror','picture','mirror','espejo',954,455,125,[
        ['brush_teeth','Brush your teeth.','Cepíllate los dientes.','A1'],
        ['shave_face','Shave your beard.','Rasúrate la barba.','A2'],
        ['smile_face','Smile at the mirror.','Sonríe frente al espejo.','A1'],
        ['cry_face','Cry.','Llora.','A1'],
        ['blink_eyes','Blink your eyes.','Parpadea.','A2'],
        ['shout_face','Shout!','¡Grita!','A1']
      ],{},true),
      O('wardrobe','jacket','wardrobe','ropero',1175,530,145,[
        ['put_on_shirt','Put on your shirt.','Ponte la camisa.','A1'],
        ['put_on_suit','Put on your suit.','Ponte el traje.','A2'],
        ['take_off_shirt','Take off your shirt.','Quítate la camisa.','A1'],
        ['put_on_pajamas','Put on your pajamas.','Ponte el pijama.','A1']
      ],{},true),
      O('bed','pillow','bed','cama',255,496,130,[
        ['wake_up','Wake up!','¡Despierta!','A1'],['get_up','Get up from bed.','Levántate de la cama.','A1'],
        ['lie_down','Lie down on the bed.','Acuéstate en la cama.','A1'],
        ['sit_down','Sit down on the bed.','Siéntate en la cama.','A1'],
        ['stand_up','Stand up from the bed.','Levántate de la cama.','A1'],
        ['make_bed','Make the bed.','Tiende la cama.','A1']],{awake:false,lying:true},true),
      O('lamp','lamp','lamp','lámpara',851,420,94,[
        ['turn_on','Turn on the lamp.','Enciende la lámpara.','A1'],
        ['turn_off','Turn off the lamp.','Apaga la lámpara.','A1'],
        ['look_at','Look at the lamp.','Mira la lámpara.','A1']]),
      O('book','book','book','libro',935,422,77,[
        ['pick_up','Pick up the book.','Recoge el libro.','A1'],
        ['put_down','Put down the book.','Deja el libro.','A1'],
        ['open_up','Open up the book.','Abre el libro.','A2'],
        ['close','Close the book.','Cierra el libro.','A1'],
        ['look_through','Look through the book.','Hojea el libro.','B1']]),
      O('backpack','backpack','backpack','mochila',705,601,116,[
        ['pick_up','Pick up the backpack.','Recoge la mochila.','A1'],
        ['put_down','Put down the backpack.','Deja la mochila.','A1'],
        ['put_away','Put away the backpack.','Guarda la mochila.','A2'],
        ['take_out','Take out the backpack.','Saca la mochila.','A2']]),
      O('jacket','jacket','jacket','chaqueta',1135,471,108,[
        ['take_down','Take down the jacket.','Baja la chaqueta de su gancho.','A2'],
        ['put_on','Put on your jacket.','Ponte la chaqueta.','A1'],
        ['take_off','Take off your jacket.','Quítate la chaqueta.','A1'],
        ['hang_up','Hang up your jacket.','Cuelga la chaqueta.','A2']],{hung:true}),
      O('shoes','shoes','shoes','zapatos',395,601,91,[
        ['put_on','Put on your shoes.','Ponte los zapatos.','A1'],
        ['take_off','Take off your shoes.','Quítate los zapatos.','A1'],
        ['pick_up','Pick up the shoes.','Recoge los zapatos.','A1'],
        ['put_down','Put down the shoes.','Deja los zapatos.','A1']]),
      O('phone','phone','phone','teléfono',1012,424,78,[
        ['pick_up','Pick up the phone.','Recoge el teléfono.','A1'],
        ['put_down','Put down the phone.','Deja el teléfono.','A1'],
        ['turn_on','Turn on the phone.','Enciende el teléfono.','A1'],
        ['turn_off','Turn off the phone.','Apaga el teléfono.','A1']]),
      O('pillow','pillow','pillow','almohada',162,457,90,[
        ['pick_up','Pick up the pillow.','Recoge la almohada.','A1'],
        ['put_down','Put down the pillow.','Deja la almohada.','A1'],
        ['put_back','Put the pillow back.','Vuelve a colocar la almohada.','A2']]),
      O('window','picture','window','ventana',594,316,135,[
        ['open_up','Open up the window.','Abre la ventana.','A2'],
        ['close','Close the window.','Cierra la ventana.','A1'],
        ['look_out','Look out of the window.','Mira por la ventana.','A2']],{},true),
      O('wardrobe','jacket','wardrobe','armario',1177,558,100,[
        ['open_up','Open up the wardrobe.','Abre el armario.','A2'],
        ['close','Close the wardrobe.','Cierra el armario.','A1'],
        ['look_for','Look for your clothes.','Busca tu ropa.','A2']],{},true)
    ]
  },
  kitchen: {
    id:'kitchen',name:'Cocina',en:'Kitchen', subtitle:'Prepara, recoge y organiza.',
    background:'kitchen',exits:[{to:'living',x:24,y:463,label:'Sala'}],
    objects:[
      O('kettle','kettle','kettle','hervidor',106,384,94,[
        ['turn_on','Turn on the kettle.','Enciende el hervidor.','A2'],
        ['turn_off','Turn off the kettle.','Apaga el hervidor.','A2'],
        ['look_at','Look at the kettle.','Mira el hervidor.','A1']]),
      O('cup','cup','cup','taza',300,389,84,[
        ['pick_up','Pick up the cup.','Recoge la taza.','A1'],
        ['put_down','Put down the cup.','Deja la taza.','A1'],
        ['drink_up','Drink up your tea.','Termina de beber tu té.','B1'],
        ['pour_in','Pour in some tea.','Vierte un poco de té.','A2']],{empty:false}),
      O('apple','apple','apple','manzana',387,385,70,[
        ['pick_up','Pick up the apple.','Recoge la manzana.','A1'],
        ['put_down','Put down the apple.','Deja la manzana.','A1'],
        ['eat_up','Eat up the apple.','Termina de comerte la manzana.','A2'],
        ['cut_up','Cut up the apple.','Corta la manzana en trozos.','A2']]),
      O('plate','plate','plate','plato',863,379,86,[
        ['pick_up','Pick up the plate.','Recoge el plato.','A1'],
        ['put_down','Put down the plate.','Deja el plato.','A1'],
        ['wash_up','Wash up the plate.','Lava el plato.','A2'],
        ['put_away','Put away the plate.','Guarda el plato.','A2']]),
      O('spoon','spoon','spoon','cuchara',973,389,73,[
        ['pick_up','Pick up the spoon.','Recoge la cuchara.','A1'],
        ['put_down','Put down the spoon.','Deja la cuchara.','A1'],
        ['put_away','Put away the spoon.','Guarda la cuchara.','A2']]),
      O('trash','trash','trash','basurero',730,600,109,[
        ['throw_away','Throw away the trash.','Bota la basura.','A2'],
        ['bring_back','Bring back the bin.','Trae de vuelta el basurero.','A2'],
        ['clean_up','Clean up the bin.','Limpia el basurero.','A2']]),
      O('fridge','kettle','fridge','refrigeradora',1177,520,134,[
        ['open_up','Open up the fridge.','Abre la refrigeradora.','A2'],
        ['close','Close the fridge.','Cierra la refrigeradora.','A1'],
        ['look_for','Look for some food.','Busca algo de comer.','A2']],{},true),
      O('sink','cup','sink','fregadero',274,542,108,[
        ['wash_up','Wash up the dishes.','Lava los platos.','A2'],
        ['clean_up','Clean up the sink.','Limpia el fregadero.','A2']],{},true),
      O('drawer','spoon','drawer','cajón',1024,525,106,[
        ['open_up','Open up the drawer.','Abre el cajón.','A2'],
        ['close','Close the drawer.','Cierra el cajón.','A1'],
        ['look_for','Look for a spoon.','Busca una cuchara.','A2']],{},true)
    ]
  },
  living: {
    id:'living',name:'Sala',en:'Living room',subtitle:'Relájate, observa y juega.',
    background:'living',exits:[{to:'bedroom',x:22,y:458,label:'Dormitorio'},{to:'kitchen',x:1240,y:458,label:'Cocina'}],
    objects:[
      O('tv','remote','TV','televisión',1128,333,97,[
        ['turn_on','Turn on the TV.','Enciende la televisión.','A1'],
        ['turn_off','Turn off the TV.','Apaga la televisión.','A1'],
        ['look_at','Look at the TV.','Mira la televisión.','A1']],{},true),
      O('remote','remote','remote control','control remoto',1107,470,77,[
        ['pick_up','Pick up the remote.','Recoge el control remoto.','A1'],
        ['put_down','Put down the remote.','Deja el control remoto.','A1'],
        ['look_for','Look for the remote.','Busca el control remoto.','A2']]),
      O('lamp','lamp','floor lamp','lámpara de pie',425,591,118,[
        ['switch_on','Switch on the lamp.','Enciende la lámpara.','A2'],
        ['switch_off','Switch off the lamp.','Apaga la lámpara.','A2'],
        ['look_at','Look at the lamp.','Mira la lámpara.','A1']]),
      O('plant','plant','plant','planta',967,583,115,[
        ['look_at','Look at the plant.','Mira la planta.','A1'],
        ['pick_up','Pick up the plant.','Recoge la planta.','A1'],
        ['put_down','Put down the plant.','Deja la planta.','A1']]),
      O('picture','picture','picture','cuadro',464,221,91,[
        ['look_at','Look at the picture.','Mira el cuadro.','A1'],
        ['take_down','Take down the picture.','Descuelga el cuadro.','A2'],
        ['hang_up','Hang up the picture.','Cuelga el cuadro.','A2']],{hung:true}),
      O('ball','ball','ball','pelota',232,593,98,[
        ['pick_up','Pick up the ball.','Recoge la pelota.','A1'],
        ['put_down','Put down the ball.','Deja la pelota.','A1'],
        ['put_away','Put away the ball.','Guarda la pelota.','A2']]),
      O('book','book','book','libro',590,444,74,[
        ['pick_up','Pick up the book.','Recoge el libro.','A1'],
        ['put_down','Put down the book.','Deja el libro.','A1'],
        ['look_through','Look through the book.','Hojea el libro.','B1']]),
      O('keys','keys','keys','llaves',777,471,67,[
        ['pick_up','Pick up the keys.','Recoge las llaves.','A1'],
        ['put_down','Put down the keys.','Deja las llaves.','A1'],
        ['put_away','Put away the keys.','Guarda las llaves.','A2']]),
      O('sofa','pillow','sofa','sofá',742,541,120,[
        ['sit_down','Sit down on the sofa.','Siéntate en el sofá.','A1'],
        ['stand_up','Stand up from the sofa.','Levántate del sofá.','A1'],
        ['lie_down','Lie down on the sofa.','Recuéstate en el sofá.','A1']],{},true),
      O('window','picture','window','ventana',210,355,115,[
        ['look_out','Look out of the window.','Mira por la ventana.','A2'],
        ['open_up','Open up the window.','Abre la ventana.','A2'],
        ['close','Close the window.','Cierra la ventana.','A1']],{},true)
    ]
  }
};

export const ROOM_ORDER = ['bedroom','living','kitchen'];
export function cloneRoom(roomId, custom = null) {
  const base = custom?.rooms?.[roomId] || ROOMS[roomId];
  return structuredClone(base);
}
export function allPhrases(room) {
  return room.objects.flatMap(object => object.phrases.map(phrase => ({object,phrase})));
}
