// src/app/scenes/game/bridge/view/ui/officer_context_menu/BridgeOfficerContextMenuItemView.ts

import {
    OFFICER_CONTEXT_MENU_SPRITE_ID,
    OFFICER_CONTEXT_MENU_SPRITES,
} from '../../../../../../manifests/bridge/officer_context_menu';
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import { OFFICER_CONTEXT_MENU_LAYOUT } from './bridge_officer_context_menu_layout';

export default class BridgeOfficerContextMenuItemView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly hoverBackground: Phaser.GameObjects.Image;

    constructor(
        private readonly scene: BridgeScene,
        label: string,
    ) {
        this.root = this.scene.add.container(0, 0);

        const normalSprite = OFFICER_CONTEXT_MENU_SPRITES[OFFICER_CONTEXT_MENU_SPRITE_ID.COMMAND_ROW];

        const hoverSprite = OFFICER_CONTEXT_MENU_SPRITES[OFFICER_CONTEXT_MENU_SPRITE_ID.COMMAND_ROW_HOVER];

        const normalBackground = this.scene.add
            .image(0, 0, normalSprite.atlasKey, normalSprite.frameKey)
            .setOrigin(0, 0);

        this.hoverBackground = this.scene.add
            .image(0, 0, hoverSprite.atlasKey, hoverSprite.frameKey)
            .setOrigin(0, 0)
            .setVisible(false);

        const text = this.scene.add
            .bitmapText(
                OFFICER_CONTEXT_MENU_LAYOUT.item.labelX,
                OFFICER_CONTEXT_MENU_LAYOUT.item.labelY,
                FONT_FAMILY.VGA_8X14,
                `> ${label.toUpperCase()}`,
                FONT_SIZE.PX_16,
            )
            .setTint(FONT_COLOR.WHITE);

        const hitZone = this.scene.add
            .zone(0, 0, OFFICER_CONTEXT_MENU_LAYOUT.item.width, OFFICER_CONTEXT_MENU_LAYOUT.item.height)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        hitZone.on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this);
        hitZone.on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);

        this.root.add([normalBackground, this.hoverBackground, text, hitZone]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private handlePointerOver(): void {
        this.hoverBackground.setVisible(true);
    }

    private handlePointerOut(): void {
        this.hoverBackground.setVisible(false);
    }
}
