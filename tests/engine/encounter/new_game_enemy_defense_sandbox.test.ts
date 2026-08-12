// tests/engine/encounter/new_game_enemy_defense_sandbox.test.ts

import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../../src/engine/defs/defense_capacitor';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    POINT_DEFENSE_ID,
    POINT_DEFENSE_PHASE,
} from '../../../src/engine/defs/point_defense';
import {
    SHIELD_EMITTER_ID,
    SHIELD_EMITTER_PHASE,
    SHIELD_EMITTER_STATUS,
} from '../../../src/engine/defs/shield_emitter';
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
    LASER_SHOT_OUTCOME,
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
        'wires a defensive runtime enemy without offensive weapons',
        () => {
            const {
                targetActor,
            } =
                createAnchoredPlayerCombatTestSetup();

            expect(
                targetActor.weapons,
            ).toEqual([]);

            expect(
                targetActor.pointDefense,
            ).toEqual({
                id:
                    'point_defense_00',

                pointDefenseId:
                    POINT_DEFENSE_ID
                        .BASIC_00,

                phase:
                    POINT_DEFENSE_PHASE
                        .READY,

                phaseElapsedMs: 0,

                loadedBand: null,
                targetProjectileId:
                    null,
            });

            expect(
                targetActor
                    .defenseCapacitor,
            ).toEqual({
                id:
                    'defense_capacitor_00',

                defenseCapacitorId:
                    DEFENSE_CAPACITOR_ID
                        .BASIC_00,

                charges: 4,
                rechargeElapsedMs: 0,
            });

            expect(
                targetActor
                    .shieldEmitter,
            ).toEqual({
                id:
                    'shield_emitter_00',

                shieldEmitterId:
                    SHIELD_EMITTER_ID
                        .BASIC_00,

                status:
                    SHIELD_EMITTER_STATUS
                        .ONLINE,

                phase:
                    SHIELD_EMITTER_PHASE
                        .READY,

                phaseElapsedMs: 0,
            });
        },
    );

    it(
        'times one whole-ship shield to absorb the incoming player laser',
        () => {
            const {
                engine,
                targetActor,
            } =
                createAnchoredPlayerCombatTestSetup();

            const initialHull =
                targetActor.hull;

            const laserCommand =
                engine
                    .getAvailableCommands(
                        OFFICER_ROLE.WEAPONS,
                    )
                    .find((command) => {
                        return (
                            command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .WEAPONS_FIRE_LASER
                        );
                    });

            if (!laserCommand) {
                throw new Error(
                    'Expected player laser command',
                );
            }

            expect(
                engine.executeCommand({
                    role:
                        OFFICER_ROLE.WEAPONS,

                    commandId:
                        laserCommand.commandId,

                    target:
                        laserCommand.target,
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
                SHIP_WEAPON_TARGETING_DURATION_MS,
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
                    .defenseCapacitor
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
                    'shield_emitter_00',

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
                    .shieldEmitter
                    ?.phase,
            ).toBe(
                SHIELD_EMITTER_PHASE
                    .COOLDOWN,
            );

            engine.drainEvents();

            engine.step(3999);

            expect(
                targetActor.activeShield
                    ?.remainingDurationMs,
            ).toBe(1001);

            engine.drainEvents();

            // Player laser resolves before enemy shield time advances
            // for this last millisecond, so the field is still active.
            engine.step(1);

            const firedEvent =
                engine
                    .drainEvents()
                    .find((event) => {
                        return (
                            event.type ===
                            ENCOUNTER_EVENT
                                .PLAYER_LASER_FIRED
                        );
                    });

            if (
                !firedEvent ||
                firedEvent.type !==
                    ENCOUNTER_EVENT
                        .PLAYER_LASER_FIRED
            ) {
                throw new Error(
                    'Expected player laser fired event',
                );
            }

            expect(
                firedEvent.outcome,
            ).toBe(
                LASER_SHOT_OUTCOME
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
                engine.getSpamChannels(),
            ).toEqual([]);
        },
    );
});
