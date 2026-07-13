// src/app/scenes/game/bridge/view/ui/officer_context_menu/BridgeOfficerContextMenuPanelView.ts

import {
    OFFICER_CONTEXT_MENU_SPRITE_ID,
    OFFICER_CONTEXT_MENU_SPRITES,
    type OfficerContextMenuSpriteId,
} from '../../../../../../manifests/bridge/officer_context_menu';
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import { OFFICER_CONTEXT_MENU_LAYOUT } from './bridge_officer_context_menu_layout';

export default class BridgeOfficerContextMenuPanelView {
    private readonly root: Phaser.GameObjects.Container;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public render(title: string, minHeight: number): number {
        this.root.removeAll(true);

        const top = this.createImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_TOP, 0, 0);

        const middleProbe = this.createImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_MIDDLE, 0, 0);

        const bottomProbe = this.createImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_BOTTOM, 0, 0);

        const topHeight = top.height;
        const middleHeight = middleProbe.height;
        const bottomHeight = bottomProbe.height;

        middleProbe.destroy();
        bottomProbe.destroy();

        const middleAreaHeight = Math.max(middleHeight, minHeight - topHeight - bottomHeight);

        const middleCount = Math.max(1, Math.ceil(middleAreaHeight / middleHeight));

        this.root.add(top);

        for (let index = 0; index < middleCount; index += 1) {
            const middle = this.createImage(
                OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_MIDDLE,
                0,
                topHeight + index * middleHeight,
            );

            this.root.add(middle);
        }

        const bottomY = topHeight + middleCount * middleHeight;

        const bottom = this.createImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_BOTTOM, 0, bottomY);

        this.root.add(bottom);

        const label = this.scene.add
            .bitmapText(
                OFFICER_CONTEXT_MENU_LAYOUT.header.labelCenterX,
                OFFICER_CONTEXT_MENU_LAYOUT.header.labelCenterY,
                FONT_FAMILY.PIXEL_OPERATOR,
                title,
                FONT_SIZE.PX_18,
            )
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.PRIMARY);

        this.root.add(label);

        return bottomY + bottomHeight;
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private createImage(spriteId: OfficerContextMenuSpriteId, x: number, y: number): Phaser.GameObjects.Image {
        const sprite = OFFICER_CONTEXT_MENU_SPRITES[spriteId];

        return this.scene.add.image(x, y, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);
    }
}
