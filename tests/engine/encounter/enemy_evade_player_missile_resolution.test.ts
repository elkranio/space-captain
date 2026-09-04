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
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    SHIP_WEAPON_ID,
} from '../../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    PLAYER_MISSILE_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createAnchoredPlayerCombatTestSetup,
    getTestMissileTargetingDurationMs,
} from './combat_test_support';

describe(
    'enemy Evade player missile resolution',
    () => {
        it(
            'resolves MISS without enemy hull damage when impact occurs during EVADING',
            () => {
                const {
                    engine,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                targetActor.crewRoles = [];
                targetActor.weapons = [];

                targetActor.evade.phase =
                    SHIP_EVADE_PHASE
                        .EVADING;

                targetActor.evade.phaseElapsedMs =
                    0;

                targetActor.evade.cooldownRemainingMs =
                    60_000;

                const initialHull =
                    targetActor.hull;

                expect(
                    engine.executeCommand({
                        role:
                            OFFICER_ROLE.GUNNER,

                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .GUNNER_FIRE_MISSILE,

                        target: {
                            kind:
                                OFFICER_COMMAND_TARGET_KIND
                                    .ACTOR_WEAPON,

                            weaponId:
                                'missile_launcher_player_00',

                            actorId:
                                targetActor.id,
                        },
                    }),
                ).toMatchObject({
                    status:
                        'executed',
                });

                engine.step(
                    getTestMissileTargetingDurationMs(),
                );

                expect(
                    engine.getCombatProjectiles(),
                ).toHaveLength(
                    1,
                );

                engine.drainEvents();

                engine.step(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .MISSILE_LAUNCHER_00
                    ]
                        .flightDurationMs,
                );

                const events =
                    engine.drainEvents();

                expect(
                    events,
                ).toContainEqual(
                    expect.objectContaining({
                        type:
                            ENCOUNTER_EVENT
                                .PLAYER_MISSILE_RESOLVED,

                        outcome:
                            PLAYER_MISSILE_OUTCOME
                                .MISS,

                        projectile:
                            expect.objectContaining({
                                timeToImpactMs:
                                    0,

                                target:
                                    expect.objectContaining({
                                        actorId:
                                            targetActor.id,
                                    }),
                            }),
                    }),
                );

                expect(
                    engine.getCombatProjectiles(),
                ).toEqual(
                    [],
                );

                expect(
                    targetActor.hull,
                ).toBe(
                    initialHull,
                );

                expect(
                    events.some(
                        (event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .ENEMY_SHIP_DESTROYED
                            );
                        },
                    ),
                ).toBe(
                    false,
                );
            },
        );
    },
);
