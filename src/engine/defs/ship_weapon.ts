// src/engine/defs/ship_weapon.ts

import type {
    StickyMineId,
} from './sticky_mine';

export const SHIP_WEAPON_KIND = {
    MISSILE_LAUNCHER: 'missile_launcher',
    LASER: 'laser',
    SPAM_PROJECTOR: 'spam_projector',
    STICKY_MINE_DISPENSER: 'sticky_mine_dispenser',
} as const;

export type ShipWeaponKind = (typeof SHIP_WEAPON_KIND)[keyof typeof SHIP_WEAPON_KIND];

export const SHIP_WEAPON_ID = {
    MISSILE_LAUNCHER_00: 'missile_launcher_00',
    LASER_00: 'laser_00',
    SPAM_PROJECTOR_00: 'spam_projector_00',
    STICKY_MINE_DISPENSER_00: 'sticky_mine_dispenser_00',
} as const;

export type ShipWeaponId = (typeof SHIP_WEAPON_ID)[keyof typeof SHIP_WEAPON_ID];

export const SHIP_WEAPON_PHASE = {
    READY: 'ready',
    TARGETING: 'targeting',
    CHARGING: 'charging',
    CHANNELING: 'channeling',
    DISPENSING: 'dispensing',
    COOLDOWN: 'cooldown',
} as const;

export type ShipWeaponPhase = (typeof SHIP_WEAPON_PHASE)[keyof typeof SHIP_WEAPON_PHASE];

// Единый domain query для занятости оператора оружия.
//
// Occupancy is not the same as progress timing:
// an active spam channel still occupies Science, but its lifetime advances
// in world time rather than crew-performance time.
//
// Cooldown and ready do not require a crew/officer.
// Any new phase must be classified explicitly here.
export function doesShipWeaponPhaseRequireOperator(
    phase: ShipWeaponPhase,
): boolean {
    switch (phase) {
        case SHIP_WEAPON_PHASE.TARGETING:
        case SHIP_WEAPON_PHASE.CHARGING:
        case SHIP_WEAPON_PHASE.CHANNELING:
        case SHIP_WEAPON_PHASE.DISPENSING:
            return true;

        case SHIP_WEAPON_PHASE.READY:
        case SHIP_WEAPON_PHASE.COOLDOWN:
            return false;

        default: {
            const exhaustivePhase: never =
                phase;

            return exhaustivePhase;
        }
    }
}

// Central timing policy for installed weapon phases.
//
// true  -> advance with crew-performance time;
// false -> advance with raw encounter/world time.
//
// This is intentionally separate from operator occupancy.
export function doesShipWeaponPhaseAdvanceWithCrew(
    kind: ShipWeaponKind,
    phase: ShipWeaponPhase,
): boolean {
    switch (kind) {
        case SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER:
            return (
                phase ===
                SHIP_WEAPON_PHASE.TARGETING
            );

        case SHIP_WEAPON_KIND.LASER:
            return (
                phase ===
                    SHIP_WEAPON_PHASE
                        .TARGETING ||
                phase ===
                    SHIP_WEAPON_PHASE
                        .CHARGING
            );

        case SHIP_WEAPON_KIND
            .SPAM_PROJECTOR:
            return (
                phase ===
                SHIP_WEAPON_PHASE.TARGETING
            );

        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
            return (
                phase ===
                    SHIP_WEAPON_PHASE
                        .TARGETING ||
                phase ===
                    SHIP_WEAPON_PHASE
                        .DISPENSING
            );

        default: {
            const exhaustiveKind: never =
                kind;

            return exhaustiveKind;
        }
    }
}

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

    damage: number;
    flightDurationMs: number;

    ammoCapacity: number;
};

export type LaserWeaponDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.LASER;

    damage: number;

    chargeDurationMs: number;
};

export type SpamProjectorDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    channelDurationMs: number;

    officerTaskProgressMultiplier: number;
};

export type StickyMineDispenserDefinition =
    ShipWeaponDefinitionBase & {
        kind:
            typeof SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER;

        ammoCapacity: number;

        salvoSize: number;
        launchIntervalMs: number;
    };

export type ShipWeaponDefinition =
    | MissileLauncherDefinition
    | LaserWeaponDefinition
    | SpamProjectorDefinition
    | StickyMineDispenserDefinition;

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

    ammoCount: number;
};

export type LaserWeaponState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.LASER;
};

export type SpamProjectorState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    activeChannelId: string | null;
};

export type StickyMineDispenserState =
    ShipWeaponBaseState & {
        kind:
            typeof SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER;

        loadedMineId: StickyMineId | null;

        ammoCount: number;

        // Количество мин, реально запущенных
        // в текущем salvo.
        dispensedMineCount: number;
    };

export type ShipWeaponState =
    | MissileLauncherState
    | LaserWeaponState
    | SpamProjectorState
    | StickyMineDispenserState;
