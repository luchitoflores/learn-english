# WORD QUEST · Living English

**Primera versión alfa (0.1)** de juego educativo 2D parametrizable para practicar inglés realizando acciones sobre objetos. Código original, recursos gráficos originales, tres habitaciones conectadas y ocho modos de aprendizaje.

## Qué contiene realmente

- 3 escenarios (dormitorio, cocina y sala) con imágenes originales renderizadas.
- 29 objetos configurados con 98 expresiones inglés/español y 40 plantillas de acciones.
- 9 imágenes de poses del protagonista y desplazamiento 2D.
- Acciones con aproximación, pose y cambios de estado; los objetos se ocultan al recogerlos y el personaje muestra un objeto en la mano.
- 8 modos funcionales: Descubrimiento, Órdenes, Secuencias, Contrarreloj, Producción, Phrasal Verbs, Listening e Historias.
- Voz inglesa vía `speechSynthesis` (varía según voces instaladas en el dispositivo).
- Progreso con XP en `localStorage`.
- Editor de JSON y arrastre de posiciones de objetos, acceso con `Ctrl+Shift+E`.
- Compilación Vite y workflow GitHub Pages.

**Limitaciones alfa**: los fondos y sprites son ilustraciones vectoriales originales de prototipo, no arte final pintado a mano; las acciones son combinaciones simplificadas de poses y cambios de estado, no animaciones cinemáticas específicas para cada objeto; las historias son misiones locales por habitación, todavía no relatos narrativos entre habitaciones; no hay reconocimiento de voz, autenticación ni APK compilada. No se ha probado visualmente la ejecución del juego completo en un navegador en este entorno sin dependencias instaladas.

## Probar en tu computadora

```bash
npm install
npm run validate
npm run dev
```

Abre la dirección que muestre Vite. Para la versión de producción:

```bash
npm run build
npm run preview
```

> Requiere Node 22 o superior. Para dispositivos móviles, utiliza orientación horizontal.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo y sube **el contenido de esta carpeta a la raíz**.
2. En GitHub, ve a **Settings → Pages → Build and deployment → GitHub Actions**.
3. El workflow `.github/workflows/deploy.yml` compila en cada push a `main` y publica `dist/`.
4. No es necesario editar `base`; `vite build --base=./` usa rutas relativas.

## Datos parametrizables

- `src/data/rooms.js`: habitaciones, objetos, coordenadas, frases y estados iniciales.
- `src/data/actions.js`: recetas de animación, precondiciones y cambios de estado.
- `src/core/ModeEngine.js`: los ocho modos consumen los mismos datos, sin duplicar habitaciones.
- `src/core/RoomScene.js`: renderizador Phaser, desplazamiento, acercamiento e interacciones.
- `src/core/validator.js`: validación básica.
- `tools/generate_assets.py`: generador reproducible de imágenes originales. Ejecuta `python tools/generate_assets.py` (requiere `cairosvg`).

Para editar durante la ejecución, presiona **Ctrl+Mayús+E** (en teclado). Se abrirá una ventana con el JSON de las habitaciones. Puedes exportarlo, importarlo y aplicarlo; también puedes cerrar la ventana y arrastrar objetos mientras esté activo el modo de edición. Los cambios aplicados se guardan en el navegador y se pueden exportar como archivo JSON. Deben añadirse manualmente al código fuente para una publicación nueva.

## Dirección artística

Los 31 PNG originales están incluidos y no dependen de servicios externos. Los fondos usan composición de sala lateral, detalles de arquitectura y paletas separadas; el estilo todavía es provisional. Para una producción final, conviene sustituirlos por ilustraciones en capas y sprites animados consistentes, manteniendo IDs y tamaños.

## Hoja de ruta

1. Validar las interacciones con pruebas visuales en navegador y dispositivos Android.
2. Mejorar alcance de manos y puntos de contacto con objetos (rigging 2D o atlas de mayor detalle).
3. Ampliar el editor a inserción visual de objetos, acciones, animaciones y narrativas.
4. Añadir significado y estructura de los phrasal verbs con mayor profundidad.
5. Agregar nuevas habitaciones usando el motor y ampliar el catálogo sin repetir el código.
