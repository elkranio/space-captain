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
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
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
    'Pilot Evade engine lifecycle',
    () => {
        it(
            'advances from raw encounter time and releases Pilot when the maneuver ends',
            () => {
                const engine =
                    createEngine();

                const driveDefinition =
                    SHIP_DRIVES[
                        engine
                            .getDriveState()
                            .driveId
                    ];

                const taskId =
                    startEvade(
                        engine,
                    );

                const maneuverDurationMs =
                    driveDefinition
                        .evadeWarmupMs +
                    driveDefinition
                        .evadeDurationMs;

                // One millisecond before physical maneuver end,
                // Pilot must still be occupied by EVADE.
                engine.step(
                    Math.max(
                        0,
                        maneuverDurationMs -
                            1,
                    ),
                );

                expect(
                    engine
                        .getOfficerTasks()
                        .find(
                            (task) =>
                                task.id ===
                                taskId,
                        ),
                ).toMatchObject({
                    kind:
                        OFFICER_TASK_KIND
                            .PILOT_EVADE,
                });

                expect(
                    engine
                        .getEvadeState()
                        .phase,
                ).not.toBe(
                    SHIP_EVADE_PHASE
                        .COOLDOWN,
                );

                expect(
                    engine
                        .getEvadeState()
                        .phase,
                ).not.toBe(
                    SHIP_EVADE_PHASE
                        .READY,
                );

                engine.step(1);

                expect(
                    engine
                        .getOfficerTasks()
                        .some(
                            (task) =>
                                task.id ===
                                taskId,
                        ),
                ).toBe(false);

                const afterManeuver =
                    engine
                        .getEvadeState();

                expect(
                    afterManeuver
                        .cooldownRemainingMs,
                ).toBe(
                    Math.max(
                        0,
                        driveDefinition
                            .evadeCooldownMs -
                            maneuverDurationMs,
                    ),
                );

                expect(
                    afterManeuver.phase,
                ).toBe(
                    afterManeuver
                        .cooldownRemainingMs >
                        0
                        ? SHIP_EVADE_PHASE
                              .COOLDOWN
                        : SHIP_EVADE_PHASE
                              .READY,
                );

                // Cooldown recovery continues after Pilot has been released.
                engine.step(
                    afterManeuver
                        .cooldownRemainingMs,
                );

                expect(
                    engine
                        .getEvadeState(),
                ).toMatchObject({
                    phase:
                        SHIP_EVADE_PHASE
                            .READY,

                    cooldownRemainingMs:
                        0,
                });
            },
        );

        it(
            'keeps an explicitly cancelled Evade task gone while recovery continues',
            () => {
                const engine =
                    createEngine();

                const taskId =
                    startEvade(
                        engine,
                    );

                engine.cancelTask(
                    taskId,
                );

                const afterCancel =
                    engine
                        .getEvadeState();

                expect(
                    engine
                        .getOfficerTasks()
                        .some(
                            (task) =>
                                task.id ===
                                taskId,
                        ),
                ).toBe(false);

                expect(
                    afterCancel.phase,
                ).toBe(
                    afterCancel
                        .cooldownRemainingMs >
                        0
                        ? SHIP_EVADE_PHASE
                              .COOLDOWN
                        : SHIP_EVADE_PHASE
                              .READY,
                );

                const remainingBeforeStep =
                    afterCancel
                        .cooldownRemainingMs;

                const deltaMs =
                    Math.min(
                        500,
                        remainingBeforeStep,
                    );

                engine.step(
                    deltaMs,
                );

                expect(
                    engine
                        .getOfficerTasks()
                        .some(
                            (task) =>
                                task.kind ===
                                OFFICER_TASK_KIND
                                    .PILOT_EVADE,
                        ),
                ).toBe(false);

                expect(
                    engine
                        .getEvadeState()
                        .cooldownRemainingMs,
                ).toBe(
                    Math.max(
                        0,
                        remainingBeforeStep -
                            deltaMs,
                    ),
                );
            },
        );
    },
);

function startEvade(
    engine: EncounterEngine,
): string {
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

    const task =
        engine
            .getOfficerTasks()
            .find(
                (candidate) =>
                    candidate.kind ===
                    OFFICER_TASK_KIND
                        .PILOT_EVADE,
            );

    if (!task) {
        throw new Error(
            'Expected Pilot Evade task',
        );
    }

    return task.id;
}

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

            charges: 4,

            rechargeElapsedMs:
                0,
        },
    });
}
