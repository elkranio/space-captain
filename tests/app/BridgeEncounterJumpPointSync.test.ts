// tests/app/BridgeEncounterJumpPointSync.test.ts

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/app/scenes/game/bridge/controller/encounter/encounter_objects/BridgeEncounterObjectMapper', () => {
    return {
        mapEncounterAnchorToBridgeObjectPayload: (anchor: { id: string }) => {
            return {
                id: anchor.id,
                anchorObjectId: anchor.id,
            };
        },

        mapEncounterSpaceToBridgeObjectPayloads: () => {
            return [];
        },
    };
});

import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterPersistenceSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/BridgeEncounterPersistenceSynchronizer';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import { JUMP_POINT_OBJECT_SPRITE_ID } from '../../src/engine/defs/jump_point';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import { SPACE_ANCHOR_KIND } from '../../src/engine/defs/universe';
import { ENCOUNTER_ANCHOR_KIND } from '../../src/engine/encounter/anchors/encounter_anchor';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
    type EncounterEvent,
} from '../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../src/engine/encounter/model/officer_task';
import { getCurrentNode } from '../../src/engine/universe/queries/get_current_node';

describe('Bridge encounter jump-point sync', () => {
    it('persists a calculated jump point and adds its bridge object', () => {
        const runtime = new GameRuntime();
        const emit = vi.fn();

        const handler = new BridgeEncounterEngineEventHandler(
            {
                emit,
            } as unknown as BridgeEventBus,
        );

        const persistenceSynchronizer =
            new BridgeEncounterPersistenceSynchronizer(
                runtime,
            );

        const event: EncounterEvent = {
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    id: 'task_1',

                    kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,
                    role: OFFICER_ROLE.SCIENCE,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

                    targetNodeId: 'node_station',

                    label: 'PLOT COURSE',
                    showProgress: true,

                    durationMs: 5000,
                    elapsedMs: 5000,

                    canBeCancelledByPlayer: true,
                    canBeInterruptedByDamage: true,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED,

                    anchor: {
                        id: 'jump_point_node_station',
                        kind: ENCOUNTER_ANCHOR_KIND.JUMP_POINT,
                        displayName: 'JUMP POINT',

                        jumpPoint: {
                            id: 'jump_point_node_station',
                            name: 'JUMP POINT',
                            targetNodeId: 'node_station',
                            objectSpriteId: JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT_00,
                        },

                        localPosition: {
                            x: 1500,
                            y: -250,
                            z: 700,
                        },

                        position: {
                            x: 0,
                            y: 0,
                        },

                        perspectiveDepth: 1,
                    },
                },
            };

        persistenceSynchronizer.syncEvent(event);
        handler.handle(event);

        expect(getCurrentNode(runtime.getCurrentRun()).anchors).toContainEqual({
            kind: SPACE_ANCHOR_KIND.JUMP_POINT,

            jumpPoint: {
                id: 'jump_point_node_station',
                name: 'JUMP POINT',
                targetNodeId: 'node_station',
                objectSpriteId: JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT_00,
            },

            localPosition: {
                x: 1500,
                y: -250,
                z: 700,
            },
        });

        expect(emit).toHaveBeenCalledWith(BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED, {
            id: 'jump_point_node_station',
            anchorObjectId: 'jump_point_node_station',
        });
    });
});
