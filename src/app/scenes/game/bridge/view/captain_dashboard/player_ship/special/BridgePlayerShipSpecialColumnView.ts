import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const COLUMN = {
    sectionGap: 4,

    titleX: 3,
    titleY: 3,

    separatorY: 18,

    contentX: 6,
    contentTopY: 26,

    bridgeCellHeight: 16,
    bridgeCellGap: 4,

    hullBarHeight: 12,
    hullBarGap: 4,
} as const;

// Временная визуализация специальной колонки player dashboard.
//
// Нужна только как геометрический placeholder, чтобы видеть
// реальное место под BRIDGE / HULL до появления живого содержимого.
export default class BridgePlayerShipSpecialColumnView {
    private readonly root: Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const bridgePanelHeight = Math.floor((height - COLUMN.sectionGap) / 2);
        const hullPanelHeight = height - bridgePanelHeight - COLUMN.sectionGap;

        const bridgePanel = this.createPanel(width, bridgePanelHeight, "BRIDGE");
        const hullPanel = this.createPanel(width, hullPanelHeight, "HULL");
        hullPanel.setY(bridgePanelHeight + COLUMN.sectionGap);

        this.root.add([bridgePanel, hullPanel]);

        this.buildBridgeCells(bridgePanel, width);
        this.buildHullBars(hullPanel, width);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private createPanel(width: number, height: number, title: string): Phaser.GameObjects.Container {
        const panel = this.scene.add.container(0, 0);

        const background = this.scene.add
            .rectangle(
                0,
                0,
                width,
                height,
                CAPTAIN_DASHBOARD_STYLE.specialColumn.panelBackgroundColor,
                CAPTAIN_DASHBOARD_STYLE.specialColumn.panelBackgroundAlpha,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(
                CAPTAIN_DASHBOARD_STYLE.specialColumn.panelBorderThickness,
                CAPTAIN_DASHBOARD_STYLE.specialColumn.panelBorderColor,
            );

        const label = this.scene.add
            .bitmapText(COLUMN.titleX, COLUMN.titleY, FONT_FAMILY.VGA_8X14, title, FONT_SIZE.PX_14)
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.MUTED);

        const separator = this.scene.add
            .rectangle(
                4,
                COLUMN.separatorY,
                width - 8,
                1,
                CAPTAIN_DASHBOARD_STYLE.specialColumn.panelBorderColor,
                1,
            )
            .setOrigin(0, 0);

        panel.add([background, label, separator]);

        return panel;
    }

    private buildBridgeCells(panel: Phaser.GameObjects.Container, width: number): void {
        const cellWidth = width - COLUMN.contentX * 2;

        for (let index = 0; index < 4; index += 1) {
            const y = COLUMN.contentTopY + index * (COLUMN.bridgeCellHeight + COLUMN.bridgeCellGap);

            const cell = this.scene.add
                .rectangle(
                    COLUMN.contentX,
                    y,
                    cellWidth,
                    COLUMN.bridgeCellHeight,
                    CAPTAIN_DASHBOARD_STYLE.specialColumn.cellBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.specialColumn.cellBorderColor);

            panel.add(cell);
        }
    }

    private buildHullBars(panel: Phaser.GameObjects.Container, width: number): void {
        const barWidth = width - COLUMN.contentX * 2;

        for (let index = 0; index < 4; index += 1) {
            const y = COLUMN.contentTopY + index * (COLUMN.hullBarHeight + COLUMN.hullBarGap);

            const track = this.scene.add
                .rectangle(
                    COLUMN.contentX,
                    y,
                    barWidth,
                    COLUMN.hullBarHeight,
                    CAPTAIN_DASHBOARD_STYLE.specialColumn.hullTrackColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.specialColumn.cellBorderColor);

            const fill = this.scene.add
                .rectangle(
                    COLUMN.contentX + 2,
                    y + 2,
                    barWidth - 4,
                    COLUMN.hullBarHeight - 4,
                    CAPTAIN_DASHBOARD_STYLE.specialColumn.hullFillColor,
                    1,
                )
                .setOrigin(0, 0);

            panel.add([track, fill]);
        }
    }
}
