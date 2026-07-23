// src/app/scenes/game/bridge/view/objects/animation/bridge_objects_animation_context.ts

import type BridgeScene from '../../../BridgeScene';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import type BridgeObjectSpriteView from '../object_sprite/BridgeObjectSpriteView';

// Общий context для view-level animation sequences.
//
// Sequencer владеет:
// - lifecycle активного timer;
// - текущим yaw камеры.
//
// Sequence-файлы получают доступ к scene, events,
// encounter object views и transient camera orientation.
export type BridgeObjectsAnimationContext = {
    scene: BridgeScene;
    eventBus: BridgeEventBus;

    panBackgroundBy: (screenX: number, screenY: number) => void;

    getCameraYawDegrees: () => number | undefined;

    setCameraYawDegrees: (yawDegrees: number) => void;

    getObjectView: (objectId: string) => BridgeObjectSpriteView | undefined;

    getObjectViews: () => BridgeObjectSpriteView[];

    getAnchorObjectViews: (anchorObjectId: string) => BridgeObjectSpriteView[];

    setActiveTimer: (timer: Phaser.Time.TimerEvent) => void;

    clearActiveTimer: () => void;
};
