// src/engine/encounter/state/create_encounter_state.ts

import { DEFENSE_TURRETS } from "../../content/catalogs/defense_turrets";
import { POWER_CORES } from "../../content/catalogs/power_cores";
import { SHIELD_GENERATORS } from "../../content/catalogs/shield_generators";
import { SHIP_DRIVES } from "../../content/catalogs/ship_drives";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import type { PlayerHullState, PlayerShipState } from "../../defs/player";
import type { PlayerSpaceNavigationState } from "../../defs/player_location";
import { createReadyShipEvadeState } from "../../defs/ship_evade";
import { SHIELD_GENERATOR_STATUS } from "../../defs/shield_generator";
import { SPACE_ANCHOR_KIND, type SpaceAnchorState, type SpaceNodeState } from "../../defs/universe";
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorState } from "../anchors/encounter_anchor";
import { resolveMountedPowerCore } from "../combat/power_core/resolve_mounted_power_core";
import { createEncounterEquipmentState } from "../model/equipment";
import type { EncounterState } from "../model/state";

export type CreateEncounterStateInput = {
    node: SpaceNodeState;
    navigation: PlayerSpaceNavigationState;
    playerShip: PlayerShipState;
};

export function createEncounterState({
    node,
    navigation,
    playerShip,
}: CreateEncounterStateInput): EncounterState {
    validatePlayerHull(playerShip);

    const mountedPowerCore = resolveMountedPowerCore(playerShip.mounts, playerShip.powerCore);

    return {
        spaceBackgroundId: node.spaceBackgroundId,

        playerHull: {
            hull: playerShip.hull,
            maxHull: playerShip.maxHull,
        },

        playerMounts: playerShip.mounts.map((mount) => ({ ...mount })),

        // Encounter получает собственный runtime snapshot.
        // Persistent player state обновляется отдельно.
        navigation: {
            ...navigation,
        },

        drive: createEncounterEquipmentState(
            playerShip.drive,
            SHIP_DRIVES[playerShip.drive.driveId].maxIntegrity,
        ),

        evade: createReadyShipEvadeState(),

        officerTasks: {},

        anchors: node.anchors.map((anchor) => {
            return createEncounterAnchorState(anchor);
        }),

        // Persistent node actors гидрируются через
        // EncounterStateStore.fromSpaceNode(),
        // чтобы initial и dynamic actors использовали
        // один validated spawn path.
        actors: [],

        combat: {
            defenseTurret: createEncounterEquipmentState(
                playerShip.defenseTurret,
                DEFENSE_TURRETS[playerShip.defenseTurret.defenseTurretId].maxIntegrity,
            ),

            ...(mountedPowerCore
                ? {
                      powerCore: createEncounterEquipmentState(
                          mountedPowerCore,
                          POWER_CORES[mountedPowerCore.powerCoreId].maxIntegrity,
                      ),
                  }
                : {}),

            shieldGenerator: createEncounterEquipmentState(
                playerShip.shieldGenerator,
                SHIELD_GENERATORS[playerShip.shieldGenerator.shieldGeneratorId].maxIntegrity,
                playerShip.shieldGenerator.status !== SHIELD_GENERATOR_STATUS.BROKEN,
            ),

            activeShield: null,

            playerWeapons: playerShip.weapons.map((weapon) => {
                return createEncounterEquipmentState(
                    weapon,
                    SHIP_WEAPONS[weapon.weaponId].maxIntegrity,
                );
            }),

            projectiles: [],
            beamCannonAttacks: [],
            stickyMines: [],
        },
    };
}

function validatePlayerHull(playerHull: PlayerHullState): void {
    if (!Number.isFinite(playerHull.maxHull) || playerHull.maxHull <= 0) {
        throw new Error("Player max hull must be positive: " + String(playerHull.maxHull));
    }

    if (!Number.isFinite(playerHull.hull) || playerHull.hull < 0 || playerHull.hull > playerHull.maxHull) {
        throw new Error("Player hull must be in [0, maxHull]: " + playerHull.hull + "/" + playerHull.maxHull);
    }
}

function createEncounterAnchorState(anchor: SpaceAnchorState): EncounterAnchorState {
    switch (anchor.kind) {
        case SPACE_ANCHOR_KIND.STATION:
            return {
                id: anchor.station.id,

                kind: ENCOUNTER_ANCHOR_KIND.STATION,

                displayName: anchor.station.name,

                station: {
                    ...anchor.station,

                    contact: {
                        ...anchor.station.contact,
                    },
                },

                localPosition: {
                    ...anchor.localPosition,
                },

                position: {
                    x: -0.52,
                    y: -0.05,
                },

                perspectiveDepth: 1,
            };

        case SPACE_ANCHOR_KIND.NAVIGATION_BEACON:
            return {
                id: anchor.beacon.id,

                kind: ENCOUNTER_ANCHOR_KIND.NAVIGATION_BEACON,

                displayName: anchor.beacon.name,

                beacon: {
                    ...anchor.beacon,
                },

                localPosition: {
                    ...anchor.localPosition,
                },

                position: {
                    x: -0.52,
                    y: -0.05,
                },

                perspectiveDepth: 1,
            };

        case SPACE_ANCHOR_KIND.ASTEROID:
            return {
                id: anchor.asteroid.id,

                kind: ENCOUNTER_ANCHOR_KIND.ASTEROID,

                displayName: anchor.asteroid.name,

                asteroid: {
                    ...anchor.asteroid,
                },

                localPosition: {
                    ...anchor.localPosition,
                },

                // Временная постановочная позиция.
                position: {
                    x: 0.42,
                    y: 0.12,
                },

                perspectiveDepth: 1,
            };

        case SPACE_ANCHOR_KIND.JUMP_POINT:
            return {
                id: anchor.jumpPoint.id,

                kind: ENCOUNTER_ANCHOR_KIND.JUMP_POINT,

                displayName: anchor.jumpPoint.name,

                jumpPoint: {
                    ...anchor.jumpPoint,
                },

                localPosition: {
                    ...anchor.localPosition,
                },

                position: {
                    x: 0,
                    y: 0,
                },

                perspectiveDepth: 1,
            };

        default:
            return assertNever(anchor);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unhandled space anchor: ${String(value)}`);
}
