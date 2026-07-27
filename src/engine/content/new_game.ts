// src/engine/content/new_game.ts
import { OFFICER_PORTRAIT_ID, OFFICER_ROLE } from '../defs/officer';
import { PLAYER_LOCATION_KIND, PLAYER_SPACE_NAVIGATION_KIND } from '../defs/player_location';
import type { RunState } from '../defs/run';
import { SPACE_BACKGROUND_ID } from '../defs/space_background';
import { SPECIES_ID } from '../defs/species';
import StationGenerator from '../generation/station/StationGenerator';
import { BEACON_OBJECT_SPRITE_ID } from '../defs/beacon';
import { ASTEROID_OBJECT_SPRITE_ID } from '../defs/asteroid';
import { SHIP_ID } from '../defs/ship';
import { SPACE_ANCHOR_KIND, SPACE_NODE_ACTOR_KIND } from '../defs/universe';
import { MISSILE_ID } from '../defs/missile';
import { ENCOUNTER_TEAM } from '../defs/encounter_team';
import { SHIP_WEAPON_PHASE, SHIP_WEAPON_ID } from '../defs/ship_weapon';
import type { PlayerShipState } from '../defs/player';
import { SHIP_WEAPONS } from './ship_weapons';

export function createNewRunState(): RunState {
    const playerShip: PlayerShipState = {
        hull: 3,
        maxHull: 3,
        weapons: [],
    };

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

    const enemyMissileLauncher = SHIP_WEAPONS[SHIP_WEAPON_ID.HEAT_MISSILE_LAUNCHER_00];

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
                    actors: [
                        {
                            id: 'ship_generic_00',
                            kind: SPACE_NODE_ACTOR_KIND.SHIP,

                            team: ENCOUNTER_TEAM.ENEMY,

                            shipId: SHIP_ID.GENERIC_00,
                            anchorId: navigationBeacon.id,

                            weapons: [
                                {
                                    id: 'missile_launcher_00',

                                    weaponId: enemyMissileLauncher.id,
                                    kind: enemyMissileLauncher.kind,

                                    loadedMissileId: MISSILE_ID.HEAT_00,

                                    ammoCount: enemyMissileLauncher.ammoCapacity,

                                    phase: SHIP_WEAPON_PHASE.READY,
                                    phaseElapsedMs: 0,
                                },
                            ],
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
                    actors: [],
                },
            ],
        },

        // player: {
        //  ship: playerShip,

        //     location: {
        //         kind: PLAYER_LOCATION_KIND.SPACE,
        //         nodeId: 'node_start',

        //         navigation: {
        //             kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,
        //             targetAnchorId: navigationBeacon.id,
        //             fromAnchorId: asteroid.id,
        //         },
        //     },
        // },

        player: {
            ship: playerShip,

            location: {
                kind: PLAYER_LOCATION_KIND.SPACE,
                nodeId: 'node_start',

                navigation: {
                    kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,
                    targetAnchorId: navigationBeacon.id,
                },
            },
        },

        // player: {
        //  ship: playerShip,

        //     location: {
        //         kind: PLAYER_LOCATION_KIND.SPACE,
        //         nodeId: 'node_station',

        //         navigation: {
        //             kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,
        //             targetAnchorId: station.id,
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
