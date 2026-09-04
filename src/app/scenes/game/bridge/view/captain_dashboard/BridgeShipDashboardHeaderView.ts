import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../theme/font";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_LAYOUT } from "./captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";
import BridgeHullStatusView from "./BridgeHullStatusView";
import BridgePowerCoreStatusView from "./BridgePowerCoreStatusView";

const HEADER = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard.header;
const OFFICER_STATUS_LABELS = ["P", "E", "G", "S"] as const;

// Shared HULL / Power Core / officer status / divider presentation for both ship dashboards.
// Player and enemy wrappers keep their own event mapping and visibility policy.
export default class BridgeShipDashboardHeaderView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hullView: BridgeHullStatusView;

    private readonly powerCoreView: BridgePowerCoreStatusView;

    private readonly officerStatusRoot: Phaser.GameObjects.Container;

    private readonly divider: Phaser.GameObjects.Rectangle;

    constructor(scene: BridgeScene, width: number, height: number) {
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

        this.root.add([
            this.hullView.getRoot(),
            this.powerCoreView.getRoot(),
            this.officerStatusRoot,
            this.divider,
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
    }

    public clearHull(): void {
        this.hullView.clear();
        this.layoutPowerCore();
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

    public destroy(): void {
        this.hullView.destroy();
        this.powerCoreView.destroy();
        this.officerStatusRoot.destroy(true);
        this.divider.destroy();
        this.root.destroy(false);
    }

    private layoutPowerCore(): void {
        this.powerCoreView.setPosition(
            HEADER.hullX + this.hullView.getWidth() + HEADER.hullPowerCoreGap,
            0,
        );
    }
}
