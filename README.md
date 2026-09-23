# Última Guardia — Canvas2D

Zombie survivor isométrico 2D construido con Vue 3, TypeScript estricto y Canvas2D. Conserva la estética pixel-art y la lógica del prototipo original sin el coste de WebGL/Three.js.

## Ejecutar

```bash
npm install
npm run dev
```

## Validación

```bash
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:perf
```

## Arquitectura

```text
src/
├── audio/ProceduralAudio.ts       # Web Audio sintetizado
├── components/                    # HUD, overlays y controles Vue
├── composables/useControls.ts     # Entrada plana no reactiva por frame
├── engine/
│   ├── GameEngine.ts              # Canvas2D, fixed timestep y pools
│   ├── math.ts
│   └── systems/EnemySystem.ts     # Pool + spatial hash
├── stores/hud.ts                  # Snapshot superficial a 10 Hz
└── types/game.ts
tests/performance.spec.ts          # FPS, arranque y controles con Playwright
```

## Rendimiento

- Canvas interno a resolución dinámica entre 50% y 78% del viewport.
- Simulación fija a 60 Hz separada del render.
- Coordenadas fuera de la reactividad de Vue.
- Pools fijos para 320 enemigos, 180 proyectiles, 150 pickups y 420 partículas.
- Spatial hash para separación de hordas; evita el bucle O(n²) del prototipo.
- Culling de actores y tiles fuera de cámara.
- Un solo batch/path para todos los trazos de proyectiles.
- HUD publicado a 10 Hz.
- Telemetría accesible en `window.__UG_DEBUG__` para Playwright.
- Sin Three.js, shaders, modelos, texturas externas ni fuentes de red.

## Mecánicas

- Rifle y escopeta.
- Zombis walker, runner y tank.
- Pulso defensivo, XP, botiquines y mejoras.
- Oleadas de dificultad no lineal.
- Joystick móvil, WASD/flechas, espacio, teclas 1/2 y pausa con P.
- Audio procedural con Web Audio API.

## Vercel

El repositorio incluye `vercel.json`. Vercel usa `npm run build` y publica `dist`.
