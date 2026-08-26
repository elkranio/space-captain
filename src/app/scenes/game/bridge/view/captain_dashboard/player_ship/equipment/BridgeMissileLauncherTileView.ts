// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeMissileLauncherTileView.ts
import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../../../manifests/bridge/captain_dashboard";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,

    titleY: 6,

    statusY: 70,

    ammoGlyphWidth: 5,
    ammoGlyphHeight: 8,
    ammoGlyphOffsetY: 2,
    ammoTextGap: 4,

    integrityPipSize: 8,
    integrityPipGap: 3,
} as const;

export const MISSILE_LAUNCHER_PROGRESS_MODE = {
    COOLDOWN: "cooldown",
    REPAIR: "repair",
    TARGETING: "targeting",
} as const;

export type MissileLauncherProgressMode =
    (typeof MISSILE_LAUNCHER_PROGRESS_MODE)[keyof typeof MISSILE_LAUNCHER_PROGRESS_MODE];

// Первый concrete equipment tile.
//
// Уже содержит постоянную геометрию launcher tile:
// title, pictogram, ammo и integrity.
// Debug-view пока подаёт тестовые значения и гоняет progress states.
export default class BridgeMissileLauncherTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly baseIcon: Phaser.GameObjects.Image;

    private readonly progressIcon: Phaser.GameObjects.Image;

    private readonly ammoText: Phaser.GameObjects.BitmapText;

    private readonly integrityRoot: Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const title = this.scene.add
            .bitmapText(TILE.horizontalPadding, TILE.titleY, FONT_FAMILY.VGA_8X14, "M. LAUNCHER", FONT_SIZE.PX_14)
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        const sprite = CAPTAIN_DASHBOARD_SPRITES[CAPTAIN_DASHBOARD_SPRITE_ID.MISSILE_LAUNCHER_SIMPLE_ROCKET];

        const centerX = Math.round(this.width / 2);
        const centerY = Math.round(height / 2) + 1;

        this.baseIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

        this.progressIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor)
            .setVisible(false);

        const ammoGlyph = this.createAmmoGlyph();

        this.ammoText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding + TILE.ammoGlyphWidth + TILE.ammoTextGap,
                TILE.statusY,
                FONT_FAMILY.VGA_8X14,
                "0",
                FONT_SIZE.PX_14,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        this.integrityRoot = this.scene.add.container(0, 0);

        this.root.add([title, this.baseIcon, this.progressIcon, ammoGlyph, this.ammoText, this.integrityRoot]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setAmmo(current: number): void {
        this.ammoText.setText(`${current}`);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityRoot.removeAll(true);

        if (max <= 0) {
            return;
        }

        const totalWidth = max * TILE.integrityPipSize + (max - 1) * TILE.integrityPipGap;
        const startX = this.width - TILE.horizontalPadding - totalWidth;
        const borderColor = current <= 0 ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor : FONT_COLOR.PRIMARY;
        const emptyColor = 0x0b1621;

        for (let index = 0; index < max; index += 1) {
            const filled = index < current;
            const x = startX + index * (TILE.integrityPipSize + TILE.integrityPipGap);

            const pip = this.scene.add
                .rectangle(
                    x,
                    TILE.statusY + 2,
                    TILE.integrityPipSize,
                    TILE.integrityPipSize,
                    filled ? FONT_COLOR.PRIMARY : emptyColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(1, borderColor);

            this.integrityRoot.add(pip);
        }
    }

    public setProgress(mode: MissileLauncherProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN:
                this.baseIcon.setTint(colors.cooldownColor);
                this.progressIcon.setTint(colors.readyColor);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.REPAIR:
                this.baseIcon.setTint(colors.repairColor);
                this.progressIcon.setTint(colors.readyColor);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING:
                this.baseIcon.setTint(colors.readyColor);
                this.progressIcon.setTint(colors.activityColor);
                break;
        }

        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
        const cropWidth = Math.round(this.progressIcon.width * clampedProgress);

        if (cropWidth <= 0) {
            this.progressIcon.setVisible(false);
            return;
        }

        this.progressIcon.setVisible(true).setCrop(0, 0, cropWidth, this.progressIcon.height);
    }

    public resetProgress(): void {
        this.baseIcon.setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);
        this.progressIcon.setVisible(false);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private createAmmoGlyph(): Phaser.GameObjects.Graphics {
        const glyph = this.scene.add.graphics();

        glyph.fillStyle(FONT_COLOR.PRIMARY, 1);
        const y = TILE.statusY + TILE.ammoGlyphOffsetY;

        glyph.fillRect(TILE.horizontalPadding + 1, y + 1, 3, TILE.ammoGlyphHeight - 2);
        glyph.fillRect(TILE.horizontalPadding + 2, y, 1, 1);
        glyph.fillRect(TILE.horizontalPadding, y + TILE.ammoGlyphHeight - 1, TILE.ammoGlyphWidth, 1);

        return glyph;
    }
}
