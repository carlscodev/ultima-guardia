## Incidencia prioritaria: renderizado Android Chrome
Usuario reporta rayas de colores, imagen borrosa y combate ilegible en cualquier calidad, solo al entrar en combate. No se dispone del modelo/GPU físico. En Chromium390x844 no se reprodujo el tearing exacto, pero se verificó Canvas desynchronized:true SOLO combate. Fuente oficial https://developer.chrome.com/blog/desynchronized documenta tearing y fotogramas incompletos al borrar/dibujar frontbuffer. Corrección en curso: presentación sincronizada de fotograma completo desde buffer opaco; proporción única sin clamp independiente de ancho; evitar resizes innecesarios y sacudidas subpixel. Verificación específica con testing_agent obligatoria ANTES de cierre. No se proclama resultado físico sin confirmación.


### Actualización de alcance
El usuario retiró explícitamente su solicitud accidental de Gemini ("Eso fue un error no agreges nada"). NO se añade IA ni integraciones externas. Continúan diálogos escritos y audio procedural.
Fases 2/3 implementadas en código: ocho armas/munición, seis zombis/jefe, tres distritos, nueve slots y tonos de piel, cuatro operadores, ocho powerups, Atlas y Eco, campaña/infinito, ajustes, lobby y HUD. Compilación y pruebas integradas en curso; no se considera cerrado hasta validación.


## Estado de ejecución
- Fase 1 COMPLETADA: pruebas ejecutadas Campaign 10/10, Navigation 8/8, Camera 7/7; baseline navegador y correcciones UI validados en iteration_2.json. Módulos aislados sin frontend POC. No guardados existentes encontrados; no se borran claves.
- Fases 2 y 3: implementación integrada en curso, ambas se verificarán explícitamente. Stack real Vue3/TS/Canvas2D conservado. Supervisor dead-city sirve Vite3000. Sin servicios externos.
- Fase4 pendiente capturas reales y regresión.


# Plan de ejecución (MVP → ampliación completa) — Renovación cinematográfica de Dead City

## 1) Objetivos
- Elevar el look & feel (más color, iluminación, VFX, audio ambiente) manteniendo **pixel art** y alto rendimiento en **móvil vertical**.
- Ampliar el contenido jugable: **3 distritos conectados**, **10 rondas con jefe+extracción** (manteniendo modo infinito si existe), **8 armas**, **6 zombis**, **8 power-ups**.
- Añadir **lobby mejorado** con **4 operadores** y **personalización profunda** (piezas por slot) guardada en navegador.
- Implementar compañeros: **pastor alemán** (órdenes + radio 5/10/15m) y **escuadra de apoyo** (2 aliados invocables).
- Añadir **configuración avanzada** (calidad, render scale, AA nítido/suavizado, FPS cap, controles, accesibilidad) y pruebas E2E/perf.

---

## 2) Pasos de implementación

### Fase 1 — POC del “core” (aislado) y pruebas (no avanzar si falla)
**Core a validar:** loop Canvas2D + cámara cinematográfica + navegación IA con colisión + flujo 10 rondas (incl. jefe/extracción) sin romper rendimiento.

**User stories (POC)**
1. Como jugador, quiero una cámara 3/4 que me deje espacio hacia donde apunto/muevo sin perder amenazas cercanas.
2. Como jugador, quiero que objetos altos se atenúen cuando me tapan.
3. Como jugador, quiero un compañero (perro) que me siga y rodee obstáculos sin bloquearme.
4. Como jugador, quiero llegar a una ronda final con jefe y un objetivo claro de extracción.
5. Como jugador, quiero que el rendimiento sea estable con escalado de render y límites de partículas/cadáveres.

**Implementación**
- Añadir “modo campaña 10 rondas” en engine (mantener modo actual/infinito como opción).
- Implementar Boss + extracción mínima (zona/trigger + timer) con HUD.
- Implementar pathing ligero sin A* pesado: steering + “resolve” existente + avoidance (sample rays/side-step) para perro y aliados.
- Cámara cinematográfica: lead hacia dirección de aim/movimiento, zooms discretos en eventos (boss/extracción), shake configurable.
- Telemetría debug ampliada (boss state, extraction progress, dog state) para Playwright.

**Pruebas**
- Actualizar/añadir tests Playwright deterministas: start → sobrevivir oleadas → spawn boss → extracción.
- Test IA: perro no se queda atascado en props típicos (car/building corners).
- Test perf: FPS/frametime dentro de umbral con settings “equilibrado”.

### Fase 2 — Desarrollo V1 de la app (lobby, contenido y ajustes) sobre el core probado

**User stories (V1)**
1. Como jugador, quiero un lobby donde elija operador, arma, compañero y modo antes de jugar.
2. Como jugador, quiero personalizar mi apariencia por piezas (casco, guantes, pantalón, botas, etc.) y verla en partida.
3. Como jugador, quiero 8 armas con diferencias reales (cadencia, recoil, dispersión, recarga, etc.) y audio coherente.
4. Como jugador, quiero 6 tipos de zombis (incl. tóxico/blindado/bruto) con siluetas y comportamientos claros.
5. Como jugador, quiero 8 power-ups con duración/efecto visible y que no dependan solo del color.
6. Como jugador, quiero controles táctiles en vertical (mover/apuntar separado) y soporte teclado/ratón.

