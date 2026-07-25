// tests/fixtures/engine/space_node_fixtures.ts
import { CHARACTER_PORTRAIT_ID } from '../../../src/engine/defs/character';
import { SPACE_BACKGROUND_ID } from '../../../src/engine/defs/space_background';
import { SPECIES_ID } from '../../../src/engine/defs/species';
import { STATION_OBJECT_SPRITE_ID } from '../../../src/engine/defs/station';
import { SPACE_OBJECT_KIND, type SpaceNodeState } from '../../../src/engine/defs/universe';

export type SingleStationNodeFixture = {
    node: SpaceNodeState;
    stationId: string;
    stationName: string;
};

export function createSingleStationNodeFixture(): SingleStationNodeFixture {
    const stationId = 'station_test';
    const stationName = 'TEST STATION';

    return {
        stationId,
        stationName,

        node: {
            id: 'single_station_node',

            position: {
                x: 0,
                y: 0,
            },

            arrivalObjectId: stationId,
            spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,

            objects: [
                {
                    kind: SPACE_OBJECT_KIND.STATION,

                    station: {
                        id: stationId,
                        name: stationName,
                        originSpecies: SPECIES_ID.HUMAN,
                        objectSpriteId: STATION_OBJECT_SPRITE_ID.HUMAN_SMALL_00,

                        contact: {
                            name: 'TEST OPERATOR',
                            portraitId: CHARACTER_PORTRAIT_ID.COMMS_HUMAN_00_CALM,
                        },
                    },

                    localPosition: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                },
            ],
        },
    };
}
