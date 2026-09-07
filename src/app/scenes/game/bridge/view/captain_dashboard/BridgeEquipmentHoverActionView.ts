import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../theme/font";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_LAYOUT } from "./captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

// Shared presentation for the action shown while an equipment tile is hovered.
// The equipment tile still owns action semantics and pointer interaction.
export default class BridgeEquipmentHoverActionView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hoverBackground: Phaser.GameObjects.Rectangle;

    private readonly roleText: Phaser.GameObjects.BitmapText;

    private readonly actionText: Phaser.GameObjects.BitmapText;

    constructor(scene: BridgeScene, width: number, height: number) {
        this.root = scene.add.container(0, 0).setVisible(false);

        const actionTop = TILE.dividerY + TILE.dividerHeight;

        this.hoverBackground = scene.add
            .rectangle(
                TILE.hoverInset,
                TILE.hoverInset,
                width - TILE.hoverInset * 2,
                TILE.dividerY - TILE.hoverInset,
                CAPTAIN_DASHBOARD_STYLE.equipmentSlot.hoverFillColor,
                CAPTAIN_DASHBOARD_STYLE.equipmentSlot.hoverFillAlpha,
            )
            .setOrigin(0, 0);

        const actionBackground = scene.add
            .rectangle(
                TILE.hoverInset,
                actionTop,
                width - TILE.hoverInset * 2,
                height - actionTop - TILE.hoverInset,
                CAPTAIN_DASHBOARD_STYLE.equipmentSlot.backgroundColor,
                1,
            )
            .setOrigin(0, 0);

        this.roleText = scene.add
            .bitmapText(
                TILE.statusLeftX,
                TILE.statusY - 4,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0);

        this.actionText = scene.add
            .bitmapText(
                0,
                TILE.statusY - 4,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        this.root.add([
            this.hoverBackground,
            actionBackground,
            this.roleText,
            this.actionText,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setVisible(visible: boolean): void {
        this.root.setVisible(visible);
    }

    public setHighlighted(highlighted: boolean): void {
        this.hoverBackground.setVisible(highlighted);
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
                TILE.statusLeftX +
                    this.roleText.width +
                    TILE.hoverTextGap,
            );
    }
}
