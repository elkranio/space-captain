// Read-only equipment tile used only by the persistent enemy dashboard.
import type { SpriteEntry } from "../../../../../../../manifests/types";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type { BridgeEnemyEquipmentDashboardPayload } from "../../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,
    titleY: 3,

    integrityPipSize: 8,
    integrityPipGap: 3,
    bottomPadding: 10,
} as const;

export default class BridgeEnemyEquipmentTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly stateText: Phaser.GameObjects.BitmapText;

    private readonly integrityRoot: Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        private readonly height: number,
        sprite: SpriteEntry,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.titleText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding,
                TILE.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        this.icon = this.scene.add
            .image(
                Math.round(this.width / 2),
                Math.round(this.height / 2) + 1,
                sprite.atlasKey,
                sprite.frameKey,
            )
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

        this.stateText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding,
                this.height - TILE.bottomPadding - FONT_SIZE.PX_16,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0);

        this.integrityRoot = this.scene.add.container(0, 0);

        this.root.add([
            this.titleText,
            this.icon,
            this.stateText,
            this.integrityRoot,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(payload: BridgeEnemyEquipmentDashboardPayload): void {
        const chromeColor = payload.broken
            ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
            : FONT_COLOR.PRIMARY;

        this.titleText
            .setText(payload.shortName)
            .setTint(chromeColor);

        this.icon
            .setTexture(payload.sprite.atlasKey, payload.sprite.frameKey)
            .setTint(
                payload.broken
                    ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
                    : CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor,
            );

        this.stateText
            .setText(payload.broken ? "BROKEN" : "")
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor);

        this.renderIntegrity(
            payload.integrity.current,
            payload.integrity.max,
            payload.broken,
        );
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private renderIntegrity(current: number, max: number, broken: boolean): void {
        this.integrityRoot.removeAll(true);

        if (max <= 0) {
            return;
        }

        const pipSize = TILE.integrityPipSize;
        const gap = TILE.integrityPipGap;
        const totalWidth = max * pipSize + (max - 1) * gap;
        const startX = this.width - TILE.horizontalPadding - totalWidth;
        const y = this.height - TILE.bottomPadding - pipSize;
        const filledCount = Math.max(0, Math.min(current, max));
        const borderColor = broken
            ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
            : CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.borderColor;

        for (let index = 0; index < max; index += 1) {
            const x = startX + index * (pipSize + gap);
            const filled = index < filledCount;

            const pip = this.scene.add
                .rectangle(
                    x,
                    y,
                    pipSize,
                    pipSize,
                    filled
                        ? CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.filledColor
                        : CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.emptyColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(1, borderColor);

            this.integrityRoot.add(pip);
        }
    }
}
