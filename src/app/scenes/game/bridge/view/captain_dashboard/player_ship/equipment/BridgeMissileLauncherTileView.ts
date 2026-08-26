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

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly baseIcon: Phaser.GameObjects.Image;

    private readonly progressIcon: Phaser.GameObjects.Image;

    private readonly ammoGlyph: Phaser.GameObjects.Graphics;

    private readonly ammoText: Phaser.GameObjects.BitmapText;

    private readonly integrityRoot: Phaser.GameObjects.Container;

    private chromeColor = FONT_COLOR.PRIMARY;

    private integrityCurrent = 0;

    private integrityMax = 0;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.titleText = this.scene.add
            .bitmapText(TILE.horizontalPadding, TILE.titleY, FONT_FAMILY.VGA_8X14, "M. LAUNCHER", FONT_SIZE.PX_14)
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

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

        this.ammoGlyph = this.scene.add.graphics();
        this.renderAmmoGlyph();

        this.ammoText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding + TILE.ammoGlyphWidth + TILE.ammoTextGap,
                TILE.statusY,
                FONT_FAMILY.VGA_8X14,
                "0",
                FONT_SIZE.PX_14,
            )
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

        this.integrityRoot = this.scene.add.container(0, 0);

        this.root.add([
            this.titleText,
            this.baseIcon,
            this.progressIcon,
            this.ammoGlyph,
            this.ammoText,
            this.integrityRoot,
        ]);
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
        this.integrityCurrent = current;
        this.integrityMax = max;
        this.renderIntegrity();
    }

    public setProgress(mode: MissileLauncherProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN:
                this.baseIcon.setTint(colors.cooldownColor);
                this.progressIcon.setTint(colors.readyColor);
                this.setChromeColor(colors.cooldownColor);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.REPAIR:
                this.baseIcon.setTint(colors.repairColor);
                this.progressIcon.setTint(colors.readyColor);
                this.setChromeColor(colors.repairColor);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING:
                this.baseIcon.setTint(colors.readyColor);
                this.progressIcon.setTint(colors.activityColor);
                this.setChromeColor(FONT_COLOR.PRIMARY);
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
        this.setChromeColor(FONT_COLOR.PRIMARY);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private setChromeColor(color: number): void {
        this.chromeColor = color;
        this.titleText.setTint(color);
        this.ammoText.setTint(color);
        this.renderAmmoGlyph();
        this.renderIntegrity();
    }

    private renderAmmoGlyph(): void {
        this.ammoGlyph.clear();
        this.ammoGlyph.fillStyle(this.chromeColor, 1);

        const y = TILE.statusY + TILE.ammoGlyphOffsetY;

        this.ammoGlyph.fillRect(TILE.horizontalPadding + 1, y + 1, 3, TILE.ammoGlyphHeight - 2);
        this.ammoGlyph.fillRect(TILE.horizontalPadding + 2, y, 1, 1);
        this.ammoGlyph.fillRect(
            TILE.horizontalPadding,
            y + TILE.ammoGlyphHeight - 1,
            TILE.ammoGlyphWidth,
            1,
        );
    }

    private renderIntegrity(): void {
        this.integrityRoot.removeAll(true);

        if (this.integrityMax <= 0) {
            return;
        }

        const totalWidth =
            this.integrityMax * TILE.integrityPipSize +
            (this.integrityMax - 1) * TILE.integrityPipGap;
        const startX = this.width - TILE.horizontalPadding - totalWidth;
        const emptyColor = 0x0b1621;

        for (let index = 0; index < this.integrityMax; index += 1) {
            const filled = index < this.integrityCurrent;
            const x = startX + index * (TILE.integrityPipSize + TILE.integrityPipGap);

            const pip = this.scene.add
                .rectangle(
                    x,
                    TILE.statusY + 2,
                    TILE.integrityPipSize,
                    TILE.integrityPipSize,
                    filled ? this.chromeColor : emptyColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(1, this.chromeColor);

            this.integrityRoot.add(pip);
        }
    }
}
