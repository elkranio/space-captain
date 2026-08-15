import type BridgeScene from '../BridgeScene';
import {
    BRIDGE_MISSILE_DEBUG_CONFIG,
    type BridgeMissileDebugPoint,
} from './bridge_missile_debug_config';

type FlightState = {
    timeProgress: number;
};

type MissileVisualState =
    | 'far'
    | 'approach'
    | 'terminal';

export default class BridgeMissileDebugView {
    private missileRoot?: Phaser.GameObjects.Container;
    private missileGraphics?: Phaser.GameObjects.Graphics;
    private flightTween?: Phaser.Tweens.Tween;

    private visualState?: MissileVisualState;

    constructor(private readonly scene: BridgeScene) {
        this.scene.input.keyboard?.on(
            'keydown-M',
            this.launch,
            this,
        );
    }

    public destroy(): void {
        this.scene.input.keyboard?.off(
            'keydown-M',
            this.launch,
            this,
        );

        this.clearFlight();
    }

    private launch(): void {
        this.clearFlight();

        const config = BRIDGE_MISSILE_DEBUG_CONFIG;

        this.missileRoot = this.scene.add.container(
            config.start.x,
            config.start.y,
        );

        this.scene.layers
            .get('vfx')
            .add(this.missileRoot);

        this.missileGraphics =
            this.scene.add.graphics();

        this.missileRoot.add(
            this.missileGraphics,
        );

        this.visualState = undefined;
        this.setVisualState('far');

        const flightState: FlightState = {
            timeProgress: 0,
        };

        this.updateFlight(0);

        this.flightTween = this.scene.tweens.add({
            targets: flightState,
            timeProgress: 1,
            duration: config.durationMs,
            ease: 'Linear',

            onUpdate: () => {
                this.updateFlight(
                    flightState.timeProgress,
                );
            },

            onComplete: () => {
                this.completeFlight();
            },
        });
    }

    private updateFlight(
        timeProgress: number,
    ): void {
        if (!this.missileRoot) {
            return;
        }

        const clampedTimeProgress =
            Phaser.Math.Clamp(
                timeProgress,
                0,
                1,
            );

        const pathProgress =
            this.mapTimeToPathProgress(
                clampedTimeProgress,
            );

        const point =
            this.getBezierPoint(
                pathProgress,
            );

        const tangent =
            this.getBezierTangent(
                pathProgress,
            );

        this.missileRoot.setPosition(
            point.x,
            point.y,
        );

        // The Phaser gizmo is authored with its nose pointing
        // toward local +X. Therefore its rotation is exactly
        // the path tangent. No sprite-forward offset, no Rex
        // mesh rotation, no perspective math.
        this.missileRoot.rotation =
            Math.atan2(
                tangent.y,
                tangent.x,
            );

        const visualState =
            this.getVisualState(
                clampedTimeProgress,
            );

        this.setVisualState(
            visualState,
        );

        const scaleProgress =
            clampedTimeProgress *
            clampedTimeProgress *
            clampedTimeProgress;

        const scaleMultiplier =
            Phaser.Math.Linear(
                1,
                BRIDGE_MISSILE_DEBUG_CONFIG
                    .gizmo
                    .maxScaleMultiplier,
                scaleProgress,
            );

        this.missileRoot.setScale(
            BRIDGE_MISSILE_DEBUG_CONFIG
                .gizmo
                .initialScale *
            scaleMultiplier,
        );
    }

    private getVisualState(
        timeProgress: number,
    ): MissileVisualState {
        const config =
            BRIDGE_MISSILE_DEBUG_CONFIG
                .gizmo;

        if (
            timeProgress >=
            config.terminalStateStartTimeProgress
        ) {
            return 'terminal';
        }

        if (
            timeProgress >=
            config.approachStateStartTimeProgress
        ) {
            return 'approach';
        }

        return 'far';
    }

