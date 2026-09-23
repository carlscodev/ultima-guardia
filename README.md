# Última Guardia 3D

Refactor del prototipo Canvas 2D a Vue 3 + TypeScript estricto + Three.js.

## Ejecutar

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run build
npm run preview
```

## Arquitectura

```text
src/
├── audio/ProceduralAudio.ts       # Web Audio sintetizado, filtro táctico
├── components/
│   ├── GameView.vue               # Adaptador Vue ↔ motor
│   ├── GameOverlay.vue            # Inicio, pausa y game over
│   └── hud/
│       ├── HudOverlay.vue
│       ├── UpgradeMenu.vue
│       └── VirtualControls.vue
├── composables/useControls.ts     # Estado plano de entrada, sin updates reactivos/frame
├── engine/
│   ├── GameEngine.ts              # Fixed timestep, render, oleadas, armas y pooling
│   ├── math.ts
│   └── systems/EnemySystem.ts     # InstancedMesh + pool + spatial hash
├── stores/hud.ts                  # Snapshot superficial a 10 Hz
├── types/game.ts                  # Contratos de dominio
├── App.vue
└── main.ts
```

## Decisiones técnicas

- Simulación fija a 60 Hz con acumulador, render desacoplado vía `requestAnimationFrame`.
- Posiciones y rotaciones viven en clases/objetos TypeScript no reactivos. Vue recibe sólo snapshots del HUD a 10 Hz.
- Enemigos, proyectiles, pickups y partículas usan pools de tamaño fijo e `InstancedMesh`; no se crean objetos durante el combate.
- Separación de horda mediante spatial hash uniforme, evitando el O(n²) del prototipo.
- Pipeline ACES, PBR, sombras PCF, niebla exponencial, bloom, viñeta y aberración cromática por daño.
- Audio Web Audio procedural sin descargar assets: ruido filtrado para armas y osciladores para impactos/pulso/rugidos.
- Escalado no lineal: `7 + wave*3.2 + wave^1.28*1.65`; vida enemiga crece con `wave^1.16`.

## Controles

- WASD/flechas o joystick: movimiento.
- Espacio o botón derecho: pulso.
- 1/2: rifle/escopeta.
- P: pausa.

> Los modelos y texturas son procedurales para que el proyecto sea autocontenido. Para arte final, sustituye las geometrías en `buildPlayer`, `buildEnvironment` y `EnemySystem` por GLTF comprimidos con Draco/KTX2, conservando los pools y contratos existentes.
