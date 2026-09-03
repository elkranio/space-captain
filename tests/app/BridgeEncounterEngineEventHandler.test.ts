// tests/app/BridgeEncounterEngineEventHandler.test.ts

import {
    describe, expect, it, vi } from 'vitest';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { BEACON_OBJECT_SPRITE_ID } from '../../src/engine/defs/beacon';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import {
    DEFENSE_TURRET_SHOT_OUTCOME,
} from '../../src/engine/defs/defense_turret';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    BEAM_CANNON_SHOT_OUTCOME,
} from '../../src/engine/encounter/model/combat';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../src/engine/encounter/model/command';
import { ENCOUNTER_ANCHOR_KIND } from '../../src/engine/encounter/anchors/encounter_anchor';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
    PLAYER_SHIELD_END_OUTCOME,
} from '../../src/engine/encounter/model/event';
import type {
    MissileEventProjectileSnapshot,
} from '../../src/engine/encounter/model/missile_event_projectile';
import { OFFICER_TASK_KIND } from '../../src/engine/encounter/model/officer_task';

const launchedProjectile: MissileEventProjectileSnapshot = {
    id: 'projectile_test_00',
    designation: 'M1',

    kind: COMBAT_PROJECTILE_KIND.MISSILE,

    source: {
        kind: COMBAT_SOURCE_KIND.ACTOR,
        actorId: 'ship_enemy_00',
    },

    sourceWeaponId: 'missile_launcher_00',

    target: {
        kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
    },


    timeToImpactMs: 12000,
    initialTimeToImpactMs: 12000,
};

const impactedProjectile: MissileEventProjectileSnapshot = {
    ...launchedProjectile,

    timeToImpactMs: 0,
};

