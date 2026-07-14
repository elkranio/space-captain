// src/app/scenes/game/bridge/view/ui/officer_context_menu/BridgeOfficerContextMenuItemView.ts

import {
    OFFICER_CONTEXT_MENU_SPRITE_ID,
    OFFICER_CONTEXT_MENU_SPRITES,
} from '../../../../../../manifests/bridge/officer_context_menu';
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import type { BridgeOfficerCommandMenuItemViewState } from '../../../events/bridge_event';
import { UI_EVENT } from '../ui_event';
import { OFFICER_CONTEXT_MENU_LAYOUT } from './bridge_officer_context_menu_layout';

export default class BridgeOfficerContextMenuItemView {
    // #region Fields

    private readonly root: Phaser.GameObjects.Container;
    private readonly hoverBackground: Phaser.GameObjects.Image;

    // #endregion

    // #region Lifecycle

    constructor(
        private readonly scene: BridgeScene,
        private readonly item: BridgeOfficerCommandMenuItemViewState,
    ) {
        this.root = this.scene.add.container(0, 0);

        const normalBackground = this.createNormalBackground();
        this.hoverBackground = this.createHoverBackground();

        const text = this.createText();

        this.root.add([normalBackground, this.hoverBackground, text]);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    // #endregion

    // #region Public API

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    // #endregion

    // #region Rendering

    private createNormalBackground(): Phaser.GameObjects.Image {
        const sprite = OFFICER_CONTEXT_MENU_SPRITES[OFFICER_CONTEXT_MENU_SPRITE_ID.COMMAND_ROW];

        const background = this.scene.add.image(0, 0, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);

        this.makeInteractive(background);

        return background;
    }

    private createHoverBackground(): Phaser.GameObjects.Image {
        const sprite = OFFICER_CONTEXT_MENU_SPRITES[OFFICER_CONTEXT_MENU_SPRITE_ID.COMMAND_ROW_HOVER];

        return this.scene.add.image(0, 0, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0).setVisible(false);
    }

    private createText(): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(
                OFFICER_CONTEXT_MENU_LAYOUT.item.labelX,
                OFFICER_CONTEXT_MENU_LAYOUT.item.labelY,
                FONT_FAMILY.VGA_8X14,
                `> ${this.item.label}`,
                FONT_SIZE.PX_16,
            )
            .setTint(FONT_COLOR.WHITE);
    }

    // #endregion

    // #region Input

    private makeInteractive(background: Phaser.GameObjects.Image): void {
        background.setInteractive(
            new Phaser.Geom.Rectangle(
                0,
                0,
                OFFICER_CONTEXT_MENU_LAYOUT.item.width,
                OFFICER_CONTEXT_MENU_LAYOUT.item.height,
            ),
            Phaser.Geom.Rectangle.Contains,
        );

        background.on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this);

        background.on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);

        background.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    }

    private handlePointerOver(): void {
        this.hoverBackground.setVisible(true);
    }

    private handlePointerOut(): void {
        this.hoverBackground.setVisible(false);
    }

    private handlePointerDown(): void {
        this.root.emit(UI_EVENT.CLICK, this.item);
    }

    // #endregion
}
