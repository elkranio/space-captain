// src/app/scenes/game/overlay/view/LocalSpacePanelView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../theme/font';
import { LOCAL_SPACE_PANEL_SPRITE_ID, LOCAL_SPACE_PANEL_SPRITES } from '../../../../manifests/ui/local_space_panel';
import { UI_BUTTON_SPRITE_ID, UI_BUTTON_SPRITES } from '../../../../manifests/ui/button';
import type GameOverlayEventBus from '../events/GameOverlayEventBus';
import { GAME_OVERLAY_EVENT } from '../events/game_overlay_event';
import type GameOverlayScene from '../GameOverlayScene';

const PANEL_WIDTH = 368;

const TOP_HEIGHT = 48;
const MIDDLE_HEIGHT = 80;
const BOTTOM_HEIGHT = 44;

const PANEL_HEIGHT = TOP_HEIGHT + MIDDLE_HEIGHT + BOTTOM_HEIGHT;

const CLOSE_BUTTON_HIT_AREA_X = -8;
const CLOSE_BUTTON_HIT_AREA_Y = -9;
const CLOSE_BUTTON_HIT_AREA_WIDTH = 36;
const CLOSE_BUTTON_HIT_AREA_HEIGHT = 35;

const ROW_X = 32;
const FIRST_ROW_Y = 59;
const ROW_GAP = 24;

export type LocalSpacePanelRow = {
    objectId: string;
    label: string;
    isCurrent: boolean;
};

// Read-only LOCAL SPACE modal.
//
// Получает готовые presentation rows:
// view не знает о SpaceObjectState и не собирает названия объектов.
export default class LocalSpacePanelView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly closeButtonImage: Phaser.GameObjects.Image;
    private readonly rowTexts: Phaser.GameObjects.BitmapText[] = [];

    constructor(
        private readonly scene: GameOverlayScene,
        private readonly eventBus: GameOverlayEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.add('ui', this.root);

        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;

        const panelX = Math.floor((screenWidth - PANEL_WIDTH) / 2);
        const panelY = Math.floor((screenHeight - PANEL_HEIGHT) / 2);

        const inputBlocker = this.scene.add
            .rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.001)
            .setOrigin(0, 0)
            .setInteractive();

        const topSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.TOP];
        const middleSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.MIDDLE];
        const bottomSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.BOTTOM];

        const topImage = this.scene.add.image(panelX, panelY, topSprite.atlasKey, topSprite.frameKey).setOrigin(0, 0);

        const middleImage = this.scene.add
            .tileSprite(
                panelX,
                panelY + TOP_HEIGHT,
                PANEL_WIDTH,
                MIDDLE_HEIGHT,
                middleSprite.atlasKey,
                middleSprite.frameKey,
            )
            .setOrigin(0, 0);

        const bottomImage = this.scene.add
            .image(panelX, panelY + TOP_HEIGHT + MIDDLE_HEIGHT, bottomSprite.atlasKey, bottomSprite.frameKey)
            .setOrigin(0, 0);

        this.root.add([inputBlocker, topImage, middleImage, bottomImage]);

        const closeButtonSprite = UI_BUTTON_SPRITES[UI_BUTTON_SPRITE_ID.CLOSE_00];

        this.closeButtonImage = this.scene.add
            .image(panelX + PANEL_WIDTH - 42, panelY + 19, closeButtonSprite.atlasKey, closeButtonSprite.frameKey)
            .setOrigin(0.5)
            .setInteractive({
                hitArea: new Phaser.Geom.Rectangle(
                    CLOSE_BUTTON_HIT_AREA_X,
                    CLOSE_BUTTON_HIT_AREA_Y,
                    CLOSE_BUTTON_HIT_AREA_WIDTH,
                    CLOSE_BUTTON_HIT_AREA_HEIGHT,
                ),
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                useHandCursor: true,
            });

        this.closeButtonImage.on(Phaser.Input.Events.POINTER_UP, this.handleClosePointerUp, this);

        this.root.add(this.closeButtonImage);

        this.hide();
    }

    public show(rows: readonly LocalSpacePanelRow[]): void {
        this.renderRows(rows);

        this.root.setVisible(true);
        this.root.setActive(true);
    }

    public hide(): void {
        this.root.setVisible(false);
        this.root.setActive(false);
    }

    public destroy(): void {
        this.closeButtonImage.off(Phaser.Input.Events.POINTER_UP, this.handleClosePointerUp, this);

        this.clearRows();
        this.root.destroy(true);
    }

    private renderRows(rows: readonly LocalSpacePanelRow[]): void {
        this.clearRows();

        rows.forEach((row, index) => {
            const marker = row.isCurrent ? '> ' : '  ';
            const text = `${marker}${row.label.toUpperCase()}`;

            const rowText = this.scene.add
                .bitmapText(
                    this.getPanelX() + ROW_X,
                    this.getPanelY() + FIRST_ROW_Y + index * ROW_GAP,
                    FONT_FAMILY.VGA_8X14,
                    text,
                    FONT_SIZE.PX_16,
                )
                .setOrigin(0, 0)
                .setTint(row.isCurrent ? FONT_COLOR.LOCAL_SPACE_CURRENT_OBJECT : FONT_COLOR.LOCAL_SPACE_OBJECT);

            this.root.add(rowText);
            this.rowTexts.push(rowText);
        });
    }

    private clearRows(): void {
        for (const rowText of this.rowTexts) {
            rowText.destroy();
        }

        this.rowTexts.length = 0;
    }

    private getPanelX(): number {
        return Math.floor((this.scene.scale.width - PANEL_WIDTH) / 2);
    }

    private getPanelY(): number {
        return Math.floor((this.scene.scale.height - PANEL_HEIGHT) / 2);
    }

    private handleClosePointerUp(): void {
        this.eventBus.emit(GAME_OVERLAY_EVENT.LOCAL_SPACE_PANEL_CLOSE_CLICKED);
    }
}
