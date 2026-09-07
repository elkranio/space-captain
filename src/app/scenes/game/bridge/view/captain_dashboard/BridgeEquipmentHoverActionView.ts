import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../theme/font";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_LAYOUT } from "./captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

// Shared presentation for the action shown while an equipment tile is hovered.
// The equipment tile still owns action semantics and pointer interaction.
export default class BridgeEquipmentHoverActionView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hoverBackground: Phaser.GameObjects.Graphics;

    private readonly roleText: Phaser.GameObjects.BitmapText;

    private readonly actionText: Phaser.GameObjects.BitmapText;

    constructor(scene: BridgeScene, width: number, height: number) {
        this.root = scene.add.container(0, 0).setVisible(false);

        const style = CAPTAIN_DASHBOARD_STYLE.equipmentSlot;
        const actionTop = TILE.dividerY + TILE.dividerHeight;
        const inset = TILE.hoverInset;
        const bottom = height - inset;
        const right = width - inset;
        const cut = Math.min(
            style.cornerCut,
            Math.floor((width - inset * 2) / 2),
            Math.floor((height - inset * 2) / 2),
        );

        this.hoverBackground = scene.add.graphics();
        this.hoverBackground
            .fillStyle(style.hoverFillColor, style.hoverFillAlpha)
            .beginPath()
            .moveTo(inset + cut, inset)
            .lineTo(right - cut, inset)
            .lineTo(right, inset + cut)
            .lineTo(right, actionTop)
            .lineTo(inset, actionTop)
            .lineTo(inset, inset + cut)
            .closePath()
            .fillPath();

        const actionBackground = scene.add.graphics();
        actionBackground
            .fillStyle(style.backgroundColor, 1)
            .beginPath()
            .moveTo(inset, actionTop)
            .lineTo(right, actionTop)
            .lineTo(right, bottom - cut)
            .lineTo(right - cut, bottom)
            .lineTo(inset + cut, bottom)
            .lineTo(inset, bottom - cut)
            .closePath()
            .fillPath();

        const actionCenterY = Math.round((actionTop + bottom) / 2);

        this.roleText = scene.add
            .bitmapText(
                TILE.horizontalPadding,
                actionCenterY,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0.5);

        this.actionText = scene.add
            .bitmapText(
                0,
                actionCenterY,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0.5)
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
                TILE.horizontalPadding +
                    this.roleText.width +
                    TILE.hoverTextGap,
            );
    }
}
