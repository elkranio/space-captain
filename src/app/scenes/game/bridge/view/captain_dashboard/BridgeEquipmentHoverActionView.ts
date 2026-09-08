import { FONT_COLOR, FONT_SIZE, WEB_FONT_FAMILY } from "../../../../../theme/font";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_LAYOUT } from "./captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;
const ACTION_TEXT_OFFSET_X = 5;
const ACTION_TEXT_OFFSET_Y = -1;

function toCssColor(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
}

// Shared presentation for the action shown while an equipment tile is hovered.
// The equipment tile still owns action semantics and pointer interaction.
export default class BridgeEquipmentHoverActionView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hoverBackground: Phaser.GameObjects.Graphics;

    private readonly roleText: Phaser.GameObjects.Text;

    private readonly actionText: Phaser.GameObjects.Text;

    constructor(scene: BridgeScene, width: number, height: number) {
        this.root = scene.add.container(0, 0).setVisible(false);

        const style = CAPTAIN_DASHBOARD_STYLE.equipmentSlot;
        const actionTop = TILE.dividerY + TILE.dividerHeight;
        const inset = TILE.hoverInset;
        const bottom = height - inset;
        const right = width - inset;
        const actionLeft = TILE.horizontalPadding;
        const actionRight = width - TILE.horizontalPadding;
        const actionBottom = bottom - 3;
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
            .fillStyle(style.actionBackgroundColor, 1)
            .beginPath()
            .moveTo(actionLeft, actionTop)
            .lineTo(actionRight, actionTop)
            .lineTo(actionRight, actionBottom - cut)
            .lineTo(actionRight - cut, actionBottom)
            .lineTo(actionLeft + cut, actionBottom)
            .lineTo(actionLeft, actionBottom - cut)
            .closePath()
            .fillPath();

        const actionCenterY = Math.round((actionTop + bottom) / 2) + ACTION_TEXT_OFFSET_Y;
        const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: WEB_FONT_FAMILY.UI_PRIMARY,
            fontSize: `${FONT_SIZE.PX_20}px`,
            color: toCssColor(FONT_COLOR.PRIMARY),
        };

        this.roleText = scene.add
            .text(
                TILE.horizontalPadding + ACTION_TEXT_OFFSET_X,
                actionCenterY,
                "",
                textStyle,
            )
            .setOrigin(0, 0.5);

        this.actionText = scene.add
            .text(0, actionCenterY, "", textStyle)
            .setOrigin(0, 0.5);

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
            .setColor(toCssColor(roleColor));

        this.actionText
            .setText(action)
            .setX(
                TILE.horizontalPadding +
                    ACTION_TEXT_OFFSET_X +
                    this.roleText.width +
                    TILE.hoverTextGap,
            );
    }
}
