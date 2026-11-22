# Word Quest · Framework de contenedores y caminata lateral

## Objetivo pedagógico
El personaje **realiza una acción concreta** en una habitación; el estudiante escucha una instrucción en inglés, identifica un objeto por su imagen y aprende la expresión en contexto. La interfaz no es un juego de fusión: los objetos no se combinan ni se compran; se **sacan, recogen, guardan, devuelven y utilizan**.

## Flujo
1. Elegir habitación y acercarse lateralmente a un contenedor o usar su acceso visible.
2. Pulsar el contenedor: el personaje camina hasta él; se muestra una ventana de inventario superpuesta a la escena.
3. Escuchar la orden, repetible mediante el botón de voz del sistema.
4. Seleccionar entre 6–8 imágenes rasterizadas de objetos. El contenido no depende del zoom de Phaser.
5. Recibir retroalimentación EN/ES, XP y estado visual DENTRO/FUERA; el último aprendizaje queda visible en «Última expresión».
6. Cerrar el panel, conservar el estado y regresar al modo y a la habitación.

## Contenedores incluidos
| Contenedor | Habitación | Vocabulario |
|---|---|---|
| Fridge / Refrigeradora | Cocina | eggs, milk, cheese, apple, juice, yogurt, butter, lettuce |
| Toolbox / Caja de herramientas | Sala | hammer, screwdriver, wrench, pliers, tape measure, nails, screws, drill |
| Wardrobe / Ropero | Dormitorio | shirt, jacket, T-shirt, pants, shoes, tie, suit |
| Backpack / Mochila | Dormitorio | book, phone, keys, towel, apple, spoon |
| Medicine cabinet / Botiquín | Cocina | bandage, thermometer, cotton, antiseptic, scissors, ointment, medicine bottle |
| Drawer / Cajón | Cocina | spoon, keys, remote control, towel, book, scissors |

## Ocho modos reutilizando el mismo panel
- **Descubrir:** tocar y escuchar la palabra, observar EN/ES y alternar dentro/fuera.
- **Órdenes:** instrucción spoken + escrita; elegir el objeto correspondiente.
- **Listening:** instrucción hablada; se oculta el texto inglés.
- **Secuencias:** tres tareas consecutivas con estado persistente.
- **Historias:** cadena breve de tres acciones contextualizadas.
- **Contrarreloj:** responder órdenes durante 60 s; contador visible.
- **Producción:** aparece el significado en español y se elige la imagen correspondiente.
- **Phrasal verbs:** se aprende «take out», «put away» y «put back» con objetos reales.

## Datos parametrizables
`src/data/containers.js` define, para cada contenedor:
- `id`, `room`, `name`, `en`, `es`, `kind`;
- `items[]`: `id`, `en`, `es`, `image`, `plural`;
- `verbs.out` y `verbs.back`, con plantillas `{item}`/`{es}`.

`src/core/ContainerEngine.js` maneja el panel, la orden actual, estado y puntuación. Los datos se conservan en `localStorage` bajo `word-quest-containers-v1` y la práctica suma XP mediante el mecanismo existente de Word Quest. Todas las ilustraciones son rasterizadas y se sirven como archivos WebP locales.

## Movimiento lateral
La vista casual con barba usa `public/assets/hero/side-walk.webp`: **4 cuadros originales** (quieto y tres posiciones de paso), generados con IA; Phaser reproduce el ciclo mediante `generateFrameNumbers` y refleja horizontalmente al moverse a la izquierda. La variante sin barba y el traje permanecen como retratos raster estáticos al caminar hasta crear sus ciclos laterales definitivos; no se presentan como animaciones completas.

## Límites de esta etapa
El panel dispone de interacción y estados de objetos; todavía no hay modelado 3D, transformación física de los objetos en mano ni animaciones completas de abrir puertas de armarios. Los objetos de inventario ilustrados a partir del arte original incluyen algunos recortes de propuestas gráficas, por lo que una futura generación individual mejorará sus bordes. El sistema TTS sigue utilizando las voces del navegador.

## Verificación
`npm run validate` comprueba habitaciones, objetos y assets de inventario; el flujo de GitHub Actions ejecuta una prueba en Chrome móvil que comprueba el renderizado, cambio de cuarto, caminata lateral, apertura del inventario y selección de un objeto.