    private setVisualState(
        state: MissileVisualState,
    ): void {
        if (
            this.visualState === state ||
            !this.missileGraphics
        ) {
            return;
        }

        this.visualState = state;

        switch (state) {
            case 'far':
                this.drawFarState();
                return;

            case 'approach':
                this.drawApproachState();
                return;

            case 'terminal':
                this.drawTerminalState();
                return;
        }
    }

    private drawFarState(): void {
        const graphics =
            this.prepareMissileGraphics();

        const colors =
            BRIDGE_MISSILE_DEBUG_CONFIG
                .gizmo;

        // Engine: always behind, local -X.
        graphics.fillStyle(
            colors.engineColor,
            1,
        );

        graphics.fillRect(
            -18,
            -5,
            7,
            10,
        );

        // Body.
        graphics.fillStyle(
            colors.bodyColor,
            1,
        );

        graphics.fillRect(
            -11,
            -5,
            21,
            10,
        );

        // Nose: always forward, local +X.
        graphics.fillStyle(
            colors.noseColor,
            1,
        );

        graphics.fillTriangle(
            10,
            -7,
            10,
            7,
            21,
            0,
        );

        graphics.lineStyle(
            2,
            colors.outlineColor,
            1,
        );

        graphics.strokeRect(
            -18,
            -5,
            28,
            10,
        );

        graphics.lineBetween(
            10,
            -7,
            21,
            0,
        );

        graphics.lineBetween(
            21,
            0,
            10,
            7,
        );
    }

    private drawApproachState(): void {
        const graphics =
            this.prepareMissileGraphics();

        const colors =
            BRIDGE_MISSILE_DEBUG_CONFIG
                .gizmo;

        // Slightly foreshortened authored state.
        graphics.fillStyle(
            colors.engineColor,
            1,
        );

        graphics.fillRect(
            -14,
            -6,
            6,
            12,
        );

        graphics.fillStyle(
            colors.bodyDarkColor,
            1,
        );

        graphics.fillRect(
            -8,
            -7,
            15,
            14,
        );

        graphics.fillStyle(
            colors.bodyColor,
            1,
        );

        graphics.fillRect(
            -6,
            -5,
            13,
            10,
        );

        graphics.fillStyle(
            colors.noseColor,
            1,
        );

        graphics.fillTriangle(
            7,
            -9,
            7,
            9,
            19,
            0,
        );

        graphics.lineStyle(
            2,
            colors.outlineColor,
            1,
        );

        graphics.lineBetween(
            7,
            -9,
            19,
            0,
        );

        graphics.lineBetween(
            19,
            0,
            7,
            9,
        );
    }

    private drawTerminalState(): void {
        const graphics =
            this.prepareMissileGraphics();

        const colors =
            BRIDGE_MISSILE_DEBUG_CONFIG
                .gizmo;

        // Fake authored near-camera state:
        // shorter body, much wider white nose.
        graphics.fillStyle(
            colors.engineColor,
            1,
        );

        graphics.fillRect(
            -9,
            -5,
            5,
            10,
        );

        graphics.fillStyle(
            colors.bodyDarkColor,
            1,
        );

        graphics.fillRect(
            -4,
            -9,
            8,
            18,
        );

        graphics.fillStyle(
            colors.noseColor,
            1,
        );

        graphics.fillTriangle(
            2,
            -13,
            2,
            13,
            16,
            0,
        );

        graphics.lineStyle(
            2,
            colors.outlineColor,
            1,
        );

        graphics.lineBetween(
            2,
            -13,
            16,
            0,
        );

        graphics.lineBetween(
            16,
            0,
            2,
            13,
        );
    }

    private prepareMissileGraphics():
        Phaser.GameObjects.Graphics {
        if (!this.missileGraphics) {
            throw new Error(
                'Missile debug graphics are not initialized',
            );
        }

        this.missileGraphics.clear();

        return this.missileGraphics;
    }

