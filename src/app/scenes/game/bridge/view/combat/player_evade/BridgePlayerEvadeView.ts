// src/app/scenes/game/bridge/view/combat/player_evade/BridgePlayerEvadeView.ts

import { SHIP_EVADE_PHASE, type ShipEvadePhase } from "../../../../../../../engine/defs/ship_evade";
import type BridgeScene from "../../../BridgeScene";
import { BRIDGE_EVENT, type BridgePlayerEvadeUpdatedPayload } from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import { BRIDGE_VIEWSCREEN_RECT } from "../../bridge_viewscreen_layout";
import { BRIDGE_PLAYER_EVADE_PRESENTATION } from "./bridge_player_evade_presentation";

type DustParticle = {
    x: number;
    y: number;

    bandIndex: number;

    lengthScale: number;
    alphaScale: number;
};

const DUST_MARGIN_X = 18;
const DUST_MARGIN_Y = 12;

// Player Evade presentation.
//
// Engine/read-model owns phase truth. This view never advances WARMUP/EVADING
// itself and never decides whether Evade is legal or protective.
//
// Visual language selected in the disposable sandbox:
// - WARMUP: tiny horizontal bridge/camera vibration;
// - EVADING: slightly stronger vibration + one-direction parallax dust;
// - the physical outside world itself remains nominal;
// - end/cancel/interruption: no new shake pulses and a very short dust tail.
//
// Camera shake is emitted as short non-forced pulses instead of one long owned
// shake. That means an impact shake can temporarily take precedence and this
// view never has to reset Phaser's shared camera shake effect.
export default class BridgePlayerEvadeView {
    private phase: ShipEvadePhase = SHIP_EVADE_PHASE.READY;

    private phaseElapsedMs = 0;

    private dustDirection: -1 | 1 = 1;

    private returnFadeElapsedMs?: number;

    private returnStartDustAlpha = 0;

    private shakePulseElapsedMs = 0;

    private readonly dustGraphics: Phaser.GameObjects.Graphics;

