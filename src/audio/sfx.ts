const base = import.meta.env.BASE_URL

export const SFX_AUDIO = {
  'reload-revolver': `${base}audio/sfx/reload-revolver.wav`,
  'reload-smg': `${base}audio/sfx/reload-smg.wav`,
  'reload-sniper': `${base}audio/sfx/reload-sniper.wav`,
  'reload-lmg': `${base}audio/sfx/reload-lmg.wav`,
  'reload-launcher': `${base}audio/sfx/reload-launcher.wav`,
  empty: `${base}audio/sfx/empty.wav`,
  'weapon-switch': `${base}audio/sfx/weapon-switch.wav`,
  'casing-brass': `${base}audio/sfx/casing-brass.wav`,
  'casing-shotgun': `${base}audio/sfx/casing-shotgun.wav`,
  'impact-concrete': `${base}audio/sfx/impact-concrete.wav`,
  'impact-metal': `${base}audio/sfx/impact-metal.wav`,
  'impact-zombie': `${base}audio/sfx/impact-zombie.wav`,
  ricochet: `${base}audio/sfx/ricochet.wav`,
  'launcher-explosion': `${base}audio/sfx/launcher-explosion.wav`,
  'emp-pulse': `${base}audio/sfx/emp-pulse.wav`,
  'player-hurt-1': `${base}audio/sfx/player-hurt-1.wav`,
  'player-hurt-2': `${base}audio/sfx/player-hurt-2.wav`,
  'player-hurt-3': `${base}audio/sfx/player-hurt-3.wav`,
  'player-cough': `${base}audio/sfx/player-cough.wav`,
  'player-death': `${base}audio/sfx/player-death.wav`,
  'zombie-growl-1': `${base}audio/sfx/zombie-growl-1.wav`,
  'zombie-growl-2': `${base}audio/sfx/zombie-growl-2.wav`,
  'zombie-growl-3': `${base}audio/sfx/zombie-growl-3.wav`,
  'zombie-growl-4': `${base}audio/sfx/zombie-growl-4.wav`,
  'zombie-growl-5': `${base}audio/sfx/zombie-growl-5.wav`,
  'ambient-drone': `${base}audio/sfx/ambient-drone.wav`,
} as const

export type SfxAudioId = keyof typeof SFX_AUDIO
