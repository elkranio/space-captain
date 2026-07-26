// src/app/runtime/GameRuntime.ts

import { createNewRunState } from '../../engine/content/new_game';
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from '../../engine/defs/player_location';
import type { RunState } from '../../engine/defs/run';
import { SPACE_ANCHOR_KIND, type SpaceAnchorState } from '../../engine/defs/universe';
import { getCurrentNode } from '../../engine/universe/queries/get_current_node';

type PlayerLocationChangedListener = () => void;
type CurrentNodeAnchorsChangedListener = () => void;

// Runtime текущей игровой сессии.
//
// Владеет persistent RunState и предоставляет контролируемые mutations.
// После изменения player location уведомляет app-слой,
// чтобы постоянные UI-системы могли перечитать актуальное состояние.
class GameRuntime {
    private readonly currentRun: RunState = createNewRunState();

    private readonly playerLocationChangedListeners = new Set<PlayerLocationChangedListener>();

    private readonly currentNodeAnchorsChangedListeners = new Set<CurrentNodeAnchorsChangedListener>();

    public getCurrentRun(): RunState {
        return this.currentRun;
    }

    public setPlayerSpaceNavigation(navigation: PlayerSpaceNavigationState): void {
        const location = this.currentRun.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot set space navigation for player location: ${location.kind}`);
        }

        if (this.isSamePlayerSpaceNavigation(location.navigation, navigation)) {
            return;
        }

        location.navigation = {
            ...navigation,
        };

        this.emitPlayerLocationChanged();
    }

    public addCurrentNodeAnchor(anchor: SpaceAnchorState): void {
        const location = this.currentRun.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot add space anchor for player location: ${location.kind}`);
        }

        const node = getCurrentNode(this.currentRun);
        const anchorId = this.getSpaceAnchorId(anchor);

        const existingAnchor = node.anchors.find((candidate) => {
            return this.getSpaceAnchorId(candidate) === anchorId;
        });

        if (existingAnchor) {
            throw new Error(`Current node already contains space anchor: ${anchorId}`);
        }

        node.anchors.push(anchor);

        this.emitCurrentNodeAnchorsChanged();
    }

    public jumpPlayerToNode(targetNodeId: string): void {
        const location = this.currentRun.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot jump from player location: ${location.kind}`);
        }

        if (location.navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            throw new Error(`Cannot jump from space navigation state: ${location.navigation.kind}`);
        }

        const sourceNode = getCurrentNode(this.currentRun);
        const anchorId = location.navigation.anchorObjectId;

        const anchor = sourceNode.anchors.find((candidate) => {
            return this.getSpaceAnchorId(candidate) === anchorId;
        });

        if (!anchor) {
            throw new Error(`Jump anchor not found: ${anchorId}`);
        }

        if (anchor.kind !== SPACE_ANCHOR_KIND.JUMP_POINT) {
            throw new Error(`Cannot jump from space anchor: ${anchor.kind}`);
        }

        if (anchor.jumpPoint.targetNodeId !== targetNodeId) {
            throw new Error(
                `Jump point destination does not match requested node: ` +
                    `${anchor.jumpPoint.targetNodeId} !== ${targetNodeId}`,
            );
        }

        const targetNode = this.currentRun.universe.nodes.find((node) => {
            return node.id === targetNodeId;
        });

        if (!targetNode) {
            throw new Error(`Jump destination node not found: ${targetNodeId}`);
        }

        if (targetNode.id === sourceNode.id) {
            throw new Error(`Cannot jump to current node: ${targetNodeId}`);
        }

        const arrivalAnchor = targetNode.anchors.find((candidate) => {
            return this.getSpaceAnchorId(candidate) === targetNode.arrivalAnchorId;
        });

        if (!arrivalAnchor) {
            throw new Error(`Jump destination arrival anchor not found: ${targetNode.arrivalAnchorId}`);
        }

        // Все рассчитанные искажения принадлежат старому node visit.
        sourceNode.anchors = sourceNode.anchors.filter((candidate) => {
            return candidate.kind !== SPACE_ANCHOR_KIND.JUMP_POINT;
        });

        this.currentRun.player.location = {
            kind: PLAYER_LOCATION_KIND.SPACE,
            nodeId: targetNode.id,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,

                // Navigation IDs переименуем отдельным атомом.
                targetObjectId: targetNode.arrivalAnchorId,
            },
        };

        this.emitPlayerLocationChanged();
    }

    public onPlayerLocationChanged(listener: PlayerLocationChangedListener): void {
        this.playerLocationChangedListeners.add(listener);
    }

    public offPlayerLocationChanged(listener: PlayerLocationChangedListener): void {
        this.playerLocationChangedListeners.delete(listener);
    }

    public onCurrentNodeAnchorsChanged(listener: CurrentNodeAnchorsChangedListener): void {
        this.currentNodeAnchorsChangedListeners.add(listener);
    }

    public offCurrentNodeAnchorsChanged(listener: CurrentNodeAnchorsChangedListener): void {
        this.currentNodeAnchorsChangedListeners.delete(listener);
    }

    private emitPlayerLocationChanged(): void {
        for (const listener of [...this.playerLocationChangedListeners]) {
            listener();
        }
    }

    private emitCurrentNodeAnchorsChanged(): void {
        for (const listener of [...this.currentNodeAnchorsChangedListeners]) {
            listener();
        }
    }

    private isSamePlayerSpaceNavigation(
        current: PlayerSpaceNavigationState,
        next: PlayerSpaceNavigationState,
    ): boolean {
        switch (current.kind) {
            case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
                return (
                    next.kind === PLAYER_SPACE_NAVIGATION_KIND.ARRIVING &&
                    current.targetObjectId === next.targetObjectId
                );

            case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
                return (
                    next.kind === PLAYER_SPACE_NAVIGATION_KIND.ANCHORED &&
                    current.anchorObjectId === next.anchorObjectId
                );

            case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
                return (
                    next.kind === PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING &&
                    current.fromObjectId === next.fromObjectId &&
                    current.targetObjectId === next.targetObjectId
                );

            default:
                return this.assertNever(current);
        }
    }

    private getSpaceAnchorId(anchor: SpaceAnchorState): string {
        switch (anchor.kind) {
            case SPACE_ANCHOR_KIND.STATION:
                return anchor.station.id;

            case SPACE_ANCHOR_KIND.NAVIGATION_BEACON:
                return anchor.beacon.id;

            case SPACE_ANCHOR_KIND.ASTEROID:
                return anchor.asteroid.id;

            case SPACE_ANCHOR_KIND.JUMP_POINT:
                return anchor.jumpPoint.id;

            default:
                return this.assertNever(anchor);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled GameRuntime state: ${String(value)}`);
    }
}

export const GAME_RUNTIME = new GameRuntime();
