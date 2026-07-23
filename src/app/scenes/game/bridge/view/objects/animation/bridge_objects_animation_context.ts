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
// Space background получает не screen pixels,
// а реальную yaw delta в градусах.
export type BridgeObjectsAnimationContext = {
    scene: BridgeScene;
    eventBus: BridgeEventBus;

    turnBackgroundYawBy: (yawDeltaDegrees: number) => void;

    getCameraYawDegrees: () => number | undefined;

    setCameraYawDegrees: (yawDegrees: number) => void;

    getObjectView: (objectId: string) => BridgeObjectSpriteView | undefined;

    getObjectViews: () => BridgeObjectSpriteView[];

    getAnchorObjectViews: (anchorObjectId: string) => BridgeObjectSpriteView[];

    setActiveTimer: (timer: Phaser.Time.TimerEvent) => void;

    clearActiveTimer: () => void;
};
