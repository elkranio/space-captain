// src/app/runtime/GameRuntime.ts
import { createNewRunState } from '../../engine/content/new_game';
import type { RunState } from '../../engine/defs/run';

class GameRuntime {
    private readonly currentRun: RunState = createNewRunState();

    public getCurrentRun(): RunState {
        return this.currentRun;
    }
}

export const GAME_RUNTIME = new GameRuntime();
