import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_DRIVES,
} from '../../../src/engine/content/catalogs/ship_drives';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

describe(
    'player Evade missile resolution',
    () => {
        it(
            'removes an incoming missile at impact without hull damage or hit event while EVADING',
            () => {
                const engine =
                    createEngine();

                engine.drainEvents();

                const result =
                    engine.executeCommand({
                        role:
                            OFFICER_ROLE.PILOT,

                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .PILOT_EVADE,

                        target: {
                            kind:
                                OFFICER_COMMAND_TARGET_KIND
                                    .NONE,
                        },
                    });

                expect(
                    result.status,
                ).toBe(
                    OFFICER_COMMAND_EXECUTION_STATUS
                        .EXECUTED,
                );

                engine.drainEvents();

                const driveDefinition =
                    SHIP_DRIVES[
                        engine
                            .getDriveState()
                            .driveId
                    ];

                if (
                    driveDefinition
                        .evadeWarmupMs >
                    0
                ) {
                    engine.step(
                        driveDefinition
                            .evadeWarmupMs,
                    );

                    engine.drainEvents();
                }

                expect(
                    engine
                        .getEvadeState()
                        .phase,
                ).toBe(
                    SHIP_EVADE_PHASE
                        .EVADING,
                );

                const state =
                    getMutableEncounterStateForTest(
                        engine,
                    );

                const hullBefore =
                    engine
                        .getPlayerHullState();

                state.combat
                    .projectiles
                    .push({
                        id:
                            'incoming_evade_test',

                        designation:
                            'M1',

                        kind:
                            COMBAT_PROJECTILE_KIND
                                .MISSILE,

                        source: {
                            kind:
                                COMBAT_SOURCE_KIND
                                    .ACTOR,

                            actorId:
                                'enemy_test',
                        },

                        sourceWeaponId:
                            'enemy_launcher_test',

                        target: {
                            kind:
                                COMBAT_TARGET_KIND
                                    .PLAYER_SHIP,
                        },

                        damage:
                            1,

                        timeToImpactMs:
                            1,

                        initialTimeToImpactMs:
                            1,
                    });

                engine.step(1);

                expect(
                    engine
                        .getPlayerHullState(),
                ).toEqual(
                    hullBefore,
                );

                expect(
                    engine
                        .getCombatProjectiles(),
                ).toEqual([]);

                expect(
                    engine
                        .drainEvents()
                        .some((event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .MISSILE_IMPACTED_PLAYER_SHIP
                            );
                        }),
                ).toBe(false);
            },
        );
    },
);

function createEngine():
    EncounterEngine {
    const {
        node,
        stationId,
    } =
        createSingleStationNodeFixture();

    return new EncounterEngine({
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
            createShipDriveFixture(),

        powerCore: {
            id:
                'power_core_player_test',

            powerCoreId:
                'power_core_basic_00',

            charges:
                4,

            rechargeElapsedMs:
                0,
        },
    });
}
