// src/engine/content/new_game.ts
import { OFFICER_PORTRAIT_ID, OFFICER_ROLE } from '../defs/officer';
import { PLAYER_LOCATION_KIND, PLAYER_SPACE_NAVIGATION_KIND } from '../defs/player_location';
import type { RunState } from '../defs/run';
import { SPACE_BACKGROUND_ID } from '../defs/space_background';
import { SPECIES_ID } from '../defs/species';
import { SPACE_ANCHOR_KIND } from '../defs/universe';
import StationGenerator from '../generation/station/StationGenerator';
import { BEACON_OBJECT_SPRITE_ID } from '../defs/beacon';
import { ASTEROID_OBJECT_SPRITE_ID } from '../defs/asteroid';

export function createNewRunState(): RunState {
    const station = StationGenerator.generateStation(SPECIES_ID.HUMAN);
    const navigationBeacon = {
        id: 'beacon_start',
        name: 'NAVIGATION BEACON',
        objectSpriteId: BEACON_OBJECT_SPRITE_ID.NAVIGATION_BEACON_00,
    };
    const asteroid = {
        id: 'asteroid_start',
        name: 'ASTEROID',
        objectSpriteId: ASTEROID_OBJECT_SPRITE_ID.ASTEROID_00,
    };

    return {
        universe: {
            nodes: [
                {
                    id: 'node_start',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    arrivalAnchorId: navigationBeacon.id,
                    spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,
                    anchors: [
                        {
                            kind: SPACE_ANCHOR_KIND.NAVIGATION_BEACON,
                            beacon: navigationBeacon,
                            localPosition: {
                                x: 0,
                                y: 0,
                                z: 0,
                            },
                        },
                        {
                            kind: SPACE_ANCHOR_KIND.ASTEROID,
                            asteroid,
                            localPosition: {
                                x: 900,
                                y: 220,
                                z: 1400,
                            },
                        },
                        {
                            kind: SPACE_ANCHOR_KIND.STATION,
                            station,
                            localPosition: {
                                x: -900,
                                y: 220,
                                z: -1400,
                            },
                        },
                    ],
                },
                {
                    id: 'node_station',
                    position: {
                        x: 100,
                        y: 0,
                    },
                    arrivalAnchorId: station.id,
                    spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,
                    anchors: [
                        {
                            kind: SPACE_ANCHOR_KIND.STATION,
                            station,
                            localPosition: {
                                x: 0,
                                y: 0,
                                z: 0,
                            },
                        },
                    ],
                },
            ],
        },

        // player: {
        //     location: {
        //         kind: PLAYER_LOCATION_KIND.SPACE,
        //         nodeId: 'node_start',

        //         navigation: {
        //             kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,
        //             targetObjectId: navigationBeacon.id,
        //             fromObjectId: asteroid.id,
        //         },
        //     },
        // },

        player: {
            location: {
                kind: PLAYER_LOCATION_KIND.SPACE,
                nodeId: 'node_start',

                navigation: {
                    kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,
                    targetObjectId: navigationBeacon.id,
                },
            },
        },

        // player: {
        //     location: {
        //         kind: PLAYER_LOCATION_KIND.SPACE,
        //         nodeId: 'node_station',

        //         navigation: {
        //             kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,
        //             targetObjectId: station.id,
        //         },
        //     },
        // },

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
