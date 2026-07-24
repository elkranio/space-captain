// src/app/runtime/GameRuntime.ts

import { createNewRunState } from '../../engine/content/new_game';
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from '../../engine/defs/player_location';
import type { RunState } from '../../engine/defs/run';
import { SPACE_OBJECT_KIND, type SpaceObjectState } from '../../engine/defs/universe';
import { getCurrentNode } from '../../engine/universe/queries/get_current_node';

type PlayerLocationChangedListener = () => void;
type CurrentNodeObjectsChangedListener = () => void;

// Runtime текущей игровой сессии.
//
// Владеет persistent RunState и предоставляет контролируемые mutations.
// После изменения player location уведомляет app-слой,
// чтобы постоянные UI-системы могли перечитать актуальное состояние.
class GameRuntime {
    private readonly currentRun: RunState = createNewRunState();
    private readonly playerLocationChangedListeners = new Set<PlayerLocationChangedListener>();
    private readonly currentNodeObjectsChangedListeners = new Set<CurrentNodeObjectsChangedListener>();

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

    public addCurrentNodeObject(object: SpaceObjectState): void {
        const location = this.currentRun.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot add space object for player location: ${location.kind}`);
        }

        const node = getCurrentNode(this.currentRun);
        const objectId = this.getSpaceObjectId(object);

        const existingObject = node.objects.find((candidate) => {
            return this.getSpaceObjectId(candidate) === objectId;
        });

        if (existingObject) {
            throw new Error(`Current node already contains space object: ${objectId}`);
        }

        node.objects.push(object);

        this.emitCurrentNodeObjectsChanged();
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
        const anchorObjectId = location.navigation.anchorObjectId;

        const anchorObject = sourceNode.objects.find((object) => {
            return this.getSpaceObjectId(object) === anchorObjectId;
        });

        if (!anchorObject) {
            throw new Error(`Jump anchor object not found: ${anchorObjectId}`);
        }

        if (anchorObject.kind !== SPACE_OBJECT_KIND.JUMP_POINT) {
            throw new Error(`Cannot jump from space object: ${anchorObject.kind}`);
        }

        if (anchorObject.jumpPoint.targetNodeId !== targetNodeId) {
            throw new Error(
                `Jump point destination does not match requested node: ` +
                    `${anchorObject.jumpPoint.targetNodeId} !== ${targetNodeId}`,
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

        const arrivalObject = targetNode.objects.find((object) => {
            return this.getSpaceObjectId(object) === targetNode.arrivalObjectId;
        });

        if (!arrivalObject) {
            throw new Error(`Jump destination arrival object not found: ${targetNode.arrivalObjectId}`);
        }

        // Все рассчитанные искажения принадлежат старому node visit.
        sourceNode.objects = sourceNode.objects.filter((object) => {
            return object.kind !== SPACE_OBJECT_KIND.JUMP_POINT;
        });

        this.currentRun.player.location = {
            kind: PLAYER_LOCATION_KIND.SPACE,
            nodeId: targetNode.id,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,
                targetObjectId: targetNode.arrivalObjectId,
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

    public onCurrentNodeObjectsChanged(listener: CurrentNodeObjectsChangedListener): void {
        this.currentNodeObjectsChangedListeners.add(listener);
    }

    public offCurrentNodeObjectsChanged(listener: CurrentNodeObjectsChangedListener): void {
        this.currentNodeObjectsChangedListeners.delete(listener);
    }

    private emitPlayerLocationChanged(): void {
        for (const listener of [...this.playerLocationChangedListeners]) {
            listener();
        }
    }

    private emitCurrentNodeObjectsChanged(): void {
        for (const listener of [...this.currentNodeObjectsChangedListeners]) {
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

    private getSpaceObjectId(object: SpaceObjectState): string {
        switch (object.kind) {
            case SPACE_OBJECT_KIND.STATION:
                return object.station.id;

            case SPACE_OBJECT_KIND.NAVIGATION_BEACON:
                return object.beacon.id;

            case SPACE_OBJECT_KIND.ASTEROID:
                return object.asteroid.id;

            case SPACE_OBJECT_KIND.JUMP_POINT:
                return object.jumpPoint.id;

            default:
                return this.assertNever(object);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled player navigation: ${String(value)}`);
    }
}

export const GAME_RUNTIME = new GameRuntime();
