// src/engine/encounter/state/create_encounter_state_from_space_node.ts
import { OFFICER_ROLE } from '../../defs/officer';
import { SPACE_OBJECT_KIND, type SpaceNodeState, type SpaceObjectState } from '../../defs/universe';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../model/command';
import type { EncounterState } from '../model/state';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from '../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../objects/station/station_encounter_object';

export function createEncounterStateFromSpaceNode(node: SpaceNodeState): EncounterState {
    return {
        spaceBackgroundId: node.spaceBackgroundId,
        arrivalObjectId: node.arrivalObjectId,
        officerTasks: {},
        objects: node.objects.map(createEncounterObjectState),
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

                position: {
                    x: -0.52,
                    y: -0.05,
                },

                docking: {
                    clearance: DOCKING_CLEARANCE_STATE.NONE,
                },

                officerCommands: [
                    {
                        role: OFFICER_ROLE.COMMS,
                        commandId: ENCOUNTER_OFFICER_COMMAND_ID.HAIL,
                    },
                    {
                        role: OFFICER_ROLE.COMMS,
                        commandId: ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING,
                    },
                    {
                        role: OFFICER_ROLE.HELM,
                        commandId: ENCOUNTER_OFFICER_COMMAND_ID.DOCK,
                    },
                ],
            };

        case SPACE_OBJECT_KIND.NAVIGATION_BEACON:
            return {
                id: object.beacon.id,
                kind: ENCOUNTER_OBJECT_KIND.NAVIGATION_BEACON,
                displayName: object.beacon.name,
                beacon: object.beacon,

                position: {
                    x: -0.52,
                    y: -0.05,
                },

                officerCommands: [],
            };

        case SPACE_OBJECT_KIND.ASTEROID:
            return {
                id: object.asteroid.id,
                kind: ENCOUNTER_OBJECT_KIND.ASTEROID,
                displayName: object.asteroid.name,
                asteroid: object.asteroid,

                // Временная постановочная позиция.
                position: {
                    x: 0.42,
                    y: 0.12,
                },

                officerCommands: [],
            };

        default:
            return assertNever(object);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unhandled space object: ${String(value)}`);
}
