// src/app/scenes/game/bridge/view/ui/BridgeUiView.ts

import type BridgeScene from '../../BridgeScene';
import { BRIDGE_EVENT } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeContactView from './contact/BridgeContactView';
import BridgeOfficerContextMenuView from './officer_context_menu/BridgeOfficerContextMenuView';

const TARGETING_WARNING_LAMP = {
    y: 114,

    width: 30,
    height: 8,

    color: 0xff2b2b,

    brightAlpha: 1,
    dimAlpha: 0.15,

    blinkDurationMs: 220,
} as const;

// Root view для bridge UI layer.
// Собирает самостоятельные UI-модули
// и простые bridge-level UI indicators.
export default class BridgeUiView {
    private readonly officerContextMenuView: BridgeOfficerContextMenuView;

    private readonly contactView: BridgeContactView;

    private readonly targetingWarningLamp: Phaser.GameObjects.Rectangle;

    private targetingWarningTween?: Phaser.Tweens.Tween;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.officerContextMenuView = new BridgeOfficerContextMenuView(this.scene, this.eventBus);

        this.contactView = new BridgeContactView(this.scene, this.eventBus);

        this.targetingWarningLamp = this.scene.add
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

        this.scene.layers.get('ui').add(this.targetingWarningLamp);

        this.eventBus.on(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED, this.startTargetingWarning, this);

        this.eventBus.on(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED, this.clearTargetingWarning, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED, this.startTargetingWarning, this);

        this.eventBus.off(BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED, this.clearTargetingWarning, this);

        this.stopTargetingWarningTween();

        this.targetingWarningLamp.destroy();

        this.contactView.destroy();
        this.officerContextMenuView.destroy();
    }

    private startTargetingWarning(): void {
        this.stopTargetingWarningTween();

        this.targetingWarningLamp.setVisible(true).setAlpha(TARGETING_WARNING_LAMP.brightAlpha);

        this.targetingWarningTween = this.scene.tweens.add({
            targets: this.targetingWarningLamp,

            alpha: TARGETING_WARNING_LAMP.dimAlpha,

            duration: TARGETING_WARNING_LAMP.blinkDurationMs,
            ease: 'Linear',

            yoyo: true,
            repeat: -1,
        });
    }

    private clearTargetingWarning(): void {
        this.stopTargetingWarningTween();

        this.targetingWarningLamp.setVisible(false).setAlpha(0);
    }

    private stopTargetingWarningTween(): void {
        this.targetingWarningTween?.stop();
        this.targetingWarningTween = undefined;

        this.scene.tweens.killTweensOf(this.targetingWarningLamp);
    }
}
