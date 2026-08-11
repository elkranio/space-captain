// src/app/runtime/SceneRuntime.ts

import type { SceneKey } from '../scenes/scene_key';

// Технический runtime для управления Phaser scenes.
//
// Не хранит game state и не содержит domain rules.
class SceneRuntime {
    public startGameScene(scene: Phaser.Scene, sceneKey: SceneKey): void {
        if (scene.sys.settings.key === sceneKey) {
            scene.scene.restart();
        } else {
            scene.scene.start(sceneKey);
        }
    }
}

export const SCENE_RUNTIME = new SceneRuntime();
