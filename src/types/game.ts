export type ZombieKind = 'walker' | 'runner' | 'tank' | 'armored' | 'toxic' | 'boss'
export type WeaponKind = 'rifle' | 'shotgun' | 'pistol' | 'revolver' | 'smg' | 'sniper' | 'lmg' | 'launcher'
export type UpgradeId = 'fireRate' | 'damage' | 'speed' | 'pulse' | 'armor' | 'range'
export type ScreenState = 'menu' | 'playing' | 'paused' | 'levelup' | 'gameover' | 'victory'
export interface Vec2 { x:number; y:number }
export interface IPlayer extends Vec2 { hp:number; maxHp:number; speed:number; damage:number; fireInterval:number; range:number; invulnerability:number; angle:number; xp:number; level:number; xpNeeded:number; pulsePower:number; weapon:WeaponKind }
export interface IZombie extends Vec2 { readonly id:number; active:boolean; kind:ZombieKind; vx:number; vy:number; hp:number; maxHp:number; speed:number; radius:number; hitFlash:number; knockback:number; phase:number }
export interface IWeapon { readonly kind:WeaponKind; readonly title:string; pellets:number; spread:number; projectileSpeed:number; recoil:number; damageMultiplier:number; intervalMultiplier:number }
export interface IUpgrade { readonly id:UpgradeId; readonly name:string; readonly description:string; readonly icon:string }
export interface GameState { screen:ScreenState; hp:number; maxHp:number; xp:number; xpNeeded:number; level:number; wave:number; kills:number; elapsed:number; pulseCooldown:number; weapon:WeaponKind; enemies:number; fps:number; ammo?:number; reserve?:number; reload?:number; armor?:number; district?:number; powerups?:readonly {kind:string;title:string;remaining:number}[]; dogHp?:number; dogStatus?:string; dogOrder?:string; squadTime?:number; squadCooldown?:number; signals?:number; radio?:string; radioSpeaker?:string; objective?:string; extraction?:number; bossHp?:number; bossMax?:number; playerX?:number; playerY?:number; phase?:string; lastPickup?:string }
export interface InputState { moveX:number; moveY:number; pulseQueued:boolean; weaponQueued:WeaponKind|null; aimX?:number; aimY?:number; aiming?:boolean; firing?:boolean; reloadQueued?:boolean; squadQueued?:boolean }
export interface EngineEvents { onHud:(state:Readonly<GameState>)=>void; onScreen:(screen:ScreenState)=>void; onUpgrades:(upgrades:readonly IUpgrade[])=>void }
export interface DebugTelemetry { fps:number; frameMs:number; enemies:number; renderScale:number; mode:'canvas2d'; elapsed:number; screen:ScreenState; playerX:number; playerY:number; kills:number; wave:number; level:number; hp:number; pulseCooldown:number; weapon:WeaponKind; ammo?:number; dogX?:number; dogY?:number; dogStatus?:string; phase?:string; extraction?:number; bodies?:number; particles?:number; squadTime?:number; settings?:unknown; loadout?:unknown }
declare global { interface Window { __UG_DEBUG__?: DebugTelemetry } }
