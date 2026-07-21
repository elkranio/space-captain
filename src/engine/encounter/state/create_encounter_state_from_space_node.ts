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

                // Временная позиция на viewscreen.
                // Позже будет вычисляться из локальной навигации внутри ноды.
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

        default:
            return assertNever(object.kind);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unhandled space object: ${String(value)}`);
}
