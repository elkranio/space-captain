// tests/engine/encounter/new_game_enemy_defense_sandbox.test.ts

import {
    DEFENSE_TURRETS,
} from '../../../src/engine/content/catalogs/defense_turrets';
import {
    SHIELD_GENERATORS,
} from '../../../src/engine/content/catalogs/shield_generators';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import {
    SHIELD_GENERATOR_ID,
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../src/engine/defs/shield_generator';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
} from '../../../src/engine/encounter/model/command';
import {
    BEAM_CANNON_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe('New-game enemy defense sandbox', () => {
    it(
        'wires the runtime defense sandbox with one missile launcher',
        () => {
            const {
                targetActor,
            } =
                createAnchoredPlayerCombatTestSetup();

            expect(
                targetActor.weapons,
            ).toEqual([
                {
                    id:
                        'missile_launcher_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .MISSILE_LAUNCHER_00,

                    kind:
                        SHIP_WEAPON_KIND
                            .MISSILE_LAUNCHER,

                    integrity:
                        SHIP_WEAPONS[
                            SHIP_WEAPON_ID
                                .MISSILE_LAUNCHER_00
                        ].maxIntegrity,

                    ammoCount: 5,

                    phase:
                        SHIP_WEAPON_PHASE
                            .READY,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,
                },
            ]);

            expect(
                targetActor.defenseTurret,
            ).toEqual({
                id:
                    'defense_turret_00',

                defenseTurretId:
                    DEFENSE_TURRET_ID
                        .BASIC_00,

                integrity:
                    DEFENSE_TURRETS[
                        DEFENSE_TURRET_ID
                            .BASIC_00
                    ].maxIntegrity,

                phase:
                    DEFENSE_TURRET_PHASE
                        .READY,

                phaseElapsedMs: 0,
                cooldownRemainingMs: 0,

                targetProjectileId:
                    null,
            });

            expect(
                targetActor
                    .powerCore,
            ).toEqual({
                id:
                    'power_core_00',

                powerCoreId:
                    POWER_CORE_ID
                        .BASIC_00,

                charges: 4,
                rechargeElapsedMs: 0,
            });

            expect(
                targetActor
                    .shieldGenerator,
            ).toEqual({
                id:
                    'shield_generator_00',

                shieldGeneratorId:
                    SHIELD_GENERATOR_ID
                        .BASIC_00,

                integrity:
                    SHIELD_GENERATORS[
                        SHIELD_GENERATOR_ID
                            .BASIC_00
                    ].maxIntegrity,

                status:
                    SHIELD_GENERATOR_STATUS
                        .ONLINE,

                phase:
                    SHIELD_GENERATOR_PHASE
                        .READY,

                phaseElapsedMs: 0,
            });
        },
    );

    it(
        'times one whole-ship shield to absorb the incoming player beamCannon',
        () => {
            const {
                engine,
                targetActor,
            } =
                createAnchoredPlayerCombatTestSetup();

            targetActor.behavior
                .threatTimingWiggleMs = 0;

            // This test owns shield timing,
            // not captain attack-vs-defense strategy.
            targetActor.weapons = [];

            const initialHull =
                targetActor.hull;

            const beamCannonCommand =
                engine
                    .getAvailableCommands(
                        OFFICER_ROLE.GUNNER,
                    )
                    .find((command) => {
                        return (
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .GUNNER_FIRE_BEAM_CANNON
                        );
                    });

            if (!beamCannonCommand) {
                throw new Error(
                    'Expected player beamCannon command',
                );
            }

            expect(
                engine.executeCommand({
                    role:
                        OFFICER_ROLE.GUNNER,

                    commandId:
                        beamCannonCommand.commandId,

                    target:
                        beamCannonCommand.target,
                }),
            ).toEqual({
                status:
                    OFFICER_COMMAND_EXECUTION_STATUS
                        .EXECUTED,
            });

            engine.drainEvents();

            // Player targeting completes; enemy now observes CHARGING
            // but correctly waits because a 5s field would expire too early.
            engine.step(
                0,
            );

            engine.drainEvents();

            expect(
                targetActor.activeShield,
            ).toBeUndefined();

            expect(
                targetActor.crewTasks[
                    OFFICER_ROLE.ENGINEER
                ],
            ).toBeUndefined();

            // 7s remain: this is the deterministic deployment window.
            engine.step(5000);

            const shieldTask =
                targetActor.crewTasks[
                    OFFICER_ROLE.ENGINEER
                ];

            expect(
                shieldTask,
            ).toMatchObject({
                kind:
                    SHIP_CREW_TASK_KIND
                        .DEPLOY_SHIELD,

                role:
                    OFFICER_ROLE.ENGINEER,

                elapsedMs: 0,
                durationMs: 3000,
            });

            expect(
                targetActor
                    .powerCore
                    ?.charges,
            ).toBe(3);

            expect(
                targetActor.activeShield,
            ).toBeUndefined();

            engine.drainEvents();

            // Engineer finishes with 4s left to impact.
            engine.step(3000);

            expect(
                targetActor.activeShield,
            ).toEqual({
                sourceEmitterId:
                    'shield_generator_00',

                remainingDurationMs:
                    5000,

                initialDurationMs:
                    5000,
            });

            expect(
                targetActor.crewTasks[
                    OFFICER_ROLE.ENGINEER
                ],
            ).toBeUndefined();

            expect(
                targetActor
                    .shieldGenerator
                    ?.phase,
            ).toBe(
                SHIELD_GENERATOR_PHASE
                    .COOLDOWN,
            );

            engine.drainEvents();

            engine.step(3999);

            expect(
                targetActor.activeShield
                    ?.remainingDurationMs,
            ).toBe(1001);

            engine.drainEvents();

            // Player beamCannon resolves before enemy shield time advances
            // for this last millisecond, so the field is still active.
            engine.step(1);

            const firedEvent =
                engine
                    .drainEvents()
                    .find((event) => {
                        return (
                            event.type ===
                            ENCOUNTER_EVENT
                                .PLAYER_BEAM_CANNON_FIRED
                        );
                    });

            if (
                !firedEvent ||
                firedEvent.type !==
                    ENCOUNTER_EVENT
                        .PLAYER_BEAM_CANNON_FIRED
            ) {
                throw new Error(
                    'Expected player beamCannon fired event',
                );
            }

            expect(
                firedEvent.outcome,
            ).toBe(
                BEAM_CANNON_SHOT_OUTCOME
                    .ABSORBED,
            );

            expect(firedEvent.damage)
                .toBe(0);

            expect(
                firedEvent.remainingHull,
            ).toBe(initialHull);

            expect(targetActor.hull)
                .toBe(initialHull);

            expect(
                targetActor.activeShield,
            ).toBeUndefined();

            expect(
                engine.getCombatPresentationSnapshot().spamChannels,
            ).toEqual([]);
        },
    );
});
