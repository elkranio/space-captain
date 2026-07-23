// src/app/scenes/game/bridge/view/objects/animation/bridge_objects_animation_context.ts

import type BridgeScene from '../../../BridgeScene';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import type BridgeObjectSpriteView from '../object_sprite/BridgeObjectSpriteView';

// Общий context для object-level animation sequences.
//
// Sequencer владеет lifecycle таймера,
// а sequence-файлы получают доступ к scene, events,
// отдельным object views и целым anchor groups.
export type BridgeObjectsAnimationContext = {
    scene: BridgeScene;
    eventBus: BridgeEventBus;

    panBackgroundBy: (screenX: number, screenY: number) => void;

    getObjectView: (objectId: string) => BridgeObjectSpriteView | undefined;

    getObjectViews: () => BridgeObjectSpriteView[];

    getAnchorObjectViews: (anchorObjectId: string) => BridgeObjectSpriteView[];

    setActiveTimer: (timer: Phaser.Time.TimerEvent) => void;

    clearActiveTimer: () => void;
};
