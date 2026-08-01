// tests/runtime/GameRuntimeCurrentNodeActors.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import {
    getCurrentNode,
} from '../../src/engine/universe/queries/get_current_node';

describe('GameRuntime current node actors', () => {
    it('removes a destroyed actor from persistent current node state', () => {
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

        runtime.removeCurrentNodeActor(
            actor.id,
        );

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

        expect(() => {
            runtime.removeCurrentNodeActor(
                actor.id,
            );
        }).toThrow(
            'Current node actor not found',
        );
    });
});
