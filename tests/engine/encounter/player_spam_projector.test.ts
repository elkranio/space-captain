// tests/engine/encounter/player_spam_projector.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    PLAYER_SPAM_CHANNEL_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import {
    createAnchoredPlayerCombatTestSetup,
    getPlayerWeaponOrThrow,
} from './combat_test_support';

const SPAM_DEFINITION =
    SHIP_WEAPONS[
        SHIP_WEAPON_ID
            .SPAM_PROJECTOR_00
    ];

if (
    SPAM_DEFINITION.kind !==
    SHIP_WEAPON_KIND.SPAM_PROJECTOR
) {
    throw new Error(
        'Expected spam projector definition',
    );
}

describe(
    'Player spam projector',
    () => {
        it(
            'projects immediately for the full duration and enters cooldown',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                makeTargetPassive(
                    targetActor,
                );

                const projector =
                    getPlayerWeaponOrThrow(
                        state,

                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,
                    );

                const [command] =
                    engine
                        .getAvailableCommands(
                            OFFICER_ROLE.SCIENCE,
                        )
                        .filter((candidate) => {
                            return (
                                candidate.commandId ===
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .SCIENCE_FIRE_SPAM
                            );
                        });

                expect(command).toEqual({
                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .SCIENCE_FIRE_SPAM,

                    label: 'FIRE SPAM',

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .ACTOR_WEAPON,

                        weaponId:
                            projector.id,

                        actorId:
                            targetActor.id,
                    },

                    targetLabel:
                        targetActor.displayName,
                });

                if (!command) {
                    throw new Error(
                        'Expected FIRE SPAM command',
                    );
                }

                expect(
                    engine.executeCommand({
                        role:
                            OFFICER_ROLE.SCIENCE,

                        commandId:
                            command.commandId,

                        target:
                            command.target,
                    }),
                ).toEqual({
                    status:
                        OFFICER_COMMAND_EXECUTION_STATUS
                            .EXECUTED,
                });

                expect(projector).toMatchObject({
                    phase:
                        SHIP_WEAPON_PHASE
                            .CHANNELING,

                    phaseElapsedMs: 0,

                    activeChannelId:
                        null,
                });

                const [task] =
                    engine.getOfficerTasks();

                expect(task).toMatchObject({
                    kind:
                        OFFICER_TASK_KIND
                            .SCIENCE_FIRE_SPAM,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    sourceCommandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .SCIENCE_FIRE_SPAM,

                    weaponId:
                        projector.id,

                    targetActorId:
                        targetActor.id,

                    label:
                        'SPAM PROJECT',

                    showProgress: false,
                    durationMs: null,

                    canBeCancelledByPlayer:
                        false,

                    canBeInterruptedByDamage:
                        true,
                });

                engine.drainEvents();

                engine.step(0);

                const startEvents =
                    engine.drainEvents();

                const startEvent =
                    startEvents.find((event) => {
                        return (
                            event.type ===
                            ENCOUNTER_EVENT
                                .PLAYER_SPAM_CHANNEL_STARTED
                        );
                    });

                expect(startEvent).toEqual({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_SPAM_CHANNEL_STARTED,

                    channelId:
                        expect.stringContaining(
                            'player_spam:',
                        ),

                    sourceWeaponId:
                        projector.id,

                    targetActorId:
                        targetActor.id,
                });

                expect(projector).toMatchObject({
                    phase:
                        SHIP_WEAPON_PHASE
                            .CHANNELING,

                    phaseElapsedMs: 0,

                    activeChannelId:
                        expect.stringContaining(
                            'player_spam:',
                        ),
                });

                engine.step(
                    SPAM_DEFINITION
                        .channelDurationMs,
                );

                expect(
                    engine.drainEvents(),
                ).toContainEqual({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_SPAM_CHANNEL_ENDED,

                    channelId:
                        startEvent?.type ===
                        ENCOUNTER_EVENT
                            .PLAYER_SPAM_CHANNEL_STARTED
                            ? startEvent.channelId
                            : '',

                    sourceWeaponId:
                        projector.id,

                    targetActorId:
                        targetActor.id,

                    outcome:
                        PLAYER_SPAM_CHANNEL_OUTCOME
                            .EXPIRED,
                });

                expect(projector).toMatchObject({
                    phase:
                        SHIP_WEAPON_PHASE
                            .COOLDOWN,

                    phaseElapsedMs: 0,

                    activeChannelId:
                        null,
                });

                expect(
                    engine.getOfficerTasks(),
                ).toEqual([]);
            },
        );

        it(
            'rejects manual cancellation while the spam channel stays active',
            () => {
                const {
                    engine,
                    state,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                makeTargetPassive(
                    targetActor,
                );

                const projector =
                    getPlayerWeaponOrThrow(
                        state,

                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,
                    );

                const command =
                    engine
                        .getAvailableCommands(
                            OFFICER_ROLE.SCIENCE,
                        )
                        .find((candidate) => {
                            return (
                                candidate.commandId ===
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .SCIENCE_FIRE_SPAM
                            );
                        });

                if (!command) {
                    throw new Error(
                        'Expected FIRE SPAM command',
                    );
                }

                engine.executeCommand({
                    role:
                        OFFICER_ROLE.SCIENCE,

                    commandId:
                        command.commandId,

                    target:
                        command.target,
                });

                engine.drainEvents();

                engine.step(0);

                engine.drainEvents();

                const [task] =
                    engine.getOfficerTasks();

                if (
                    !task ||
                    task.kind !==
                        OFFICER_TASK_KIND
                            .SCIENCE_FIRE_SPAM
                ) {
                    throw new Error(
                        'Expected active Science spam task',
                    );
                }

                expect(
                    task.canBeCancelledByPlayer,
                ).toBe(false);

                expect(() => {
                    engine.cancelTask(
                        task.id,
                    );
                }).toThrow(
                    'Officer task cannot be cancelled by player: ' +
                        `${task.id}/${task.kind}`,
                );

                expect(
                    engine.drainEvents(),
                ).toEqual([]);

                expect(projector).toMatchObject({
                    phase:
                        SHIP_WEAPON_PHASE
                            .CHANNELING,

                    activeChannelId:
                        expect.stringContaining(
                            'player_spam:',
                        ),
                });

                expect(
                    engine.getOfficerTasks(),
                ).toEqual([task]);
            },
        );
    },
);

function makeTargetPassive(
    targetActor:
        ReturnType<
            typeof createAnchoredPlayerCombatTestSetup
        >['targetActor'],
): void {
    targetActor.crewRoles = [];
    targetActor.crewTasks = {};

    targetActor.weapons = [];
    delete targetActor.defenseTurret;
}
