// tests/app/BridgeEncounterEngineEventHandler.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { SCENE_KEY } from '../../src/app/scenes/scene_key';
import { MISSILE_ID } from '../../src/engine/defs/missile';
import { COMBAT_PROJECTILE_KIND } from '../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../src/engine/encounter/model/event';

const launchedProjectile = {
    id: 'projectile_test_00',

    kind: COMBAT_PROJECTILE_KIND.MISSILE,

    sourceActorId: 'ship_enemy_00',
    sourceWeaponId: 'missile_launcher_00',

    missileId: MISSILE_ID.HEAT_00,

    timeToImpactMs: 4000,
    initialTimeToImpactMs: 4000,
};

const impactedProjectile = {
    ...launchedProjectile,

    timeToImpactMs: 0,
};

describe('BridgeEncounterEngineEventHandler combat events', () => {
    it('accepts targeting and missile launch events before combat visuals exist', () => {
        const runtime = new GameRuntime();

        const emit = vi.fn();
        const setEncounterInteractive = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler = new BridgeEncounterEngineEventHandler(eventBus, setEncounterInteractive, runtime);

        expect(() => {
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
        }).not.toThrow();

        expect(runtime.getCurrentRun().player.ship.hull).toBe(3);

        expect(emit).not.toHaveBeenCalled();
        expect(setEncounterInteractive).not.toHaveBeenCalled();
    });

    it('damages persistent hull and requests END only when the ship is first destroyed', () => {
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

        expect(emit).not.toHaveBeenCalled();
        expect(setEncounterInteractive).not.toHaveBeenCalled();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    ...impactedProjectile,
                    id: 'projectile_test_01',
                },

                damage: 2,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(0);

        expect(setEncounterInteractive).toHaveBeenCalledTimes(1);
        expect(setEncounterInteractive).toHaveBeenCalledWith(false);

        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith(
            BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED,

            {
                sceneKey: SCENE_KEY.END,
            },
        );

        // Повторный impact по уже уничтоженному кораблю
        // не должен повторно запускать scene transition.
        handler.handle([
            {
                type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

                projectile: {
                    ...impactedProjectile,
                    id: 'projectile_test_02',
                },

                damage: 1,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(0);

        expect(setEncounterInteractive).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledTimes(1);
    });
});
