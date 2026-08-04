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
    SHIP_SHIELD_DURATION_MS,
} from '../../../src/engine/content/rules/shields';
import {
    CREW_TRAIT_ID,
} from '../../../src/engine/defs/crew_trait';
import {
    LASER_TARGET_ZONE,
    type LaserTargetZone,
} from '../../../src/engine/defs/laser';
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
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

const SCIENCE_DURATION_MS =
    OFFICER_TASK_BASE_DURATION_MS
        .SCIENCE_IDENTIFY_THREAT;

const DEPLOY_DURATION_MS =
    OFFICER_TASK_BASE_DURATION_MS
        .ENGINEER_DEPLOY_SHIELD;

const LASER_CHARGE_DURATION_MS =
    SHIP_WEAPONS[
        SHIP_WEAPON_ID.LASER_00
    ].chargeDurationMs;

// After Science completes, 2100 ms moves the 12 s laser
// from 9.0 s remaining to 6.9 s remaining.
// That enters the strict 2 s deploy + 5 s lifetime window.
const WAIT_FOR_DEPLOY_WINDOW_MS =
    2100;

const SHIELD_TO_IMPACT_MS =
    LASER_CHARGE_DURATION_MS -
    SCIENCE_DURATION_MS -
    WAIT_FOR_DEPLOY_WINDOW_MS -
    DEPLOY_DURATION_MS;

describe(
    'Enemy directional shield',
    () => {
        it(
            'waits for the useful window and blocks the reported laser zone',
            () => {
                const {
                    engine,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                const initialHull =
                    targetActor.hull;

                const initialCharges =
                    targetActor
                        .shieldGenerator
                        .charges;

                firePlayerLaser(
                    engine,
                    targetActor.id,
                    LASER_TARGET_ZONE.LEFT,
                );

                engine.step(
                    SHIP_WEAPON_TARGETING_DURATION_MS,
                );

                engine.drainEvents();

                engine.step(
                    SCIENCE_DURATION_MS,
                );

                expect(
                    targetActor
                        .threatObservations[0]
                        ?.report,
                ).toEqual({
                    kind: 'laser',

                    targetZone:
                        LASER_TARGET_ZONE.LEFT,
                });

                // Report is ready, but immediate deployment would expire
                // before the 12 s laser finishes charging.
                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.ENGINEER
                    ],
                ).toBeUndefined();

                engine.step(
                    WAIT_FOR_DEPLOY_WINDOW_MS,
                );

                expect(
                    targetActor.crewTasks[
                        OFFICER_ROLE.ENGINEER
                    ],
                ).toMatchObject({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .DEPLOY_SHIELD,

                    observationId:
                        expect.any(String),

                    shieldZone:
                        LASER_TARGET_ZONE.LEFT,

                    elapsedMs: 0,

                    durationMs:
                        DEPLOY_DURATION_MS,
                });

                expect(
                    targetActor
                        .shieldGenerator
                        .charges,
                ).toBe(
                    initialCharges - 1,
                );

                engine.step(
                    DEPLOY_DURATION_MS,
                );

                expect(
                    targetActor.activeShield,
                ).toEqual({
                    zone:
                        LASER_TARGET_ZONE.LEFT,

                    elapsedMs: 0,

                    durationMs:
                        SHIP_SHIELD_DURATION_MS,
                });

                engine.drainEvents();

                engine.step(
                    SHIELD_TO_IMPACT_MS,
                );

                expect(
                    targetActor.hull,
                ).toBe(initialHull);

                expect(
                    targetActor.activeShield,
                ).toBeUndefined();

                expect(
                    findPlayerLaserFireEvent(
                        engine,
                    ),
                ).toMatchObject({
                    targetActorId:
                        targetActor.id,

                    targetZone:
                        LASER_TARGET_ZONE.LEFT,

                    outcome:
                        LASER_SHOT_OUTCOME
                            .BLOCKED,
                });
            },
        );

        it(
            'trusts a hungover Science report and leaves the real zone unprotected',
            () => {
                const {
                    engine,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                targetActor
                    .crewTraitsByRole[
                        OFFICER_ROLE.SCIENCE
                    ] = [
                    CREW_TRAIT_ID.HUNGOVER,
                ];

                const initialHull =
                    targetActor.hull;

                firePlayerLaser(
                    engine,
                    targetActor.id,
                    LASER_TARGET_ZONE.LEFT,
                );

                engine.step(
                    SHIP_WEAPON_TARGETING_DURATION_MS,
                );

                engine.drainEvents();

                engine.step(
                    SCIENCE_DURATION_MS,
                );

                expect(
                    targetActor
                        .threatObservations[0]
                        ?.report,
                ).toEqual({
                    kind: 'laser',

                    // HUNGOVER maps truthful LEFT to false CENTER.
                    targetZone:
                        LASER_TARGET_ZONE.CENTER,
                });

                engine.step(
                    WAIT_FOR_DEPLOY_WINDOW_MS,
                );

                engine.step(
                    DEPLOY_DURATION_MS,
                );

                expect(
                    targetActor.activeShield,
                ).toMatchObject({
                    zone:
                        LASER_TARGET_ZONE.CENTER,
                });

                engine.drainEvents();

                engine.step(
                    SHIELD_TO_IMPACT_MS,
                );

                expect(
                    targetActor.hull,
                ).toBe(
                    initialHull - 1,
                );

                // A mismatched directional shield is not consumed.
                expect(
                    targetActor.activeShield,
                ).toMatchObject({
                    zone:
                        LASER_TARGET_ZONE.CENTER,

                    elapsedMs:
                        SHIELD_TO_IMPACT_MS,
                });

                expect(
                    findPlayerLaserFireEvent(
                        engine,
                    ),
                ).toMatchObject({
                    targetActorId:
                        targetActor.id,

                    targetZone:
                        LASER_TARGET_ZONE.LEFT,

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

function firePlayerLaser(
    engine:
        ReturnType<
            typeof createAnchoredPlayerCombatTestSetup
        >['engine'],

    targetActorId: string,

    targetZone:
        LaserTargetZone,
): void {
    engine.executeCommand({
        role:
            OFFICER_ROLE.WEAPONS,

        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_LASER,

        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_LASER_ZONE,

            weaponId:
                'laser_player_00',

            actorId:
                targetActorId,

            targetZone,
        },
    });

    engine.drainEvents();
}

function findPlayerLaserFireEvent(
    engine:
        ReturnType<
            typeof createAnchoredPlayerCombatTestSetup
        >['engine'],
) {
    return engine
        .drainEvents()
        .find((event) => {
            return (
                event.type ===
                ENCOUNTER_EVENT
                    .PLAYER_LASER_FIRED
            );
        });
}
