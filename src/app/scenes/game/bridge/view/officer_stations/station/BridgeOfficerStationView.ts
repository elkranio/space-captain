// src/app/scenes/game/bridge/view/officer_stations/station/BridgeOfficerStationView.ts
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../theme/font";
import { OFFICER_ROLE_COLOR } from "../../../../../../theme/officer";
import type BridgeScene from "../../../BridgeScene";
import type { BridgeOfficerStationState } from "../../../events/bridge_event";
import type { BridgeOfficerStationLayoutEntry } from "../bridge_officer_station_layout";
import BridgeOfficerPortraitView from "./BridgeOfficerPortraitView";

const ROLE_LABEL = {
    sidePadding: 26,
    y: -72,
} as const;

const PORTRAIT_OFFSET = {
    outward: 8,
    y: 16,
} as const;

// Portrait sits behind bridge interior; role label stays above the station monitor.
export default class BridgeOfficerStationView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly portraitView: BridgeOfficerPortraitView;

    private readonly roleLabelInitial: Phaser.GameObjects.BitmapText;

    private readonly roleLabelRest: Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        layout: BridgeOfficerStationLayoutEntry,
    ) {
        this.root = this.scene.add.container(layout.position.x, layout.position.y);
        parent.add(this.root);

        this.portraitView = new BridgeOfficerPortraitView(
            this.scene,
            layout.role,
            {
                x: layout.position.x + (layout.alignRight ? PORTRAIT_OFFSET.outward : -PORTRAIT_OFFSET.outward),
                y: layout.position.y + PORTRAIT_OFFSET.y,
            },
            layout.alignRight,
        );

        const roleText = layout.role.toUpperCase();

        this.roleLabelInitial = this.scene.add
            .bitmapText(
                0,
                ROLE_LABEL.y,
                FONT_FAMILY.VGA_8X14,
                roleText.slice(0, 1),
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(OFFICER_ROLE_COLOR[layout.role]);

        this.roleLabelRest = this.scene.add
            .bitmapText(
                0,
                ROLE_LABEL.y,
                FONT_FAMILY.VGA_8X14,
                roleText.slice(1),
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.MUTED);

        const labelWidth = this.roleLabelInitial.width + this.roleLabelRest.width;
        const labelStartX = layout.alignRight
            ? layout.monitorWidth / 2 - ROLE_LABEL.sidePadding - labelWidth
            : -layout.monitorWidth / 2 + ROLE_LABEL.sidePadding;

        this.roleLabelInitial.setX(labelStartX);
        this.roleLabelRest.setX(labelStartX + this.roleLabelInitial.width);

        this.root.add([
            this.roleLabelInitial,
            this.roleLabelRest,
        ]);
    }

    public setState(state: BridgeOfficerStationState): void {
        this.portraitView.setState(state);
    }

    public destroy(): void {
        this.portraitView.destroy();
        this.roleLabelRest.destroy();
        this.roleLabelInitial.destroy();
        this.root.destroy(false);
    }
}
