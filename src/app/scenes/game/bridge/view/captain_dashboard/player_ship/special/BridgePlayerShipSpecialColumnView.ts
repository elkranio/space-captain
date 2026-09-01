// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/special/BridgePlayerShipSpecialColumnView.ts
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import { BRIDGE_EVENT, type BridgePlayerShipDashboardUpdatedPayload } from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const COLUMN = {
    sectionGap: 4,

    titleX: 3,
    titleY: 3,

    bridgeSeparatorY: 18,
    bridgeContentTopY: 26,

    hullSeparatorY: 25,
    hullContentTopY: 29,

    contentX: 6,

    bridgeCellHeight: 16,
    bridgeCellGap: 4,

    hullRowsPerColumn: 10,
    hullSegmentRowGap: 2,
    hullSegmentColumnGap: 4,
    maxHullColumns: 3,
} as const;

// Special player-ship column.
//
// HULL is now authoritative presentation. BRIDGE remains a visual placeholder
// until its own gameplay/presentation contract is designed.
export default class BridgePlayerShipSpecialColumnView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hullPanel: Phaser.GameObjects.Container;

    private readonly hullSegments: Phaser.GameObjects.Rectangle[] = [];

    private readonly hullPanelHeight: number;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.hullPanelHeight = Math.floor((height - COLUMN.sectionGap) / 2);
        const bridgePanelHeight = height - this.hullPanelHeight - COLUMN.sectionGap;

        this.hullPanel = this.createPanel(
            this.hullPanelHeight,
            "HULL",
            FONT_FAMILY.UI_PRIMARY,
            FONT_SIZE.PX_20,
            FONT_COLOR.PRIMARY,
            COLUMN.hullSeparatorY,
            true,
        );

        const bridgePanel = this.createPanel(
            bridgePanelHeight,
            "BRIDGE",
            FONT_FAMILY.VGA_8X14,
            FONT_SIZE.PX_14,
            FONT_COLOR.MUTED,
            COLUMN.bridgeSeparatorY,
        );
        bridgePanel.setY(this.hullPanelHeight + COLUMN.sectionGap);

        this.root.add([this.hullPanel, bridgePanel]);

        this.buildBridgeCells(bridgePanel);

        this.eventBus.on(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, this.handleDashboardUpdated, this);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, this.handleDashboardUpdated, this);

        this.destroyHullSegments();
        this.root.destroy(true);
    }

    private createPanel(
        height: number,
        title: string,
        fontFamily: string,
        fontSize: number,
        titleColor: number,
        separatorY: number,
        centerTitle = false,
    ): Phaser.GameObjects.Container {
        const panel = this.scene.add.container(0, 0);

        const background = this.scene.add
            .rectangle(
                0,
                0,
                this.width,
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
            .bitmapText(
                centerTitle ? Math.round(this.width / 2) : COLUMN.titleX,
                COLUMN.titleY,
                fontFamily,
                title,
                fontSize,
            )
            .setOrigin(centerTitle ? 0.5 : 0, 0)
            .setTint(titleColor);

        const separator = this.scene.add
            .rectangle(4, separatorY, this.width - 8, 1, CAPTAIN_DASHBOARD_STYLE.specialColumn.panelBorderColor, 1)
            .setOrigin(0, 0);

        panel.add([background, label, separator]);

        return panel;
    }

    private buildBridgeCells(panel: Phaser.GameObjects.Container): void {
        const cellWidth = this.width - COLUMN.contentX * 2;

        for (let index = 0; index < 4; index += 1) {
            const y = COLUMN.bridgeContentTopY + index * (COLUMN.bridgeCellHeight + COLUMN.bridgeCellGap);

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

    private handleDashboardUpdated(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const hull = payload.status?.hull;

        if (!hull) {
            return;
        }

        this.reconcileHullSegments(hull.max);
        this.updateHullSegments(hull.current);
    }

    private reconcileHullSegments(max: number): void {
        if (!Number.isInteger(max) || max < 0) {
            throw new Error("Player HULL max must be a non-negative integer: " + max);
        }

        if (this.hullSegments.length === max) {
            return;
        }

        this.destroyHullSegments();

        if (max === 0) {
            return;
        }

        const rowsPerColumn = COLUMN.hullRowsPerColumn;
        const columnCount = Math.ceil(max / rowsPerColumn);

        if (columnCount > COLUMN.maxHullColumns) {
            throw new Error("Player HULL requires more than " + COLUMN.maxHullColumns + " HP columns: " + max);
        }

        const availableHeight = this.hullPanelHeight - COLUMN.hullContentTopY;
        const segmentHeight = Math.floor(
            (availableHeight - COLUMN.hullSegmentRowGap * (rowsPerColumn - 1)) / rowsPerColumn,
        );

        if (segmentHeight <= 0) {
            throw new Error("Player HULL HP segments are too short to render");
        }

        const availableWidth = this.width - COLUMN.contentX * 2;
        const segmentWidth = Math.floor(
            (availableWidth - COLUMN.hullSegmentColumnGap * (columnCount - 1)) / columnCount,
        );

        if (segmentWidth <= 0) {
            throw new Error("Player HULL HP segments are too narrow to render");
        }

        for (let index = 0; index < max; index += 1) {
            const column = Math.floor(index / rowsPerColumn);
            const row = index % rowsPerColumn;

            const x = COLUMN.contentX + column * (segmentWidth + COLUMN.hullSegmentColumnGap);
            const y = COLUMN.hullContentTopY + row * (segmentHeight + COLUMN.hullSegmentRowGap);

            const segment = this.scene.add
                .rectangle(x, y, segmentWidth, segmentHeight, CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.filledColor, 1)
                .setOrigin(0, 0)
                .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.borderColor);

            this.hullSegments.push(segment);
            this.hullPanel.add(segment);
        }
    }

    private updateHullSegments(current: number): void {
        const clampedCurrent = Phaser.Math.Clamp(Math.floor(current), 0, this.hullSegments.length);

        for (let index = 0; index < this.hullSegments.length; index += 1) {
            const segment = this.hullSegments[index];

            if (!segment) {
                continue;
            }

            segment.setFillStyle(
                index < clampedCurrent
                    ? CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.filledColor
                    : CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.emptyColor,
                1,
            );
        }
    }

    private destroyHullSegments(): void {
        for (const segment of this.hullSegments) {
            segment.destroy();
        }

        this.hullSegments.length = 0;
    }
}
