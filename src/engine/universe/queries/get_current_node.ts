// src/engine/universe/queries/get_current_node.ts

import type { RunState } from '../../defs/run';
import type { SpaceNodeState } from '../../defs/universe';

// Возвращает node, в которой сейчас находится игрок.
//
// Player location хранит nodeId как в SPACE, так и в STATION,
// поэтому запрос не зависит от конкретного типа локации.
export function getCurrentNode(run: RunState): SpaceNodeState {
    const nodeId = run.player.location.nodeId;

    const node = run.universe.nodes.find((candidate) => candidate.id === nodeId);

    if (!node) {
        throw new Error(`Current space node not found: ${nodeId}`);
    }

    return node;
}
