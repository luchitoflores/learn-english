# Pack de sprites de frutas y verduras — Refrigeradora

## Origen y contenido
- Archivo suministrado en esta conversación: `fruits-and-veggies-48px.rar`.
- Contiene 35 imágenes PNG RGBA de 48 × 48 píxeles.
- Se empaquetaron **sin redibujar ni interpolar** en `public/assets/inventory/fruits-veggies-atlas.png`, un atlas de 7 columnas × 5 filas (336 × 240).
- Sus posiciones y traducciones se definen en `src/data/fridge-sprites.js`. El orden de los 35 cuadros coincide con el índice `spriteIndex` del manifiesto.
- Los archivos originales no se subieron individualmente; se usa un único atlas pequeño.
- El archivo RAR no contenía una licencia de uso. **Antes de redistribuir o comercializar el arte, verifica los permisos del autor original.**

## Mecánicas
La refrigeradora contiene 41 alimentos: 35 sprites del pack y 6 alimentos anteriores (huevos, leche, queso, jugo, yogur, mantequilla). Se conserva el estado de cada alimento, registrado por su ID.

En **Descubrir**, los alimentos aparecen en páginas de 12, con filtros Todos/Frutas/Verduras/Otros. Al seleccionar una fruta/verdura se pronuncia una oración en inglés y se muestra su traducción.

En los demás modos, cada desafío ofrece 8 objetos (incluida siempre la respuesta correcta), sin obligar a buscar una misión entre 41 elementos. La orden también puede repetirse con el botón de audio.

## Ampliación
Para añadir otro pack:
1. Crear un atlas PNG con celdas iguales y transparencia; no usar escalado suavizado para pixel art.
2. Agregar los ítems al manifiesto con `image`, `spriteIndex`, categoría y traducción.
3. Incorporarlos a un contenedor dentro de `src/data/containers.js`.
4. Comprobar `npm run validate` y la prueba móvil de GitHub Actions.

## Nota visual
Los sprites suministrados son **pixel art** y no coinciden exactamente con el acabado 3D caricaturesco del protagonista y otros objetos. Se mantienen como una colección identificable dentro del inventario; no sustituyen los fondos de la habitación.
