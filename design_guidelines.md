{
  "brand": {
    "name": "Operación: Ciudad Viva",
    "attributes": [
      "táctico-cinemático",
      "pixel art premium (no 3D)",
      "hiperrealista en iluminación/VFX sin perder rendimiento",
      "legible en móvil vertical",
      "energía urbana (neón sutil + tungsteno cálido)",
      "industrial/residencial/comercial con identidad propia"
    ],
    "anti_goals": [
      "UI monocromática verde",
      "gradientes saturados tipo morado/rosa",
      "pantallas centradas tipo landing genérica",
      "sombras grandes y difusas que ensucian pixel art",
      "ruido/scanlines fuertes que bajen legibilidad"
    ]
  },

  "design_tokens": {
    "css_custom_properties": {
      "notes": "Actualizar /app/src/style.css (Vue/Vite). Mantener transiciones específicas (no transition: all). Mantener pixel art nítido: usar sombras pequeñas y glows controlados.",
      "add_or_replace": {
        "--bg": "#0B0F12",
        "--bg-2": "#0F151A",
        "--surface": "#121A20",
        "--surface-2": "#162129",
        "--card": "#10171D",
        "--foreground": "#E9F0F2",
        "--muted": "#A9B6BC",
        "--subtle": "#7F8D94",
        "--border": "#E9F0F21F",

        "--primary": "#2FD3C7",
        "--primary-2": "#7BE7D6",
        "--primary-soft": "#2FD3C714",

        "--accent": "#FFB454",
        "--accent-2": "#FFD08A",
        "--accent-soft": "#FFB45414",

        "--danger": "#FF6B6B",
        "--danger-soft": "#FF6B6B14",
        "--success": "#7EE081",
        "--success-soft": "#7EE08114",
        "--warning": "#F6D365",
        "--warning-soft": "#F6D36514",

        "--district-residential": "#7BE7D6",
        "--district-commercial": "#FFB454",
        "--district-industrial": "#9AA7FF",

        "--shadow-sm": "0 1px 0 rgba(0,0,0,.35)",
        "--shadow-md": "0 10px 30px rgba(0,0,0,.35)",
        "--glow-primary": "0 0 0 1px rgba(47,211,199,.22), 0 0 18px rgba(47,211,199,.12)",
        "--glow-accent": "0 0 0 1px rgba(255,180,84,.18), 0 0 18px rgba(255,180,84,.10)",

        "--radius-xs": "6px",
        "--radius-sm": "10px",
        "--radius-md": "14px",
        "--radius-lg": "18px",

        "--space-1": "6px",
        "--space-2": "10px",
        "--space-3": "14px",
        "--space-4": "18px",
        "--space-5": "24px",
        "--space-6": "32px",

        "--font-display": "'Barlow Condensed', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        "--font-body": "'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",

        "--focus-ring": "0 0 0 3px rgba(47,211,199,.22)",
        "--focus-outline": "2px solid rgba(47,211,199,.9)"
      },
      "gradient_policy": {
        "allowed": [
          "Solo en fondos de secciones (máx 20% viewport)",
          "Overlays decorativos grandes (no en tarjetas de lectura)",
          "Hero del lobby detrás del canvas/isométrico"
        ],
        "forbidden": [
          "Gradientes oscuros/saturados (morado/rosa, azul->morado, rojo->rosa)",
          "Gradientes en elementos <100px",
          "Gradientes en áreas con texto denso"
        ],
        "recommended_mild_gradients": [
          {
            "name": "Lobby Aurora (mild)",
            "css": "radial-gradient(900px 420px at 20% 10%, rgba(47,211,199,.18), transparent 60%), radial-gradient(700px 380px at 85% 20%, rgba(255,180,84,.14), transparent 55%), radial-gradient(900px 520px at 55% 95%, rgba(154,167,255,.10), transparent 60%)"
          }
        ]
      },
      "texture": {
        "noise_overlay": {
          "css": "background-image: url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"2\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"160\" height=\"160\" filter=\"url(%23n)\" opacity=\"0.18\"/%3E%3C/svg%3E'); mix-blend-mode: overlay; opacity: .06; pointer-events:none;",
          "usage": "Pseudo-elemento ::before en contenedores grandes (lobby, pausa). Mantener opacity <= 0.06."
        }
      }
    },

    "typography": {
      "font_pairing": {
        "display": "Barlow Condensed (ya instalado)",
        "body": "DM Sans (ya instalado)",
        "data_readouts_optional": "Si se necesita look 'táctico': añadir 'IBM Plex Mono' SOLO para números/estadísticas (opcional)."
      },
      "scale_tailwind_like": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl (Barlow Condensed, tracking-tight)",
        "h2": "text-base md:text-lg (DM Sans, muted)",
        "section_title": "text-2xl sm:text-3xl (Barlow Condensed)",
        "body": "text-sm sm:text-base (DM Sans)",
        "micro": "text-xs (DM Sans, tabular-nums para stats)"
      },
      "rules": [
        "Números (daño, munición, oro) con font-variant-numeric: tabular-nums",
        "Evitar mayúsculas largas en móvil; usar Title Case en español",
        "Interlineado generoso en paneles: line-height 1.25–1.35"
      ]
    }
  },

  "layout": {
    "responsive_targets": {
      "mobile": "390x844 portrait (prioridad)",
      "desktop": "1920x800 (lobby panorámico con canvas focal)"
    },
    "grid": {
      "base_unit": "8px",
      "lobby_shell": {
        "mobile": "1 columna; canvas arriba (55–62vh), panel inferior tipo 'sheet'",
        "desktop": "2 columnas: izquierda navegación+tabs (360–420px), derecha canvas grande + panel contextual flotante"
      },
      "safe_areas": {
        "mobile_bottom_controls": "Reservar 140–180px para sticks/botones; HUD nunca debe invadir el centro",
        "thumb_zones": "Acciones primarias en tercio inferior; evitar botones pequeños en esquinas superiores"
      }
    },
    "navigation_pattern": {
      "tabs": ["Operación", "Operadores", "Arsenal", "Compañero", "Ajustes"],
      "mobile": "Tab bar inferior con iconos + label corto",
      "desktop": "Rail lateral con tabs + estado (online, fps, build)"
    }
  },

  "component_system": {
    "notes": "El proyecto es Vue3 + Canvas2D (no React, no shadcn). Implementar componentes UI como Vue SFC o funciones JS; mantener data-testid en todo elemento interactivo.",
    "components": {
      "AppShell": {
        "description": "Contenedor principal con fondo, ruido sutil, y layout responsive.",
        "states": ["lobby", "in_game", "pause", "results"],
        "data_testids": ["app-shell"]
      },
      "CinematicCanvasFrame": {
        "description": "Marco para el canvas isométrico (misma función de render que en juego). Incluye overlays: distrito, clima, hora, y luces parpadeantes.",
        "visual": "Bordes tipo L-brackets (esquinas) + glow primario suave.",
        "data_testids": ["lobby-canvas-frame"]
      },
      "TabBar": {
        "description": "Barra de tabs (móvil abajo / desktop lateral).",
        "interaction": "Hover: cambio de color + glow; Active: underline corto + punto de estado.",
        "data_testids": ["lobby-tabbar", "tab-operacion", "tab-operadores", "tab-arsenal", "tab-companero", "tab-ajustes"]
      },
      "PanelCard": {
        "description": "Tarjeta/panel para contenido (stats, listas, configuraciones).",
        "style": "Surface sólida (sin gradiente), borde 1px, sombra pequeña, ruido opcional.",
        "data_testids": ["panel-card"]
      },
      "PrimaryButton": {
        "description": "CTA principal (Iniciar / Extraer / Confirmar).",
        "style": "Radii 10–12px, fill sólido --primary, glow leve en hover.",
        "micro_interactions": [
          "hover: background-color + box-shadow (glow)",
          "active: translateY(1px)",
          "disabled: opacity 0.55"
        ],
        "data_testids": ["primary-button"]
      },
      "SecondaryButton": {
        "description": "Acciones secundarias (Vista previa, Restablecer, Equipar).",
        "style": "Fondo transparente con borde; hover con --primary-soft.",
        "data_testids": ["secondary-button"]
      },
      "SegmentedControl": {
        "description": "Selector compacto (Modo: Campaña/Infinite, Distrito, Dificultad).",
        "data_testids": ["segmented-control"]
      },
      "SliderRow": {
        "description": "Fila de slider para ajustes avanzados (AA, bloom, sombras, VFX).",
        "data_testids": ["settings-slider"]
      },
      "ToggleRow": {
        "description": "Switch/toggle para opciones (Vibración, Sacudida cámara, Alto contraste).",
        "data_testids": ["settings-toggle"]
      },
      "WeaponCard": {
        "description": "Tarjeta de arma con sprite, rareza, stats (daño, cadencia, recarga, dispersión).",
        "rarity_colors": {
          "common": "#A9B6BC",
          "rare": "#2FD3C7",
          "epic": "#9AA7FF",
          "legendary": "#FFB454"
        },
        "data_testids": ["weapon-card", "weapon-equip-button"]
      },
      "OperatorCustomizer": {
        "description": "Customización por piezas: casco, guantes, shorts, torso, botas + paleta de color.",
        "ui": "Grid de piezas (2 columnas móvil, 3–4 desktop) + preview grande.",
        "data_testids": [
          "operator-customizer",
          "operator-select",
          "cosmetic-helmet",
          "cosmetic-gloves",
          "cosmetic-shorts",
          "cosmetic-torso",
          "cosmetic-boots",
          "cosmetic-color-picker"
        ]
      },
      "CompanionPanel": {
        "description": "Selección de compañero (Perro pastor alemán pixel art opcional) + radio de defensa (5/10/15m).",
        "data_testids": ["companion-panel", "companion-select", "companion-radius"]
      },
      "HUD": {
        "description": "HUD minimal: vida/armadura, munición, arma actual, powerups activos, minimapa opcional.",
        "mobile": "Dual-stick: izquierda movimiento, derecha apuntado/disparo; botones salto/recarga/skill cerca del pulgar derecho.",
        "data_testids": [
          "hud-health",
          "hud-ammo",
          "hud-weapon",
          "hud-powerups",
          "hud-pause-button",
          "hud-left-stick",
          "hud-right-stick",
          "hud-reload-button",
          "hud-interact-button"
        ]
      },
      "PauseSheet": {
        "description": "Pausa como sheet inferior (móvil) / modal centrado (desktop) con blur leve.",
        "data_testids": ["pause-sheet", "resume-button", "settings-button", "quit-button"]
      },
      "ResultsScreen": {
        "description": "Resultados: ronda, kills, daño, tiempo, extracción/derrota, loot.",
        "data_testids": ["results-screen", "results-continue-button"]
      }
    }
  },

  "visual_direction": {
    "district_identity": {
      "residential": {
        "palette": ["--district-residential", "--primary-2", "--muted"],
        "lighting": "Ventanas cálidas + faroles suaves; vegetación mínima (no dominante).",
        "props": "bicis, buzones, carteles pequeños"
      },
      "commercial": {
        "palette": ["--district-commercial", "--accent-2", "--primary"],
        "lighting": "Neón cálido (ámbar) + reflejos en asfalto; letreros animados.",
        "props": "vitrinas, toldos, anuncios"
      },
      "industrial": {
        "palette": ["--district-industrial", "#6EE7FF", "--subtle"],
        "lighting": "Tungsteno frío + chispas; humo sutil.",
        "props": "tuberías, grúas, contenedores"
      }
    },
    "lighting_vfx": {
      "goal": "Hiperrealismo percibido vía iluminación 2D: bloom controlado, sombras duras pequeñas, partículas y reflejos puntuales.",
      "effects": [
        "Luces parpadeantes con audio (bombillo chispeando) en faroles/industria",
        "Partículas: polvo, ceniza, chispas (industrial), lluvia opcional",
        "Impact decals breves (2–6 frames) + screen shake opcional",
        "Muzzle flash con 2 capas: núcleo blanco + halo cálido"
      ],
      "performance_rules": [
        "Pool de partículas y decals (sin allocations por frame)",
        "Bloom: aproximación barata (downsample + blur 2-pass) con toggle",
        "Sombras: blob shadows o shadow maps 2D precalculados",
        "Evitar blur CSS en HUD; si se usa, solo en pausa/lobby"
      ]
    },
    "anti_aliasing": {
      "approach": [
        "Canvas2D: preferir render a resolución interna mayor (1.25x–1.5x) + downscale con smoothing configurable",
        "Toggle: imageSmoothingEnabled + quality (low/medium/high) según dispositivo",
        "Para pixel art: AA solo en bordes de iluminación/VFX, no en sprites base (mantener crisp)"
      ],
      "settings_ui": {
        "label": "Suavizado (AA)",
        "options": ["Apagado", "Bajo", "Medio", "Alto"],
        "data_testid": "settings-aa-select"
      }
    }
  },

  "motion_microinteractions": {
    "principles": [
      "Animaciones cortas (120–220ms) para UI; easing: cubic-bezier(.2,.8,.2,1)",
      "Nada de animar layout pesado; animar opacity/transform",
      "Feedback inmediato en móvil: pressed state + haptics (si disponible)"
    ],
    "ui_motion": {
      "tab_switch": "underline desliza 8–12px + fade del panel",
      "cards": "hover desktop: translateY(-1px) + glow leve",
      "weapon_equip": "flash de borde (primary-soft) 180ms",
      "powerup_pickup": "toast in-game minimal (arriba) con icono + nombre"
    },
    "camera_motion": {
      "lobby": "Parallax leve en fondo (0.5–1.5%) al mover mouse/tilt; desactivable",
      "in_game": "shake configurable (0–100%)"
    }
  },

  "accessibility": {
    "requirements": [
      "Contraste AA: texto sobre surface >= 4.5:1",
      "Focus visible: usar --focus-outline y --focus-ring",
      "Modo alto contraste: aumenta border alpha y reduce ruido",
      "Texto grande: escala UI +10/+20%",
      "Reducir movimiento: respeta prefers-reduced-motion"
    ],
    "settings": {
      "toggles": [
        {"label": "Alto contraste", "data_testid": "settings-high-contrast-toggle"},
        {"label": "Reducir movimiento", "data_testid": "settings-reduce-motion-toggle"},
        {"label": "Vibración", "data_testid": "settings-haptics-toggle"}
      ]
    }
  },

  "screens": {
    "lobby": {
      "structure": [
        "Canvas focal (ciudad viva) con operador + perro (si seleccionado)",
        "Panel inferior: CTA 'Iniciar Operación' + modo + distrito + dificultad",
        "Tabs persistentes"
      ],
      "details": [
        "Mostrar FPS/Calidad arriba derecha (micro)",
        "Mostrar 'Ronda 1/10' o 'Infinito' como chip",
        "Luces parpadeantes visibles en canvas (no UI)"
      ]
    },
    "operadores": {
      "structure": [
        "Selector de 4 operadores (cards) con preview sprite real",
        "Customizer por piezas + paleta",
        "Botón 'Guardar'"
      ]
    },
    "arsenal": {
      "structure": [
        "Grid/lista de 8 armas",
        "Panel lateral/inferior con stats y descripción",
        "Botón Equipar + botón Vista previa (disparo en canvas)"
      ]
    },
    "companero": {
      "structure": [
        "Selector: Ninguno / Perro",
        "Radio de defensa",
        "Comportamiento: Agresivo/Defensivo (segmented)"
      ]
    },
    "ajustes": {
      "sections": [
        "Gráficos (AA, bloom, sombras, partículas, resolución interna)",
        "Controles (sensibilidad sticks, zona muerta)",
        "Audio (SFX, música, ambiente)",
        "Accesibilidad"
      ]
    },
    "in_game_hud": {
      "rules": [
        "Centro libre",
        "HUD con placas pequeñas y bordes L",
        "Indicadores de daño: borde rojo suave + vignette mínimo"
      ]
    }
  },

  "image_urls": {
    "notes": "No usar screenshots falsos. El juego es pixel art procedural/canvas. Solo usar imágenes si son texturas sutiles (ruido) o iconografía simple generada. Por ahora: sin imágenes externas obligatorias.",
    "external": []
  },

  "libraries": {
    "optional": [
      {
        "name": "Howler.js",
        "why": "Audio SFX (bombillo chispeando, UI clicks) con control fino y pooling.",
        "install": "npm i howler",
        "usage": "Crear un AudioManager singleton; precargar 6–12 SFX; volumen por canal (ui/sfx/ambiente).",
        "performance": "Evitar crear nuevos Howl por evento; reutilizar."
      }
    ]
  },

  "implementation_notes_js": {
    "css": {
      "do": [
        "Transiciones específicas: background-color, border-color, color, opacity",
        "Sombras pequeñas y glows suaves",
        "Usar variables CSS para todo"
      ],
      "dont": [
        "No transition: all",
        "No blur pesado en HUD",
        "No gradientes saturados"
      ]
    },
    "data_testid_policy": {
      "rule": "Todo botón, input, slider, tab, selector, y texto crítico debe tener data-testid en kebab-case.",
      "examples": [
        "data-testid=\"lobby-start-operation-button\"",
        "data-testid=\"arsenal-weapon-equip-button\"",
        "data-testid=\"settings-aa-select\"",
        "data-testid=\"hud-ammo\""
      ]
    }
  },

  "instructions_to_main_agent": [
    "Actualizar /app/src/style.css: reemplazar el esquema verde por el sistema 'bg/surface + primary teal + accent ámbar + industrial periwinkle'.",
    "Mantener pixel art: sprites sin smoothing por defecto; AA configurable solo para VFX/iluminación o downscale.",
    "Lobby debe sentirse 'AAA' sin 3D: canvas grande con ciudad viva + overlays mínimos; panel inferior tipo sheet con CTA.",
    "Implementar tabs Operación/Operadores/Arsenal/Compañero/Ajustes con navegación persistente (móvil bottom bar).",
    "Operadores: 4 operadores con piezas customizables (casco/guantes/shorts/torso/botas) y paleta; preview usa el mismo renderer del juego.",
    "Arsenal: 8 armas con stats y rareza; vista previa de disparo en canvas.",
    "Compañero: perro opcional + radio 5/10/15m + modo agresivo/defensivo.",
    "Ajustes avanzados: AA, bloom, sombras, partículas, resolución interna, sensibilidad sticks, accesibilidad.",
    "Añadir micro-interacciones (120–220ms) y estados pressed; respetar prefers-reduced-motion.",
    "Añadir data-testid a TODO elemento interactivo y a indicadores críticos del HUD/resultados."
  ]
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
