# Character Framework v0.1 — Phaser (gratis)

En esta fase conservamos los PNG **originales** del prototipo. NO se ha importado ni se redistribuye material de itch.io.

## Componentes
- `src/data/character.js`: perfil del personaje, poses por clave, recetas reutilizables, estados de rostro preparados.
- `src/core/CharacterAnimator.js`: animación por recetas, caminar, voltearse, acoplar capas PNG opcionales, memorizar expresión.
- `src/core/RoomScene.js`: crea CharacterAnimator y utiliza las recetas por `ACTIONS[phrase.action].recipe`.

La cadena es:
`Oración en inglés -> actionId -> recipe -> secuencia de poses -> PNG`.

Ejemplo: `Pick up the book.` -> `pick_up` -> `pickup` -> `crouch,reach,grab,hold`.

Las mismas poses sirven para muchos objetos. Los PNG actuales NO tienen huesos físicos; cambiar entre fotogramas no equivale todavía a IK o deformación esquelética.

## Añadir movimiento
1. Agrega la pose a `CHARACTER_PROFILE.poses` y proporciona el PNG correspondiente en `public/assets/hero/`.
2. Modifica `RoomScene.preload` para cargar el nuevo PNG (si quieres usar una nueva clave).
3. Agrega una receta a `ANIMATION_RECIPES` (etapas y duración relativa).
4. Asigna el nombre de la receta al `actionId` en `src/data/actions.js`.
5. Utiliza el mismo recipe en varios verbos cuando el movimiento sea físicamente equivalente.

## Añadir rostro independiente
El sistema ofrece `attachLayer(slot, textureKey, offsets)` y `setExpression(name)`. Para que realmente se vea, primero debemos dibujar **imágenes transparentes separadas** para ojos, boca, cejas, cabello y ropa, diseñadas para el mismo perfil y anclaje. Los sprites originales del prototipo están aplanados: los estados faciales son solo datos hasta disponer de las piezas.

## Cambiar a spritesheets de itch.io
No mezcles un sprite de 16×16 con ilustraciones de 1280×720 sin trabajar la escala y el estilo. Antes de importar:
- Confirma en el ZIP que la licencia permite redistribuir assets dentro de un videojuego.
- Identifica tamaño de celda, orden de las filas, FPS, anclaje del pie y animaciones disponibles.
- Registra la fuente y licencia en `docs/FREE_SPRITES.md`.
- Adapta la carga a `this.load.spritesheet` y la reproducción a `scene.anims` usando un perfil nuevo. El resto del juego, su inglés y sus estados no deben cambiar.
- No descargues ni almacenes paquetes terceros automáticamente sin validación de licencia.

## Estado de alcance
Implementado: recetas de poses configurables, soporte para capas separadas futuras, movimiento, integración con la habitación.

Pendiente: rig de huesos 2D con IK, expresiones faciales visuales detalladas, editor gráfico de keyframes, spritesheets externos y efectos en manos.

## Probar
```bash
npm install
npm run validate
npm run dev
npm run build
```
