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
    SHIP_DRIVE_STATUS,
    type ShipDriveStatus,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import OfficerCommandExecutor from '../../../src/engine/encounter/commands/OfficerCommandExecutor';
import {
    getAvailableOfficerCommands,
} from '../../../src/engine/encounter/commands/queries/get_available_officer_commands';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import OfficerTaskRunner from '../../../src/engine/encounter/officer_tasks/OfficerTaskRunner';
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
    'HELM EVADE command',
    () => {
        it(
            'commits full Power cost and cooldown and occupies Helm',
            () => {
                const {
                    store,
                    runner,
                    executor,
                } =
                    createHarness(4);

                const driveDefinition =
                    SHIP_DRIVES[
                        store
                            .getState()
                            .drive
                            .driveId
                    ];

                const result =
                    executor.execute({
                        role:
                            OFFICER_ROLE.HELM,

                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .HELM_EVADE,

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

                expect(
                    store
                        .getState()
                        .combat
                        .powerCore
                        ?.charges,
                ).toBe(
                    4 -
                        driveDefinition
                            .evadePowerCost,
                );

                expect(
                    store.getState()
                        .evade
                        .cooldownRemainingMs,
                ).toBe(
                    driveDefinition
                        .evadeCooldownMs,
                );

                expect(
                    store.getState()
                        .evade
                        .phase,
                ).not.toBe(
                    SHIP_EVADE_PHASE.READY,
                );

                const task =
                    store.getOfficerTask(
                        OFFICER_ROLE.HELM,
                    );

                expect(task).toMatchObject({
                    kind:
                        OFFICER_TASK_KIND
                            .HELM_EVADE,
                    durationMs: null,
                    canBeCancelledByPlayer:
                        true,
                    canBeInterruptedByDamage:
                        true,
                });

                if (!task) {
                    throw new Error(
                        'Expected Helm Evade task',
                    );
                }

                runner.cancel(
                    task.id,
                );

                expect(
                    store.getOfficerTask(
                        OFFICER_ROLE.HELM,
                    ),
                ).toBeUndefined();

                expect(
                    store.getState()
                        .combat
                        .powerCore
                        ?.charges,
                ).toBe(
                    4 -
                        driveDefinition
                            .evadePowerCost,
                );

                expect(
                    store.getState()
                        .evade
                        .phase,
                ).not.toBe(
                    SHIP_EVADE_PHASE
                        .WARMUP,
                );

                expect(
                    store.getState()
                        .evade
                        .phase,
                ).not.toBe(
                    SHIP_EVADE_PHASE
                        .EVADING,
                );
            },
        );

        it(
            'is unavailable without enough Power Core charges',
            () => {
                const {
                    store,
                } =
                    createHarness(0);

                const driveDefinition =
                    SHIP_DRIVES[
                        store
                            .getState()
                            .drive
                            .driveId
                    ];

                const powerCore =
                    store
                        .getState()
                        .combat
                        .powerCore;

                if (!powerCore) {
                    throw new Error(
                        'Expected Power Core',
                    );
                }

                powerCore.charges =
                    Math.max(
                        0,
                        driveDefinition
                            .evadePowerCost -
                            1,
                    );

                expect(
                    getAvailableOfficerCommands(
                        store.getState(),
                        OFFICER_ROLE.HELM,
                    ).some(
                        (command) =>
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .HELM_EVADE,
                    ),
                ).toBe(false);
            },
        );

        it(
            'requires an online drive through the shared command gate',
            () => {
                const {
                    store,
                } =
                    createHarness(
                        4,
                        SHIP_DRIVE_STATUS
                            .DISABLED,
                    );

                expect(
                    getAvailableOfficerCommands(
                        store.getState(),
                        OFFICER_ROLE.HELM,
                    ).some(
                        (command) =>
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .HELM_EVADE,
                    ),
                ).toBe(false);
            },
        );

        it(
            'stops Evade through the shared online-drive cancellation path',
            () => {
                const {
                    store,
                    runner,
                    executor,
                } =
                    createHarness(4);

                executeEvade(
                    executor,
                );

                const committedCooldown =
                    store.getState()
                        .evade
                        .cooldownRemainingMs;

                store.disablePlayerDrive();

                runner
                    .cancelTasksRequiringOnlineDrive();

                expect(
                    store.getOfficerTask(
                        OFFICER_ROLE.HELM,
                    ),
                ).toBeUndefined();

                expect(
                    store.getState()
                        .evade,
                ).toMatchObject({
                    phase:
                        SHIP_EVADE_PHASE
                            .COOLDOWN,

                    cooldownRemainingMs:
                        committedCooldown,
                });
            },
        );

        it(
            'stops Evade when the Helm task is interrupted by damage',
            () => {
                const {
                    store,
                    runner,
                    executor,
                } =
                    createHarness(4);

                executeEvade(
                    executor,
                );

                const committedCooldown =
                    store.getState()
                        .evade
                        .cooldownRemainingMs;

                runner
                    .interruptRandomTaskByDamage();

                expect(
                    store.getOfficerTask(
                        OFFICER_ROLE.HELM,
                    ),
                ).toBeUndefined();

                expect(
                    store.getState()
                        .evade,
                ).toMatchObject({
                    phase:
                        SHIP_EVADE_PHASE
                            .COOLDOWN,

                    cooldownRemainingMs:
                        committedCooldown,
                });
            },
        );
    },
);

function executeEvade(
    executor: OfficerCommandExecutor,
): void {
    const result =
        executor.execute({
            role:
                OFFICER_ROLE.HELM,

            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .HELM_EVADE,

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
}

function createHarness(
    charges: number,
    driveStatus: ShipDriveStatus =
        SHIP_DRIVE_STATUS.ONLINE,
) {
    const {
        node,
        stationId,
    } =
        createSingleStationNodeFixture();

    const store =
        new EncounterStateStore(
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

                powerCore: {
                    id:
                        'power_core_player_test',

                    powerCoreId:
                        'power_core_basic_00',

                    charges,

                    rechargeElapsedMs:
                        0,
                },
            }),
        );

    const emit = () => {};

    const runner =
        new OfficerTaskRunner({
            stateStore:
                store,

            emit,

            purgeSpamChannel:
                () => false,

            clearStickyMine:
                () => false,

            random:
                () => 0,
        });

    const executor =
        new OfficerCommandExecutor({
            stateStore:
                store,

            emit,

            startOfficerTask:
                runner.start,
        });

    return {
        store,
        runner,
        executor,
    };
}
