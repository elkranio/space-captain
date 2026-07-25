// tests/fixtures/engine/space_node_fixtures.ts
import { BEACON_OBJECT_SPRITE_ID } from '../../../src/engine/defs/beacon';
import { CHARACTER_PORTRAIT_ID } from '../../../src/engine/defs/character';
import { SPACE_BACKGROUND_ID } from '../../../src/engine/defs/space_background';
import { SPECIES_ID } from '../../../src/engine/defs/species';
import { STATION_OBJECT_SPRITE_ID } from '../../../src/engine/defs/station';
import type { Vec3 } from '../../../src/engine/defs/vector';
import {
    SPACE_OBJECT_KIND,
    type NavigationBeaconSpaceObjectState,
    type SpaceNodeState,
    type StationSpaceObjectState,
} from '../../../src/engine/defs/universe';

const TEST_STATION_ID = 'station_test';
const TEST_STATION_NAME = 'TEST STATION';

const TEST_BEACON_ID = 'beacon_test';
const TEST_BEACON_NAME = 'TEST BEACON';

const TEST_STATION_CONTACT_NAME = 'TEST OPERATOR';

export type SingleStationNodeFixture = {
    node: SpaceNodeState;
    stationId: string;
    stationName: string;
    stationContactName: string;
};

export type StationAndBeaconNodeFixture = {
    node: SpaceNodeState;

    stationId: string;
    stationName: string;
    stationContactName: string;

    beaconId: string;
    beaconName: string;
};

export function createSingleStationNodeFixture(): SingleStationNodeFixture {
    return {
        stationId: TEST_STATION_ID,
        stationName: TEST_STATION_NAME,
        stationContactName: TEST_STATION_CONTACT_NAME,

        node: {
            id: 'single_station_node',

            position: {
                x: 0,
                y: 0,
            },

            arrivalObjectId: TEST_STATION_ID,
            spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,

            objects: [
                createTestStationObject({
                    x: 0,
                    y: 0,
                    z: 0,
                }),
            ],
        },
    };
}

export function createStationAndBeaconNodeFixture(): StationAndBeaconNodeFixture {
    return {
        stationId: TEST_STATION_ID,
        stationName: TEST_STATION_NAME,
        stationContactName: TEST_STATION_CONTACT_NAME,

        beaconId: TEST_BEACON_ID,
        beaconName: TEST_BEACON_NAME,

        node: {
            id: 'station_and_beacon_node',

            position: {
                x: 0,
                y: 0,
            },

            arrivalObjectId: TEST_STATION_ID,
            spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,

            objects: [
                createTestStationObject({
                    x: 0,
                    y: 0,
                    z: 0,
                }),

                createTestBeaconObject({
                    x: 1000,
                    y: 0,
                    z: 0,
                }),
            ],
        },
    };
}

function createTestStationObject(localPosition: Vec3): StationSpaceObjectState {
    return {
        kind: SPACE_OBJECT_KIND.STATION,

        station: {
            id: TEST_STATION_ID,
            name: TEST_STATION_NAME,
            originSpecies: SPECIES_ID.HUMAN,
            objectSpriteId: STATION_OBJECT_SPRITE_ID.HUMAN_SMALL_00,

            contact: {
                name: TEST_STATION_CONTACT_NAME,
                portraitId: CHARACTER_PORTRAIT_ID.COMMS_HUMAN_00_CALM,
            },
        },

        localPosition: {
            ...localPosition,
        },
    };
}

function createTestBeaconObject(localPosition: Vec3): NavigationBeaconSpaceObjectState {
    return {
        kind: SPACE_OBJECT_KIND.NAVIGATION_BEACON,

        beacon: {
            id: TEST_BEACON_ID,
            name: TEST_BEACON_NAME,
            objectSpriteId: BEACON_OBJECT_SPRITE_ID.NAVIGATION_BEACON_00,
        },

        localPosition: {
            ...localPosition,
        },
    };
}
