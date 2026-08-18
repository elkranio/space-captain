// src/engine/content/new_game/NewGameUniverseFactory.ts

import { ASTEROID_OBJECT_SPRITE_ID, type AsteroidState } from "../../defs/asteroid";
import { BEACON_OBJECT_SPRITE_ID, type NavigationBeaconState } from "../../defs/beacon";
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceLocationState,
} from "../../defs/player_location";
import { SPACE_BACKGROUND_ID } from "../../defs/space_background";
import { SPECIES_ID } from "../../defs/species";
import { SPACE_ANCHOR_KIND, type SpaceNodeState, type UniverseState } from "../../defs/universe";
import { SHIP_NODE_ACTOR_PRESET_ID } from "../presets/ship_node_actors";
import ShipNodeActorFactory from "../../generation/space_node_actor/ShipNodeActorFactory";
import StationGenerator from "../../generation/station/StationGenerator";
import { createDebugStartEnemyShip } from "./debug_start_ship_factory";

export type NewGamePlayerLocations = {
    arrivingAtStart: PlayerSpaceLocationState;
    travellingToStart: PlayerSpaceLocationState;
    arrivingAtStation: PlayerSpaceLocationState;
};

export type NewGameUniverseGeneration = {
    universe: UniverseState;
    playerLocations: NewGamePlayerLocations;
};

const NEW_GAME_ID = {
    START_NODE: "node_start",
    STATION_NODE: "node_station",

    NAVIGATION_BEACON: "beacon_start",
    ASTEROID: "asteroid_start",

    ENEMY_SHIP: "ship_generic_00",
} as const;

// Собирает согласованную стартовую вселенную.
//
// Владеет связями между:
// - нодами;
// - anchors;
// - persistent actors;
// - arrival ids;
// - dev-вариантами начальной позиции игрока.
export default class NewGameUniverseFactory {
    public static create(): NewGameUniverseGeneration {
        const station = StationGenerator.generateStation(SPECIES_ID.HUMAN);

        const navigationBeacon: NavigationBeaconState = {
            id: NEW_GAME_ID.NAVIGATION_BEACON,

            name: "NAVIGATION BEACON",

            objectSpriteId: BEACON_OBJECT_SPRITE_ID.NAVIGATION_BEACON_00,
        };

        const asteroid: AsteroidState = {
            id: NEW_GAME_ID.ASTEROID,

            name: "ASTEROID",

            objectSpriteId: ASTEROID_OBJECT_SPRITE_ID.ASTEROID_00,
        };

        const enemyShip = ShipNodeActorFactory.create({
            id: NEW_GAME_ID.ENEMY_SHIP,

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_DEFENSE_SANDBOX_00,

            anchorId: navigationBeacon.id,

            ship: createDebugStartEnemyShip(),
        });

        const startNode: SpaceNodeState = {
            id: NEW_GAME_ID.START_NODE,

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

            actors: [enemyShip],
        };

        const stationNode: SpaceNodeState = {
            id: NEW_GAME_ID.STATION_NODE,

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
        };

        return {
            universe: {
                nodes: [startNode, stationNode],
            },

            playerLocations: {
                arrivingAtStart: {
                    kind: PLAYER_LOCATION_KIND.SPACE,

                    nodeId: startNode.id,

                    navigation: {
                        kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,

                        targetAnchorId: navigationBeacon.id,
                    },
                },

                travellingToStart: {
                    kind: PLAYER_LOCATION_KIND.SPACE,

                    nodeId: startNode.id,

                    navigation: {
                        kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,

                        fromAnchorId: asteroid.id,

                        targetAnchorId: navigationBeacon.id,
                    },
                },

                arrivingAtStation: {
                    kind: PLAYER_LOCATION_KIND.SPACE,

                    nodeId: stationNode.id,

                    navigation: {
                        kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,

                        targetAnchorId: station.id,
                    },
                },
            },
        };
    }
}
