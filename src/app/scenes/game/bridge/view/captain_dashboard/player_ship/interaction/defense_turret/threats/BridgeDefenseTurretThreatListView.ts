// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/interaction/defense_turret/threats/BridgeDefenseTurretThreatListView.ts
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../../../theme/font";
import type BridgeScene from "../../../../../../BridgeScene";
import type {
    BridgeDefenseTurretThreatPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../../../events/bridge_event";
import BridgeDefenseTurretThreatLaneView from "./BridgeDefenseTurretThreatLaneView";

const LIST = {
    rowHeight: 40,

    fireButtonWidth: 64,
    fireButtonHeight: 22,
    fireButtonGap: 24,
    fireButtonLeftPadding: 8,

    contentInsetRatio: 0.075,
    rightPadding: 6,

    cutoffRatio: 0.25,

    rowMoveDurationMs: 160,
} as const;

export default class BridgeDefenseTurretThreatListView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly emptyText: Phaser.GameObjects.BitmapText;

    private readonly rowsByThreatId = new Map<string, BridgeDefenseTurretThreatLaneView>();

    private readonly rowTargetYByThreatId = new Map<string, number>();

    private rowOrder: string[] = [];

    private readonly contentInsetX: number;

    private readonly contentWidth: number;

    private readonly trajectoryLeftX: number;

    private readonly trajectoryRightX: number;

    private readonly cutoffX: number;

    private readonly visibleRowCapacity: number;

    private openState = false;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        private readonly height: number,
        private readonly onFireRequested: (command: BridgeOfficerCommandSelectedPayload) => void,
        private readonly onCancelRequested: (taskId: string) => void,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.contentInsetX = Math.round(this.width * LIST.contentInsetRatio);
        this.contentWidth = this.width - this.contentInsetX * 2;

        this.trajectoryLeftX =
            LIST.fireButtonLeftPadding + LIST.fireButtonWidth + LIST.fireButtonGap;
        this.trajectoryRightX = this.contentWidth - LIST.rightPadding;

        this.cutoffX = Math.round(
            this.trajectoryLeftX + (this.trajectoryRightX - this.trajectoryLeftX) * LIST.cutoffRatio,
        );

        this.visibleRowCapacity = Math.floor(this.height / LIST.rowHeight);

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

        this.root.add(this.emptyText);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public open(missiles: BridgeDefenseTurretThreatPayload[]): void {
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
    }

    public update(missiles: BridgeDefenseTurretThreatPayload[]): void {
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
            this.rowTargetYByThreatId.delete(threatId);
            this.rowOrder = this.rowOrder.filter((id) => id !== threatId);
        }

        for (const missile of missiles) {
            if (this.rowsByThreatId.has(missile.projectileId)) {
                continue;
            }

            this.addRow(missile.projectileId);
        }

        const cutoffRemainingMs = getSharedCutoffRemainingMs(missiles);
        const interceptActive = missiles.some((missile) => {
            return missile.activeTasks?.interceptMissileTaskId !== undefined;
        });

        for (const threatId of this.rowOrder) {
            const missile = missilesById.get(threatId);
            const row = this.rowsByThreatId.get(threatId);

            if (!missile || !row) {
                continue;
            }

            row.update(missile, cutoffRemainingMs, interceptActive);
        }

        this.layoutRows();

        const hasRows = this.rowOrder.length > 0;
        this.emptyText.setVisible(!hasRows);
    }

    public destroy(): void {
        this.clearRows();
        this.root.destroy(true);
    }

    private addRow(threatId: string): void {
        const row = new BridgeDefenseTurretThreatLaneView(
            this.scene,
            this.contentWidth,
            LIST.rowHeight,
            {
                trajectoryLeftX: this.trajectoryLeftX,
                trajectoryRightX: this.trajectoryRightX,
                cutoffX: this.cutoffX,

                fireButtonX: LIST.fireButtonLeftPadding,
                fireButtonWidth: LIST.fireButtonWidth,
                fireButtonHeight: LIST.fireButtonHeight,
            },
            this.onFireRequested,
            this.onCancelRequested,
        );

        this.rowsByThreatId.set(threatId, row);
        this.rowOrder.push(threatId);
        this.root.add(row.getRoot());
    }

    private layoutRows(): void {
        for (let index = 0; index < this.rowOrder.length; index += 1) {
            const threatId = this.rowOrder[index];
            const row = this.rowsByThreatId.get(threatId);

            if (!row) {
                continue;
            }

            const targetY = index * LIST.rowHeight;
            const previousTargetY = this.rowTargetYByThreatId.get(threatId);
            const shouldBeVisible = index < this.visibleRowCapacity;

            this.rowTargetYByThreatId.set(threatId, targetY);

            if (previousTargetY === undefined) {
                row.setPosition(this.contentInsetX, targetY);
                row.setVisible(shouldBeVisible);
                continue;
            }

            if (previousTargetY === targetY) {
                row.setVisible(shouldBeVisible);
                continue;
            }

            if (!shouldBeVisible) {
                row.setVisible(false);
                row.setPosition(this.contentInsetX, targetY);
                continue;
            }

            const wasVisible =
                previousTargetY < this.visibleRowCapacity * LIST.rowHeight;

            if (!wasVisible) {
                row.setVisible(false);
            }

            row.moveToY(
                targetY,
                LIST.rowMoveDurationMs,
                () => row.setVisible(true),
            );
        }
    }

    private clearRows(): void {
        for (const row of this.rowsByThreatId.values()) {
            row.destroy();
        }

        this.rowsByThreatId.clear();
        this.rowTargetYByThreatId.clear();
        this.rowOrder = [];
    }
}

function getSharedCutoffRemainingMs(missiles: BridgeDefenseTurretThreatPayload[]): number | null | undefined {
    return missiles[0]?.decisionTimings?.interceptMissileMinRemainingMs;
}
