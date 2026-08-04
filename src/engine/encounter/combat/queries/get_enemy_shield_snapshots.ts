// src/engine/encounter/combat/queries/get_enemy_shield_snapshots.ts

import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import type {
    LaserTargetZone,
} from '../../../defs/laser';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from '../../../defs/player_location';
import type {
    EncounterState,
} from '../../model/state';

export type EnemyShieldSnapshot = {
    actorId: string;

    zone: LaserTargetZone;

    elapsedMs: number;
    durationMs: number;
};

// Production presentation snapshot for active enemy directional fields.
//
// Only alive enemy actors at the current navigation anchor are exposed.
// The returned value is detached by EncounterSnapshotReader.
export function getEnemyShieldSnapshots(
    state: EncounterState,
): EnemyShieldSnapshot[] {
    const anchorId =
        getCurrentNavigationAnchorId(
            state.navigation,
        );

    return state.actors
        .filter((actor) => {
            return (
                actor.team ===
                    ENCOUNTER_TEAM.ENEMY &&
                actor.anchorId ===
                    anchorId &&
                actor.hull > 0 &&
                actor.activeShield !==
                    undefined
            );
        })
        .map((actor) => {
            const shield =
                actor.activeShield;

            if (!shield) {
                throw new Error(
                    'Filtered enemy shield disappeared: ' +
                        actor.id,
                );
            }

            return {
                actorId:
                    actor.id,

                zone:
                    shield.zone,

                elapsedMs:
                    shield.elapsedMs,

                durationMs:
                    shield.durationMs,
            };
        });
}

function getCurrentNavigationAnchorId(
    navigation:
        PlayerSpaceNavigationState,
): string {
    switch (navigation.kind) {
        case PLAYER_SPACE_NAVIGATION_KIND
            .ARRIVING:
            return navigation
                .targetAnchorId;

        case PLAYER_SPACE_NAVIGATION_KIND
            .ANCHORED:
            return navigation.anchorId;

        case PLAYER_SPACE_NAVIGATION_KIND
            .TRAVELLING:
            return navigation
                .targetAnchorId;

        default:
            return assertNever(
                navigation,
            );
    }
}

function assertNever(
    value: never,
): never {
    throw new Error(
        'Unhandled player navigation: ' +
            String(value),
    );
}
