// src/app/scenes/game/bridge/view/combat/beam_cannon_charge/BridgeBeamCannonChargeView.ts

import type BridgeScene from "../../../BridgeScene";

type BridgeBeamCannonChargeViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    position?: Phaser.Math.Vector2;
};

type BeamCannonChargeParticleState = {
    angle: number;
    radiusScale: number;

    elapsedMs: number;

    holdDurationMs: number;
    snapDurationMs: number;
};

const BEAM_CANNON_CHARGE = {
    color: 0x43d9ff,
    hotColor: 0xd7f9ff,
    outlineColor: 0x07182a,

    particleCount: 8,

    particleSize: 3,
    particleOutlineSize: 5,

    maxRadiusX: 38,
    maxRadiusY: 25,

    initialStaggerMaxMs: 900,
    respawnDelayMinMs: 60,
    respawnDelayMaxMs: 220,

    holdDurationMinMs: 240,
    holdDurationMaxMs: 460,

    snapDurationMinMs: 170,
    snapDurationMaxMs: 250,

    holdFrameDurationMs: 90,

    minTrailLength: 8,
    maxTrailLength: 24,

    trailOutlineThickness: 4,
    trailThickness: 2,
    hotTrailThickness: 1,

    idleCoreSize: 2,

    coreFlashDurationMs: 110,
    coreFlashMinSize: 7,
    coreFlashMaxSize: 12,
} as const;

// Общий leaf-view beamCannon charge.
//
// Enemy и player beamCannon используют один и тот же
// particle lifecycle и один visual language.
export default class BridgeBeamCannonChargeView {
    private readonly graphics: Phaser.GameObjects.Graphics;

    private readonly particleStates: BeamCannonChargeParticleState[];

    private coreFlashElapsedMs = Number.POSITIVE_INFINITY;

