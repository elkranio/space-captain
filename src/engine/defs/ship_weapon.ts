// src/engine/defs/ship_weapon.ts

import type { MissileId } from './missile';

export const SHIP_WEAPON_KIND = {
    MISSILE_LAUNCHER: 'missile_launcher',
} as const;

export type ShipWeaponKind = (typeof SHIP_WEAPON_KIND)[keyof typeof SHIP_WEAPON_KIND];

export const SHIP_WEAPON_ID = {
    MISSILE_LAUNCHER_00: 'missile_launcher_00',
} as const;

export type ShipWeaponId = (typeof SHIP_WEAPON_ID)[keyof typeof SHIP_WEAPON_ID];

export const SHIP_WEAPON_PHASE = {
    READY: 'ready',
    PREPARING: 'preparing',
    COOLDOWN: 'cooldown',
} as const;

export type ShipWeaponPhase = (typeof SHIP_WEAPON_PHASE)[keyof typeof SHIP_WEAPON_PHASE];

// Неизменяемое описание модели оружия.
// Конкретная установленная ракетница хранит только weaponId
// и собственное mutable runtime state.
export type ShipWeaponDefinitionBase = {
    id: ShipWeaponId;
    name: string;

    kind: ShipWeaponKind;

    preparationDurationMs: number;
    cooldownDurationMs: number;
};

export type MissileLauncherDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;

    ammoCapacity: number;
};

export type ShipWeaponDefinition = MissileLauncherDefinition;

// Mutable state конкретного установленного оружия.
export type ShipWeaponBaseState = {
    // Runtime id экземпляра на конкретном корабле.
    id: string;

    // Ссылка на неизменяемое content definition.
    weaponId: ShipWeaponId;

    phase: ShipWeaponPhase;
    phaseElapsedMs: number;
};

export type MissileLauncherState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;

    loadedMissileId: MissileId | null;

    ammoCount: number;
};

export type ShipWeaponState = MissileLauncherState;
