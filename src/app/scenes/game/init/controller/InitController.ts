// src/app/scenes/game/init/controller/InitController.ts

import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import { GAME_LOCATION_ID, type GameLocationId } from '../../../../../engine/defs/game_location';
import { SCENE_KEY, type SceneKey } from '../../../scene_key';
import type InitScene from '../InitScene';

export default class InitController {
    constructor(private readonly scene: InitScene) {}

    public start(): void {
        const game = GAME_RUNTIME.getCurrentGame();
        const nextSceneKey = this.getSceneKeyByGameLocation(game.game_location);

        this.scene.scene.start(nextSceneKey);
    }

    private getSceneKeyByGameLocation(gameLocation: GameLocationId): SceneKey {
        switch (gameLocation) {
            case GAME_LOCATION_ID.BRIDGE:
                return SCENE_KEY.BRIDGE;
            default:
                return this.assertNever(gameLocation);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled game location: ${String(value)}`);
    }
}