describe('BridgeEncounterEngineEventHandler combat events', () => {
    it('does not clear combat presentation before local travel starts', () => {
        const emit = vi.fn();
        const handler =
            new BridgeEncounterEngineEventHandler({
                emit,
            } as unknown as BridgeEventBus);

        handler.handle([
            {
                type: ENCOUNTER_EVENT.TRAVEL_STARTED,

                taskId: 'task_travel_1',
                fromAnchorId: 'station_test',

                target: {
                    id: 'beacon_test',

                    kind:
                        ENCOUNTER_ANCHOR_KIND
                            .NAVIGATION_BEACON,

                    displayName: 'TEST BEACON',

                    beacon: {
                        id: 'beacon_test',
                        name: 'TEST BEACON',

                        objectSpriteId:
                            BEACON_OBJECT_SPRITE_ID
                                .NAVIGATION_BEACON_00,
                    },

                    localPosition: {
                        x: 1000,
                        y: 0,
                        z: 0,
                    },

                    position: {
                        x: 0,
                        y: 0,
                    },

                    perspectiveDepth: 1,
                },
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED,

                {
                    taskId: 'task_travel_1',

                    fromObjectId: 'station_test',
                    targetObjectId: 'beacon_test',
                },
            ],
        ]);
    });

    it('clears combat presentation at the physical travel boundary', () => {
        const emit = vi.fn();

        const handler =
            new BridgeEncounterEngineEventHandler({
                emit,
            } as unknown as BridgeEventBus);

        handler.clearCombatPresentation();

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT
                    .ENEMY_ATTACK_WARNING_CLEARED,
            ],

            [
                BRIDGE_EVENT.INCOMING_MISSILES_UPDATED,
                [],
            ],

            [
                BRIDGE_EVENT.OUTGOING_MISSILES_UPDATED,
                [],
            ],

            [
                BRIDGE_EVENT
                    .OUTGOING_STICKY_MINES_UPDATED,
                [],
            ],

            [
                BRIDGE_EVENT.STICKY_MINES_UPDATED,
                [],
            ],

            [
                BRIDGE_EVENT.BEAM_CANNON_THREATS_UPDATED,
                [],
            ],

            [
                BRIDGE_EVENT
                    .PLAYER_SHIELD_UPDATED,
                null,
            ],

            [
                BRIDGE_EVENT
                    .ENEMY_SHIELDS_UPDATED,
                [],
            ],

            [
                BRIDGE_EVENT
                    .DEFENSE_TURRET_THREATS_UPDATED,
                [],
            ],
        ]);
    });

    it('maps enemy attack start and missile launch to bridge presentation events', () => {
        const emit = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler = new BridgeEncounterEngineEventHandler(eventBus);

        handler.handle([
            {
                type: ENCOUNTER_EVENT.ENEMY_ATTACK_STARTED,

                sourceActorId: 'ship_enemy_00',

                sourceWeaponId: 'missile_launcher_00',
            },

            {
                type: ENCOUNTER_EVENT.MISSILE_LAUNCHED,

                projectile: {
                    ...launchedProjectile,
                },
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [BRIDGE_EVENT.ENEMY_ATTACK_WARNING_TRIGGERED],

            [
                BRIDGE_EVENT.INCOMING_MISSILE_ADDED,

                {
                    projectileId: 'projectile_test_00',

                    designation: 'M1',

                    sourceActorId: 'ship_enemy_00',

                    initialTimeToImpactMs: 12000,
                },
            ],
        ]);

    });

    it('requests END only for damage marked as destruction', () => {
        const emit = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler = new BridgeEncounterEngineEventHandler(eventBus);

        handler.handle([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    ...impactedProjectile,
                },

                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_00',
                },
            ],
        ]);


        handler.handle([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    ...impactedProjectile,

                    id: 'projectile_test_01',

                    designation: 'M2',
                },

                appliedDamage: 2,
                remainingHull: 0,
                destroyed: true,
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_00',
                },
            ],

            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_01',
                },
            ],

        ]);

        // Повторный synthetic impact без destroyed
        // не запускает второй transition event.
        handler.handle([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    ...impactedProjectile,

                    id: 'projectile_test_02',

                    designation: 'M3',
                },

                appliedDamage: 0,
                remainingHull: 0,
                destroyed: false,
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_00',
                },
            ],

            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_01',
                },
            ],


            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_02',
                },
            ],
        ]);
    });

    it(
        'forwards absorbed beamCannon outcome to beam presentation',
        () => {
            const emit =
                vi.fn();

            const handler =
                new BridgeEncounterEngineEventHandler({
                    emit,
                } as unknown as BridgeEventBus);

            handler.handle([
                {
                    type:
                        ENCOUNTER_EVENT
                            .BEAM_CANNON_FIRED,

                    attack: {
                        id:
                            'beam_cannon_attack_absorbed_00',

                        designation:
                            'L1',

                        sourceActorId:
                            'ship_enemy_00',

                        sourceWeaponId:
                            'beam_cannon_enemy_00',

                        target: {
                            kind:
                                COMBAT_TARGET_KIND
                                    .PLAYER_SHIP,
                        },
                    },

                    outcome:
                        BEAM_CANNON_SHOT_OUTCOME
                            .ABSORBED,
                },
            ]);

            expect(
                emit.mock.calls,
            ).toEqual([
                [
                    BRIDGE_EVENT
                        .BEAM_CANNON_THREAT_REMOVED,

                    {
                        attackId:
                            'beam_cannon_attack_absorbed_00',
                    },
                ],

                [
                    BRIDGE_EVENT
                        .BEAM_CANNON_BEAM_FIRED,

                    {
                        sourceActorId:
                            'ship_enemy_00',

                        outcome:
                            BEAM_CANNON_SHOT_OUTCOME
                                .ABSORBED,
                    },
                ],
            ]);
        },
    );

    it(
        'maps player shield lifecycle to bridge presentation events',
        () => {
            const emit =
                vi.fn();

            const handler =
                new BridgeEncounterEngineEventHandler({
                    emit,
                } as unknown as BridgeEventBus);

            handler.handle([
                {
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_SHIELD_DEPLOYED,

                    shield: {
                        sourceEmitterId:
                            'shield_generator_player_00',

                        remainingDurationMs:
                            5000,

                        initialDurationMs:
                            5000,
                    },
                },

                {
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_SHIELD_ENDED,

                    shield: {
                        sourceEmitterId:
                            'shield_generator_player_00',

                        remainingDurationMs:
                            3200,

                        initialDurationMs:
                            5000,
                    },

                    outcome:
                        PLAYER_SHIELD_END_OUTCOME
                            .ABSORBED,
                },
            ]);

            expect(
                emit.mock.calls,
            ).toEqual([
                [
                    BRIDGE_EVENT
                        .PLAYER_SHIELD_DEPLOYED,

                    {
                        remainingDurationMs:
                            5000,

                        initialDurationMs:
                            5000,
                    },
                ],

                [
                    BRIDGE_EVENT
                        .PLAYER_SHIELD_ENDED,

                    {
                        outcome:
                            PLAYER_SHIELD_END_OUTCOME
                                .ABSORBED,
                    },
                ],
            ]);
        },
    );

    it('maps a completed defense-turret shot to bridge presentation', () => {
        const emit = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler = new BridgeEncounterEngineEventHandler(eventBus);

        handler.handle([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    id: 'task_1',

                    kind: OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET,
                    role: OFFICER_ROLE.WEAPONS,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,

                    threatId: 'projectile_test_00',

                    label: 'TURRET AIM',
                    showProgress: true,

                    durationMs: 3000,
                    elapsedMs: 3000,

                    canBeCancelledByPlayer: true,
                    canBeInterruptedByDamage: true,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.DEFENSE_TURRET_FIRED,

                    threatId: 'projectile_test_00',

                    outcome: DEFENSE_TURRET_SHOT_OUTCOME.HIT,
                },
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.DEFENSE_TURRET_FIRED,

                {
                    projectileId: 'projectile_test_00',

                    outcome: DEFENSE_TURRET_SHOT_OUTCOME.HIT,
                },
            ],
        ]);

    });
});
