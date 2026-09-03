import type { SpriteEntry } from "../../../../../manifests/types";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

// Dumb two-layer equipment icon.
// The caller owns gameplay semantics and colors; this view only owns crop/visibility.
export default class BridgeEquipmentProgressIconView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly baseIcon: Phaser.GameObjects.Image;

    private readonly progressIcon: Phaser.GameObjects.Image;

    constructor(scene: BridgeScene, sprite: SpriteEntry) {
        this.root = scene.add.container(0, 0);

        this.baseIcon = scene.add
            .image(0, 0, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

        this.progressIcon = scene.add
            .image(0, 0, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor)
            .setVisible(false);

        this.root.add([this.baseIcon, this.progressIcon]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setBaseColor(color: number): void {
        this.baseIcon.setTint(color);
        this.progressIcon.setVisible(false);
    }

    public setProgress(
        baseColor: number,
        progressColor: number,
        progress: number,
    ): void {
        this.baseIcon.setTint(baseColor);
        this.progressIcon.setTint(progressColor);

        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
        const cropWidth = Math.round(this.progressIcon.width * clampedProgress);
        const visible = cropWidth > 0;

        if (visible) {
            this.progressIcon.setCrop(
                0,
                0,
                cropWidth,
                this.progressIcon.height,
            );
        }

        this.progressIcon.setVisible(visible);
    }
}
