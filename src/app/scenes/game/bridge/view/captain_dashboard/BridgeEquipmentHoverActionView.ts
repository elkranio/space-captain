import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../theme/font";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_LAYOUT } from "./captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";
import BridgeEquipmentSlotChromeView from "./BridgeEquipmentSlotChromeView";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

// Shared presentation for the action shown while an equipment tile is hovered.
// The equipment tile still owns action semantics and pointer interaction.
export default class BridgeEquipmentHoverActionView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly roleText: Phaser.GameObjects.BitmapText;

    private readonly actionText: Phaser.GameObjects.BitmapText;
    private readonly headerBackground: Phaser.GameObjects.Rectangle;
    private readonly outline: BridgeEquipmentSlotChromeView;

    constructor(scene: BridgeScene, width: number, height: number) {
        this.root = scene.add.container(0, 0).setVisible(false);

        this.headerBackground = scene.add
            .rectangle(
                0,
                0,
                width,
                TILE.hoverHeaderHeight,
                FONT_COLOR.PRIMARY,
                CAPTAIN_DASHBOARD_STYLE.equipmentSlot.hoverHeaderAlpha,
            )
            .setOrigin(0, 0);

        this.outline = new BridgeEquipmentSlotChromeView(
            scene,
            width,
            height,
            "highlight",
        );

        this.roleText = scene.add
            .bitmapText(
                TILE.horizontalPadding,
                TILE.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0);

        this.actionText = scene.add
            .bitmapText(
                0,
                TILE.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        this.root.add([
            this.headerBackground,
            this.roleText,
            this.actionText,
            this.outline.getRoot(),
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setVisible(visible: boolean): void {
        this.root.setVisible(visible);
    }

    public setHighlighted(highlighted: boolean): void {
        this.headerBackground.setVisible(highlighted);
        this.outline.setVisible(highlighted);
    }

    public setAction(
        role: string,
        roleColor: number,
        action: string,
    ): void {
        this.roleText
            .setText(role)
            .setTint(roleColor);

        this.actionText
            .setText(action)
            .setX(
                TILE.horizontalPadding +
                    this.roleText.width +
                    TILE.hoverTextGap,
            );
    }
}
