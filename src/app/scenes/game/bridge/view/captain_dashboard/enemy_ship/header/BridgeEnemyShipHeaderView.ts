import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../../../manifests/bridge/captain_dashboard";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeEnemyShipDashboardUpdatedPayload,
} from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const SHIP_NAME = "ENEMY SHIP";

const SHIP_NAME_RIGHT_PADDING = 8;

const POWER_CORE = {
    leftPadding: 12,

    segmentWidth: 11,
    segmentHeight: 18,
    segmentGap: 5,
    segmentY: 9,
    segmentInset: 2,

    iconGap: 8,
} as const;

type PowerCoreSegmentView = {
    frame: Phaser.GameObjects.Rectangle;
    track: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
};

// Mirrored top strip for the persistent enemy dashboard.
// Name is intentionally hardcoded for now; Power Core comes from the current enemy snapshot.
export default class BridgeEnemyShipHeaderView {
    private readonly root: Phaser.GameObjects.Container;

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

        const shipName = this.scene.add
            .bitmapText(
                this.width - SHIP_NAME_RIGHT_PADDING,
                centerY,
                FONT_FAMILY.VGA_8X14,
                SHIP_NAME,
                FONT_SIZE.PX_16,
            )
            .setOrigin(1, 0.5)
            .setTint(FONT_COLOR.PRIMARY);

        const powerCoreIconAsset =
            CAPTAIN_DASHBOARD_SPRITES[CAPTAIN_DASHBOARD_SPRITE_ID.POWER_CORE_ICON];

        this.powerCoreIcon = this.scene.add
            .image(
                POWER_CORE.leftPadding,
                centerY,
                powerCoreIconAsset.atlasKey,
                powerCoreIconAsset.frameKey,
            )
            .setOrigin(0, 0.5)
            .setVisible(false);

        const divider = this.scene.add
            .rectangle(
                0,
                this.height - 1,
                this.width,
                3,
                CAPTAIN_DASHBOARD_STYLE.header.dividerColor,
                1,
            )
            .setOrigin(0, 0);

        this.root.add([
            this.powerCoreIcon,
            shipName,
            divider,
        ]);
        this.root.setVisible(false);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );

        this.destroyPowerCoreSegments();
        this.root.destroy(true);
    }

    private handleDashboardUpdated(payload: BridgeEnemyShipDashboardUpdatedPayload): void {
        if (!payload) {
            this.root.setVisible(false);
            this.clearPowerCore();
            return;
        }

        this.root.setVisible(true);

        const powerCore = payload.powerCore;

        if (!powerCore) {
            this.clearPowerCore();
            return;
        }

        this.powerCoreIcon.setVisible(true);
        this.reconcilePowerCoreSegments(powerCore.max);
        this.updatePowerCoreSegments(powerCore.current, powerCore.rechargeProgress);
    }

    private clearPowerCore(): void {
        this.destroyPowerCoreSegments();
        this.powerCoreIcon
            .setVisible(false)
            .setPosition(POWER_CORE.leftPadding, this.height / 2);
    }

    private reconcilePowerCoreSegments(max: number): void {
        if (this.powerCoreSegments.length === max) {
            return;
        }

        this.destroyPowerCoreSegments();

        if (max <= 0) {
            this.powerCoreIcon.setPosition(POWER_CORE.leftPadding, this.height / 2);
            return;
        }

        const segmentsX =
            POWER_CORE.leftPadding +
            this.powerCoreIcon.width +
            POWER_CORE.iconGap;

        for (let index = 0; index < max; index += 1) {
            const x = segmentsX + index * (POWER_CORE.segmentWidth + POWER_CORE.segmentGap);

            const frame = this.scene.add
                .rectangle(
                    x,
                    POWER_CORE.segmentY,
                    POWER_CORE.segmentWidth,
                    POWER_CORE.segmentHeight,
                    CAPTAIN_DASHBOARD_STYLE.powerCore.emptyBorderColor,
                    1,
                )
                .setOrigin(0, 0);

            const track = this.scene.add
                .rectangle(
                    x + 1,
                    POWER_CORE.segmentY + 1,
                    POWER_CORE.segmentWidth - 2,
                    POWER_CORE.segmentHeight - 2,
                    CAPTAIN_DASHBOARD_STYLE.powerCore.emptyBackgroundColor,
                    1,
                )
                .setOrigin(0, 0);

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

            this.root.add([
                frame,
                track,
                fill,
            ]);
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
                segment.fill
                    .setVisible(true)
                    .setScale(1, clampedRechargeProgress)
                    .setFillStyle(CAPTAIN_DASHBOARD_STYLE.powerCore.rechargeColor, 1);

                continue;
            }

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
