// tests/engine/encounter/enemy_directional_shield.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    OFFICER_TASK_BASE_DURATION_MS,
} from '../../../src/engine/content/rules/officer_tasks';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIP_WEAPON_ID,
} from '../../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    LASER_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe(
    'Retired enemy directional shield',
    () => {
        it(
            'does not schedule Engineer shielding against the baseline player laser',
            () => {
                const {
                    engine,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup({
                        random: () => 0,
                    });

                const initialHull =
                    targetActor.hull;

                const initialCharges =
                    targetActor
                        .shieldGenerator
                        .charges;

                engine.executeCommand({
                    role:
                        OFFICER_ROLE.WEAPONS,

                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_LASER,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .ACTOR_WEAPON,

                        weaponId:
                            'laser_player_00',

                        actorId:
                            targetActor.id,
                    },
                });

                engine.drainEvents();

                engine.step(
                    SHIP_WEAPON_TARGETING_DURATION_MS,
                );

                engine.drainEvents();

                // Enemy Science may still inspect the incoming
                // laser during this migration atom, but old
                // directional Engineer defense is retired.
                engine.step(
                    OFFICER_TASK_BASE_DURATION_MS
                        .SCIENCE_IDENTIFY_THREAT,
                );

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.ENGINEER
                    ],
                ).toBeUndefined();

                expect(
                    targetActor.activeShield,
                ).toBeUndefined();

                const chargeDurationMs =
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID.LASER_00
                    ].chargeDurationMs;

                engine.step(
                    chargeDurationMs -
                        OFFICER_TASK_BASE_DURATION_MS
                            .SCIENCE_IDENTIFY_THREAT,
                );

                expect(
                    targetActor.activeShield,
                ).toBeUndefined();

                expect(
                    targetActor
                        .shieldGenerator
                        .charges,
                ).toBe(
                    initialCharges,
                );

                expect(
                    targetActor.hull,
                ).toBe(
                    initialHull - 1,
                );

                expect(
                    engine
                        .drainEvents()
                        .find((event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .PLAYER_LASER_FIRED
                            );
                        }),
                ).toMatchObject({
                    targetActorId:
                        targetActor.id,

                    outcome:
                        LASER_SHOT_OUTCOME.HIT,

                    damage: 1,

                    remainingHull:
                        initialHull - 1,
                });
            },
        );
    },
);
