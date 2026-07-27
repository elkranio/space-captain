// src/engine/encounter/state/create_encounter_state.ts

import type { PlayerSpaceNavigationState } from '../../defs/player_location';
import { SPACE_ANCHOR_KIND, type SpaceNodeState, type SpaceAnchorState } from '../../defs/universe';
import type { EncounterState } from '../model/state';
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorState } from '../anchors/encounter_anchor';
import { DOCKING_CLEARANCE_STATE } from '../anchors/station/station_encounter_anchor';

export function createEncounterState(node: SpaceNodeState, navigation: PlayerSpaceNavigationState): EncounterState {
    return {
        spaceBackgroundId: node.spaceBackgroundId,

        // Encounter получает собственный runtime snapshot.
        // Persistent player state обновляется отдельно.
        navigation: {
            ...navigation,
        },

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
            projectiles: [],
        },
    };
}

function createEncounterAnchorState(anchor: SpaceAnchorState): EncounterAnchorState {
    switch (anchor.kind) {
        case SPACE_ANCHOR_KIND.STATION:
            return {
                id: anchor.station.id,
                kind: ENCOUNTER_ANCHOR_KIND.STATION,
                displayName: anchor.station.name,
                station: anchor.station,

                localPosition: {
                    ...anchor.localPosition,
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

        case SPACE_ANCHOR_KIND.NAVIGATION_BEACON:
            return {
                id: anchor.beacon.id,
                kind: ENCOUNTER_ANCHOR_KIND.NAVIGATION_BEACON,
                displayName: anchor.beacon.name,
                beacon: anchor.beacon,

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
                asteroid: anchor.asteroid,

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
                jumpPoint: anchor.jumpPoint,

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
