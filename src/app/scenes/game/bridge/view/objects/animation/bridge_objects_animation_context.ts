// src/app/scenes/game/bridge/view/objects/animation/bridge_objects_animation_context.ts

import type BridgeScene from '../../../BridgeScene';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import type BridgeObjectSpriteView from '../object_sprite/BridgeObjectSpriteView';

// Общий context для object-level animation sequences.
// Sequencer владеет lifecycle таймера, а sequence-файлы используют context для доступа к scene, events и object views.
export type BridgeObjectsAnimationContext = {
    scene: BridgeScene;
    eventBus: BridgeEventBus;

    getObjectView: (objectId: string) => BridgeObjectSpriteView | undefined;
    getObjectViews: () => BridgeObjectSpriteView[];

    setActiveTimer: (timer: Phaser.Time.TimerEvent) => void;
    clearActiveTimer: () => void;
};
