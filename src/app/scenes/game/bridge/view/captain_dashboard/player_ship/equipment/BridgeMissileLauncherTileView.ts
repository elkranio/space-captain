import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../../../manifests/bridge/captain_dashboard";
import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

export const MISSILE_LAUNCHER_PROGRESS_MODE = {
    COOLDOWN: "cooldown",
    REPAIR: "repair",
    TARGETING: "targeting",
} as const;

export type MissileLauncherProgressMode =
    (typeof MISSILE_LAUNCHER_PROGRESS_MODE)[keyof typeof MISSILE_LAUNCHER_PROGRESS_MODE];

// Первый concrete equipment tile.
//
// Пока содержит только пиктограмму и progress overlay.
// Debug-view гоняет три состояния, а tile ничего не знает про debug input.
export default class BridgeMissileLauncherTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly baseIcon: Phaser.GameObjects.Image;

    private readonly progressIcon: Phaser.GameObjects.Image;

    constructor(
        private readonly scene: BridgeScene,
        width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const sprite = CAPTAIN_DASHBOARD_SPRITES[
            CAPTAIN_DASHBOARD_SPRITE_ID.MISSILE_LAUNCHER_SIMPLE_ROCKET
        ];

        const centerX = Math.round(width / 2);
        const centerY = Math.round(height / 2);

        this.baseIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTintFill(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

        this.progressIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTintFill(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor)
            .setVisible(false);

        this.root.add([this.baseIcon, this.progressIcon]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setProgress(mode: MissileLauncherProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN:
                this.baseIcon.setTintFill(colors.cooldownColor);
                this.progressIcon.setTintFill(colors.readyColor);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.REPAIR:
                this.baseIcon.setTintFill(colors.repairColor);
                this.progressIcon.setTintFill(colors.readyColor);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING:
                this.baseIcon.setTintFill(colors.readyColor);
                this.progressIcon.setTintFill(colors.activityColor);
                break;
        }

        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
        const cropWidth = Math.round(this.progressIcon.width * clampedProgress);

        if (cropWidth <= 0) {
            this.progressIcon.setVisible(false);
            return;
        }

        this.progressIcon
            .setVisible(true)
            .setCrop(0, 0, cropWidth, this.progressIcon.height);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
