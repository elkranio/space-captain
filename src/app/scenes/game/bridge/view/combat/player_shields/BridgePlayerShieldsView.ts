// src/app/scenes/game/bridge/view/combat/player_shields/BridgePlayerShieldsView.ts

import {
    LASER_TARGET_ZONE,
    type LaserTargetZone,
} from '../../../../../../../engine/defs/laser';
import { LASER_SHOT_OUTCOME } from '../../../../../../../engine/encounter/model/combat';
import { PLAYER_SHIELD_SPRITES } from '../../../../../../manifests/bridge/combat_shields';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeLaserBeamFiredPayload,
    type BridgePlayerShieldUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';

const PLAYER_SHIELD_VFX = {
    baseAlpha: 0.42,

    activationFadeMs: 120,

    idleFlickerAmplitude: 0.035,
    idleFlickerFrameMs: 110,

    expirationWarningMs: 1000,
    expirationBlinkHalfPeriodMs: 125,
    expirationLowAlpha: 0.08,

    impactFlashInMs: 50,
    impactHoldMs: 40,
    impactFadeOutMs: 170,
} as const;

const PLAYER_SHIELD_LAYOUT = {
    y: BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height / 2,

    [LASER_TARGET_ZONE.LEFT]: {
        x: BRIDGE_VIEWSCREEN_RECT.x + 163,
    },

    [LASER_TARGET_ZONE.CENTER]: {
        x: BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2,
    },

    [LASER_TARGET_ZONE.RIGHT]: {
        x: BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width - 162,
    },
} as const;

// View одного encounter-only player shield field.
//
// Shield sprite живёт:
// - поверх space background и encounter objects;
// - под combat VFX и laser beam;
// - под bridge interior.
//
// Engine snapshot остаётся источником zone и remaining lifetime.
// Локальное время используется только для:
// - activation fade;
// - слабого idle flicker;
// - impact flash/fade.
export default class BridgePlayerShieldsView {
    private readonly root: Phaser.GameObjects.Container;

    private shield?: Phaser.GameObjects.Image;
    private zone?: LaserTargetZone;

    private remainingDurationMs = 0;

    private activationElapsedMs = 0;

    private flickerElapsedMs = 0;
    private flickerOffset = 0;

