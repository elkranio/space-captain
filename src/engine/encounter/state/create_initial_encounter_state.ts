// src/engine/encounter/state/create_initial_encounter_state.ts

import { OFFICER_ROLE } from '../../defs/officer';
import { SPACE_BACKGROUND_ID } from '../../defs/space_background';
import { SPECIES_ID } from '../../defs/species';
import StationGenerator from '../../generation/station/StationGenerator';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../model/command';
import type { EncounterState } from '../model/state';
import { ENCOUNTER_OBJECT_KIND } from '../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../objects/station/station_encounter_object';

export function createInitialEncounterState(): EncounterState {
    const station = StationGenerator.generateStation(SPECIES_ID.HUMAN);

    return {
        spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,
        objects: [
            {
                id: station.id,
                kind: ENCOUNTER_OBJECT_KIND.STATION,
                displayName: station.name,
                station,
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
            },
        ],
    };
}
