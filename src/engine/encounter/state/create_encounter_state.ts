// src/engine/encounter/state/create_encounter_state.ts

import type { PlayerSpaceNavigationState } from '../../defs/player_location';
import { SPACE_OBJECT_KIND, type SpaceNodeState, type SpaceObjectState } from '../../defs/universe';
import type { EncounterState } from '../model/state';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from '../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../objects/station/station_encounter_object';

export function createEncounterState(node: SpaceNodeState, navigation: PlayerSpaceNavigationState): EncounterState {
    return {
        spaceBackgroundId: node.spaceBackgroundId,

        // Encounter получает собственный runtime snapshot.
        // Persistent player state обновляется отдельно.
        navigation: {
            ...navigation,
        },

        officerTasks: {},

        anchors: node.objects.map((object) => {
            return createEncounterObjectState(object);
        }),
    };
}

function createEncounterObjectState(object: SpaceObjectState): EncounterObjectState {
    switch (object.kind) {
        case SPACE_OBJECT_KIND.STATION:
            return {
                id: object.station.id,
                kind: ENCOUNTER_OBJECT_KIND.STATION,
                displayName: object.station.name,
                station: object.station,

                anchorObjectId: object.station.id,

                localPosition: {
                    ...object.localPosition,
                },

                position: {
                    x: -0.52,
                    y: -0.05,
                },

                perspectiveDepth: 1,

                docking: {
                    clearance: DOCKING_CLEARANCE_STATE.NONE,
                },
            };

        case SPACE_OBJECT_KIND.NAVIGATION_BEACON:
            return {
                id: object.beacon.id,
                kind: ENCOUNTER_OBJECT_KIND.NAVIGATION_BEACON,
                displayName: object.beacon.name,
                beacon: object.beacon,

                anchorObjectId: object.beacon.id,

                localPosition: {
                    ...object.localPosition,
                },

                position: {
                    x: -0.52,
                    y: -0.05,
                },

                perspectiveDepth: 1,
            };

        case SPACE_OBJECT_KIND.ASTEROID:
            return {
                id: object.asteroid.id,
                kind: ENCOUNTER_OBJECT_KIND.ASTEROID,
                displayName: object.asteroid.name,
                asteroid: object.asteroid,

                anchorObjectId: object.asteroid.id,

                localPosition: {
                    ...object.localPosition,
                },

                // Временная постановочная позиция.
                position: {
                    x: 0.42,
                    y: 0.12,
                },

                perspectiveDepth: 1,
            };

        case SPACE_OBJECT_KIND.JUMP_POINT:
            return {
                id: object.jumpPoint.id,
                kind: ENCOUNTER_OBJECT_KIND.JUMP_POINT,
                displayName: object.jumpPoint.name,
                jumpPoint: object.jumpPoint,

                anchorObjectId: object.jumpPoint.id,

                localPosition: {
                    ...object.localPosition,
                },

                position: {
                    x: 0,
                    y: 0,
                },

                perspectiveDepth: 1,
            };

        default:
            return assertNever(object);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unhandled space object: ${String(value)}`);
}
