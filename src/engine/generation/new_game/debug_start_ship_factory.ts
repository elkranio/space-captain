// src/engine/generation/new_game/debug_start_ship_factory.ts

import { DEBUG_START } from "../../content/catalogs/debug_start";
import { DEFENSE_TURRETS } from "../../content/catalogs/defense_turrets";
import { SHIELD_GENERATORS } from "../../content/catalogs/shield_generators";
import { SHIP_CHASSIS } from "../../content/catalogs/ship_chassis";
import { SHIP_DRIVES } from "../../content/catalogs/ship_drives";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import type { ShipPreset, ShipWeaponPreset } from "../../content/presets/ships";
import type { PlayerShipState } from "../../defs/player";
import type { ShipSlotKind } from "../../defs/ship_slot";
import { SHIP_WEAPON_KIND, type ShipWeaponKind } from "../../defs/ship_weapon";
import ShipFactory, { type CreatedShipState } from "../ship/ShipFactory";
import { NEW_GAME_CONFIG } from "./new_game_config";

const DEBUG_START_SYSTEM_ID = {
    PLAYER: {
        DRIVE: "drive_player_00",

        DEFENSE_TURRET: "defense_turret_player_00",

        POWER_CORE: "power_core_player_00",

        SHIELD_GENERATOR: "shield_generator_player_00",
    },

    ENEMY: {
        DRIVE: "drive_00",

        DEFENSE_TURRET: "defense_turret_00",

        POWER_CORE: "power_core_00",

        SHIELD_GENERATOR: "shield_generator_00",
    },
} as const;

type DebugStartShipSide = "player" | "enemy";
type ClaimSlot = (kind: ShipSlotKind) => string;

export function createDebugStartPlayerShip(): PlayerShipState {
    const ship = ShipFactory.createFromPreset(createDebugStartPlayerPreset());

    if (!ship.defenseTurret || !ship.powerCore || !ship.shieldGenerator) {
        throw new Error("Debug Start player ship is missing required equipment.");
    }

    return {
        ...ship,

        defenseTurret: ship.defenseTurret,
        powerCore: ship.powerCore,
        shieldGenerator: ship.shieldGenerator,
    };
}

export function createDebugStartEnemyShip(): CreatedShipState {
    return ShipFactory.createFromPreset(createDebugStartEnemyPreset());
}

function createDebugStartPlayerPreset(): ShipPreset {
    const config = DEBUG_START.player;
    const chassisId = NEW_GAME_CONFIG.player.chassisId;
    const claimSlot = createSlotClaim(chassisId);

    const driveDefinition = SHIP_DRIVES[config.driveId];
    const defenseTurretDefinition = DEFENSE_TURRETS[config.defenseTurretId];
    const shieldGeneratorDefinition = SHIELD_GENERATORS[config.shieldGeneratorId];

    const driveSlotId = claimSlot(driveDefinition.slotKind);
    const defenseTurretSlotId = claimSlot(defenseTurretDefinition.slotKind);
    const shieldGeneratorSlotId = claimSlot(shieldGeneratorDefinition.slotKind);

    const weapons = createDebugStartWeaponPresets(
        [config.weaponSlot1Id, config.weaponSlot2Id, config.weaponSlot3Id, config.weaponSlot4Id],
        "player",
        claimSlot,
    );

    return {
        id: "debug_start_player",
        chassisId,

        drive: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.DRIVE,
            slotId: driveSlotId,
            driveId: driveDefinition.id,
        },

        defenseTurret: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.DEFENSE_TURRET,
            slotId: defenseTurretSlotId,
            defenseTurretId: defenseTurretDefinition.id,
        },

        powerCore: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.POWER_CORE,
            powerCoreId: config.powerCoreId,
        },

        shieldGenerator: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.SHIELD_GENERATOR,
            slotId: shieldGeneratorSlotId,
            shieldGeneratorId: shieldGeneratorDefinition.id,
        },

        weapons,
    };
}

