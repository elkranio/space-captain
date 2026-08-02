// tests/engine/encounter/player_hull_state.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    createEncounterState,
} from '../../../src/engine/encounter/state/create_encounter_state';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe(
    'Player hull encounter state',
    () => {
        it(
            'owns a copied hull snapshot and reports one destruction transition',
            () => {
                const {
                    node,
                    stationId,
                } =
                    createSingleStationNodeFixture();

                const playerHull =
                    createPlayerHullFixture();

                const state =
                    createEncounterState({
                        node,

                        navigation: {
                            kind:
                                PLAYER_SPACE_NAVIGATION_KIND
                                    .ANCHORED,

                            anchorId:
                                stationId,
                        },

                        playerHull,

                        drive:
                            createShipDriveFixture(),

                        pointDefense:
                            createPointDefenseFixture(),
                    });

                expect(
                    state.playerHull,
                ).not.toBe(
                    playerHull,
                );

                const store =
                    new EncounterStateStore(
                        state,
                    );

                expect(
                    store.damagePlayerHull(
                        1,
                    ),
                ).toEqual({
                    appliedDamage: 1,
                    remainingHull: 2,
                    destroyed: false,
                });

                expect(
                    store.damagePlayerHull(
                        10,
                    ),
                ).toEqual({
                    appliedDamage: 2,
                    remainingHull: 0,
                    destroyed: true,
                });

                expect(
                    store.damagePlayerHull(
                        1,
                    ),
                ).toEqual({
                    appliedDamage: 0,
                    remainingHull: 0,
                    destroyed: false,
                });
            },
        );
    },
);