    private destroyed = false;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        position = new Phaser.Math.Vector2(),
    ) {
        this.particleStates = this.createParticleStates();

        this.graphics = scene.add.graphics();

        this.graphics.setPosition(Math.round(position.x), Math.round(position.y));

        parent.add(this.graphics);

        this.draw();

        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    public static create({ scene, parent, position }: BridgeBeamCannonChargeViewOptions): BridgeBeamCannonChargeView {
        return new BridgeBeamCannonChargeView(scene, parent, position);
    }

    public destroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;

        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);

        this.graphics.destroy();
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        this.advanceParticles(deltaMs);

        this.coreFlashElapsedMs += deltaMs;

        this.draw();
    }

    private createParticleStates(): BeamCannonChargeParticleState[] {
        return Array.from(
            {
                length: BEAM_CANNON_CHARGE.particleCount,
            },

            (_unused, index) => {
                const state = this.createParticleState(index);

                state.elapsedMs = -Phaser.Math.Between(0, BEAM_CANNON_CHARGE.initialStaggerMaxMs);

                return state;
            },
        );
    }

    private createParticleState(index: number): BeamCannonChargeParticleState {
        const sectorAngle = (index / BEAM_CANNON_CHARGE.particleCount) * Math.PI * 2;

        const sectorJitter = Phaser.Math.FloatBetween(-0.22, 0.22);

        return {
            angle: sectorAngle + sectorJitter,

            radiusScale: Phaser.Math.FloatBetween(0.78, 1),

            elapsedMs: 0,

            holdDurationMs: Phaser.Math.Between(
                BEAM_CANNON_CHARGE.holdDurationMinMs,

                BEAM_CANNON_CHARGE.holdDurationMaxMs,
            ),

            snapDurationMs: Phaser.Math.Between(
                BEAM_CANNON_CHARGE.snapDurationMinMs,

                BEAM_CANNON_CHARGE.snapDurationMaxMs,
            ),
        };
    }

    private advanceParticles(deltaMs: number): void {
        for (let index = 0; index < this.particleStates.length; index += 1) {
            const state = this.particleStates[index];

            if (!state) {
                throw new Error("BeamCannon charge particle " + "state not found: " + index);
            }

            state.elapsedMs += deltaMs;

            const lifecycleDurationMs = state.holdDurationMs + state.snapDurationMs;

            if (state.elapsedMs < lifecycleDurationMs) {
                continue;
            }

            this.coreFlashElapsedMs = 0;

            const overflowMs = state.elapsedMs - lifecycleDurationMs;

            this.resetParticleState(state, index, overflowMs);
        }
    }

    private resetParticleState(state: BeamCannonChargeParticleState, index: number, overflowMs: number): void {
        const next = this.createParticleState(index);

        state.angle = next.angle;
        state.radiusScale = next.radiusScale;

        state.holdDurationMs = next.holdDurationMs;

        state.snapDurationMs = next.snapDurationMs;

        const respawnDelayMs = Phaser.Math.Between(
            BEAM_CANNON_CHARGE.respawnDelayMinMs,

            BEAM_CANNON_CHARGE.respawnDelayMaxMs,
        );

        state.elapsedMs = overflowMs - respawnDelayMs;
    }

    private draw(): void {
        this.graphics.clear();

        this.drawSquareCore(BEAM_CANNON_CHARGE.idleCoreSize, BEAM_CANNON_CHARGE.hotColor, 0.9);

        for (let index = 0; index < this.particleStates.length; index += 1) {
            const state = this.particleStates[index];

            if (!state || state.elapsedMs < 0) {
                continue;
            }

            if (state.elapsedMs < state.holdDurationMs) {
                this.drawParticleHold(state, index);

                continue;
            }

            const snapProgress = (state.elapsedMs - state.holdDurationMs) / state.snapDurationMs;

            this.drawParticleSnap(state, index, snapProgress);
        }

        this.drawCoreFlash();
    }

    private drawParticleHold(state: BeamCannonChargeParticleState, index: number): void {
        const start = this.getParticleStartPosition(state);

        const holdFrame = Math.floor(state.elapsedMs / BEAM_CANNON_CHARGE.holdFrameDurationMs);

        const jitterX = ((holdFrame + index * 2) % 3) - 1;

        const jitterY = ((holdFrame * 2 + index) % 3) - 1;

        const appearProgress = Phaser.Math.Clamp(state.elapsedMs / 90, 0, 1);

        this.drawParticleHead(
            Math.round(start.x) + jitterX,

            Math.round(start.y) + jitterY,

            this.getParticleColor(index),

            Phaser.Math.Linear(0.35, 1, appearProgress),
        );
    }

    private drawParticleSnap(state: BeamCannonChargeParticleState, index: number, snapProgress: number): void {
        const progress = Phaser.Math.Clamp(snapProgress, 0, 1);

        const easedProgress = 1 - Math.pow(1 - progress, 3);

        const start = this.getParticleStartPosition(state);

        const x = Math.round(Phaser.Math.Linear(start.x, 0, easedProgress));

        const y = Math.round(Phaser.Math.Linear(start.y, 0, easedProgress));

        const trailLength = Phaser.Math.Linear(
            BEAM_CANNON_CHARGE.minTrailLength,

            BEAM_CANNON_CHARGE.maxTrailLength,

            easedProgress,
        );

        const color = this.getParticleColor(index);

        this.drawParticleTrail(
            x,
            y,

            start.x,
            start.y,

            trailLength,

            color,

            Phaser.Math.Linear(0.78, 1, progress),
        );

        this.drawParticleHead(x, y, color, 1);
    }

    private getParticleStartPosition(state: BeamCannonChargeParticleState): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            Math.cos(state.angle) * BEAM_CANNON_CHARGE.maxRadiusX * state.radiusScale,

            Math.sin(state.angle) * BEAM_CANNON_CHARGE.maxRadiusY * state.radiusScale,
        );
    }

    private getParticleColor(index: number): number {
        return index % 3 === 0 ? BEAM_CANNON_CHARGE.hotColor : BEAM_CANNON_CHARGE.color;
    }

    private drawParticleTrail(
        x: number,
        y: number,

        sourceX: number,
        sourceY: number,

        trailLength: number,

        color: number,
        alpha: number,
    ): void {
        const sourceDistance = Math.sqrt(sourceX * sourceX + sourceY * sourceY);

        if (sourceDistance <= 0) {
            return;
        }

        const directionX = sourceX / sourceDistance;

        const directionY = sourceY / sourceDistance;

        const trailEndX = Math.round(x + directionX * trailLength);

        const trailEndY = Math.round(y + directionY * trailLength);

        this.graphics.lineStyle(
            BEAM_CANNON_CHARGE.trailOutlineThickness,

            BEAM_CANNON_CHARGE.outlineColor,

            Math.min(1, alpha + 0.1),
        );

        this.graphics.lineBetween(x, y, trailEndX, trailEndY);

        this.graphics.lineStyle(
            BEAM_CANNON_CHARGE.trailThickness,

            color,
            alpha,
        );

        this.graphics.lineBetween(x, y, trailEndX, trailEndY);

        this.graphics.lineStyle(
            BEAM_CANNON_CHARGE.hotTrailThickness,

            BEAM_CANNON_CHARGE.hotColor,

            Math.min(1, alpha + 0.15),
        );

        this.graphics.lineBetween(x, y, trailEndX, trailEndY);
    }

    private drawParticleHead(
        x: number,
        y: number,

        color: number,
        alpha: number,
    ): void {
        this.graphics.fillStyle(
            BEAM_CANNON_CHARGE.outlineColor,

            Math.min(1, alpha + 0.12),
        );

        this.graphics.fillRect(
            x - Math.floor(BEAM_CANNON_CHARGE.particleOutlineSize / 2),

            y - Math.floor(BEAM_CANNON_CHARGE.particleOutlineSize / 2),

            BEAM_CANNON_CHARGE.particleOutlineSize,

            BEAM_CANNON_CHARGE.particleOutlineSize,
        );

        this.graphics.fillStyle(color, alpha);

        this.graphics.fillRect(
            x - Math.floor(BEAM_CANNON_CHARGE.particleSize / 2),

            y - Math.floor(BEAM_CANNON_CHARGE.particleSize / 2),

            BEAM_CANNON_CHARGE.particleSize,

            BEAM_CANNON_CHARGE.particleSize,
        );
    }

    private drawCoreFlash(): void {
        if (this.coreFlashElapsedMs >= BEAM_CANNON_CHARGE.coreFlashDurationMs) {
            return;
        }

        const progress = Phaser.Math.Clamp(
            this.coreFlashElapsedMs / BEAM_CANNON_CHARGE.coreFlashDurationMs,

            0,
            1,
        );

        const inverseProgress = 1 - progress;

        const size = Math.round(
            Phaser.Math.Linear(
                BEAM_CANNON_CHARGE.coreFlashMinSize,

                BEAM_CANNON_CHARGE.coreFlashMaxSize,

                progress,
            ),
        );

        const alpha = Phaser.Math.Clamp(
            inverseProgress * 1.3,

            0,
            1,
        );

        this.drawSquareCore(size, BEAM_CANNON_CHARGE.color, alpha);

        const crossLength = size + 7;

        const crossThickness = 2;

        this.graphics.fillStyle(BEAM_CANNON_CHARGE.hotColor, alpha);

        this.graphics.fillRect(
            -Math.floor(crossLength / 2),

            -Math.floor(crossThickness / 2),

            crossLength,
            crossThickness,
        );

        this.graphics.fillRect(
            -Math.floor(crossThickness / 2),

            -Math.floor(crossLength / 2),

            crossThickness,
            crossLength,
        );
    }

    private drawSquareCore(size: number, color: number, alpha: number): void {
        const outlineSize = size + 4;

        this.graphics.fillStyle(
            BEAM_CANNON_CHARGE.outlineColor,

            Math.min(1, alpha + 0.1),
        );

        this.graphics.fillRect(
            -Math.floor(outlineSize / 2),

            -Math.floor(outlineSize / 2),

            outlineSize,
            outlineSize,
        );

        this.graphics.fillStyle(color, alpha);

        this.graphics.fillRect(
            -Math.floor(size / 2),
            -Math.floor(size / 2),

            size,
            size,
        );
    }
}
