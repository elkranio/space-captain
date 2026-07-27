// src/engine/defs/ship_weapon.ts

import type { MissileGuidanceKind, MissileId } from './missile';

export const SHIP_WEAPON_KIND = {
    MISSILE_LAUNCHER: 'missile_launcher',
} as const;

export const SHIP_WEAPON_PHASE = {
    READY: 'ready',
    PREPARING: 'preparing',
    COOLDOWN: 'cooldown',
} as const;

export type ShipWeaponPhase = (typeof SHIP_WEAPON_PHASE)[keyof typeof SHIP_WEAPON_PHASE];

export type ShipWeaponBaseState = {
    // Runtime id конкретного установленного оружия.
    id: string;

    phase: ShipWeaponPhase;
    phaseElapsedMs: number;

    preparationDurationMs: number;
    cooldownDurationMs: number;
};

export type MissileLauncherState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;

    // Прошивка разрешает ракеты с одним типом наведения.
    firmwareGuidanceKind: MissileGuidanceKind;

    loadedMissileId: MissileId | null;

    ammoCount: number;
    ammoCapacity: number;
};

export type ShipWeaponState = MissileLauncherState;
