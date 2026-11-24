# Word Quest — expresiones cotidianas y animaciones
## Último estado comprobado (noviembre 2026)
La rama `main` contenía en el commit `3c540cad` la casa Three.js, el Ranger KayKit, el catálogo de clips 3D, House Lab 2D, el juego Phaser y Character Lab. Esta expansión incorpora un menú de seis accesos y una práctica de frases vinculada a **14 clips existentes**.

## Principio pedagógico
1. **Observación:** reproducir un movimiento real del Ranger.
2. **Comprensión:** presentar un contexto temporal explícito (NOW / YESTERDAY) y una frase en español.
3. **Selección:** elegir la oración inglesa correcta entre cuatro.
4. **Feedback:** mostrar la frase y una nota sobre las formas del verbo.
5. **Repaso:** registrar respuestas correctas; más adelante conectar errores con la cola de repeticiones espaciadas de House Lab.

Las animaciones físicas no distinguen por sí solas pasado de presente. Nunca debe atribuirse a una misma secuencia cinematográfica el significado de un tiempo verbal sin un contexto temporal adicional.

## Familias prioritarias
- **GET:** *get up* levantarse, *get back* regresar, *get in* entrar, *get out* salir, *get off* bajarse, *get along with* llevarse bien, *get over* superar, *get rid of* deshacerse. Solo *get up* está ligado hoy a una animación del Ranger. Los demás requieren acciones, objetos o escenas específicas.
- **PUT:** *put it back* devolverlo a su posición anterior; *put it away* guardarlo en su lugar; *put it in* ponerlo dentro de un recipiente; *put it on* ponerlo sobre algo o ponerse ropa; *put it down* depositarlo; *put it off* posponerlo. No tratarlos como traducciones intercambiables.
- **LOOK y 'fíjate':** según el contexto, *Look!* = ¡Mira!, *Take a look* = Échale un vistazo, *Pay attention* = Presta atención, *Notice that…* = Fíjate en que…, *Watch out!* / *Look out!* = ¡Cuidado! No enseñar *look out* como traducción general de «fíjate».
- **PICK / TAKE / BRING:** *pick up* recoger, *take out* sacar, *bring back* traer de vuelta, *put back* devolver a su lugar. *Pick back* no es una alternativa general a *put back*.

## Acciones que deben necesitar estados y objetos
```js
// Esquema futuro (aún no es un motor implementado)
{
  id: 'put-back',
  action: 'put',
  particle: 'back',
  actor: 'ranger',
  target: 'milk',
  requires: ['isHolding(milk)', 'hasOriginalLocation(milk)'],
  effects: ['move(milk, originalLocation)', 'clearHeld(milk)'],
  audio: 'Put it back.',
}
```
Así, *put it in* exige destino de tipo contenedor; *put it back* exige ubicación inicial; *put it away* exige lugar de guardado. Los movimientos de brazos pueden reutilizarse entre las tres expresiones, pero los cambios en el objeto deben distinguirlas visualmente.

## Siguientes etapas
- **Acciones con objetos:** enchufar clips `PickUp`, `Use_Item` e `Interact` a estados reales de puertas, refrigeradora, mesa, cajones y utensilios.
- **Vocabulario cotidiano con personajes:** cabeza, rostro y emociones en Character Lab; expresiones como *look tired*, *wake up*, *calm down* requieren arte facial u otras animaciones.
- **Gramática progresiva:** elegir frase, luego completar palabra, luego ordenar y finalmente escribirla o decirla.
- **Más verbos:** catalogar clips en forma de `animationId → action → phrases → conditions → objectEffects`, sin afirmar que dos clips distintos significan lo mismo.
- **Protagonista personalizado:** Ranger es provisional; convertir imágenes 2D del protagonista a modelo 3D y retargeting del rig requiere validación antes de reemplazarlo.

## Pantallas
- `/`: menú de modos.
- `/house-3d/#animaciones`: catálogo de animaciones.
- `/house-3d/#frases`: frases y tiempos con movimientos.
- `/house-3d/`: casa 3D interactiva.
- `/house-lab/`: mesa de vocabulario.
- `/character-lab/`: editor de protagonista 2D.
- Aventura Phaser clásica: se activa desde el menú sin cargarla antes.

## Dirección prioritaria: comprensión auditiva visual (Listening Lab)
El acceso #escuchar es el nuevo modo prioritario. La traducción no aparece antes de responder. Aprender: audio y movimiento; Ejecutar orden: seleccionar una acción visual y ejecutarla; Reconocer acción: escuchar una descripción y comparar animaciones. Velocidad natural (1) y lenta (.75); pista opcional; repetición de errores en sesión. El modo de gramática anterior se conserva separado. El saludo utiliza un segundo avatar Mage y distingue distancia cercana/lejana. 
Pendiente: selección y personalización de avatares, diálogo real con turnos y voces, baile en pareja, interacciones coordinadas (entregar, recibir, seguir, señalar, llamar, pelea de videojuego), animaciones faltantes y sincronización, comandos secuenciales, repaso persistente y voces variadas. No simular que un clip de saludo representa hablar o bailar. Las órdenes de objetos deben validar acción + objeto + destino, y no solo seleccionar el sustantivo.
