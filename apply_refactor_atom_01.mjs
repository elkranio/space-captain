import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function write(relativePath, content) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
}

function replaceOnce(content, search, replacement, label) {
    const firstIndex = content.indexOf(search);

    if (firstIndex < 0) {
        throw new Error(`Patch target not found: ${label}`);
    }

    if (content.indexOf(search, firstIndex + search.length) >= 0) {
        throw new Error(`Patch target is not unique: ${label}`);
    }

    return (
        content.slice(0, firstIndex) +
        replacement +
        content.slice(firstIndex + search.length)
    );
}

const controllerPath =
    'src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts';

let controller = read(controllerPath);

controller = replaceOnce(
    controller,
    `import { SPACE_ANCHOR_KIND } from '../../../../../../engine/defs/universe';\n`,
    '',
    'remove SPACE_ANCHOR_KIND import from BridgeEncounterController',
);

controller = replaceOnce(
    controller,
    `import {\n    ENCOUNTER_EVENT,\n    OFFICER_TASK_RESULT_KIND,\n    type EncounterEvent,\n} from '../../../../../../engine/encounter/model/event';\n`,
    '',
    'remove encounter-event imports from BridgeEncounterController',
);

controller = replaceOnce(
    controller,
    `        this.syncRuntimeAnchorsFromEncounterEvents(events);\n        this.engineEventHandler.handle(events);\n`,
    `        this.engineEventHandler.handle(events);\n`,
    'remove separate runtime-anchor event pass',
);

controller = replaceOnce(
    controller,
    `\n    private syncRuntimeAnchorsFromEncounterEvents(events: EncounterEvent[]): void {\n        for (const event of events) {\n            if (event.type !== ENCOUNTER_EVENT.OFFICER_TASK_ENDED) {\n                continue;\n            }\n\n            if (event.result?.kind !== OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED) {\n                continue;\n            }\n\n            const anchor = event.result.anchor;\n\n            GAME_RUNTIME.addCurrentNodeAnchor({\n                kind: SPACE_ANCHOR_KIND.JUMP_POINT,\n\n                jumpPoint: {\n                    ...anchor.jumpPoint,\n                },\n\n                localPosition: {\n                    ...anchor.localPosition,\n                },\n            });\n        }\n    }\n`,
    '',
    'remove syncRuntimeAnchorsFromEncounterEvents',
);

write(controllerPath, controller);

const handlerPath =
    'src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler.ts';

let handler = read(handlerPath);

handler = replaceOnce(
    handler,
    `import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../engine/defs/player_location';\n`,
    `import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../../../engine/defs/player_location';\nimport { SPACE_ANCHOR_KIND } from '../../../../../../../engine/defs/universe';\n`,
    'add SPACE_ANCHOR_KIND import to BridgeEncounterEngineEventHandler',
);

handler = replaceOnce(
    handler,
    `            case ENCOUNTER_EVENT.OFFICER_TASK_ENDED:\n                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED) {\n                    this.eventBus.emit(\n                        BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED,\n                        mapEncounterAnchorToBridgeObjectPayload(event.result.anchor),\n                    );\n                }\n`,
    `            case ENCOUNTER_EVENT.OFFICER_TASK_ENDED:\n                if (event.result?.kind === OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED) {\n                    const anchor = event.result.anchor;\n\n                    this.gameRuntime.addCurrentNodeAnchor({\n                        kind: SPACE_ANCHOR_KIND.JUMP_POINT,\n\n                        jumpPoint: {\n                            ...anchor.jumpPoint,\n                        },\n\n                        localPosition: {\n                            ...anchor.localPosition,\n                        },\n                    });\n\n                    this.eventBus.emit(\n                        BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED,\n                        mapEncounterAnchorToBridgeObjectPayload(anchor),\n                    );\n                }\n`,
    'persist jump point inside BridgeEncounterEngineEventHandler',
);

write(handlerPath, handler);

const testPath =
    'tests/app/BridgeEncounterJumpPointSync.test.ts';

if (fs.existsSync(path.join(root, testPath))) {
    throw new Error(`Refusing to overwrite existing file: ${testPath}`);
}

