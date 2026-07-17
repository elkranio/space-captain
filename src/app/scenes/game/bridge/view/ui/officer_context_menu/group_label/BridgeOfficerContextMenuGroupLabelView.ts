// src/app/scenes/game/bridge/view/ui/officer_context_menu/group_label/BridgeOfficerContextMenuGroupLabelView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import { OFFICER_CONTEXT_MENU_LAYOUT } from '../bridge_officer_context_menu_layout';

// Leaf-view label-а группы команд в officer context menu.
export default class BridgeOfficerContextMenuGroupLabelView {
    private readonly root: Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene: BridgeScene,
        label: string,
    ) {
        this.root = this.scene.add
            .bitmapText(
                OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.x,
                0,
                FONT_FAMILY.VGA_8X14,
                label.toUpperCase(),
                FONT_SIZE.PX_16,
            )
            .setTint(FONT_COLOR.SECONDARY);
    }

    public destroy(): void {
        this.root.destroy();
    }

    public getRoot(): Phaser.GameObjects.BitmapText {
        return this.root;
    }

    public setY(y: number): void {
        this.root.setY(y);
    }
}
