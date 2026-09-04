import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../theme/font";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_LAYOUT } from "./captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";
import BridgeHeaderTargetView from "./BridgeHeaderTargetView";
import BridgeHullStatusView from "./BridgeHullStatusView";
import BridgePowerCoreStatusView from "./BridgePowerCoreStatusView";

const HEADER = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard.header;
const OFFICER_STATUS_LABELS = ["P", "E", "G", "S"] as const;
const HULL_TARGET_RIGHT_PADDING = 16;
const BRIDGE_TARGET_LEFT_PADDING = 14;

type BridgeShipDashboardHeaderTargetCallbacks = {
    onHullTargetSelected?: () => void;
    onBridgeTargetSelected?: () => void;
};

// Shared HULL / Power Core / officer status / divider presentation for both ship dashboards.
// Player and enemy wrappers keep their own event mapping and visibility policy.
export default class BridgeShipDashboardHeaderView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hullView: BridgeHullStatusView;

    private readonly powerCoreView: BridgePowerCoreStatusView;

    private readonly officerStatusRoot: Phaser.GameObjects.Container;

    private readonly divider: Phaser.GameObjects.Rectangle;

    private readonly hullTargetView: BridgeHeaderTargetView;

    private readonly bridgeTargetView: BridgeHeaderTargetView;

    constructor(
        scene: BridgeScene,
        private readonly width: number,
        private readonly height: number,
        targetCallbacks: BridgeShipDashboardHeaderTargetCallbacks = {},
    ) {
        this.root = scene.add.container(0, 0);

        this.hullView = new BridgeHullStatusView(scene, height);
        this.hullView.setPosition(HEADER.hullX, 0);

        this.powerCoreView = new BridgePowerCoreStatusView(scene, height);
        this.layoutPowerCore();

        this.officerStatusRoot = scene.add.container(0, 0);
        let officerStatusWidth = 0;

        for (const label of OFFICER_STATUS_LABELS) {
            const text = scene.add
                .bitmapText(
                    officerStatusWidth,
                    height / 2,
                    FONT_FAMILY.UI_PRIMARY,
                    label,
                    FONT_SIZE.PX_20,
                )
                .setOrigin(0, 0.5)
                .setTint(FONT_COLOR.WHITE);

            this.officerStatusRoot.add(text);
            officerStatusWidth += text.width + HEADER.officerStatusLetterGap;
        }

        officerStatusWidth -= HEADER.officerStatusLetterGap;
        this.officerStatusRoot.setX(
            width - HEADER.officerStatusRightPadding - officerStatusWidth,
        );

        this.divider = scene.add
            .rectangle(
                0,
                height - 1,
                width,
                3,
                CAPTAIN_DASHBOARD_STYLE.header.dividerColor,
                1,
            )
            .setOrigin(0, 0);

        this.hullTargetView = new BridgeHeaderTargetView(
            scene,
            "left",
            targetCallbacks.onHullTargetSelected,
        );
        this.bridgeTargetView = new BridgeHeaderTargetView(
            scene,
            "right",
            targetCallbacks.onBridgeTargetSelected,
        );
        this.layoutTargetViews();

        this.root.add([
            this.hullView.getRoot(),
            this.powerCoreView.getRoot(),
            this.officerStatusRoot,
            this.divider,
            this.hullTargetView.getRoot(),
            this.bridgeTargetView.getRoot(),
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setVisible(visible: boolean): void {
        this.root.setVisible(visible);
    }

    public setHull(current: number, max: number): void {
        this.hullView.update(current, max);
        this.layoutPowerCore();
        this.layoutTargetViews();
    }

    public clearHull(): void {
        this.hullView.clear();
        this.layoutPowerCore();
        this.layoutTargetViews();
    }

    public setPowerCoreVisible(visible: boolean): void {
        this.powerCoreView.setVisible(visible);
    }

    public setPowerCore(
        current: number,
        max: number,
        rechargeProgress?: number,
    ): void {
        this.powerCoreView.update(current, max, rechargeProgress);
    }

    public clearPowerCore(): void {
        this.powerCoreView.clear();
    }

    public setTargetSelectionEnabled(enabled: boolean): void {
        this.hullTargetView.setSelectionEnabled(enabled);
        this.bridgeTargetView.setSelectionEnabled(enabled);
    }

    public setTargetPulse(alpha: number): void {
        this.hullTargetView.setPulseAlpha(alpha);
        this.bridgeTargetView.setPulseAlpha(alpha);
    }

    public setHullTargetLocked(locked: boolean): void {
        this.hullTargetView.setTargetLocked(locked);
    }

    public setBridgeTargetLocked(locked: boolean): void {
        this.bridgeTargetView.setTargetLocked(locked);
    }

    public destroy(): void {
        this.hullView.destroy();
        this.powerCoreView.destroy();
        this.officerStatusRoot.destroy(true);
        this.divider.destroy();
        this.hullTargetView.destroy();
        this.bridgeTargetView.destroy();
        this.root.destroy(false);
    }

    private layoutPowerCore(): void {
        this.powerCoreView.setPosition(
            HEADER.hullX + this.hullView.getWidth() + HEADER.hullPowerCoreGap,
            0,
        );
    }

    private layoutTargetViews(): void {
        const hullWidth =
            HEADER.hullX + this.hullView.getWidth() + HULL_TARGET_RIGHT_PADDING;
        this.hullTargetView.setBounds(0, 0, hullWidth, this.height);

        const bridgeX = Math.max(
            0,
            this.officerStatusRoot.x - BRIDGE_TARGET_LEFT_PADDING,
        );
        this.bridgeTargetView.setBounds(
            bridgeX,
            0,
            this.width - bridgeX,
            this.height,
        );
    }
}
