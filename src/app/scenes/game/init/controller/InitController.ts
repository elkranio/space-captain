// src\app\scenes\game\init\controller\InitController.ts

import { NEW_GAME } from '../../../../../engine/content/new_game';
import { GAME_LOCATION, type GameLocation } from '../../../../../engine/defs/game_location';
import { SCENE_KEY, type SceneKey } from '../../../scene_key';
import type InitScene from '../InitScene';

export default class InitController {
    constructor(private readonly scene: InitScene) {}

    start(): void {
        const nextSceneKey = this.getSceneKeyByGameLocation(NEW_GAME.game_location);
        this.scene.scene.start(nextSceneKey);
    }

    private getSceneKeyByGameLocation(gameLocation: GameLocation): SceneKey {
        switch (gameLocation) {
            case GAME_LOCATION.BRIDGE:
                return SCENE_KEY.BRIDGE;

            default:
                return this.assertNever(gameLocation);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled game location: ${String(value)}`);
    }
}
