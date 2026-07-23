// src/app/scenes/scene_key.ts

export const SCENE_KEY = {
    BOOT: 'boot',
    PRELOAD: 'preload',

    INIT: 'init',
    GAME_OVERLAY: 'game_overlay',
    BRIDGE: 'bridge',
    END: 'end',
} as const;

export type SceneKey = (typeof SCENE_KEY)[keyof typeof SCENE_KEY];
