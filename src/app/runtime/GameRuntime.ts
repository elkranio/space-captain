// src/app/runtime/GameRuntime.ts

import { createNewRunState } from '../../engine/content/new_game';
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from '../../engine/defs/player_location';
import type { RunState } from '../../engine/defs/run';

type PlayerLocationChangedListener = () => void;

// Runtime текущей игровой сессии.
//
// Владеет persistent RunState и предоставляет контролируемые mutations.
// После изменения player location уведомляет app-слой,
// чтобы постоянные UI-системы могли перечитать актуальное состояние.
class GameRuntime {
    private readonly currentRun: RunState = createNewRunState();

    private readonly playerLocationChangedListeners = new Set<PlayerLocationChangedListener>();

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

    public onPlayerLocationChanged(listener: PlayerLocationChangedListener): void {
        this.playerLocationChangedListeners.add(listener);
    }

    public offPlayerLocationChanged(listener: PlayerLocationChangedListener): void {
        this.playerLocationChangedListeners.delete(listener);
    }

    private emitPlayerLocationChanged(): void {
        for (const listener of [...this.playerLocationChangedListeners]) {
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

    private assertNever(value: never): never {
        throw new Error(`Unhandled player navigation: ${String(value)}`);
    }
}

export const GAME_RUNTIME = new GameRuntime();