    private readonly dustParticles: DustParticle[] = [];

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,
    ) {
        this.dustGraphics = this.scene.add.graphics();

        this.scene.layers.get("vfx").add(this.dustGraphics);

        this.createDustParticles();

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_EVADE_UPDATED,

            this.handleEvadeUpdated,
            this,
        );

        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_EVADE_UPDATED,

            this.handleEvadeUpdated,
            this,
        );

        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);

        this.dustParticles.length = 0;

        this.dustGraphics.destroy();
    }

    private handleEvadeUpdated(payload: BridgePlayerEvadeUpdatedPayload): void {
        const previousPhase = this.phase;

        const wasManeuvering = isManeuverPhase(previousPhase);

        const isManeuvering = isManeuverPhase(payload.phase);

        if (!wasManeuvering && isManeuvering) {
            this.beginManeuverPresentation();
        }

        if (previousPhase === SHIP_EVADE_PHASE.EVADING && payload.phase !== SHIP_EVADE_PHASE.EVADING) {
            this.beginDustReturnFade(this.getEvadingDustAlpha(this.phaseElapsedMs));
        } else if (wasManeuvering && !isManeuvering) {
            this.stopDustImmediately();
        }

        if (previousPhase !== payload.phase) {
            this.shakePulseElapsedMs = BRIDGE_PLAYER_EVADE_PRESENTATION.shake.pulseIntervalMs;
        }

        this.phase = payload.phase;

        this.phaseElapsedMs = Math.max(0, payload.phaseElapsedMs);
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        const safeDeltaMs = Math.max(0, deltaMs);

        this.updateShake(safeDeltaMs);

        this.updateDust(safeDeltaMs);
    }

    private beginManeuverPresentation(): void {
        this.dustDirection = Math.random() < 0.5 ? -1 : 1;

        this.returnFadeElapsedMs = undefined;

        this.returnStartDustAlpha = 0;

        this.randomizeDustPositions();
        this.clearDust();
    }

    private beginDustReturnFade(startAlpha: number): void {
        this.returnFadeElapsedMs = startAlpha > 0 ? 0 : undefined;

        this.returnStartDustAlpha = Math.max(0, startAlpha);

        if (this.returnFadeElapsedMs === undefined) {
            this.clearDust();
        }
    }

    private stopDustImmediately(): void {
        this.returnFadeElapsedMs = undefined;

        this.returnStartDustAlpha = 0;

        this.clearDust();
    }

    private updateShake(deltaMs: number): void {
        const intensityX = getShakeIntensityX(this.phase);

        if (intensityX <= 0) {
            this.shakePulseElapsedMs = 0;

            return;
        }

        const config = BRIDGE_PLAYER_EVADE_PRESENTATION.shake;

        this.shakePulseElapsedMs += deltaMs;

        if (this.shakePulseElapsedMs < config.pulseIntervalMs) {
            return;
        }

        this.shakePulseElapsedMs %= config.pulseIntervalMs;

        this.scene.cameras.main.shake(
            config.pulseDurationMs,

            new Phaser.Math.Vector2(intensityX, 0),

            false,
        );
    }

    private updateDust(deltaMs: number): void {
        if (this.phase === SHIP_EVADE_PHASE.EVADING) {
            const speedPulse = this.getSpeedPulse(this.phaseElapsedMs);

            this.moveDust(deltaMs, speedPulse);

            this.renderDust(
                speedPulse,

                this.getEvadingDustAlpha(this.phaseElapsedMs),
            );

            return;
        }

        const returnFadeElapsedMs = this.returnFadeElapsedMs;

        if (returnFadeElapsedMs !== undefined) {
            this.updateDustReturnFade(deltaMs, returnFadeElapsedMs);

            return;
        }

        this.clearDust();
    }

    private updateDustReturnFade(deltaMs: number, returnFadeElapsedMs: number): void {
        const durationMs = BRIDGE_PLAYER_EVADE_PRESENTATION.returnFadeMs;

        const elapsedMs = Math.min(durationMs, returnFadeElapsedMs + deltaMs);

        this.returnFadeElapsedMs = elapsedMs;

        const progress = durationMs <= 0 ? 1 : Phaser.Math.Clamp(elapsedMs / durationMs, 0, 1);

        const alpha = Phaser.Math.Linear(this.returnStartDustAlpha, 0, easeOutCubic(progress));

        this.moveDust(deltaMs, 1);

        this.renderDust(1, alpha);

        if (progress < 1) {
            return;
        }

        this.returnFadeElapsedMs = undefined;

        this.returnStartDustAlpha = 0;

        this.clearDust();
    }

    private getEvadingDustAlpha(phaseElapsedMs: number): number {
        const config = BRIDGE_PLAYER_EVADE_PRESENTATION.dust;

        const fadeInProgress = config.fadeInMs <= 0 ? 1 : Phaser.Math.Clamp(phaseElapsedMs / config.fadeInMs, 0, 1);

        const alphaPulse =
            1 -
            config.alphaPulseAmplitude +
            config.alphaPulseAmplitude *
                (0.5 + 0.5 * Math.sin((phaseElapsedMs / 1000) * Math.PI * 2 * config.alphaPulseHz));

        return config.evadeAlpha * smoothStep(fadeInProgress) * alphaPulse;
    }

    private getSpeedPulse(phaseElapsedMs: number): number {
        const config = BRIDGE_PLAYER_EVADE_PRESENTATION.dust;

        return 1 + config.speedPulseAmplitude * Math.sin((phaseElapsedMs / 1000) * Math.PI * 2 * config.speedPulseHz);
    }

    private createDustParticles(): void {
        const bands = BRIDGE_PLAYER_EVADE_PRESENTATION.dust.bands;

        bands.forEach((band, bandIndex) => {
            for (let index = 0; index < band.count; index += 1) {
                this.dustParticles.push({
                    x: 0,
                    y: 0,

                    bandIndex,

                    lengthScale: Phaser.Math.FloatBetween(0.65, 1),

                    alphaScale: Phaser.Math.FloatBetween(0.72, 1),
                });
            }
        });

        this.randomizeDustPositions();
    }

    private randomizeDustPositions(): void {
        for (const particle of this.dustParticles) {
            particle.x = Phaser.Math.FloatBetween(
                BRIDGE_VIEWSCREEN_RECT.x + DUST_MARGIN_X,

                BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width - DUST_MARGIN_X,
            );

            particle.y = Phaser.Math.FloatBetween(
                BRIDGE_VIEWSCREEN_RECT.y + DUST_MARGIN_Y,

                BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height - DUST_MARGIN_Y,
            );
        }
    }

    private moveDust(deltaMs: number, speedPulse: number): void {
        const config = BRIDGE_PLAYER_EVADE_PRESENTATION.dust;

        const deltaSeconds = deltaMs / 1000;

        for (const particle of this.dustParticles) {
            const band = config.bands[particle.bandIndex];

            if (!band) {
                continue;
            }

            particle.x +=
                this.dustDirection * config.baseSpeedPxPerSecond * speedPulse * band.speedMultiplier * deltaSeconds;

            this.wrapDustParticle(particle);
        }
    }

    private wrapDustParticle(particle: DustParticle): void {
        const minX = BRIDGE_VIEWSCREEN_RECT.x + DUST_MARGIN_X;

        const maxX = BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width - DUST_MARGIN_X;

        if (particle.x < minX) {
            particle.x = maxX;

            this.randomizeParticleY(particle);

            return;
        }

        if (particle.x > maxX) {
            particle.x = minX;

            this.randomizeParticleY(particle);
        }
    }

    private randomizeParticleY(particle: DustParticle): void {
        particle.y = Phaser.Math.FloatBetween(
            BRIDGE_VIEWSCREEN_RECT.y + DUST_MARGIN_Y,

            BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height - DUST_MARGIN_Y,
        );
    }

    private renderDust(speedPulse: number, dustAlpha: number): void {
        this.dustGraphics.clear();

        if (dustAlpha <= 0) {
            return;
        }

        const config = BRIDGE_PLAYER_EVADE_PRESENTATION.dust;

        for (const particle of this.dustParticles) {
            const band = config.bands[particle.bandIndex];

            if (!band) {
                continue;
            }

            const lengthProgress = Phaser.Math.Clamp(
                (speedPulse - (1 - config.speedPulseAmplitude)) /
                    Math.max(
                        0.0001,

                        config.speedPulseAmplitude * 2,
                    ),
                0,
                1,
            );

            const lengthPx =
                Phaser.Math.Linear(band.minLengthPx, band.maxLengthPx, lengthProgress) * particle.lengthScale;

            const alpha = Phaser.Math.Clamp(dustAlpha * band.alpha * particle.alphaScale, 0, 1);

            this.dustGraphics.fillStyle(config.color, alpha);

            const width = Math.max(1, Math.round(lengthPx));

            const x = this.dustDirection > 0 ? particle.x - width : particle.x;

            this.dustGraphics.fillRect(
                Math.round(x),

                Math.round(particle.y),

                width,

                band.thicknessPx,
            );
        }
    }

    private clearDust(): void {
        this.dustGraphics.clear();
    }
}

function isManeuverPhase(phase: ShipEvadePhase): boolean {
    return phase === SHIP_EVADE_PHASE.WARMUP || phase === SHIP_EVADE_PHASE.EVADING;
}

function getShakeIntensityX(phase: ShipEvadePhase): number {
    const config = BRIDGE_PLAYER_EVADE_PRESENTATION.shake;

    switch (phase) {
        case SHIP_EVADE_PHASE.WARMUP:
            return config.warmupIntensityX;

        case SHIP_EVADE_PHASE.EVADING:
            return config.evadeIntensityX;

        case SHIP_EVADE_PHASE.READY:
        case SHIP_EVADE_PHASE.COOLDOWN:
            return 0;

        default: {
            const exhaustivePhase: never = phase;

            return exhaustivePhase;
        }
    }
}

function smoothStep(value: number): number {
    return value * value * (3 - 2 * value);
}

function easeOutCubic(value: number): number {
    const inverse = 1 - value;

    return 1 - inverse * inverse * inverse;
}
