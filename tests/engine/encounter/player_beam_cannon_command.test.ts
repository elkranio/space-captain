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
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_ID,
} from '../../../src/engine/defs/ship_weapon';
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
        'offers one current-enemy hull shot and starts a cancellable charging task',
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

            const powerCore = state.combat.powerCore;

            if (!powerCore) {
                throw new Error(
                    'Expected installed player Power Core',
                );
            }

            const initialPowerCharges =
                powerCore.charges;

            const beamCannonDefinition =
                SHIP_WEAPONS[
                    SHIP_WEAPON_ID.BEAM_CANNON_00
                ];

            const beamCannonCommands =
                engine
                    .getAvailableCommands(
                        OFFICER_ROLE.GUNNER,
                    )
                    .filter((command) => {
                        return (
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .GUNNER_FIRE_BEAM_CANNON
                        );
                    });

            expect(
                beamCannonCommands.map((command) => {
                    return {
                        commandId:
                            command.commandId,

                        target:
                            command.target,
                    };
                }),
            ).toEqual([
                {
                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .GUNNER_FIRE_BEAM_CANNON,

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
                        OFFICER_ROLE.GUNNER,

                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .GUNNER_FIRE_BEAM_CANNON,

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
                powerCore.charges,
            ).toBe(
                initialPowerCharges -
                    beamCannonDefinition.powerCost,
            );

            expect(
                getPlayerWeaponOrThrow(
                    state,
                    SHIP_WEAPON_KIND
                        .BEAM_CANNON,
                ),
            ).toEqual({
                ...installedWeapon,

                phase:
                    SHIP_WEAPON_PHASE
                        .CHARGING,

                phaseElapsedMs: 0,

                cooldownRemainingMs:
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00
                    ].cooldownDurationMs,
            });

            const [task] =
                engine.getOfficerTasks();

            expect(task).toMatchObject({
                kind:
                    OFFICER_TASK_KIND
                        .GUNNER_FIRE_BEAM_CANNON,

                role:
                    OFFICER_ROLE.GUNNER,

                sourceCommandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .GUNNER_FIRE_BEAM_CANNON,

                weaponId:
                    'beam_cannon_player_00',

                targetActorId:
                    targetActor.id,

                label:
                    'BEAM CANNON CHARGE',
                showProgress: false,

                durationMs: null,

                canBeCancelledByPlayer: true,
                canBeInterruptedByDamage: true,

                elapsedMs: 0,
            });

            expect(
                engine.getAvailableCommands(
                    OFFICER_ROLE.GUNNER,
                ),
            ).toEqual([]);

            if (!task) {
                throw new Error(
                    'Expected player beamCannon task',
                );
            }

            engine.cancelTask(task.id);

            expect(
                powerCore.charges,
            ).toBe(
                initialPowerCharges -
                    beamCannonDefinition.powerCost,
            );

            expect(
                engine.getOfficerTasks(),
            ).toEqual([]);

            expect(
                getPlayerWeaponOrThrow(
                    state,
                    SHIP_WEAPON_KIND
                        .BEAM_CANNON,
                ).phase,
            ).toBe(
                SHIP_WEAPON_PHASE.COOLDOWN,
            );

            expect(
                engine
                    .getAvailableCommands(
                        OFFICER_ROLE.GUNNER,
                    )
                    .filter((command) => {
                        return (
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .GUNNER_FIRE_BEAM_CANNON
                        );
                    }),
            ).toHaveLength(0);

            engine.step(
                SHIP_WEAPONS[
                    SHIP_WEAPON_ID.BEAM_CANNON_00
                ].cooldownDurationMs,
            );

            expect(
                getPlayerWeaponOrThrow(
                    state,
                    SHIP_WEAPON_KIND
                        .BEAM_CANNON,
                ).phase,
            ).toBe(
                SHIP_WEAPON_PHASE.READY,
            );
        },
    );

    it(
        'does not offer Beam fire when Power Core cannot pay the shot cost',
        () => {
            const {
                engine,
                state,
            } =
                createAnchoredPlayerCombatTestSetup();

            const powerCore = state.combat.powerCore;

            if (!powerCore) {
                throw new Error(
                    'Expected installed player Power Core',
                );
            }

            powerCore.charges =
                SHIP_WEAPONS[
                    SHIP_WEAPON_ID.BEAM_CANNON_00
                ].powerCost - 1;

            const beamCommands =
                engine
                    .getAvailableCommands(
                        OFFICER_ROLE.GUNNER,
                    )
                    .filter((command) => {
                        return (
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .GUNNER_FIRE_BEAM_CANNON
                        );
                    });

            expect(beamCommands).toEqual([]);
        },
    );
});
