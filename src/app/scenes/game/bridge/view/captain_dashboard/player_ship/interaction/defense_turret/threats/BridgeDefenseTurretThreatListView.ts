// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/interaction/defense_turret/threats/BridgeDefenseTurretThreatListView.ts
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../../../theme/font";
import type BridgeScene from "../../../../../../BridgeScene";
import type {
    BridgeCaptainIncomingMissilePayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../../../events/bridge_event";
import BridgeDefenseTurretThreatLaneView from "./BridgeDefenseTurretThreatLaneView";

const LIST = {
    rowHeight: 40,

    fireButtonWidth: 54,
    fireButtonHeight: 22,
    fireButtonGap: 14,

    rightPadding: 6,

    cutoffRatio: 0.25,

    cutoffDashWidth: 2,
    cutoffDashHeight: 4,
    cutoffDashGap: 4,
    cutoffAlpha: 0.7,
} as const;

export default class BridgeDefenseTurretThreatListView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly cutoffRoot: Phaser.GameObjects.Container;

    private readonly emptyText: Phaser.GameObjects.BitmapText;

    private readonly rowsByThreatId = new Map<string, BridgeDefenseTurretThreatLaneView>();

    private rowOrder: string[] = [];

    private readonly trajectoryLeftX: number;

    private readonly trajectoryRightX: number;

    private readonly cutoffX: number;

    private openState = false;

    private renderedCutoffRowCount = -1;

    private renderedCutoffVisible = false;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        private readonly height: number,
        private readonly onFireRequested: (command: BridgeOfficerCommandSelectedPayload) => void,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.trajectoryLeftX = LIST.fireButtonWidth + LIST.fireButtonGap;
        this.trajectoryRightX = this.width - LIST.rightPadding;

        this.cutoffX = Math.round(
            this.trajectoryLeftX + (this.trajectoryRightX - this.trajectoryLeftX) * LIST.cutoffRatio,
        );

        this.cutoffRoot = this.scene.add.container(0, 0);

        this.emptyText = this.scene.add
            .bitmapText(
                Math.round(this.width / 2),
                Math.round(this.height / 2 - 20),
                FONT_FAMILY.UI_PRIMARY,
                "NO INTERCEPTABLE THREATS",
                FONT_SIZE.PX_40,
            )
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.PRIMARY)
            .setVisible(false);

        this.root.add([this.cutoffRoot, this.emptyText]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public open(missiles: BridgeCaptainIncomingMissilePayload[]): void {
        this.openState = true;
        this.clearRows();

        const sortedMissiles = [...missiles].sort((left, right) => {
            return left.timeToImpactMs - right.timeToImpactMs;
        });

        for (const missile of sortedMissiles) {
            this.addRow(missile.projectileId);
        }

        this.update(sortedMissiles);
    }

    public close(): void {
        this.openState = false;
        this.clearRows();
        this.emptyText.setVisible(false);
        this.renderCutoff(0, false);
    }

    public update(missiles: BridgeCaptainIncomingMissilePayload[]): void {
        if (!this.openState) {
            return;
        }

        const missilesById = new Map(missiles.map((missile) => [missile.projectileId, missile]));

        for (const threatId of [...this.rowOrder]) {
            if (missilesById.has(threatId)) {
                continue;
            }

            this.rowsByThreatId.get(threatId)?.destroy();
            this.rowsByThreatId.delete(threatId);
            this.rowOrder = this.rowOrder.filter((id) => id !== threatId);
        }

        for (const missile of missiles) {
            if (this.rowsByThreatId.has(missile.projectileId)) {
                continue;
            }

            this.addRow(missile.projectileId);
        }

        const cutoffRemainingMs = getSharedCutoffRemainingMs(missiles);

        for (const threatId of this.rowOrder) {
            const missile = missilesById.get(threatId);
            const row = this.rowsByThreatId.get(threatId);

            if (!missile || !row) {
                continue;
            }

            row.update(missile, cutoffRemainingMs);
        }

        this.layoutRows();

        const hasRows = this.rowOrder.length > 0;
        this.emptyText.setVisible(!hasRows);

        this.renderCutoff(this.rowOrder.length, hasRows && typeof cutoffRemainingMs === "number");
    }

    public destroy(): void {
        this.clearRows();
        this.root.destroy(true);
    }

    private addRow(threatId: string): void {
        const row = new BridgeDefenseTurretThreatLaneView(
            this.scene,
            this.width,
            LIST.rowHeight,
            {
                trajectoryLeftX: this.trajectoryLeftX,
                trajectoryRightX: this.trajectoryRightX,
                cutoffX: this.cutoffX,

                fireButtonWidth: LIST.fireButtonWidth,
                fireButtonHeight: LIST.fireButtonHeight,
            },
            this.onFireRequested,
        );

        this.rowsByThreatId.set(threatId, row);
        this.rowOrder.push(threatId);
        this.root.add(row.getRoot());
    }

    private layoutRows(): void {
        for (let index = 0; index < this.rowOrder.length; index += 1) {
            const row = this.rowsByThreatId.get(this.rowOrder[index]);

            row?.setPosition(0, index * LIST.rowHeight);
        }
    }

    private renderCutoff(rowCount: number, visible: boolean): void {
        if (this.renderedCutoffRowCount === rowCount && this.renderedCutoffVisible === visible) {
            return;
        }

        this.renderedCutoffRowCount = rowCount;
        this.renderedCutoffVisible = visible;
        this.cutoffRoot.removeAll(true);

        if (!visible || rowCount <= 0) {
            return;
        }

        const height = Math.min(this.height, rowCount * LIST.rowHeight);

        for (let y = 0; y < height; y += LIST.cutoffDashHeight + LIST.cutoffDashGap) {
            const dashHeight = Math.min(LIST.cutoffDashHeight, height - y);

            const dash = this.scene.add
                .rectangle(this.cutoffX, y, LIST.cutoffDashWidth, dashHeight, FONT_COLOR.PRIMARY, LIST.cutoffAlpha)
                .setOrigin(0.5, 0);

            this.cutoffRoot.add(dash);
        }
    }

    private clearRows(): void {
        for (const row of this.rowsByThreatId.values()) {
            row.destroy();
        }

        this.rowsByThreatId.clear();
        this.rowOrder = [];
    }
}

function getSharedCutoffRemainingMs(missiles: BridgeCaptainIncomingMissilePayload[]): number | null | undefined {
    return missiles[0]?.decisionTimings?.interceptMissileMinRemainingMs;
}
