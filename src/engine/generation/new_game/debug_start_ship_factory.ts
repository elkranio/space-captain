// src/engine/generation/new_game/debug_start_ship_factory.ts

import { DEBUG_START } from "../../content/catalogs/debug_start";
import { DEFENSE_TURRETS } from "../../content/catalogs/defense_turrets";
import { SHIELD_GENERATORS } from "../../content/catalogs/shield_generators";
import { SHIP_DRIVES } from "../../content/catalogs/ship_drives";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import type { ShipPreset, ShipWeaponPreset } from "../../content/presets/ships";
import type { PlayerShipState } from "../../defs/player";
import { SHIP_WEAPON_KIND, type ShipWeaponKind } from "../../defs/ship_weapon";
import ShipFactory, { type CreatedShipState } from "../ship/ShipFactory";

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

    const driveDefinition = SHIP_DRIVES[config.driveId];
    const defenseTurretDefinition = DEFENSE_TURRETS[config.defenseTurretId];
    const shieldGeneratorDefinition = SHIELD_GENERATORS[config.shieldGeneratorId];

    const weapons = createDebugStartWeaponPresets(
        [
            {
                weaponId: config.weaponSlot1Id,
                slotId: config.mounts.weaponSlot1,
            },
            {
                weaponId: config.weaponSlot2Id,
                slotId: config.mounts.weaponSlot2,
            },
            {
                weaponId: config.weaponSlot3Id,
                slotId: config.mounts.weaponSlot3,
            },
            {
                weaponId: config.weaponSlot4Id,
                slotId: config.mounts.weaponSlot4,
            },
        ],
        "player",
    );

    return {
        id: "debug_start_player",
        chassisId: config.chassisId,

        drive: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.DRIVE,
            slotId: config.mounts.drive,
            driveId: driveDefinition.id,
        },

        defenseTurret: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.DEFENSE_TURRET,
            slotId: config.mounts.defenseTurret,
            defenseTurretId: defenseTurretDefinition.id,
        },

        powerCore: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.POWER_CORE,
            powerCoreId: config.powerCoreId,
        },

        shieldGenerator: {
            id: DEBUG_START_SYSTEM_ID.PLAYER.SHIELD_GENERATOR,
            slotId: config.mounts.shieldGenerator,
            shieldGeneratorId: shieldGeneratorDefinition.id,
        },

        weapons,
    };
}

function createDebugStartEnemyPreset(): ShipPreset {
    const config = DEBUG_START.enemy;

    const driveDefinition = SHIP_DRIVES[config.driveId];

    let defenseTurret: ShipPreset["defenseTurret"];

    if (config.defenseTurretId !== null) {
        const definition = DEFENSE_TURRETS[config.defenseTurretId];

        defenseTurret = {
            id: DEBUG_START_SYSTEM_ID.ENEMY.DEFENSE_TURRET,
            slotId: config.mounts.defenseTurret,
            defenseTurretId: definition.id,
        };
    }

    let shieldGenerator: ShipPreset["shieldGenerator"];

    if (config.shieldGeneratorId !== null) {
        const definition = SHIELD_GENERATORS[config.shieldGeneratorId];

        shieldGenerator = {
            id: DEBUG_START_SYSTEM_ID.ENEMY.SHIELD_GENERATOR,
            slotId: config.mounts.shieldGenerator,
            shieldGeneratorId: definition.id,
        };
    }

    const weaponMounts = [
        {
            weaponId: config.weaponSlot1Id,
            slotId: config.mounts.weaponSlot1,
        },
        {
            weaponId: config.weaponSlot2Id,
            slotId: config.mounts.weaponSlot2,
        },
        {
            weaponId: config.weaponSlot3Id,
            slotId: config.mounts.weaponSlot3,
        },
        {
            weaponId: config.weaponSlot4Id,
            slotId: config.mounts.weaponSlot4,
        },
    ].filter(
        (mount): mount is DebugStartWeaponMount => mount.weaponId !== null,
    );

    const weapons = createDebugStartWeaponPresets(weaponMounts, "enemy");

    return {
        id: "debug_start_enemy",
        chassisId: config.chassisId,

        drive: {
            id: DEBUG_START_SYSTEM_ID.ENEMY.DRIVE,
            slotId: config.mounts.drive,
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

type DebugStartWeaponMount = {
    weaponId: string;
    slotId: string;
};

function createDebugStartWeaponPresets(
    mounts: DebugStartWeaponMount[],
    side: DebugStartShipSide,
): ShipWeaponPreset[] {
    const occurrenceByKind: Partial<Record<ShipWeaponKind, number>> = {};

    return mounts.map((mount) => {
        const definition = SHIP_WEAPONS[mount.weaponId];

        const occurrence = occurrenceByKind[definition.kind] ?? 0;

        occurrenceByKind[definition.kind] = occurrence + 1;

        const id = createWeaponRuntimeId(definition.kind, side, occurrence);

        switch (definition.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            case SHIP_WEAPON_KIND.BEAM_CANNON:
            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return {
                    id,
                    slotId: mount.slotId,
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
