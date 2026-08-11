// src/engine/encounter/combat/queries/get_enemy_ship_telemetry_snapshots.ts

import type {
    DefenseCapacitorState,
} from '../../../defs/defense_capacitor';
import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from '../../../defs/player_location';
import type {
    ShipDriveStatus,
} from '../../../defs/ship_drive';
import type {
    ShipWeaponKind,
    ShipWeaponPhase,
} from '../../../defs/ship_weapon';
import type {
    EncounterState,
} from '../../model/state';

export type EnemyShipWeaponTelemetrySnapshot = {
    id: string;

    kind: ShipWeaponKind;
    phase: ShipWeaponPhase;
};

export type EnemyShipTelemetrySnapshot = {
    actorId: string;

    hull: {
        current: number;
        max: number;
    };

    drive: {
        status: ShipDriveStatus;
    };

    defenseCapacitor?:
        DefenseCapacitorState;

    weapons: EnemyShipWeaponTelemetrySnapshot[];
};

// Возвращает telemetry только enemy ships,
// находящихся у текущего navigation anchor.
//
// Query не отдаёт mutable encounter objects наружу.
export function getEnemyShipTelemetrySnapshots(
    state: EncounterState,
): EnemyShipTelemetrySnapshot[] {
    const anchorId =
        getCurrentNavigationAnchorId(
            state.navigation,
        );

    return state.actors
        .filter((actor) => {
            return (
                actor.team ===
                    ENCOUNTER_TEAM.ENEMY &&
                actor.anchorId === anchorId
            );
        })
        .map((actor) => {
            return {
                actorId: actor.id,

                hull: {
                    current: actor.hull,
                    max: actor.maxHull,
                },

                drive: {
                    status: actor.drive.status,
                },

                ...(actor.defenseCapacitor
                    ? {
                          defenseCapacitor: {
                              ...actor.defenseCapacitor,
                          },
                      }
                    : {}),

                weapons: actor.weapons.map(
                    (weapon) => {
                        return {
                            id: weapon.id,

                            kind: weapon.kind,
                            phase: weapon.phase,
                        };
                    },
                ),
            };
        });
}

function getCurrentNavigationAnchorId(
    navigation: PlayerSpaceNavigationState,
): string {
    switch (navigation.kind) {
        case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
            return navigation.targetAnchorId;

        case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
            return navigation.anchorId;

        case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
            return navigation.targetAnchorId;

        default:
            return assertNever(navigation);
    }
}

function assertNever(value: never): never {
    throw new Error(
        `Unhandled player navigation: ${String(value)}`,
    );
}