function createDebugStartEnemyPreset(): ShipPreset {
    const config = DEBUG_START.enemy;
    const claimSlot = createSlotClaim(config.chassisId);

    const driveDefinition = SHIP_DRIVES[config.driveId];
    const driveSlotId = claimSlot(driveDefinition.slotKind);

    let defenseTurret: ShipPreset["defenseTurret"];

    if (config.defenseTurretId !== null) {
        const definition = DEFENSE_TURRETS[config.defenseTurretId];

        defenseTurret = {
            id: DEBUG_START_SYSTEM_ID.ENEMY.DEFENSE_TURRET,
            slotId: claimSlot(definition.slotKind),
            defenseTurretId: definition.id,
        };
    }

    let shieldGenerator: ShipPreset["shieldGenerator"];

    if (config.shieldGeneratorId !== null) {
        const definition = SHIELD_GENERATORS[config.shieldGeneratorId];

        shieldGenerator = {
            id: DEBUG_START_SYSTEM_ID.ENEMY.SHIELD_GENERATOR,
            slotId: claimSlot(definition.slotKind),
            shieldGeneratorId: definition.id,
        };
    }

    const weaponIds = [config.weaponSlot1Id, config.weaponSlot2Id, config.weaponSlot3Id, config.weaponSlot4Id].filter(
        (weaponId): weaponId is string => weaponId !== null,
    );

    const weapons = createDebugStartWeaponPresets(weaponIds, "enemy", claimSlot);

    return {
        id: "debug_start_enemy",
        chassisId: config.chassisId,

        drive: {
            id: DEBUG_START_SYSTEM_ID.ENEMY.DRIVE,
            slotId: driveSlotId,
            driveId: driveDefinition.id,
        },

        ...(defenseTurret ? { defenseTurret } : {}),

        ...(config.powerCoreId === null
            ? {}
            : {
                  powerCore: {
                      id: DEBUG_START_SYSTEM_ID.ENEMY.POWER_CORE,
                      powerCoreId: config.powerCoreId,
                  },
              }),

        ...(shieldGenerator ? { shieldGenerator } : {}),

        weapons,
    };
}

// Debug Start пока хранит только список железа, без spatial mount ids.
// До отдельного loadout editor раскладываем его детерминированно
// по первым свободным совместимым слотам chassis.
function createSlotClaim(chassisId: string): ClaimSlot {
    const chassis = SHIP_CHASSIS[chassisId];

    if (!chassis) {
        throw new Error("Debug Start references missing chassis: " + chassisId);
    }

    const occupiedSlotIds = new Set<string>();

    return (kind: ShipSlotKind): string => {
        const slot = chassis.slots.find((candidate) => {
            return candidate.kind === kind && !occupiedSlotIds.has(candidate.id);
        });

        if (!slot) {
            throw new Error("Debug Start chassis has no free " + kind + " slot: " + chassisId);
        }

        occupiedSlotIds.add(slot.id);

        return slot.id;
    };
}

function createDebugStartWeaponPresets(
    weaponIds: string[],
    side: DebugStartShipSide,
    claimSlot: ClaimSlot,
): ShipWeaponPreset[] {
    const occurrenceByKind: Partial<Record<ShipWeaponKind, number>> = {};

    return weaponIds.map((weaponId) => {
        const definition = SHIP_WEAPONS[weaponId];

        const occurrence = occurrenceByKind[definition.kind] ?? 0;

        occurrenceByKind[definition.kind] = occurrence + 1;

        const id = createWeaponRuntimeId(definition.kind, side, occurrence);
        const slotId = claimSlot(definition.slotKind);

        switch (definition.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            case SHIP_WEAPON_KIND.BEAM_CANNON:
            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return {
                    id,
                    slotId,
                    kind: definition.kind,
                    weaponId: definition.id,
                };

            default:
                return assertNever(definition);
        }
    });
}

function createWeaponRuntimeId(kind: ShipWeaponKind, side: DebugStartShipSide, occurrence: number): string {
    const suffix = String(occurrence).padStart(2, "0");

    if (side === "player") {
        return kind + "_player_" + suffix;
    }

    return kind + "_" + suffix;
}

function assertNever(value: never): never {
    throw new Error("Unhandled debug-start weapon definition: " + JSON.stringify(value));
}
