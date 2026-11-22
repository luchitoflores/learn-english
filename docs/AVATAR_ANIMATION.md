# Word Quest · Personaje frontal y caminata lateral (22-11-2026)

## Fuente del arte
Esta actualización **reutiliza las dos láminas originales proporcionadas por el usuario**:
- `80194.png` — frente con barba, frente sin barba, perfil, frente con traje.
- `80193.png` — ocho fotogramas de caminata y alcance de perfil.

No se ha generado un protagonista nuevo.

## PNG optimizados en public/assets/hero/
- `front-beard.png`: vista frontal en reposo.
- `front-shaved.png`: vista frontal sin barba.
- `front-suit.png`: vista frontal con traje.
- `side-walk-clean.png`: spritesheet PNG **1536 × 256**, ocho celdas de **192 × 256**, de perfil derecho.

Todos los recursos tienen canal alfa real; se limpiaron los colores de píxeles totalmente transparentes antes de reescalar. Se corrigieron los bordes del spritesheet original sin recrear la ilustración.

## Máquina visual de estados
- **idle**: `front-beard`, `front-shaved` o `front-suit`, sin reflejo horizontal, ligero efecto de respiración.
- **walk**: spritesheet lateral, frames 1–6, `flipX` para cambiar el sentido.
- **use / reach / grab**: fotograma lateral 7, con mano extendida.
- **door**: camina hasta la salida, hace el gesto lateral y entra; la nueva habitación muestra inmediatamente el frente.
- **done**: vuelve siempre a su perfil frontal correspondiente.

La apariencia se guarda en la misma clave de `localStorage` compartida por el editor y el juego.

## Límite gráfico honesto
La hoja lateral del usuario corresponde al **personaje casual con barba**. Cuando el jugador se afeita o viste de traje, el estado frontal refleja su elección, pero los fotogramas laterales reutilizan temporalmente el aspecto casual con barba. Para lograr coherencia perfecta hay que preparar dos hojas laterales adicionales con la misma pose, proporciones y ocho fotogramas.

Las poses disponibles dan movimiento lateral y un gesto de mano, pero no son animaciones articuladas completas para todos los verbos.
