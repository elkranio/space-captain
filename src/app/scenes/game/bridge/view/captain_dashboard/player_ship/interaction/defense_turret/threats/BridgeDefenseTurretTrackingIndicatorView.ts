import { FONT_COLOR } from "../../../../../../../../../theme/font";
import type BridgeScene from "../../../../../../BridgeScene";

const TRACKER = {
    width: 8,
    height: 8,
    loopMs: 600,
    targetGap: 8,
} as const;

export default class BridgeDefenseTurretTrackingIndicatorView {
    private readonly marker: Phaser.GameObjects.Triangle;

    private active = false;

    private cycleStartedAtMs = 0;

    constructor(private readonly scene: BridgeScene) {
        this.marker = this.scene.add
            .triangle(
                0,
                0,
                0,
                0,
                0,
                TRACKER.height,
                TRACKER.width,
                Math.round(TRACKER.height / 2),
                FONT_COLOR.ACTIVITY,
                1,
            )
            .setOrigin(0.5, 0.5)
            .setVisible(false);
    }

    public getRoot(): Phaser.GameObjects.Triangle {
        return this.marker;
    }

    public update(active: boolean, startX: number, targetX: number, y: number): void {
        const endX = targetX - TRACKER.targetGap;

        if (!active) {
            this.active = false;
            this.marker.setVisible(false);
            return;
        }

        if (!this.active) {
            this.active = true;
            this.cycleStartedAtMs = this.scene.time.now;
        }

        if (endX <= startX) {
            this.marker.setVisible(false);
            return;
        }

        const elapsedMs = this.scene.time.now - this.cycleStartedAtMs;
        const phase = (elapsedMs % TRACKER.loopMs) / TRACKER.loopMs;
        const x = Math.round(Phaser.Math.Linear(startX, endX, phase));

        this.marker.setPosition(x, y).setVisible(true);
    }

    public destroy(): void {
        this.marker.destroy();
    }
}
