// src/app/scenes/game/bridge/view/vfx/BridgeVfxView.ts

import type BridgeScene from '../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeEncounterJumpPayload,
} from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { BRIDGE_VIEWSCREEN_RECT } from '../bridge_viewscreen_layout';
import BridgeViewscreenDustView from './viewscreen_dust/BridgeViewscreenDustView';

const DRIVE_DISRUPTION = {
    flashColor: 0xd9c2ff,
    flashAlpha: 0.82,

    flashDurationMs: 45,
    flashRepeatDelayMs: 35,

    bandColor: 0xf5eeff,
    bandAlpha: 0.95,
    bandHeight: 10,
    bandDurationMs: 260,
} as const;

// Root view для bridge VFX layer.
// Собирает vfx child views и переводит bridge events
// в локальные visual effects.
export default class BridgeVfxView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly viewscreenDustView:
        BridgeViewscreenDustView;

    private readonly jumpFlash:
        Phaser.GameObjects.Rectangle;

    private readonly driveDisruptionFlash:
        Phaser.GameObjects.Rectangle;

    private readonly driveDisruptionBand:
        Phaser.GameObjects.Rectangle;

    private jumpTween?: Phaser.Tweens.Tween;

    private driveDisruptionFlashTween?:
        Phaser.Tweens.Tween;

    private driveDisruptionBandTween?:
        Phaser.Tweens.Tween;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('vfx').add(this.root);

        this.viewscreenDustView =
            new BridgeViewscreenDustView(
                this.scene,
                this.root,
            );

        // VFX layer расположен под bridge interior,
        // поэтому full-screen flashes видны главным образом
        // через viewscreen.
        this.jumpFlash = this.scene.add
            .rectangle(
                0,
                0,
                this.scene.scale.width,
                this.scene.scale.height,
                0xa8d8ff,
                1,
            )
            .setOrigin(0, 0)
            .setAlpha(0)
            .setVisible(false)
            .setBlendMode(
                Phaser.BlendModes.ADD,
            );

        this.driveDisruptionFlash =
            this.scene.add
                .rectangle(
                    0,
                    0,
                    this.scene.scale.width,
                    this.scene.scale.height,
                    DRIVE_DISRUPTION.flashColor,
                    1,
                )
                .setOrigin(0, 0)
                .setAlpha(0)
                .setVisible(false)
                .setBlendMode(
                    Phaser.BlendModes.ADD,
                );

        this.driveDisruptionBand =
            this.scene.add
                .rectangle(
                    BRIDGE_VIEWSCREEN_RECT.x,
                    BRIDGE_VIEWSCREEN_RECT.y,

                    BRIDGE_VIEWSCREEN_RECT.width,
                    DRIVE_DISRUPTION.bandHeight,

                    DRIVE_DISRUPTION.bandColor,
                    1,
                )
                .setOrigin(0, 0)
                .setAlpha(0)
                .setVisible(false)
                .setBlendMode(
                    Phaser.BlendModes.ADD,
                );

        this.root.add([
            this.jumpFlash,
            this.driveDisruptionFlash,
            this.driveDisruptionBand,
        ]);

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED,
            this.startViewscreenDust,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED,
            this.stopViewscreenDust,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED,
            this.startViewscreenDust,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED,
            this.stopViewscreenDust,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED,
            this.playJump,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,
            this.playDriveDisruption,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED,
            this.startViewscreenDust,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED,
            this.stopViewscreenDust,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED,
            this.startViewscreenDust,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED,
            this.stopViewscreenDust,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED,
            this.playJump,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED,
            this.playDriveDisruption,
            this,
        );

        this.jumpTween?.stop();
        this.jumpTween = undefined;

        this.driveDisruptionFlashTween?.stop();
        this.driveDisruptionFlashTween = undefined;

        this.driveDisruptionBandTween?.stop();
        this.driveDisruptionBandTween = undefined;

        this.scene.tweens.killTweensOf(
            this.jumpFlash,
        );

        this.scene.tweens.killTweensOf(
            this.driveDisruptionFlash,
        );

        this.scene.tweens.killTweensOf(
            this.driveDisruptionBand,
        );

        this.viewscreenDustView.destroy();
        this.root.destroy(false);
    }

    private startViewscreenDust(): void {
        this.viewscreenDustView.start();
    }

    private stopViewscreenDust(): void {
        this.viewscreenDustView.stop();
    }

    private playJump(
        payload: BridgeEncounterJumpPayload,
    ): void {
        this.viewscreenDustView.stop();

        this.jumpTween?.stop();

        this.jumpFlash
            .setVisible(true)
            .setAlpha(0);

        this.jumpTween = this.scene.tweens.add({
            targets: this.jumpFlash,
            alpha: 1,
            duration: 220,
            ease: 'Linear',
            hold: 100,
            yoyo: true,

            onComplete: () => {
                this.jumpTween = undefined;

                this.jumpFlash
                    .setVisible(false)
                    .setAlpha(0);

                this.eventBus.emit(
                    BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED,
                    payload,
                );
            },
        });
    }

    private playDriveDisruption(): void {
        this.driveDisruptionFlashTween?.stop();
        this.driveDisruptionBandTween?.stop();

        this.scene.tweens.killTweensOf(
            this.driveDisruptionFlash,
        );

        this.scene.tweens.killTweensOf(
            this.driveDisruptionBand,
        );

        this.driveDisruptionFlash
            .setVisible(true)
            .setAlpha(0);

        this.driveDisruptionBand
            .setVisible(true)
            .setPosition(
                BRIDGE_VIEWSCREEN_RECT.x,
                BRIDGE_VIEWSCREEN_RECT.y,
            )
            .setAlpha(
                DRIVE_DISRUPTION.bandAlpha,
            );

        this.driveDisruptionFlashTween =
            this.scene.tweens.add({
                targets:
                    this.driveDisruptionFlash,

                alpha:
                    DRIVE_DISRUPTION.flashAlpha,

                duration:
                    DRIVE_DISRUPTION
                        .flashDurationMs,

                ease: 'Linear',
                yoyo: true,

                repeat: 1,
                repeatDelay:
                    DRIVE_DISRUPTION
                        .flashRepeatDelayMs,

                onComplete: () => {
                    this.driveDisruptionFlashTween =
                        undefined;

                    this.driveDisruptionFlash
                        .setVisible(false)
                        .setAlpha(0);
                },
            });

        this.driveDisruptionBandTween =
            this.scene.tweens.add({
                targets:
                    this.driveDisruptionBand,

                y:
                    BRIDGE_VIEWSCREEN_RECT.y +
                    BRIDGE_VIEWSCREEN_RECT.height -
                    DRIVE_DISRUPTION.bandHeight,

                alpha: 0,

                duration:
                    DRIVE_DISRUPTION
                        .bandDurationMs,

                ease: 'Linear',

                onComplete: () => {
                    this.driveDisruptionBandTween =
                        undefined;

                    this.driveDisruptionBand
                        .setVisible(false)
                        .setAlpha(0);
                },
            });
    }
}
