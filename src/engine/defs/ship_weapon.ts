// src/engine/defs/ship_weapon.ts

import type { MissileGuidanceKind, MissileId } from './missile';

export const SHIP_WEAPON_KIND = {
    MISSILE_LAUNCHER: 'missile_launcher',
} as const;

export type MissileLauncherState = {
    // Runtime id конкретной установленной ракетницы.
    id: string;

    kind: typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;

    // Прошивка разрешает ракеты с одним типом наведения.
    firmwareGuidanceKind: MissileGuidanceKind;

    // null позволит позже представить пустую ракетницу
    // после продажи боезапаса или перепрошивки.
    loadedMissileId: MissileId | null;

    ammoCount: number;
    ammoCapacity: number;
};

export type ShipWeaponState = MissileLauncherState;
