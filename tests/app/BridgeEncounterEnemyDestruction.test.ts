// tests/app/BridgeEncounterEnemyDestruction.test.ts

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import BridgeEncounterPersistenceSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/BridgeEncounterPersistenceSynchronizer';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import {
    BRIDGE_EVENT,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../src/engine/encounter/model/event';
import {
    getCurrentNode,
} from '../../src/engine/universe/queries/get_current_node';

describe('Bridge enemy destruction flow', () => {
    it('removes the persistent actor and starts local destruction presentation without pausing encounter or END', () => {
        const runtime =
            new GameRuntime();

        const node =
            getCurrentNode(
                runtime.getCurrentRun(),
            );

        const actor =
            node.actors[0];

        if (!actor) {
            throw new Error(
                'Expected current node actor',
            );
        }

        const emit = vi.fn();

        const setEncounterInteractive =
            vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler =
            new BridgeEncounterEngineEventHandler(
                eventBus,

                setEncounterInteractive,
            );

        const persistenceSynchronizer =
            new BridgeEncounterPersistenceSynchronizer(
                runtime,
            );

        const event: EncounterEvent = {
            type:
                ENCOUNTER_EVENT
                    .ENEMY_SHIP_DESTROYED,

            actorId:
                actor.id,
        };

        persistenceSynchronizer.syncEvent(event);
        handler.handle([event]);

        expect(
            node.actors.some(
                (candidate) => {
                    return (
                        candidate.id ===
                        actor.id
                    );
                },
            ),
        ).toBe(false);

        expect(
            setEncounterInteractive,
        ).not.toHaveBeenCalled();

        expect(
            emit.mock.calls,
        ).toEqual([
            [
                BRIDGE_EVENT
                    .ENEMY_ATTACK_WARNING_CLEARED,
            ],

            [
                BRIDGE_EVENT
                    .ENEMY_SHIP_DESTRUCTION_STARTED,

                {
                    actorId:
                        actor.id,
                },
            ],

            [
                BRIDGE_EVENT
                    .ENCOUNTER_OBJECT_REMOVED,

                {
                    objectId:
                        actor.id,
                },
            ],
        ]);

        expect(
            emit.mock.calls.some(
                ([eventName]) => {
                    return (
                        eventName ===
                        BRIDGE_EVENT
                            .SCENE_TRANSITION_REQUESTED
                    );
                },
            ),
        ).toBe(false);
    });
});
