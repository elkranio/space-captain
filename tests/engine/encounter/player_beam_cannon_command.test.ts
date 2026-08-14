// tests/engine/encounter/player_beam_cannon_command.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import {
    createAnchoredPlayerCombatTestSetup,
    getPlayerWeaponOrThrow,
} from './combat_test_support';

describe('Player beamCannon command', () => {
    it(
        'offers one current-enemy hull shot and starts a cancellable targeting task',
        () => {
            const {
                engine,
                state,
                targetActor,
            } =
                createAnchoredPlayerCombatTestSetup();

            const installedWeapon = {
                ...getPlayerWeaponOrThrow(
                    state,
                    SHIP_WEAPON_KIND.BEAM_CANNON,
                ),
            };

            const installedLauncher = {
                ...getPlayerWeaponOrThrow(
                    state,
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,
                ),
            };

            const installedMineDispenser = {
                ...getPlayerWeaponOrThrow(
                    state,
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,
                ),
            };

            const installedSpamProjector = {
                ...getPlayerWeaponOrThrow(
                    state,
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR,
                ),
            };

            const beamCannonCommands =
                engine
                    .getAvailableCommands(
                        OFFICER_ROLE.WEAPONS,
                    )
                    .filter((command) => {
                        return (
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .WEAPONS_FIRE_BEAM_CANNON
                        );
                    });

            expect(
                beamCannonCommands.map((command) => {
                    return {
                        commandId:
                            command.commandId,

                        label:
                            command.label,

                        target:
                            command.target,
                    };
                }),
            ).toEqual([
                {
                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_BEAM_CANNON,

                    label:
                        'FIRE BEAM CANNON',

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .ACTOR_WEAPON,

                        weaponId:
                            'beam_cannon_player_00',

                        actorId:
                            targetActor.id,
                    },
                },
            ]);

            expect(
                engine.executeCommand({
                    role:
                        OFFICER_ROLE.WEAPONS,

                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_BEAM_CANNON,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .ACTOR_WEAPON,

                        weaponId:
                            'beam_cannon_player_00',

                        actorId:
                            targetActor.id,
                    },
                }),
            ).toEqual({
                status:
                    OFFICER_COMMAND_EXECUTION_STATUS
                        .EXECUTED,
            });

            expect(
                engine.getPlayerWeaponStates(),
            ).toEqual([
                {
                    ...installedWeapon,

                    phase:
                        SHIP_WEAPON_PHASE
                            .TARGETING,

                    phaseElapsedMs: 0,
                },

                installedLauncher,
                installedMineDispenser,
                installedSpamProjector,
            ]);

            const [task] =
                engine.getOfficerTasks();

            expect(task).toMatchObject({
                kind:
                    OFFICER_TASK_KIND
                        .WEAPONS_FIRE_BEAM_CANNON,

                role:
                    OFFICER_ROLE.WEAPONS,

                sourceCommandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .WEAPONS_FIRE_BEAM_CANNON,

                weaponId:
                    'beam_cannon_player_00',

                targetActorId:
                    targetActor.id,

                label:
                    'BEAM CANNON AIM',
                showProgress: false,

                durationMs: null,

                canBeCancelledByPlayer: true,
                canBeInterruptedByDamage: true,

                elapsedMs: 0,
            });

            expect(
                engine.getAvailableCommands(
                    OFFICER_ROLE.WEAPONS,
                ),
            ).toEqual([]);

            if (!task) {
                throw new Error(
                    'Expected player beamCannon task',
                );
            }

            engine.cancelTask(task.id);

            expect(
                engine.getOfficerTasks(),
            ).toEqual([]);

            expect(
                engine
                    .getPlayerWeaponStates()[0]
                    ?.phase,
            ).toBe(
                SHIP_WEAPON_PHASE.READY,
            );

            expect(
                engine
                    .getAvailableCommands(
                        OFFICER_ROLE.WEAPONS,
                    )
                    .filter((command) => {
                        return (
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .WEAPONS_FIRE_BEAM_CANNON
                        );
                    }),
            ).toHaveLength(1);
        },
    );
});
