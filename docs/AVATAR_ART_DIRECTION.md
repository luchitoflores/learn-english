# Dirección artística y arquitectura — Personajes Word Quest (22-11-2026)

## Personaje principal
**Adulto humano maduro** de cabellera plateada, barba poblada sal y pimienta, rostro cálido y expresivo, estatura alta y complexión **ancha/robusta** (ni obeso ni musculoso). Diseño original de caricatura 3D de alta calidad visual, expresividad generosa y silueta reconocible, no anime, no pixel art. Referencias de calidad de animación de videojuegos familiares modernos, sin replicar personajes existentes.

El concepto maestro ilustrado en la conversación sirve para dirección de arte, pero NO es todavía un atlas, un spritesheet ni una malla 3D. El taller publicado se implementa provisionalmente con SVG editable, sin licencia de pago ni Spine.

## Estructura propuesta — personaje configurable
- **Identidad de personaje**: ID, nombre, pronombres según contexto, voz TTS, altura y complexión.
- **Cuerpo reutilizable**: cabeza, cuello, hombros, torso, pelvis, brazos, manos, piernas, pies y anclajes.
- **Rostro independiente**: ojos abiertos/cerrados, párpados, cejas, iris, boca, nariz, bigote, barba, lágrimas, maquillaje.
- **Ropa por capas**: ropa interior discreta (sin desnudez gráfica), camiseta, camisa, pijama, pantalón, chaqueta, zapatos, traje y accesorios.
- **Utensilios**: cepillo, peine, afeitadora, brocha, cortaúñas, toalla.
- **Animación semántica**: evento `actionId` + objeto + personaje + condiciones + secuencia de movimiento + cambio de apariencia + oración EN/ES.
- **Guardar personaje**: estado serializable JSON, independiente de la ropa que se está vistiendo en ese momento.

## Estaciones en el juego
1. **Ropero**: elección y ejecución de acciones `put on a shirt`, `take off a shirt`, `put on a suit`, `change clothes`, `hang up a jacket`. Las prendas se vinculan a los huesos/slots adecuados. No confundir cambio inmediato de skin con una animación completa de vestirse: primero debe observarse la acción con movimientos.
2. **Espejo / baño**: `brush your teeth`, `shave`, `put on makeup`, `wash your face`, `open your eyes`, `blink`, `cry`. Zoom opcional a cara/manos, con objetos posicionados.
3. **Pronombres**: al menos tres identidades de actor diferentes y también combinaciones para grupo. `He puts on his jacket.`, `She brushes her teeth.`, `They put on their jackets.` En prototipo, `they` significa grupo plural; añadir singular `they` como caso diferenciado posteriormente.

## Estado actual
- `/character-lab/` contiene un **prototipo SVG gratis** de adulto con barba, ojos, bocas, ropa y objetos editables; seleccionar `he`, `she` o `they` altera la práctica de pronombres y, parcialmente, la apariencia.
- Los estados de ropa camiseta/traje/sin camisa son visibles en el editor, todavía sin la animación completa de vestirse.
- Exporta configuración del personaje en JSON.
- **NO implementado aún**: rig esquelético avanzado, deformación de mallas, integración del avatar final en las 3 habitaciones, sprites 3D exportados, sincronización de múltiples avatares con la partida.

## Próximos pasos sin herramientas de pago
1. Acordar silueta definitiva, versión 3/4 y lateral consistente de la referencia; crear PNG separados con transparencia / atlas.
2. Transformar piezas de arte en assets separados con anclajes/pivotes y los tres perfiles de actor.
3. Ampliar `CharacterAnimator.js` a múltiples huesos y clips basados en keyframes JSON usando containers de Phaser y tweens.
4. Probar primero `blink`, `smile`, `shout`, `cry`, `put_on_shirt`, `take_off_shirt`, `brush_teeth`.
5. Incorporar editor visual de poses y guardar sus keyframes JSON, con prueba móvil.

El objetivo central de Word Quest continúa siendo aprender inglés **a través de las acciones**, no construir casas como en Los Sims.
