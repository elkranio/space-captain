// src/engine/defs/ship_weapon.ts


export const SHIP_WEAPON_KIND = {
    MISSILE_LAUNCHER: 'missile_launcher',
    BEAM_CANNON: 'beam_cannon',
    SPAM_PROJECTOR: 'spam_projector',
    STICKY_MINE_DISPENSER: 'sticky_mine_dispenser',
} as const;

export type ShipWeaponKind = (typeof SHIP_WEAPON_KIND)[keyof typeof SHIP_WEAPON_KIND];

export const SHIP_WEAPON_ID = {
    MISSILE_LAUNCHER_00: 'missile_launcher_00',
    BEAM_CANNON_00: 'beam_cannon_00',
    SPAM_PROJECTOR_00: 'spam_projector_00',
    STICKY_MINE_DISPENSER_00: 'sticky_mine_dispenser_00',
} as const;

// Builtin ids remain convenient stable constants.
 // The catalog is open for new weapon ids created by the content editor.
export type ShipWeaponId =
    string;

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

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            return (
                phase ===
                SHIP_WEAPON_PHASE.CHARGING
            );

        case SHIP_WEAPON_KIND
            .SPAM_PROJECTOR:
            return false;

        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
            return (
                phase ===
                SHIP_WEAPON_PHASE.DISPENSING
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
    targetingDurationMs: number;
    flightDurationMs: number;

    ammoCapacity: number;
};

export type BeamCannonDefinition = ShipWeaponDefinitionBase & {
    kind: typeof SHIP_WEAPON_KIND.BEAM_CANNON;

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

        damage: number;
        fuseDurationMs: number;

        ammoCapacity: number;

        salvoSize: number;
        launchIntervalMs: number;
    };

export type ShipWeaponDefinition =
    | MissileLauncherDefinition
    | BeamCannonDefinition
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

export type BeamCannonState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.BEAM_CANNON;
};

export type SpamProjectorState = ShipWeaponBaseState & {
    kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;

    activeChannelId: string | null;
};

export type StickyMineDispenserState =
    ShipWeaponBaseState & {
        kind:
            typeof SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER;

        ammoCount: number;

        // Количество мин, реально запущенных
        // в текущем salvo.
        dispensedMineCount: number;
    };

export type ShipWeaponState =
    | MissileLauncherState
    | BeamCannonState
    | SpamProjectorState
    | StickyMineDispenserState;
