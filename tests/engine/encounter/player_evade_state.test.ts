import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_DRIVES,
} from '../../../src/engine/content/catalogs/ship_drives';
import {
    SHIP_DRIVE_STATUS,
    type ShipDriveStatus,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import EncounterSnapshotReader from '../../../src/engine/encounter/snapshots/EncounterSnapshotReader';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import {
    createEncounterState,
} from '../../../src/engine/encounter/state/create_encounter_state';
import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe(
    'Player Evade encounter state',
    () => {
        it(
            'starts ready and exposes a detached read snapshot',
            () => {
                const store =
                    createStore();

                const state =
                    store.getState();

                expect(
                    state.evade,
                ).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.READY,

                    phaseElapsedMs:
                        0,

                    cooldownRemainingMs:
                        0,
                });

                const reader =
                    new EncounterSnapshotReader(
                        state,
                    );

                const snapshot =
                    reader.getEvadeState();

                expect(snapshot).toEqual(
                    state.evade,
                );

                expect(snapshot).not.toBe(
                    state.evade,
                );

                snapshot.phaseElapsedMs =
                    123;

                expect(
                    state.evade
                        .phaseElapsedMs,
                ).toBe(0);
            },
        );

        it(
            'uses installed drive tuning for the shared lifecycle',
            () => {
                const store =
                    createStore();

                const definition =
                    SHIP_DRIVES[
                        store
                            .getState()
                            .drive
                            .driveId
                    ];

                store.startPlayerEvade();

                expect(
                    store.getState()
                        .evade,
                ).toMatchObject({
                    cooldownRemainingMs:
                        definition
                            .evadeCooldownMs,
                });

                store.advancePlayerEvade(
                    definition
                        .evadeWarmupMs,
                );

                expect(
                    store.getState()
                        .evade
                        .phase,
                ).toBe(
                    SHIP_EVADE_PHASE
                        .EVADING,
                );

                expect(
                    store.getState()
                        .evade
                        .cooldownRemainingMs,
                ).toBe(
                    Math.max(
                        0,
                        definition
                            .evadeCooldownMs -
                            definition
                                .evadeWarmupMs,
                    ),
                );

                expect(
                    store.stopPlayerEvade(),
                ).toBe(true);

                const evade =
                    store.getState()
                        .evade;

                expect(
                    evade.phase,
                ).toBe(
                    evade.cooldownRemainingMs >
                        0
                        ? SHIP_EVADE_PHASE
                              .COOLDOWN
                        : SHIP_EVADE_PHASE
                              .READY,
                );
            },
        );

        it(
            'rejects starting Evade while the drive is disabled',
            () => {
                const store =
                    createStore(
                        SHIP_DRIVE_STATUS
                            .DISABLED,
                    );

                expect(() => {
                    store.startPlayerEvade();
                }).toThrow(
                    'Cannot start player Evade with drive status: disabled',
                );
            },
        );
    },
);

function createStore(
    driveStatus: ShipDriveStatus =
        SHIP_DRIVE_STATUS.ONLINE,
): EncounterStateStore {
    const {
        node,
        stationId,
    } =
        createSingleStationNodeFixture();

    return new EncounterStateStore(
        createEncounterState({
            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    stationId,
            },

            playerHull:
                createPlayerHullFixture(),

            drive:
                createShipDriveFixture(
                    driveStatus,
                ),
        }),
    );
}
