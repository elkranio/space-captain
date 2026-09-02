// src/app/scenes/game/bridge/view/officer_stations/station/BridgeOfficerStationView.ts
import { BRIDGE_SEATED_OFFICER_SPRITES } from "../../../../../../manifests/bridge/seated_officer";
import {
    UI_OFFICER_MONITOR_SPRITE_ID,
    UI_OFFICER_MONITOR_SPRITES,
} from "../../../../../../manifests/ui/officer_monitor";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../theme/font";
import { OFFICER_ROLE_COLOR } from "../../../../../../theme/officer";
import type BridgeScene from "../../../BridgeScene";
import type { BridgeOfficerStationLayoutEntry } from "../bridge_officer_station_layout";

const ROLE_LABEL = {
    sidePadding: 26,
    y: -72,
} as const;

// One bridge officer monitor. The portrait is bottom-aligned behind a transparent physical frame.
export default class BridgeOfficerStationView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly officerImage: Phaser.GameObjects.Image;

    private readonly frameImage: Phaser.GameObjects.Image;

    private readonly roleLabelInitial: Phaser.GameObjects.BitmapText;

    private readonly roleLabelRest: Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        layout: BridgeOfficerStationLayoutEntry,
    ) {
        this.root = this.scene.add.container(layout.position.x, layout.position.y);
        parent.add(this.root);

        const officerAsset = BRIDGE_SEATED_OFFICER_SPRITES[layout.seatedOfficerSpriteId];
        const frameAsset = UI_OFFICER_MONITOR_SPRITES[UI_OFFICER_MONITOR_SPRITE_ID.FRAME];

        this.officerImage = this.scene.add
            .image(0, layout.hitArea.height / 2, officerAsset.atlasKey, officerAsset.frameKey)
            .setOrigin(0.5, 1)
            .setFlipX(layout.flipX);

        this.frameImage = this.scene.add
            .image(0, 0, frameAsset.atlasKey, frameAsset.frameKey)
            .setOrigin(0.5, 0.5)
            .setFlipX(layout.flipX);

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
        const labelStartX = layout.flipX
            ? layout.hitArea.width / 2 - ROLE_LABEL.sidePadding - labelWidth
            : -layout.hitArea.width / 2 + ROLE_LABEL.sidePadding;

        this.roleLabelInitial.setX(labelStartX);
        this.roleLabelRest.setX(labelStartX + this.roleLabelInitial.width);

        this.root.add([
            this.officerImage,
            this.frameImage,
            this.roleLabelInitial,
            this.roleLabelRest,
        ]);
    }

    public destroy(): void {
        this.roleLabelRest.destroy();
        this.roleLabelInitial.destroy();
        this.frameImage.destroy();
        this.officerImage.destroy();
        this.root.destroy(false);
    }

}
