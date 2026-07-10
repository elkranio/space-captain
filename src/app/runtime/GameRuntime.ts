// src\app\runtime\GameRuntime.ts

import { NEW_GAME, type NewGameDefinition } from '../../engine/content/new_game';

class GameRuntime {
    private currentGame: NewGameDefinition = NEW_GAME;

    public getCurrentGame(): NewGameDefinition {
        return this.currentGame;
    }
}

export const GAME_RUNTIME = new GameRuntime();
