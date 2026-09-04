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
    BEAM_CANNON_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe(
    'enemy Evade player Beam Cannon resolution',
    () => {
        it(
            'resolves MISS before enemy shield or hull while the target is EVADING',
            () => {
                const {
                    engine,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                // Isolate the target from enemy offense/scheduler noise.
                targetActor.crewRoles = [];
                targetActor.weapons = [];

                targetActor.evade.phase =
                    SHIP_EVADE_PHASE
                        .EVADING;

                targetActor.evade.phaseElapsedMs =
                    0;

                targetActor.evade.cooldownRemainingMs =
                    5000;

                targetActor.activeShield = {
                    sourceEmitterId:
                        'shield_generator_enemy_test',

                    remainingDurationMs:
                        60000,

                    initialDurationMs:
                        60000,
                };

                const initialHull =
                    targetActor.hull;

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
                                    .ACTOR_WEAPON_NODE,
                            node: { kind: 'hull' },

                            weaponId:
                                'beam_cannon_player_00',

                            actorId:
                                targetActor.id,
                        },
                    }),
                ).toMatchObject({
                    status:
                        'executed',
                });

                engine.drainEvents();

                engine.step(0);
                engine.drainEvents();

                engine.step(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00
                    ]
                        .chargeDurationMs,
                );

                const events =
                    engine.drainEvents();

                expect(
                    events,
                ).toContainEqual(
                    expect.objectContaining({
                        type:
                            ENCOUNTER_EVENT
                                .PLAYER_BEAM_CANNON_FIRED,

                        weaponId:
                            'beam_cannon_player_00',

                        targetActorId:
                            targetActor.id,

                        outcome:
                            BEAM_CANNON_SHOT_OUTCOME
                                .MISS,

                        damage:
                            0,

                        remainingHull:
                            initialHull,
                    }),
                );

                expect(
                    targetActor.hull,
                ).toBe(
                    initialHull,
                );

                // Shield may advance its remaining clock later in the same
                // encounter step, but Evade MISS must not consume/delete it.
                expect(
                    targetActor.activeShield,
                ).toMatchObject({
                    sourceEmitterId:
                        'shield_generator_enemy_test',
                });

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
