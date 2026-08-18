// src/app/scenes/game/bridge/view/ui/officer_context_menu/panel/BridgeOfficerContextMenuPanelView.ts

import {
    OFFICER_CONTEXT_MENU_SPRITE_ID,
    OFFICER_CONTEXT_MENU_SPRITES,
    type OfficerContextMenuSpriteId,
} from "../../../../../../../manifests/bridge/officer_context_menu";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import { OFFICER_CONTEXT_MENU_LAYOUT } from "../bridge_officer_context_menu_layout";

type OfficerContextMenuPanelMetrics = {
    topHeight: number;
    middleHeight: number;
    bottomHeight: number;
};

// View panel-frame officer context menu.
// Собирает stretchable panel из top/middle/bottom pieces и рисует title.
export default class BridgeOfficerContextMenuPanelView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly metrics: OfficerContextMenuPanelMetrics;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.metrics = this.createPanelMetrics();
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public render(title: string, minHeight: number): void {
        this.clear();

        const middleCount = this.getMiddleCount(minHeight);

        this.renderPanelPieces(middleCount);
        this.renderTitle(title);
    }

    private renderPanelPieces(middleCount: number): void {
        const top = this.createPanelImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_TOP, 0, 0);

        this.root.add(top);

        for (let index = 0; index < middleCount; index += 1) {
            const middle = this.createPanelImage(
                OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_MIDDLE,
                0,
                this.metrics.topHeight + index * this.metrics.middleHeight,
            );

            this.root.add(middle);
        }

        const bottomY = this.metrics.topHeight + middleCount * this.metrics.middleHeight;
        const bottom = this.createPanelImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_BOTTOM, 0, bottomY);

        this.root.add(bottom);
    }

    private renderTitle(title: string): void {
        const label = this.scene.add
            .bitmapText(
                OFFICER_CONTEXT_MENU_LAYOUT.header.labelCenterX,
                OFFICER_CONTEXT_MENU_LAYOUT.header.labelCenterY,
                FONT_FAMILY.VGA_8X14,
                title,
                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.PRIMARY);

        this.root.add(label);
    }

    private clear(): void {
        this.root.removeAll(true);
    }

    private createPanelMetrics(): OfficerContextMenuPanelMetrics {
        const topProbe = this.createImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_TOP, 0, 0);
        const middleProbe = this.createImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_MIDDLE, 0, 0);
        const bottomProbe = this.createImage(OFFICER_CONTEXT_MENU_SPRITE_ID.PANEL_BOTTOM, 0, 0);

        const metrics = {
            topHeight: topProbe.height,
            middleHeight: middleProbe.height,
            bottomHeight: bottomProbe.height,
        };

        topProbe.destroy();
        middleProbe.destroy();
        bottomProbe.destroy();

        return metrics;
    }

    private getMiddleCount(minHeight: number): number {
        const middleAreaHeight = Math.max(
            this.metrics.middleHeight,
            minHeight - this.metrics.topHeight - this.metrics.bottomHeight,
        );

        return Math.max(1, Math.ceil(middleAreaHeight / this.metrics.middleHeight));
    }

    private createPanelImage(spriteId: OfficerContextMenuSpriteId, x: number, y: number): Phaser.GameObjects.Image {
        return this.createImage(spriteId, x, y).setInteractive();
    }

    private createImage(spriteId: OfficerContextMenuSpriteId, x: number, y: number): Phaser.GameObjects.Image {
        const sprite = OFFICER_CONTEXT_MENU_SPRITES[spriteId];

        return this.scene.add.image(x, y, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);
    }
}