write(
    testPath,
    `// tests/app/BridgeEncounterJumpPointSync.test.ts\n\nimport { describe, expect, it, vi } from 'vitest';\nimport { GameRuntime } from '../../src/app/runtime/GameRuntime';\nimport BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';\nimport { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';\nimport type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';\nimport { JUMP_POINT_OBJECT_SPRITE_ID } from '../../src/engine/defs/jump_point';\nimport { OFFICER_ROLE } from '../../src/engine/defs/officer';\nimport { SPACE_ANCHOR_KIND } from '../../src/engine/defs/universe';\nimport { ENCOUNTER_ANCHOR_KIND } from '../../src/engine/encounter/anchors/encounter_anchor';\nimport { ENCOUNTER_OFFICER_COMMAND_ID } from '../../src/engine/encounter/model/command';\nimport {\n    ENCOUNTER_EVENT,\n    OFFICER_TASK_OUTCOME,\n    OFFICER_TASK_RESULT_KIND,\n} from '../../src/engine/encounter/model/event';\nimport { OFFICER_TASK_KIND } from '../../src/engine/encounter/model/officer_task';\nimport { getCurrentNode } from '../../src/engine/universe/queries/get_current_node';\n\ndescribe('Bridge encounter jump-point sync', () => {\n    it('persists a calculated jump point and adds its bridge object', () => {\n        const runtime = new GameRuntime();\n        const emit = vi.fn();\n\n        const handler = new BridgeEncounterEngineEventHandler(\n            {\n                emit,\n            } as unknown as BridgeEventBus,\n\n            vi.fn(),\n            runtime,\n        );\n\n        handler.handle([\n            {\n                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,\n\n                task: {\n                    id: 'task_1',\n\n                    kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,\n                    role: OFFICER_ROLE.SCIENCE,\n\n                    sourceCommandId:\n                        ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,\n\n                    targetNodeId: 'node_station',\n\n                    label: 'PLOT COURSE',\n                    showProgress: true,\n\n                    durationMs: 5000,\n                    elapsedMs: 5000,\n\n                    canBeCancelledByPlayer: true,\n                    canBeInterruptedByDamage: true,\n                },\n\n                outcome: OFFICER_TASK_OUTCOME.COMPLETED,\n\n                result: {\n                    kind:\n                        OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED,\n\n                    anchor: {\n                        id: 'jump_point_node_station',\n                        kind: ENCOUNTER_ANCHOR_KIND.JUMP_POINT,\n                        displayName: 'JUMP POINT',\n\n                        jumpPoint: {\n                            id: 'jump_point_node_station',\n                            name: 'JUMP POINT',\n                            targetNodeId: 'node_station',\n                            objectSpriteId:\n                                JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT_00,\n                        },\n\n                        localPosition: {\n                            x: 1500,\n                            y: -250,\n                            z: 700,\n                        },\n\n                        position: {\n                            x: 0,\n                            y: 0,\n                        },\n\n                        perspectiveDepth: 1,\n                    },\n                },\n            },\n        ]);\n\n        expect(getCurrentNode(runtime.getCurrentRun()).anchors).toContainEqual({\n            kind: SPACE_ANCHOR_KIND.JUMP_POINT,\n\n            jumpPoint: {\n                id: 'jump_point_node_station',\n                name: 'JUMP POINT',\n                targetNodeId: 'node_station',\n                objectSpriteId:\n                    JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT_00,\n            },\n\n            localPosition: {\n                x: 1500,\n                y: -250,\n                z: 700,\n            },\n        });\n\n        expect(emit).toHaveBeenCalledWith(\n            BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED,\n            expect.objectContaining({\n                id: 'jump_point_node_station',\n                anchorObjectId: 'jump_point_node_station',\n            }),\n        );\n\n        expect(emit).toHaveBeenCalledWith(\n            BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED,\n            {\n                role: OFFICER_ROLE.SCIENCE,\n            },\n        );\n    });\n});\n`,
);

console.log('Applied refactor atom 01: jump-point runtime sync ownership.');
console.log('Created:', testPath);
