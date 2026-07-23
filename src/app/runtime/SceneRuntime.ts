// src/app/runtime/SceneRuntime.ts

import { SCENE_KEY, type SceneKey } from '../scenes/scene_key';

// Технический runtime для управления Phaser scenes.
//
// Не хранит game state и не содержит domain rules.
// Гарантирует, что постоянный game overlay:
// - запущен;
// - переживает смену основной сцены;
// - находится поверх основной сцены.
class SceneRuntime {
    public startGameScene(scene: Phaser.Scene, sceneKey: SceneKey): void {
        this.ensureGameOverlayStarted(scene);

        scene.scene.start(sceneKey);
        scene.scene.bringToTop(SCENE_KEY.GAME_OVERLAY);
    }

    private ensureGameOverlayStarted(scene: Phaser.Scene): void {
        if (scene.scene.isActive(SCENE_KEY.GAME_OVERLAY)) {
            return;
        }

        scene.scene.launch(SCENE_KEY.GAME_OVERLAY);
    }
}

export const SCENE_RUNTIME = new SceneRuntime();
