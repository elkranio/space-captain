// src/app/scenes/game/bridge/view/indicators/targeting_warning/BridgeTargetingWarningView.ts

import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

const TARGETING_WARNING_LAMP = {
    y: 114,

    width: 30,
    height: 8,

    color: 0xff2b2b,

    brightAlpha: 1,
    dimAlpha: 0.15,

    blinkDurationMs: 220,
} as const;

// Временный bridge indicator ракетного наведения.
//
// Пока используется Phaser rectangle.
// Позже его можно заменить на sprite,
// не меняя bridge events и lifecycle view.
export default class BridgeTargetingWarningView {
    private readonly lamp: Phaser.GameObjects.Rectangle;

    private blinkTween?: Phaser.Tweens.Tween;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.lamp = this.scene.add
            .rectangle(
                this.scene.scale.width / 2,
                TARGETING_WARNING_LAMP.y,

                TARGETING_WARNING_LAMP.width,
                TARGETING_WARNING_LAMP.height,

                TARGETING_WARNING_LAMP.color,
                TARGETING_WARNING_LAMP.brightAlpha,
            )
            .setVisible(false)
            .setAlpha(0);

        // Индикатор является частью оборудования мостика:
        // он виден поверх interior,
        // но перекрывается barks и UI-окнами.
        this.scene.layers.get('bridge').add(this.lamp);

        this.eventBus.on(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED, this.start, this);

        this.eventBus.on(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED, this.clear, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED, this.start, this);

        this.eventBus.off(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED, this.clear, this);

        this.stopBlinkTween();

        this.lamp.destroy();
    }

    private start(): void {
        this.stopBlinkTween();

        this.lamp.setVisible(true).setAlpha(TARGETING_WARNING_LAMP.brightAlpha);

        this.blinkTween = this.scene.tweens.add({
            targets: this.lamp,

            alpha: TARGETING_WARNING_LAMP.dimAlpha,

            duration: TARGETING_WARNING_LAMP.blinkDurationMs,
            ease: 'Linear',

            yoyo: true,
            repeat: -1,
        });
    }

    private clear(): void {
        this.stopBlinkTween();

        this.lamp.setVisible(false).setAlpha(0);
    }

    private stopBlinkTween(): void {
        this.blinkTween?.stop();
        this.blinkTween = undefined;

        this.scene.tweens.killTweensOf(this.lamp);
    }
}
