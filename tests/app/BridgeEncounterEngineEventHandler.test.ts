// tests/app/BridgeEncounterEngineEventHandler.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { SCENE_KEY } from '../../src/app/scenes/scene_key';
import { MISSILE_ID } from '../../src/engine/defs/missile';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
    type MissileCombatProjectileState,
} from '../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../src/engine/encounter/model/event';

const launchedProjectile: MissileCombatProjectileState = {
    id: 'projectile_test_00',
    designation: 'M1',

    kind: COMBAT_PROJECTILE_KIND.MISSILE,

    sourceActorId: 'ship_enemy_00',

    sourceWeaponId: 'missile_launcher_00',

    target: {
        kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
    },

    identification: {
        status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
    },

    missileId: MISSILE_ID.RED_00,

    timeToImpactMs: 12000,
    initialTimeToImpactMs: 12000,
};

const impactedProjectile: MissileCombatProjectileState = {
    ...launchedProjectile,

    timeToImpactMs: 0,
};

describe('BridgeEncounterEngineEventHandler combat events', () => {
    it('maps targeting and missile launch to bridge presentation events', () => {
        const runtime = new GameRuntime();

        const emit = vi.fn();

        const setEncounterInteractive = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler = new BridgeEncounterEngineEventHandler(eventBus, setEncounterInteractive, runtime);

        handler.handle([
            {
                type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

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

        expect(runtime.getCurrentRun().player.ship.hull).toBe(3);

        expect(emit.mock.calls).toEqual([
            [BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED],

            [BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED],

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

        expect(setEncounterInteractive).not.toHaveBeenCalled();
    });

    it('updates hull status and requests END only on first destruction', () => {
        const runtime = new GameRuntime();

        const emit = vi.fn();

        const setEncounterInteractive = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler = new BridgeEncounterEngineEventHandler(eventBus, setEncounterInteractive, runtime);

        handler.handle([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    ...impactedProjectile,
                },

                damage: 1,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(2);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_00',
                },
            ],

            [
                BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

                {
                    hull: {
                        current: 2,
                        max: 3,
                    },
                },
            ],
        ]);

        expect(setEncounterInteractive).not.toHaveBeenCalled();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    ...impactedProjectile,

                    id: 'projectile_test_01',

                    designation: 'M2',
                },

                damage: 2,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(0);

        expect(setEncounterInteractive).toHaveBeenCalledTimes(1);

        expect(setEncounterInteractive).toHaveBeenCalledWith(false);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_00',
                },
            ],

            [
                BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

                {
                    hull: {
                        current: 2,
                        max: 3,
                    },
                },
            ],

            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_01',
                },
            ],

            [
                BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

                {
                    hull: {
                        current: 0,
                        max: 3,
                    },
                },
            ],

            [
                BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED,

                {
                    sceneKey: SCENE_KEY.END,
                },
            ],
        ]);

        // Повторный synthetic impact
        // не меняет hull и не запускает
        // второй status/transition event.
        handler.handle([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    ...impactedProjectile,

                    id: 'projectile_test_02',

                    designation: 'M3',
                },

                damage: 1,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(0);

        expect(setEncounterInteractive).toHaveBeenCalledTimes(1);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_00',
                },
            ],

            [
                BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

                {
                    hull: {
                        current: 2,
                        max: 3,
                    },
                },
            ],

            [
                BRIDGE_EVENT.INCOMING_MISSILE_REMOVED,

                {
                    projectileId: 'projectile_test_01',
                },
            ],

            [
                BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

                {
                    hull: {
                        current: 0,
                        max: 3,
                    },
                },
            ],

            [
                BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED,

                {
                    sceneKey: SCENE_KEY.END,
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
});
