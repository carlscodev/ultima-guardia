const base = import.meta.env.BASE_URL

export const DIALOGUE_AUDIO = {
  start: `${base}audio/dialogues/start.mp3`,
  'dog-follow': `${base}audio/dialogues/dog-follow.mp3`,
  'dog-defend': `${base}audio/dialogues/dog-defend.mp3`,
  'dog-attack': `${base}audio/dialogues/dog-attack.mp3`,
  reload: `${base}audio/dialogues/reload.mp3`,
  squad: `${base}audio/dialogues/squad.mp3`,
  'boss-attack': `${base}audio/dialogues/boss-attack.mp3`,
  extraction: `${base}audio/dialogues/extraction.mp3`,
  'boss-arrival': `${base}audio/dialogues/boss-arrival.mp3`,
  empty: `${base}audio/dialogues/empty.mp3`,
  danger: `${base}audio/dialogues/danger.mp3`,
  'dog-recovered': `${base}audio/dialogues/dog-recovered.mp3`,
  'dog-down': `${base}audio/dialogues/dog-down.mp3`,
} as const

export type DialogueAudioId = keyof typeof DIALOGUE_AUDIO