**Implementación**
- UI: nuevo Lobby (Vue) + store de loadout/cosméticos/settings en localStorage (sin cuentas/sync).
- Personalización: sistema de slots + paletas; render del operador con capas pixel-art (procedural sprites/canvas pre-render).
- Armas: ampliar WeaponKind + stats + recarga/ammo + VFX (muzzle, casquillos, impactos) + SFX.
- Enemigos: ampliar ZombieKind a 6 + variantes; añadir estados (blindaje, toxic cloud/DoT, brute knockback, boss patterns).
- Power-ups: spawn/consumo + timers + HUD.
- Ciudad: refactor CityScene a “3 distritos conectados” (chunks/zonas) con identidad cromática + props + luces/paroadeos/chispas+SFX.
- Controles: añadir aim stick + botones (disparo, recarga, cambio arma, habilidad), aim-assist opcional.
- Ajustes avanzados: presets calidad, renderScale manual/auto, AA (nítido/suavizado), cap FPS 30/60/uncapped, sliders de VFX/cuerpos, shake, sangre, destellos, subtítulos, volúmenes.

**Pruebas**
- E2E: lobby → partida → usar power-ups → invocar apoyo → boss → extracción → gameover/menu.
- Regression: modo infinito existente sigue disponible.

### Fase 3 — “Cinemático + vivo” (pulido visual/sonoro, diálogos, companions completos)

**User stories (pulido)**
1. Como jugador, quiero una ciudad con farolas/bombillos que parpadeen con sonido y señales luminosas.
2. Como jugador, quiero muertes con dirección/impulso y persistencia limitada para no afectar rendimiento.
3. Como jugador, quiero diálogos cortos por radio con subtítulos que no interrumpan el combate.
4. Como jugador, quiero que el pastor alemán responda a órdenes (seguir/defender/atacar) y radio 5/10/15m.
5. Como jugador, quiero invocar una escuadra de apoyo con duración/enfriamiento y disponibilidad clara en UI.

**Implementación**
- Iluminación 2D estilo pixel (light blobs, sombras fake, flicker, emergency lights), sin WebGL.
- Sistema de cuerpos/decals con límite por calidad.
- Radio/subtítulos: gestor anti-repetición + eventos (inicio, peligro, munición, perro, jefe, extracción).
- Perro: anim set completo (idle/run/attack/hurt/recover) + incapacitación/recuperación.
- Aliados: IA simple con roles (cubre/ataca) + cooldown + “garantizado” en ronda final.

**Pruebas**
- E2E completo en móvil (viewport vertical) y desktop.
- Perf test: low/equilibrado/high + auto.

### Fase 4 — Estabilización y entrega (capturas reales + hardening)

**User stories (entrega)**
1. Como jugador, quiero que ajustes se guarden y pueda restaurar defaults.
2. Como jugador, quiero indicadores opcionales (FPS/telemetría) para entender rendimiento.
3. Como jugador, quiero que el AA no convierta el pixel art en blur global.
4. Como jugador, quiero transiciones claras (game over, resultados, extracción exitosa).
5. Como jugador, quiero ver capturas reales del lobby, personalización y combate en vertical y escritorio.

**Implementación/QA**
- Revisar límites: partículas, cuerpos, resolución dinámica; bugfix de colisiones/IA.
- Generar capturas desde Playwright (desktop + mobile) guardadas en artefactos del repo.
- Documentar controles, modos y ajustes.

---

## 3) Próximas acciones (inmediatas)
1. Auditar guardados/modos actuales (localStorage, tests existentes) para **no romper progreso**.
2. Implementar “campaña 10 rondas” + boss/extracción minimal en engine y exponer flags en debug.
3. Implementar POC de navegación del perro (steering/avoidance) usando CityScene.resolve.
4. Crear/ajustar tests Playwright deterministas para completar campaña.
5. Solo tras pasar POC: empezar Lobby + loadout + settings + expansión de armas/enemigos.

---

## 4) Criterios de éxito
- Se puede jugar end-to-end: **Lobby → partida → 10 rondas → boss → extracción** (y modo infinito sigue disponible si existía).
- **8 armas**, **6 zombis**, **8 power-ups**, **4 operadores** y personalización por slots visibles en partida.
- Compañeros: perro con órdenes+radio y escuadra invocable, ambos funcionales sin romper colisiones.
- Ajustes avanzados implementados (calidad, renderScale, AA nítido/suavizado, FPS cap, controles, accesibilidad) con persistencia en navegador.
- Pruebas: Playwright E2E + perf pasan; rendimiento objetivo 60 cuando posible y 30 estable con adaptación.
- Capturas **reales** (no concept) de lobby/personalización/combate en vertical y escritorio.