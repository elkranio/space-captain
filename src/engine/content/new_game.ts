// src/engine/content/new_game.ts
import { OFFICER_PORTRAIT_ID, OFFICER_ROLE } from '../defs/officer';
import { PLAYER_LOCATION_KIND } from '../defs/player_location';
import type { RunState } from '../defs/run';
import { SPACE_BACKGROUND_ID } from '../defs/space_background';
import { SPECIES_ID } from '../defs/species';
import { SPACE_OBJECT_KIND } from '../defs/universe';
import StationGenerator from '../generation/station/StationGenerator';

export function createNewRunState(): RunState {
    const station = StationGenerator.generateStation(SPECIES_ID.HUMAN);

    return {
        universe: {
            nodes: [
                {
                    id: 'node_start',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,
                    objects: [],
                },
                {
                    id: 'node_station',
                    position: {
                        x: 100,
                        y: 0,
                    },
                    spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,
                    objects: [
                        {
                            kind: SPACE_OBJECT_KIND.STATION,
                            station,
                        },
                    ],
                },
            ],
        },

        player: {
            location: {
                kind: PLAYER_LOCATION_KIND.SPACE,
                nodeId: 'node_start',
            },
        },

        officers: {
            [OFFICER_ROLE.COMMS]: {
                role: OFFICER_ROLE.COMMS,
                name: 'Pip Voxley',
                portraitId: OFFICER_PORTRAIT_ID.COMMS_HUMAN_00,
            },

            [OFFICER_ROLE.SCIENCE]: {
                role: OFFICER_ROLE.SCIENCE,
                name: 'Dr. Zella Quark',
                portraitId: OFFICER_PORTRAIT_ID.SCIENCE_ALIEN_00,
            },

            [OFFICER_ROLE.HELM]: {
                role: OFFICER_ROLE.HELM,
                name: 'Dash Nulligan',
                portraitId: OFFICER_PORTRAIT_ID.HELM_HUMAN_00,
            },

            [OFFICER_ROLE.WEAPONS]: {
                role: OFFICER_ROLE.WEAPONS,
                name: 'Buck Varnish',
                portraitId: OFFICER_PORTRAIT_ID.WEAPONS_ALIEN_00,
            },

            [OFFICER_ROLE.ENGINEER]: {
                role: OFFICER_ROLE.ENGINEER,
                name: 'Mira Wrenchly',
                portraitId: OFFICER_PORTRAIT_ID.ENGINEER_HUMAN_00,
            },
        },
    };
}
