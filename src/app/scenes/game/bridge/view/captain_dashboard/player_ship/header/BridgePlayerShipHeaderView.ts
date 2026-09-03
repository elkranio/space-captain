// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/header/BridgePlayerShipHeaderView.ts
import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../../../manifests/bridge/captain_dashboard";
import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import { BRIDGE_EVENT, type BridgePlayerShipDashboardUpdatedPayload } from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import BridgeHullStatusView from "../../BridgeHullStatusView";

const HULL_X = 8;

const POWER_CORE = {
    rightPadding: 12,

    segmentWidth: 8,
    segmentHeight: 14,
    segmentGap: 3,
    segmentY: 11,
    segmentInset: 0,

    iconGap: 8,
} as const;

type PowerCoreSegmentView = {
    frame: Phaser.GameObjects.Rectangle;
    track: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
};

// Top strip for the player dashboard.
// HULL shows authoritative HP; Power Core shows charges and recharge progress.
export default class BridgePlayerShipHeaderView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hullView: BridgeHullStatusView;

    private readonly powerCoreIcon: Phaser.GameObjects.Image;

    private readonly powerCoreSegments: PowerCoreSegmentView[] = [];

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly width: number,
        private readonly height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const centerY = this.height / 2;

        this.hullView = new BridgeHullStatusView(this.scene, this.height);
        this.hullView.setPosition(HULL_X, 0);

        const powerCoreIconAsset = CAPTAIN_DASHBOARD_SPRITES[CAPTAIN_DASHBOARD_SPRITE_ID.POWER_CORE_ICON];

        this.powerCoreIcon = this.scene.add
            .image(
                this.width - POWER_CORE.rightPadding,
                centerY,
                powerCoreIconAsset.atlasKey,
                powerCoreIconAsset.frameKey,
            )
            .setOrigin(1, 0.5);

        const divider = this.scene.add
            .rectangle(0, this.height - 1, this.width, 3, CAPTAIN_DASHBOARD_STYLE.header.dividerColor, 1)
            .setOrigin(0, 0);

        this.root.add([this.hullView.getRoot(), this.powerCoreIcon, divider]);

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

        this.hullView.destroy();
        this.destroyPowerCoreSegments();
        this.root.destroy(true);
    }

    private handleDashboardUpdated(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const hull = payload.status?.hull;

        if (hull) {
            this.hullView.update(hull.current, hull.max);
        } else {
            this.hullView.clear();
        }

        const powerCore = payload.status?.powerCore;

        if (!powerCore) {
            return;
        }

        this.reconcilePowerCoreSegments(powerCore.max);
        this.updatePowerCoreSegments(powerCore.current, powerCore.rechargeProgress);
    }

    private reconcilePowerCoreSegments(max: number): void {
        if (this.powerCoreSegments.length === max) {
            return;
        }

        this.destroyPowerCoreSegments();

        if (max <= 0) {
            this.powerCoreIcon.setPosition(this.width - POWER_CORE.rightPadding, this.height / 2);
            return;
        }

        const segmentsWidth = max * POWER_CORE.segmentWidth + Math.max(0, max - 1) * POWER_CORE.segmentGap;

        const segmentsX = this.width - POWER_CORE.rightPadding - segmentsWidth;

        this.powerCoreIcon.setPosition(segmentsX - POWER_CORE.iconGap, this.height / 2);

        for (let index = 0; index < max; index += 1) {
            const x = segmentsX + index * (POWER_CORE.segmentWidth + POWER_CORE.segmentGap);

            const frame = this.scene.add
                .rectangle(x, POWER_CORE.segmentY, POWER_CORE.segmentWidth, POWER_CORE.segmentHeight, 0x000000, 0)
                .setOrigin(0, 0)
                .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.powerCore.emptyBorderColor);

            const track = this.scene.add
                .rectangle(
                    x + 1,
                    POWER_CORE.segmentY + 1,
                    POWER_CORE.segmentWidth - 2,
                    POWER_CORE.segmentHeight - 2,
                    CAPTAIN_DASHBOARD_STYLE.powerCore.emptyBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);

            const fill = this.scene.add
                .rectangle(
                    x + POWER_CORE.segmentInset,
                    POWER_CORE.segmentY + POWER_CORE.segmentHeight - POWER_CORE.segmentInset,
                    POWER_CORE.segmentWidth - POWER_CORE.segmentInset * 2,
                    POWER_CORE.segmentHeight - POWER_CORE.segmentInset * 2,
                    CAPTAIN_DASHBOARD_STYLE.powerCore.chargeColor,
                    1,
                )
                .setOrigin(0, 1)
                .setVisible(false);

            this.powerCoreSegments.push({
                frame,
                track,
                fill,
            });

            this.root.add([fill, frame, track]);
        }
    }

    private updatePowerCoreSegments(current: number, rechargeProgress: number | undefined): void {
        const clampedCurrent = Phaser.Math.Clamp(current, 0, this.powerCoreSegments.length);
        const clampedRechargeProgress = Phaser.Math.Clamp(rechargeProgress ?? 0, 0, 1);

        for (let index = 0; index < this.powerCoreSegments.length; index += 1) {
            const segment = this.powerCoreSegments[index];

            if (!segment) {
                continue;
            }

            if (index < clampedCurrent) {
                segment.frame.setVisible(false);
                segment.fill
                    .setVisible(true)
                    .setScale(1, 1)
                    .setFillStyle(CAPTAIN_DASHBOARD_STYLE.powerCore.chargeColor, 1);

                continue;
            }

            if (
                index === clampedCurrent &&
                clampedCurrent < this.powerCoreSegments.length &&
                rechargeProgress !== undefined
            ) {
                segment.frame.setVisible(true);
                segment.fill
                    .setVisible(true)
                    .setScale(1, clampedRechargeProgress)
                    .setFillStyle(CAPTAIN_DASHBOARD_STYLE.powerCore.rechargeColor, 1);

                continue;
            }

            segment.frame.setVisible(true);
            segment.fill.setVisible(false).setScale(1, 1);
        }
    }

    private destroyPowerCoreSegments(): void {
        for (const segment of this.powerCoreSegments) {
            segment.fill.destroy();
            segment.track.destroy();
            segment.frame.destroy();
        }

        this.powerCoreSegments.length = 0;
    }
}