    private mapTimeToPathProgress(
        timeProgress: number,
    ): number {
        if (timeProgress < 0.08) {
            const local =
                timeProgress / 0.08;

            return Phaser.Math.Linear(
                0,
                0.09,
                this.easeOutCubic(local),
            );
        }

        if (timeProgress < 0.72) {
            const local =
                (timeProgress - 0.08) /
                0.64;

            return Phaser.Math.Linear(
                0.09,
                0.28,
                this.easeInOutSine(local),
            );
        }

        if (timeProgress < 0.94) {
            const local =
                (timeProgress - 0.72) /
                0.22;

            return Phaser.Math.Linear(
                0.28,
                0.63,
                local * local,
            );
        }

        const local =
            (timeProgress - 0.94) /
            0.06;

        return Phaser.Math.Linear(
            0.63,
            1,
            local * local * local,
        );
    }

    private getBezierPoint(
        progress: number,
    ): BridgeMissileDebugPoint {
        const config =
            BRIDGE_MISSILE_DEBUG_CONFIG;

        const start = config.start;
        const control1 =
            config.curve.control1;
        const control2 =
            config.curve.control2;
        const end =
            config.curve.end;

        const inverse = 1 - progress;
        const inverseSquared =
            inverse * inverse;
        const progressSquared =
            progress * progress;

        return {
            x:
                inverseSquared *
                    inverse *
                    start.x +
                3 *
                    inverseSquared *
                    progress *
                    control1.x +
                3 *
                    inverse *
                    progressSquared *
                    control2.x +
                progressSquared *
                    progress *
                    end.x,

            y:
                inverseSquared *
                    inverse *
                    start.y +
                3 *
                    inverseSquared *
                    progress *
                    control1.y +
                3 *
                    inverse *
                    progressSquared *
                    control2.y +
                progressSquared *
                    progress *
                    end.y,
        };
    }

    private getBezierTangent(
        progress: number,
    ): BridgeMissileDebugPoint {
        const config =
            BRIDGE_MISSILE_DEBUG_CONFIG;

        const start = config.start;
        const control1 =
            config.curve.control1;
        const control2 =
            config.curve.control2;
        const end =
            config.curve.end;

        const inverse = 1 - progress;

        return {
            x:
                3 *
                    inverse *
                    inverse *
                    (control1.x - start.x) +
                6 *
                    inverse *
                    progress *
                    (control2.x - control1.x) +
                3 *
                    progress *
                    progress *
                    (end.x - control2.x),

            y:
                3 *
                    inverse *
                    inverse *
                    (control1.y - start.y) +
                6 *
                    inverse *
                    progress *
                    (control2.y - control1.y) +
                3 *
                    progress *
                    progress *
                    (end.y - control2.y),
        };
    }

    private completeFlight(): void {
        const config =
            BRIDGE_MISSILE_DEBUG_CONFIG
                .impact;

        this.flightTween = undefined;

        this.missileRoot?.destroy();
        this.missileRoot = undefined;
        this.missileGraphics = undefined;
        this.visualState = undefined;

        const flash =
            this.scene.add.circle(
                config.flashX,
                config.flashY,
                config.flashRadius,
                config.flashColor,
                0.85,
            );

        this.scene.layers
            .get('vfx')
            .add(flash);

        this.scene.tweens.add({
            targets: flash,
            scale: config.flashScale,
            alpha: 0,
            duration:
                config.flashDurationMs,
            ease: 'Quad.Out',

            onComplete: () => {
                flash.destroy();
            },
        });

        this.scene.cameras.main.shake(
            config.shakeDurationMs,
            config.shakeIntensity,
        );
    }

    private clearFlight(): void {
        this.flightTween?.stop();
        this.flightTween = undefined;

        this.missileRoot?.destroy();
        this.missileRoot = undefined;
        this.missileGraphics = undefined;
        this.visualState = undefined;
    }

    private easeOutCubic(
        value: number,
    ): number {
        const inverse = 1 - value;

        return (
            1 -
            inverse *
                inverse *
                inverse
        );
    }

    private easeInOutSine(
        value: number,
    ): number {
        return -(
            Math.cos(
                Math.PI * value,
            ) - 1
        ) / 2;
    }
}