    private impactElapsedMs?: number;
    private impactStartAlpha: number = PLAYER_SHIELD_VFX.baseAlpha;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);

        // BridgeSpaceView уже добавил background и encounter objects.
        // Этот root добавляется после них в тот же layer,
        // поэтому shield закрывает space objects,
        // но остаётся под vfx/interior layers.
        this.scene.layers.get('space').add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,
            this.updateShield,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.LASER_BEAM_FIRED,
            this.handleLaserBeamFired,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,
            this.updateShield,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.LASER_BEAM_FIRED,
            this.handleLaserBeamFired,
            this,
        );

        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,
            this.handleSceneUpdate,
            this,
        );

        this.clearShield();
        this.root.destroy(false);
    }

    private updateShield(
        payload: BridgePlayerShieldUpdatedPayload,
    ): void {
        if (!payload) {
            // Matching laser уже удалил shield из engine state,
            // но view должен доиграть impact fade.
            if (this.impactElapsedMs !== undefined) {
                return;
            }

            this.clearShield();
            return;
        }

        this.validateSnapshot(payload);

        if (
            !this.shield ||
            this.zone !== payload.zone ||
            this.impactElapsedMs !== undefined
        ) {
            this.clearShield();
            this.createShield(payload.zone);
        }

        this.remainingDurationMs = Phaser.Math.Clamp(
            payload.remainingDurationMs,
            0,
            payload.initialDurationMs,
        );

        this.applyAlpha();
    }

    private handleLaserBeamFired(
        payload: BridgeLaserBeamFiredPayload,
    ): void {
        if (payload.outcome !== LASER_SHOT_OUTCOME.BLOCKED) {
            return;
        }

        if (!this.shield || !this.zone) {
            throw new Error(
                `Blocked laser has no displayed player shield: ` +
                    `${payload.targetZone}`,
            );
        }

        if (this.zone !== payload.targetZone) {
            throw new Error(
                `Blocked laser zone does not match displayed shield: ` +
                    `${payload.targetZone}/${this.zone}`,
            );
        }

        this.impactStartAlpha = this.shield.alpha;
        this.impactElapsedMs = 0;

        this.applyAlpha();
    }

    private handleSceneUpdate(
        _time: number,
        deltaMs: number,
    ): void {
        if (!this.shield) {
            return;
        }

        if (this.impactElapsedMs !== undefined) {
            this.impactElapsedMs += deltaMs;

            if (
                this.impactElapsedMs >=
                this.getImpactDurationMs()
            ) {
                this.clearShield();
                return;
            }

            this.applyAlpha();
            return;
        }

        this.activationElapsedMs += deltaMs;
        this.flickerElapsedMs += deltaMs;

        while (
            this.flickerElapsedMs >=
            PLAYER_SHIELD_VFX.idleFlickerFrameMs
        ) {
            this.flickerElapsedMs -=
                PLAYER_SHIELD_VFX.idleFlickerFrameMs;

            this.flickerOffset = Phaser.Math.FloatBetween(
                -PLAYER_SHIELD_VFX.idleFlickerAmplitude,
                PLAYER_SHIELD_VFX.idleFlickerAmplitude,
            );
        }

        this.applyAlpha();
    }

    private createShield(zone: LaserTargetZone): void {
        const sprite = PLAYER_SHIELD_SPRITES[zone];
        const position = this.getShieldPosition(zone);

        this.shield = this.scene.add
            .image(
                position.x,
                position.y,

                sprite.atlasKey,
                sprite.frameKey,
            )
            .setOrigin(0.5, 0.5)
            .setAlpha(0);

        this.root.add(this.shield);

        this.zone = zone;

        this.activationElapsedMs = 0;

        this.flickerElapsedMs = 0;
        this.flickerOffset = 0;

        this.impactElapsedMs = undefined;
        this.impactStartAlpha = PLAYER_SHIELD_VFX.baseAlpha;
    }

    private clearShield(): void {
        this.shield?.destroy();

        this.shield = undefined;
        this.zone = undefined;

        this.remainingDurationMs = 0;

        this.activationElapsedMs = 0;

        this.flickerElapsedMs = 0;
        this.flickerOffset = 0;

        this.impactElapsedMs = undefined;
        this.impactStartAlpha = PLAYER_SHIELD_VFX.baseAlpha;
    }

    private applyAlpha(): void {
        const shield = this.shield;

        if (!shield) {
            return;
        }

        if (this.impactElapsedMs !== undefined) {
            shield.setAlpha(this.getImpactAlpha());
            return;
        }

        const activationProgress = Phaser.Math.Clamp(
            this.activationElapsedMs /
                PLAYER_SHIELD_VFX.activationFadeMs,
            0,
            1,
        );

        const idleAlpha = Phaser.Math.Clamp(
            PLAYER_SHIELD_VFX.baseAlpha +
                this.flickerOffset,
            0,
            1,
        );

        const activeAlpha =
            idleAlpha *
            activationProgress;

        if (
            this.remainingDurationMs >
            PLAYER_SHIELD_VFX.expirationWarningMs
        ) {
            shield.setAlpha(activeAlpha);
            return;
        }

        const warningElapsedMs =
            PLAYER_SHIELD_VFX.expirationWarningMs -
            this.remainingDurationMs;

        const blinkIndex = Math.floor(
            warningElapsedMs /
                PLAYER_SHIELD_VFX.expirationBlinkHalfPeriodMs,
        );

        shield.setAlpha(
            blinkIndex % 2 === 0
                ? activeAlpha
                : PLAYER_SHIELD_VFX.expirationLowAlpha,
        );
    }

    private getImpactAlpha(): number {
        const impactElapsedMs = this.impactElapsedMs;

        if (impactElapsedMs === undefined) {
            return this.shield?.alpha ??
                PLAYER_SHIELD_VFX.baseAlpha;
        }

        const flashEndMs =
            PLAYER_SHIELD_VFX.impactFlashInMs;

        if (impactElapsedMs < flashEndMs) {
            return Phaser.Math.Linear(
                this.impactStartAlpha,
                1,
                impactElapsedMs /
                    PLAYER_SHIELD_VFX.impactFlashInMs,
            );
        }

        const holdEndMs =
            flashEndMs +
            PLAYER_SHIELD_VFX.impactHoldMs;

        if (impactElapsedMs < holdEndMs) {
            return 1;
        }

        return Phaser.Math.Linear(
            1,
            0,

            Phaser.Math.Clamp(
                (impactElapsedMs - holdEndMs) /
                    PLAYER_SHIELD_VFX.impactFadeOutMs,
                0,
                1,
            ),
        );
    }

    private getImpactDurationMs(): number {
        return (
            PLAYER_SHIELD_VFX.impactFlashInMs +
            PLAYER_SHIELD_VFX.impactHoldMs +
            PLAYER_SHIELD_VFX.impactFadeOutMs
        );
    }

    private getShieldPosition(
        zone: LaserTargetZone,
    ): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            PLAYER_SHIELD_LAYOUT[zone].x,
            PLAYER_SHIELD_LAYOUT.y,
        );
    }

    private validateSnapshot(
        payload: Exclude<
            BridgePlayerShieldUpdatedPayload,
            undefined
        >,
    ): void {
        if (
            !Number.isFinite(payload.initialDurationMs) ||
            payload.initialDurationMs <= 0
        ) {
            throw new Error(
                `Player shield initial duration must be positive: ` +
                    `${payload.initialDurationMs}`,
            );
        }

        if (
            !Number.isFinite(payload.remainingDurationMs) ||
            payload.remainingDurationMs < 0
        ) {
            throw new Error(
                `Player shield remaining duration must be non-negative: ` +
                    `${payload.remainingDurationMs}`,
            );
        }
    }
}
