// src/app/scenes/game/init/controller/InitController.ts
import { PLAYER_LOCATION_KIND, type PlayerLocationState } from '../../../../../engine/defs/player_location';
import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import { SCENE_KEY, type SceneKey } from '../../../scene_key';
import type InitScene from '../InitScene';

export default class InitController {
    constructor(private readonly scene: InitScene) {}

    public start(): void {
        const run = GAME_RUNTIME.getCurrentRun();
        const nextSceneKey = this.getSceneKeyByPlayerLocation(run.player.location);

        this.scene.scene.start(nextSceneKey);
    }

    private getSceneKeyByPlayerLocation(location: PlayerLocationState): SceneKey {
        switch (location.kind) {
            case PLAYER_LOCATION_KIND.SPACE:
                return SCENE_KEY.BRIDGE;

            case PLAYER_LOCATION_KIND.STATION:
                throw new Error('Station scene is not implemented yet');

            default:
                return this.assertNever(location);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled player location: ${String(value)}`);
    }
}
