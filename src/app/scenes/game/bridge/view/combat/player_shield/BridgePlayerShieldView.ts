// src/app/scenes/game/bridge/view/combat/player_shield/BridgePlayerShieldView.ts

import {
    PLAYER_SHIELD_CENTER_SPRITE,
} from '../../../../../../manifests/bridge/combat_shield';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgePlayerShieldEndedPayload,
    type BridgePlayerShieldSnapshotPayload,
    type BridgePlayerShieldUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    BRIDGE_PLAYER_HULL_COMBAT_POINTS,
} from '../bridge_player_hull_combat_points';

const SHIELD = {
    baseAlpha: 0.55,
    blinkDimAlpha: 0.12,

    blinkWindowMs: 1000,
    blinkIntervalMs: 125,

    absorbFadeMs: 160,
} as const;

// Player hull shield presentation.
//
// Сейчас player laser target semantics = whole hull,
// поэтому используется только existing center shield sector.
// side_left / side_right намеренно не участвуют до node targeting.
export default class BridgePlayerShieldView {
    private readonly shield:
        Phaser.GameObjects.Image;

    private absorbFadeElapsedMs = 0;

    private isAbsorbFlashPlaying =
        false;

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,
    ) {
        const asset =
            PLAYER_SHIELD_CENTER_SPRITE;

        this.shield =
            this.scene.add
                .image(
                    BRIDGE_PLAYER_HULL_COMBAT_POINTS
                        .shieldAnchor.x,

                    BRIDGE_PLAYER_HULL_COMBAT_POINTS
                        .shieldAnchor.y,

                    asset.atlasKey,
                    asset.frameKey,
                )
                .setOrigin(
                    0.5,
                    1,
                )
                .setAlpha(
                    SHIELD.baseAlpha,
                )
                .setVisible(
                    false,
                );

        this.scene.layers
            .get('vfx')
            .add(
                this.shield,
            );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_SHIELD_DEPLOYED,

            this.handleDeployed,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_SHIELD_UPDATED,

            this.handleUpdated,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_SHIELD_ENDED,

            this.handleEnded,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );
    }

    public destroy(): void {
        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_SHIELD_DEPLOYED,

            this.handleDeployed,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_SHIELD_UPDATED,

            this.handleUpdated,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_SHIELD_ENDED,

            this.handleEnded,
            this,
        );

        this.shield.destroy();
    }

    private handleDeployed(
        payload:
            BridgePlayerShieldSnapshotPayload,
    ): void {
        this.cancelAbsorbFlash();

        this.applySnapshot(
            payload,
        );
    }

    private handleUpdated(
        payload:
            BridgePlayerShieldUpdatedPayload,
    ): void {
        // Engine has already consumed the shield on an absorbed hit.
        // The same-frame null snapshot must not cut off the hit flash.
        if (
            this.isAbsorbFlashPlaying
        ) {
            return;
        }

        if (!payload) {
            this.hideShield();
            return;
        }

        this.applySnapshot(
            payload,
        );
    }

    private handleEnded(
        payload:
            BridgePlayerShieldEndedPayload,
    ): void {
        if (
            payload.outcome ===
            'absorbed'
        ) {
            this.startAbsorbFlash();
            return;
        }

        this.cancelAbsorbFlash();
        this.hideShield();
    }

    private handleSceneUpdate(
        _time: number,
        deltaMs: number,
    ): void {
        if (
            !this.isAbsorbFlashPlaying
        ) {
            return;
        }

        this.absorbFadeElapsedMs =
            Math.min(
                SHIELD.absorbFadeMs,
                this.absorbFadeElapsedMs +
                    deltaMs,
            );

        const progress =
            Phaser.Math.Clamp(
                this.absorbFadeElapsedMs /
                    SHIELD.absorbFadeMs,

                0,
                1,
            );

        this.shield
            .setAlpha(
                1 - progress,
            );

        if (progress < 1) {
            return;
        }

        this.isAbsorbFlashPlaying =
            false;

        this.absorbFadeElapsedMs = 0;

        this.shield
            .setVisible(false)
            .setAlpha(
                SHIELD.baseAlpha,
            );
    }

    private applySnapshot(
        payload:
            BridgePlayerShieldSnapshotPayload,
    ): void {
        const remainingMs =
            Math.max(
                0,
                payload
                    .remainingDurationMs,
            );

        this.shield
            .setVisible(true)
            .setAlpha(
                getShieldAlpha(
                    remainingMs,
                ),
            );
    }

    private startAbsorbFlash(): void {
        this.isAbsorbFlashPlaying =
            true;

        this.absorbFadeElapsedMs = 0;

        this.shield
            .setVisible(true)
            .setAlpha(1);
    }

    private cancelAbsorbFlash(): void {
        this.isAbsorbFlashPlaying =
            false;

        this.absorbFadeElapsedMs = 0;
    }

    private hideShield(): void {
        this.shield
            .setVisible(false)
            .setAlpha(
                SHIELD.baseAlpha,
            );
    }
}

function getShieldAlpha(
    remainingMs: number,
): number {
    if (
        remainingMs >
        SHIELD.blinkWindowMs
    ) {
        return SHIELD.baseAlpha;
    }

    const elapsedBlinkMs =
        SHIELD.blinkWindowMs -
        remainingMs;

    const phase =
        Math.floor(
            elapsedBlinkMs /
                SHIELD.blinkIntervalMs,
        );

    return phase % 2 === 0
        ? SHIELD.baseAlpha
        : SHIELD.blinkDimAlpha;
}
