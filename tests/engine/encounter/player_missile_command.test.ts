// tests/engine/encounter/player_missile_command.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
} from '../../../src/engine/defs/ship_weapon';
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
    createAnchoredPlayerCombatTestSetup,
    getPlayerWeaponOrThrow,
} from './combat_test_support';

describe('Player missile command', () => {
    it('starts cancellable missile aiming without spending ammunition', () => {
        const {
            engine,
            launcher,
            targetActorId,
        } = createMissileTestSetup();

        const ammoBefore =
            launcher.ammoCount;

        expect(
            getMissileCommands(engine)
                .map((command) => {
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
                        .WEAPONS_FIRE_MISSILE,

                label: 'FIRE MISSILE',

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_WEAPON,

                    weaponId:
                        launcher.id,

                    actorId:
                        targetActorId,
                },
            },
        ]);

        expect(
            engine.executeCommand({
                role:
                    OFFICER_ROLE.WEAPONS,

                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .WEAPONS_FIRE_MISSILE,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_WEAPON,

                    weaponId:
                        launcher.id,

                    actorId:
                        targetActorId,
                },
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS
                    .EXECUTED,
        });

        expect(
            launcher.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );

        expect(
            launcher.phaseElapsedMs,
        ).toBe(0);

        expect(
            launcher.ammoCount,
        ).toBe(ammoBefore);

        const [task] =
            engine.getOfficerTasks();

        expect(task).toMatchObject({
            kind:
                OFFICER_TASK_KIND
                    .WEAPONS_FIRE_MISSILE,

            role:
                OFFICER_ROLE.WEAPONS,

            sourceCommandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_FIRE_MISSILE,

            weaponId:
                launcher.id,

            targetActorId,

            label: 'MISSILE AIM',
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
                'Expected player missile task',
            );
        }

        engine.cancelTask(task.id);

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            launcher.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            launcher.phaseElapsedMs,
        ).toBe(0);

        expect(
            launcher.ammoCount,
        ).toBe(ammoBefore);

        expect(
            getMissileCommands(engine),
        ).toHaveLength(1);
    });

    it('offers and executes one command per ready missile launcher instance', () => {
        const {
            engine,
            state,
            targetActor,
        } =
            createAnchoredPlayerCombatTestSetup();

        const firstLauncher =
            getPlayerWeaponOrThrow(
                state,
                SHIP_WEAPON_KIND
                    .MISSILE_LAUNCHER,
            );

        const secondLauncher:
            MissileLauncherState = {
                ...firstLauncher,

                id:
                    'missile_launcher_player_01',
            };

        state.combat
            .playerWeapons
            .push(secondLauncher);

        const commands =
            getMissileCommands(engine);

        expect(
            commands.map((command) => {
                return command.target;
            }),
        ).toEqual([
            {
                kind:
                    OFFICER_COMMAND_TARGET_KIND
                        .ACTOR_WEAPON,

                weaponId:
                    firstLauncher.id,

                actorId:
                    targetActor.id,
            },
            {
                kind:
                    OFFICER_COMMAND_TARGET_KIND
                        .ACTOR_WEAPON,

                weaponId:
                    secondLauncher.id,

                actorId:
                    targetActor.id,
            },
        ]);

        const secondCommand =
            commands.find((command) => {
                return (
                    command.target.kind ===
                        OFFICER_COMMAND_TARGET_KIND
                            .ACTOR_WEAPON &&
                    command.target.weaponId ===
                        secondLauncher.id
                );
            });

        if (!secondCommand) {
            throw new Error(
                'Expected second launcher command',
            );
        }

        expect(
            engine.executeCommand({
                role:
                    OFFICER_ROLE.WEAPONS,

                commandId:
                    secondCommand.commandId,

                target:
                    secondCommand.target,
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS
                    .EXECUTED,
        });

        expect(
            firstLauncher.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            secondLauncher.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );

        expect(
            engine.getOfficerTasks(),
        ).toEqual([
            expect.objectContaining({
                kind:
                    OFFICER_TASK_KIND
                        .WEAPONS_FIRE_MISSILE,

                weaponId:
                    secondLauncher.id,

                targetActorId:
                    targetActor.id,
            }),
        ]);
    });

    it('hides FIRE MISSILE without a ready loaded launcher or live enemy', () => {
        const {
            engine,
            launcher,
            targetActorId,
        } = createMissileTestSetup();

        const loadedMissileId =
            launcher.loadedMissileId;

        if (!loadedMissileId) {
            throw new Error(
                'Expected loaded player missile',
            );
        }

        launcher.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        launcher.phaseElapsedMs = 1;

        expect(
            getMissileCommands(engine),
        ).toEqual([]);

        launcher.phase =
            SHIP_WEAPON_PHASE.READY;

        launcher.phaseElapsedMs = 0;
        launcher.ammoCount = 0;

        expect(
            getMissileCommands(engine),
        ).toEqual([]);

        launcher.ammoCount = 1;
        launcher.loadedMissileId = null;

        expect(
            getMissileCommands(engine),
        ).toEqual([]);

        launcher.loadedMissileId =
            loadedMissileId;

        engine.setActorTeam(
            targetActorId,
            ENCOUNTER_TEAM.NEUTRAL,
        );

        expect(
            getMissileCommands(engine),
        ).toEqual([]);
    });

    it('cancels aiming and preserves ammunition when the target stops being hostile', () => {
        const {
            engine,
            launcher,
            targetActorId,
        } = createMissileTestSetup();

        const ammoBefore =
            launcher.ammoCount;

        const [command] =
            getMissileCommands(engine);

        if (!command) {
            throw new Error(
                'Expected FIRE MISSILE command',
            );
        }

        expect(
            engine.executeCommand({
                role:
                    OFFICER_ROLE.WEAPONS,

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

        engine.setActorTeam(
            targetActorId,
            ENCOUNTER_TEAM.NEUTRAL,
        );

        engine.step(0);

        expect(
            engine.getOfficerTasks(),
        ).toEqual([]);

        expect(
            launcher.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            launcher.phaseElapsedMs,
        ).toBe(0);

        expect(
            launcher.ammoCount,
        ).toBe(ammoBefore);
    });
});

function createMissileTestSetup(): {
    engine: EncounterEngine;

    launcher:
        MissileLauncherState;

    targetActorId: string;
} {
    const {
        engine,
        state,
        targetActor,
    } = createAnchoredPlayerCombatTestSetup();

    const launcher =
        getPlayerWeaponOrThrow(
            state,
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER,
        );

    return {
        engine,
        launcher,

        targetActorId:
            targetActor.id,
    };
}

function getMissileCommands(
    engine: EncounterEngine,
) {
    return engine
        .getAvailableCommands(
            OFFICER_ROLE.WEAPONS,
        )
        .filter((command) => {
            return (
                command.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_FIRE_MISSILE
            );
        });
}
