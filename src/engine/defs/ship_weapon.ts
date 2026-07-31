// src/engine/defs/ship_weapon.ts

import type { MissileId } from './missile';

export const SHIP_WEAPON_KIND = {
    MISSILE_LAUNCHER: 'missile_launcher',
    LASER: 'laser',
    SPAM_PROJECTOR: 'spam_projector',
} as const;

export type ShipWeaponKind = (typeof SHIP_WEAPON_KIND)[keyof typeof SHIP_WEAPON_KIND];

export const SHIP_WEAPON_ID = {
    MISSILE_LAUNCHER_00: 'missile_launcher_00',
    LASER_00: 'laser_00',
    SPAM_PROJECTOR_00: 'spam_projector_00',
} as const;

export type ShipWeaponId = (typeof SHIP_WEAPON_ID)[keyof typeof SHIP_WEAPON_ID];

export const SHIP_WEAPON_PHASE = {
    READY: 'ready',
    TARGETING: 'targeting',
    CHARGING: 'charging',
    CHANNELING: 'channeling',
    COOLDOWN: 'cooldown',
} as const;

export type ShipWeaponPhase = (typeof SHIP_WEAPON_PHASE)[keyof typeof SHIP_WEAPON_PHASE];

// Неизменяемое описание модели оружия.
// Конкретное установленное оружие хранит только weaponId
// и собственное mutable runtime state.
export type ShipWeaponDefinitionBase = {
    id: ShipWeaponId;
    name: string;

    kind: ShipWeaponKind;

    cooldownDurationMs: number;
};

export type MissileLauncherDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;

    ammoCapacity: number;
};

export type LaserWeaponDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.LASER;

    damage: number;

    chargeDurationMs: number;
};

export type SpamProjectorDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    chargeDurationMs: number;
    channelDurationMs: number;
};

export type ShipWeaponDefinition =
    | MissileLauncherDefinition
    | LaserWeaponDefinition
    | SpamProjectorDefinition;

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

export type LaserWeaponState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.LASER;
};

export type SpamProjectorState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    activeChannelId: string | null;
};

export type ShipWeaponState =
    | MissileLauncherState
    | LaserWeaponState
    | SpamProjectorState;
